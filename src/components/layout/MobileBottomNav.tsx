'use client'

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Home, Dumbbell, Utensils, HeartPulse } from "lucide-react"
import { cn } from "@/lib/utils"

export function MobileBottomNav() {
  const searchParams = useSearchParams()
  const currentTab = searchParams.get("tab") || "daily-metrics"

  const navItems = [
    { name: "Daily Metrics", href: "/?tab=daily-metrics", icon: Home, tabValue: "daily-metrics" },
    { name: "Fitness", href: "/?tab=fitness", icon: Dumbbell, tabValue: "fitness" },
    { name: "Nutrition", href: "/?tab=nutrition", icon: Utensils, tabValue: "nutrition" },
    { name: "Biometrics", href: "/?tab=biometrics", icon: HeartPulse, tabValue: "biometrics" },
  ]

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-white border-t border-gray-200 dark:bg-gray-950 dark:border-gray-800 md:hidden">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const isActive = currentTab === item.tabValue
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-sm font-medium transition-colors",
                isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
