// One shape, shared by the frontend canvas, the show_dashboard tool, and the
// REST routes — a dashboard is a blank canvas that accumulates "overview"
// (all-X) sections and per-entity "cards" (a specific rep/competitor/
// objection type, or a rep's calls), each independently addable/removable.
export type DashboardOverview = "reps" | "competitors" | "objections" | "calls";

export interface DashboardParams {
  dateFrom?: string;
  dateTo?: string;
  overviews?: DashboardOverview[];
  repCards?: string[];
  competitorCards?: string[];
  objectionCards?: string[];
  // default rep filter applied to every objectionCard on this dashboard
  // (each card also has its own local "Rep" dropdown that can override it) —
  // lets "show all of Sarah's objection types" resolve to real data instead
  // of just being an unfilterable aggregate
  objectionRepFilter?: string;
  // each entry is a rep name — the granular "calls" card is a rep-filtered
  // call list, reusing the same picker as repCards rather than inventing a
  // separate multi-field filter UI
  callCards?: string[];
}

// The show_dashboard tool speaks deltas, not full replacement state — the
// model says what changed ("add Allstate"), the server merges it onto
// whatever's actually persisted. This is the fix for a real bug: requiring
// the model to reconstruct and resend the *entire* existing params object on
// every update is fragile (it has to correctly recall everything already on
// the dashboard from the system-prompt JSON and retype it losslessly) and
// silently drops content when it doesn't. A direct UI edit (the REST PATCH
// route) doesn't need this — it always operates on the real current params,
// not a recollection of them — so it keeps using plain full-replacement.
export interface DashboardDelta {
  title?: string;
  dateFrom?: string;
  dateTo?: string;
  // wipes all overviews/cards before applying the adds below — for "start
  // over" requests like "remove everything and add David's stats"
  clear?: boolean;
  addOverviews?: DashboardOverview[];
  removeOverviews?: DashboardOverview[];
  addRepCards?: string[];
  removeRepCards?: string[];
  addCompetitorCards?: string[];
  removeCompetitorCards?: string[];
  addObjectionCards?: string[];
  removeObjectionCards?: string[];
  objectionRepFilter?: string;
  addCallCards?: string[];
  removeCallCards?: string[];
}

function applyList<T>(current: T[] | undefined, add: T[] | undefined, remove: T[] | undefined): T[] | undefined {
  let next = current ?? [];
  if (remove?.length) next = next.filter((x) => !remove.includes(x));
  if (add?.length) for (const a of add) if (!next.includes(a)) next = [...next, a];
  return next.length > 0 ? next : undefined;
}

export function applyDashboardDelta(
  existing: DashboardParams,
  delta: DashboardDelta
): DashboardParams {
  const base: DashboardParams = delta.clear
    ? { dateFrom: existing.dateFrom, dateTo: existing.dateTo }
    : existing;

  return {
    dateFrom: delta.dateFrom ?? base.dateFrom,
    dateTo: delta.dateTo ?? base.dateTo,
    overviews: applyList(base.overviews, delta.addOverviews, delta.removeOverviews),
    repCards: applyList(base.repCards, delta.addRepCards, delta.removeRepCards),
    competitorCards: applyList(
      base.competitorCards,
      delta.addCompetitorCards,
      delta.removeCompetitorCards
    ),
    objectionCards: applyList(
      base.objectionCards,
      delta.addObjectionCards,
      delta.removeObjectionCards
    ),
    objectionRepFilter: delta.objectionRepFilter ?? base.objectionRepFilter,
    callCards: applyList(base.callCards, delta.addCallCards, delta.removeCallCards),
  };
}
