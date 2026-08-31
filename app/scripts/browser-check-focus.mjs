import { chromium } from "playwright";
const OUT_DIR = "/private/tmp/claude-501/-Users-hayden-VoiceOps-Take-Home-Project/cd74c720-6b61-40dd-bc6e-2efa33b5ec8c/scratchpad";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto("http://localhost:3000");

const q = "How is Sarah doing this month?";
await page.getByPlaceholder("Ask something...").fill(q);
await Promise.all([
  page.waitForResponse((r) => r.url().includes("/api/chat")),
  page.getByPlaceholder("Ask something...").press("Enter"),
]);
await page.waitForSelector('input:not([disabled])', { timeout: 30000 });
await page.waitForTimeout(500);

const isFocused = await page.evaluate(() => document.activeElement?.tagName === "INPUT");
console.log("input focused:", isFocused);
await page.screenshot({ path: `${OUT_DIR}/ui-focus-check.png` });

await browser.close();
