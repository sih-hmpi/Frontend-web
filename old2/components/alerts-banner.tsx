"use client"

import { useEffect, useState } from "react"
import { Card } from "@/old2/components/ui/card"

type AlertItem = {
  id: string
  message: string
  region?: string
  metal?: string
}

export function AlertsBanner() {
  const [alerts, setAlerts] = useState<AlertItem[]>([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch("/api/alerts")
        if (!res.ok) throw new Error("failed")
        const json = (await res.json()) as { alerts?: AlertItem[] }
        if (mounted) setAlerts(json.alerts ?? [])
      } catch {
        // fallback: silent
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const text =
    alerts.length > 0
      ? alerts.map((a) => a.message).join(" • ")
      : "Alert: Lead levels rising in Punjab (mock). Monitor hotspots and review interventions."

  return (
    <div className="absolute top-3 left-3 right-3 z-10" role="status" aria-live="polite">
      <Card className="px-3 py-2 bg-background/90 backdrop-blur border shadow-sm">
        <div className="text-sm">{text}</div>
      </Card>
    </div>
  )
}
