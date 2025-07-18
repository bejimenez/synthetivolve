// src/components/dashboard/tabs/DailyMetricsTab.tsx
'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/hooks/useProfile'
import { WeightEntryForm } from '@/components/weight/WeightEntryForm'
import { WeightHistory } from '@/components/weight/WeightHistory'
import { GoalProgressWidget } from '@/components/goals/GoalProgressWidget'
import { GoalProgressChart } from '@/components/goals/GoalProgressChart'
import { GoalCreationForm } from '@/components/goals/GoalCreationForm'
import { EnhancedNutritionDisplay } from '@/components/dashboard/nutrition/EnhancedNutritionDisplay'
import { useNutrition } from '@/components/nutrition/NutritionDataProvider'
import { useGoals } from '@/hooks/useGoals'
import { useWeightEntries } from '@/hooks/useWeightEntries'
import { calculateGoalCalories } from '@/lib/goal_calculations'
import { DailySummary } from '@/components/dashboard/shared/DailySummary'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { FoodLogWithFood } from '@/lib/nutrition/nutrition.types'

// Separate component to use the nutrition hook
function CompactNutritionSummary({ foodLogs, nutritionLoading }: { foodLogs: FoodLogWithFood[], nutritionLoading: boolean }) {
  return (
    <EnhancedNutritionDisplay 
      foodLogs={foodLogs}
      nutritionLoading={nutritionLoading}
      variant="compact"
    />
  )
}

export default function DailyMetricsTab() {
  const [showGoalCreation, setShowGoalCreation] = useState(false)
  const [isWeightHistoryOpen, setIsWeightHistoryOpen] = useState(true) // Default open
  const [isGoalProgressChartOpen, setIsGoalProgressChartOpen] = useState(true) // Default open
  const router = useRouter()

  // Fetch nutrition data and calculate calorie goal
  const { foodLogs, loading: nutritionLoading } = useNutrition()
  const { activeGoal } = useGoals()
  const { profile, isProfileComplete } = useProfile()
  const { weightEntries } = useWeightEntries()

  const calorieGoal = useMemo(() => {
    if (!profile || !isProfileComplete || weightEntries.length === 0 || !activeGoal) {
      return 2000 // Default or loading state
    }

    const currentWeight = weightEntries.sort(
      (a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
    )[0].weight_lbs

    const birthDate = new Date(profile.birth_date!)
    const age = Math.floor(
      (new Date().getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    )

    const ACTIVITY_MULTIPLIERS = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      extremely_active: 1.9,
    } as const

    let bmr: number
    if (profile.biological_sex === 'male') {
      bmr = 10 * (currentWeight / 2.205) + 6.25 * (profile.height_inches! * 2.54) - 5 * age + 5
    } else {
      bmr = 10 * (currentWeight / 2.205) + 6.25 * (profile.height_inches! * 2.54) - 5 * age - 161
    }

    const tdee = bmr * ACTIVITY_MULTIPLIERS[profile.activity_level!]
    const goalCals = calculateGoalCalories(tdee, currentWeight, activeGoal)
    return goalCals.adjustedCalories
  }, [profile, isProfileComplete, weightEntries, activeGoal])

  return (
    <div className="space-y-8 mt-4">
      {/* Profile Completion Alert */}
      {!isProfileComplete && (
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-900">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            Complete your <Button variant="link" className="p-0 h-auto align-baseline text-amber-800 dark:text-amber-200" onClick={() => router.push('/profile')}>profile settings</Button> to unlock personalized calorie and macro recommendations.
          </AlertDescription>
        </Alert>
      )}

      {/* Weight Entry and History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeightEntryForm />
        <Collapsible open={isWeightHistoryOpen} onOpenChange={setIsWeightHistoryOpen} className="lg:col-span-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Weight History</h3>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 p-0">
                <ChevronDown className={cn("h-4 w-4 transition-transform", isWeightHistoryOpen ? "rotate-180" : "rotate-0")} />
                <span className="sr-only">Toggle Weight History</span>
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="overflow-hidden transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <WeightHistory />
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Daily Summary Card */}
      <DailySummary foodLogs={foodLogs} calorieGoal={calorieGoal} />

      {/* Compact Nutrition Summary - replaces CompactCalorieCalculator */}
      <CompactNutritionSummary foodLogs={foodLogs} nutritionLoading={nutritionLoading} />

      {/* Goal Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GoalProgressWidget onCreateGoal={() => setShowGoalCreation(true)} />
        <Collapsible open={isGoalProgressChartOpen} onOpenChange={setIsGoalProgressChartOpen} className="lg:col-span-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Goal Progress Chart</h3>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 p-0">
                <ChevronDown className={cn("h-4 w-4 transition-transform", isGoalProgressChartOpen ? "rotate-180" : "rotate-0")} />
                <span className="sr-only">Toggle Goal Progress Chart</span>
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="overflow-hidden transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <GoalProgressChart />
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Goal Creation Form */}
      {showGoalCreation && (
        <GoalCreationForm onCancel={() => setShowGoalCreation(false)} />
      )}
    </div>
  )
}