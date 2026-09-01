import { chromium } from "playwright";
const OUT_DIR = "/private/tmp/claude-501/-Users-hayden-VoiceOps-Take-Home-Project/cd74c720-6b61-40dd-bc6e-2efa33b5ec8c/scratchpad";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
await page.goto("http://localhost:3000/dashboard-demo");
await page.waitForSelector(".recharts-wrapper", { timeout: 10000 });
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT_DIR}/preset-1-default.png` });

const labels = [
  "default, repName set (backward compat)",
  "call_volume + leaderboard together",
  "skill_scores + leaderboard, repName set",
];
for (let i = 0; i < labels.length; i++) {
  await page.getByText(labels[i], { exact: true }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT_DIR}/preset-${i + 2}.png`, fullPage: true });
}

await browser.close();
console.log("done");
