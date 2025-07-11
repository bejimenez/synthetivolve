// src/components/fitness/FitnessDataProvider.tsx
'use client'

import { createContext, useContext, useCallback, useReducer, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import type { Database } from '@/lib/database.types'
// Using the migrated types

// More specific types from the database schema can be used if needed
type ExerciseRow = Database['public']['Tables']['exercises']['Row']
type MesocycleRow = Database['public']['Tables']['mesocycles']['Row']
type WorkoutLogRow = Database['public']['Tables']['workout_logs']['Row']

interface FitnessState {
  exercises: ExerciseRow[]
  mesocycles: MesocycleRow[]
  workoutLogs: WorkoutLogRow[]
  loading: boolean
  error: string | null
}

type FitnessAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FITNESS_DATA'; payload: { exercises: ExerciseRow[], mesocycles: MesocycleRow[], workoutLogs: WorkoutLogRow[] } }
  // Actions for specific data types can be added as needed

interface FitnessContextType extends FitnessState {
  // Define actions to interact with the fitness data
  createExercise: (exercise: Omit<ExerciseRow, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'>) => Promise<ExerciseRow | null>
  // ... other actions like createMesocycle, createWorkoutLog, etc.
  refreshAll: () => Promise<void>
}

const FitnessContext = createContext<FitnessContextType | undefined>(undefined)

function fitnessReducer(state: FitnessState, action: FitnessAction): FitnessState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
    case 'SET_FITNESS_DATA':
      return { 
        ...state, 
        ...action.payload,
        loading: false, 
        error: null 
      }
    default:
      return state
  }
}

export function FitnessDataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(fitnessReducer, {
    exercises: [],
    mesocycles: [],
    workoutLogs: [],
    loading: true,
    error: null
  })
  const { user } = useAuth()

  const refreshAll = useCallback(async () => {
    if (!user) {
      dispatch({ type: 'SET_FITNESS_DATA', payload: { exercises: [], mesocycles: [], workoutLogs: [] } })
      return
    }

    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const [exercisesRes, mesocyclesRes, workoutLogsRes] = await Promise.all([
        fetch('/api/fitness/exercises'),
        fetch('/api/fitness/mesocycles'),
        fetch('/api/fitness/workout-logs'),
      ]);

      if (!exercisesRes.ok || !mesocyclesRes.ok || !workoutLogsRes.ok) {
        throw new Error('Failed to fetch fitness data');
      }

      const exercises = await exercisesRes.json();
      const mesocycles = await mesocyclesRes.json();
      const workoutLogs = await workoutLogsRes.json();

      dispatch({ type: 'SET_FITNESS_DATA', payload: { exercises, mesocycles, workoutLogs } })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'An unknown error occurred' })
    }
  }, [user])

  const createExercise = async (exerciseData: Omit<ExerciseRow, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'>) => {
    try {
        const response = await fetch('/api/fitness/exercises', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(exerciseData),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create exercise');
        }
        const newExercise = await response.json();
        await refreshAll(); // Refresh data after creation
        return newExercise;
    } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'An unknown error occurred' });
        return null;
    }
  }

  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  const value = {
    ...state,
    createExercise,
    refreshAll,
  }

  return (
    <FitnessContext.Provider value={value}>
      {children}
    </FitnessContext.Provider>
  )
}

export function useFitness() {
  const context = useContext(FitnessContext)
  if (context === undefined) {
    throw new Error('useFitness must be used within a FitnessDataProvider')
  }
  return context
}
