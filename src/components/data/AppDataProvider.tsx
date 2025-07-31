// src/components/data/AppDataProvider.tsx (Complete Implementation)
'use client'

import { createContext, useContext, useCallback, useReducer, useEffect, useMemo } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { createSupabaseClient } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

// Import existing types
import type { WeightEntry, WeightEntryInput } from '@/components/weight/WeightDataProvider'
import type { Goal, GoalInsert, GoalUpdate } from '@/components/goals/GoalsDataProvider'
import type { Exercise, MesocyclePlan, WorkoutLog } from '@/lib/fitness.types'
import { exerciseToRow, exerciseRowToExercise } from '@/lib/fitness.types'

// Data modules for different features
export type DataModule = 'weight' | 'goals' | 'fitness' | 'nutrition' | 'profile'

// Centralized state interface
interface AppDataState {
  // Weight data
  weightEntries: WeightEntry[]
  weightLoading: boolean
  weightError: string | null
  weightLastFetch: number | null
  
  // Goals data
  goals: Goal[]
  activeGoal: Goal | null
  goalsLoading: boolean
  goalsError: string | null
  goalsLastFetch: number | null
  
  // Fitness data
  exercises: Exercise[]
  mesocycles: MesocyclePlan[]
  workoutLogs: WorkoutLog[]
  activeMesocycle: MesocyclePlan | null
  fitnessLoading: boolean
  fitnessError: string | null
  fitnessLastFetch: number | null
  
  // Global states
  globalLoading: boolean
  syncInProgress: boolean
  lastSyncTime: number | null
}

// Action types for the reducer
type AppDataAction =
  // Weight actions
  | { type: 'SET_WEIGHT_LOADING'; payload: boolean }
  | { type: 'SET_WEIGHT_ERROR'; payload: string | null }
  | { type: 'SET_WEIGHT_ENTRIES'; payload: WeightEntry[] }
  | { type: 'ADD_WEIGHT_ENTRY'; payload: WeightEntry }
  | { type: 'UPDATE_WEIGHT_ENTRY'; payload: WeightEntry }
  | { type: 'REMOVE_WEIGHT_ENTRY'; payload: string }
  | { type: 'SET_WEIGHT_LAST_FETCH'; payload: number }
  
  // Goals actions
  | { type: 'SET_GOALS_LOADING'; payload: boolean }
  | { type: 'SET_GOALS_ERROR'; payload: string | null }
  | { type: 'SET_GOALS_DATA'; payload: { goals: Goal[], activeGoal: Goal | null } }
  | { type: 'ADD_GOAL'; payload: Goal }
  | { type: 'UPDATE_GOAL'; payload: Goal }
  | { type: 'REMOVE_GOAL'; payload: string }
  | { type: 'SET_ACTIVE_GOAL'; payload: Goal | null }
  | { type: 'SET_GOALS_LAST_FETCH'; payload: number }
  
  // Fitness actions
  | { type: 'SET_FITNESS_LOADING'; payload: boolean }
  | { type: 'SET_FITNESS_ERROR'; payload: string | null }
  | { type: 'SET_FITNESS_DATA'; payload: { exercises: Exercise[], mesocycles: MesocyclePlan[], workoutLogs: WorkoutLog[] } }
  | { type: 'ADD_EXERCISE'; payload: Exercise }
  | { type: 'UPDATE_EXERCISE'; payload: Exercise }
  | { type: 'REMOVE_EXERCISE'; payload: string }
  | { type: 'SET_FITNESS_LAST_FETCH'; payload: number }
  
  // Global actions
  | { type: 'SET_GLOBAL_LOADING'; payload: boolean }
  | { type: 'SET_SYNC_IN_PROGRESS'; payload: boolean }
  | { type: 'SET_LAST_SYNC_TIME'; payload: number }
  | { type: 'RESET_ALL_DATA' }

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const STALE_WHILE_REVALIDATE_DURATION = 30 * 60 * 1000 // 30 minutes

// Initial state
const initialState: AppDataState = {
  weightEntries: [],
  weightLoading: false,
  weightError: null,
  weightLastFetch: null,
  
  goals: [],
  activeGoal: null,
  goalsLoading: false,
  goalsError: null,
  goalsLastFetch: null,
  
  exercises: [],
  mesocycles: [],
  workoutLogs: [],
  activeMesocycle: null,
  fitnessLoading: false,
  fitnessError: null,
  fitnessLastFetch: null,
  
  globalLoading: false,
  syncInProgress: false,
  lastSyncTime: null,
}

// Reducer function
function appDataReducer(state: AppDataState, action: AppDataAction): AppDataState {
  switch (action.type) {
    // Weight cases
    case 'SET_WEIGHT_LOADING':
      return { ...state, weightLoading: action.payload }
    case 'SET_WEIGHT_ERROR':
      return { ...state, weightError: action.payload, weightLoading: false }
    case 'SET_WEIGHT_ENTRIES':
      return { ...state, weightEntries: action.payload, weightError: null }
    case 'ADD_WEIGHT_ENTRY':
      return { 
        ...state, 
        weightEntries: [action.payload, ...state.weightEntries].sort((a, b) => 
          new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
        )
      }
    case 'UPDATE_WEIGHT_ENTRY':
      return {
        ...state,
        weightEntries: state.weightEntries.map(entry =>
          entry.id === action.payload.id ? action.payload : entry
        )
      }
    case 'REMOVE_WEIGHT_ENTRY':
      return {
        ...state,
        weightEntries: state.weightEntries.filter(entry => entry.id !== action.payload)
      }
    case 'SET_WEIGHT_LAST_FETCH':
      return { ...state, weightLastFetch: action.payload }
    
    // Goals cases
    case 'SET_GOALS_LOADING':
      return { ...state, goalsLoading: action.payload }
    case 'SET_GOALS_ERROR':
      return { ...state, goalsError: action.payload, goalsLoading: false }
    case 'SET_GOALS_DATA':
      return { 
        ...state, 
        goals: action.payload.goals, 
        activeGoal: action.payload.activeGoal,
        goalsError: null 
      }
    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, action.payload] }
    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map(goal =>
          goal.id === action.payload.id ? action.payload : goal
        ),
        activeGoal: state.activeGoal?.id === action.payload.id ? action.payload : state.activeGoal
      }
    case 'REMOVE_GOAL':
      return {
        ...state,
        goals: state.goals.filter(goal => goal.id !== action.payload),
        activeGoal: state.activeGoal?.id === action.payload ? null : state.activeGoal
      }
    case 'SET_ACTIVE_GOAL':
      return { ...state, activeGoal: action.payload }
    case 'SET_GOALS_LAST_FETCH':
      return { ...state, goalsLastFetch: action.payload }
    
    // Fitness cases
    case 'SET_FITNESS_LOADING':
      return { ...state, fitnessLoading: action.payload }
    case 'SET_FITNESS_ERROR':
      return { ...state, fitnessError: action.payload, fitnessLoading: false }
    case 'SET_FITNESS_DATA':
      return { 
        ...state, 
        exercises: action.payload.exercises,
        mesocycles: action.payload.mesocycles,
        workoutLogs: action.payload.workoutLogs,
        activeMesocycle: action.payload.mesocycles.find(m => m.is_active) || null,
        fitnessError: null 
      }
    case 'ADD_EXERCISE':
      return { ...state, exercises: [...state.exercises, action.payload] }
    case 'UPDATE_EXERCISE':
      return {
        ...state,
        exercises: state.exercises.map(exercise =>
          exercise.id === action.payload.id ? action.payload : exercise
        )
      }
    case 'REMOVE_EXERCISE':
      return {
        ...state,
        exercises: state.exercises.filter(exercise => exercise.id !== action.payload)
      }
    case 'SET_FITNESS_LAST_FETCH':
      return { ...state, fitnessLastFetch: action.payload }
    
    // Global cases
    case 'SET_GLOBAL_LOADING':
      return { ...state, globalLoading: action.payload }
    case 'SET_SYNC_IN_PROGRESS':
      return { ...state, syncInProgress: action.payload }
    case 'SET_LAST_SYNC_TIME':
      return { ...state, lastSyncTime: action.payload }
    case 'RESET_ALL_DATA':
      return initialState
    
    default:
      return state
  }
}

// Context interface
interface AppDataContextType extends AppDataState {
  // Weight methods
  createWeightEntry: (entry: WeightEntryInput) => Promise<WeightEntry | null>
  updateWeightEntry: (id: string, entry: Partial<WeightEntryInput>) => Promise<WeightEntry | null>
  deleteWeightEntry: (id: string) => Promise<boolean>
  refreshWeightEntries: (force?: boolean) => Promise<void>
  
  // Goals methods
  createGoal: (goal: Omit<GoalInsert, 'user_id'>) => Promise<Goal | null>
  updateGoal: (id: string, updates: GoalUpdate) => Promise<Goal | null>
  deleteGoal: (id: string) => Promise<boolean>
  completeGoal: (id: string) => Promise<boolean>
  setGoalActive: (id: string) => Promise<boolean>
  refreshGoals: (force?: boolean) => Promise<void>
  
  // Fitness methods
  createExercise: (exercise: Omit<Exercise, 'id'>) => Promise<Exercise | null>
  updateExercise: (id: string, updates: Partial<Omit<Exercise, 'id'>>) => Promise<Exercise | null>
  deleteExercise: (id: string) => Promise<boolean>
  refreshFitness: (force?: boolean) => Promise<void>
  
  // Global methods
  refreshAllData: (force?: boolean) => Promise<void>
  clearCache: (modules?: DataModule[]) => void
  invalidateCache: (modules: DataModule[]) => void
  
  // Utility methods
  isDataStale: (module: DataModule) => boolean
  getLastFetchTime: (module: DataModule) => number | null
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined)

// Main provider component
export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appDataReducer, initialState)
  const { user } = useAuth()
  const supabase = createSupabaseClient()

  // Utility functions
  const isDataStale = useCallback((module: DataModule): boolean => {
    const lastFetch = getLastFetchTime(module)
    if (!lastFetch) return true
    return Date.now() - lastFetch > CACHE_DURATION
  }, [])

  const getLastFetchTime = useCallback((module: DataModule): number | null => {
    switch (module) {
      case 'weight': return state.weightLastFetch
      case 'goals': return state.goalsLastFetch
      case 'fitness': return state.fitnessLastFetch
      default: return null
    }
  }, [state.weightLastFetch, state.goalsLastFetch, state.fitnessLastFetch])

  const clearCache = useCallback((modules?: DataModule[]) => {
    if (!modules) {
      dispatch({ type: 'RESET_ALL_DATA' })
      return
    }
    
    modules.forEach(module => {
      switch (module) {
        case 'weight':
          dispatch({ type: 'SET_WEIGHT_ENTRIES', payload: [] })
          dispatch({ type: 'SET_WEIGHT_LAST_FETCH', payload: 0 })
          break
        case 'goals':
          dispatch({ type: 'SET_GOALS_DATA', payload: { goals: [], activeGoal: null } })
          dispatch({ type: 'SET_GOALS_LAST_FETCH', payload: 0 })
          break
        case 'fitness':
          dispatch({ type: 'SET_FITNESS_DATA', payload: { exercises: [], mesocycles: [], workoutLogs: [] } })
          dispatch({ type: 'SET_FITNESS_LAST_FETCH', payload: 0 })
          break
      }
    })
  }, [])

  const invalidateCache = useCallback((modules: DataModule[]) => {
    modules.forEach(module => {
      switch (module) {
        case 'weight':
          dispatch({ type: 'SET_WEIGHT_LAST_FETCH', payload: 0 })
          break
        case 'goals':
          dispatch({ type: 'SET_GOALS_LAST_FETCH', payload: 0 })
          break
        case 'fitness':
          dispatch({ type: 'SET_FITNESS_LAST_FETCH', payload: 0 })
          break
      }
    })
  }, [])

  // Weight data methods
  const refreshWeightEntries = useCallback(async (force = false) => {
    if (!user) {
      dispatch({ type: 'SET_WEIGHT_ENTRIES', payload: [] })
      return
    }

    if (!force && !isDataStale('weight')) {
      return // Use cached data
    }

    try {
      dispatch({ type: 'SET_WEIGHT_LOADING', payload: true })
      dispatch({ type: 'SET_WEIGHT_ERROR', payload: null })
      
      const response = await fetch('/api/weight-entries')
      if (!response.ok) {
        throw new Error('Failed to fetch weight entries')
      }
      
      const result = await response.json()
      dispatch({ type: 'SET_WEIGHT_ENTRIES', payload: result.data || [] })
      dispatch({ type: 'SET_WEIGHT_LAST_FETCH', payload: Date.now() })
    } catch (err) {
      dispatch({ type: 'SET_WEIGHT_ERROR', payload: err instanceof Error ? err.message : 'An error occurred' })
      dispatch({ type: 'SET_WEIGHT_ENTRIES', payload: [] })
    } finally {
      dispatch({ type: 'SET_WEIGHT_LOADING', payload: false })
    }
  }, [user, isDataStale])

  const createWeightEntry = useCallback(async (entry: WeightEntryInput): Promise<WeightEntry | null> => {
    try {
      dispatch({ type: 'SET_WEIGHT_ERROR', payload: null })
      
      const response = await fetch('/api/weight-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create weight entry')
      }

      const result = await response.json()
      const newEntry = result.data

      dispatch({ type: 'ADD_WEIGHT_ENTRY', payload: newEntry })
      
      // Invalidate related caches (goals might need recalculation)
      invalidateCache(['goals'])
      
      return newEntry
    } catch (err) {
      dispatch({ type: 'SET_WEIGHT_ERROR', payload: err instanceof Error ? err.message : 'An error occurred' })
      return null
    }
  }, [invalidateCache])

  const updateWeightEntry = useCallback(async (id: string, entry: Partial<WeightEntryInput>): Promise<WeightEntry | null> => {
    try {
      dispatch({ type: 'SET_WEIGHT_ERROR', payload: null })
      
      const response = await fetch(`/api/weight-entries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update weight entry')
      }

      const result = await response.json()
      const updatedEntry = result.data

      dispatch({ type: 'UPDATE_WEIGHT_ENTRY', payload: updatedEntry })
      invalidateCache(['goals'])
      
      return updatedEntry
    } catch (err) {
      dispatch({ type: 'SET_WEIGHT_ERROR', payload: err instanceof Error ? err.message : 'An error occurred' })
      return null
    }
  }, [invalidateCache])

  const deleteWeightEntry = useCallback(async (id: string): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_WEIGHT_ERROR', payload: null })
      
      const response = await fetch(`/api/weight-entries/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete weight entry')
      }

      dispatch({ type: 'REMOVE_WEIGHT_ENTRY', payload: id })
      invalidateCache(['goals'])
      
      return true
    } catch (err) {
      dispatch({ type: 'SET_WEIGHT_ERROR', payload: err instanceof Error ? err.message : 'An error occurred' })
      return false
    }
  }, [invalidateCache])

  // Goals data methods
  const refreshGoals = useCallback(async (force = false) => {
    if (!user) {
      dispatch({ type: 'SET_GOALS_DATA', payload: { goals: [], activeGoal: null } })
      return
    }

    if (!force && !isDataStale('goals')) {
      return // Use cached data
    }

    try {
      dispatch({ type: 'SET_GOALS_LOADING', payload: true })
      dispatch({ type: 'SET_GOALS_ERROR', payload: null })

      const { data: goalsData, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const goals = goalsData || []
      const activeGoal = goals.find(goal => goal.is_active) || null

      dispatch({ type: 'SET_GOALS_DATA', payload: { goals, activeGoal } })
      dispatch({ type: 'SET_GOALS_LAST_FETCH', payload: Date.now() })
    } catch (err) {
      dispatch({ type: 'SET_GOALS_ERROR', payload: err instanceof Error ? err.message : 'Failed to fetch goals' })
    } finally {
      dispatch({ type: 'SET_GOALS_LOADING', payload: false })
    }
  }, [user, supabase, isDataStale])

  const createGoal = useCallback(async (goal: Omit<GoalInsert, 'user_id'>): Promise<Goal | null> => {
    if (!user) return null

    try {
      dispatch({ type: 'SET_GOALS_ERROR', payload: null })

      const { data, error } = await supabase
        .from('goals')
        .insert({
          ...goal,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) throw error

      dispatch({ type: 'ADD_GOAL', payload: data })
      return data
    } catch (err) {
      dispatch({ type: 'SET_GOALS_ERROR', payload: err instanceof Error ? err.message : 'Failed to create goal' })
      return null
    }
  }, [user, supabase])

  const updateGoal = useCallback(async (id: string, updates: GoalUpdate): Promise<Goal | null> => {
    if (!user) return null

    try {
      dispatch({ type: 'SET_GOALS_ERROR', payload: null })

      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      dispatch({ type: 'UPDATE_GOAL', payload: data })
      return data
    } catch (err) {
      dispatch({ type: 'SET_GOALS_ERROR', payload: err instanceof Error ? err.message : 'Failed to update goal' })
      return null
    }
  }, [user, supabase])

  const deleteGoal = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false

    try {
      dispatch({ type: 'SET_GOALS_ERROR', payload: null })

      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      dispatch({ type: 'REMOVE_GOAL', payload: id })
      return true
    } catch (err) {
      dispatch({ type: 'SET_GOALS_ERROR', payload: err instanceof Error ? err.message : 'Failed to delete goal' })
      return false
    }
  }, [user, supabase])

  const completeGoal = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false

    try {
      dispatch({ type: 'SET_GOALS_ERROR', payload: null })

      const { data, error } = await supabase
        .from('goals')
        .update({ is_active: false, completed_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      dispatch({ type: 'UPDATE_GOAL', payload: data })
      
      // If this was the active goal, clear active goal
      if (state.activeGoal?.id === id) {
        dispatch({ type: 'SET_ACTIVE_GOAL', payload: null })
      }
      
      return true
    } catch (err) {
      dispatch({ type: 'SET_GOALS_ERROR', payload: err instanceof Error ? err.message : 'Failed to complete goal' })
      return false
    }
  }, [user, supabase, state.activeGoal?.id])

  const setGoalActive = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false

    try {
      dispatch({ type: 'SET_GOALS_ERROR', payload: null })

      // First, deactivate all other goals
      await supabase
        .from('goals')
        .update({ is_active: false })
        .eq('user_id', user.id)

      // Then activate the selected goal
      const { data, error } = await supabase
        .from('goals')
        .update({ is_active: true })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      // Refresh all goals to ensure consistency
      await refreshGoals(true)
      
      return true
    } catch (err) {
      dispatch({ type: 'SET_GOALS_ERROR', payload: err instanceof Error ? err.message : 'Failed to activate goal' })
      return false
    }
  }, [user, supabase, refreshGoals])

  // Fitness data methods
  const refreshFitness = useCallback(async (force = false) => {
    if (!user) {
      dispatch({ type: 'SET_FITNESS_DATA', payload: { exercises: [], mesocycles: [], workoutLogs: [] } })
      return
    }

    if (!force && !isDataStale('fitness')) {
      return // Use cached data
    }

    try {
      dispatch({ type: 'SET_FITNESS_LOADING', payload: true })
      dispatch({ type: 'SET_FITNESS_ERROR', payload: null })

      // Fetch all fitness data in parallel
      const [exercisesResponse, mesocyclesResponse] = await Promise.all([
        fetch('/api/fitness/exercises'),
        fetch('/api/fitness/mesocycles')
      ])

      if (!exercisesResponse.ok || !mesocyclesResponse.ok) {
        throw new Error('Failed to fetch fitness data')
      }

      const [exercisesResult, mesocyclesResult] = await Promise.all([
        exercisesResponse.json(),
        mesocyclesResponse.json()
      ])

      dispatch({ 
        type: 'SET_FITNESS_DATA', 
        payload: { 
          exercises: exercisesResult.data || [], 
          mesocycles: mesocyclesResult.data || [], 
          workoutLogs: [] // Would be fetched separately as needed
        } 
      })
      dispatch({ type: 'SET_FITNESS_LAST_FETCH', payload: Date.now() })
    } catch (err) {
      dispatch({ type: 'SET_FITNESS_ERROR', payload: err instanceof Error ? err.message : 'Failed to fetch fitness data' })
    } finally {
      dispatch({ type: 'SET_FITNESS_LOADING', payload: false })
    }
  }, [user, isDataStale])

  const createExercise = useCallback(async (exercise: Omit<Exercise, 'id'>): Promise<Exercise | null> => {
    try {
      dispatch({ type: 'SET_FITNESS_ERROR', payload: null })
      
      const rowData = exerciseToRow(exercise)
      const response = await fetch('/api/fitness/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rowData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create exercise')
      }

      const createdExerciseRow = await response.json()
      const createdExercise = exerciseRowToExercise(createdExerciseRow)
      
      dispatch({ type: 'ADD_EXERCISE', payload: createdExercise })
      return createdExercise
    } catch (err) {
      dispatch({ type: 'SET_FITNESS_ERROR', payload: err instanceof Error ? err.message : 'Failed to create exercise' })
      return null
    }
  }, [])

  const updateExercise = useCallback(async (id: string, updates: Partial<Omit<Exercise, 'id'>>): Promise<Exercise | null> => {
    try {
      dispatch({ type: 'SET_FITNESS_ERROR', payload: null })
      
      const rowData = exerciseToRow(updates as Omit<Exercise, 'id'>)
      const response = await fetch(`/api/fitness/exercises/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rowData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update exercise')
      }

      const updatedExerciseRow = await response.json()
      const updatedExercise = exerciseRowToExercise(updatedExerciseRow)
      
      dispatch({ type: 'UPDATE_EXERCISE', payload: updatedExercise })
      return updatedExercise
    } catch (err) {
      dispatch({ type: 'SET_FITNESS_ERROR', payload: err instanceof Error ? err.message : 'Failed to update exercise' })
      return null
    }
  }, [])

  const deleteExercise = useCallback(async (id: string): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_FITNESS_ERROR', payload: null })
      
      const response = await fetch(`/api/fitness/exercises/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete exercise')
      }

      dispatch({ type: 'REMOVE_EXERCISE', payload: id })
      return true
    } catch (err) {
      dispatch({ type: 'SET_FITNESS_ERROR', payload: err instanceof Error ? err.message : 'Failed to delete exercise' })
      return false
    }
  }, [])

  // Global refresh method
  const refreshAllData = useCallback(async (force = false) => {
    dispatch({ type: 'SET_SYNC_IN_PROGRESS', payload: true })
    
    try {
      await Promise.all([
        refreshWeightEntries(force),
        refreshGoals(force),
        refreshFitness(force)
      ])
      
      dispatch({ type: 'SET_LAST_SYNC_TIME', payload: Date.now() })
    } catch (err) {
      console.error('Error during global data refresh:', err)
    } finally {
      dispatch({ type: 'SET_SYNC_IN_PROGRESS', payload: false })
    }
  }, [refreshWeightEntries, refreshGoals, refreshFitness])

  // Auto-refresh data when user changes
  useEffect(() => {
    if (user) {
      refreshAllData()
    } else {
      // Clear all data when user logs out
      dispatch({ type: 'RESET_ALL_DATA' })
    }
  }, [user?.id, refreshAllData])

  // Memoized context value
  const contextValue = useMemo(() => ({
    ...state,
    // Weight methods
    createWeightEntry,
    updateWeightEntry,
    deleteWeightEntry,
    refreshWeightEntries,
    // Goals methods
    createGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
    setGoalActive,
    refreshGoals,
    // Fitness methods
    createExercise,
    updateExercise,
    deleteExercise,
    refreshFitness,
    // Global methods
    refreshAllData,
    clearCache,
    invalidateCache,
    // Utility methods
    isDataStale,
    getLastFetchTime,
  }), [
    state,
    createWeightEntry,
    updateWeightEntry,
    deleteWeightEntry,
    refreshWeightEntries,
    createGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
    setGoalActive,
    refreshGoals,
    createExercise,
    updateExercise,
    deleteExercise,
    refreshFitness,
    refreshAllData,
    clearCache,
    invalidateCache,
    isDataStale,
    getLastFetchTime,
  ])

  return (
    <AppDataContext.Provider value={contextValue}>
      {children}
    </AppDataContext.Provider>
  )
}

// Hook to use the unified data provider
export function useAppData() {
  const context = useContext(AppDataContext)
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider')
  }
  return context
}