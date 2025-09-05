"use client"

import useSWR from "swr"
import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/old2/components/ui/card"
import { Slider } from "@/old2/components/ui/slider"
import { type RasterRecord, padToThousand } from "@/old2/lib/mock-utils"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/old2/components/ui/chart"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function AnalyticsPage() {
  const { data } = useSWR<RasterRecord[]>("/data/mock_rasters.json", fetcher)
  const records = data ? padToThousand(data) : []
  const [year, setYear] = useState(2000)

  const timeSeries = useMemo(() => {
    // Synthesize a nationwide time series from 1980 -> present based on mock patterns
    const years = Array.from({ length: 46 }, (_, i) => 1980 + i)
    return years.map((y) => {
      const t = (y - 1980) / 46
      const as = 0.01 + 0.02 * Math.sin(t * Math.PI * 2) + 0.01 * t // mock
      const pb = 0.003 + 0.004 * Math.cos(t * Math.PI * 2) + 0.002 * t
      return { year: y, As: Number(as.toFixed(4)), Pb: Number(pb.toFixed(4)) }
    })
  }, [])

  const prediction = useMemo(() => {
    // Mock ML prediction forward 10 years
    const last = timeSeries[timeSeries.length - 1]
    const out = Array.from({ length: 10 }, (_, i) => {
      const y = last.year + i + 1
      return {
        year: y,
        As: Number((last.As * (1 + 0.01 * (i + 1))).toFixed(4)),
        Pb: Number((last.Pb * (1 + 0.008 * (i + 1))).toFixed(4)),
      }
    })
    return out
  }, [timeSeries])

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Advanced Analytics</h1>

      <Card>
        <CardHeader>
          <CardTitle>Time-series (1980 → present) with Slider</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Slider min={1980} max={2025} step={1} value={[year]} onValueChange={([y]) => setYear(y)} />
            <div className="text-sm text-muted-foreground mt-2">Selected Year: {year}</div>
          </div>
          <div className="w-full h-[280px] bg-background rounded-md border p-4">
            <ChartContainer
              className="w-full h-full"
              config={{
                As: { label: "Arsenic (mg/L)", color: "#3b82f6" },
                Pb: { label: "Lead (mg/L)", color: "#ef4444" },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={timeSeries.filter((d) => d.year <= year)}
                  margin={{ left: 12, right: 12, top: 12, bottom: 12 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="year" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Legend />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area dataKey="As" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                  <Area dataKey="Pb" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trend Prediction (Mock ML)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[260px] bg-background rounded-md border p-4">
            <ChartContainer
              className="w-full h-full"
              config={{
                As: { label: "Arsenic (mg/L)", color: "#3b82f6" },
                Pb: { label: "Lead (mg/L)", color: "#ef4444" },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={prediction} margin={{ left: 12, right: 12, top: 12, bottom: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="year" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Legend />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area dataKey="As" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                  <Area dataKey="Pb" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
