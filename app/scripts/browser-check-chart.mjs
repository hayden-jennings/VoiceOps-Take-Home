import { chromium } from "playwright";
import { mkdirSync } from "fs";

const OUT_DIR = "/private/tmp/claude-501/-Users-hayden-VoiceOps-Take-Home-Project/cd74c720-6b61-40dd-bc6e-2efa33b5ec8c/scratchpad";
mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1100 } });
await page.goto("http://localhost:3000");

const q = "Show me a chart comparing call counts across reps this month.";
const prevCount = await page.locator(".prose, img").count();
await page.getByPlaceholder("Ask something...").fill(q);
await Promise.all([
  page.waitForResponse((r) => r.url().includes("/api/chat")),
  page.getByPlaceholder("Ask something...").press("Enter"),
]);

// wait until an <img> appears and the trailing text has landed
await page.waitForSelector("img", { timeout: 30000 });
await page.waitForFunction(
  (count) => document.querySelectorAll(".prose, img").length >= count,
  prevCount + 2,
  { timeout: 30000 }
);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT_DIR}/chart-inline.png`, fullPage: true });

await browser.close();
console.log("done");
