// src/components/fitness/dashboard/TotalVolumeCard.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useFitness } from '@/hooks/useFitness'
import { Dumbbell, Loader2 } from 'lucide-react'
import { useMemo } from 'react'

export const TotalVolumeCard = () => {
  const { workoutLogs, loading } = useFitness()

  const totalVolume = useMemo(() => {
    if (!workoutLogs || workoutLogs.length === 0) return 0
    // This is a placeholder calculation.
    return workoutLogs.reduce((acc, log) => {
      const logData = log.log_data as { exercises?: Array<{ sets: Array<{ weight: number; reps: number }> }> };
      const workoutVolume = (logData.exercises || []).reduce((exerciseAcc, exercise) => {
        return exerciseAcc + (exercise.sets || []).reduce((setAcc, set) => setAcc + (set.weight * set.reps), 0);
      }, 0);
      return acc + workoutVolume;
    }, 0);
  }, [workoutLogs])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
        <Dumbbell className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          <>
            <div className="text-2xl font-bold">{totalVolume.toLocaleString()} lbs</div>
            <p className="text-xs text-muted-foreground">
              Total weight lifted
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
