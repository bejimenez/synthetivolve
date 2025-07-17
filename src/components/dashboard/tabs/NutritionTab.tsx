// src/components/dashboard/tabs/NutritionTab.tsx
'use client'

import { NutritionOverview } from '@/components/nutrition/NutritionOverview'
import { NutritionDataProvider } from '@/components/nutrition/NutritionDataProvider'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function NutritionTab() {
  const router = useRouter()

  return (
    <div className="mt-4 space-y-4">
      <div className="flex justify-end gap-2">
        <Button onClick={() => router.push('/nutrition/logger')}>Log Food</Button>
        <Button variant="outline" onClick={() => router.push('/nutrition/overview')}>View Nutrition Overview</Button>
      </div>
      <NutritionDataProvider>
        <NutritionOverview />
      </NutritionDataProvider>
    </div>
  )
}
