// src/app/(app)/nutrition/overview/page.tsx
'use client'

import { NutritionOverview } from '@/components/nutrition/NutritionOverview'
import { NutritionDataProvider } from '@/components/nutrition/NutritionDataProvider'

export default function NutritionOverviewPage() {
  return (
    <NutritionDataProvider>
      <NutritionOverview />
    </NutritionDataProvider>
  )
}
