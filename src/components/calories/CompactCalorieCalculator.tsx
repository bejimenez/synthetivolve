// src/components/calories/CompactCalorieCalculator.tsx
'use client'

import { useMemo } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { useWeightEntries } from '@/hooks/useWeightEntries'
import { useGoals } from '@/hooks/useGoals'
import { calculateGoalCalories, calculateGoalMacros } from '@/lib/goal_calculations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calculator, Zap, Target, Apple, AlertTriangle, Activity } from 'lucide-react'

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

// Circular progress component
function CircularProgress({ 
  value, 
  max, 
  size = 120, 
  strokeWidth = 8, 
  color = "rgb(59, 130, 246)",
  backgroundColor = "rgb(229, 231, 235)"
}: {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  color?: string
  backgroundColor?: string
}) {
  const normalizedValue = Math.min(value, max)
  const percentage = (normalizedValue / max) * 100
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{Math.round(value)}</span>
        <span className="text-xs text-muted-foreground">g</span>
      </div>
    </div>
  )
}

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
          <Alert variant="destructive">
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
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Protein */}
            <div className="flex flex-col items-center text-center">
              <CircularProgress
                value={calculatedData.macros.protein}
                max={calculatedData.macros.protein}
                color="rgb(34, 197, 94)"
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
                color="rgb(245, 158, 11)"
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
                color="rgb(239, 68, 68)"
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="text-sm font-medium">Activity Level</p>
            <p className="text-sm text-muted-foreground">
              {profile && profile.activity_level && getActivityDescription(profile.activity_level)}
            </p>
          </div>
          {calculatedData.warnings.length === 0 && (
            <div className="flex items-center gap-2 text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Targets look good!</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}