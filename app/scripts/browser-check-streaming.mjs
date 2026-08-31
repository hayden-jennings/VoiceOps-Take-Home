import { chromium } from "playwright";
import { mkdirSync } from "fs";

const OUT_DIR = "/private/tmp/claude-501/-Users-hayden-VoiceOps-Take-Home-Project/cd74c720-6b61-40dd-bc6e-2efa33b5ec8c/scratchpad";
mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto("http://localhost:3000");

await page.getByPlaceholder("Ask something...").fill("How is Sarah doing this month?");
await page.getByPlaceholder("Ask something...").press("Enter");

// capture frames every 400ms while the answer streams in
for (let i = 0; i < 8; i++) {
  await page.waitForTimeout(400);
  const text = await page.locator(".prose").last().innerText().catch(() => "(not yet rendered)");
  console.log(`frame ${i} (${(i + 1) * 400}ms): length=${text.length} chars`);
  await page.screenshot({ path: `${OUT_DIR}/stream-frame-${String(i).padStart(2, "0")}.png` });
}

await browser.close();
console.log("done");
