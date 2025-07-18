// src/hooks/useNutritionStreak.ts
'use client'

import { useState, useEffect } from 'react'
import { useNutrition } from '@/components/nutrition/NutritionDataProvider'
import { subDays, isSameDay, parseISO } from 'date-fns'

export function useNutritionStreak() {
  const { foodLogs, loading, error } = useNutrition()
  const [streak, setStreak] = useState(0)
  const [lastLoggedDate, setLastLoggedDate] = useState<Date | null>(null)

  useEffect(() => {
    if (loading || error) return

    const sortedLogs = [...foodLogs].sort((a, b) => 
      new Date(b.logged_date).getTime() - new Date(a.logged_date).getTime()
    )

    if (sortedLogs.length === 0) {
      setStreak(0)
      setLastLoggedDate(null)
      return
    }

    let currentStreak = 0
    const currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0) // Normalize to start of day

    const uniqueLoggedDates = Array.from(new Set(sortedLogs.map(log => log.logged_date)))
      .map(dateStr => parseISO(dateStr))
      .sort((a, b) => a.getTime() - b.getTime()) // Sort ascending for streak calculation

    // Check if today has logs
    const todayHasLogs = uniqueLoggedDates.some(date => isSameDay(date, new Date()))
    if (todayHasLogs) {
      currentStreak = 1
    }

    let expectedDate = todayHasLogs ? subDays(currentDate, 0) : subDays(currentDate, 1)

    for (let i = uniqueLoggedDates.length - 1; i >= 0; i--) {
      const logDate = uniqueLoggedDates[i]
      logDate.setHours(0, 0, 0, 0)

      if (isSameDay(logDate, expectedDate)) {
        currentStreak++
        expectedDate = subDays(expectedDate, 1)
      } else if (logDate < expectedDate) {
        // Gap in streak, break
        break
      } else {
        // logDate > expectedDate, meaning we might have skipped a day if today had no logs
        // or it's a future log (which shouldn't happen with current logic)
        // This case handles if today had no logs, and the most recent log was yesterday
        if (!todayHasLogs && isSameDay(logDate, subDays(currentDate, 1))) {
          currentStreak = 1; // Start streak from yesterday
          expectedDate = subDays(expectedDate, 1);
        } else {
          break;
        }
      }
    }

    setStreak(currentStreak)
    setLastLoggedDate(uniqueLoggedDates.length > 0 ? uniqueLoggedDates[uniqueLoggedDates.length - 1] : null)

  }, [foodLogs, loading, error])

  return { streak, lastLoggedDate, loading, error }
}
