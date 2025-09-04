// Placeholder export route - left as a stub for server-side export in future.
import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json({
    ok: true,
    note: "Use client-side Export modal for CSV/JSON; server export can be added later.",
  })
}
