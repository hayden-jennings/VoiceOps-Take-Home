import { NextRequest } from "next/server";
import { getCompetitiveIntelligence } from "@/lib/tools/getCompetitiveIntelligence";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const result = await getCompetitiveIntelligence({
    competitor: params.get("competitor") ?? undefined,
    dateFrom: params.get("dateFrom") ?? undefined,
    dateTo: params.get("dateTo") ?? undefined,
  });
  return Response.json(result);
}
