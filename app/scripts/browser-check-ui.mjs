import { chromium } from "playwright";
import { mkdirSync } from "fs";

const OUT_DIR = "/private/tmp/claude-501/-Users-hayden-VoiceOps-Take-Home-Project/cd74c720-6b61-40dd-bc6e-2efa33b5ec8c/scratchpad";
mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto("http://localhost:3000");
await page.screenshot({ path: `${OUT_DIR}/ui-empty.png` });

const q = "How is Sarah doing this month?";
await page.getByPlaceholder("Ask something...").fill(q);
await Promise.all([
  page.waitForResponse((r) => r.url().includes("/api/chat")),
  page.getByPlaceholder("Ask something...").press("Enter"),
]);
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT_DIR}/ui-streaming.png` });

// wait for the actual request lifecycle to finish (input re-enabled), not just first text chunk
await page.waitForSelector('input:not([disabled])', { timeout: 30000 });
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT_DIR}/ui-done.png` });

const isFocused = await page.evaluate(() => document.activeElement?.tagName === "INPUT");
console.log("input focused after send:", isFocused);

await browser.close();
console.log("done");
