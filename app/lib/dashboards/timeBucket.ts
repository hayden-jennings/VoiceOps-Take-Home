// Shared by every time-bucketed dashboard query (price_trend, outcome_trend, and
// any future one) so week-boundary/timezone handling can't drift between them.
export const WEEK_BUCKET_SQL = "date_trunc('week', c.occurred_at)";

// The in-progress current week has too small a sample to be a real data point —
// it reads as a trend when it's actually noise. Omit it entirely rather than
// visually de-emphasizing it.
export const EXCLUDE_CURRENT_WEEK_SQL = `${WEEK_BUCKET_SQL} < date_trunc('week', now())`;

export function formatBucketLabel(bucketStart: string | Date): string {
  return new Date(bucketStart).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
