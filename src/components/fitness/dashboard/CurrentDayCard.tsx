// src/components/fitness/dashboard/CurrentDayCard.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useFitness } from '@/hooks/useFitness'
import { CalendarCheck, Loader2 } from 'lucide-react'

export const CurrentDayCard = () => {
  const { activeMesocycle, loading } = useFitness()

  // This is a placeholder. Logic to determine the current day would be more complex.
  const currentDay = activeMesocycle ? `${activeMesocycle.name} (${activeMesocycle.weeks} weeks)` : 'N/A'

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Current Day</CardTitle>
        <CalendarCheck className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          <>
            <div className="text-2xl font-bold">{currentDay}</div>
            <p className="text-xs text-muted-foreground">
              Active mesocycle plan
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
