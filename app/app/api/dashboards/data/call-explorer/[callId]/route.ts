import { getCallDetail } from "@/lib/tools/getCallDetail";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ callId: string }> }
) {
  const { callId } = await params;
  const result = await getCallDetail(Number(callId));
  return Response.json(result);
}
