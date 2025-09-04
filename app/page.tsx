// Landing Dashboard

import { ThemeToggle } from "@/components/theme-toggle"
import { RiskSummaryCards } from "@/components/risk-summary-cards"
import { TrendChart } from "@/components/trend-chart"
import { GlobalSearch } from "@/components/global-search"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-semibold text-balance">Heavy Metal Groundwater Monitoring (Mock)</h1>
        <div className="flex items-center gap-2">
          <GlobalSearch />
          <ThemeToggle />
        </div>
      </header>

      <nav className="flex gap-2">
        <Button asChild variant="secondary">
          <Link href="/map">Map</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/analytics">Analytics</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/compare">Compare</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/about">About</Link>
        </Button>
      </nav>

      <RiskSummaryCards />
      <TrendChart />

      <section aria-labelledby="quick-filters" className="space-y-2">
        <h2 id="quick-filters" className="text-lg font-medium">
          Quick Start
        </h2>
        <p className="text-sm text-muted-foreground">
          Use the Map to explore 3×3 km cells, toggle layers, click cells for detailed risk, and export current view.
        </p>
        <div>
          <Button asChild>
            <Link href="/map">Open Interactive Map</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
