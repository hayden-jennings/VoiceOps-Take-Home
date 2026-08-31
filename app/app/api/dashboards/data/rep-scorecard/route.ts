import { NextRequest } from "next/server";
import { getRepPerformance } from "@/lib/tools/getRepPerformance";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const result = await getRepPerformance({
    repName: params.get("repName") ?? undefined,
    dateFrom: params.get("dateFrom") ?? undefined,
    dateTo: params.get("dateTo") ?? undefined,
  });
  return Response.json(result);
}
