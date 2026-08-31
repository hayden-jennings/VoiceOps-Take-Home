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

interface CompetitorStats {
  competitor: string;
  mentionCount: number;
  avgCompetitorPrice: number | null;
  avgOurPrice: number | null;
  avgPriceGap: number | null;
  reactionBreakdown: Record<string, number>;
}

export interface CompetitiveIntelligenceParams {
  competitor?: string;
  dateFrom?: string;
  dateTo?: string;
}

const axisTick = { fontSize: 11, fill: CHROME.mutedInk, fontFamily: FONT_FAMILY };

export function CompetitiveIntelligenceView({
  params,
  onParamsChange,
}: {
  params: CompetitiveIntelligenceParams;
  onParamsChange?: (params: CompetitiveIntelligenceParams) => void;
}) {
  const [data, setData] = useState<CompetitorStats[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    const qs = new URLSearchParams();
    if (params.competitor) qs.set("competitor", params.competitor);
    if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
    if (params.dateTo) qs.set("dateTo", params.dateTo);
    fetch(`/api/dashboards/data/competitive-intelligence?${qs}`)
      .then((r) => r.json())
      .then((json: ToolResult<CompetitorStats[]>) => {
        if (json.ok) setData(json.data);
        else setError(json.error);
      })
      .catch((e) => setError(String(e)));
  }, [params.competitor, params.dateFrom, params.dateTo]);

  if (error) return <div className="p-4 text-sm text-red-500">{error}</div>;
  if (!data) return <div className="p-4 text-sm text-zinc-400">Loading...</div>;

  if (!params.competitor) {
    const sorted = [...data].sort((a, b) => b.mentionCount - a.mentionCount);
    return (
      <div className="p-4">
        <h3 className="mb-4 text-sm font-semibold text-zinc-900">
          Competitor mentions
        </h3>
        <ResponsiveContainer width="100%" height={Math.max(200, sorted.length * 44)}>
          <BarChart data={sorted} layout="vertical" margin={{ left: 12, right: 24 }}>
            <CartesianGrid horizontal={false} stroke={CHROME.gridline} />
            <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="competitor"
              width={110}
              tick={{ ...axisTick, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip cursor={{ fill: CHROME.gridline }} />
            <Bar
              dataKey="mentionCount"
              fill={MONOCHROME[0]}
              radius={[0, 6, 6, 0]}
              barSize={22}
              className="cursor-pointer"
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onClick={(d: any) =>
                onParamsChange?.({ ...params, competitor: d.competitor })
              }
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const comp = data[0];
  if (!comp) {
    return (
      <div className="p-4 text-sm text-zinc-500">
        No mentions of &ldquo;{params.competitor}&rdquo;.{" "}
        <button
          className="underline"
          onClick={() => onParamsChange?.({ ...params, competitor: undefined })}
        >
          Back to all competitors
        </button>
      </div>
    );
  }

  const reactionData = Object.entries(comp.reactionBreakdown).map(
    ([reaction, count]) => ({ reaction, count })
  );

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">{comp.competitor}</h3>
        <button
          className="text-xs text-zinc-500 underline"
          onClick={() => onParamsChange?.({ ...params, competitor: undefined })}
        >
          All competitors
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <div className="text-2xl font-semibold text-zinc-900">
            {comp.mentionCount}
          </div>
          <div className="text-xs text-zinc-500">mentions</div>
        </div>
        {comp.avgOurPrice != null && (
          <div>
            <div className="text-2xl font-semibold text-zinc-900">
              ${Math.round(comp.avgOurPrice)}
            </div>
            <div className="text-xs text-zinc-500">our avg price</div>
          </div>
        )}
        {comp.avgCompetitorPrice != null && (
          <div>
            <div className="text-2xl font-semibold text-zinc-900">
              ${Math.round(comp.avgCompetitorPrice)}
            </div>
            <div className="text-xs text-zinc-500">their avg price</div>
          </div>
        )}
        {comp.avgPriceGap != null && (
          <div>
            <div className="text-2xl font-semibold text-zinc-900">
              ${Math.round(comp.avgPriceGap)}
            </div>
            <div className="text-xs text-zinc-500">avg gap</div>
          </div>
        )}
      </div>

      <h4 className="mb-2 text-xs font-medium text-zinc-500">
        Customer price reaction
      </h4>
      <ResponsiveContainer width="100%" height={Math.max(160, reactionData.length * 44)}>
        <BarChart data={reactionData} layout="vertical" margin={{ left: 12, right: 24 }}>
          <CartesianGrid horizontal={false} stroke={CHROME.gridline} />
          <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="reaction"
            width={110}
            tick={{ ...axisTick, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip cursor={{ fill: CHROME.gridline }} />
          <Bar dataKey="count" fill={MONOCHROME[0]} radius={[0, 6, 6, 0]} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
