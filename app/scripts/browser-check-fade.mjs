import { chromium } from "playwright";
const OUT_DIR = "/private/tmp/claude-501/-Users-hayden-VoiceOps-Take-Home-Project/cd74c720-6b61-40dd-bc6e-2efa33b5ec8c/scratchpad";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 700 } });
await page.goto("http://localhost:3000");
await page.screenshot({ path: `${OUT_DIR}/final-empty.png` });

const questions = [
  "How is Sarah doing this month?",
  "What are reps saying when customers bring up State Farm?",
];
for (const q of questions) {
  await page.getByPlaceholder("Ask something...").fill(q);
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/chat")),
    page.getByPlaceholder("Ask something...").press("Enter"),
  ]);
  if (q === questions[0]) {
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT_DIR}/final-streaming.png` }); // catch breathing logo mid-stream
  }
  await page.waitForSelector('input:not([disabled])', { timeout: 30000 });
  await page.waitForTimeout(300);
}

// now content should overflow the 700px viewport -> scroll to top to test fade while scrolled away from bottom
await page.evaluate(() => {
  const scrollEl = document.querySelector('.overflow-y-auto');
  scrollEl.scrollTop = 0;
});
await page.waitForTimeout(200);
await page.screenshot({ path: `${OUT_DIR}/final-scrolled-top.png` });

// scroll back to bottom
await page.evaluate(() => {
  const scrollEl = document.querySelector('.overflow-y-auto');
  scrollEl.scrollTop = scrollEl.scrollHeight;
});
await page.waitForTimeout(200);
await page.screenshot({ path: `${OUT_DIR}/final-scrolled-bottom.png` });

await browser.close();
console.log("done");
