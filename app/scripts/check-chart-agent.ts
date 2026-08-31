import { runAgentLoop } from "@/lib/agentLoop";

async function main() {
  const question = "Show me a chart comparing call counts across reps this month.";
  console.log(`=== ${question} ===`);
  for await (const event of runAgentLoop([{ role: "user", content: question }])) {
    if (event.type === "tool_status") console.log(`[tool] ${event.label}`);
    else if (event.type === "text") console.log(`[text] ${event.text}`);
    else if (event.type === "image") console.log(`[image] ${event.url} (${event.alt})`);
    else if (event.type === "error") console.log(`[error] ${event.message}`);
  }
  process.exit(0);
}

main();
