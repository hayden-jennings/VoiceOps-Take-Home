import { db } from "@/lib/db";
import { ToolResult } from "@/lib/types";

export interface ObjectionHandlingInput {
  objectionType?: "PRICE" | "COVERAGE" | "TRUST" | "TIMING" | "NONE";
  repName?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ObjectionStats {
  objectionType: string;
  count: number;
  repResponseBreakdown: Record<string, number>;
  outcomeBreakdown: Record<string, number>;
}

export async function getObjectionHandlingStats(
  input: ObjectionHandlingInput = {}
): Promise<ToolResult<ObjectionStats[]>> {
  try {
    const params = [
      input.objectionType ?? null,
      input.repName ? `%${input.repName}%` : null,
      input.dateFrom ?? null,
      input.dateTo ?? null,
    ];
    const joinAndWhere = `
      from insight_raw_extractions ie
      join calls c on c.id = ie.call_id
      left join integration_persons p on p.id = c.integration_person_id
      where ie.extracted_data ? 'objection_handling'
        and ($1::text is null or ie.extracted_data #>> '{objection_handling,objection_type}' = $1)
        and ($2::text is null or (p.first_name || ' ' || p.last_name) ilike $2)
        and ($3::timestamp is null or c.occurred_at >= $3)
        and ($4::timestamp is null or c.occurred_at <= $4)`;

    const [countRes, responseRes, outcomeRes] = await Promise.all([
      db.query(
        `select ie.extracted_data #>> '{objection_handling,objection_type}' as objection_type,
                count(*) as cnt
         ${joinAndWhere}
         group by objection_type`,
        params
      ),
      db.query(
        `select ie.extracted_data #>> '{objection_handling,objection_type}' as objection_type,
                ie.extracted_data #>> '{objection_handling,rep_response}' as rep_response,
                count(*) as cnt
         ${joinAndWhere}
         group by objection_type, rep_response`,
        params
      ),
      db.query(
        `select ie.extracted_data #>> '{objection_handling,objection_type}' as objection_type,
                ie.extracted_data #>> '{objection_handling,outcome_after_objection}' as outcome,
                count(*) as cnt
         ${joinAndWhere}
         group by objection_type, outcome`,
        params
      ),
    ]);

    const stats = new Map<string, ObjectionStats>();
    for (const row of countRes.rows) {
      stats.set(row.objection_type, {
        objectionType: row.objection_type,
        count: Number(row.cnt),
        repResponseBreakdown: {},
        outcomeBreakdown: {},
      });
    }
    for (const row of responseRes.rows) {
      const entry = stats.get(row.objection_type);
      if (entry && row.rep_response) {
        entry.repResponseBreakdown[row.rep_response] = Number(row.cnt);
      }
    }
    for (const row of outcomeRes.rows) {
      const entry = stats.get(row.objection_type);
      if (entry && row.outcome) {
        entry.outcomeBreakdown[row.outcome] = Number(row.cnt);
      }
    }

    return { ok: true, data: Array.from(stats.values()) };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
