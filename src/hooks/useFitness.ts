// src/hooks/useFitness.ts
import { useFitness as useFitnessData } from '@/components/fitness/FitnessDataProvider'

// This hook simply re-exports the context hook for a clean, conventional access pattern.
// More complex logic or selectors could be added here in the future if needed.
export function useFitness() {
  return useFitnessData()
}
