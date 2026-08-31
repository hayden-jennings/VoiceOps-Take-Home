import { db } from "@/lib/db";
import { ToolResult } from "@/lib/types";

export interface RepPerformanceInput {
  repName?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface RepPerformance {
  repId: number;
  repName: string;
  callCount: number;
  dispositionBreakdown: Record<string, number>;
  skillScores: {
    skill: string;
    good: number;
    needsImprovement: number;
    critical: number;
  }[];
}

export async function getRepPerformance(
  input: RepPerformanceInput = {}
): Promise<ToolResult<RepPerformance[]>> {
  try {
    const repFilter = input.repName ? `%${input.repName}%` : null;
    const dateFrom = input.dateFrom ?? null;
    const dateTo = input.dateTo ?? null;

    const [callsRes, scoresRes] = await Promise.all([
      db.query(
        `select p.id as rep_id, p.first_name, p.last_name, c.id as call_id,
                cm.string_value as disposition
         from integration_persons p
         join calls c on c.integration_person_id = p.id
         left join call_metadata cm on cm.call_id = c.id and cm.key = 'disposition'
         where ($1::text is null or (p.first_name || ' ' || p.last_name) ilike $1)
           and ($2::timestamp is null or c.occurred_at >= $2)
           and ($3::timestamp is null or c.occurred_at <= $3)`,
        [repFilter, dateFrom, dateTo]
      ),
      db.query(
        `select p.id as rep_id, p.first_name, p.last_name, s.title as skill, cs.class
         from integration_persons p
         join calls c on c.integration_person_id = p.id
         join comment_suggestions cs on cs.call_id = c.id
         join coaching_skills s on s.id = cs.skill_id
         where ($1::text is null or (p.first_name || ' ' || p.last_name) ilike $1)
           and ($2::timestamp is null or c.occurred_at >= $2)
           and ($3::timestamp is null or c.occurred_at <= $3)`,
        [repFilter, dateFrom, dateTo]
      ),
    ]);

    const reps = new Map<number, RepPerformance>();
    const countedCalls = new Map<number, Set<number>>();

    for (const row of callsRes.rows) {
      if (!reps.has(row.rep_id)) {
        reps.set(row.rep_id, {
          repId: row.rep_id,
          repName: `${row.first_name} ${row.last_name}`,
          callCount: 0,
          dispositionBreakdown: {},
          skillScores: [],
        });
        countedCalls.set(row.rep_id, new Set());
      }
      const rep = reps.get(row.rep_id)!;
      const calls = countedCalls.get(row.rep_id)!;
      if (!calls.has(row.call_id)) {
        calls.add(row.call_id);
        rep.callCount += 1;
      }
      if (row.disposition) {
        rep.dispositionBreakdown[row.disposition] =
          (rep.dispositionBreakdown[row.disposition] ?? 0) + 1;
      }
    }

    const skillMap = new Map<
      number,
      Map<string, { good: number; needsImprovement: number; critical: number }>
    >();
    for (const row of scoresRes.rows) {
      if (!reps.has(row.rep_id)) continue;
      if (!skillMap.has(row.rep_id)) skillMap.set(row.rep_id, new Map());
      const skills = skillMap.get(row.rep_id)!;
      if (!skills.has(row.skill)) {
        skills.set(row.skill, { good: 0, needsImprovement: 0, critical: 0 });
      }
      const counts = skills.get(row.skill)!;
      if (row.class === "GOOD") counts.good += 1;
      else if (row.class === "NEEDS_IMPROVEMENT") counts.needsImprovement += 1;
      else if (row.class === "CRITICAL") counts.critical += 1;
    }
    for (const [repId, skills] of skillMap) {
      reps.get(repId)!.skillScores = Array.from(skills.entries()).map(
        ([skill, counts]) => ({ skill, ...counts })
      );
    }

    return { ok: true, data: Array.from(reps.values()) };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
