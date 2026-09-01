import { runAgentLoop } from "@/lib/agentLoop";

async function ask(question: string) {
  console.log(`\n=== ${question} ===`);
  for await (const event of runAgentLoop([{ role: "user", content: question }])) {
    if (event.type === "dashboard")
      console.log(`[dashboard] view=${event.view} params=${JSON.stringify(event.params)}`);
  }
}

async function main() {
  await ask("Open a dashboard showing which reps are the best performers, quality-wise.");
  process.exit(0);
}
main();
