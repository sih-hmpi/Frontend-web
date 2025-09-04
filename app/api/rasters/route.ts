// Placeholder backend API. Currently not used (client fetches /data/mock_rasters.json).
import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json(
    { message: "Replace with real rasters API. Client currently loads /data/mock_rasters.json." },
    { status: 200 },
  )
}
