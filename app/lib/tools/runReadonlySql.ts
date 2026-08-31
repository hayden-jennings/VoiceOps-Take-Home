import { dbReadonly } from "@/lib/db";
import { ToolResult } from "@/lib/types";

const MAX_ROWS = 200;

function isSingleSelectStatement(query: string): boolean {
  const trimmed = query.trim().replace(/;\s*$/, "");
  if (trimmed.includes(";")) return false;
  return /^(select|with)\b/i.test(trimmed);
}

export interface SqlQueryResult {
  rows: Record<string, unknown>[];
  truncated: boolean;
}

export async function runReadonlySql(
  query: string
): Promise<ToolResult<SqlQueryResult>> {
  if (!isSingleSelectStatement(query)) {
    return {
      ok: false,
      error: "Only a single SELECT (or WITH ... SELECT) statement is allowed.",
    };
  }
  try {
    const result = await dbReadonly.query(query);
    return {
      ok: true,
      data: {
        rows: result.rows.slice(0, MAX_ROWS),
        truncated: result.rows.length > MAX_ROWS,
      },
    };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
