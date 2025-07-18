// src/components/dashboard/DashboardTabs.tsx
'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DailyMetricsTab } from "./tabs/DailyMetricsTab"
import { FitnessTab } from "./tabs/FitnessTab"
import { NutritionTab } from "./tabs/NutritionTab"
import { BiometricsTab } from "./tabs/BiometricsTab"
import { useRouter, useSearchParams } from "next/navigation"

export function DashboardTabs() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get("tab") || "daily-metrics"

  const handleTabChange = (value: string) => {
    router.push(`/?tab=${value}`)
  }

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="hidden md:grid w-full grid-cols-4">
        <TabsTrigger value="daily-metrics">Daily Metrics</TabsTrigger>
        <TabsTrigger value="fitness">Fitness</TabsTrigger>
        <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
        <TabsTrigger value="biometrics">Biometrics</TabsTrigger>
      </TabsList>
      <TabsContent value="daily-metrics">
        <DailyMetricsTab />
      </TabsContent>
      <TabsContent value="fitness">
        <FitnessTab />
      </TabsContent>
      <TabsContent value="nutrition">
        <NutritionTab />
      </TabsContent>
      <TabsContent value="biometrics">
        <BiometricsTab />
      </TabsContent>
    </Tabs>
  )
}
