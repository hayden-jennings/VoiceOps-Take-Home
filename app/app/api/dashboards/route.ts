import { listDashboardInstances, upsertDashboardInstance } from "@/lib/dashboards/persistInstance";

export async function GET() {
  const result = await listDashboardInstances();
  return Response.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = await upsertDashboardInstance({
    view: "dashboard",
    title: body.title ?? "New dashboard",
    params: body.params ?? {},
  });
  return Response.json(result);
}
