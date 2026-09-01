import { NextRequest } from "next/server";
import { getCompetitivePriceTrend } from "@/lib/dashboards/priceTrend";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const result = await getCompetitivePriceTrend({
    competitor: params.get("competitor") ?? undefined,
    dateFrom: params.get("dateFrom") ?? undefined,
    dateTo: params.get("dateTo") ?? undefined,
  });
  return Response.json(result);
}
