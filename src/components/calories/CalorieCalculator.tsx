// src/components/calories/CalorieCalculator.tsx
// src/components/calories/CalorieCalculator.tsx
'use client'

import { useMemo } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { useWeightEntries } from '@/hooks/useWeightEntries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Calculator, Zap, Target, Apple, Beef, Wheat } from 'lucide-react'

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

    // Macro calculations based on project specs
    const protein = currentWeight // 1g per lb body weight
    const fat = Math.max(50, currentWeight * 0.25) // Minimum 50g, or 0.25g per lb
    const proteinCalories = protein * 4
    const fatCalories = fat * 9
    const remainingCalories = Math.max(0, tdee - proteinCalories - fatCalories)
    const carbs = remainingCalories / 4

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      macros: {
        protein: Math.round(protein),
        fat: Math.round(fat),
        carbs: Math.round(carbs),
      },
      macroCalories: {
        protein: Math.round(proteinCalories),
        fat: Math.round(fatCalories),
        carbs: Math.round(remainingCalories),
      },
    }
  }, [profile, isProfileComplete, weightEntries])

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

  if (profileLoading || weightLoading) {
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* Macro Breakdown */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Apple className="h-4 w-4" />
            Daily Macronutrient Targets
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
            <li>Protein: 1g per lb body weight</li>
            <li>Fat: Minimum 50g or 0.25g per lb</li>
            <li>Carbs: Remaining calories after protein and fat</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}