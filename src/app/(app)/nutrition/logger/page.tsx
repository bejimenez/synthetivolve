// src/app/(app)/nutrition/logger/page.tsx
'use client'

import { NutritionLogger } from '@/components/nutrition/NutritionLogger'
import { NutritionDataProvider } from '@/components/nutrition/NutritionDataProvider'

export default function NutritionLoggerPage() {
  return (
    <NutritionDataProvider>
      <NutritionLogger />
    </NutritionDataProvider>
  )
}
