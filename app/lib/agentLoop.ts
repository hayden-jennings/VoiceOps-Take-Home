import Anthropic from "@anthropic-ai/sdk";
import { getSystemPrompt, OpenDashboard } from "@/lib/systemPrompt";
import { TOOL_SCHEMAS, callTool, toolStatusLabel } from "@/lib/tools";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001";
const MAX_TOOL_ROUNDS = 6;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type AgentEvent =
  | { type: "tool_status"; label: string }
  | { type: "text"; text: string }
  | { type: "image"; url: string; alt: string }
  | {
      type: "dashboard";
      instanceId: number;
      view: string;
      title: string;
      params: Record<string, unknown>;
    }
  | { type: "error"; message: string }
  | { type: "done" };

export async function* runAgentLoop(
  history: ChatMessage[],
  openDashboards: OpenDashboard[] = []
): AsyncGenerator<AgentEvent> {
  const messages: Anthropic.Messages.MessageParam[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const systemPrompt = getSystemPrompt(openDashboards);

  try {
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const toolsAllowed = round < MAX_TOOL_ROUNDS;

      const stream = client.messages.stream({
        model: MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages,
        ...(toolsAllowed
          ? { tools: TOOL_SCHEMAS, tool_choice: { type: "auto" as const } }
          : { tool_choice: { type: "none" as const } }),
      });

      // Stream text live only when the round's first content block is text —
      // that's the terminal-answer shape. A round that opens with tool_use
      // (the expected shape whenever tools are called, per the system prompt)
      // is never forwarded, preserving the no-visible-planning guarantee.
      let firstBlockIsText = false;
      let sawFirstBlock = false;

      for await (const event of stream) {
        if (event.type === "content_block_start") {
          if (!sawFirstBlock) {
            firstBlockIsText = event.content_block.type === "text";
            sawFirstBlock = true;
          }
        } else if (
          firstBlockIsText &&
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          yield { type: "text", text: event.delta.text };
        }
      }

      const response = await stream.finalMessage();

      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );

      if (toolUseBlocks.length === 0) {
        yield { type: "done" };
        return;
      }

      messages.push({ role: "assistant", content: response.content });

      for (const block of toolUseBlocks) {
        yield { type: "tool_status", label: toolStatusLabel(block.name) };
      }

      const toolResults = await Promise.all(
        toolUseBlocks.map(async (block) => ({
          block,
          result: await callTool(
            block.name,
            block.input as Record<string, unknown>
          ),
        }))
      );

      for (const { block, result } of toolResults) {
        if (block.name === "generate_chart" && result.ok) {
          const chart = result.data as { url: string; title: string };
          yield { type: "image", url: chart.url, alt: chart.title };
        } else if (block.name === "show_dashboard" && result.ok) {
          const dash = result.data as {
            instanceId: number;
            view: string;
            title: string;
            params: Record<string, unknown>;
          };
          yield {
            type: "dashboard",
            instanceId: dash.instanceId,
            view: dash.view,
            title: dash.title,
            params: dash.params,
          };
        }
      }

      messages.push({
        role: "user",
        content: toolResults.map(({ block, result }) => ({
          type: "tool_result" as const,
          tool_use_id: block.id,
          content: JSON.stringify(result),
        })),
      });
    }
  } catch (err) {
    yield { type: "error", message: (err as Error).message };
    yield { type: "done" };
  }
}
