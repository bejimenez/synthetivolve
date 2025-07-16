// src/components/nutrition/DailySummary.tsx
'use client'

import { useMemo } from 'react'
import { FoodLogWithFood } from './NutritionDataProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface DailySummaryProps {
  foodLogs: FoodLogWithFood[]
  calorieGoal: number
}

export function DailySummary({ foodLogs, calorieGoal }: DailySummaryProps) {
  const totals = useMemo(() => {
    const result = { calories: 0, protein: 0, carbs: 0, fat: 0 }
    foodLogs.forEach(log => {
      const factor = log.quantity / 100
      result.calories += (log.foods.calories_per_100g || 0) * factor
      result.protein += (log.foods.protein_per_100g || 0) * factor
      result.carbs += (log.foods.carbs_per_100g || 0) * factor
      result.fat += (log.foods.fat_per_100g || 0) * factor
    })
    return {
      calories: Math.round(result.calories),
      protein: Math.round(result.protein),
      carbs: Math.round(result.carbs),
      fat: Math.round(result.fat),
    }
  }, [foodLogs])

  const calorieProgress = calorieGoal > 0 ? (totals.calories / calorieGoal) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{totals.calories}</p>
            <p className="text-sm text-muted-foreground">Calories</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{totals.protein}g</p>
            <p className="text-sm text-muted-foreground">Protein</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{totals.carbs}g</p>
            <p className="text-sm text-muted-foreground">Carbs</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{totals.fat}g</p>
            <p className="text-sm text-muted-foreground">Fat</p>
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm">Calorie Goal: {calorieGoal}</span>
            <span className="text-sm">{calorieProgress.toFixed(0)}%</span>
          </div>
          <Progress value={calorieProgress} />
        </div>
      </CardContent>
    </Card>
  )
}
