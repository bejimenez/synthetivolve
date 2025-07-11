// src/components/fitness/dashboard/TotalWorkoutsCard.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useFitness } from '@/hooks/useFitness'
import { Dumbbell, Loader2 } from 'lucide-react'

export const TotalWorkoutsCard = () => {
  const { workoutLogs, loading } = useFitness()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
        <Dumbbell className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          <>
            <div className="text-2xl font-bold">{workoutLogs.length}</div>
            <p className="text-xs text-muted-foreground">
              Completed sessions
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
