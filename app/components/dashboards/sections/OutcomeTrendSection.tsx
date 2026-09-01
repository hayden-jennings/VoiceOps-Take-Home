"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { MONOCHROME, CHROME } from "@/lib/chartTheme";
import { ToolResult } from "@/lib/types";
import { ChartTooltip } from "../ChartTooltip";

interface OutcomeTrendPoint {
  period: string;
  closed: number;
  progressing: number;
  lost: number;
}

const axisTick = { fontSize: 11, fill: CHROME.mutedInk };

export function OutcomeTrendSection({
  objectionType,
  repName,
  dateFrom,
  dateTo,
}: {
  objectionType?: string;
  repName?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const [data, setData] = useState<OutcomeTrendPoint[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    const qs = new URLSearchParams();
    if (objectionType) qs.set("objectionType", objectionType);
    if (repName) qs.set("repName", repName);
    if (dateFrom) qs.set("dateFrom", dateFrom);
    if (dateTo) qs.set("dateTo", dateTo);
    fetch(`/api/dashboards/data/objection-funnel/trend?${qs}`)
      .then((r) => r.json())
      .then((json: ToolResult<OutcomeTrendPoint[]>) => {
        if (json.ok) setData(json.data);
        else setError(json.error);
      })
      .catch((e) => setError(String(e)));
  }, [objectionType, repName, dateFrom, dateTo]);

  if (error) return <div className="text-sm text-red-500">{error}</div>;
  if (!data) return <div className="text-sm text-zinc-400">Loading...</div>;
  if (data.length === 0)
    return <div className="text-sm text-zinc-500">No objections over this range.</div>;

  return (
    <div>
      <h5 className="mb-2 text-sm font-semibold text-zinc-700">Outcome over time</h5>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ left: 4, right: 24, top: 8 }}>
          <CartesianGrid vertical={false} stroke={CHROME.gridline} />
          <XAxis dataKey="period" tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis width={36} tick={axisTick} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: CHROME.gridline }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="closed" name="Closed" stackId="s" fill={MONOCHROME[0]} />
          <Bar dataKey="progressing" name="Progressing" stackId="s" fill={MONOCHROME[1]} />
          <Bar
            dataKey="lost"
            name="Lost"
            stackId="s"
            fill={MONOCHROME[2]}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
