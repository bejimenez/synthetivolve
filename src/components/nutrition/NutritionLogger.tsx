// src/components/nutrition/NutritionLogger.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useNutrition, FoodLogWithFood } from './NutritionDataProvider'
import { useNutritionSettings } from '@/hooks/useNutritionSettings'
import { useGoals } from '@/hooks/useGoals'
import { useProfile } from '@/hooks/useProfile'
import { useWeightEntries } from '@/hooks/useWeightEntries'
import { calculateGoalCalories } from '@/lib/goal_calculations'
import { getHourInTimezone } from '@/lib/nutrition/timezone-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Trash2, Edit } from 'lucide-react'
import { DailySummary } from '@/components/dashboard/shared/DailySummary'
import { AddFoodDialog } from './AddFoodDialog'
import { EditFoodLogDialog } from './EditFoodLogDialog'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'

const timeSlots = Array.from({ length: 18 }, (_, i) => i + 3); // 3 AM to 8 PM

export function NutritionLogger() {
  const [selectedDate] = useState(new Date())
  const [isAddFoodOpen, setAddFoodOpen] = useState(false)
  const [isEditFoodOpen, setEditFoodOpen] = useState(false)
  const [editingFoodLog, setEditingFoodLog] = useState<FoodLogWithFood | null>(null)
  const [currentLoggingHour, setCurrentLoggingHour] = useState<number | null>(null)
  
  const { foodLogs, refreshLogs, loading, error, removeFoodLog } = useNutrition()
  const { settings: nutritionSettings, loading: settingsLoading } = useNutritionSettings()
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

  const handleAddFoodClick = (hour: number) => {
    setCurrentLoggingHour(hour)
    setAddFoodOpen(true)
  }

  const handleFoodAdded = () => {
    refreshLogs()
    setAddFoodOpen(false)
    setCurrentLoggingHour(null)
  }

  const handleEditLog = (log: FoodLogWithFood) => {
    setEditingFoodLog(log)
    setEditFoodOpen(true)
  }

  const handleFoodLogUpdated = () => {
    refreshLogs()
    setEditFoodOpen(false)
    setEditingFoodLog(null)
  }

  const handleDeleteLog = async (id: string) => {
    const success = await removeFoodLog(id)
    if (success) {
      toast.success('Food log deleted successfully!')
    } else {
      toast.error('Failed to delete food log.')
    }
  }

  // Group food logs by timezone-aware hour
  const groupedFoodLogs = useMemo(() => {
    if (!nutritionSettings) return {}
    
    return foodLogs.reduce((groups, log) => {
      const hourInTimezone = getHourInTimezone(log.logged_at, nutritionSettings.timezone)
      if (!groups[hourInTimezone]) {
        groups[hourInTimezone] = []
      }
      groups[hourInTimezone].push(log)
      return groups
    }, {} as Record<number, FoodLogWithFood[]>)
  }, [foodLogs, nutritionSettings])

  if (loading || settingsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>
  }

  if (!nutritionSettings) {
    return <div className="text-red-500">Unable to load nutrition settings</div>
  }

  return (
    <div className="space-y-6">
      <DailySummary foodLogs={foodLogs} calorieGoal={calorieGoal} />

      <div className="space-y-4">
        {timeSlots.map(hour => {
          const logsForHour = groupedFoodLogs[hour] || []
          return (
            <Card key={hour} className="dark:bg-gray-900 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base dark:text-gray-100">
                  {hour.toString().padStart(2, '0')}:00
                  {/* 🔥 DEBUG: Show timezone info temporarily */}
                  <span className="text-xs text-muted-foreground ml-2">
                    ({nutritionSettings.timezone})
                  </span>
                </CardTitle>
                <Button size="sm" onClick={() => handleAddFoodClick(hour)} className="dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90">+</Button>
              </CardHeader>
              {logsForHour.length > 0 && (
                <CardContent>
                  {logsForHour.map(log => (
                    <div key={log.id} className="flex items-center justify-between p-2 border-b dark:border-gray-700">
                      <div>
                        <p className="font-semibold dark:text-gray-100">{log.food.description}</p>
                        <p className="text-sm text-muted-foreground">{log.quantity}{log.unit}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 dark:hover:bg-gray-800" onClick={() => handleEditLog(log)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 dark:hover:bg-gray-800" onClick={() => handleDeleteLog(log.id)}>
                          <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          )
        })}</div>

      <AddFoodDialog
        open={isAddFoodOpen}
        onClose={() => setAddFoodOpen(false)}
        onFoodAdded={handleFoodAdded}
        selectedDate={selectedDate}
        initialHour={currentLoggingHour}
      />

      <EditFoodLogDialog
        open={isEditFoodOpen}
        onClose={() => setEditFoodOpen(false)}
        onFoodLogUpdated={handleFoodLogUpdated}
        foodLog={editingFoodLog}
      />
      <Toaster />
    </div>
  )
}