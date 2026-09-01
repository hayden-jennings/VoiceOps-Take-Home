import { chromium } from "playwright";
const OUT_DIR = "/private/tmp/claude-501/-Users-hayden-VoiceOps-Take-Home-Project/cd74c720-6b61-40dd-bc6e-2efa33b5ec8c/scratchpad";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 700 } });
await page.goto("http://localhost:3000");

async function ask(q) {
  await page.getByPlaceholder("Ask something...").fill(q);
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/chat")),
    page.getByPlaceholder("Ask something...").press("Enter"),
  ]);
  await page.waitForSelector('input:not([disabled])', { timeout: 30000 });
  await page.waitForTimeout(300);
}

await ask("How is Sarah doing this month?");
await ask("What are reps saying when customers bring up State Farm?");

// scroll to top so real content sits right at the bottom edge, not just whitespace
await page.evaluate(() => {
  const el = document.querySelector('.overflow-y-auto');
  el.scrollTop = 0;
});
await page.waitForTimeout(200);
await page.screenshot({ path: `${OUT_DIR}/fade-regression-check.png` });

await browser.close();
console.log("done");
