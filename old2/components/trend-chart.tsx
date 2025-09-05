"use client"

import { useMemo } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/old2/components/ui/card"
import { XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"
import dynamic from 'next/dynamic';
import { type RasterRecord, padToThousand } from "@/old2/lib/mock-utils"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/old2/components/ui/chart"

// Dynamic import for Recharts components
const LineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false });

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function TrendChart() {
  const { data } = useSWR<RasterRecord[]>("/data/mock_rasters.json", fetcher)
  const records = data ? padToThousand(data) : []

  // mock yearly trend from last 10 entries across cells
  const series = useMemo(() => {
    const years = Array.from({ length: 10 }, (_, i) => 2015 + i)
    const items = years.map((yearIdx) => {
      const idx = yearIdx - 2015
      const avgAs = average(records.map((r) => r.Trend_Data[idx] ?? r.Trend_Data.at(-1) ?? 0))
      const avgPb = average(records.map((r) => r.Heavy_Metals.Pb ?? 0))
      return { year: years[idx], As: Number(avgAs?.toFixed(4) ?? 0), Pb: Number(avgPb?.toFixed(4) ?? 0) }
    })
    return items
  }, [records])

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-balance">Nationwide Contamination Trend (Mock)</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          className="h-[280px]"
          config={{
            As: { label: "Arsenic (mg/L)", color: "hsl(var(--chart-1))" },
            Pb: { label: "Lead (mg/L)", color: "hsl(var(--chart-2))" },
          }}
        >
          <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ left: 12, right: 12, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line dataKey="As" stroke="var(--color-As)" strokeWidth={2} dot={false} />
                <Line dataKey="Pb" stroke="var(--color-Pb)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function average(arr: number[]) {
  if (!arr.length) return 0
  const sum = arr.reduce((a, b) => a + (isFinite(b) ? b : 0), 0)
  return sum / arr.length
}
