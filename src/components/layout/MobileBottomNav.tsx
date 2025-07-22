// src/components/layout/MobileBottomNav.tsx
'use client'

import { useTabPersistence } from "@/hooks/useTabPersistence"
import { Home, Dumbbell, Utensils, HeartPulse } from "lucide-react"
import { cn } from "@/lib/utils"

export function MobileBottomNav() {
  const { currentTab, setTab } = useTabPersistence('daily-metrics')

  const navItems = [
    { name: "Daily Metrics", tabValue: "daily-metrics", icon: Home },
    { name: "Fitness", tabValue: "fitness", icon: Dumbbell },
    { name: "Nutrition", tabValue: "nutrition", icon: Utensils },
    { name: "Biometrics", tabValue: "biometrics", icon: HeartPulse },
  ]

  const handleTabClick = (tabValue: string) => {
    setTab(tabValue)
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-white border-t border-gray-200 dark:bg-gray-950 dark:border-gray-800 md:hidden">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const isActive = currentTab === item.tabValue
          return (
            <button
              key={item.name}
              onClick={() => handleTabClick(item.tabValue)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-sm font-medium transition-colors w-full h-full",
                isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}