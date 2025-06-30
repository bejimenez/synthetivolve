// src/components/goals/GoalsDataProvider.tsx
'use client'

import { createContext, useContext, useCallback, useReducer, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { createSupabaseClient } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

export type Goal = Database['public']['Tables']['goals']['Row']
export type GoalInsert = Database['public']['Tables']['goals']['Insert']
export type GoalUpdate = Database['public']['Tables']['goals']['Update']

interface GoalsState {
  goals: Goal[]
  activeGoal: Goal | null
  loading: boolean
  error: string | null
}

type GoalsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_GOALS'; payload: Goal[] }
  | { type: 'ADD_GOAL'; payload: Goal }
  | { type: 'UPDATE_GOAL'; payload: Goal }
  | { type: 'REMOVE_GOAL'; payload: string }
  | { type: 'SET_ACTIVE_GOAL'; payload: Goal | null }

interface GoalsContextType extends GoalsState {
  createGoal: (goal: Omit<GoalInsert, 'user_id'>) => Promise<Goal | null>
  updateGoal: (id: string, updates: GoalUpdate) => Promise<Goal | null>
  deleteGoal: (id: string) => Promise<boolean>
  completeGoal: (id: string) => Promise<boolean>
  setGoalActive: (id: string) => Promise<boolean>
  refreshGoals: () => Promise<void>
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined)

function goalsReducer(state: GoalsState, action: GoalsAction): GoalsState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_GOALS':
      const activeGoal = action.payload.find(goal => goal.is_active) || null
      return { 
        ...state, 
        goals: action.payload, 
        activeGoal, 
        loading: false, 
        error: null 
      }
    case 'ADD_GOAL':
      // When adding a new goal, it becomes the active one
      const updatedGoals = [action.payload, ...state.goals]
      return {
        ...state,
        goals: updatedGoals,
        activeGoal: action.payload.is_active ? action.payload : state.activeGoal,
        error: null
      }
    case 'UPDATE_GOAL':
      const updatedGoalsList = state.goals.map(goal => 
        goal.id === action.payload.id ? action.payload : goal
      )
      return {
        ...state,
        goals: updatedGoalsList,
        activeGoal: action.payload.is_active ? action.payload : 
          (state.activeGoal?.id === action.payload.id ? action.payload : state.activeGoal),
        error: null
      }
    case 'REMOVE_GOAL':
      const filteredGoals = state.goals.filter(goal => goal.id !== action.payload)
      return {
        ...state,
        goals: filteredGoals,
        activeGoal: state.activeGoal?.id === action.payload ? null : state.activeGoal,
        error: null
      }
    case 'SET_ACTIVE_GOAL':
      return {
        ...state,
        activeGoal: action.payload,
        error: null
      }
    default:
      return state
  }
}

export function GoalsDataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(goalsReducer, {
    goals: [],
    activeGoal: null,
    loading: true,
    error: null
  })
  const { user } = useAuth()
  const supabase = createSupabaseClient()

  const refreshGoals = useCallback(async () => {
    if (!user) {
      dispatch({ type: 'SET_GOALS', payload: [] })
      return
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      dispatch({ type: 'SET_GOALS', payload: data || [] })
    } catch (err) {
      console.error('Error fetching goals:', err)
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to fetch goals' })
      dispatch({ type: 'SET_GOALS', payload: [] })
    }
  }, [user, supabase])

  const createGoal = useCallback(async (goalData: Omit<GoalInsert, 'user_id'>): Promise<Goal | null> => {
    if (!user) {
      dispatch({ type: 'SET_ERROR', payload: 'No authenticated user' })
      return null
    }

    try {
      dispatch({ type: 'SET_ERROR', payload: null })

      // Deactivate any existing active goals first
      if (state.activeGoal) {
        await supabase
          .from('goals')
          .update({ is_active: false })
          .eq('id', state.activeGoal.id)
      }

      const { data, error } = await supabase
        .from('goals')
        .insert([{
          ...goalData,
          user_id: user.id,
          is_active: true
        }])
        .select()
        .single()

      if (error) throw error

      // Optimistically update state
      dispatch({ type: 'ADD_GOAL', payload: data })
      
      // Refresh to ensure consistency
      await refreshGoals()
      
      return data
    } catch (err) {
      console.error('Error creating goal:', err)
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to create goal' })
      return null
    }
  }, [user, supabase, state.activeGoal, refreshGoals])

  const updateGoal = useCallback(async (id: string, updates: GoalUpdate): Promise<Goal | null> => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null })

      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      dispatch({ type: 'UPDATE_GOAL', payload: data })
      
      return data
    } catch (err) {
      console.error('Error updating goal:', err)
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to update goal' })
      return null
    }
  }, [supabase])

  const deleteGoal = useCallback(async (id: string): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null })

      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)

      if (error) throw error

      dispatch({ type: 'REMOVE_GOAL', payload: id })
      
      return true
    } catch (err) {
      console.error('Error deleting goal:', err)
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to delete goal' })
      return false
    }
  }, [supabase])

  const completeGoal = useCallback(async (id: string): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null })

      const { data, error } = await supabase
        .from('goals')
        .update({ 
          is_active: false,
          completed_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      dispatch({ type: 'UPDATE_GOAL', payload: data })
      
      return true
    } catch (err) {
      console.error('Error completing goal:', err)
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to complete goal' })
      return false
    }
  }, [supabase])

  const setGoalActive = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      dispatch({ type: 'SET_ERROR', payload: 'No authenticated user' })
      return false
    }

    try {
      dispatch({ type: 'SET_ERROR', payload: null })

      // Deactivate all goals for this user
      await supabase
        .from('goals')
        .update({ is_active: false })
        .eq('user_id', user.id)

      // Activate the selected goal
      const { error } = await supabase
        .from('goals')
        .update({ is_active: true })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Refresh to ensure consistency
      await refreshGoals()
      
      return true
    } catch (err) {
      console.error('Error setting goal active:', err)
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to activate goal' })
      return false
    }
  }, [user, supabase, refreshGoals])

  // Fetch goals when user changes
  useEffect(() => {
    refreshGoals()
  }, [refreshGoals])

  const value = {
    ...state,
    createGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
    setGoalActive,
    refreshGoals,
  }

  return (
    <GoalsContext.Provider value={value}>
      {children}
    </GoalsContext.Provider>
  )
}

export function useGoalsData() {
  const context = useContext(GoalsContext)
  if (context === undefined) {
    throw new Error('useGoalsData must be used within a GoalsDataProvider')
  }
  return context
}