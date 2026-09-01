import { chromium } from "playwright";
const OUT_DIR = "/private/tmp/claude-501/-Users-hayden-VoiceOps-Take-Home-Project/cd74c720-6b61-40dd-bc6e-2efa33b5ec8c/scratchpad";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 1400 } });

// modify dashboard-demo to accept a params override via URL is overkill; instead
// drive it through the real app via direct API calls to create+view instances
async function createDashboard(view, params, title) {
  const res = await fetch("http://localhost:3000/api/dashboards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ view, title, params }),
  }).catch(() => null);
  return res;
}

// check if POST /api/dashboards exists yet (it's step F, not built) — if not, fall back
const testRes = await fetch("http://localhost:3000/api/dashboards", { method: "POST" }).catch(() => null);
console.log("POST /api/dashboards status (expected: not found/405 until step F):", testRes ? testRes.status : "fetch failed");

await browser.close();
