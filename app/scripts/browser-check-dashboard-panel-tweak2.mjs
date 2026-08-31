import { chromium } from "playwright";
const OUT_DIR = "/private/tmp/claude-501/-Users-hayden-VoiceOps-Take-Home-Project/cd74c720-6b61-40dd-bc6e-2efa33b5ec8c/scratchpad";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto("http://localhost:3000");

await page.locator("text=/Dashboards \\(/").click();
await page.waitForTimeout(300);
await page.getByText("David", { exact: false }).last().click();
await page.waitForSelector(".recharts-wrapper", { timeout: 10000 });
await page.waitForTimeout(500);

const bars = page.locator(".recharts-bar-rectangle");
console.log("bar count:", await bars.count());
const targetBar = bars.nth(3);
const box = await targetBar.boundingBox();
console.log("target bar bounding box:", box);

const [patchResponse] = await Promise.all([
  page.waitForResponse(
    (r) => r.url().includes("/api/dashboards/") && r.request().method() === "PATCH",
    { timeout: 10000 }
  ),
  page.mouse.click(box.x + box.width / 2, box.y + box.height / 2),
]);
console.log("PATCH response status:", patchResponse.status());
const patchBody = await patchResponse.json();
console.log("PATCH response body:", JSON.stringify(patchBody));

await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT_DIR}/persist-06-panel-direct-tweak-v2.png` });

await browser.close();
console.log("done");
