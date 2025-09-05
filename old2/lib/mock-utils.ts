// Utility helpers for mock data, risk calc, filters, and CSV/JSON/PDF exports.

export type RasterRecord = {
  Raster_ID: string
  Lat_Center: number
  Lon_Center: number
  Region_State: string
  Region_District: string
  Population_Density: number
  Land_Use_Type: "Agri" | "Industrial" | "Urban" | "Mixed" | "Forest" | string
  Water_Source_Count: number
  Sampling_Frequency: number
  Heavy_Metals: Record<string, number>
  Trend_Data: number[]
  WHO_Limit: Record<string, number>
  Exceedance_Flag: boolean
  Health_Risk_Score: number
  Industrial_Proximity: number
  Mining_Proximity: number
  Agriculture_Proximity: number
  Rainfall: number
  Groundwater_Depth: number
  Recharge_Rate: number
  Urbanization_Index: number
  Policy_Interventions: Array<{ year: number; type: string }>
  Citizen_Reports: Array<{ year: number; note: string }>
  ML_Predictions: Record<string, number>
}

export type FiltersState = {
  state: string | null
  district: string | null
  metals: string[]
  riskRange: [number, number]
  exceedOnly: boolean
  hotspotsOnly: boolean
  year: number | null
}

export const INDIA_BOUNDS = {
  // Rough bounding box
  minLat: 6.5,
  maxLat: 35.5,
  minLon: 68.0,
  maxLon: 97.5,
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function computeRiskIndex(rec: RasterRecord): number {
  // Weighted normalized sum of exceedances, density, proximity, and trend slope
  const metalsObj = rec.Heavy_Metals ?? {}
  const limitsObj = rec.WHO_Limit ?? {}
  const metals = Object.keys(metalsObj)
  let exceedCount = 0
  metals.forEach((m) => {
    const v = (metalsObj as Record<string, number>)[m] ?? 0
    const lim = (limitsObj as Record<string, number>)[m] ?? Number.POSITIVE_INFINITY
    if (v > lim) exceedCount += 1
  })
  const exceedNorm = clamp(exceedCount / Math.max(1, metals.length), 0, 1)

  const pdNorm = clamp(rec.Population_Density / 25000, 0, 1)
  const industryNorm = clamp(1 - rec.Industrial_Proximity / 50, 0, 1)
  const trend = trendSlope(rec.Trend_Data ?? [])

  // weights: exceed 0.5, pop 0.2, industry 0.15, trend 0.15
  const risk = 0.5 * exceedNorm + 0.2 * pdNorm + 0.15 * industryNorm + 0.15 * normalizeTrend(trend)
  return clamp(risk, 0, 1)
}

export function trendSlope(arr: number[]): number {
  if (!arr || arr.length < 2) return 0
  const n = arr.length
  const xMean = (n - 1) / 2
  const yMean = arr.reduce((a, b) => a + b, 0) / n
  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (arr[i] - yMean)
    den += (i - xMean) ** 2
  }
  return den === 0 ? 0 : num / den
}

function normalizeTrend(slope: number) {
  // map slope to 0..1 roughly; assume |slope| <= 0.01 typical
  const norm = slope / 0.01
  return clamp((norm + 1) / 2, 0, 1)
}

export function metalPalette(value: number): string {
  // risk color mapping
  if (value >= 0.66) return "#ef4444" // red-500
  if (value >= 0.33) return "#f59e0b" // amber-500
  return "#10b981" // emerald-500
}

export function filterData(records: RasterRecord[], f: FiltersState) {
  return records.filter((r) => {
    const risk = computeRiskIndex(r)
    if (f.state && r.Region_State !== f.state) return false
    if (f.district && r.Region_District !== f.district) return false
    if (f.metals.length > 0) {
      const hasMetal = f.metals.some((m) => (r.Heavy_Metals ?? {})[m] != null)
      if (!hasMetal) return false
    }
    if (f.exceedOnly) {
      const metalsObj = r.Heavy_Metals ?? {}
      const limitsObj = r.WHO_Limit ?? {}
      const anyExceed = Object.keys(metalsObj).some((m) => {
        const v = (metalsObj as Record<string, number>)[m]
        const lim = (limitsObj as Record<string, number>)[m] ?? Number.POSITIVE_INFINITY
        return v > lim
      })
      if (!anyExceed) return false
    }
    if (f.hotspotsOnly && risk < 0.66) return false
    if (risk < f.riskRange[0] || risk > f.riskRange[1]) return false
    return true
  })
}

export function uniqueStates(records: RasterRecord[]): string[] {
  return Array.from(new Set(records.map((r) => r.Region_State))).sort()
}
export function uniqueDistricts(records: RasterRecord[], state?: string | null): string[] {
  const list = records.filter((r) => (state ? r.Region_State === state : true))
  return Array.from(new Set(list.map((r) => r.Region_District))).sort()
}
export function uniqueMetals(records: RasterRecord[]): string[] {
  const set = new Set<string>()
  records.forEach((r) => Object.keys(r.Heavy_Metals ?? {}).forEach((m) => set.add(m)))
  return Array.from(set).sort()
}

export function toCSV(records: RasterRecord[]): string {
  const headers = [
    "Raster_ID",
    "Lat_Center",
    "Lon_Center",
    "Region_State",
    "Region_District",
    "Population_Density",
    "Land_Use_Type",
    "Exceedance_Flag",
    "Health_Risk_Score",
    "Risk_Index",
    "As",
    "Pb",
    "Cr",
    "Cd",
    "Hg",
    "Fe",
    "Mn",
  ]
  const rows = records.map((r) => {
    const risk = computeRiskIndex(r)
    const metals = r.Heavy_Metals
    return [
      r.Raster_ID,
      r.Lat_Center,
      r.Lon_Center,
      r.Region_State,
      r.Region_District,
      r.Population_Density,
      r.Land_Use_Type,
      r.Exceedance_Flag,
      r.Health_Risk_Score,
      risk.toFixed(3),
      metals.As ?? "",
      metals.Pb ?? "",
      metals.Cr ?? "",
      metals.Cd ?? "",
      metals.Hg ?? "",
      metals.Fe ?? "",
      metals.Mn ?? "",
    ].join(",")
  })
  return [headers.join(","), ...rows].join("\n")
}

export function downloadBlob(content: BlobPart, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function rectangleForCell(lat: number, lon: number): [number, number][][] {
  // Approximate 3km in degrees: dLat ~ 0.027; dLon depends on latitude
  const dLat = 3 / 111 // ~0.027
  const kmPerDegLon = 111 * Math.cos((lat * Math.PI) / 180)
  const dLon = 3 / Math.max(1e-6, kmPerDegLon)
  const halfLat = dLat / 2
  const halfLon = dLon / 2
  const coords: [number, number][][] = [
    [
      [lon - halfLon, lat - halfLat],
      [lon + halfLon, lat - halfLat],
      [lon + halfLon, lat + halfLat],
      [lon - halfLon, lat + halfLat],
      [lon - halfLon, lat - halfLat],
    ],
  ]
  return coords
}

function normalizeSeed(input: unknown): any[] {
  if (Array.isArray(input)) return input
  const obj = input as any
  if (Array.isArray(obj?.records)) return obj.records
  if (Array.isArray(obj?.data)) return obj.data
  if (Array.isArray(obj?.rasters)) return obj.rasters
  return []
}

function sanitizeRecord(rec: any): RasterRecord {
  const heavy = (rec && typeof rec.Heavy_Metals === "object" && rec.Heavy_Metals) || {}
  const limits = (rec && typeof rec.WHO_Limit === "object" && rec.WHO_Limit) || {}
  const trend = Array.isArray(rec?.Trend_Data) ? rec.Trend_Data : Array.from({ length: 10 }, () => Math.random() * 0.01)

  const lat = Number.isFinite(rec?.Lat_Center) ? Number(rec.Lat_Center) : 23
  const lon = Number.isFinite(rec?.Lon_Center) ? Number(rec.Lon_Center) : 78

  return {
    Raster_ID: String(rec?.Raster_ID ?? `R-${Math.random().toString(36).slice(2, 8)}`),
    Lat_Center: clamp(lat, INDIA_BOUNDS.minLat, INDIA_BOUNDS.maxLat),
    Lon_Center: clamp(lon, INDIA_BOUNDS.minLon, INDIA_BOUNDS.maxLon),
    Region_State: String(rec?.Region_State ?? "Unknown"),
    Region_District: String(rec?.Region_District ?? "Unknown"),
    Population_Density: Number(rec?.Population_Density ?? 0),
    Land_Use_Type: String(rec?.Land_Use_Type ?? "Mixed"),
    Water_Source_Count: Number(rec?.Water_Source_Count ?? 0),
    Sampling_Frequency: Number(rec?.Sampling_Frequency ?? 0),
    Heavy_Metals: heavy,
    Trend_Data: trend,
    WHO_Limit: limits,
    Exceedance_Flag: Boolean(rec?.Exceedance_Flag ?? false),
    Health_Risk_Score: Number(rec?.Health_Risk_Score ?? 0),
    Industrial_Proximity: Number(rec?.Industrial_Proximity ?? 50),
    Mining_Proximity: Number(rec?.Mining_Proximity ?? 50),
    Agriculture_Proximity: Number(rec?.Agriculture_Proximity ?? 0),
    Rainfall: Number(rec?.Rainfall ?? 0),
    Groundwater_Depth: Number(rec?.Groundwater_Depth ?? 0),
    Recharge_Rate: Number(rec?.Recharge_Rate ?? 0),
    Urbanization_Index: Number(rec?.Urbanization_Index ?? 0),
    Policy_Interventions: Array.isArray(rec?.Policy_Interventions) ? rec.Policy_Interventions : [],
    Citizen_Reports: Array.isArray(rec?.Citizen_Reports) ? rec.Citizen_Reports : [],
    ML_Predictions: (rec && typeof rec.ML_Predictions === "object" && rec.ML_Predictions) || {},
  }
}

export function padToThousand(seedInput: any, target = 1000): RasterRecord[] {
  const seedRaw = normalizeSeed(seedInput)
  const seed = seedRaw.map(sanitizeRecord)
  if (seed.length === 0) return []
  if (seed.length >= target) return seed

  const out: RasterRecord[] = [...seed]
  let i = 0
  while (out.length < target) {
    const base = seed[i % seed.length]
    const jitterLat = (Math.random() - 0.5) * 0.2
    const jitterLon = (Math.random() - 0.5) * 0.2
    const lat = clamp(base.Lat_Center + jitterLat, INDIA_BOUNDS.minLat, INDIA_BOUNDS.maxLat)
    const lon = clamp(base.Lon_Center + jitterLon, INDIA_BOUNDS.minLon, INDIA_BOUNDS.maxLon)
    const metals = Object.fromEntries(
      Object.entries(base.Heavy_Metals ?? {}).map(([k, v]) => [
        k,
        Math.max(0, (v as number) * (0.7 + Math.random() * 0.6)),
      ]),
    )
    out.push({
      ...base,
      Raster_ID: `${base.Raster_ID}-${out.length + 1}`,
      Lat_Center: lat,
      Lon_Center: lon,
      Heavy_Metals: metals,
      Trend_Data: (base.Trend_Data ?? []).map((x) => Math.max(0, x * (0.8 + Math.random() * 0.4))),
      Exceedance_Flag: Math.random() < 0.5 ? base.Exceedance_Flag : !base.Exceedance_Flag,
      Health_Risk_Score: clamp((base.Health_Risk_Score ?? 0) + (Math.random() - 0.5) * 0.2, 0, 1),
    })
    i++
  }
  return out
}

export function formatNumber(n: number): string {
  return Intl.NumberFormat().format(n)
}
