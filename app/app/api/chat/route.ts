import { runAgentLoop, ChatMessage } from "@/lib/agentLoop";

function iteratorToNdjsonStream(
  iterator: AsyncGenerator<unknown>
): ReadableStream {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next();
      if (done) {
        controller.close();
      } else {
        controller.enqueue(encoder.encode(JSON.stringify(value) + "\n"));
      }
    },
  });
}

export async function POST(request: Request) {
  const { messages }: { messages: ChatMessage[] } = await request.json();
  const stream = iteratorToNdjsonStream(runAgentLoop(messages));
  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson" },
  });
}
