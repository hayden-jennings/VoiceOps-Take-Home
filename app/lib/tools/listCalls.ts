import { db } from "@/lib/db";
import { ToolResult } from "@/lib/types";

export interface ListCallsInput {
  repName?: string;
  disposition?: string;
  competitor?: string;
  objectionOutcome?: "CLOSED" | "PROGRESSING" | "LOST";
  summaryContains?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export interface CallSummary {
  id: number;
  occurredAt: string;
  repName: string | null;
  customerName: string | null;
  disposition: string | null;
  summary: string | null;
  competitor: string | null;
  objectionOutcome: string | null;
}

export async function listCalls(
  input: ListCallsInput = {}
): Promise<ToolResult<CallSummary[]>> {
  try {
    const limit = Math.min(input.limit ?? 20, 100);
    const { rows } = await db.query(
      `select c.id, c.occurred_at, c.customer_name, c.summary,
              p.first_name, p.last_name,
              cm.string_value as disposition,
              ie.extracted_data #>> '{competitive_landscape,competitor_name}' as competitor,
              ie.extracted_data #>> '{objection_handling,outcome_after_objection}' as objection_outcome
       from calls c
       left join integration_persons p on p.id = c.integration_person_id
       left join call_metadata cm on cm.call_id = c.id and cm.key = 'disposition'
       left join insight_raw_extractions ie on ie.call_id = c.id
       where ($1::text is null or (p.first_name || ' ' || p.last_name) ilike $1)
         and ($2::text is null or cm.string_value ilike $2)
         and ($3::text is null or ie.extracted_data #>> '{competitive_landscape,competitor_name}' ilike $3)
         and ($4::text is null or ie.extracted_data #>> '{objection_handling,outcome_after_objection}' = $4)
         and ($5::text is null or c.summary ilike $5)
         and ($6::timestamp is null or c.occurred_at >= $6)
         and ($7::timestamp is null or c.occurred_at <= $7)
       order by c.occurred_at desc
       limit $8`,
      [
        input.repName ? `%${input.repName}%` : null,
        input.disposition ?? null,
        input.competitor ? `%${input.competitor}%` : null,
        input.objectionOutcome ?? null,
        input.summaryContains ? `%${input.summaryContains}%` : null,
        input.dateFrom ?? null,
        input.dateTo ?? null,
        limit,
      ]
    );

    return {
      ok: true,
      data: rows.map((r) => ({
        id: r.id,
        occurredAt: r.occurred_at,
        repName: r.first_name ? `${r.first_name} ${r.last_name}` : null,
        customerName: r.customer_name,
        disposition: r.disposition,
        summary: r.summary,
        competitor: r.competitor,
        objectionOutcome: r.objection_outcome,
      })),
    };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
