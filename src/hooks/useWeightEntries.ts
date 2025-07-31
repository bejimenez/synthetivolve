// src/hooks/useWeightEntries.ts
import { useAppData } from '@/components/data/AppDataProvider'
import { WeightEntry, WeightEntryInput } from '@/components/weight/WeightDataProvider'

interface UseWeightEntriesReturn {
  weightEntries: WeightEntry[]
  loading: boolean
  error: string | null
  createWeightEntry: (entry: WeightEntryInput) => Promise<WeightEntry | null>
  updateWeightEntry: (id: string, entry: Partial<WeightEntryInput>) => Promise<WeightEntry | null>
  deleteWeightEntry: (id: string) => Promise<boolean>
  refreshEntries: () => Promise<void>
}

export function useWeightEntries(): UseWeightEntriesReturn {
  const {
    weightEntries,
    weightLoading,
    weightError,
    createWeightEntry,
    updateWeightEntry,
    deleteWeightEntry,
    refreshWeightEntries,
  } = useAppData()

  return {
    weightEntries,
    loading: weightLoading,
    error: weightError,
    createWeightEntry,
    updateWeightEntry,
    deleteWeightEntry,
    refreshEntries: refreshWeightEntries,
  }
}

// Re-export types for backwards compatibility
export type { WeightEntry, WeightEntryInput }