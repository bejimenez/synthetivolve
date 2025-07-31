// src/components/data/AppDataProvider.tsx (Complete Final Implementation)
'use client'

import { createContext, useContext, useCallback, useReducer, useEffect, useMemo } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { createSupabaseClient } from '@/lib/supabase'

// Import types from the new fitness system
import type { 
  Exercise, 
  Mesocycle, 
  WorkoutSession,
  CreateMesocycleInput,
  UpdateMesocycleInput
} from '@/lib/fitness.types'
import { exerciseRowToExercise, mesocycleRowToMesocycle } from '@/lib/fitness.types'

// Import existing types
import type { WeightEntry, WeightEntryInput } from '@/lib/weight.types'
import type { Goal, GoalInsert, GoalUpdate } from '@/lib/goals.types'

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
  
  // Fitness data (updated structure)
  exercises: Exercise[]
  mesocycles: Mesocycle[]
  workoutSessions: WorkoutSession[]
  activeMesocycle: Mesocycle | null
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
  
  // Fitness actions (updated)
  | { type: 'SET_FITNESS_LOADING'; payload: boolean }
  | { type: 'SET_FITNESS_ERROR'; payload: string | null }
  | { type: 'SET_FITNESS_DATA'; payload: { exercises: Exercise[], mesocycles: Mesocycle[], workoutSessions: WorkoutSession[] } }
  | { type: 'ADD_EXERCISE'; payload: Exercise }
  | { type: 'UPDATE_EXERCISE'; payload: Exercise }
  | { type: 'REMOVE_EXERCISE'; payload: string }
  | { type: 'ADD_MESOCYCLE'; payload: Mesocycle }
  | { type: 'UPDATE_MESOCYCLE'; payload: Mesocycle }
  | { type: 'REMOVE_MESOCYCLE'; payload: string }
  | { type: 'SET_ACTIVE_MESOCYCLE'; payload: Mesocycle | null }
  | { type: 'SET_FITNESS_LAST_FETCH'; payload: number }
  
  // Global actions
  | { type: 'SET_GLOBAL_LOADING'; payload: boolean }
  | { type: 'SET_SYNC_IN_PROGRESS'; payload: boolean }
  | { type: 'SET_LAST_SYNC_TIME'; payload: number }
  | { type: 'RESET_ALL_DATA' }

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

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
  workoutSessions: [],
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
    
    // Fitness cases (updated)
    case 'SET_FITNESS_LOADING':
      return { ...state, fitnessLoading: action.payload }
    case 'SET_FITNESS_ERROR':
      return { ...state, fitnessError: action.payload, fitnessLoading: false }
    case 'SET_FITNESS_DATA':
      return { 
        ...state, 
        exercises: action.payload.exercises,
        mesocycles: action.payload.mesocycles,
        workoutSessions: action.payload.workoutSessions,
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
    case 'ADD_MESOCYCLE':
      return { 
        ...state, 
        mesocycles: [...state.mesocycles, action.payload],
        // If this is the first mesocycle or it's set to active, make it the active one
        activeMesocycle: action.payload.is_active ? action.payload : state.activeMesocycle
      }
    case 'UPDATE_MESOCYCLE':
      return {
        ...state,
        mesocycles: state.mesocycles.map(mesocycle =>
          mesocycle.id === action.payload.id ? action.payload : mesocycle
        ),
        activeMesocycle: action.payload.is_active ? action.payload : 
          (state.activeMesocycle?.id === action.payload.id && !action.payload.is_active) ? null : state.activeMesocycle
      }
    case 'REMOVE_MESOCYCLE':
      return {
        ...state,
        mesocycles: state.mesocycles.filter(mesocycle => mesocycle.id !== action.payload),
        activeMesocycle: state.activeMesocycle?.id === action.payload ? null : state.activeMesocycle
      }
    case 'SET_ACTIVE_MESOCYCLE':
      return { ...state, activeMesocycle: action.payload }
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
  
  // Fitness methods (updated)
  createExercise: (exercise: Omit<Exercise, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>) => Promise<Exercise | null>
  updateExercise: (id: string, updates: Partial<Omit<Exercise, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>) => Promise<Exercise | null>
  deleteExercise: (id: string) => Promise<boolean>
  createMesocycle: (mesocycle: CreateMesocycleInput) => Promise<Mesocycle | null>
  updateMesocycle: (id: string, updates: UpdateMesocycleInput) => Promise<Mesocycle | null>
  deleteMesocycle: (id: string) => Promise<boolean>
  setMesocycleActive: (id: string) => Promise<boolean>
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
  const getLastFetchTime = useCallback((module: DataModule): number | null => {
    switch (module) {
      case 'weight': return state.weightLastFetch
      case 'goals': return state.goalsLastFetch
      case 'fitness': return state.fitnessLastFetch
      default: return null
    }
  }, [state.weightLastFetch, state.goalsLastFetch, state.fitnessLastFetch])

  const isDataStale = useCallback((module: DataModule): boolean => {
    const lastFetch = getLastFetchTime(module)
    if (!lastFetch) return true
    return Date.now() - lastFetch > CACHE_DURATION
  }, [getLastFetchTime])

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
          dispatch({ type: 'SET_FITNESS_DATA', payload: { exercises: [], mesocycles: [], workoutSessions: [] } })
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

  // Weight data methods (unchanged)
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
      invalidateCache(['goals']) // Weight changes affect goal calculations
      
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

  // Goals data methods (unchanged)
  const refreshGoals = useCallback(async (force = false) => {
    if (!user) {
      dispatch({ type: 'SET_GOALS_DATA', payload: { goals: [], activeGoal: null } })
      return
    }

    if (!force && !isDataStale('goals')) {
      return
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
      const { error } = await supabase
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

  // Fitness data methods (updated for new schema)
  const refreshFitness = useCallback(async (force = false) => {
    if (!user) {
      dispatch({ type: 'SET_FITNESS_DATA', payload: { exercises: [], mesocycles: [], workoutSessions: [] } })
      return
    }

    if (!force && !isDataStale('fitness')) {
      return
    }

    try {
      dispatch({ type: 'SET_FITNESS_LOADING', payload: true })
      dispatch({ type: 'SET_FITNESS_ERROR', payload: null })

      // Fetch exercises and mesocycles in parallel
      const [exercisesData, mesocyclesData] = await Promise.all([
        supabase
          .from('exercises')
          .select('*')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .order('name'),
        supabase
          .from('mesocycles')
          .select('*')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
      ])

      if (exercisesData.error) throw exercisesData.error
      if (mesocyclesData.error) throw mesocyclesData.error

      // Transform data using the new types
      const exercises = (exercisesData.data || []).map(exerciseRowToExercise)
      const mesocycles = (mesocyclesData.data || []).map(mesocycleRowToMesocycle)

      dispatch({ 
        type: 'SET_FITNESS_DATA', 
        payload: { 
          exercises, 
          mesocycles, 
          workoutSessions: [] // Will be fetched separately as needed
        } 
      })
      dispatch({ type: 'SET_FITNESS_LAST_FETCH', payload: Date.now() })
    } catch (err) {
      dispatch({ type: 'SET_FITNESS_ERROR', payload: err instanceof Error ? err.message : 'Failed to fetch fitness data' })
    } finally {
      dispatch({ type: 'SET_FITNESS_LOADING', payload: false })
    }
  }, [user, supabase, isDataStale])

  const createExercise = useCallback(async (exercise: Omit<Exercise, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Exercise | null> => {
    if (!user) return null

    try {
      dispatch({ type: 'SET_FITNESS_ERROR', payload: null })
      
      const { data, error } = await supabase
        .from('exercises')
        .insert({
          ...exercise,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) throw error

      const newExercise = exerciseRowToExercise(data)
      dispatch({ type: 'ADD_EXERCISE', payload: newExercise })
      return newExercise
    } catch (err) {
      dispatch({ type: 'SET_FITNESS_ERROR', payload: err instanceof Error ? err.message : 'Failed to create exercise' })
      return null
    }
  }, [user, supabase])

  const updateExercise = useCallback(async (id: string, updates: Partial<Omit<Exercise, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>): Promise<Exercise | null> => {
    if (!user) return null

    try {
      dispatch({ type: 'SET_FITNESS_ERROR', payload: null })
      
      const { data, error } = await supabase
        .from('exercises')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      const updatedExercise = exerciseRowToExercise(data)
      dispatch({ type: 'UPDATE_EXERCISE', payload: updatedExercise })
      return updatedExercise
    } catch (err) {
      dispatch({ type: 'SET_FITNESS_ERROR', payload: err instanceof Error ? err.message : 'Failed to update exercise' })
      return null
    }
  }, [user, supabase])

  const deleteExercise = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false

    try {
      dispatch({ type: 'SET_FITNESS_ERROR', payload: null })
      
      // Soft delete
      const { error } = await supabase
        .from('exercises')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      dispatch({ type: 'REMOVE_EXERCISE', payload: id })
      return true
    } catch (err) {
      dispatch({ type: 'SET_FITNESS_ERROR', payload: err instanceof Error ? err.message : 'Failed to delete exercise' })
      return false
    }
  }, [user, supabase])

  const createMesocycle = useCallback(async (mesocycleInput: CreateMesocycleInput): Promise<Mesocycle | null> => {
    if (!user) return null

    try {
      dispatch({ type: 'SET_FITNESS_ERROR', payload: null })
      
      const { data, error } = await supabase
        .from('mesocycles')
        .insert({
          ...mesocycleInput,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) throw error

      const newMesocycle = mesocycleRowToMesocycle(data)
      dispatch({ type: 'ADD_MESOCYCLE', payload: newMesocycle })
      return newMesocycle
    } catch (err) {
      dispatch({ type: 'SET_FITNESS_ERROR', payload: err instanceof Error ? err.message : 'Failed to create mesocycle' })
      return null
    }
  }, [user, supabase])

  const updateMesocycle = useCallback(async (id: string, updates: UpdateMesocycleInput): Promise<Mesocycle | null> => {
    if (!user) return null

    try {
      dispatch({ type: 'SET_FITNESS_ERROR', payload: null })
      
      const { data, error } = await supabase
        .from('mesocycles')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      const updatedMesocycle = mesocycleRowToMesocycle(data)
      dispatch({ type: 'UPDATE_MESOCYCLE', payload: updatedMesocycle })
      return updatedMesocycle
    } catch (err) {
      dispatch({ type: 'SET_FITNESS_ERROR', payload: err instanceof Error ? err.message : 'Failed to update mesocycle' })
      return null
    }
  }, [user, supabase])

  const deleteMesocycle = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false

    try {
      dispatch({ type: 'SET_FITNESS_ERROR', payload: null })
      
      // Soft delete
      const { error } = await supabase
        .from('mesocycles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      dispatch({ type: 'REMOVE_MESOCYCLE', payload: id })
      return true
    } catch (err) {
      dispatch({ type: 'SET_FITNESS_ERROR', payload: err instanceof Error ? err.message : 'Failed to delete mesocycle' })
      return false
    }
  }, [user, supabase])

  const setMesocycleActive = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false

    try {
      dispatch({ type: 'SET_FITNESS_ERROR', payload: null })
      
      // The database trigger will handle deactivating other mesocycles
      const { error } = await supabase
        .from('mesocycles')
        .update({ is_active: true })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      // Refresh fitness data to get updated active state
      await refreshFitness(true)
      
      return true
    } catch (err) {
      dispatch({ type: 'SET_FITNESS_ERROR', payload: err instanceof Error ? err.message : 'Failed to activate mesocycle' })
      return false
    }
  }, [user, supabase, refreshFitness])

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
      dispatch({ type: 'RESET_ALL_DATA' })
    }
  }, [user, refreshAllData])

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
    createMesocycle,
    updateMesocycle,
    deleteMesocycle,
    setMesocycleActive,
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
    createMesocycle,
    updateMesocycle,
    deleteMesocycle,
    setMesocycleActive,
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

// Backward compatibility hook exports for existing components
export function useWeightData() {
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
    entries: weightEntries,
    loading: weightLoading,
    error: weightError,
    createWeightEntry,
    updateWeightEntry,
    deleteWeightEntry,
    refreshEntries: refreshWeightEntries,
  }
}

export function useGoalsData() {
  const {
    goals,
    activeGoal,
    goalsLoading,
    goalsError,
    createGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
    setGoalActive,
    refreshGoals,
  } = useAppData()

  return {
    goals,
    activeGoal,
    loading: goalsLoading,
    error: goalsError,
    createGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
    setGoalActive,
    refreshGoals,
  }
}

export function useFitnessData() {
  const {
    exercises,
    mesocycles,
    workoutSessions,
    activeMesocycle,
    fitnessLoading,
    fitnessError,
    createExercise,
    updateExercise,
    deleteExercise,
    createMesocycle,
    updateMesocycle,
    deleteMesocycle,
    setMesocycleActive,
    refreshFitness,
  } = useAppData()

  return {
    exercises,
    mesocycles,
    workoutLogs: workoutSessions, // Backward compatibility
    activeMesocycle,
    loading: fitnessLoading,
    error: fitnessError,
    createExercise,
    updateExercise,
    deleteExercise,
    createMesocycle,
    updateMesocycle,
    deleteMesocycle,
    setMesocycleActive,
    refreshAll: refreshFitness,
  }
}