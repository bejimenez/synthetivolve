// src/hooks/useWeightEntries.ts
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'

export interface WeightEntry {
  id: string
  user_id: string
  weight_lbs: number
  entry_date: string
  notes: string | null
  created_at: string
}

export interface WeightEntryInput {
  weight_lbs: number
  entry_date: string
  notes?: string
}

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
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const refreshEntries = useCallback(async () => {
    if (!user) {
      setWeightEntries([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/weight-entries')
      if (!response.ok) {
        throw new Error('Failed to fetch weight entries')
      }
      
      const result = await response.json()
      setWeightEntries(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setWeightEntries([])
    } finally {
      setLoading(false)
    }
  }, [user])

  const createWeightEntry = useCallback(async (entry: WeightEntryInput): Promise<WeightEntry | null> => {
    try {
      setError(null)
      
      const response = await fetch('/api/weight-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create weight entry')
      }

      const result = await response.json()
      const newEntry = result.data

      // Add to local state
      setWeightEntries(prev => [newEntry, ...prev.filter(e => e.entry_date !== newEntry.entry_date)])
      
      return newEntry
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    }
  }, [])

  const updateWeightEntry = useCallback(async (id: string, entry: Partial<WeightEntryInput>): Promise<WeightEntry | null> => {
    try {
      setError(null)
      
      const response = await fetch(`/api/weight-entries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update weight entry')
      }

      const result = await response.json()
      const updatedEntry = result.data

      // Update local state
      setWeightEntries(prev => 
        prev.map(e => e.id === id ? updatedEntry : e)
      )
      
      return updatedEntry
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    }
  }, [])

  const deleteWeightEntry = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null)
      
      const response = await fetch(`/api/weight-entries/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete weight entry')
      }

      // Remove from local state
      setWeightEntries(prev => prev.filter(e => e.id !== id))
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return false
    }
  }, [])

  // Fetch entries when user changes
  useEffect(() => {
    refreshEntries()
  }, [refreshEntries])

  return {
    weightEntries,
    loading,
    error,
    createWeightEntry,
    updateWeightEntry,
    deleteWeightEntry,
    refreshEntries,
  }
}