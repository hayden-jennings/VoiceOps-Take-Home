interface RepPerformance {
  repId: number;
  repName: string;
  callCount: number;
  skillScores: {
    skill: string;
    good: number;
    needsImprovement: number;
    critical: number;
  }[];
}

// Ranks by good-score rate (quality), deliberately distinct from call_volume's
// raw count ranking — "who's best" vs "who's busiest" are different questions.
export function LeaderboardSection({
  reps,
  highlightRepName,
  onSelect,
}: {
  reps: RepPerformance[];
  highlightRepName?: string;
  onSelect?: (repName: string) => void;
}) {
  const ranked = reps
    .map((r) => {
      const totals = r.skillScores.reduce(
        (acc, s) => ({
          good: acc.good + s.good,
          total: acc.total + s.good + s.needsImprovement + s.critical,
        }),
        { good: 0, total: 0 }
      );
      return { ...r, goodRate: totals.total > 0 ? totals.good / totals.total : 0 };
    })
    .sort((a, b) => b.goodRate - a.goodRate);

  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-zinc-700">
        Leaderboard — good-score rate
      </h4>
      <div className="space-y-1">
        {ranked.map((r, i) => (
          <button
            key={r.repId}
            onClick={() => onSelect?.(r.repName)}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
              r.repName === highlightRepName ? "bg-zinc-100" : "hover:bg-zinc-50"
            }`}
          >
            <span className="text-zinc-700">
              <span className="mr-2 text-zinc-400">#{i + 1}</span>
              {r.repName}
            </span>
            <span className="font-medium text-zinc-900">
              {Math.round(r.goodRate * 100)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
