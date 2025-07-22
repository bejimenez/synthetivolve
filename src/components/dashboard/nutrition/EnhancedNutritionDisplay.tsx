// src/components/dashboard/nutrition/EnhancedNutritionDisplay.tsx
'use client'

import { useMemo } from 'react'
import React from 'react'
import { useProfile } from '@/hooks/useProfile'
import { useWeightEntries } from '@/hooks/useWeightEntries'
import { useGoals } from '@/hooks/useGoals'
import { calculateGoalCalories, calculateGoalMacros } from '@/lib/goal_calculations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Apple, Activity, HelpCircle, Zap, Target, AlertTriangle } from 'lucide-react'
import { FoodLogWithFood } from '@/components/nutrition/NutritionDataProvider'

// Activity level multipliers for TDEE calculation
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9,
} as const

interface EnhancedNutritionDisplayProps {
  foodLogs: FoodLogWithFood[]
  profileLoading?: boolean
  weightLoading?: boolean
  goalLoading?: boolean
  nutritionLoading?: boolean
  variant?: 'full' | 'compact'
}

import { CircularProgress } from '@/components/dashboard/shared/CircularProgress'

export function EnhancedNutritionDisplay({ 
  foodLogs, 
  profileLoading = false, 
  weightLoading = false, 
  goalLoading = false, 
  nutritionLoading = false,
  variant = 'full'
}: EnhancedNutritionDisplayProps) {
  const { profile, isProfileComplete } = useProfile()
  const { weightEntries } = useWeightEntries()
  const { activeGoal } = useGoals()

  // Calculate targets (BMR, TDEE, macros)
  const calculatedTargets = useMemo(() => {
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

    const tdee = bmr * ACTIVITY_MULTIPLIERS[profile.activity_level!]
    let adjustedCalories = tdee
    let adjustmentReason = 'maintenance calories'

    if (activeGoal) {
      const goalData = calculateGoalCalories(tdee, currentWeight, activeGoal)
      adjustedCalories = goalData.adjustedCalories
      adjustmentReason = goalData.adjustmentReason
    }

    const macroTargets = calculateGoalMacros(adjustedCalories, currentWeight)
    
    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      calories: Math.round(adjustedCalories),
      adjustmentReason,
      protein: macroTargets.protein,
      carbs: macroTargets.carbs,
      fat: macroTargets.fat
    }
  }, [profile, isProfileComplete, weightEntries, activeGoal])

  // Calculate logged totals
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
          <CardTitle>
            {variant === 'full' ? 'Daily Nutrition Dashboard' : 'Nutrition Summary'}
          </CardTitle>
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
          <CardTitle>
            {variant === 'full' ? 'Daily Nutrition Dashboard' : 'Nutrition Summary'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Complete your profile and add a weight entry to see your personalized nutrition dashboard.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!calculatedTargets) {
    return null
  }

  // Compact variant for Daily Metrics tab
  if (variant === 'compact') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Apple className="h-5 w-5" />
            Nutrition Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-orange-500 dark:text-orange-400">{Math.round(loggedMacros.calories)}</p>
              <p className="text-sm text-muted-foreground">/ {calculatedTargets.calories} kcal</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500 dark:text-red-400">{Math.round(loggedMacros.protein)}</p>
              <p className="text-sm text-muted-foreground">/ {calculatedTargets.protein}g protein</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-500 dark:text-amber-400">{Math.round(loggedMacros.carbs)}</p>
              <p className="text-sm text-muted-foreground">/ {calculatedTargets.carbs}g carbs</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-500 dark:text-yellow-400">{Math.round(loggedMacros.fat)}</p>
              <p className="text-sm text-muted-foreground">/ {calculatedTargets.fat}g fat</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Full variant for Nutrition tab
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Apple className="h-5 w-5" />
          Daily Nutrition Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Calorie Overview */}
        <div className="text-center p-6 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-lg">
          <div className="flex justify-center items-baseline gap-2 mb-2">
            <span className="text-4xl font-bold text-orange-600">
              {Math.round(loggedMacros.calories)}
            </span>
            <span className="text-xl text-muted-foreground">/ {calculatedTargets.calories} kcal</span>
          </div>
          <div className="text-sm text-muted-foreground mb-4">
            {calculatedTargets.adjustmentReason}
          </div>
          
          {/* Key Metrics Row */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex flex-col items-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded">
              <div className="flex items-center gap-1 mb-1">
                <Zap className="h-3 w-3 text-blue-600" />
                <span className="font-medium text-blue-700 dark:text-blue-300">BMR</span>
              </div>
              <span className="font-bold text-blue-900 dark:text-blue-100">
                {calculatedTargets.bmr}
              </span>
            </div>
            <div className="flex flex-col items-center p-3 bg-green-50 dark:bg-green-950/30 rounded">
              <div className="flex items-center gap-1 mb-1">
                <Target className="h-3 w-3 text-green-600" />
                <span className="font-medium text-green-700 dark:text-green-300">TDEE</span>
              </div>
              <span className="font-bold text-green-900 dark:text-green-100">
                {calculatedTargets.tdee}
              </span>
            </div>
            <div className="flex flex-col items-center p-3 bg-orange-50 dark:bg-orange-950/30 rounded">
              <div className="flex items-center gap-1 mb-1">
                <Apple className="h-3 w-3 text-orange-600" />
                <span className="font-medium text-orange-700 dark:text-orange-300">Target</span>
              </div>
              <span className="font-bold text-orange-900 dark:text-orange-100">
                {calculatedTargets.calories}
              </span>
            </div>
          </div>
        </div>

        {/* Macro Progress Circles */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Macro Progress</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1 h-auto dark:hover:bg-gray-800">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="dark:bg-gray-900 dark:border-gray-700">
                <DialogHeader>
                  <DialogTitle className="dark:text-gray-100">Macro Calculations</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 text-sm">
                  <p><strong>Protein:</strong> 1g per lb body weight</p>
                  <p><strong>Fat:</strong> Minimum 50g or 0.25g per lb</p>
                  <p><strong>Carbs:</strong> Remaining calories after protein and fat</p>
                  <p><strong>BMR:</strong> Calories burned at rest (Mifflin-St Jeor equation)</p>
                  <p><strong>TDEE:</strong> BMR × activity level multiplier</p>
                  <p><strong>Target:</strong> {calculatedTargets.adjustmentReason}</p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center">
            <CircularProgress
              value={loggedMacros.protein}
              max={calculatedTargets.protein}
              label="Protein"
              unit="g"
              color="var(--chart-weight-loss)"
            />
            <CircularProgress
              value={loggedMacros.carbs}
              max={calculatedTargets.carbs}
              label="Carbs"
              unit="g"
              color="var(--chart-5)"
            />
            <CircularProgress
              value={loggedMacros.fat}
              max={calculatedTargets.fat}
              label="Fat"
              unit="g"
              color="var(--chart-4)"
            />
          </div>
        </div>

        {/* Progress Badges */}
        <div className="flex flex-wrap gap-2 justify-center">
          {loggedMacros.calories >= calculatedTargets.calories * 0.9 && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-300">
              Calorie target nearly reached
            </Badge>
          )}
          {loggedMacros.protein >= calculatedTargets.protein * 0.8 && (
            <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-300">
              Good protein intake
            </Badge>
          )}
          {Object.values(loggedMacros).every(val => val === 0) && (
            <Badge variant="outline" className="dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700">
              Start logging food to see progress
            </Badge>
          )
        }</div>
      </CardContent>
    </Card>
  )
}