import { db } from "@/lib/db";
import { ToolResult } from "@/lib/types";

export interface CallDetail {
  id: number;
  occurredAt: string;
  lengthSeconds: number | null;
  summary: string | null;
  state: string;
  customerName: string | null;
  repName: string | null;
  metadata: Record<string, string | number | boolean | null>;
  utterances: {
    content: string;
    isRep: boolean;
    startTime: number;
    endTime: number | null;
  }[];
  skillScores: { skill: string; class: string; comment: string | null }[];
  extraction: Record<string, unknown> | null;
}

export async function getCallDetail(
  callId: number
): Promise<ToolResult<CallDetail>> {
  try {
    const callRes = await db.query(
      `select c.id, c.occurred_at, c.length_seconds, c.summary, c.state, c.customer_name,
              p.first_name, p.last_name
       from calls c
       left join integration_persons p on p.id = c.integration_person_id
       where c.id = $1`,
      [callId]
    );
    if (callRes.rows.length === 0) {
      return { ok: false, error: `No call found with id ${callId}` };
    }
    const call = callRes.rows[0];

    const [metadataRes, utterancesRes, scoresRes, extractionRes] =
      await Promise.all([
        db.query(
          `select key, string_value, number_value, boolean_value
           from call_metadata where call_id = $1`,
          [callId]
        ),
        db.query(
          `select content, is_rep, start_time, end_time
           from utterances where call_id = $1 order by start_time`,
          [callId]
        ),
        db.query(
          `select s.title, cs.class, cs.comment
           from comment_suggestions cs
           join coaching_skills s on s.id = cs.skill_id
           where cs.call_id = $1`,
          [callId]
        ),
        db.query(
          `select extracted_data from insight_raw_extractions where call_id = $1 limit 1`,
          [callId]
        ),
      ]);

    const metadata: CallDetail["metadata"] = {};
    for (const row of metadataRes.rows) {
      metadata[row.key] = row.string_value ?? row.number_value ?? row.boolean_value;
    }

    return {
      ok: true,
      data: {
        id: call.id,
        occurredAt: call.occurred_at,
        lengthSeconds: call.length_seconds,
        summary: call.summary,
        state: call.state,
        customerName: call.customer_name,
        repName: call.first_name ? `${call.first_name} ${call.last_name}` : null,
        metadata,
        utterances: utterancesRes.rows.map((u) => ({
          content: u.content,
          isRep: u.is_rep,
          startTime: u.start_time,
          endTime: u.end_time,
        })),
        skillScores: scoresRes.rows.map((s) => ({
          skill: s.title,
          class: s.class,
          comment: s.comment,
        })),
        extraction: extractionRes.rows[0]?.extracted_data ?? null,
      },
    };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
