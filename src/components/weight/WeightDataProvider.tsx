// src/components/weight/WeightDataProvider.tsx
'use client'

import { createContext, useContext, useCallback, useReducer, useEffect } from 'react'
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

interface WeightState {
  entries: WeightEntry[]
  loading: boolean
  error: string | null
}

type WeightAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ENTRIES'; payload: WeightEntry[] }
  | { type: 'ADD_ENTRY'; payload: WeightEntry }
  | { type: 'UPDATE_ENTRY'; payload: WeightEntry }
  | { type: 'REMOVE_ENTRY'; payload: string }

interface WeightContextType extends WeightState {
  createWeightEntry: (entry: WeightEntryInput) => Promise<WeightEntry | null>
  updateWeightEntry: (id: string, entry: Partial<WeightEntryInput>) => Promise<WeightEntry | null>
  deleteWeightEntry: (id: string) => Promise<boolean>
  refreshEntries: () => Promise<void>
}

const WeightContext = createContext<WeightContextType | undefined>(undefined)

function weightReducer(state: WeightState, action: WeightAction): WeightState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_ENTRIES':
      return { ...state, entries: action.payload, loading: false, error: null }
    case 'ADD_ENTRY':
      // Remove any existing entry with the same date, then add the new one
      const filtered = state.entries.filter(e => e.entry_date !== action.payload.entry_date)
      const updated = [action.payload, ...filtered].sort((a, b) => 
        new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
      )
      return { ...state, entries: updated, error: null }
    case 'UPDATE_ENTRY':
      return {
        ...state,
        entries: state.entries.map(e => e.id === action.payload.id ? action.payload : e),
        error: null
      }
    case 'REMOVE_ENTRY':
      return {
        ...state,
        entries: state.entries.filter(e => e.id !== action.payload),
        error: null
      }
    default:
      return state
  }
}

export function WeightDataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(weightReducer, {
    entries: [],
    loading: true,
    error: null
  })
  const { user } = useAuth()

  const refreshEntries = useCallback(async () => {
    if (!user) {
      dispatch({ type: 'SET_ENTRIES', payload: [] })
      return
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      
      const response = await fetch('/api/weight-entries')
      if (!response.ok) {
        throw new Error('Failed to fetch weight entries')
      }
      
      const result = await response.json()
      dispatch({ type: 'SET_ENTRIES', payload: result.data || [] })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'An error occurred' })
      dispatch({ type: 'SET_ENTRIES', payload: [] })
    }
  }, [user])

  const createWeightEntry = useCallback(async (entry: WeightEntryInput): Promise<WeightEntry | null> => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null })
      
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

      // Optimistically update state
      dispatch({ type: 'ADD_ENTRY', payload: newEntry })
      
      return newEntry
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'An error occurred' })
      return null
    }
  }, [])

  const updateWeightEntry = useCallback(async (id: string, entry: Partial<WeightEntryInput>): Promise<WeightEntry | null> => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null })
      
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

      dispatch({ type: 'UPDATE_ENTRY', payload: updatedEntry })
      
      return updatedEntry
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'An error occurred' })
      return null
    }
  }, [])

  const deleteWeightEntry = useCallback(async (id: string): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null })
      
      const response = await fetch(`/api/weight-entries/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete weight entry')
      }

      dispatch({ type: 'REMOVE_ENTRY', payload: id })
      
      return true
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'An error occurred' })
      return false
    }
  }, [])

  // Fetch entries when user changes
  useEffect(() => {
    refreshEntries()
  }, [refreshEntries])

  const value = {
    ...state,
    createWeightEntry,
    updateWeightEntry,
    deleteWeightEntry,
    refreshEntries,
  }

  return (
    <WeightContext.Provider value={value}>
      {children}
    </WeightContext.Provider>
  )
}

export function useWeightData() {
  const context = useContext(WeightContext)
  if (context === undefined) {
    throw new Error('useWeightData must be used within a WeightDataProvider')
  }
  return context
}