import {
  upsertDashboardInstance,
  deleteDashboardInstance,
} from "@/lib/dashboards/persistInstance";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const result = await upsertDashboardInstance({
    instanceId: Number(id),
    view: "dashboard",
    title: body.title,
    params: body.params,
  });
  return Response.json(result);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await deleteDashboardInstance(Number(id));
  return Response.json(result);
}
