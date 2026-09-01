import { chromium } from "playwright";
const OUT_DIR = "/private/tmp/claude-501/-Users-hayden-VoiceOps-Take-Home-Project/cd74c720-6b61-40dd-bc6e-2efa33b5ec8c/scratchpad";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 700 } });
await page.goto("http://localhost:3000");

await page.getByRole("button", { name: /^Dashboards/ }).click();
await page.waitForTimeout(200);
await page.getByText("+ New dashboard", { exact: true }).click();
await page.waitForTimeout(200);
await page.screenshot({ path: `${OUT_DIR}/menu-01-text-color.png` });

// click outside — the dropdown should close
await page.mouse.click(200, 400);
await page.waitForTimeout(300);
const stillOpen = await page.getByText("View", { exact: true }).isVisible().catch(() => false);
console.log("form still visible after clicking outside (should be false):", stillOpen);
await page.screenshot({ path: `${OUT_DIR}/menu-02-after-outside-click.png` });

await browser.close();
console.log("done");
