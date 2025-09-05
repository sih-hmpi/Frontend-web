"use client"

import { useMemo } from "react"
import useSWR from "swr"
import { Button } from "@/old2/components/ui/button"
import { Card } from "@/old2/components/ui/card"
import { Label } from "@/old2/components/ui/label"
import { Slider } from "@/old2/components/ui/slider"
import { Switch } from "@/old2/components/ui/switch"
import { Badge } from "@/old2/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/old2/components/ui/select"
import {
  type RasterRecord,
  padToThousand,
  uniqueStates,
  uniqueDistricts,
  uniqueMetals,
  type FiltersState,
} from "@/old2/lib/mock-utils"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Props = {
  value: FiltersState
  onChange: (v: FiltersState) => void
}

export function FilterSidebar({ value, onChange }: Props) {
  const { data } = useSWR<RasterRecord[]>("/data/mock_rasters.json", fetcher)
  const records = data ? padToThousand(data) : []
  const states = useMemo(() => uniqueStates(records), [records])
  const districts = useMemo(() => uniqueDistricts(records, value.state), [records, value.state])
  const metals = useMemo(() => uniqueMetals(records), [records])

  return (
    <Card className="p-4 space-y-4 sticky top-4 h-fit">
      <div className="space-y-2">
        <Label>State</Label>
        <Select
          value={value.state ?? "all"}
          onValueChange={(v) => onChange({ ...value, state: v || null, district: null })}
        >
          <SelectTrigger>
            <SelectValue placeholder="All states" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {states.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>District</Label>
        <Select value={value.district ?? "all"} onValueChange={(v) => onChange({ ...value, district: v || null })}>
          <SelectTrigger>
            <SelectValue placeholder="All districts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {districts.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Metal type</Label>
        <div className="flex flex-wrap gap-2">
          {metals.map((m) => {
            const selected = value.metals.includes(m)
            return (
              <Badge
                key={m}
                variant={selected ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => {
                  const next = selected ? value.metals.filter((x) => x !== m) : [...value.metals, m]
                  onChange({ ...value, metals: next })
                }}
                aria-pressed={selected}
                role="button"
              >
                {m}
              </Badge>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Risk index range</Label>
        <Slider
          value={[Math.round(value.riskRange[0] * 100), Math.round(value.riskRange[1] * 100)]}
          onValueChange={([a, b]) => onChange({ ...value, riskRange: [a / 100, b / 100] })}
          min={0}
          max={100}
          step={1}
          aria-label="Risk index range"
        />
        <div className="text-sm text-muted-foreground">
          {value.riskRange[0].toFixed(2)} – {value.riskRange[1].toFixed(2)}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="exceed-only">Exceedance only</Label>
        <Switch
          id="exceed-only"
          checked={value.exceedOnly}
          onCheckedChange={(v) => onChange({ ...value, exceedOnly: v })}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="hotspots">Show Hotspots</Label>
        <Switch
          id="hotspots"
          checked={value.hotspotsOnly}
          onCheckedChange={(v) => onChange({ ...value, hotspotsOnly: v })}
        />
      </div>

      <Button
        variant="secondary"
        onClick={() =>
          onChange({
            state: null,
            district: null,
            metals: [],
            riskRange: [0, 1],
            exceedOnly: false,
            hotspotsOnly: false,
            year: null,
          })
        }
      >
        Reset filters
      </Button>
    </Card>
  )
}
