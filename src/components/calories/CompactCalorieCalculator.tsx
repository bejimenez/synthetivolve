// src/components/calories/CompactCalorieCalculator.tsx
'use client'

import { useMemo } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { useWeightEntries } from '@/hooks/useWeightEntries'
import { useGoals } from '@/hooks/useGoals'
import { calculateGoalCalories, calculateGoalMacros } from '@/lib/goal_calculations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Calculator, Zap, Target, Apple, AlertTriangle, Activity, HelpCircle } from 'lucide-react'

// Activity level multipliers for TDEE calculation
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9,
} as const

interface CalorieData {
  bmr: number
  tdee: number
  adjustedCalories: number
  adjustmentReason: string
  warnings: string[]
  macros: {
    protein: number
    fat: number
    carbs: number
  }
}

import { CircularProgress } from '@/components/dashboard/shared/CircularProgress'

function getActivityDescription(level: string): string {
  const descriptions = {
    sedentary: 'Sedentary',
    lightly_active: 'Light Activity',
    moderately_active: 'Moderate Activity',
    very_active: 'Very Active',
    extremely_active: 'Extremely Active',
  }
  return descriptions[level as keyof typeof descriptions] || level
}

export function CompactCalorieCalculator() {
  const { profile, loading: profileLoading, isProfileComplete } = useProfile()
  const { weightEntries, loading: weightLoading } = useWeightEntries()
  const { activeGoal, loading: goalLoading } = useGoals()

  const calculatedData = useMemo((): CalorieData | null => {
    if (!profile || !isProfileComplete || weightEntries.length === 0) {
      return null
    }

    // Get most recent weight
    const currentWeight = weightEntries.sort(
      (a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
    )[0].weight_lbs

    // Calculate age
    const birthDate = new Date(profile.birth_date!)
    const age = Math.floor(
      (new Date().getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    )

    // BMR calculation using Mifflin-St Jeor equation
    let bmr: number
    if (profile.biological_sex === 'male') {
      bmr = 10 * (currentWeight / 2.205) + 6.25 * (profile.height_inches! * 2.54) - 5 * age + 5
    } else {
      bmr = 10 * (currentWeight / 2.205) + 6.25 * (profile.height_inches! * 2.54) - 5 * age - 161
    }

    // TDEE calculation
    const tdee = bmr * ACTIVITY_MULTIPLIERS[profile.activity_level!]

    // Calculate goal-based calories and macros
    let adjustedCalories = tdee
    let adjustmentReason = 'maintenance calories'
    const warnings: string[] = []

    if (activeGoal) {
      const goalData = calculateGoalCalories(tdee, currentWeight, activeGoal)
      adjustedCalories = goalData.adjustedCalories
      adjustmentReason = goalData.adjustmentReason
      warnings.push(...goalData.warnings)
    }

    // Calculate macros using the goal calculations utility
    const macroData = calculateGoalMacros(adjustedCalories, currentWeight)

    return {
      bmr,
      tdee,
      adjustedCalories,
      adjustmentReason,
      warnings,
      macros: {
        protein: macroData.protein,
        fat: macroData.fat,
        carbs: macroData.carbs,
      },
    }
  }, [profile, isProfileComplete, weightEntries, activeGoal])

  if (profileLoading || weightLoading || goalLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Calculator className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
            <p className="text-muted-foreground">Calculating your nutrition targets...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isProfileComplete) {
    return (
      <Card className="w-full">
        <CardContent className="py-8">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Complete your profile settings to see personalized calorie and macro recommendations.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!calculatedData) {
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Nutrition Summary
          {activeGoal && (
            <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full">
              {activeGoal.goal_type === 'fat_loss' && 'Fat Loss'}
              {activeGoal.goal_type === 'muscle_gain' && 'Muscle Gain'}
              {activeGoal.goal_type === 'maintenance' && 'Maintenance'}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Warnings */}
        {calculatedData.warnings.length > 0 && (
          <Alert variant="destructive" className="dark:bg-destructive/20 dark:border-destructive/40">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {calculatedData.warnings.join(' ')}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* BMR */}
          <div className="flex flex-col items-center text-center p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">BMR</span>
            </div>
            <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {Math.round(calculatedData.bmr).toLocaleString()}
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400">calories/day at rest</span>
          </div>

          {/* TDEE */}
          <div className="flex flex-col items-center text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">TDEE</span>
            </div>
            <span className="text-2xl font-bold text-green-900 dark:text-green-100">
              {Math.round(calculatedData.tdee).toLocaleString()}
            </span>
            <span className="text-xs text-green-600 dark:text-green-400">maintenance calories</span>
          </div>

          {/* Target Calories */}
          <div className="flex flex-col items-center text-center p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Apple className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Target</span>
            </div>
            <span className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {Math.round(calculatedData.adjustedCalories).toLocaleString()}
            </span>
            <span className="text-xs text-orange-600 dark:text-orange-400">{calculatedData.adjustmentReason}</span>
          </div>
        </div>

        {/* Macro Breakdown with Circular Charts */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Daily Macro Targets
            <Dialog>
              <DialogTrigger asChild>
                <button className="ml-auto p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md dark:bg-gray-900 dark:border-gray-700">
                <DialogHeader>
                  <DialogTitle className="dark:text-gray-100">How Macro Targets Are Calculated</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-green-600 dark:text-green-400 mb-1">Protein</h4>
                    <p>1 gram per pound of body weight</p>
                    <p className="text-muted-foreground">Example: 150 lbs = 150g protein</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-yellow-600 dark:text-yellow-400 mb-1">Fat</h4>
                    <p>Minimum 50g per day, or 0.25g per pound (whichever is higher)</p>
                    <p className="text-muted-foreground">Example: 150 lbs = max(50g, 37.5g) = 50g fat</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-600 dark:text-red-400 mb-1">Carbohydrates</h4>
                    <p>Remaining calories after protein and fat allocation</p>
                    <p className="text-muted-foreground">Calculated as: (Total Calories - Protein Calories - Fat Calories) ÷ 4</p>
                  </div>
                  <div className="pt-2 border-t dark:border-gray-700">
                    <p className="text-xs text-muted-foreground">
                      <strong>Note:</strong> These calculations ensure adequate protein for muscle maintenance and minimum fat for hormonal health, while filling remaining calories with carbohydrates for energy.
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Protein */}
            <div className="flex flex-col items-center text-center">
              <CircularProgress
                value={calculatedData.macros.protein}
                max={calculatedData.macros.protein}
                label="Protein"
                unit="g"
                color="var(--chart-weight-loss)"
                size={100}
                strokeWidth={6}
              />
              <h4 className="text-sm font-medium mt-3 text-green-700 dark:text-green-400">Protein</h4>
              <p className="text-xs text-muted-foreground">
                {calculatedData.macros.protein * 4} calories
              </p>
            </div>

            {/* Fat */}
            <div className="flex flex-col items-center text-center">
              <CircularProgress
                value={calculatedData.macros.fat}
                max={calculatedData.macros.fat}
                label="Fat"
                unit="g"
                color="var(--chart-5)"
                size={100}
                strokeWidth={6}
              />
              <h4 className="text-sm font-medium mt-3 text-yellow-700 dark:text-yellow-400">Fat</h4>
              <p className="text-xs text-muted-foreground">
                {calculatedData.macros.fat * 9} calories
              </p>
            </div>

            {/* Carbs */}
            <div className="flex flex-col items-center text-center">
              <CircularProgress
                value={calculatedData.macros.carbs}
                max={calculatedData.macros.carbs}
                label="Carbs"
                unit="g"
                color="var(--chart-weight-gain)"
                size={100}
                strokeWidth={6}
              />
              <h4 className="text-sm font-medium mt-3 text-red-700 dark:text-red-400">Carbs</h4>
              <p className="text-xs text-muted-foreground">
                {calculatedData.macros.carbs * 4} calories
              </p>
            </div>
          </div>
        </div>

        {/* Activity Level & Goal Info */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-muted/50 rounded-lg dark:bg-muted/20">
          <div>
            <p className="text-sm font-medium">Activity Level</p>
            <p className="text-sm text-muted-foreground">
              {profile && profile.activity_level && getActivityDescription(profile.activity_level)}
            </p>
          </div>
          {calculatedData.warnings.length === 0 && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Targets look good!</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}