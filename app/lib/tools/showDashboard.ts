import {
  upsertDashboardInstance,
  getDashboardInstance,
  DashboardView,
} from "@/lib/dashboards/persistInstance";
import { DashboardDelta, DashboardParams, applyDashboardDelta } from "@/lib/dashboards/types";
import { ToolResult } from "@/lib/types";

export type ShowDashboardInput = DashboardDelta & { instanceId?: number };

export interface ShownDashboard {
  instanceId: number;
  view: DashboardView;
  title: string;
  params: Record<string, unknown>;
}

export async function showDashboard(
  input: ShowDashboardInput
): Promise<ToolResult<ShownDashboard>> {
  let existingParams: DashboardParams = {};
  let title = input.title;

  if (input.instanceId) {
    const existing = await getDashboardInstance(input.instanceId);
    if (!existing.ok) return existing;
    existingParams = existing.data.params as DashboardParams;
    title = title ?? existing.data.title;
  }

  const params = applyDashboardDelta(existingParams, input);

  const result = await upsertDashboardInstance({
    instanceId: input.instanceId,
    view: "dashboard",
    title: title ?? "New dashboard",
    params: params as unknown as Record<string, unknown>,
  });
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
