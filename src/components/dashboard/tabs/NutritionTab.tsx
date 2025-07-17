// src/components/dashboard/tabs/NutritionTab.tsx
'use client'

import { IntegratedNutritionOverview } from '@/components/dashboard/nutrition/IntegratedNutritionOverview'
import { NutritionDataProvider } from '@/components/nutrition/NutritionDataProvider'
import { NutritionQuickActions } from '@/components/dashboard/nutrition/NutritionQuickActions'

export function NutritionTab() {
  return (
    <div className="mt-4 space-y-6">
      <NutritionDataProvider>
        <IntegratedNutritionOverview />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Placeholder for future charts or data, e.g., calorie sources pie chart */}
          </div>
          <NutritionQuickActions />
        </div>
      </NutritionDataProvider>
    </div>
  )
}
