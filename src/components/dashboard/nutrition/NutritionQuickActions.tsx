// src/components/dashboard/nutrition/NutritionQuickActions.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle, BookOpen } from 'lucide-react'

export function NutritionQuickActions() {
  const router = useRouter()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          variant="outline"
          className="h-20 flex flex-col items-center justify-center gap-2"
          onClick={() => router.push('/nutrition/logger')}
        >
          <PlusCircle className="h-6 w-6" />
          <span>Log Food</span>
        </Button>
        <Button
          variant="outline"
          className="h-20 flex flex-col items-center justify-center gap-2"
          onClick={() => router.push('/nutrition/history')} // Assuming a history page will exist
        >
          <BookOpen className="h-6 w-6" />
          <span>View History</span>
        </Button>
      </CardContent>
    </Card>
  )
}
