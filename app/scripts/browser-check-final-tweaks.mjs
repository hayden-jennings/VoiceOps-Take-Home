import { chromium } from "playwright";
const OUT_DIR = "/private/tmp/claude-501/-Users-hayden-VoiceOps-Take-Home-Project/cd74c720-6b61-40dd-bc6e-2efa33b5ec8c/scratchpad";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto("http://localhost:3000");

// Create a dashboard with zero chat interaction — chat should stay centered
await page.getByRole("button", { name: /^Dashboards/ }).click();
await page.waitForTimeout(200);
await page.getByText("+ New dashboard", { exact: true }).click();
await page.waitForTimeout(200);
await page.selectOption("select", "rep_scorecard");
await Promise.all([
  page.waitForResponse((r) => r.url().includes("/api/dashboards") && r.request().method() === "POST"),
  page.getByRole("button", { name: "Create", exact: true }).click(),
]);
await page.waitForSelector(".recharts-wrapper", { timeout: 10000 });
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT_DIR}/final-01-dashboard-only-centered.png` });

// Now send a chat message — chat should switch to scrolling layout, panel stays
await page.getByPlaceholder("Ask something...").fill("How is Sarah doing?");
await Promise.all([
  page.waitForResponse((r) => r.url().includes("/api/chat")),
  page.getByPlaceholder("Ask something...").press("Enter"),
]);
await page.waitForSelector('input:not([disabled])', { timeout: 30000 });
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT_DIR}/final-02-chat-plus-dashboard.png` });

// Close the dashboard with the X button
await page.locator('button[aria-label="Close dashboard"]').click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT_DIR}/final-03-closed-via-x.png` });

await browser.close();
console.log("done");
