import { runAgentLoop } from "@/lib/agentLoop";

const QUESTIONS = [
  "How is Sarah doing this month?",
  "What are reps saying when customers bring up State Farm?",
  "Show me the calls where someone tried to save a renewal and lost it.",
];

async function ask(question: string) {
  console.log(`\n=== ${question} ===`);
  for await (const event of runAgentLoop([{ role: "user", content: question }])) {
    if (event.type === "tool_status") console.log(`[tool] ${event.label}`);
    else if (event.type === "text") console.log(`[answer]\n${event.text}`);
    else if (event.type === "error") console.log(`[error] ${event.message}`);
  }
}

async function main() {
  for (const q of QUESTIONS) {
    await ask(q);
  }
  process.exit(0);
}

main();
