"use client";

import { RepScorecardView, RepScorecardParams } from "./RepScorecardView";
import {
  CompetitiveIntelligenceView,
  CompetitiveIntelligenceParams,
} from "./CompetitiveIntelligenceView";
import { ObjectionFunnelView, ObjectionFunnelParams } from "./ObjectionFunnelView";
import { CallExplorerView, CallExplorerParams } from "./CallExplorerView";

export interface DashboardInstance {
  id: number;
  view: string;
  title: string;
  params: Record<string, unknown>;
}

function DashboardView({
  view,
  params,
  onParamsChange,
}: {
  view: string;
  params: Record<string, unknown>;
  onParamsChange: (params: Record<string, unknown>) => void;
}) {
  if (view === "rep_scorecard") {
    return (
      <RepScorecardView
        params={params as RepScorecardParams}
        onParamsChange={onParamsChange as (p: RepScorecardParams) => void}
      />
    );
  }
  if (view === "competitive_intelligence") {
    return (
      <CompetitiveIntelligenceView
        params={params as CompetitiveIntelligenceParams}
        onParamsChange={onParamsChange as (p: CompetitiveIntelligenceParams) => void}
      />
    );
  }
  if (view === "objection_funnel") {
    return (
      <ObjectionFunnelView
        params={params as ObjectionFunnelParams}
        onParamsChange={onParamsChange as (p: ObjectionFunnelParams) => void}
      />
    );
  }
  if (view === "call_explorer") {
    return (
      <CallExplorerView
        params={params as CallExplorerParams}
        onParamsChange={onParamsChange as (p: CallExplorerParams) => void}
      />
    );
  }
  return (
    <div className="p-4 text-sm text-zinc-400">
      This view (&ldquo;{view}&rdquo;) isn&apos;t built yet.
    </div>
  );
}

export function DashboardPanel({
  dashboards,
  activeId,
  onSelect,
  onClose,
  onParamsChange,
}: {
  dashboards: DashboardInstance[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onClose: () => void;
  onParamsChange: (id: number, params: Record<string, unknown>) => void;
}) {
  const active = dashboards.find((d) => d.id === activeId) ?? dashboards[0];

  return (
    <div className="flex h-full w-[420px] shrink-0 flex-col border-l border-zinc-200 bg-zinc-50">
      <div className="flex items-center gap-2 overflow-x-auto border-b border-zinc-200 bg-white px-3 py-2">
        {dashboards.map((d) => (
          <button
            key={d.id}
            onClick={() => onSelect(d.id)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              active && d.id === active.id
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {d.title}
          </button>
        ))}
        <button
          onClick={onClose}
          className="ml-auto shrink-0 text-xs text-zinc-400 hover:text-zinc-600"
        >
          Hide
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {active ? (
          <DashboardView
            view={active.view}
            params={active.params}
            onParamsChange={(p) => onParamsChange(active.id, p)}
          />
        ) : (
          <div className="p-4 text-sm text-zinc-400">No dashboard open.</div>
        )}
      </div>
    </div>
  );
}
