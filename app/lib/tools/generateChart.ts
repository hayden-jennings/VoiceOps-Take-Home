import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import type { ChartConfiguration, Plugin } from "chart.js/auto";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { MONOCHROME, CHROME, FONT_FAMILY } from "@/lib/chartTheme";
import { ToolResult } from "@/lib/types";

// Logical size — devicePixelRatio below scales the actual PNG buffer up
// (retinaScale multiplies canvas.width/height and applies a ctx transform),
// so every font size / radius / padding value below stays in these same
// logical units and renders crisply at the higher resolution automatically.
const WIDTH = 800;
const HEIGHT = 450;
const DEVICE_PIXEL_RATIO = 3;

const canvasRenderer = new ChartJSNodeCanvas({
  width: WIDTH,
  height: HEIGHT,
  backgroundColour: CHROME.surface,
  chartCallback: (ChartJS) => {
    ChartJS.defaults.font.family = FONT_FAMILY;
    ChartJS.defaults.color = CHROME.secondaryInk;
  },
});

// Registered once at module load. Only the variable-weight file was available
// (no static Bold instance), so Cairo renders a single weight regardless of
// font.weight requests — hierarchy leans on size/color instead of true bold.
canvasRenderer.registerFont(
  path.join(process.cwd(), "assets", "fonts", "Inter.ttf"),
  { family: "Inter" },
);

// Wraps a category label onto multiple lines so Chart.js renders it centered
// under its bar/group instead of auto-rotating it diagonally when it doesn't
// fit on one line. Only needed on the x-axis — the y-axis (horizontal charts)
// already gives each category a full row of width.
function wrapLabel(label: string, maxCharsPerLine = 12): string | string[] {
  const words = label.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.length > 1 ? lines : label;
}

const cardBorderPlugin: Plugin = {
  id: "cardBorder",
  beforeDraw(chart) {
    const { ctx, width, height } = chart;
    ctx.save();
    ctx.strokeStyle = "rgba(11,11,11,0.08)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
    ctx.restore();
  },
};

export interface ChartSpec {
  type: "bar" | "line" | "stacked_bar";
  title: string;
  labels: string[];
  series: { name: string; data: number[] }[];
}

export interface GeneratedChart {
  url: string;
  title: string;
}

export async function generateChart(
  spec: ChartSpec,
): Promise<ToolResult<GeneratedChart>> {
  try {
    const isLine = spec.type === "line";
    let labels = [...spec.labels];
    let series = spec.series.map((s) => ({ ...s }));
    let isStacked = spec.type === "stacked_bar";

    // A single-row stacked bar (one category, N segments) is hard to compare —
    // segments don't share a baseline. Treat each series as its own bar instead.
    if (isStacked && labels.length === 1) {
      const values = series.map((s) => s.data[0]);
      labels = series.map((s) => s.name);
      series = [{ name: spec.labels[0], data: values }];
      isStacked = false;
    }

    // Single-series bar comparisons read best sorted largest-to-smallest and
    // horizontal (matches the layout that reviewed well).
    const isSingleSeriesBar = !isLine && series.length === 1 && !isStacked;
    if (isSingleSeriesBar) {
      const paired = labels
        .map((label, i) => ({ label, value: series[0].data[i] }))
        .sort((a, b) => b.value - a.value);
      labels = paired.map((p) => p.label);
      series = [{ name: series[0].name, data: paired.map((p) => p.value) }];
    }

    const multiSeries = series.length > 1;
    const horizontal = isStacked || isSingleSeriesBar;

    let colorSlot = 0;
    const datasets = series.map((s) => {
      const color = MONOCHROME[colorSlot++ % MONOCHROME.length];
      if (isLine) {
        return {
          label: s.name,
          data: s.data,
          borderColor: color,
          backgroundColor: color + "1a",
          fill: !multiSeries,
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: color,
          pointBorderColor: CHROME.surface,
          pointBorderWidth: 2,
          pointStyle: "circle" as const,
          tension: 0.15,
        };
      }
      return {
        label: s.name,
        data: s.data,
        backgroundColor: color,
        borderRadius: 6,
        borderSkipped: "start" as const,
        barPercentage: 0.55,
        categoryPercentage: 0.7,
        pointStyle: "circle" as const,
      };
    });

    const valueAxisKey = horizontal ? "x" : "y";
    const categoryAxisKey = horizontal ? "y" : "x";

    // wrap only when categories sit on the x-axis — the y-axis (horizontal
    // charts) already has a full row of width per category
    const chartLabels = categoryAxisKey === "x" ? labels.map((l) => wrapLabel(l)) : labels;

    const configuration: ChartConfiguration = {
      type: isLine ? "line" : "bar",
      data: { labels: chartLabels, datasets },
      plugins: [cardBorderPlugin],
      options: {
        devicePixelRatio: DEVICE_PIXEL_RATIO,
        indexAxis: horizontal ? "y" : "x",
        layout: { padding: { top: 24, right: 36, bottom: 24, left: 36 } },
        plugins: {
          title: {
            display: true,
            text: spec.title,
            color: CHROME.primaryInk,
            font: { size: 18, weight: "bold" },
            padding: { bottom: 24 },
          },
          legend: {
            display: multiSeries,
            position: "bottom",
            labels: {
              color: CHROME.secondaryInk,
              usePointStyle: true,
              pointStyle: "circle",
              boxWidth: 8,
              boxHeight: 8,
              padding: 20,
              font: { size: 12 },
            },
          },
        },
        scales: {
          [valueAxisKey]: {
            stacked: isStacked,
            grid: { color: CHROME.gridline + "99" },
            border: { display: false },
            ticks: { color: CHROME.mutedInk, font: { size: 11 } },
            beginAtZero: true,
          },
          [categoryAxisKey]: {
            stacked: isStacked,
            grid: { display: false },
            border: { display: false },
            ticks: {
              color: CHROME.mutedInk,
              font: { size: 12 },
              maxRotation: 0,
              minRotation: 0,
              autoSkip: false,
            },
          },
        },
      },
    };

    const buffer = await canvasRenderer.renderToBuffer(configuration);

    const dir = path.join(process.cwd(), "public", "generated");
    await mkdir(dir, { recursive: true });
    const filename = `${randomUUID()}.png`;
    await writeFile(path.join(dir, filename), buffer);

    return {
      ok: true,
      data: { url: `/generated/${filename}`, title: spec.title },
    };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
