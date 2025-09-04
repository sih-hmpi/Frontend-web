"use client"

import { useState } from "react"
import useSWR from "swr"
import { Input } from "@/components/ui/input"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { useRouter } from "next/navigation"
import { type RasterRecord, padToThousand } from "@/lib/mock-utils"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const { data } = useSWR<RasterRecord[]>("/data/mock_rasters.json", fetcher)
  const records = data ? padToThousand(data) : []
  const router = useRouter()

  const list = records
    .filter((r) => {
      const q = query.toLowerCase()
      return (
        r.Region_State.toLowerCase().includes(q) ||
        r.Region_District.toLowerCase().includes(q) ||
        Object.keys(r.Heavy_Metals).some((m) => m.toLowerCase().includes(q))
      )
    })
    .slice(0, 12)

  return (
    <div className="relative">
      <Input
        placeholder="Search state, district, metal..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        aria-label="Global search"
        className="w-full"
      />
      {open && query && (
        <div className="absolute z-50 mt-2 w-full rounded-md border bg-background shadow-md">
          <Command>
            <CommandInput value={query} onValueChange={setQuery} />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Matches">
                {list.map((r) => (
                  <CommandItem
                    key={r.Raster_ID}
                    onSelect={() => router.push(`/map?focus=${encodeURIComponent(r.Raster_ID)}`)}
                    className="cursor-pointer"
                  >
                    {r.Region_State} • {r.Region_District} • {r.Raster_ID}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  )
}
