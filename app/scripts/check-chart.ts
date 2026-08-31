import { generateChart } from "@/lib/tools/generateChart";

async function main() {
  const bar = await generateChart({
    type: "bar",
    title: "Skill Scores — Sarah Johnson",
    labels: ["Discovery", "Objection", "Price", "Closing", "Empathy"],
    series: [{ name: "Good scores", data: [7, 9, 15, 12, 6] }],
  });
  console.log("bar:", JSON.stringify(bar, null, 2));

  const stacked = await generateChart({
    type: "stacked_bar",
    title: "Call Disposition Mix",
    labels: ["Sarah", "Robert", "Maria"],
    series: [
      { name: "Sale", data: [4, 3, 5] },
      { name: "Follow Up", data: [4, 6, 2] },
      { name: "No Sale", data: [4, 3, 4] },
    ],
  });
  console.log("stacked:", JSON.stringify(stacked, null, 2));

  const status = await generateChart({
    type: "stacked_bar",
    title: "Sarah Johnson — Coaching Score Breakdown",
    labels: [
      "Discovery Questions",
      "Objection Handling",
      "Price Presentation",
      "Closing Technique",
      "Product Knowledge",
    ],
    series: [
      { name: "Good", data: [7, 9, 15, 12, 13] },
      { name: "Needs Improvement", data: [5, 3, 2, 3, 2] },
      { name: "Critical", data: [3, 5, 6, 4, 0] },
    ],
  });
  console.log("status:", JSON.stringify(status, null, 2));

  // single-row breakdown — should auto-convert to a sorted horizontal bar,
  // not render as a one-row stacked bar with 5 segments
  const dispositionMix = await generateChart({
    type: "stacked_bar",
    title: "Call Disposition Mix — This Month",
    labels: ["All calls"],
    series: [
      { name: "Sale", data: [42] },
      { name: "Follow Up", data: [61] },
      { name: "No Sale", data: [38] },
      { name: "Voicemail", data: [24] },
      { name: "Transfer", data: [11] },
    ],
  });
  console.log("dispositionMix:", JSON.stringify(dispositionMix, null, 2));

  // grouped vertical bar with long category labels — the case from the screenshot
  const grouped = await generateChart({
    type: "bar",
    title: "Sarah Johnson — Coaching Skill Breakdown",
    labels: [
      "Closing Technique",
      "Objection Handling",
      "Product Knowledge",
      "Price Presentation",
      "Empathy & Rapport",
      "Discovery Questions",
    ],
    series: [
      { name: "Good", data: [7, 4, 8, 2, 4, 4] },
      { name: "Needs Improvement", data: [1, 3, 1, 0, 0, 1] },
      { name: "Critical", data: [0, 2, 0, 1, 0, 1] },
    ],
  });
  console.log("grouped:", JSON.stringify(grouped, null, 2));

  process.exit(0);
}

main();
