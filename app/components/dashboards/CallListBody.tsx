"use client";

import { useState } from "react";
import { ToolResult } from "@/lib/types";
import { SummaryStatsSection } from "./sections/SummaryStatsSection";

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

interface CallDetail {
  id: number;
  occurredAt: string;
  customerName: string | null;
  repName: string | null;
  state: string;
  summary: string | null;
  utterances: { content: string; isRep: boolean; startTime: number; endTime: number | null }[];
  skillScores: { skill: string; class: string; comment: string | null }[];
}

// Shared by the calls overview (all calls) and a rep-filtered calls card —
// clicking a call expands its transcript inline (local state, not persisted,
// per the decision that call detail stays lightweight rather than becoming
// its own addable/removable card)
export function CallListBody({ calls }: { calls: CallSummary[] }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<CallDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  function toggle(id: number) {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(id);
    setDetail(null);
    setLoadingDetail(true);
    fetch(`/api/dashboards/data/call-explorer/${id}`)
      .then((r) => r.json())
      .then((json: ToolResult<CallDetail>) => {
        if (json.ok) setDetail(json.data);
      })
      .finally(() => setLoadingDetail(false));
  }

  if (calls.length === 0) {
    return <div className="text-sm text-zinc-500">No calls match these filters.</div>;
  }

  return (
    <div>
      <SummaryStatsSection calls={calls} />
      <div className="space-y-1">
        {calls.map((c) => (
          <div key={c.id} className="rounded-lg border border-zinc-100">
            <button
              onClick={() => toggle(c.id)}
              className="block w-full px-3 py-2 text-left hover:bg-zinc-50"
            >
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>
                  {c.repName} → {c.customerName}
                </span>
                <span>{new Date(c.occurredAt).toLocaleDateString()}</span>
              </div>
              {c.summary && (
                <div className="mt-1 line-clamp-1 text-xs text-zinc-600">{c.summary}</div>
              )}
              <div className="mt-1 flex gap-2">
                {c.disposition && (
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500">
                    {c.disposition}
                  </span>
                )}
                {c.objectionOutcome && (
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500">
                    {c.objectionOutcome}
                  </span>
                )}
              </div>
            </button>
            {expandedId === c.id && (
              <div className="border-t border-zinc-100 px-3 py-3">
                {loadingDetail || !detail ? (
                  <div className="text-xs text-zinc-400">Loading transcript...</div>
                ) : (
                  <>
                    {detail.skillScores.length > 0 && (
                      <>
                        <h5 className="mb-1.5 text-[11px] font-medium text-zinc-400">
                          Coaching notes
                        </h5>
                        <ul className="mb-3 space-y-1">
                          {detail.skillScores.map((s, i) => (
                            <li key={i} className="text-xs text-zinc-600">
                              <span className="font-medium text-zinc-800">{s.skill}</span> —{" "}
                              {s.class}
                              {s.comment && <span className="text-zinc-500"> · {s.comment}</span>}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                    <h5 className="mb-1.5 text-[11px] font-medium text-zinc-400">Transcript</h5>
                    <div className="space-y-1.5">
                      {detail.utterances.map((u, i) => (
                        <div key={i} className="text-xs">
                          <span
                            className={`font-medium ${u.isRep ? "text-zinc-800" : "text-zinc-500"}`}
                          >
                            {u.isRep ? "Rep" : "Customer"}:
                          </span>{" "}
                          <span className="text-zinc-600">{u.content}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
