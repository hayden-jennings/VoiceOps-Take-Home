import { db } from "@/lib/db";
import { ToolResult } from "@/lib/types";

export type DashboardView =
  | "rep_scorecard"
  | "competitive_intelligence"
  | "call_explorer"
  | "objection_funnel";

export interface DashboardInstance {
  id: number;
  view: DashboardView;
  title: string;
  params: Record<string, unknown>;
}

export interface UpsertDashboardInput {
  instanceId?: number;
  view: DashboardView;
  title: string;
  params: Record<string, unknown>;
}

// Shared by the show_dashboard agent tool and the panel's direct REST route —
// a filter change made by hand in the UI must not need an LLM round-trip, so
// both paths go through this same function.
export async function upsertDashboardInstance(
  input: UpsertDashboardInput
): Promise<ToolResult<DashboardInstance>> {
  try {
    if (input.instanceId) {
      const { rows } = await db.query(
        `update dashboard_instances
         set view = $2, title = $3, params = $4, updated_at = now()
         where id = $1
         returning id, view, title, params`,
        [input.instanceId, input.view, input.title, JSON.stringify(input.params)]
      );
      if (rows.length === 0) {
        return {
          ok: false,
          error: `No dashboard instance with id ${input.instanceId}`,
        };
      }
      return { ok: true, data: rows[0] };
    }

    const { rows } = await db.query(
      `insert into dashboard_instances (view, title, params)
       values ($1, $2, $3)
       returning id, view, title, params`,
      [input.view, input.title, JSON.stringify(input.params)]
    );
    return { ok: true, data: rows[0] };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function getDashboardInstance(
  id: number
): Promise<ToolResult<DashboardInstance>> {
  try {
    const { rows } = await db.query(
      `select id, view, title, params from dashboard_instances where id = $1`,
      [id]
    );
    if (rows.length === 0) {
      return { ok: false, error: `No dashboard instance with id ${id}` };
    }
    return { ok: true, data: rows[0] };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function listDashboardInstances(): Promise<
  ToolResult<DashboardInstance[]>
> {
  try {
    const { rows } = await db.query(
      `select id, view, title, params from dashboard_instances order by updated_at desc`
    );
    return { ok: true, data: rows };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
