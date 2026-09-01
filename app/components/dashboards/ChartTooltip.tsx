interface TooltipPayloadItem {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
}

// Replaces Recharts' bare default tooltip box with one styled to match the
// rest of the dashboard's card language, used on every bar/line chart.
export function ChartTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-sm">
      {label && <div className="mb-1 text-xs font-medium text-zinc-500">{label}</div>}
      <div className="space-y-0.5">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-zinc-500">{p.name}:</span>
            <span className="font-medium text-zinc-900">{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
