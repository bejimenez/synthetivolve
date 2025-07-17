// src/components/dashboard/DashboardTabs.tsx
'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DailyMetricsTab } from "./tabs/DailyMetricsTab"
import { FitnessTab } from "./tabs/FitnessTab"
import { NutritionTab } from "./tabs/NutritionTab"
import { BiometricsTab } from "./tabs/BiometricsTab"

export function DashboardTabs() {
  return (
    <Tabs defaultValue="daily-metrics" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
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
