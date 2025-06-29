// src/hooks/useWeightEntries.ts (Updated for backwards compatibility)
import { useWeightData, WeightEntry, WeightEntryInput } from '@/components/weight/WeightDataProvider'

interface UseWeightEntriesReturn {
  weightEntries: WeightEntry[]
  loading: boolean
  error: string | null
  createWeightEntry: (entry: WeightEntryInput) => Promise<WeightEntry | null>
  updateWeightEntry: (id: string, entry: Partial<WeightEntryInput>) => Promise<WeightEntry | null>
  deleteWeightEntry: (id: string) => Promise<boolean>
  refreshEntries: () => Promise<void>
}

// Legacy hook that wraps the new context for backwards compatibility
export function useWeightEntries(): UseWeightEntriesReturn {
  const {
    entries,
    loading,
    error,
    createWeightEntry,
    updateWeightEntry,
    deleteWeightEntry,
    refreshEntries,
  } = useWeightData()

  return {
    weightEntries: entries,
    loading,
    error,
    createWeightEntry,
    updateWeightEntry,
    deleteWeightEntry,
    refreshEntries,
  }
}

// Re-export types for backwards compatibility
export type { WeightEntry, WeightEntryInput }