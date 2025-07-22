// src/components/calories/EnhancedCalorieCalculator.tsx
'use client'

import { useMemo } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { useWeightEntries } from '@/hooks/useWeightEntries'
import { useGoals } from '@/hooks/useGoals'
import { calculateGoalCalories, calculateGoalMacros } from '@/lib/goal_calculations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Calculator, Zap, Target, Apple, AlertTriangle, HelpCircle } from 'lucide-react'

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
  macroCalories: {
    protein: number
    fat: number
    carbs: number
  }
}

export function EnhancedCalorieCalculator() {
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

    // Apply goal adjustments if active goal exists
    let adjustedCalories = tdee
    let adjustmentReason = 'Maintenance calories (no active goal)'
    let warnings: string[] = []

    if (activeGoal) {
      const goalCalories = calculateGoalCalories(tdee, currentWeight, activeGoal)
      adjustedCalories = goalCalories.adjustedCalories
      adjustmentReason = goalCalories.adjustmentReason
      warnings = goalCalories.warnings
    }

    // Calculate macros based on adjusted calories
    const macros = calculateGoalMacros(adjustedCalories, currentWeight)

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      adjustedCalories: Math.round(adjustedCalories),
      adjustmentReason,
      warnings,
      macros: macros,
      macroCalories: macros.macroCalories,
    }
  }, [profile, isProfileComplete, weightEntries, activeGoal])

  const getActivityDescription = (level: string) => {
    const descriptions = {
      sedentary: 'Office job, no exercise',
      lightly_active: 'Light exercise 1-3 days/week',
      moderately_active: 'Moderate exercise 3-5 days/week',
      very_active: 'Hard exercise 6-7 days/week',
      extremely_active: 'Very hard exercise, 2x/day',
    }
    return descriptions[level as keyof typeof descriptions] || level
  }

  const getGoalTypeDisplay = (goalType: string) => {
    switch (goalType) {
      case 'fat_loss':
        return { label: 'Fat Loss', color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900' }
      case 'muscle_gain':
        return { label: 'Muscle Gain', color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-900' }
      case 'maintenance':
        return { label: 'Maintenance', color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900' }
      default:
        return { label: goalType, color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700' }
    }
  }

  if (profileLoading || weightLoading || goalLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calorie Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Loading calculations...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isProfileComplete) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calorie Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Complete your profile settings to see your personalized calorie and macro recommendations.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (weightEntries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calorie Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Log your weight to see personalized calorie and macro recommendations.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!calculatedData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calorie Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Unable to calculate recommendations. Please check your profile data.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const goalDisplay = activeGoal ? getGoalTypeDisplay(activeGoal.goal_type) : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Calorie Calculator
          {activeGoal && (
            <Badge className={goalDisplay!.color}>
              {goalDisplay!.label}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Goal-Adjusted Calorie Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-950/30 dark:border-blue-900">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-blue-900 dark:text-blue-100">BMR</span>
            </div>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {calculatedData.bmr.toLocaleString()}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">calories/day at rest</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200 dark:bg-green-950/30 dark:border-green-900">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="font-semibold text-green-900 dark:text-green-100">TDEE</span>
            </div>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
              {calculatedData.tdee.toLocaleString()}
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">maintenance calories</p>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-900">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Apple className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <span className="font-semibold text-yellow-900 dark:text-yellow-100">Calories</span>
            </div>
            <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
              {calculatedData.adjustedCalories.toLocaleString()}
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">{calculatedData.adjustmentReason}</p>
            {calculatedData.warnings.length > 0 && (
              <div className="mt-2">
                {calculatedData.warnings.map((warning, index) => (
                  <p key={index} className="text-xs text-red-600 dark:text-red-400">
                    <AlertTriangle className="inline-block mr-1" />
                    {warning}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Macro Nutrient Goals */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Apple className="h-5 w-5" />
            Daily Macronutrient Targets
            <Dialog>
              <DialogTrigger asChild>
                <button className="ml-auto p-1 rounded-full hover:bg-gray-100 transition-colors">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-lg border border-gray-200 dark:bg-gray-900 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Protein</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {calculatedData.macros.protein.toLocaleString()}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">grams</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700">
              <div
                className="h-full bg-green-600 rounded-full"
                style={{ width: `${(calculatedData.macros.protein / 150) * 100}%` }}
              />
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg border border-gray-200 dark:bg-gray-900 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Fat</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {calculatedData.macros.fat.toLocaleString()}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">grams</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700">
              <div
                className="h-full bg-yellow-600 rounded-full"
                style={{ width: `${(calculatedData.macros.fat / 70) * 100}%` }}
              />
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg border border-gray-200 dark:bg-gray-900 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Carbs</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {calculatedData.macros.carbs.toLocaleString()}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">grams</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700">
              <div
                className="h-full bg-red-600 rounded-full"
                style={{ width: `${(calculatedData.macros.carbs / 300) * 100}%` }}
              />
            </div>
          </div>
          </div>
        </div>

        {/* Detailed Calorie and Macro Breakdown */}
        <div className="p-4 bg-white rounded-lg border border-gray-200 dark:bg-gray-900 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Calorie and Macro Breakdown</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Calories</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {calculatedData.adjustedCalories.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Protein</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {calculatedData.macros.protein.toLocaleString()} g
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Fat</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {calculatedData.macros.fat.toLocaleString()} g
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Carbs</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {calculatedData.macros.carbs.toLocaleString()} g
              </p>
            </div>
          </div>
        </div>

        {/* Activity Level and Goal Information */}
        <div className="p-4 bg-white rounded-lg border border-gray-200 dark:bg-gray-900 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Activity Level and Goal</h3>
          <div className="flex flex-col md:flex-row md:justify-between">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">Activity Level</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {profile && profile.activity_level && getActivityDescription(profile.activity_level)}
              </p>
            </div>
            {activeGoal && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Current Goal</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {activeGoal.goal_type === 'fat_loss' && 'Fat Loss'}
                  {activeGoal.goal_type === 'muscle_gain' && 'Muscle Gain'}
                  {activeGoal.goal_type === 'maintenance' && 'Maintenance'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div className="p-4 bg-white rounded-lg border border-gray-200 dark:bg-gray-900 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Recommendations</h3>
          <div className="space-y-2">
            {calculatedData.warnings.length === 0 ? (
              <p className="text-sm text-green-600 dark:text-green-400">
                Your calorie and macro settings are good to go!
              </p>
            ) : (
              calculatedData.warnings.map((warning, index) => (
                <div key={index} className="flex items-center text-sm text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {warning}
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
