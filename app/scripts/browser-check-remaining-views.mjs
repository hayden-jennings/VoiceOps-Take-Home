import { chromium } from "playwright";
const OUT_DIR = "/private/tmp/claude-501/-Users-hayden-VoiceOps-Take-Home-Project/cd74c720-6b61-40dd-bc6e-2efa33b5ec8c/scratchpad";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto("http://localhost:3000");

async function ask(question) {
  await page.getByPlaceholder("Ask something...").fill(question);
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/chat")),
    page.getByPlaceholder("Ask something...").press("Enter"),
  ]);
  await page.waitForSelector('input:not([disabled])', { timeout: 30000 });
  await page.waitForTimeout(500);
}

console.log("--- Competitive Intelligence ---");
await ask("Open a competitive intelligence dashboard.");
await page.waitForSelector(".recharts-wrapper", { timeout: 10000 });
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT_DIR}/view-competitive-all.png` });
const ciBars = page.locator(".recharts-bar-rectangle");
const ciBox = await ciBars.nth(0).boundingBox();
await page.mouse.click(ciBox.x + ciBox.width / 2, ciBox.y + ciBox.height / 2);
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT_DIR}/view-competitive-drilldown.png` });

console.log("--- Objection Funnel ---");
await ask("Open an objection funnel dashboard.");
await page.waitForSelector(".recharts-wrapper", { timeout: 10000 });
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT_DIR}/view-objection-all.png` });
const ofBars = page.locator(".recharts-bar-rectangle");
const ofBox = await ofBars.nth(0).boundingBox();
await page.mouse.click(ofBox.x + ofBox.width / 2, ofBox.y + ofBox.height / 2);
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT_DIR}/view-objection-drilldown.png` });

console.log("--- Call Explorer ---");
await ask("Open a call explorer dashboard for calls where State Farm was mentioned.");
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT_DIR}/view-explorer-list.png` });
// click first call row
await page.locator("button:has-text('→')").first().click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT_DIR}/view-explorer-detail.png` });

await browser.close();
console.log("done");
