// src/components/nutrition/NutritionLogger.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { parseISO } from 'date-fns'
import { useNutrition } from './NutritionDataProvider'
import { useGoals } from '@/hooks/useGoals'
import { useProfile } from '@/hooks/useProfile'
import { useWeightEntries } from '@/hooks/useWeightEntries'
import { calculateGoalCalories } from '@/lib/goal_calculations'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Trash2, Edit } from 'lucide-react'
import { DailySummary } from './DailySummary'
import { AddFoodDialog } from './AddFoodDialog'

const timeSlots = Array.from({ length: 18 }, (_, i) => i + 3); // 3 AM to 8 PM

export function NutritionLogger() {
  const [selectedDate] = useState(new Date())
  const [isAddFoodOpen, setAddFoodOpen] = useState(false)
  
  const { foodLogs, refreshLogs, loading, error, removeFoodLog } = useNutrition()
  const { activeGoal } = useGoals()
  const { profile, isProfileComplete } = useProfile()
  const { weightEntries } = useWeightEntries()

  useEffect(() => {
    refreshLogs()
  }, [selectedDate, refreshLogs])

  const calorieGoal = useMemo(() => {
    if (activeGoal && profile && isProfileComplete && weightEntries.length > 0) {
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
    }
    return 2000 // Default goal
  }, [activeGoal, profile, isProfileComplete, weightEntries])

  const handleAddFoodClick = () => {
    setAddFoodOpen(true)
  }

  const handleFoodAdded = () => {
    refreshLogs()
    setAddFoodOpen(false)
  }

  const handleDeleteLog = async (id: string) => {
    await removeFoodLog(id)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>
  }

  return (
    <div className="space-y-6">
      <DailySummary foodLogs={foodLogs} calorieGoal={calorieGoal} />

      <div className="space-y-4">
        {timeSlots.map(hour => {
          const logsForHour = foodLogs.filter(log => parseISO(log.logged_at).getHours() === hour)
          return (
            <Card key={hour}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{hour.toString().padStart(2, '0')}:00</CardTitle>
                <Button size="sm" onClick={handleAddFoodClick}>+</Button>
              </CardHeader>
              {logsForHour.length > 0 && (
                <CardContent>
                  {logsForHour.map(log => (
                    <div key={log.id} className="flex items-center justify-between p-2 border-b">
                      <div>
                        <p className="font-semibold">{log.food.description}</p>
                        <p className="text-sm text-muted-foreground">{log.quantity}{log.unit}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteLog(log.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      <AddFoodDialog
        open={isAddFoodOpen}
        onClose={() => setAddFoodOpen(false)}
        onFoodAdded={handleFoodAdded}
        selectedDate={selectedDate}
      />
    </div>
  )
}
