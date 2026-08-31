import { listDashboardInstances } from "@/lib/dashboards/persistInstance";

export async function GET() {
  const result = await listDashboardInstances();
  return Response.json(result);
}
