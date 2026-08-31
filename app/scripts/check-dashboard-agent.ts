import { runAgentLoop } from "@/lib/agentLoop";

async function main() {
  const question = "Open a scorecard dashboard for Sarah.";
  console.log(`=== ${question} ===`);
  for await (const event of runAgentLoop([{ role: "user", content: question }])) {
    if (event.type === "tool_status") console.log(`[tool] ${event.label}`);
    else if (event.type === "text") console.log(`[text] ${event.text}`);
    else if (event.type === "dashboard")
      console.log(`[dashboard] id=${event.instanceId} view=${event.view} title="${event.title}" params=${JSON.stringify(event.params)}`);
    else if (event.type === "error") console.log(`[error] ${event.message}`);
  }
  process.exit(0);
}

main();
