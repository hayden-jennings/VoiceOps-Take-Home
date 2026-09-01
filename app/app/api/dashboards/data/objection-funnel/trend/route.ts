import { NextRequest } from "next/server";
import { getObjectionOutcomeTrend } from "@/lib/dashboards/outcomeTrend";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const objectionType = params.get("objectionType") as
    | "PRICE"
    | "COVERAGE"
    | "TRUST"
    | "TIMING"
    | "NONE"
    | null;
  const result = await getObjectionOutcomeTrend({
    objectionType: objectionType ?? undefined,
    repName: params.get("repName") ?? undefined,
    dateFrom: params.get("dateFrom") ?? undefined,
    dateTo: params.get("dateTo") ?? undefined,
  });
  return Response.json(result);
}
