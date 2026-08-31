import { NextRequest } from "next/server";
import { listCalls } from "@/lib/tools/listCalls";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const objectionOutcome = params.get("objectionOutcome") as
    | "CLOSED"
    | "PROGRESSING"
    | "LOST"
    | null;
  const result = await listCalls({
    repName: params.get("repName") ?? undefined,
    disposition: params.get("disposition") ?? undefined,
    competitor: params.get("competitor") ?? undefined,
    objectionOutcome: objectionOutcome ?? undefined,
    summaryContains: params.get("summaryContains") ?? undefined,
    dateFrom: params.get("dateFrom") ?? undefined,
    dateTo: params.get("dateTo") ?? undefined,
    limit: 50,
  });
  return Response.json(result);
}
