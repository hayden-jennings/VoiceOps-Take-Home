import { NextRequest } from "next/server";
import { getObjectionHandlingStats } from "@/lib/tools/getObjectionHandlingStats";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const objectionType = params.get("objectionType") as
    | "PRICE"
    | "COVERAGE"
    | "TRUST"
    | "TIMING"
    | "NONE"
    | null;
  const result = await getObjectionHandlingStats({
    objectionType: objectionType ?? undefined,
    repName: params.get("repName") ?? undefined,
    dateFrom: params.get("dateFrom") ?? undefined,
    dateTo: params.get("dateTo") ?? undefined,
  });
  return Response.json(result);
}
