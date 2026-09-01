"use client";

import { useEffect, useRef, useState } from "react";

export function AddChartButton({
  options,
  onAdd,
  label,
}: {
  options: string[];
  onAdd: (key: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (options.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
      >
        + {label}
      </button>
      {open && (
        <div className="absolute left-0 z-10 mt-1 max-h-56 w-56 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-lg">
          {options.map((o) => (
            <button
              key={o}
              onClick={() => {
                onAdd(o);
                setOpen(false);
              }}
              className="block w-full truncate rounded-lg px-3 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-50"
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
