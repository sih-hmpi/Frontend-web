// Placeholder for real-time alerts (e.g., from a queue or cron).
import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    alerts: [
      { id: "a1", region: "Punjab", metal: "Pb", message: "Lead levels rising in Punjab (mock)" },
      { id: "a2", region: "West Bengal", metal: "As", message: "Arsenic exceedance pockets persist (mock)" },
    ],
  })
}
