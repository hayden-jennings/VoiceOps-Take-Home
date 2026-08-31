"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { MONOCHROME, CHROME, FONT_FAMILY } from "@/lib/chartTheme";
import { ToolResult } from "@/lib/types";

interface RepPerformance {
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

export interface RepScorecardParams {
  repName?: string;
  dateFrom?: string;
  dateTo?: string;
}

const axisTick = { fontSize: 11, fill: CHROME.mutedInk, fontFamily: FONT_FAMILY };

export function RepScorecardView({
  params,
  onParamsChange,
}: {
  params: RepScorecardParams;
  onParamsChange?: (params: RepScorecardParams) => void;
}) {
  const [data, setData] = useState<RepPerformance[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    const qs = new URLSearchParams();
    if (params.repName) qs.set("repName", params.repName);
    if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
    if (params.dateTo) qs.set("dateTo", params.dateTo);
    fetch(`/api/dashboards/data/rep-scorecard?${qs}`)
      .then((r) => r.json())
      .then((json: ToolResult<RepPerformance[]>) => {
        if (json.ok) setData(json.data);
        else setError(json.error);
      })
      .catch((e) => setError(String(e)));
  }, [params.repName, params.dateFrom, params.dateTo]);

  if (error) return <div className="p-4 text-sm text-red-500">{error}</div>;
  if (!data) return <div className="p-4 text-sm text-zinc-400">Loading...</div>;

  if (!params.repName) {
    const sorted = [...data].sort((a, b) => b.callCount - a.callCount);
    return (
      <div className="p-4">
        <h3 className="mb-4 text-sm font-semibold text-zinc-900">
          Call volume by rep
        </h3>
        <ResponsiveContainer width="100%" height={Math.max(200, sorted.length * 44)}>
          <BarChart data={sorted} layout="vertical" margin={{ left: 12, right: 24 }}>
            <CartesianGrid horizontal={false} stroke={CHROME.gridline} />
            <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="repName"
              width={110}
              tick={{ ...axisTick, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip cursor={{ fill: CHROME.gridline }} />
            <Bar
              dataKey="callCount"
              fill={MONOCHROME[0]}
              radius={[0, 6, 6, 0]}
              barSize={22}
              className="cursor-pointer"
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onClick={(d: any) =>
                onParamsChange?.({ ...params, repName: d.repName })
              }
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const rep = data[0];
  if (!rep) {
    return (
      <div className="p-4 text-sm text-zinc-500">
        No calls found for &ldquo;{params.repName}&rdquo;.{" "}
        <button
          className="underline"
          onClick={() => onParamsChange?.({ ...params, repName: undefined })}
        >
          Back to all reps
        </button>
      </div>
    );
  }

  const dispositionEntries = Object.entries(rep.dispositionBreakdown);

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">{rep.repName}</h3>
        <button
          className="text-xs text-zinc-500 underline"
          onClick={() => onParamsChange?.({ ...params, repName: undefined })}
        >
          All reps
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <div className="text-2xl font-semibold text-zinc-900">
            {rep.callCount}
          </div>
          <div className="text-xs text-zinc-500">calls</div>
        </div>
        {dispositionEntries.map(([k, v]) => (
          <div key={k}>
            <div className="text-2xl font-semibold text-zinc-900">{v}</div>
            <div className="text-xs text-zinc-500">{k}</div>
          </div>
        ))}
      </div>

      <h4 className="mb-2 text-xs font-medium text-zinc-500">
        Coaching skill scores
      </h4>
      <ResponsiveContainer
        width="100%"
        height={Math.max(200, rep.skillScores.length * 44)}
      >
        <BarChart
          data={rep.skillScores}
          layout="vertical"
          margin={{ left: 12, right: 24 }}
        >
          <CartesianGrid horizontal={false} stroke={CHROME.gridline} />
          <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="skill"
            width={130}
            tick={{ ...axisTick, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip cursor={{ fill: CHROME.gridline }} />
          <Legend wrapperStyle={{ fontSize: 12, fontFamily: FONT_FAMILY }} />
          <Bar dataKey="good" name="Good" stackId="s" fill={MONOCHROME[0]} barSize={18} />
          <Bar
            dataKey="needsImprovement"
            name="Needs Improvement"
            stackId="s"
            fill={MONOCHROME[1]}
            barSize={18}
          />
          <Bar
            dataKey="critical"
            name="Critical"
            stackId="s"
            fill={MONOCHROME[2]}
            radius={[0, 6, 6, 0]}
            barSize={18}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
