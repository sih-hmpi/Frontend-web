"use client"

import useSWR from "swr"
import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type RasterRecord, padToThousand, uniqueStates, uniqueDistricts, computeRiskIndex } from "@/lib/mock-utils"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ComparePage() {
  const { data } = useSWR<RasterRecord[]>("/data/mock_rasters.json", fetcher)
  const records = data ? padToThousand(data) : []
  const states = useMemo(() => uniqueStates(records), [records])
  const [aState, setAState] = useState<string | null>(states[0] ?? null)
  const [bState, setBState] = useState<string | null>(states[1] ?? null)

  const aData = useMemo(() => summarize(records.filter((r) => !aState || r.Region_State === aState)), [records, aState])
  const bData = useMemo(() => summarize(records.filter((r) => !bState || r.Region_State === bState)), [records, bState])

  const chart = [
    { metric: "Avg Risk", A: aData.avgRisk, B: bData.avgRisk },
    { metric: "Exceed %", A: aData.exceedPct, B: bData.exceedPct },
    { metric: "Pop (est)", A: aData.pop, B: bData.pop },
  ]

  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
      <h1 className="text-lg font-semibold">Compare Regions</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Region A</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={aState ?? ""} onValueChange={(v) => setAState(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {states.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground">Districts: {uniqueDistricts(records, aState).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Region B</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={bState ?? ""} onValueChange={(v) => setBState(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {states.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground">Districts: {uniqueDistricts(records, bState).length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Side-by-side metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            className="h-[280px]"
            config={{
              A: { label: "Region A", color: "hsl(var(--chart-1))" },
              B: { label: "Region B", color: "hsl(var(--chart-2))" },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ left: 12, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis />
                <Legend />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="A" fill="var(--color-A)" />
                <Bar dataKey="B" fill="var(--color-B)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </main>
  )
}

function summarize(rows: RasterRecord[]) {
  if (!rows.length) return { avgRisk: 0, exceedPct: 0, pop: 0 }
  const risks = rows.map((r) => computeRiskIndex(r))
  const avgRisk = Number((risks.reduce((a, b) => a + b, 0) / risks.length).toFixed(3))
  const exceedPct = Number(((rows.filter((r) => r.Exceedance_Flag).length * 100) / rows.length).toFixed(2))
  const pop = rows.reduce((a, r) => a + r.Population_Density * 9 * 0.1, 0)
  return { avgRisk, exceedPct, pop: Math.round(pop) }
}
