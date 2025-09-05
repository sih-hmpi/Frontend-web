"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/old2/lib/utils"
import { Card } from "@/old2/components/ui/card"
import {
  MapIcon,
  BarChart3Icon,
  HomeIcon,
  GitCompareIcon,
  InfoIcon,
  ActivityIcon,
  DatabaseIcon,
  AlertTriangleIcon,
  Database
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/", icon: HomeIcon },
  { name: "Interactive Map", href: "/map", icon: MapIcon },
  { name: "Data", href: "/data", icon: Database },
  { name: "Analytics", href: "/analytics", icon: BarChart3Icon },
  { name: "Compare Regions", href: "/compare", icon: GitCompareIcon },
  { name: "About", href: "/about", icon: InfoIcon },
]

const quickStats = [
  { label: "Total Rasters", value: "1,000+", icon: DatabaseIcon, color: "bg-blue-500" },
  { label: "High Risk Areas", value: "156", icon: AlertTriangleIcon, color: "bg-red-500" },
  { label: "States Monitored", value: "28", icon: ActivityIcon, color: "bg-green-500" },
]

export function NavigationSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 h-screen bg-background border-r flex flex-col">
      {/* Header */}
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold text-foreground">Groundwater Monitor</h2>
        <p className="text-sm text-muted-foreground mt-1">Heavy Metal Analysis Dashboard</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Quick Stats */}
      <div className="p-4 border-t">
        <h3 className="text-sm font-medium mb-3">Quick Stats</h3>
        <div className="space-y-3">
          {quickStats.map((stat) => (
            <Card key={stat.label} className="p-3">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-md", stat.color)}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
