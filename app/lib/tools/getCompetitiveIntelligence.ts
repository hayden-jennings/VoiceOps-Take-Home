import { db } from "@/lib/db";
import { ToolResult } from "@/lib/types";

export interface CompetitiveIntelligenceInput {
  competitor?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CompetitorStats {
  competitor: string;
  mentionCount: number;
  avgCompetitorPrice: number | null;
  avgOurPrice: number | null;
  avgPriceGap: number | null;
  reactionBreakdown: Record<string, number>;
}

export async function getCompetitiveIntelligence(
  input: CompetitiveIntelligenceInput = {}
): Promise<ToolResult<CompetitorStats[]>> {
  try {
    const competitorFilter = input.competitor ? `%${input.competitor}%` : null;
    const dateFrom = input.dateFrom ?? null;
    const dateTo = input.dateTo ?? null;
    const params = [competitorFilter, dateFrom, dateTo];

    const statsRes = await db.query(
      `select
         ie.extracted_data #>> '{competitive_landscape,competitor_name}' as competitor,
         count(*) as mention_count,
         avg((ie.extracted_data #>> '{competitive_landscape,competitor_price}')::numeric) as avg_competitor_price,
         avg((ie.extracted_data #>> '{competitive_landscape,our_price}')::numeric) as avg_our_price,
         avg((ie.extracted_data #>> '{competitive_landscape,price_gap}')::numeric) as avg_price_gap
       from insight_raw_extractions ie
       join calls c on c.id = ie.call_id
       where ie.extracted_data ? 'competitive_landscape'
         and ($1::text is null or ie.extracted_data #>> '{competitive_landscape,competitor_name}' ilike $1)
         and ($2::timestamp is null or c.occurred_at >= $2)
         and ($3::timestamp is null or c.occurred_at <= $3)
       group by competitor
       order by mention_count desc`,
      params
    );

    const reactionRes = await db.query(
      `select
         ie.extracted_data #>> '{competitive_landscape,competitor_name}' as competitor,
         ie.extracted_data #>> '{competitive_landscape,customer_price_reaction}' as reaction,
         count(*) as cnt
       from insight_raw_extractions ie
       join calls c on c.id = ie.call_id
       where ie.extracted_data ? 'competitive_landscape'
         and ($1::text is null or ie.extracted_data #>> '{competitive_landscape,competitor_name}' ilike $1)
         and ($2::timestamp is null or c.occurred_at >= $2)
         and ($3::timestamp is null or c.occurred_at <= $3)
       group by competitor, reaction`,
      params
    );

    const stats = new Map<string, CompetitorStats>();
    for (const row of statsRes.rows) {
      stats.set(row.competitor, {
        competitor: row.competitor,
        mentionCount: Number(row.mention_count),
        avgCompetitorPrice: row.avg_competitor_price
          ? Number(row.avg_competitor_price)
          : null,
        avgOurPrice: row.avg_our_price ? Number(row.avg_our_price) : null,
        avgPriceGap: row.avg_price_gap ? Number(row.avg_price_gap) : null,
        reactionBreakdown: {},
      });
    }
    for (const row of reactionRes.rows) {
      const entry = stats.get(row.competitor);
      if (entry && row.reaction) {
        entry.reactionBreakdown[row.reaction] = Number(row.cnt);
      }
    }

    return { ok: true, data: Array.from(stats.values()) };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
