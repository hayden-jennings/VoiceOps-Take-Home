import { chromium } from "playwright";
const OUT_DIR = "/private/tmp/claude-501/-Users-hayden-VoiceOps-Take-Home-Project/cd74c720-6b61-40dd-bc6e-2efa33b5ec8c/scratchpad";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto("http://localhost:3000");

// Header always shows the Dashboards control now (empty state, no persisted dashboards yet)
await page.screenshot({ path: `${OUT_DIR}/fgh-01-empty-header.png` });

// Open the menu, create a new dashboard — no chat involved
await page.getByRole("button", { name: /^Dashboards/ }).click();
await page.waitForTimeout(200);
await page.getByText("+ New dashboard", { exact: true }).click();
await page.waitForTimeout(200);
await page.selectOption("select", "competitive_intelligence");
await page.waitForTimeout(100);
const filterInput = page.locator('input[placeholder="Competitor name"]');
await filterInput.fill("State Farm");
await page.screenshot({ path: `${OUT_DIR}/fgh-02-create-form.png` });

const [createResponse] = await Promise.all([
  page.waitForResponse((r) => r.url().includes("/api/dashboards") && r.request().method() === "POST"),
  page.getByRole("button", { name: "Create", exact: true }).click(),
]);
console.log("create POST status:", createResponse.status());
console.log("create POST body:", JSON.stringify(await createResponse.json()));

await page.waitForSelector(".recharts-wrapper", { timeout: 10000 });
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT_DIR}/fgh-03-created-panel.png` });

// Reload and check the gallery shows it with view label + relative time
await page.reload();
await page.waitForTimeout(500);
await page.getByRole("button", { name: /^Dashboards/ }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT_DIR}/fgh-04-gallery.png` });

await browser.close();
console.log("done");
