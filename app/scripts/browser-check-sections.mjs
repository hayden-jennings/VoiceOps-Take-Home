import { chromium } from "playwright";
const OUT_DIR = "/private/tmp/claude-501/-Users-hayden-VoiceOps-Take-Home-Project/cd74c720-6b61-40dd-bc6e-2efa33b5ec8c/scratchpad";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 1400 } });
await page.goto("http://localhost:3000/dashboard-demo");
await page.waitForSelector(".recharts-wrapper", { timeout: 10000 });
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT_DIR}/sections-check.png`, fullPage: true });
await browser.close();
console.log("done");
