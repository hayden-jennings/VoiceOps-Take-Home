import { db } from "@/lib/db";
import { ToolResult } from "@/lib/types";

export interface Rep {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  supervisor: string | null;
  department: string | null;
}

export async function listReps(): Promise<ToolResult<Rep[]>> {
  try {
    const { rows } = await db.query(
      `select id, first_name, last_name, email, latest_supervisor, department
       from integration_persons
       order by first_name`
    );
    return {
      ok: true,
      data: rows.map((r) => ({
        id: r.id,
        firstName: r.first_name,
        lastName: r.last_name,
        email: r.email,
        supervisor: r.latest_supervisor,
        department: r.department,
      })),
    };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
