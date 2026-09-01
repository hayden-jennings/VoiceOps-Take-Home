"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { DashboardCanvas } from "./DashboardCanvas";
import { DashboardParams } from "@/lib/dashboards/types";

export interface DashboardInstance {
  id: number;
  view: string;
  title: string;
  params: DashboardParams;
  updatedAt?: string;
}

function CloseIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v12m0 0-4-4m4 4 4-4M4 21h16" />
    </svg>
  );
}

export function DashboardPanel({
  dashboard,
  onClose,
  onParamsChange,
  onTitleChange,
}: {
  dashboard: DashboardInstance;
  onClose: () => void;
  onParamsChange: (id: number, params: DashboardParams) => void;
  onTitleChange: (id: number, title: string) => void;
}) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(dashboard.title);
  const [downloading, setDownloading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  function commitTitle() {
    setEditingTitle(false);
    const next = titleDraft.trim();
    if (next && next !== dashboard.title) onTitleChange(dashboard.id, next);
    else setTitleDraft(dashboard.title);
  }

  async function handleDownload() {
    if (!contentRef.current || downloading) return;
    setDownloading(true);
    try {
      // target the unclipped content node (not the overflow-y-auto scroll
      // container) so the export captures everything, not just what's
      // currently visible on screen
      const dataUrl = await toPng(contentRef.current, {
        backgroundColor: "#fafafa",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${dashboard.title.trim() || "dashboard"}.png`;
      link.click();
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex h-full w-full shrink-0 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3">
        {editingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitTitle();
              if (e.key === "Escape") {
                setTitleDraft(dashboard.title);
                setEditingTitle(false);
              }
            }}
            className="min-w-0 flex-1 truncate rounded-md border border-zinc-200 px-1.5 py-0.5 text-base font-semibold text-zinc-900 outline-none"
          />
        ) : (
          <button
            onClick={() => {
              setTitleDraft(dashboard.title);
              setEditingTitle(true);
            }}
            className="min-w-0 flex-1 truncate rounded-md px-1.5 py-0.5 text-left text-base font-semibold text-zinc-900 hover:bg-zinc-50"
          >
            {dashboard.title}
          </button>
        )}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-50"
          aria-label="Download dashboard as PNG"
        >
          <DownloadIcon />
        </button>
        <button
          onClick={onClose}
          className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
          aria-label="Close dashboard"
        >
          <CloseIcon />
        </button>
      </div>
      {/* scrollbar-gutter reserves the scrollbar's space even when content
          doesn't need to scroll yet, so content stops shifting sideways the
          moment a scrollbar appears/disappears */}
      <div className="flex-1 overflow-y-auto [scrollbar-gutter:stable]">
        <div ref={contentRef} className="bg-zinc-50">
          <DashboardCanvas
            params={dashboard.params}
            onParamsChange={(p) => onParamsChange(dashboard.id, p)}
          />
        </div>
      </div>
    </div>
  );
}
