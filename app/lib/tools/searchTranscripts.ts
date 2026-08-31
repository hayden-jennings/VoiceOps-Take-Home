import { db } from "@/lib/db";
import { ToolResult } from "@/lib/types";

export interface SearchTranscriptsInput {
  keyword: string;
  repName?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export interface TranscriptMatch {
  callId: number;
  occurredAt: string;
  repName: string | null;
  customerName: string | null;
  isRep: boolean;
  snippet: string;
}

export async function searchTranscripts(
  input: SearchTranscriptsInput
): Promise<ToolResult<TranscriptMatch[]>> {
  try {
    const limit = Math.min(input.limit ?? 20, 100);
    const { rows } = await db.query(
      `select u.call_id, c.occurred_at, c.customer_name, u.content, u.is_rep,
              p.first_name, p.last_name
       from utterances u
       join calls c on c.id = u.call_id
       left join integration_persons p on p.id = c.integration_person_id
       where u.content ilike $1
         and ($2::timestamp is null or c.occurred_at >= $2)
         and ($3::timestamp is null or c.occurred_at <= $3)
         and ($4::text is null or (p.first_name || ' ' || p.last_name) ilike $4)
       order by c.occurred_at desc
       limit $5`,
      [
        `%${input.keyword}%`,
        input.dateFrom ?? null,
        input.dateTo ?? null,
        input.repName ? `%${input.repName}%` : null,
        limit,
      ]
    );

    return {
      ok: true,
      data: rows.map((r) => ({
        callId: r.call_id,
        occurredAt: r.occurred_at,
        repName: r.first_name ? `${r.first_name} ${r.last_name}` : null,
        customerName: r.customer_name,
        isRep: r.is_rep,
        snippet: r.content,
      })),
    };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
