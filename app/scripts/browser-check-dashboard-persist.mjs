import { chromium } from "playwright";
const OUT_DIR = "/private/tmp/claude-501/-Users-hayden-VoiceOps-Take-Home-Project/cd74c720-6b61-40dd-bc6e-2efa33b5ec8c/scratchpad";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto("http://localhost:3000");

console.log("--- STEP 1: create a dashboard via chat ---");
await page.getByPlaceholder("Ask something...").fill("Open a scorecard dashboard for Maria.");
await Promise.all([
  page.waitForResponse((r) => r.url().includes("/api/chat")),
  page.getByPlaceholder("Ask something...").press("Enter"),
]);
await page.waitForSelector('input:not([disabled])', { timeout: 30000 });
await page.waitForTimeout(500);
await page.waitForSelector(".recharts-wrapper", { timeout: 10000 });
await page.screenshot({ path: `${OUT_DIR}/persist-01-created.png` });
console.log("dashboard panel visible after creation: yes");

console.log("--- STEP 2: genuine hard reload (page.reload()) ---");
await page.reload();
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT_DIR}/persist-02-after-reload.png` });

const panelGoneAfterReload = await page.locator(".recharts-wrapper").count();
console.log("recharts elements visible immediately after reload (should be 0 - fresh client state):", panelGoneAfterReload);

const reopenButtonText = await page.locator("text=/Dashboards \\(/").textContent().catch(() => null);
console.log("reopen button text (from persisted list fetched fresh after reload):", reopenButtonText);

console.log("--- STEP 3: reopen the persisted dashboard ---");
await page.locator("text=/Dashboards \\(/").click();
await page.waitForTimeout(300);
await page.getByText("Maria", { exact: false }).last().click();
await page.waitForSelector(".recharts-wrapper", { timeout: 10000 });
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT_DIR}/persist-03-reopened.png` });
console.log("dashboard reopened from persisted list: yes");

console.log("--- STEP 4: tweak via CHAT after reload (no prior chat history in this fresh page) ---");
await page.getByPlaceholder("Ask something...").fill("Update that dashboard to show David instead.");
await Promise.all([
  page.waitForResponse((r) => r.url().includes("/api/chat")),
  page.getByPlaceholder("Ask something...").press("Enter"),
]);
await page.waitForSelector('input:not([disabled])', { timeout: 30000 });
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT_DIR}/persist-04-tweaked-via-chat.png` });

await browser.close();
console.log("done");
