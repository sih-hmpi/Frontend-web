"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatNumber, computeRiskIndex, type RasterRecord, padToThousand } from "@/lib/mock-utils"
import { motion } from "framer-motion"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function RiskSummaryCards() {
  const { data } = useSWR<RasterRecord[]>("/data/mock_rasters.json", fetcher)
  const records = data ? padToThousand(data) : []

  const exceeding = records.filter((r) => r.Exceedance_Flag).length
  const affectedPopulation = Math.round(records.reduce((acc, r) => acc + r.Population_Density * 9, 0) * 0.1) // rough proxy: density * cell area proxied
  const metalsCount: Record<string, number> = {}
  records.forEach((r) =>
    Object.keys(r.Heavy_Metals).forEach((m) => {
      metalsCount[m] =
        (metalsCount[m] ?? 0) + (r.Heavy_Metals[m] > (r.WHO_Limit[m] ?? Number.POSITIVE_INFINITY) ? 1 : 0)
    }),
  )
  const topMetals = Object.entries(metalsCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([m]) => m)
    .join(", ")
  const byStateRisk: Record<string, number> = {}
  records.forEach((r) => {
    const risk = computeRiskIndex(r)
    byStateRisk[r.Region_State] = Math.max(byStateRisk[r.Region_State] ?? 0, risk)
  })
  const topStates = Object.entries(byStateRisk)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([s]) => s)
    .join(", ")

  const cards = [
    { title: "Rasters Exceeding Limits", value: exceeding ? formatNumber(exceeding) : "—" },
    { title: "Affected Population (est.)", value: affectedPopulation ? formatNumber(affectedPopulation) : "—" },
    { title: "Top 3 Heavy Metals", value: topMetals || "—" },
    { title: "States with Highest Risk", value: topStates || "—" },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c, idx) => (
        <motion.div
          key={c.title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * idx, duration: 0.35, ease: "easeOut" }}
        >
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{c.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{c.value}</div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
