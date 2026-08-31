import { upsertDashboardInstance, DashboardView } from "@/lib/dashboards/persistInstance";
import { ToolResult } from "@/lib/types";

export interface ShowDashboardInput {
  view: DashboardView;
  title: string;
  params: Record<string, unknown>;
  instanceId?: number;
}

export interface ShownDashboard {
  instanceId: number;
  view: DashboardView;
  title: string;
  params: Record<string, unknown>;
}

export async function showDashboard(
  input: ShowDashboardInput
): Promise<ToolResult<ShownDashboard>> {
  const result = await upsertDashboardInstance(input);
  if (!result.ok) return result;
  return {
    ok: true,
    data: {
      instanceId: result.data.id,
      view: result.data.view,
      title: result.data.title,
      params: result.data.params,
    },
  };
}
