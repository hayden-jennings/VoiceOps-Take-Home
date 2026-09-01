"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { MONOCHROME, CHROME } from "@/lib/chartTheme";
import { ToolResult } from "@/lib/types";
import { ChartTooltip } from "../ChartTooltip";

interface PriceTrendPoint {
  period: string;
  avgPriceGap: number | null;
  mentionCount: number;
}

const axisTick = { fontSize: 11, fill: CHROME.mutedInk };

export function PriceTrendSection({
  competitor,
  dateFrom,
  dateTo,
}: {
  competitor?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const [data, setData] = useState<PriceTrendPoint[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    const qs = new URLSearchParams();
    if (competitor) qs.set("competitor", competitor);
    if (dateFrom) qs.set("dateFrom", dateFrom);
    if (dateTo) qs.set("dateTo", dateTo);
    fetch(`/api/dashboards/data/competitive-intelligence/trend?${qs}`)
      .then((r) => r.json())
      .then((json: ToolResult<PriceTrendPoint[]>) => {
        if (json.ok) setData(json.data);
        else setError(json.error);
      })
      .catch((e) => setError(String(e)));
  }, [competitor, dateFrom, dateTo]);

  if (error) return <div className="text-sm text-red-500">{error}</div>;
  if (!data) return <div className="text-sm text-zinc-400">Loading...</div>;
  if (data.length === 0)
    return <div className="text-sm text-zinc-500">No price data over this range.</div>;

  return (
    <div>
      <h5 className="mb-2 text-sm font-semibold text-zinc-700">Avg price gap over time</h5>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ left: 4, right: 24, top: 8 }}>
          <CartesianGrid vertical={false} stroke={CHROME.gridline} />
          <XAxis dataKey="period" tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis width={36} tick={axisTick} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: CHROME.gridline }} />
          <Line
            type="monotone"
            dataKey="avgPriceGap"
            name="Avg price gap"
            stroke={MONOCHROME[0]}
            strokeWidth={2}
            dot={{ r: 3, fill: MONOCHROME[0] }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
