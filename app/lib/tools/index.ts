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
import { showDashboard } from "./showDashboard";
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
  {
    name: "show_dashboard",
    description:
      "Open or update a persistent dashboard panel next to the chat — something the user can keep open, filter by hand, and come back to later. Distinct from generate_chart: use this when the user wants an ongoing view into a rep, a competitor, objection patterns, or a set of calls to browse, not a one-off visual. " +
      "A dashboard is one canvas that can hold reps, competitors, objections, and calls together — it's not scoped to a single entity type. Pass instanceId to update a dashboard already open in this conversation instead of opening a new one. " +
      "This tool takes a DELTA, not the full desired state — describe only what's changing, and the server merges it onto whatever's already on the dashboard. Never try to reconstruct or re-send existing content; that's the server's job, not yours. " +
      "add/removeOverviews: ('reps'|'competitors'|'objections'|'calls')[] — the \"all-X\" high-level sections (all reps ranked by call volume + leaderboard, all competitor mentions + price trend, all objection types + outcome trend, or the full call list). " +
      "add/removeRepCards, add/removeCompetitorCards: string[] of names (partial match resolved client-side, e.g. 'Sarah' matches 'Sarah Johnson') — a specific entity's detail card, shown alongside the overviews, not instead of them. " +
      "add/removeObjectionCards: string[], one of PRICE/COVERAGE/TRUST/TIMING/NONE — 'all objection types' means adding all five. objectionRepFilter: string, sets the default rep filter applied to every objection card on this dashboard (each card also has its own 'Rep' dropdown the user can override by hand) — set this whenever the request is about one rep's objection handling specifically, e.g. 'show all of Sarah's objection types' = addObjectionCards: all five + objectionRepFilter: 'Sarah Johnson'. " +
      "add/removeCallCards: string[] of rep names — that rep's calls in a compact list. " +
      "For a broad request like 'show me everything on <rep>' or 'all of <rep>'s stats', compose generously in one call rather than settling for just one card: addRepCards (skill scores), addCallCards (their calls), and addObjectionCards + objectionRepFilter (their objection handling) together, not just whichever one the request happens to mention first. " +
      "clear: true wipes every overview and card before applying this call's adds — use it for \"start over\" requests like \"remove everything and just show David's stats\". " +
      "title/dateFrom/dateTo: only set if actually changing; omitted means unchanged (title defaults to 'New dashboard' only when creating fresh with no title given). Always use the full canonical name you actually resolved (from list_reps / get_rep_performance / a dashboard's own data) in the title and every card — never echo back the user's shorthand or typo. If they say 'sara' and you found Sarah Johnson, everything you write says \"Sarah Johnson\", not \"sara\".",
    input_schema: {
      type: "object",
      properties: {
        instanceId: {
          type: "number",
          description: "Update this existing dashboard instance instead of creating a new one",
        },
        title: { type: "string", description: "Short human title, e.g. 'Sarah Johnson — Scorecard'" },
        dateFrom: { type: "string" },
        dateTo: { type: "string" },
        clear: {
          type: "boolean",
          description: "Wipe all existing overviews/cards before applying this call's adds",
        },
        addOverviews: { type: "array", items: { type: "string", enum: ["reps", "competitors", "objections", "calls"] } },
        removeOverviews: { type: "array", items: { type: "string", enum: ["reps", "competitors", "objections", "calls"] } },
        addRepCards: { type: "array", items: { type: "string" } },
        removeRepCards: { type: "array", items: { type: "string" } },
        addCompetitorCards: { type: "array", items: { type: "string" } },
        removeCompetitorCards: { type: "array", items: { type: "string" } },
        addObjectionCards: { type: "array", items: { type: "string" } },
        removeObjectionCards: { type: "array", items: { type: "string" } },
        objectionRepFilter: {
          type: "string",
          description: "Default rep filter for every objection card on this dashboard",
        },
        addCallCards: { type: "array", items: { type: "string" } },
        removeCallCards: { type: "array", items: { type: "string" } },
      },
      required: [],
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
  show_dashboard: "Opening a dashboard...",
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
  show_dashboard: (input) =>
    showDashboard(input as unknown as Parameters<typeof showDashboard>[0]),
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
