"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { FilterSidebar } from "./filter-sidebar"
import { RasterDetailDrawer } from "./raster-detail-drawer"
import {
  type RasterRecord,
  padToThousand,
  computeRiskIndex,
  metalPalette,
  rectangleForCell,
  filterData,
  type FiltersState,
} from "@/lib/mock-utils"
import { ReportExportModal } from "./report-export-modal"
import type { GeoJSON } from "geojson"
import { AlertsBanner } from "./alerts-banner"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Props = {
  focusId?: string | null
}

const BOUNDS = {
  minLon: 68.0,
  maxLon: 97.5,
  minLat: 6.5,
  maxLat: 37.5,
}

type Transform = { tx: number; ty: number; k: number }

export function MapViewer({ focusId = null }: Props) {
  const { data } = useSWR<RasterRecord[]>("/data/mock_rasters.json", fetcher)
  const base = data ? padToThousand(data) : []

  const [filters, setFilters] = useState<FiltersState>({
    state: null,
    district: null,
    metals: [],
    riskRange: [0, 1],
    exceedOnly: false,
    hotspotsOnly: false,
    year: null,
  })
  const filtered = useMemo(() => filterData(base, filters), [base, filters])

  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)

  const [selected, setSelected] = useState<RasterRecord | null>(null)
  const [layers, setLayers] = useState({
    landUse: true,
    industry: true,
    population: true,
    rainfall: false,
  })

  const transformRef = useRef<Transform>({ tx: 0, ty: 0, k: 1 })
  const draggingRef = useRef(false)
  const lastPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  function fitToBounds(width: number, height: number): Transform {
    const pad = 40
    const w = width - pad * 2
    const h = height - pad * 2
    const lonSpan = BOUNDS.maxLon - BOUNDS.minLon
    const latSpan = BOUNDS.maxLat - BOUNDS.minLat

    // Use a more appropriate projection scale for India
    const sx = w / lonSpan
    const sy = h / latSpan
    const k = Math.min(sx, sy) * 0.8 // Scale down slightly for better fit

    const mapWidth = lonSpan * k
    const mapHeight = latSpan * k
    const tx = pad + (w - mapWidth) / 2 - BOUNDS.minLon * k
    const ty = pad + (h - mapHeight) / 2 + BOUNDS.maxLat * k
    return { tx, ty, k }
  }

  function project(lon: number, lat: number, t: Transform) {
    // y flips because canvas y grows downwards
    const x = lon * t.k + t.tx
    const y = -lat * t.k + t.ty
    return { x, y }
  }

  function draw(records: RasterRecord[]) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { width, height } = canvas
    ctx.clearRect(0, 0, width, height)

    const bgColor = getComputedStyle(document.documentElement).getPropertyValue("--muted").trim() || "#f8fafc"
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, width, height)

    const t = transformRef.current

    ctx.strokeStyle = "#64748b"
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.strokeRect(
      BOUNDS.minLon * t.k + t.tx,
      -BOUNDS.maxLat * t.k + t.ty,
      (BOUNDS.maxLon - BOUNDS.minLon) * t.k,
      (BOUNDS.maxLat - BOUNDS.minLat) * t.k,
    )
    ctx.setLineDash([])

    // base cells (risk fill + thin outline)
    for (const r of records) {
      const poly = rectangleForCell(r.Lat_Center, r.Lon_Center) as number[][][] // [[ [lon,lat]... ]]
      const coords = poly[0]
      ctx.beginPath()
      coords.forEach(([lon, lat], i) => {
        const { x, y } = project(lon, lat, t)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.closePath()
      const risk = computeRiskIndex(r)
      ctx.fillStyle = metalPalette(risk)
      ctx.globalAlpha = 0.7 // Increased opacity for better visibility
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.lineWidth = 0.5
      ctx.strokeStyle = "#64748b"
      ctx.stroke()
    }

    // Overlays
    if (layers.landUse) {
      for (const r of records) {
        const poly = rectangleForCell(r.Lat_Center, r.Lon_Center) as number[][][]
        const coords = poly[0]
        ctx.beginPath()
        coords.forEach(([lon, lat], i) => {
          const { x, y } = project(lon, lat, t)
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.closePath()
        const lu = r.Land_Use_Type
        const color =
          lu === "Urban"
            ? "#3b82f6"
            : lu === "Industrial"
              ? "#06b6d4"
              : lu === "Agri"
                ? "#22c55e"
                : lu === "Mixed"
                  ? "#f59e0b"
                  : "#94a3b8"
        ctx.fillStyle = color
        ctx.globalAlpha = 0.1
        ctx.fill()
        ctx.globalAlpha = 1
      }
    }

    if (layers.industry) {
      for (const r of records) {
        const val = Number((r as any).Industrial_Proximity ?? (r as any).Industry_Proximity ?? 0)
        let color = "#ef4444"
        if (val >= 100) color = "#22c55e"
        else if (val >= 50) color = "#facc15"
        else if (val >= 10) color = "#f97316"
        const poly = rectangleForCell(r.Lat_Center, r.Lon_Center) as number[][][]
        const coords = poly[0]
        ctx.beginPath()
        coords.forEach(([lon, lat], i) => {
          const { x, y } = project(lon, lat, t)
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.closePath()
        ctx.lineWidth = 1
        ctx.strokeStyle = color
        ctx.stroke()
      }
    }

    if (layers.population) {
      for (const r of records) {
        const val = Number((r as any).Population_Density ?? 0)
        let color = "#10b981"
        if (val >= 20000) color = "#ef4444"
        else if (val >= 5000) color = "#f59e0b"
        const poly = rectangleForCell(r.Lat_Center, r.Lon_Center) as number[][][]
        const coords = poly[0]
        ctx.beginPath()
        coords.forEach(([lon, lat], i) => {
          const { x, y } = project(lon, lat, t)
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.closePath()
        ctx.fillStyle = color
        ctx.globalAlpha = 0.12
        ctx.fill()
        ctx.globalAlpha = 1
      }
    }

    if (layers.rainfall) {
      for (const r of records) {
        const val = Number((r as any).Rainfall ?? 0)
        let color = "#93c5fd"
        if (val >= 2000) color = "#1d4ed8"
        else if (val >= 1000) color = "#3b82f6"
        const poly = rectangleForCell(r.Lat_Center, r.Lon_Center) as number[][][]
        const coords = poly[0]
        ctx.beginPath()
        coords.forEach(([lon, lat], i) => {
          const { x, y } = project(lon, lat, t)
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.closePath()
        ctx.fillStyle = color
        ctx.globalAlpha = 0.12
        ctx.fill()
        ctx.globalAlpha = 1
      }
    }
  }

  function scheduleDraw(records: RasterRecord[]) {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => draw(records))
  }

  // Resize and initial fit
  useEffect(() => {
    function resize() {
      const el = containerRef.current
      const canvas = canvasRef.current
      if (!el || !canvas) return
      const rect = el.getBoundingClientRect()
      // set canvas size with devicePixelRatio for crispness
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.floor(rect.width * dpr)
      canvas.height = Math.floor(rect.height * dpr)
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      const t = fitToBounds(canvas.width, canvas.height)
      transformRef.current = t
      scheduleDraw(filtered)
    }
    resize()
    window.addEventListener("resize", resize)
    return () => window.removeEventListener("resize", resize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Redraw when data/toggles/filter changes
  useEffect(() => {
    scheduleDraw(filtered)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, layers])

  // Pan/zoom interactions
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function toCanvasPoint(evt: PointerEvent | WheelEvent) {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const x = (("clientX" in evt ? evt.clientX : 0) - rect.left) * dpr
      const y = (("clientY" in evt ? evt.clientY : 0) - rect.top) * dpr
      return { x, y }
    }

    function onPointerDown(e: PointerEvent) {
      draggingRef.current = true
      lastPosRef.current = toCanvasPoint(e)
      ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    }
    function onPointerMove(e: PointerEvent) {
      if (!draggingRef.current) return
      const now = toCanvasPoint(e)
      const last = lastPosRef.current
      lastPosRef.current = now
      const t = transformRef.current
      t.tx += now.x - last.x
      t.ty += now.y - last.y
      scheduleDraw(filtered)
    }
    function onPointerUp(e: PointerEvent) {
      draggingRef.current = false
      ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
    }
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const { x, y } = toCanvasPoint(e)
      const t = transformRef.current
      const scale = Math.exp(-e.deltaY * 0.001) // smooth zoom
      const newK = Math.min(50, Math.max(0.5, t.k * scale))
      // Zoom around cursor
      t.tx = x - (x - t.tx) * (newK / t.k)
      t.ty = y - (y - t.ty) * (newK / t.k)
      t.k = newK
      scheduleDraw(filtered)
    }

    canvas.addEventListener("pointerdown", onPointerDown)
    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
    canvas.addEventListener("wheel", onWheel, { passive: false })

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
      canvas.removeEventListener("wheel", onWheel as any)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered])

  // Click selection (point-in-polygon test)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    function pointInPolygon(ptX: number, ptY: number, poly: number[][]): boolean {
      // ray casting on canvas coords; poly is [ [lon,lat], ... ]
      const t = transformRef.current
      let inside = false
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [loni, lati] = poly[i]
        const [lonj, latj] = poly[j]
        const pi = project(loni, lati, t)
        const pj = project(lonj, latj, t)
        const intersect =
          pi.y > ptY !== pj.y > ptY && ptX < ((pj.x - pi.x) * (ptY - pi.y)) / (pj.y - pi.y + 1e-9) + pi.x
        if (intersect) inside = !inside
      }
      return inside
    }
    function onClick(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const x = (e.clientX - rect.left) * dpr
      const y = (e.clientY - rect.top) * dpr

      // iterate filtered; early-exit on first hit
      for (const r of filtered) {
        const poly = rectangleForCell(r.Lat_Center, r.Lon_Center) as number[][][]
        const coords = poly[0]
        if (pointInPolygon(x, y, coords)) {
          setSelected(r)
          return
        }
      }
    }
    canvas.addEventListener("click", onClick)
    return () => canvas.removeEventListener("click", onClick)
  }, [filtered])

  // Focus movement (flyTo equivalent)
  useEffect(() => {
    if (!focusId) return
    const hit = filtered.find((r) => r.Raster_ID === focusId)
    if (!hit) return
    const canvas = canvasRef.current
    if (!canvas) return
    const t = transformRef.current
    // Simple center on the focused cell center
    const { x, y } = project(hit.Lon_Center, hit.Lat_Center, t)
    const cx = canvas.width / 2
    const cy = canvas.height / 2
    t.tx += cx - x
    t.ty += cy - y
    scheduleDraw(filtered)
    setSelected(hit)
  }, [focusId, filtered])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 p-4">
      <div>
        <FilterSidebar value={filters} onChange={setFilters} />
        <div className="mt-4 space-y-2">
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Land Use</span>
              <Button variant="outline" size="sm" onClick={() => setLayers((s) => ({ ...s, landUse: !s.landUse }))}>
                {layers.landUse ? "Hide" : "Show"}
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm">Industry Proximity</span>
              <Button variant="outline" size="sm" onClick={() => setLayers((s) => ({ ...s, industry: !s.industry }))}>
                {layers.industry ? "Hide" : "Show"}
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm">Population Density</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLayers((s) => ({ ...s, population: !s.population }))}
              >
                {layers.population ? "Hide" : "Show"}
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm">Rainfall</span>
              <Button variant="outline" size="sm" onClick={() => setLayers((s) => ({ ...s, rainfall: !s.rainfall }))}>
                {layers.rainfall ? "Hide" : "Show"}
              </Button>
            </div>
          </Card>
          <ReportExportModal data={filtered} />
        </div>
      </div>

      <div className="relative">
        <AlertsBanner />
        <div
          ref={containerRef}
          className="h-[calc(100vh-120px)] min-h-[500px] w-full rounded-md overflow-hidden border bg-muted"
          aria-label="Groundwater contamination map"
          role="region"
        >
          <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair" />
        </div>
        <div className="absolute bottom-3 left-3 flex gap-2">
          <Badge variant="secondary">Cells: {filtered.length}</Badge>
          <Badge variant="outline">India Groundwater Grid</Badge>
        </div>
      </div>

      <RasterDetailDrawer open={!!selected} onOpenChange={(o) => !o && setSelected(null)} raster={selected} />
    </div>
  )
}

function toFeatureCollection(records: RasterRecord[]): GeoJSON.FeatureCollection<GeoJSON.Polygon, any> {
  return {
    type: "FeatureCollection",
    features: records.map((r) => {
      const coords = rectangleForCell(r.Lat_Center, r.Lon_Center)
      const risk = computeRiskIndex(r)
      return {
        type: "Feature",
        geometry: { type: "Polygon", coordinates: coords },
        properties: {
          Raster_ID: r.Raster_ID,
          risk,
          color: metalPalette(risk),
          landuse: r.Land_Use_Type,
          pop: r.Population_Density,
          rainfall: (r as any).Rainfall,
          industry: (r as any).Industrial_Proximity ?? (r as any).Industry_Proximity,
        },
      }
    }),
  }
}
