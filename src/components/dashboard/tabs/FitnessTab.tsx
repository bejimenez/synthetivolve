// src/components/dashboard/tabs/FitnessTab.tsx
'use client'

import { FitnessOverview } from '@/components/fitness/dashboard/FitnessOverview'
import { DailyProgressIndicator } from '@/components/dashboard/shared/DailyProgressIndicator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function FitnessTab() {
  // Placeholder data for daily fitness progress
  const workoutsCompleted = 2
  const workoutsTarget = 3
  const totalVolume = 15000 // in lbs
  const totalVolumeTarget = 20000 // in lbs
  const stepsCount = 8500
  const stepsTarget = 10000

  return (
    <div className="mt-4 space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DailyProgressIndicator
          title="Workouts Completed"
          current={workoutsCompleted}
          target={workoutsTarget}
          unit="workouts"
          description="Workouts completed today"
        />
        <DailyProgressIndicator
          title="Total Volume Lifted"
          current={totalVolume}
          target={totalVolumeTarget}
          unit="lbs"
          description="Total weight lifted today"
        />
        <DailyProgressIndicator
          title="Daily Steps"
          current={stepsCount}
          target={stepsTarget}
          unit="steps"
          description="Steps taken today"
        />
      </div>

      <FitnessOverview />

      <Card>
        <CardHeader>
          <CardTitle>Quick Fitness Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/fitness/logger">Log Workout</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/fitness/history">View Workout History</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/fitness/planner">Plan Mesocycle</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
