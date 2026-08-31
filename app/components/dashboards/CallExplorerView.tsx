"use client";

import { useEffect, useState } from "react";
import { ToolResult } from "@/lib/types";

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
  utterances: {
    content: string;
    isRep: boolean;
    startTime: number;
    endTime: number | null;
  }[];
  skillScores: { skill: string; class: string; comment: string | null }[];
}

export interface CallExplorerParams {
  repName?: string;
  disposition?: string;
  competitor?: string;
  objectionOutcome?: "CLOSED" | "PROGRESSING" | "LOST";
  summaryContains?: string;
  dateFrom?: string;
  dateTo?: string;
  callId?: number;
}

export function CallExplorerView({
  params,
  onParamsChange,
}: {
  params: CallExplorerParams;
  onParamsChange?: (params: CallExplorerParams) => void;
}) {
  const [calls, setCalls] = useState<CallSummary[] | null>(null);
  const [detail, setDetail] = useState<CallDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.callId) return;
    setCalls(null);
    setError(null);
    const qs = new URLSearchParams();
    if (params.repName) qs.set("repName", params.repName);
    if (params.disposition) qs.set("disposition", params.disposition);
    if (params.competitor) qs.set("competitor", params.competitor);
    if (params.objectionOutcome) qs.set("objectionOutcome", params.objectionOutcome);
    if (params.summaryContains) qs.set("summaryContains", params.summaryContains);
    if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
    if (params.dateTo) qs.set("dateTo", params.dateTo);
    fetch(`/api/dashboards/data/call-explorer?${qs}`)
      .then((r) => r.json())
      .then((json: ToolResult<CallSummary[]>) => {
        if (json.ok) setCalls(json.data);
        else setError(json.error);
      })
      .catch((e) => setError(String(e)));
  }, [
    params.repName,
    params.disposition,
    params.competitor,
    params.objectionOutcome,
    params.summaryContains,
    params.dateFrom,
    params.dateTo,
    params.callId,
  ]);

  useEffect(() => {
    if (!params.callId) {
      setDetail(null);
      return;
    }
    setDetail(null);
    setError(null);
    fetch(`/api/dashboards/data/call-explorer/${params.callId}`)
      .then((r) => r.json())
      .then((json: ToolResult<CallDetail>) => {
        if (json.ok) setDetail(json.data);
        else setError(json.error);
      })
      .catch((e) => setError(String(e)));
  }, [params.callId]);

  if (error) return <div className="p-4 text-sm text-red-500">{error}</div>;

  if (params.callId) {
    if (!detail) return <div className="p-4 text-sm text-zinc-400">Loading...</div>;
    return (
      <div className="p-4">
        <button
          className="mb-4 text-xs text-zinc-500 underline"
          onClick={() => onParamsChange?.({ ...params, callId: undefined })}
        >
          Back to calls
        </button>
        <h3 className="text-sm font-semibold text-zinc-900">
          {detail.repName} — {detail.customerName}
        </h3>
        <p className="mb-4 text-xs text-zinc-500">
          {new Date(detail.occurredAt).toLocaleDateString()} · {detail.state}
        </p>
        {detail.summary && (
          <p className="mb-4 text-sm text-zinc-700">{detail.summary}</p>
        )}

        {detail.skillScores.length > 0 && (
          <>
            <h4 className="mb-2 text-xs font-medium text-zinc-500">
              Coaching notes
            </h4>
            <ul className="mb-4 space-y-1.5">
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

        <h4 className="mb-2 text-xs font-medium text-zinc-500">Transcript</h4>
        <div className="space-y-2">
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
      </div>
    );
  }

  if (!calls) return <div className="p-4 text-sm text-zinc-400">Loading...</div>;
  if (calls.length === 0)
    return <div className="p-4 text-sm text-zinc-500">No calls match these filters.</div>;

  return (
    <div className="p-4">
      <h3 className="mb-4 text-sm font-semibold text-zinc-900">
        {calls.length} calls
      </h3>
      <div className="space-y-1">
        {calls.map((c) => (
          <button
            key={c.id}
            onClick={() => onParamsChange?.({ ...params, callId: c.id })}
            className="block w-full rounded-lg border border-zinc-100 px-3 py-2 text-left hover:border-zinc-200 hover:bg-zinc-50"
          >
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>
                {c.repName} → {c.customerName}
              </span>
              <span>{new Date(c.occurredAt).toLocaleDateString()}</span>
            </div>
            {c.summary && (
              <div className="mt-1 line-clamp-1 text-xs text-zinc-600">
                {c.summary}
              </div>
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
        ))}
      </div>
    </div>
  );
}
