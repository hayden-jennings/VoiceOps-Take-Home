"use client";

import { useEffect, useRef, useState } from "react";
import { DashboardInstance } from "./DashboardPanel";

function DeleteIcon() {
  return (
    <svg
      width="12"
      height="12"
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

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

// Step 1: press "Dashboards" — this menu. Step 2: press an existing entry to
// reopen it, or "+ New dashboard" to create a blank one and open it
// immediately. Everything else (adding reps, competitors, etc.) happens
// inside the dashboard panel itself, not in this menu.
export function NewDashboardMenu({
  persisted,
  onReopen,
  onCreated,
  onDeleted,
}: {
  persisted: DashboardInstance[];
  onReopen: (instance: DashboardInstance) => void;
  onCreated: (instance: DashboardInstance) => void;
  onDeleted: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function create() {
    const res = await fetch("/api/dashboards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New dashboard", params: {} }),
    });
    const json = await res.json();
    if (json.ok) {
      onCreated(json.data);
      setOpen(false);
    }
  }

  async function remove(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    const res = await fetch(`/api/dashboards/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.ok) onDeleted(id);
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
      >
        Dashboards{persisted.length > 0 && ` (${persisted.length})`}
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-72 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg">
          <button
            onClick={create}
            className="mb-1 flex w-full items-center gap-1.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-900 hover:bg-zinc-50"
          >
            + New dashboard
          </button>
          {persisted.length > 0 && (
            <div className="mt-1 max-h-64 space-y-0.5 overflow-y-auto border-t border-zinc-100 pt-1">
              {persisted.map((d) => (
                <div key={d.id} className="group flex items-center rounded-lg hover:bg-zinc-50">
                  <button
                    onClick={() => {
                      onReopen(d);
                      setOpen(false);
                    }}
                    className="min-w-0 flex-1 px-3 py-2 text-left"
                  >
                    <div className="truncate text-sm text-zinc-800">{d.title}</div>
                    {d.updatedAt && (
                      <div className="text-[11px] text-zinc-400">{relativeTime(d.updatedAt)}</div>
                    )}
                  </button>
                  <button
                    onClick={(e) => remove(d.id, e)}
                    aria-label={`Delete ${d.title}`}
                    className="mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-zinc-300 opacity-0 hover:bg-zinc-200 hover:text-zinc-600 group-hover:opacity-100"
                  >
                    <DeleteIcon />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
