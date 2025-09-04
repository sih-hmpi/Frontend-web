"use client"

import { useEffect, useMemo, useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { downloadBlob, type RasterRecord, computeRiskIndex } from "@/lib/mock-utils"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  raster: RasterRecord | null
}

export function RasterDetailDrawer({ open, onOpenChange, raster }: Props) {
  const [bookmarked, setBookmarked] = useState(false)
  const [whatIf, setWhatIf] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!raster) return
    const saved = JSON.parse(localStorage.getItem("bookmarks") || "[]") as string[]
    setBookmarked(saved.includes(raster.Raster_ID))
    setWhatIf({})
  }, [raster])

  const mergedMetals = useMemo(() => {
    if (!raster) return {}
    return { ...raster.Heavy_Metals, ...whatIf }
  }, [raster, whatIf])

  const risk = raster ? computeRiskIndex({ ...raster, Heavy_Metals: mergedMetals }) : 0

  function toggleBookmark() {
    if (!raster) return
    const saved = new Set(JSON.parse(localStorage.getItem("bookmarks") || "[]") as string[])
    if (saved.has(raster.Raster_ID)) saved.delete(raster.Raster_ID)
    else saved.add(raster.Raster_ID)
    localStorage.setItem("bookmarks", JSON.stringify(Array.from(saved)))
    setBookmarked(saved.has(raster.Raster_ID))
  }

  function exportJSON() {
    if (!raster) return
    downloadBlob(JSON.stringify(raster, null, 2), `${raster.Raster_ID}.json`, "application/json")
  }

  async function exportPDF() {
    if (!raster) return
    // lightweight mock PDF using jsPDF
    const { jsPDF } = await import("jspdf")
    const doc = new jsPDF()
    doc.setFontSize(14)
    doc.text("Raster Report (Mock)", 14, 16)
    doc.setFontSize(11)
    doc.text(`Raster: ${raster.Raster_ID}`, 14, 26)
    doc.text(`State: ${raster.Region_State}`, 14, 34)
    doc.text(`District: ${raster.Region_District}`, 14, 42)
    doc.text(`Risk Index: ${risk.toFixed(2)}`, 14, 50)
    let y = 60
    doc.text("Metals (mg/L):", 14, y)
    y += 8
    Object.entries(raster.Heavy_Metals).forEach(([k, v]) => {
      doc.text(`${k}: ${v}`, 16, y)
      y += 6
    })
    doc.save(`${raster.Raster_ID}.pdf`)
  }

  if (!raster) return null

  const years = Array.from({ length: raster.Trend_Data.length }, (_, i) => 2015 + i)
  const series = raster.Trend_Data.map((v, i) => ({ year: years[i], value: v }))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-pretty">
            {raster.Region_State} • {raster.Region_District} • {raster.Raster_ID}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={raster.Exceedance_Flag ? "destructive" : "secondary"}>
              {raster.Exceedance_Flag ? "Exceeds WHO/BIS" : "Within Limits"}
            </Badge>
            <Badge variant="outline">Risk {risk.toFixed(2)}</Badge>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Metal Concentrations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(mergedMetals).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-sm">
                  <div>{k}</div>
                  <div className="tabular-nums">{v.toFixed(4)} mg/L</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Historical Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                className="h-[180px]"
                config={{ value: { label: "Concentration (mg/L)", color: "hsl(var(--chart-1))" } }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={series} margin={{ left: 6, right: 12, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line dataKey="value" stroke="var(--color-value)" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Tabs defaultValue="risk">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="risk">Risk</TabsTrigger>
              <TabsTrigger value="context">Context</TabsTrigger>
              <TabsTrigger value="whatif">What-if</TabsTrigger>
            </TabsList>
            <TabsContent value="risk" className="space-y-2">
              <div className="text-sm">
                Health Risk Score: <span className="font-medium">{raster.Health_Risk_Score.toFixed(2)}</span>
              </div>
              <div className="text-sm">
                Population Exposed (est):{" "}
                <span className="font-medium">{Math.round(raster.Population_Density * 9 * 0.1).toLocaleString()}</span>
              </div>
              <div className="text-sm">
                Land-use: <span className="font-medium">{raster.Land_Use_Type}</span>
              </div>
            </TabsContent>
            <TabsContent value="context" className="space-y-2">
              <div className="text-sm">Industrial proximity: {raster.Industrial_Proximity} km</div>
              <div className="text-sm">Mining proximity: {raster.Mining_Proximity} km</div>
              <div className="text-sm">Recharge rate: {raster.Recharge_Rate}</div>
              <div className="text-sm">Rainfall: {raster.Rainfall} mm</div>
            </TabsContent>
            <TabsContent value="whatif" className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Adjust hypothetical levels and see recalculated risk index.
              </div>
              <div className="space-y-2">
                {Object.keys(raster.Heavy_Metals)
                  .slice(0, 6)
                  .map((k) => {
                    const base = raster.Heavy_Metals[k]
                    const val = whatIf[k] ?? base
                    return (
                      <div key={k} className="grid grid-cols-5 items-center gap-2">
                        <div className="col-span-2 text-sm">{k}</div>
                        <input
                          type="range"
                          min={0}
                          max={base * 2 + 0.01}
                          step={0.0001}
                          value={val}
                          onChange={(e) => setWhatIf({ ...whatIf, [k]: Number(e.target.value) })}
                          className="col-span-2"
                          aria-label={`${k} concentration slider`}
                        />
                        <div className="text-right text-xs tabular-nums">{val.toFixed(4)}</div>
                      </div>
                    )
                  })}
              </div>
              <div className="text-sm">
                New Risk: <span className="font-medium">{risk.toFixed(2)}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => setWhatIf({})}>
                Reset What-if
              </Button>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2">
            <Button onClick={toggleBookmark} variant={bookmarked ? "secondary" : "default"}>
              {bookmarked ? "Bookmarked" : "Bookmark"}
            </Button>
            <Button variant="outline" onClick={exportJSON}>
              Export JSON
            </Button>
            <Button variant="outline" onClick={exportPDF}>
              Export PDF
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
