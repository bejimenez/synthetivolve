// src/components/dashboard/tabs/NutritionTab.tsx
'use client'

import { EnhancedNutritionDisplay } from '@/components/dashboard/nutrition/EnhancedNutritionDisplay'
import { NutritionDataProvider, useNutrition } from '@/components/nutrition/NutritionDataProvider'
import { NutritionQuickActions } from '@/components/dashboard/nutrition/NutritionQuickActions'

// Separate component to use the nutrition hook
function FullNutritionDisplay() {
  const { foodLogs, loading } = useNutrition()
  
  return (
    <EnhancedNutritionDisplay 
      foodLogs={foodLogs}
      nutritionLoading={loading}
      variant="full"
    />
  )
}

export function NutritionTab() {
  return (
    <div className="mt-4 space-y-6">
      <NutritionDataProvider>
        {/* Main nutrition dashboard - replaces both old components */}
        <FullNutritionDisplay />
        
        {/* Grid layout for additional features */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Placeholder for future charts or data, e.g., calorie sources pie chart */}
            <div className="h-48 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground text-center">
                Future: Daily meal breakdown chart<br />
                <span className="text-sm">Coming soon</span>
              </p>
            </div>
          </div>
          <NutritionQuickActions />
        </div>
      </NutritionDataProvider>
    </div>
  )
}