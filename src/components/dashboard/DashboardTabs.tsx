// src/components/dashboard/DashboardTabs.tsx
'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTabPersistence } from "@/hooks/useTabPersistence"
import React, { Suspense } from 'react'

const DailyMetricsTab = React.lazy(() => import("./tabs/DailyMetricsTab"))
const FitnessTab = React.lazy(() => import("./tabs/FitnessTab"))
const NutritionTab = React.lazy(() => import("./tabs/NutritionTab"))
const BiometricsTab = React.lazy(() => import("./tabs/BiometricsTab"))

export function DashboardTabs() {
  const { currentTab, setTab } = useTabPersistence('daily-metrics')

  return (
    <Tabs value={currentTab} onValueChange={setTab} className="w-full">
      <TabsList className="hidden md:grid w-full grid-cols-4">
        <TabsTrigger value="daily-metrics">Daily Metrics</TabsTrigger>
        <TabsTrigger value="fitness">Fitness</TabsTrigger>
        <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
        <TabsTrigger value="biometrics">Biometrics</TabsTrigger>
      </TabsList>
      <Suspense fallback={<div>Loading tab...</div>}>
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
      </Suspense>
    </Tabs>
  )
}