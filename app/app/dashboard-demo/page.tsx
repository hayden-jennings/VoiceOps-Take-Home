// Temporary exploration page — proves the Rep Scorecard pattern before step D
// wires it into the real panel. Delete once step D lands.
"use client";

import { useState } from "react";
import {
  RepScorecardView,
  RepScorecardParams,
} from "@/components/dashboards/RepScorecardView";

export default function DashboardDemo() {
  const [params, setParams] = useState<RepScorecardParams>({});

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-1 text-xl font-semibold text-zinc-900">
        Rep Scorecard — standalone test
      </h1>
      <p className="mb-6 text-sm text-zinc-500">
        params: {JSON.stringify(params)}
      </p>
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <RepScorecardView params={params} onParamsChange={setParams} />
      </div>
    </div>
  );
}
