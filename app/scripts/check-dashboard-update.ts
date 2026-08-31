import { showDashboard } from "@/lib/tools/showDashboard";

async function main() {
  const created = await showDashboard({
    view: "rep_scorecard",
    title: "Test — Scorecard",
    params: { repName: "Robert" },
  });
  console.log("created:", JSON.stringify(created, null, 2));

  if (created.ok) {
    const updated = await showDashboard({
      view: "rep_scorecard",
      title: "Test — Scorecard (This Month)",
      params: { repName: "Robert", dateFrom: "2026-08-01" },
      instanceId: created.data.instanceId,
    });
    console.log("updated:", JSON.stringify(updated, null, 2));
  }

  const badUpdate = await showDashboard({
    view: "rep_scorecard",
    title: "x",
    params: {},
    instanceId: 999999,
  });
  console.log("update nonexistent id:", JSON.stringify(badUpdate, null, 2));

  process.exit(0);
}

main();
