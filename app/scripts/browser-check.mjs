import { chromium } from "playwright";
import { mkdirSync } from "fs";

const OUT_DIR = "/private/tmp/claude-501/-Users-hayden-VoiceOps-Take-Home-Project/cd74c720-6b61-40dd-bc6e-2efa33b5ec8c/scratchpad";
mkdirSync(OUT_DIR, { recursive: true });

const QUESTIONS = [
  "How is Sarah doing this month?",
  "What are reps saying when customers bring up State Farm?",
  "Show me the calls where someone tried to save a renewal and lost it.",
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto("http://localhost:3000");
await page.screenshot({ path: `${OUT_DIR}/00-empty.png` });

for (let i = 0; i < QUESTIONS.length; i++) {
  const q = QUESTIONS[i];
  const prevCount = await page.locator(".prose").count();
  await page.getByPlaceholder("Ask something...").fill(q);
  const [response] = await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/chat")),
    page.getByPlaceholder("Ask something...").press("Enter"),
  ]);
  console.log(`Q${i + 1} status: ${response.status()}`);
  await page.waitForFunction(
    (count) => document.querySelectorAll(".prose").length > count,
    prevCount,
    { timeout: 30000 }
  );
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT_DIR}/${String(i + 1).padStart(2, "0")}-answer.png`, fullPage: true });
}

await browser.close();
console.log("done");
