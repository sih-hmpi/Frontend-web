"use client"

import type React from "react"

import { useEffect, useRef, useState, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { RasterDetailDrawer } from "./raster-detail-drawer"
import { ReportExportModal } from "./report-export-modal"
import { AlertsBanner } from "./alerts-banner"
import {
  Play,
  Pause,
  RotateCcw,
  Search,
  Filter,
  Layers,
  Download,
  Share2,
  MapPin,
  Compass as Compare,
  Target,
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type RasterRecord = {
  Raster_ID: string
  State: string
  District: string
  Lat_Center: number
  Lon_Center: number
  Heavy_Metals: Record<string, number>
  WHO_Limits: Record<string, number>
  Risk_Index: number
  Exceedance_Flag: boolean
  Population_Density: number
  Population_Exposed: number
  Health_Risk_Score: number
  Land_Use_Type: string
  Land_Use_Coverage: Record<string, number>
  Industrial_Proximity: number
  Mining_Proximity: number
  Agricultural_Proximity: number
  Groundwater_Depth: number
  Recharge_Rate: number
  Rainfall: number
  Trend_Data: number[]
  Predicted_Risk: number[]
  Policy_Interventions: string[]
  Recommended_Actions: string[]
  Region_State: string
  Region_District: string
  Coordinates: {
    type: string
    coordinates: number[][][]
  }
}

type MapLayers = {
  populationDensity: boolean
  industrialZones: boolean
  miningAreas: boolean
  rainfallRecharge: boolean
  policyInterventions: boolean
  predictiveRisk: boolean
}

type FilterState = {
  states: string[]
  districts: string[]
  metals: string[]
  riskRange: [number, number]
  exceedanceOnly: boolean
  landUseTypes: string[]
  depthRange: [number, number]
  searchQuery: string
}

type CompareMode = {
  enabled: boolean
  selectedRasters: string[]
}

type MapState = {
  center: [number, number]
  zoom: number
  isDragging: boolean
  lastMousePos: [number, number]
}

const INDIA_BOUNDS = {
  north: 37.5,
  south: 6.5,
  east: 97.5,
  west: 68.0,
}

const projectCoordinate = (lon: number, lat: number, bounds: typeof INDIA_BOUNDS, width: number, height: number) => {
  const x = ((lon - bounds.west) / (bounds.east - bounds.west)) * width
  const y = ((bounds.north - lat) / (bounds.north - bounds.south)) * height
  return [x, y]
}

const unprojectCoordinate = (x: number, y: number, bounds: typeof INDIA_BOUNDS, width: number, height: number) => {
  const lon = bounds.west + (x / width) * (bounds.east - bounds.west)
  const lat = bounds.north - (y / height) * (bounds.north - bounds.south)
  return [lon, lat]
}

const getRiskColor = (risk: number) => {
  if (risk <= 0.3) return "#22c55e" // green
  if (risk <= 0.6) return "#eab308" // yellow
  if (risk <= 0.8) return "#f97316" // orange
  return "#ef4444" // red
}

export function EnhancedMapViewer() {
  const { data: rawData } = useSWR<RasterRecord[]>("/data/enhanced_mock_rasters.json", fetcher)

  // Generate additional mock data to reach ~1000 records
  const allData = useMemo(() => {
    if (!rawData) return []
    const generated = []
    const baseRecords = rawData.length

    for (let i = 0; i < 995; i++) {
      const base = rawData[i % baseRecords]
      const latOffset = (Math.random() - 0.5) * 20
      const lonOffset = (Math.random() - 0.5) * 25

      generated.push({
        ...base,
        Raster_ID: `IN-${String(i + 100).padStart(4, "0")}`,
        Lat_Center: Math.max(6.5, Math.min(37.5, base.Lat_Center + latOffset)),
        Lon_Center: Math.max(68.0, Math.min(97.5, base.Lon_Center + lonOffset)),
        Risk_Index: Math.max(0, Math.min(1, base.Risk_Index + (Math.random() - 0.5) * 0.3)),
        Population_Exposed: Math.floor(base.Population_Exposed * (0.5 + Math.random())),
        Heavy_Metals: Object.fromEntries(
          Object.entries(base.Heavy_Metals).map(([k, v]) => [k, Math.max(0, v * (0.7 + Math.random() * 0.6))]),
        ),
      })
    }

    return [...rawData, ...generated]
  }, [rawData])

  // State management
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>()
  const [selectedRaster, setSelectedRaster] = useState<RasterRecord | null>(null)
  const [hoveredRaster, setHoveredRaster] = useState<RasterRecord | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentYear, setCurrentYear] = useState(2024)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [compareMode, setCompareMode] = useState<CompareMode>({ enabled: false, selectedRasters: [] })
  const [hotspotMode, setHotspotMode] = useState(false)

  const [mapState, setMapState] = useState<MapState>({
    center: [78.9629, 20.5937], // Center of India
    zoom: 1,
    isDragging: false,
    lastMousePos: [0, 0],
  })

  const [mapLayers, setMapLayers] = useState<MapLayers>({
    populationDensity: true,
    industrialZones: false,
    miningAreas: false,
    rainfallRecharge: false,
    policyInterventions: false,
    predictiveRisk: false,
  })

  const [filters, setFilters] = useState<FilterState>({
    states: [],
    districts: [],
    metals: [],
    riskRange: [0, 1],
    exceedanceOnly: false,
    landUseTypes: [],
    depthRange: [0, 100],
    searchQuery: "",
  })

  // Derived data
  const filteredData = useMemo(() => {
    if (!allData) return []

    return allData.filter((record) => {
      // State filter
      if (filters.states.length > 0 && !filters.states.includes(record.State)) return false

      // District filter
      if (filters.districts.length > 0 && !filters.districts.includes(record.District)) return false

      // Risk range filter
      if (record.Risk_Index < filters.riskRange[0] || record.Risk_Index > filters.riskRange[1]) return false

      // Exceedance filter
      if (filters.exceedanceOnly && !record.Exceedance_Flag) return false

      // Land use filter
      if (filters.landUseTypes.length > 0 && !filters.landUseTypes.includes(record.Land_Use_Type)) return false

      // Depth filter
      if (record.Groundwater_Depth < filters.depthRange[0] || record.Groundwater_Depth > filters.depthRange[1])
        return false

      // Search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        return (
          record.Raster_ID.toLowerCase().includes(query) ||
          record.State.toLowerCase().includes(query) ||
          record.District.toLowerCase().includes(query)
        )
      }

      return true
    })
  }, [allData, filters])

  const hotspotData = useMemo(() => {
    if (!filteredData) return []
    const sorted = [...filteredData].sort((a, b) => b.Risk_Index - a.Risk_Index)
    return sorted.slice(0, Math.ceil(sorted.length * 0.05)) // Top 5%
  }, [filteredData])

  const displayData = hotspotMode ? hotspotData : filteredData

  // Unique values for filters
  const uniqueStates = useMemo(() => [...new Set(allData?.map((r) => r.State) || [])], [allData])
  const uniqueDistricts = useMemo(() => {
    if (filters.states.length === 0) return [...new Set(allData?.map((r) => r.District) || [])]
    return [...new Set(allData?.filter((r) => filters.states.includes(r.State)).map((r) => r.District) || [])]
  }, [allData, filters.states])
  const uniqueMetals = useMemo(() => {
    if (!allData?.[0]) return []
    return Object.keys(allData[0].Heavy_Metals)
  }, [allData])
  const uniqueLandUseTypes = useMemo(() => [...new Set(allData?.map((r) => r.Land_Use_Type) || [])], [allData])

  const renderMap = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || !displayData) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, rect.width, rect.height)

    // Draw background
    ctx.fillStyle = "#f8fafc"
    ctx.fillRect(0, 0, rect.width, rect.height)

    // Draw India bounds
    ctx.strokeStyle = "#64748b"
    ctx.setLineDash([5, 5])
    ctx.lineWidth = 2
    ctx.strokeRect(50, 50, rect.width - 100, rect.height - 100)
    ctx.setLineDash([])

    // Draw raster cells
    displayData.forEach((record) => {
      const [x, y] = projectCoordinate(
        record.Lon_Center,
        record.Lat_Center,
        INDIA_BOUNDS,
        rect.width - 100,
        rect.height - 100,
      )

      const adjustedX = x + 50
      const adjustedY = y + 50
      const cellSize = Math.max(2, 8 / Math.max(1, mapState.zoom))

      // Fill cell with risk color
      ctx.fillStyle = getRiskColor(record.Risk_Index)
      ctx.globalAlpha = 0.7
      ctx.fillRect(adjustedX - cellSize / 2, adjustedY - cellSize / 2, cellSize, cellSize)

      // Draw cell outline
      ctx.globalAlpha = 0.8
      ctx.strokeStyle = "#64748b"
      ctx.lineWidth = 0.5
      ctx.strokeRect(adjustedX - cellSize / 2, adjustedY - cellSize / 2, cellSize, cellSize)

      // Highlight hovered cell
      if (hoveredRaster && hoveredRaster.Raster_ID === record.Raster_ID) {
        ctx.globalAlpha = 1
        ctx.strokeStyle = "#1d4ed8"
        ctx.lineWidth = 3
        ctx.strokeRect(adjustedX - cellSize / 2 - 2, adjustedY - cellSize / 2 - 2, cellSize + 4, cellSize + 4)
      }

      // Highlight selected cells in compare mode
      if (compareMode.enabled && compareMode.selectedRasters.includes(record.Raster_ID)) {
        ctx.globalAlpha = 1
        ctx.strokeStyle = "#dc2626"
        ctx.lineWidth = 2
        ctx.strokeRect(adjustedX - cellSize / 2 - 1, adjustedY - cellSize / 2 - 1, cellSize + 2, cellSize + 2)
      }
    })

    ctx.globalAlpha = 1

    // Draw layer overlays
    if (mapLayers.populationDensity) {
      displayData.forEach((record) => {
        const [x, y] = projectCoordinate(
          record.Lon_Center,
          record.Lat_Center,
          INDIA_BOUNDS,
          rect.width - 100,
          rect.height - 100,
        )
        const adjustedX = x + 50
        const adjustedY = y + 50
        const intensity = Math.min(1, record.Population_Density / 1000)

        ctx.fillStyle = `rgba(59, 130, 246, ${intensity * 0.3})`
        ctx.fillRect(adjustedX - 4, adjustedY - 4, 8, 8)
      })
    }

    if (mapLayers.industrialZones) {
      displayData.forEach((record) => {
        if (record.Industrial_Proximity < 5) {
          const [x, y] = projectCoordinate(
            record.Lon_Center,
            record.Lat_Center,
            INDIA_BOUNDS,
            rect.width - 100,
            rect.height - 100,
          )
          const adjustedX = x + 50
          const adjustedY = y + 50

          ctx.fillStyle = "rgba(156, 163, 175, 0.4)"
          ctx.fillRect(adjustedX - 3, adjustedY - 3, 6, 6)
        }
      })
    }

    if (mapLayers.miningAreas) {
      displayData.forEach((record) => {
        if (record.Mining_Proximity < 3) {
          const [x, y] = projectCoordinate(
            record.Lon_Center,
            record.Lat_Center,
            INDIA_BOUNDS,
            rect.width - 100,
            rect.height - 100,
          )
          const adjustedX = x + 50
          const adjustedY = y + 50

          ctx.fillStyle = "rgba(120, 53, 15, 0.5)"
          ctx.fillRect(adjustedX - 2, adjustedY - 2, 4, 4)
        }
      })
    }
  }, [displayData, hoveredRaster, compareMode, mapLayers, mapState.zoom])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container || !displayData) return

      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      if (mapState.isDragging) {
        const deltaX = x - mapState.lastMousePos[0]
        const deltaY = y - mapState.lastMousePos[1]

        setMapState((prev) => ({
          ...prev,
          center: [prev.center[0] - deltaX * 0.01, prev.center[1] + deltaY * 0.01],
          lastMousePos: [x, y],
        }))
        return
      }

      // Find hovered raster
      let foundRaster: RasterRecord | null = null

      for (const record of displayData) {
        const [projX, projY] = projectCoordinate(
          record.Lon_Center,
          record.Lat_Center,
          INDIA_BOUNDS,
          rect.width - 100,
          rect.height - 100,
        )

        const adjustedX = projX + 50
        const adjustedY = projY + 50
        const cellSize = Math.max(2, 8 / Math.max(1, mapState.zoom))

        if (
          x >= adjustedX - cellSize / 2 &&
          x <= adjustedX + cellSize / 2 &&
          y >= adjustedY - cellSize / 2 &&
          y <= adjustedY + cellSize / 2
        ) {
          foundRaster = record
          break
        }
      }

      setHoveredRaster(foundRaster)
      canvas.style.cursor = foundRaster ? "pointer" : "default"
    },
    [displayData, mapState],
  )

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setMapState((prev) => ({
      ...prev,
      isDragging: true,
      lastMousePos: [x, y],
    }))
  }, [])

  const handleMouseUp = useCallback(() => {
    setMapState((prev) => ({ ...prev, isDragging: false }))
  }, [])

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (mapState.isDragging) return

      if (hoveredRaster) {
        if (compareMode.enabled) {
          setCompareMode((prev) => ({
            ...prev,
            selectedRasters: prev.selectedRasters.includes(hoveredRaster.Raster_ID)
              ? prev.selectedRasters.filter((id) => id !== hoveredRaster.Raster_ID)
              : prev.selectedRasters.length < 2
                ? [...prev.selectedRasters, hoveredRaster.Raster_ID]
                : [prev.selectedRasters[1], hoveredRaster.Raster_ID],
          }))
        } else {
          setSelectedRaster(hoveredRaster)
        }
      }
    },
    [hoveredRaster, compareMode, mapState.isDragging],
  )

  useEffect(() => {
    const render = () => {
      renderMap()
      animationFrameRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [renderMap])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      renderMap()
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [renderMap])

  // Time series playback
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setCurrentYear((prev) => {
        const next = prev + 1
        if (next > 2024) {
          setIsPlaying(false)
          return 2010
        }
        return next
      })
    }, 500)

    return () => clearInterval(interval)
  }, [isPlaying])

  // Export functions
  const exportCurrentView = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement("a")
    link.download = `groundwater-map-${new Date().toISOString().split("T")[0]}.png`
    link.href = canvas.toDataURL()
    link.click()
  }, [])

  const shareCurrentView = useCallback(() => {
    const url = new URL(window.location.href)
    url.searchParams.set("filters", JSON.stringify(filters))
    url.searchParams.set("layers", JSON.stringify(mapLayers))
    url.searchParams.set("year", currentYear.toString())

    navigator.clipboard.writeText(url.toString()).then(() => {
      console.log("View URL copied to clipboard")
    })
  }, [filters, mapLayers, currentYear])

  return (
    <div className="flex h-screen bg-background">
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-80 bg-card border-r border-border overflow-y-auto"
          >
            <div className="p-4 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search raster ID, state, district..."
                  value={filters.searchQuery}
                  onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
                  className="pl-10"
                />
              </div>

              {/* ... existing sidebar content ... */}

              {/* Quick Stats */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Current View</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Cells:</span>
                    <Badge variant="secondary">{displayData.length}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>High Risk:</span>
                    <Badge variant="destructive">{displayData.filter((r) => r.Risk_Index > 0.7).length}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Exceedance:</span>
                    <Badge variant="outline">{displayData.filter((r) => r.Exceedance_Flag).length}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Filters */}
              <Tabs defaultValue="location" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="location">Location</TabsTrigger>
                  <TabsTrigger value="risk">Risk</TabsTrigger>
                  <TabsTrigger value="context">Context</TabsTrigger>
                </TabsList>

                <TabsContent value="location" className="space-y-4">
                  <div className="space-y-2">
                    <Label>States</Label>
                    <Select
                      value={filters.states.length > 0 ? filters.states[0] : "all"}
                      onValueChange={(value) => {
                        if (value === "all") {
                          setFilters((prev) => ({ ...prev, states: [], districts: [] }))
                        } else {
                          setFilters((prev) => ({ ...prev, states: [value], districts: [] }))
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All states" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All States</SelectItem>
                        {uniqueStates.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Districts</Label>
                    <Select
                      value={filters.districts.length > 0 ? filters.districts[0] : "all"}
                      onValueChange={(value) => {
                        if (value === "all") {
                          setFilters((prev) => ({ ...prev, districts: [] }))
                        } else {
                          setFilters((prev) => ({ ...prev, districts: [value] }))
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All districts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Districts</SelectItem>
                        {uniqueDistricts.map((district) => (
                          <SelectItem key={district} value={district}>
                            {district}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="risk" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Risk Index Range</Label>
                    <Slider
                      value={[filters.riskRange[0] * 100, filters.riskRange[1] * 100]}
                      onValueChange={([min, max]) =>
                        setFilters((prev) => ({ ...prev, riskRange: [min / 100, max / 100] }))
                      }
                      min={0}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{filters.riskRange[0].toFixed(2)}</span>
                      <span>{filters.riskRange[1].toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="exceedance-only">Exceedance Only</Label>
                    <Switch
                      id="exceedance-only"
                      checked={filters.exceedanceOnly}
                      onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, exceedanceOnly: checked }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Heavy Metals</Label>
                    <div className="flex flex-wrap gap-1">
                      {uniqueMetals.map((metal) => (
                        <Badge
                          key={metal}
                          variant={filters.metals.includes(metal) ? "default" : "secondary"}
                          className="cursor-pointer text-xs"
                          onClick={() => {
                            setFilters((prev) => ({
                              ...prev,
                              metals: prev.metals.includes(metal)
                                ? prev.metals.filter((m) => m !== metal)
                                : [...prev.metals, metal],
                            }))
                          }}
                        >
                          {metal}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="context" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Land Use Types</Label>
                    <div className="flex flex-wrap gap-1">
                      {uniqueLandUseTypes.map((type) => (
                        <Badge
                          key={type}
                          variant={filters.landUseTypes.includes(type) ? "default" : "secondary"}
                          className="cursor-pointer text-xs"
                          onClick={() => {
                            setFilters((prev) => ({
                              ...prev,
                              landUseTypes: prev.landUseTypes.includes(type)
                                ? prev.landUseTypes.filter((t) => t !== type)
                                : [...prev.landUseTypes, type],
                            }))
                          }}
                        >
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Groundwater Depth (m)</Label>
                    <Slider
                      value={filters.depthRange}
                      onValueChange={(range) =>
                        setFilters((prev) => ({ ...prev, depthRange: range as [number, number] }))
                      }
                      min={0}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{filters.depthRange[0]}m</span>
                      <span>{filters.depthRange[1]}m</span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Layer Controls */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Map Layers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(mapLayers).map(([key, enabled]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label className="text-xs capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</Label>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked) => setMapLayers((prev) => ({ ...prev, [key]: checked }))}
                        size="sm"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Advanced Features */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Advanced Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Hotspot Mode</Label>
                    <Switch checked={hotspotMode} onCheckedChange={setHotspotMode} size="sm" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Compare Mode</Label>
                    <Switch
                      checked={compareMode.enabled}
                      onCheckedChange={(checked) =>
                        setCompareMode((prev) => ({ ...prev, enabled: checked, selectedRasters: [] }))
                      }
                      size="sm"
                    />
                  </div>
                  {compareMode.enabled && (
                    <div className="text-xs text-muted-foreground">
                      Selected: {compareMode.selectedRasters.length}/2
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Reset Filters */}
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({
                    states: [],
                    districts: [],
                    metals: [],
                    riskRange: [0, 1],
                    exceedanceOnly: false,
                    landUseTypes: [],
                    depthRange: [0, 100],
                    searchQuery: "",
                  })
                  setHotspotMode(false)
                  setCompareMode({ enabled: false, selectedRasters: [] })
                }}
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset All Filters
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Map Area */}
      <div className="flex-1 flex flex-col">
        <div className="bg-card border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
                <Filter className="h-4 w-4" />
              </Button>

              <AlertsBanner />

              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  <MapPin className="h-3 w-3 mr-1" />
                  {displayData.length} cells
                </Badge>
                {hotspotMode && (
                  <Badge variant="destructive">
                    <Target className="h-3 w-3 mr-1" />
                    Hotspots
                  </Badge>
                )}
                {compareMode.enabled && (
                  <Badge variant="secondary">
                    <Compare className="h-3 w-3 mr-1" />
                    Compare ({compareMode.selectedRasters.length}/2)
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportCurrentView}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={shareCurrentView}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <ReportExportModal data={displayData} />
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <div ref={containerRef} className="w-full h-full">
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-default"
              onMouseMove={handleMouseMove}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onClick={handleClick}
            />
          </div>

          {hoveredRaster && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-4 left-4 bg-popover border border-border rounded-lg p-3 shadow-lg z-10 max-w-xs"
            >
              <div className="space-y-1">
                <div className="font-medium text-sm">{hoveredRaster.Raster_ID}</div>
                <div className="text-xs text-muted-foreground">
                  {hoveredRaster.State} • {hoveredRaster.District}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={hoveredRaster.Exceedance_Flag ? "destructive" : "secondary"} className="text-xs">
                    Risk: {hoveredRaster.Risk_Index.toFixed(2)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {hoveredRaster.Land_Use_Type}
                  </Badge>
                </div>
                <div className="text-xs">Population: {hoveredRaster.Population_Exposed.toLocaleString()}</div>
              </div>
            </motion.div>
          )}

          <Card className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-96">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Time Series Playback</Label>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsPlaying(!isPlaying)}>
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentYear(2010)
                        setIsPlaying(false)
                      }}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Slider
                    value={[currentYear]}
                    onValueChange={([year]) => setCurrentYear(year)}
                    min={2010}
                    max={2024}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>2010</span>
                    <span className="font-medium">{currentYear}</span>
                    <span>2024</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="absolute top-4 right-4 w-48">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Risk Index</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-xs">Low (0.0 - 0.3)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span className="text-xs">Moderate (0.3 - 0.6)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-500 rounded"></div>
                  <span className="text-xs">High (0.6 - 0.8)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-xs">Critical (0.8 - 1.0)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <RasterDetailDrawer
        open={!!selectedRaster}
        onOpenChange={(open) => !open && setSelectedRaster(null)}
        raster={selectedRaster}
      />
    </div>
  )
}
