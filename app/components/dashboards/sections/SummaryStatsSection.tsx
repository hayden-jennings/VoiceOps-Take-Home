import { StatTileRow } from "../StatTile";

interface CallSummary {
  disposition: string | null;
}

export function SummaryStatsSection({ calls }: { calls: CallSummary[] }) {
  const dispositionCounts = new Map<string, number>();
  for (const c of calls) {
    if (c.disposition) {
      dispositionCounts.set(
        c.disposition,
        (dispositionCounts.get(c.disposition) ?? 0) + 1
      );
    }
  }

  return (
    <StatTileRow
      tiles={[
        { key: "calls", value: calls.length, label: "Calls" },
        ...Array.from(dispositionCounts.entries()).map(([k, v]) => ({ key: k, value: v, label: k })),
      ]}
    />
  );
}
