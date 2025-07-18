// src/components/dashboard/tabs/NutritionTab.tsx
'use client'

import { EnhancedNutritionDisplay } from '@/components/dashboard/nutrition/EnhancedNutritionDisplay'
import { NutritionDataProvider, useNutrition } from '@/components/nutrition/NutritionDataProvider'
import { NutritionQuickActions } from '@/components/dashboard/nutrition/NutritionQuickActions'
import { useNutritionStreak } from '@/hooks/useNutritionStreak'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Flame } from 'lucide-react'
import { format } from 'date-fns'

// Separate component to use the nutrition hook
function FullNutritionDisplay() {
  const { foodLogs, loading } = useNutrition()
  const { streak, lastLoggedDate, loading: streakLoading } = useNutritionStreak()

  return (
    <>
      <EnhancedNutritionDisplay 
        foodLogs={foodLogs}
        nutritionLoading={loading}
        variant="full"
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Nutrition Streak</CardTitle>
          <Flame className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          {streakLoading ? (
            <p className="text-muted-foreground">Loading streak...</p>
          ) : (
            <div className="text-2xl font-bold">
              {streak} Day{streak === 1 ? '' : 's'}
              {lastLoggedDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last logged: {format(lastLoggedDate, 'PPP')}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

export default function NutritionTab() {
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
