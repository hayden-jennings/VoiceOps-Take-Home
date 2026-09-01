import { readFile } from "fs/promises";
import path from "path";

// Serves files written at runtime by generate_chart. Next.js's production
// server (next start, Turbopack) only serves public/ assets that existed at
// build time — a runtime-written PNG 404s even though it's really on disk.
// This route sidesteps that entirely by reading the file directly on every
// request, which works identically in dev and production.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // reject path traversal / anything that isn't a plain generated filename
  if (filename.includes("/") || filename.includes("..")) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const filePath = path.join(process.cwd(), "public", "generated", filename);
    const buffer = await readFile(filePath);
    return new Response(new Uint8Array(buffer), {
      headers: { "Content-Type": "image/png" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
