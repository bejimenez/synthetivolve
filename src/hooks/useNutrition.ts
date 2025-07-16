// src/hooks/useNutrition.ts
import { useContext } from 'react'
import { NutritionContext } from '@/components/nutrition/NutritionDataProvider'

// This hook simply re-exports the context hook for a clean, conventional access pattern.
export function useNutrition() {
  const context = useContext(NutritionContext)
  if (context === undefined) {
    throw new Error('useNutrition must be used within a NutritionDataProvider')
  }
  return context
}
