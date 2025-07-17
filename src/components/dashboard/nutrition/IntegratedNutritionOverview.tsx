// src/components/dashboard/nutrition/IntegratedNutritionOverview.tsx
'use client'

import { useMemo } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { useWeightEntries } from '@/hooks/useWeightEntries'
import { useGoals } from '@/hooks/useGoals'
import { useNutrition } from '@/components/nutrition/NutritionDataProvider'
import { calculateGoalCalories, calculateGoalMacros } from '@/lib/goal_calculations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CircularProgress } from '@/components/dashboard/shared/CircularProgress'
import { Apple } from 'lucide-react'

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9,
} as const

export function IntegratedNutritionOverview() {
  const { profile, loading: profileLoading, isProfileComplete } = useProfile()
  const { weightEntries, loading: weightLoading } = useWeightEntries()
  const { activeGoal, loading: goalLoading } = useGoals()
  const { foodLogs, loading: nutritionLoading } = useNutrition()

  const macroTargets = useMemo(() => {
    if (!profile || !isProfileComplete || weightEntries.length === 0) {
      return null
    }
    const currentWeight = weightEntries.sort(
      (a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
    )[0].weight_lbs
    const birthDate = new Date(profile.birth_date!)
    const age = Math.floor(
      (new Date().getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    )
    let bmr: number
    if (profile.biological_sex === 'male') {
      bmr = 10 * (currentWeight / 2.205) + 6.25 * (profile.height_inches! * 2.54) - 5 * age + 5
    } else {
      bmr = 10 * (currentWeight / 2.205) + 6.25 * (profile.height_inches! * 2.54) - 5 * age - 161
    }
    const tdee = bmr * ACTIVITY_MULTIPLIERS[profile.activity_level!]
    let adjustedCalories = tdee
    if (activeGoal) {
      const goalData = calculateGoalCalories(tdee, currentWeight, activeGoal)
      adjustedCalories = goalData.adjustedCalories
    }
    return calculateGoalMacros(adjustedCalories, currentWeight)
  }, [profile, isProfileComplete, weightEntries, activeGoal])

  const loggedMacros = useMemo(() => {
    const totals = { protein: 0, carbs: 0, fat: 0, calories: 0 }
    foodLogs.forEach(log => {
      const factor = log.quantity / 100
      totals.protein += (log.food.protein_per_100g || 0) * factor
      totals.carbs += (log.food.carbs_per_100g || 0) * factor
      totals.fat += (log.food.fat_per_100g || 0) * factor
      totals.calories += (log.food.calories_per_100g || 0) * factor
    })
    return totals
  }, [foodLogs])

  const isLoading = profileLoading || weightLoading || goalLoading || nutritionLoading

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Nutrition Progress</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-48">
          <p className="text-muted-foreground">Loading nutrition data...</p>
        </CardContent>
      </Card>
    )
  }

  if (!isProfileComplete || weightEntries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Nutrition Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Complete your profile and add a weight entry to see your personalized nutrition dashboard.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!macroTargets) {
    return null // Or some other fallback UI
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Apple className="h-5 w-5" />
          Daily Nutrition Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row justify-around items-center gap-8 py-6">
        <div className="flex flex-col items-center">
            <span className="text-4xl font-bold text-orange-500">{Math.round(loggedMacros.calories)}</span>
            <span className="text-muted-foreground">/ {macroTargets.calories} kcal</span>
        </div>
        <CircularProgress
          value={loggedMacros.protein}
          max={macroTargets.protein}
          label="Protein"
          unit="grams"
          color="#ef4444" // red-500
        />
        <CircularProgress
          value={loggedMacros.carbs}
          max={macroTargets.carbs}
          label="Carbs"
          unit="grams"
          color="#f59e0b" // amber-500
        />
        <CircularProgress
          value={loggedMacros.fat}
          max={macroTargets.fat}
          label="Fat"
          unit="grams"
          color="#eab308" // yellow-500
        />
      </CardContent>
    </Card>
  )
}
