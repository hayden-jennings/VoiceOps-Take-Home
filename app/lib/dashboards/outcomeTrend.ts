import { db } from "@/lib/db";
import { ToolResult } from "@/lib/types";
import {
  WEEK_BUCKET_SQL,
  EXCLUDE_CURRENT_WEEK_SQL,
  formatBucketLabel,
} from "./timeBucket";

export interface OutcomeTrendInput {
  objectionType?: "PRICE" | "COVERAGE" | "TRUST" | "TIMING" | "NONE";
  repName?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface OutcomeTrendPoint {
  period: string;
  closed: number;
  progressing: number;
  lost: number;
}

export async function getObjectionOutcomeTrend(
  input: OutcomeTrendInput = {}
): Promise<ToolResult<OutcomeTrendPoint[]>> {
  try {
    const { rows } = await db.query(
      `select ${WEEK_BUCKET_SQL} as bucket,
              ie.extracted_data #>> '{objection_handling,outcome_after_objection}' as outcome,
              count(*) as cnt
       from insight_raw_extractions ie
       join calls c on c.id = ie.call_id
       left join integration_persons p on p.id = c.integration_person_id
       where ie.extracted_data ? 'objection_handling'
         and ($1::text is null or ie.extracted_data #>> '{objection_handling,objection_type}' = $1)
         and ($2::text is null or (p.first_name || ' ' || p.last_name) ilike $2)
         and ($3::timestamp is null or c.occurred_at >= $3)
         and ($4::timestamp is null or c.occurred_at <= $4)
         and ${EXCLUDE_CURRENT_WEEK_SQL}
       group by bucket, outcome
       order by bucket`,
      [
        input.objectionType ?? null,
        input.repName ? `%${input.repName}%` : null,
        input.dateFrom ?? null,
        input.dateTo ?? null,
      ]
    );

    const buckets = new Map<string, OutcomeTrendPoint>();
    for (const row of rows) {
      const period = formatBucketLabel(row.bucket);
      if (!buckets.has(period)) {
        buckets.set(period, { period, closed: 0, progressing: 0, lost: 0 });
      }
      const point = buckets.get(period)!;
      if (row.outcome === "CLOSED") point.closed = Number(row.cnt);
      else if (row.outcome === "PROGRESSING") point.progressing = Number(row.cnt);
      else if (row.outcome === "LOST") point.lost = Number(row.cnt);
    }
    return { ok: true, data: Array.from(buckets.values()) };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
