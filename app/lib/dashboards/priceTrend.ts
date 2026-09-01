import { db } from "@/lib/db";
import { ToolResult } from "@/lib/types";
import {
  WEEK_BUCKET_SQL,
  EXCLUDE_CURRENT_WEEK_SQL,
  formatBucketLabel,
} from "./timeBucket";

export interface PriceTrendInput {
  competitor?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PriceTrendPoint {
  period: string;
  avgPriceGap: number | null;
  mentionCount: number;
}

export async function getCompetitivePriceTrend(
  input: PriceTrendInput = {}
): Promise<ToolResult<PriceTrendPoint[]>> {
  try {
    const { rows } = await db.query(
      `select ${WEEK_BUCKET_SQL} as bucket,
              count(*) as mention_count,
              avg((ie.extracted_data #>> '{competitive_landscape,price_gap}')::numeric) as avg_price_gap
       from insight_raw_extractions ie
       join calls c on c.id = ie.call_id
       where ie.extracted_data ? 'competitive_landscape'
         and ($1::text is null or ie.extracted_data #>> '{competitive_landscape,competitor_name}' ilike $1)
         and ($2::timestamp is null or c.occurred_at >= $2)
         and ($3::timestamp is null or c.occurred_at <= $3)
         and ${EXCLUDE_CURRENT_WEEK_SQL}
       group by bucket
       order by bucket`,
      [
        input.competitor ? `%${input.competitor}%` : null,
        input.dateFrom ?? null,
        input.dateTo ?? null,
      ]
    );

    return {
      ok: true,
      data: rows.map((r) => ({
        period: formatBucketLabel(r.bucket),
        avgPriceGap: r.avg_price_gap != null ? Number(r.avg_price_gap) : null,
        mentionCount: Number(r.mention_count),
      })),
    };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
