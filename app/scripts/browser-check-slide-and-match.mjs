import { chromium } from "playwright";
const OUT_DIR = "/private/tmp/claude-501/-Users-hayden-VoiceOps-Take-Home-Project/cd74c720-6b61-40dd-bc6e-2efa33b5ec8c/scratchpad";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto("http://localhost:3000");
await page.screenshot({ path: `${OUT_DIR}/slide-00-before.png` });

// test the rep-matching fix via real chat
await page.getByPlaceholder("Ask something...").fill("Create a dashboard for sara.");
await Promise.all([
  page.waitForResponse((r) => r.url().includes("/api/chat")),
  page.getByPlaceholder("Ask something...").press("Enter"),
]);
await page.waitForSelector('input:not([disabled])', { timeout: 30000 });
await page.waitForTimeout(500); // let the slide-in animation settle

await page.waitForSelector(".recharts-wrapper", { timeout: 10000 });
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT_DIR}/slide-01-after-open.png` });

// check the button moved (header right zone should now have border + width)
const buttonBox = await page.getByRole("button", { name: /^Dashboards/ }).boundingBox();
console.log("Dashboards button x position after open:", buttonBox.x);

await browser.close();
console.log("done");
