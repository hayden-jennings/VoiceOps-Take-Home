import { chromium } from "playwright";
const OUT_DIR = "/private/tmp/claude-501/-Users-hayden-VoiceOps-Take-Home-Project/cd74c720-6b61-40dd-bc6e-2efa33b5ec8c/scratchpad";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
await page.goto("http://localhost:3000/dashboard-demo");
await page.waitForSelector(".recharts-wrapper", { timeout: 10000 });
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT_DIR}/dashboard-all-reps.png` });

// click the first bar (top rep) to drill in
const firstBar = page.locator(".recharts-bar-rectangle").first();
await firstBar.click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT_DIR}/dashboard-single-rep.png` });

const paramsText = await page.locator("text=/params:/").textContent();
console.log("params after drill-down:", paramsText);

await browser.close();
console.log("done");
