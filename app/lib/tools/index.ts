import Anthropic from "@anthropic-ai/sdk";
import { listReps } from "./listReps";
import { getRepPerformance } from "./getRepPerformance";
import { searchTranscripts } from "./searchTranscripts";
import { getCompetitiveIntelligence } from "./getCompetitiveIntelligence";
import { getObjectionHandlingStats } from "./getObjectionHandlingStats";
import { listCalls } from "./listCalls";
import { getCallDetail } from "./getCallDetail";
import { runReadonlySql } from "./runReadonlySql";
import { generateChart } from "./generateChart";
import { ToolResult } from "@/lib/types";

const dateProps = {
  dateFrom: { type: "string", description: "ISO date, inclusive lower bound on when the call occurred" },
  dateTo: { type: "string", description: "ISO date, inclusive upper bound on when the call occurred" },
};

export const TOOL_SCHEMAS: Anthropic.Tool[] = [
  {
    name: "list_reps",
    description: "List all reps with their supervisor and department.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_rep_performance",
    description:
      "Call counts, disposition breakdown, and coaching skill-score breakdown for a rep. Omit repName for all reps.",
    input_schema: {
      type: "object",
      properties: {
        repName: { type: "string", description: "Rep name, partial match" },
        ...dateProps,
      },
    },
  },
  {
    name: "search_transcripts",
    description:
      "Search actual transcript lines for a keyword or phrase (e.g. a competitor name). Use this to get verbatim color, not just aggregate stats.",
    input_schema: {
      type: "object",
      properties: {
        keyword: { type: "string", description: "Exact phrase to search for" },
        repName: { type: "string" },
        ...dateProps,
        limit: { type: "number", description: "Max results, default 20" },
      },
      required: ["keyword"],
    },
  },
  {
    name: "get_competitive_intelligence",
    description:
      "Aggregate competitive stats: mention counts, price comparisons, and customer reaction breakdown, optionally for one competitor.",
    input_schema: {
      type: "object",
      properties: {
        competitor: { type: "string" },
        ...dateProps,
      },
    },
  },
  {
    name: "get_objection_handling_stats",
    description:
      "Aggregate objection stats: how often each objection type comes up, how reps responded, and the outcome.",
    input_schema: {
      type: "object",
      properties: {
        objectionType: {
          type: "string",
          enum: ["PRICE", "COVERAGE", "TRUST", "TIMING", "NONE"],
        },
        repName: { type: "string" },
        ...dateProps,
      },
    },
  },
  {
    name: "list_calls",
    description:
      "Find calls matching filters — rep, disposition, competitor mentioned, objection outcome, or a keyword in the call summary (e.g. 'renewal'). Returns call summaries, not full transcripts.",
    input_schema: {
      type: "object",
      properties: {
        repName: { type: "string" },
        disposition: {
          type: "string",
          description: "e.g. Sale, Follow Up, No Sale, Voicemail, Transfer",
        },
        competitor: { type: "string" },
        objectionOutcome: {
          type: "string",
          enum: ["CLOSED", "PROGRESSING", "LOST"],
        },
        summaryContains: { type: "string" },
        ...dateProps,
        limit: { type: "number", description: "Max results, default 20" },
      },
    },
  },
  {
    name: "get_call_detail",
    description:
      "Full detail for one specific call: transcript, metadata, coaching skill scores, and extraction data. Use after list_calls or search_transcripts to drill into a specific call.",
    input_schema: {
      type: "object",
      properties: {
        callId: { type: "number" },
      },
      required: ["callId"],
    },
  },
  {
    name: "run_readonly_sql",
    description:
      "Last resort. Run a single read-only SQL SELECT statement directly against the database — only use this if none of the other tools can answer the question. " +
      "Schema: calls(id, org_id, integration_person_id, occurred_at, length_seconds, summary, state, customer_name), " +
      "integration_persons(id, first_name, last_name, email, latest_supervisor, department), " +
      "utterances(id, call_id, content, is_rep, start_time, end_time), " +
      "call_metadata(call_id, key, string_value, number_value, boolean_value) [key in 'direction','contact_state','disposition'], " +
      "coaching_skills(id, title, description, weight), " +
      "comment_suggestions(id, call_id, skill_id, class, comment) [class in GOOD, NEEDS_IMPROVEMENT, CRITICAL], " +
      "insight_raw_extractions(id, call_id, extracted_data jsonb) [paths: competitive_landscape.{competitor_name,competitor_price,our_price,price_gap,customer_price_reaction}, objection_handling.{objection_type,rep_response,outcome_after_objection}]. " +
      "Only SELECT/WITH statements are allowed; results are capped at 200 rows.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string" },
      },
      required: ["query"],
    },
  },
  {
    name: "generate_chart",
    description:
      "Generate a single styled chart image, shown inline in the chat. Use for a one-off visual to illustrate an answer (a trend, a comparison, a breakdown) — not for a dashboard the user will revisit. " +
      "Pick the type by the job: 'bar' to compare magnitude across categories, 'line' for a trend over time, 'stacked_bar' for part-to-whole (e.g. a mix of dispositions) — never request a pie chart, it isn't supported.",
    input_schema: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["bar", "line", "stacked_bar"] },
        title: { type: "string" },
        labels: {
          type: "array",
          items: { type: "string" },
          description: "Category or time-period labels",
        },
        series: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              data: { type: "array", items: { type: "number" } },
            },
            required: ["name", "data"],
          },
          description: "One entry per series. Most charts need just one.",
        },
      },
      required: ["type", "title", "labels", "series"],
    },
  },
];

export const TOOL_STATUS_LABELS: Record<string, string> = {
  list_reps: "Looking up your reps...",
  get_rep_performance: "Pulling performance data...",
  search_transcripts: "Searching call transcripts...",
  get_competitive_intelligence: "Checking competitive intelligence...",
  get_objection_handling_stats: "Reviewing objection handling...",
  list_calls: "Finding matching calls...",
  get_call_detail: "Pulling up that call...",
  run_readonly_sql: "Running a custom query...",
  generate_chart: "Building a chart...",
};

export function toolStatusLabel(name: string): string {
  return TOOL_STATUS_LABELS[name] ?? "Working...";
}

type ToolInput = Record<string, unknown>;

const dispatch: Record<string, (input: ToolInput) => Promise<ToolResult<unknown>>> = {
  list_reps: () => listReps(),
  get_rep_performance: (input) => getRepPerformance(input),
  search_transcripts: (input) =>
    searchTranscripts(input as unknown as Parameters<typeof searchTranscripts>[0]),
  get_competitive_intelligence: (input) => getCompetitiveIntelligence(input),
  get_objection_handling_stats: (input) => getObjectionHandlingStats(input),
  list_calls: (input) => listCalls(input),
  get_call_detail: (input) => getCallDetail(input.callId as number),
  run_readonly_sql: (input) => runReadonlySql(input.query as string),
  generate_chart: (input) =>
    generateChart(input as unknown as Parameters<typeof generateChart>[0]),
};

export async function callTool(
  name: string,
  input: ToolInput
): Promise<ToolResult<unknown>> {
  const fn = dispatch[name];
  if (!fn) {
    return { ok: false, error: `Unknown tool: ${name}` };
  }
  try {
    return await fn(input);
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
