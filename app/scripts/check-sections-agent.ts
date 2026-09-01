import { runAgentLoop } from "@/lib/agentLoop";

async function ask(question: string, openDashboards: any[] = []) {
  console.log(`\n=== ${question} ===`);
  let lastDashboard: any = null;
  for await (const event of runAgentLoop([{ role: "user", content: question }], openDashboards)) {
    if (event.type === "tool_status") console.log(`[tool] ${event.label}`);
    else if (event.type === "text") console.log(`[text] ${event.text}`);
    else if (event.type === "dashboard") {
      console.log(`[dashboard] id=${event.instanceId} view=${event.view} params=${JSON.stringify(event.params)}`);
      lastDashboard = event;
    }
    else if (event.type === "error") console.log(`[error] ${event.message}`);
  }
  return lastDashboard;
}

async function main() {
  await ask("Who's busiest on my team this quarter?");
  await ask("Who's my top performing rep by quality, not volume?");

  const d1 = await ask("Open Sarah Johnson's scorecard.");
  if (d1) {
    await ask("Also add the leaderboard to that dashboard so I can see how she compares.", [
      { instanceId: d1.instanceId, view: d1.view, title: d1.title, params: d1.params },
    ]);
  }

  process.exit(0);
}
main();
