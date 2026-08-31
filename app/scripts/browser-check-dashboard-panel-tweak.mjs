import { chromium } from "playwright";
const OUT_DIR = "/private/tmp/claude-501/-Users-hayden-VoiceOps-Take-Home-Project/cd74c720-6b61-40dd-bc6e-2efa33b5ec8c/scratchpad";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto("http://localhost:3000");

// reopen the persisted dashboard from the header list (no chat message at all this time)
await page.locator("text=/Dashboards \\(/").click();
await page.waitForTimeout(300);
await page.getByText("David", { exact: false }).last().click();
await page.waitForSelector(".recharts-wrapper", { timeout: 10000 });
await page.waitForTimeout(400);

// click "All reps" then drill into a different rep directly in the panel — no chat involved
await page.getByText("All reps", { exact: true }).click();
await page.waitForTimeout(400);
await page.locator(".recharts-bar-rectangle").nth(2).click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT_DIR}/persist-05-panel-direct-tweak.png` });

await browser.close();
console.log("done");
