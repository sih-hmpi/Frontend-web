import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Suspense } from "react"
import { NavigationSidebar } from "@/components/navigation-sidebar"

export const metadata: Metadata = {
  title: "Groundwater Monitoring Dashboard",
  description: "Heavy Metal Contamination Analysis for India",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>{/* Removed meta tag exposing MAPBOX token */}</head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <div className="flex h-screen bg-background">
              <NavigationSidebar />
              <main className="flex-1 overflow-auto">{children}</main>
            </div>
            <Analytics />
          </ThemeProvider>
        </Suspense>
      </body>
    </html>
  )
}
