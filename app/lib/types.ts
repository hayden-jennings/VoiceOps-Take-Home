// Shared shape every tool function returns, so the agent loop (step 2) can
// handle success/failure the same way regardless of which tool ran.
export type ToolResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
