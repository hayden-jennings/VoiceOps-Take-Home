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
import { MONOCHROME, CHROME, titleCase } from "@/lib/chartTheme";
import { ToolResult } from "@/lib/types";
import { DashboardParams, DashboardOverview } from "@/lib/dashboards/types";
import { ChartCard } from "./ChartCard";
import { ChartTooltip } from "./ChartTooltip";
import { AddChartButton } from "./AddChartButton";
import { StatTileRow } from "./StatTile";
import { LeaderboardSection } from "./sections/LeaderboardSection";
import { PriceTrendSection } from "./sections/PriceTrendSection";
import { OutcomeTrendSection } from "./sections/OutcomeTrendSection";
import { CallListBody } from "./CallListBody";

interface RepPerformance {
  repId: number;
  repName: string;
  callCount: number;
  dispositionBreakdown: Record<string, number>;
  skillScores: { skill: string; good: number; needsImprovement: number; critical: number }[];
}

interface CompetitorStats {
  competitor: string;
  mentionCount: number;
  avgCompetitorPrice: number | null;
  avgOurPrice: number | null;
  avgPriceGap: number | null;
  reactionBreakdown: Record<string, number>;
}

interface ObjectionStats {
  objectionType: string;
  count: number;
  repResponseBreakdown: Record<string, number>;
  outcomeBreakdown: Record<string, number>;
}

interface CallSummary {
  id: number;
  occurredAt: string;
  repName: string | null;
  customerName: string | null;
  disposition: string | null;
  summary: string | null;
  competitor: string | null;
  objectionOutcome: string | null;
}

const axisTick = { fontSize: 11, fill: CHROME.mutedInk };
const OBJECTION_TYPES = ["PRICE", "COVERAGE", "TRUST", "TIMING", "NONE"];

function addItem<T>(list: T[], key: T): T[] {
  return list.includes(key) ? list : [...list, key];
}

// Recharts' default <Legend> doesn't reliably follow <Bar> declaration order
// for a stacked chart — it was rendering alphabetically. This renders the
// three skill-score segments in the same order they're stacked (Good,
// Needs Improvement, Critical), left to right.
function SkillScoreLegend() {
  const items = [
    { label: "Good", color: MONOCHROME[0] },
    { label: "Needs Improvement", color: MONOCHROME[1] },
    { label: "Critical", color: MONOCHROME[2] },
  ];
  return (
    <div className="mt-2 flex justify-center gap-4 text-xs">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: item.color }}
          />
          <span style={{ color: item.color }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function DashboardCanvas({
  params,
  onParamsChange,
}: {
  params: DashboardParams;
  onParamsChange: (params: DashboardParams) => void;
}) {
  const overviews = params.overviews ?? [];
  const repCards = params.repCards ?? [];
  const competitorCards = params.competitorCards ?? [];
  const objectionCards = params.objectionCards ?? [];
  const callCards = params.callCards ?? [];

  const [reps, setReps] = useState<RepPerformance[] | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorStats[] | null>(null);
  const [objections, setObjections] = useState<ObjectionStats[] | null>(null);

  useEffect(() => {
    const qs = new URLSearchParams();
    if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
    if (params.dateTo) qs.set("dateTo", params.dateTo);
    fetch(`/api/dashboards/data/rep-scorecard?${qs}`)
      .then((r) => r.json())
      .then((json: ToolResult<RepPerformance[]>) => json.ok && setReps(json.data));
    fetch(`/api/dashboards/data/competitive-intelligence?${qs}`)
      .then((r) => r.json())
      .then((json: ToolResult<CompetitorStats[]>) => json.ok && setCompetitors(json.data));
    fetch(`/api/dashboards/data/objection-funnel?${qs}`)
      .then((r) => r.json())
      .then((json: ToolResult<ObjectionStats[]>) => json.ok && setObjections(json.data));
  }, [params.dateFrom, params.dateTo]);

  function setOverviews(next: DashboardOverview[]) {
    onParamsChange({ ...params, overviews: next });
  }
  function setRepCards(next: string[]) {
    onParamsChange({ ...params, repCards: next });
  }
  function setCompetitorCards(next: string[]) {
    onParamsChange({ ...params, competitorCards: next });
  }
  function setObjectionCards(next: string[]) {
    onParamsChange({ ...params, objectionCards: next });
  }
  function setCallCards(next: string[]) {
    onParamsChange({ ...params, callCards: next });
  }

  const addedRepNames = new Set<string>();
  for (const key of repCards) {
    const matches = (reps ?? []).filter((r) => r.repName.toLowerCase().includes(key.toLowerCase()));
    if (matches.length === 1) addedRepNames.add(matches[0].repName);
  }
  const addedCompetitorNames = new Set<string>();
  for (const key of competitorCards) {
    const matches = (competitors ?? []).filter((c) =>
      c.competitor.toLowerCase().includes(key.toLowerCase())
    );
    if (matches.length === 1) addedCompetitorNames.add(matches[0].competitor);
  }

  const isEmpty =
    overviews.length === 0 &&
    repCards.length === 0 &&
    competitorCards.length === 0 &&
    objectionCards.length === 0 &&
    callCards.length === 0;

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2">
        <label className="text-xs text-zinc-500" htmlFor="dash-date-from">
          From
        </label>
        <input
          id="dash-date-from"
          type="date"
          value={params.dateFrom ?? ""}
          onChange={(e) =>
            onParamsChange({ ...params, dateFrom: e.target.value || undefined })
          }
          className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-700"
        />
        <label className="text-xs text-zinc-500" htmlFor="dash-date-to">
          To
        </label>
        <input
          id="dash-date-to"
          type="date"
          value={params.dateTo ?? ""}
          onChange={(e) => onParamsChange({ ...params, dateTo: e.target.value || undefined })}
          className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-700"
        />
        {params.dateFrom || params.dateTo ? (
          <button
            onClick={() => onParamsChange({ ...params, dateFrom: undefined, dateTo: undefined })}
            className="text-xs text-zinc-400 hover:text-zinc-600"
          >
            Clear
          </button>
        ) : (
          <span className="text-xs text-zinc-400">All time</span>
        )}
      </div>

      {isEmpty && (
        <div className="mb-6 text-sm text-zinc-400">
          This dashboard is empty. Add an overview or a specific rep, competitor, objection
          type, or rep's calls below.
        </div>
      )}

      {overviews.includes("reps") && reps && (
        <div className="mb-6">
          <ChartCard
            title="Reps overview"
            onRemove={() => setOverviews(overviews.filter((o) => o !== "reps"))}
          >
            <h5 className="mb-2 text-sm font-semibold text-zinc-700">Call volume by rep</h5>
            <ResponsiveContainer width="100%" height={Math.max(160, reps.length * 44)}>
              <BarChart
                data={[...reps].sort((a, b) => b.callCount - a.callCount)}
                layout="vertical"
                margin={{ left: 4, right: 24 }}
              >
                <CartesianGrid horizontal={false} stroke={CHROME.gridline} />
                <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="repName"
                  width={95}
                  tick={{ ...axisTick, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: CHROME.gridline }} />
                <Bar
                  dataKey="callCount"
                  name="Calls"
                  fill={MONOCHROME[0]}
                  radius={[0, 6, 6, 0]}
                  barSize={22}
                  className="cursor-pointer"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onClick={(d: any) => setRepCards(addItem(repCards, d.repName))}
                />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4">
              <LeaderboardSection
                reps={reps}
                onSelect={(repName) => setRepCards(addItem(repCards, repName))}
              />
            </div>
          </ChartCard>
        </div>
      )}

      {overviews.includes("competitors") && competitors && (
        <div className="mb-6">
          <ChartCard
            title="Competitors overview"
            onRemove={() => setOverviews(overviews.filter((o) => o !== "competitors"))}
          >
            <h5 className="mb-2 text-sm font-semibold text-zinc-700">Competitor mentions</h5>
            <ResponsiveContainer width="100%" height={Math.max(160, competitors.length * 44)}>
              <BarChart
                data={[...competitors].sort((a, b) => b.mentionCount - a.mentionCount)}
                layout="vertical"
                margin={{ left: 4, right: 24 }}
              >
                <CartesianGrid horizontal={false} stroke={CHROME.gridline} />
                <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="competitor"
                  width={85}
                  tick={{ ...axisTick, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: CHROME.gridline }} />
                <Bar
                  dataKey="mentionCount"
                  name="Mentions"
                  fill={MONOCHROME[0]}
                  radius={[0, 6, 6, 0]}
                  barSize={22}
                  className="cursor-pointer"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onClick={(d: any) => setCompetitorCards(addItem(competitorCards, d.competitor))}
                />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4">
              <PriceTrendSection dateFrom={params.dateFrom} dateTo={params.dateTo} />
            </div>
          </ChartCard>
        </div>
      )}

      {overviews.includes("objections") && objections && (
        <div className="mb-6">
          <ChartCard
            title="Objections overview"
            onRemove={() => setOverviews(overviews.filter((o) => o !== "objections"))}
          >
            <h5 className="mb-2 text-sm font-semibold text-zinc-700">Objections by type</h5>
            <ResponsiveContainer width="100%" height={Math.max(160, objections.length * 44)}>
              <BarChart
                data={[...objections].sort((a, b) => b.count - a.count)}
                layout="vertical"
                margin={{ left: 4, right: 24 }}
              >
                <CartesianGrid horizontal={false} stroke={CHROME.gridline} />
                <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="objectionType"
                  width={75}
                  tickFormatter={titleCase}
                  tick={{ ...axisTick, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: CHROME.gridline }} />
                <Bar
                  dataKey="count"
                  name="Objections"
                  fill={MONOCHROME[0]}
                  radius={[0, 6, 6, 0]}
                  barSize={22}
                  className="cursor-pointer"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onClick={(d: any) => setObjectionCards(addItem(objectionCards, d.objectionType))}
                />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4">
              <OutcomeTrendSection dateFrom={params.dateFrom} dateTo={params.dateTo} />
            </div>
          </ChartCard>
        </div>
      )}

      {overviews.includes("calls") && (
        <div className="mb-6">
          <ChartCard
            title="All calls"
            onRemove={() => setOverviews(overviews.filter((o) => o !== "calls"))}
          >
            <CallsFetcher dateFrom={params.dateFrom} dateTo={params.dateTo} />
          </ChartCard>
        </div>
      )}

      {repCards.map((key) => {
        const matches = (reps ?? []).filter((r) =>
          r.repName.toLowerCase().includes(key.toLowerCase())
        );
        const rep = matches.length === 1 ? matches[0] : undefined;
        return (
          <div key={`rep-${key}`} className="mb-6">
            {rep ? (
              <ChartCard
                title={`${rep.repName} — coaching skill scores`}
                onRemove={() => setRepCards(repCards.filter((k) => k !== key))}
              >
                <StatTileRow
                  tiles={[
                    { key: "calls", value: rep.callCount, label: "Calls" },
                    ...Object.entries(rep.dispositionBreakdown).map(([k, v]) => ({
                      key: k,
                      value: v,
                      label: titleCase(k),
                    })),
                  ]}
                />
                <ResponsiveContainer width="100%" height={Math.max(200, rep.skillScores.length * 44)}>
                  <BarChart data={rep.skillScores} layout="vertical" margin={{ left: 4, right: 24 }}>
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
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: CHROME.gridline }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} content={<SkillScoreLegend />} />
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
              </ChartCard>
            ) : matches.length > 1 ? (
              <div className="rounded-xl border border-zinc-200/80 bg-white p-4 text-sm text-zinc-500">
                Multiple reps match &ldquo;{key}&rdquo;:
                <div className="mt-2 space-y-1">
                  {matches.map((m) => (
                    <button
                      key={m.repId}
                      onClick={() => setRepCards(repCards.map((k) => (k === key ? m.repName : k)))}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100"
                    >
                      {m.repName}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-zinc-200/80 bg-white p-4 text-sm text-zinc-500">
                No calls found for &ldquo;{key}&rdquo;.
                <button
                  onClick={() => setRepCards(repCards.filter((k) => k !== key))}
                  className="text-xs text-zinc-400 hover:text-zinc-600"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        );
      })}

      {competitorCards.map((key) => {
        const matches = (competitors ?? []).filter((c) =>
          c.competitor.toLowerCase().includes(key.toLowerCase())
        );
        const comp = matches.length === 1 ? matches[0] : undefined;
        return (
          <div key={`comp-${key}`} className="mb-6">
            {comp ? (
              <ChartCard
                title={`${comp.competitor} — customer price reaction`}
                onRemove={() => setCompetitorCards(competitorCards.filter((k) => k !== key))}
              >
                <StatTileRow
                  tiles={[
                    { key: "mentions", value: comp.mentionCount, label: "Mentions" },
                    ...(comp.avgOurPrice != null
                      ? [
                          {
                            key: "ourPrice",
                            value: `$${Math.round(comp.avgOurPrice)}`,
                            label: "Our Avg Price",
                          },
                        ]
                      : []),
                    ...(comp.avgCompetitorPrice != null
                      ? [
                          {
                            key: "theirPrice",
                            value: `$${Math.round(comp.avgCompetitorPrice)}`,
                            label: "Their Avg Price",
                          },
                        ]
                      : []),
                    ...(comp.avgPriceGap != null
                      ? [
                          {
                            key: "gap",
                            value: `$${Math.round(comp.avgPriceGap)}`,
                            label: "Avg Gap",
                          },
                        ]
                      : []),
                  ]}
                />
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(160, Object.keys(comp.reactionBreakdown).length * 44)}
                >
                  <BarChart
                    data={Object.entries(comp.reactionBreakdown).map(([reaction, count]) => ({
                      reaction,
                      count,
                    }))}
                    layout="vertical"
                    margin={{ left: 4, right: 24 }}
                  >
                    <CartesianGrid horizontal={false} stroke={CHROME.gridline} />
                    <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} />
                    <YAxis
                      type="category"
                      dataKey="reaction"
                      width={100}
                      tickFormatter={titleCase}
                      tick={{ ...axisTick, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: CHROME.gridline }} />
                    <Bar
                      dataKey="count"
                      name="Reactions"
                      fill={MONOCHROME[0]}
                      radius={[0, 6, 6, 0]}
                      barSize={18}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            ) : matches.length > 1 ? (
              <div className="rounded-xl border border-zinc-200/80 bg-white p-4 text-sm text-zinc-500">
                Multiple competitors match &ldquo;{key}&rdquo;:
                <div className="mt-2 space-y-1">
                  {matches.map((m) => (
                    <button
                      key={m.competitor}
                      onClick={() =>
                        setCompetitorCards(competitorCards.map((k) => (k === key ? m.competitor : k)))
                      }
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100"
                    >
                      {m.competitor}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-zinc-200/80 bg-white p-4 text-sm text-zinc-500">
                No mentions of &ldquo;{key}&rdquo;.
                <button
                  onClick={() => setCompetitorCards(competitorCards.filter((k) => k !== key))}
                  className="text-xs text-zinc-400 hover:text-zinc-600"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        );
      })}

      {objectionCards.map((type) => (
        <div key={`obj-${type}`} className="mb-6">
          <ObjectionCard
            type={type}
            repOptions={(reps ?? []).map((r) => r.repName)}
            defaultRepFilter={params.objectionRepFilter}
            dateFrom={params.dateFrom}
            dateTo={params.dateTo}
            onRemove={() => setObjectionCards(objectionCards.filter((k) => k !== type))}
          />
        </div>
      ))}

      {callCards.map((repName) => {
        // resolve the canonical name for display — repName may be whatever
        // shorthand the model or user typed (e.g. "sara"), same pattern as
        // repCards/competitorCards, so the card title never echoes it back
        const matches = (reps ?? []).filter((r) =>
          r.repName.toLowerCase().includes(repName.toLowerCase())
        );
        const resolvedName = matches.length === 1 ? matches[0].repName : repName;
        return (
          <div key={`calls-${repName}`} className="mb-6">
            <ChartCard
              title={`${resolvedName} — calls`}
              onRemove={() => setCallCards(callCards.filter((k) => k !== repName))}
            >
              <CallsFetcher repName={repName} dateFrom={params.dateFrom} dateTo={params.dateTo} />
            </ChartCard>
          </div>
        );
      })}

      <div className="flex flex-wrap gap-2">
        {!overviews.includes("reps") && (
          <button
            onClick={() => setOverviews(addItem(overviews, "reps"))}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
          >
            + Add reps overview
          </button>
        )}
        {!overviews.includes("competitors") && (
          <button
            onClick={() => setOverviews(addItem(overviews, "competitors"))}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
          >
            + Add competitors overview
          </button>
        )}
        {!overviews.includes("objections") && (
          <button
            onClick={() => setOverviews(addItem(overviews, "objections"))}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
          >
            + Add objections overview
          </button>
        )}
        {!overviews.includes("calls") && (
          <button
            onClick={() => setOverviews(addItem(overviews, "calls"))}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
          >
            + Add calls overview
          </button>
        )}
        <AddChartButton
          options={(reps ?? []).map((r) => r.repName).filter((n) => !addedRepNames.has(n))}
          onAdd={(name) => setRepCards(addItem(repCards, name))}
          label="Add rep"
        />
        <AddChartButton
          options={(competitors ?? [])
            .map((c) => c.competitor)
            .filter((n) => !addedCompetitorNames.has(n))}
          onAdd={(name) => setCompetitorCards(addItem(competitorCards, name))}
          label="Add competitor"
        />
        <AddChartButton
          options={OBJECTION_TYPES.filter((t) => !objectionCards.includes(t))}
          onAdd={(type) => setObjectionCards(addItem(objectionCards, type))}
          label="Add objection type"
        />
        <AddChartButton
          options={(reps ?? []).map((r) => r.repName).filter((n) => !callCards.includes(n))}
          onAdd={(name) => setCallCards(addItem(callCards, name))}
          label="Add calls"
        />
      </div>
    </div>
  );
}

function CallsFetcher({
  repName,
  dateFrom,
  dateTo,
}: {
  repName?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const [calls, setCalls] = useState<CallSummary[] | null>(null);

  useEffect(() => {
    setCalls(null);
    const qs = new URLSearchParams();
    if (repName) qs.set("repName", repName);
    if (dateFrom) qs.set("dateFrom", dateFrom);
    if (dateTo) qs.set("dateTo", dateTo);
    fetch(`/api/dashboards/data/call-explorer?${qs}`)
      .then((r) => r.json())
      .then((json: ToolResult<CallSummary[]>) => json.ok && setCalls(json.data));
  }, [repName, dateFrom, dateTo]);

  if (!calls) return <div className="text-sm text-zinc-400">Loading...</div>;
  return <CallListBody calls={calls} />;
}

function ObjectionCard({
  type,
  repOptions,
  defaultRepFilter,
  dateFrom,
  dateTo,
  onRemove,
}: {
  type: string;
  repOptions: string[];
  defaultRepFilter?: string;
  dateFrom?: string;
  dateTo?: string;
  onRemove: () => void;
}) {
  const [repFilter, setRepFilter] = useState("");
  const [defaultApplied, setDefaultApplied] = useState(false);
  const [obj, setObj] = useState<ObjectionStats | null | undefined>(undefined);

  // resolves the dashboard-level default (which may be a shorthand like
  // "sara") against the real rep list once it's loaded, so the dropdown
  // shows the canonical name instead of an unmatched raw string — applied
  // once, so it doesn't clobber a filter the user picks by hand afterward
  useEffect(() => {
    if (defaultApplied || !defaultRepFilter || repOptions.length === 0) return;
    const match = repOptions.find((n) =>
      n.toLowerCase().includes(defaultRepFilter.toLowerCase())
    );
    if (match) setRepFilter(match);
    setDefaultApplied(true);
  }, [defaultApplied, defaultRepFilter, repOptions]);

  useEffect(() => {
    setObj(undefined);
    const qs = new URLSearchParams();
    qs.set("objectionType", type);
    if (repFilter) qs.set("repName", repFilter);
    if (dateFrom) qs.set("dateFrom", dateFrom);
    if (dateTo) qs.set("dateTo", dateTo);
    fetch(`/api/dashboards/data/objection-funnel?${qs}`)
      .then((r) => r.json())
      .then((json: ToolResult<ObjectionStats[]>) => {
        if (json.ok) setObj(json.data.find((o) => o.objectionType === type) ?? null);
      });
  }, [type, repFilter, dateFrom, dateTo]);

  if (obj === undefined) {
    return <div className="text-sm text-zinc-400">Loading...</div>;
  }

  if (!obj) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-zinc-200/80 bg-white p-4 text-sm text-zinc-500">
        No &ldquo;{titleCase(type)}&rdquo; objections found{repFilter ? ` for ${repFilter}` : ""}.
        <button onClick={onRemove} className="text-xs text-zinc-400 hover:text-zinc-600">
          Remove
        </button>
      </div>
    );
  }

  return (
    <ChartCard title={titleCase(type)} onRemove={onRemove}>
      <div className="mb-4 flex items-center gap-2">
        <label className="text-xs text-zinc-500" htmlFor={`rep-filter-${type}`}>
          Rep
        </label>
        <select
          id={`rep-filter-${type}`}
          value={repFilter}
          onChange={(e) => setRepFilter(e.target.value)}
          className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700"
        >
          <option value="">All reps</option>
          {repOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <StatTileRow tiles={[{ key: "count", value: obj.count, label: "Occurrences" }]} />
      <div className="mb-4">
        <h5 className="mb-2 text-sm font-semibold text-zinc-700">Outcome</h5>
        <ResponsiveContainer
          width="100%"
          height={Math.max(120, Object.keys(obj.outcomeBreakdown).length * 44)}
        >
          <BarChart
            data={Object.entries(obj.outcomeBreakdown).map(([outcome, count]) => ({
              outcome,
              count,
            }))}
            layout="vertical"
            margin={{ left: 4, right: 24 }}
          >
            <CartesianGrid horizontal={false} stroke={CHROME.gridline} />
            <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="outcome"
              width={130}
              tickFormatter={titleCase}
              tick={{ ...axisTick, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: CHROME.gridline }} />
            <Bar dataKey="count" name="Outcomes" fill={MONOCHROME[0]} radius={[0, 6, 6, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div>
        <h5 className="mb-2 text-sm font-semibold text-zinc-700">How reps responded</h5>
        <ResponsiveContainer
          width="100%"
          height={Math.max(120, Object.keys(obj.repResponseBreakdown).length * 44)}
        >
          <BarChart
            data={Object.entries(obj.repResponseBreakdown).map(([response, count]) => ({
              response,
              count,
            }))}
            layout="vertical"
            margin={{ left: 4, right: 24 }}
          >
            <CartesianGrid horizontal={false} stroke={CHROME.gridline} />
            <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="response"
              width={130}
              tickFormatter={titleCase}
              tick={{ ...axisTick, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: CHROME.gridline }} />
            <Bar dataKey="count" name="Responses" fill={MONOCHROME[1]} radius={[0, 6, 6, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
