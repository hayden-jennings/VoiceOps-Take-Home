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
} from "recharts";
import { MONOCHROME, CHROME, FONT_FAMILY } from "@/lib/chartTheme";
import { ToolResult } from "@/lib/types";

interface ObjectionStats {
  objectionType: string;
  count: number;
  repResponseBreakdown: Record<string, number>;
  outcomeBreakdown: Record<string, number>;
}

export interface ObjectionFunnelParams {
  objectionType?: "PRICE" | "COVERAGE" | "TRUST" | "TIMING" | "NONE";
  repName?: string;
  dateFrom?: string;
  dateTo?: string;
}

const axisTick = { fontSize: 11, fill: CHROME.mutedInk, fontFamily: FONT_FAMILY };

export function ObjectionFunnelView({
  params,
  onParamsChange,
}: {
  params: ObjectionFunnelParams;
  onParamsChange?: (params: ObjectionFunnelParams) => void;
}) {
  const [data, setData] = useState<ObjectionStats[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    const qs = new URLSearchParams();
    if (params.objectionType) qs.set("objectionType", params.objectionType);
    if (params.repName) qs.set("repName", params.repName);
    if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
    if (params.dateTo) qs.set("dateTo", params.dateTo);
    fetch(`/api/dashboards/data/objection-funnel?${qs}`)
      .then((r) => r.json())
      .then((json: ToolResult<ObjectionStats[]>) => {
        if (json.ok) setData(json.data);
        else setError(json.error);
      })
      .catch((e) => setError(String(e)));
  }, [params.objectionType, params.repName, params.dateFrom, params.dateTo]);

  if (error) return <div className="p-4 text-sm text-red-500">{error}</div>;
  if (!data) return <div className="p-4 text-sm text-zinc-400">Loading...</div>;

  if (!params.objectionType) {
    const sorted = [...data].sort((a, b) => b.count - a.count);
    return (
      <div className="p-4">
        <h3 className="mb-4 text-sm font-semibold text-zinc-900">
          Objections by type
        </h3>
        <ResponsiveContainer width="100%" height={Math.max(200, sorted.length * 44)}>
          <BarChart data={sorted} layout="vertical" margin={{ left: 12, right: 24 }}>
            <CartesianGrid horizontal={false} stroke={CHROME.gridline} />
            <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="objectionType"
              width={110}
              tick={{ ...axisTick, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip cursor={{ fill: CHROME.gridline }} />
            <Bar
              dataKey="count"
              fill={MONOCHROME[0]}
              radius={[0, 6, 6, 0]}
              barSize={22}
              className="cursor-pointer"
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onClick={(d: any) =>
                onParamsChange?.({ ...params, objectionType: d.objectionType })
              }
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const obj = data[0];
  if (!obj) {
    return (
      <div className="p-4 text-sm text-zinc-500">
        No &ldquo;{params.objectionType}&rdquo; objections found.{" "}
        <button
          className="underline"
          onClick={() => onParamsChange?.({ ...params, objectionType: undefined })}
        >
          Back to all types
        </button>
      </div>
    );
  }

  const outcomeData = Object.entries(obj.outcomeBreakdown).map(
    ([outcome, count]) => ({ outcome, count })
  );
  const responseData = Object.entries(obj.repResponseBreakdown).map(
    ([response, count]) => ({ response, count })
  );

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">{obj.objectionType}</h3>
        <button
          className="text-xs text-zinc-500 underline"
          onClick={() => onParamsChange?.({ ...params, objectionType: undefined })}
        >
          All types
        </button>
      </div>

      <div className="mb-6">
        <div className="text-2xl font-semibold text-zinc-900">{obj.count}</div>
        <div className="text-xs text-zinc-500">occurrences</div>
      </div>

      <h4 className="mb-2 text-xs font-medium text-zinc-500">Outcome</h4>
      <ResponsiveContainer width="100%" height={Math.max(120, outcomeData.length * 44)}>
        <BarChart data={outcomeData} layout="vertical" margin={{ left: 12, right: 24 }}>
          <CartesianGrid horizontal={false} stroke={CHROME.gridline} />
          <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="outcome"
            width={110}
            tick={{ ...axisTick, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip cursor={{ fill: CHROME.gridline }} />
          <Bar dataKey="count" fill={MONOCHROME[0]} radius={[0, 6, 6, 0]} barSize={16} />
        </BarChart>
      </ResponsiveContainer>

      <h4 className="mb-2 mt-6 text-xs font-medium text-zinc-500">
        How reps responded
      </h4>
      <ResponsiveContainer width="100%" height={Math.max(120, responseData.length * 44)}>
        <BarChart data={responseData} layout="vertical" margin={{ left: 12, right: 24 }}>
          <CartesianGrid horizontal={false} stroke={CHROME.gridline} />
          <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="response"
            width={130}
            tick={{ ...axisTick, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip cursor={{ fill: CHROME.gridline }} />
          <Bar dataKey="count" fill={MONOCHROME[1]} radius={[0, 6, 6, 0]} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
