// src/components/fitness/dashboard/FitnessActionsCard.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { PlayCircle, ListChecks } from 'lucide-react'

export const FitnessActionsCard = () => {
  const router = useRouter()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fitness Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button onClick={() => router.push('/fitness/logger')} className="w-full">
          <PlayCircle className="mr-2 h-4 w-4" />
          Start Workout
        </Button>
        <Button onClick={() => router.push('/fitness/planner')} variant="outline" className="w-full">
          <ListChecks className="mr-2 h-4 w-4" />
          Plan Mesocycle
        </Button>
      </CardContent>
    </Card>
  )
}
