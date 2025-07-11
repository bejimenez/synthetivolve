// src/components/fitness/dashboard/FitnessOverview.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TotalWorkoutsCard } from './TotalWorkoutsCard'
import { TotalVolumeCard } from './TotalVolumeCard'
import { CurrentDayCard } from './CurrentDayCard'
import { FitnessActionsCard } from './FitnessActionsCard'

export const FitnessOverview = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fitness Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TotalWorkoutsCard />
          <TotalVolumeCard />
          <CurrentDayCard />
        </div>
        <FitnessActionsCard />
      </CardContent>
    </Card>
  )
}
