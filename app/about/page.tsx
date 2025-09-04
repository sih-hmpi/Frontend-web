export default function AboutPage() {
  return (
    <main className="container mx-auto px-4 py-6 space-y-4">
      <h1 className="text-lg font-semibold">About</h1>
      <p className="text-pretty text-sm leading-relaxed">
        This is a mock Heavy Metal Groundwater Monitoring Dashboard for India using 3×3 km pseudo-cells. It demonstrates
        map-based risk visualization, filters, analytics, and export tooling with purely synthetic data.
      </p>
      <ul className="list-disc pl-5 text-sm space-y-1">
        <li>Tech: Next.js App Router, Tailwind, shadcn/ui, Mapbox GL, SWR, Recharts, Framer Motion.</li>
        <li>Data: /data/mock_rasters.json is padded at runtime to ~1000 rows for realistic density.</li>
        <li>Accessibility: keyboard-friendly controls, ARIA labels, sufficient contrast in both themes.</li>
        <li>Note: Replace mock data and placeholder APIs for production deployments.</li>
      </ul>
    </main>
  )
}
