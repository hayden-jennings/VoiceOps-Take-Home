import { upsertDashboardInstance, DashboardView } from "@/lib/dashboards/persistInstance";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const result = await upsertDashboardInstance({
    instanceId: Number(id),
    view: body.view as DashboardView,
    title: body.title,
    params: body.params,
  });
  return Response.json(result);
}
