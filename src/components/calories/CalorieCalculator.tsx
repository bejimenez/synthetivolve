// src/components/calories/CalorieCalculator.tsx
// src/components/calories/CalorieCalculator.tsx
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
import { Calculator, Zap, Target, Apple, Beef, Wheat, HelpCircle } from 'lucide-react'

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

export function CalorieCalculator() {
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
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      adjustedCalories: Math.round(adjustedCalories),
      adjustmentReason,
      warnings,
      macros: {
        protein: macroData.protein,
        fat: macroData.fat,
        carbs: macroData.carbs,
      },
      macroCalories: macroData.macroCalories,
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Calorie Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Calorie Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-900">BMR</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {calculatedData.bmr.toLocaleString()}
            </p>
            <p className="text-sm text-blue-700">calories/day at rest</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Target className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-900">TDEE</span>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {calculatedData.tdee.toLocaleString()}
            </p>
            <p className="text-sm text-green-700">maintenance calories</p>
          </div>

          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Apple className="h-5 w-5 text-orange-600" />
              <span className="font-semibold text-orange-900">Target</span>
            </div>
            <p className="text-2xl font-bold text-orange-900">
              {calculatedData.adjustedCalories.toLocaleString()}
            </p>
            <p className="text-sm text-orange-700">{calculatedData.adjustmentReason}</p>
          </div>
        </div>

        {/* Activity Level Info */}
        <div className="text-center">
          <Badge variant="outline" className="text-sm">
            {profile!.activity_level?.replace('_', ' ').toUpperCase()}
          </Badge>
          <p className="text-sm text-muted-foreground mt-1">
            {getActivityDescription(profile!.activity_level!)}
          </p>
        </div>

        {/* Warnings */}
        {calculatedData.warnings.length > 0 && (
          <div className="space-y-2">
            {calculatedData.warnings.map((warning, index) => (
              <Alert key={index} className="border-yellow-200 bg-yellow-50">
                <AlertDescription className="text-yellow-800">
                  {warning}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Macro Breakdown */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Apple className="h-4 w-4" />
            Daily Macronutrient Targets
            <Dialog>
              <DialogTrigger asChild>
                <button className="ml-auto p-1 rounded-full hover:bg-gray-100 transition-colors">
                  <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>How Macro Targets Are Calculated</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-red-600 mb-1">Protein</h4>
                    <p>1 gram per pound of body weight</p>
                    <p className="text-muted-foreground">Example: 150 lbs = 150g protein</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-yellow-600 mb-1">Fat</h4>
                    <p>Minimum 50g per day, or 0.25g per pound (whichever is higher)</p>
                    <p className="text-muted-foreground">Example: 150 lbs = max(50g, 37.5g) = 50g fat</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-amber-600 mb-1">Carbohydrates</h4>
                    <p>Remaining calories after protein and fat allocation</p>
                    <p className="text-muted-foreground">Calculated as: (Total Calories - Protein Calories - Fat Calories) ÷ 4</p>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      <strong>Note:</strong> These calculations ensure adequate protein for muscle maintenance and minimum fat for hormonal health, while filling remaining calories with carbohydrates for energy.
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Protein */}
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Beef className="h-5 w-5 text-red-600" />
                <span className="font-semibold text-red-900">Protein</span>
              </div>
              <p className="text-xl font-bold text-red-900">
                {calculatedData.macros.protein}g
              </p>
              <p className="text-sm text-red-700">
                {calculatedData.macroCalories.protein} calories
              </p>
            </div>

            {/* Fat */}
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="h-5 w-5 text-yellow-600" />
                <span className="font-semibold text-yellow-900">Fat</span>
              </div>
              <p className="text-xl font-bold text-yellow-900">
                {calculatedData.macros.fat}g
              </p>
              <p className="text-sm text-yellow-700">
                {calculatedData.macroCalories.fat} calories
              </p>
            </div>

            {/* Carbs */}
            <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Wheat className="h-5 w-5 text-amber-600" />
                <span className="font-semibold text-amber-900">Carbs</span>
              </div>
              <p className="text-xl font-bold text-amber-900">
                {calculatedData.macros.carbs}g
              </p>
              <p className="text-sm text-amber-700">
                {calculatedData.macroCalories.carbs} calories
              </p>
            </div>
          </div>
        </div>

        {/* Calculation Info */}
        <div className="text-xs text-muted-foreground space-y-1 p-3 bg-gray-50 rounded-lg">
          <p><strong>Calculations based on:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>BMR: Mifflin-St Jeor equation</li>
            <li>Target calories: {activeGoal ? 'Goal-adjusted from TDEE' : 'TDEE (maintenance)'}</li>
            <li>Protein: 1g per lb body weight</li>
            <li>Fat: Minimum 50g or 0.25g per lb</li>
            <li>Carbs: Remaining calories after protein and fat</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}