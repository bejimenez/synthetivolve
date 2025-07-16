// src/components/nutrition/NutritionDataProvider.tsx
'use client'

import { createContext, useContext, useCallback, useReducer, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { FoodSearchResult } from '@/lib/nutrition/usda'
import { FoodLog, RecentFood, FoodLogInsert } from '@/lib/nutrition/nutrition.types'

interface NutritionState {
  foodLogs: FoodLog[]
  recentFoods: RecentFood[]
  loading: boolean
  error: string | null
}

type NutritionAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FOOD_LOGS'; payload: FoodLog[] }
  | { type: 'SET_RECENT_FOODS'; payload: RecentFood[] }
  | { type: 'ADD_FOOD_LOG'; payload: FoodLog }
  | { type: 'REMOVE_FOOD_LOG'; payload: string }

interface NutritionContextType extends NutritionState {
  fetchFoodLogs: (date: string) => Promise<void>
  fetchRecentFoods: () => Promise<void>
  logEntry: (entry: any) => Promise<FoodLog | null>
  deleteFoodLog: (id: string) => Promise<boolean>
  searchFoods: (query: string) => Promise<FoodSearchResult[]>
}

export const NutritionContext = createContext<NutritionContextType | undefined>(undefined)

function nutritionReducer(state: NutritionState, action: NutritionAction): NutritionState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
    case 'SET_FOOD_LOGS':
      return { ...state, foodLogs: action.payload, loading: false, error: null }
    case 'SET_RECENT_FOODS':
      return { ...state, recentFoods: action.payload }
    case 'ADD_FOOD_LOG':
      return { ...state, foodLogs: [...state.foodLogs, action.payload].sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime()) }
    case 'REMOVE_FOOD_LOG':
      return { ...state, foodLogs: state.foodLogs.filter(log => log.id !== action.payload) }
    default:
      return state
  }
}

export function NutritionDataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(nutritionReducer, {
    foodLogs: [],
    recentFoods: [],
    loading: true,
    error: null,
  })
  const { user } = useAuth()

  const fetchFoodLogs = useCallback(async (date: string) => {
    if (!user) return
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const response = await fetch(`/api/nutrition/food-logs?date=${date}`)
      if (!response.ok) throw new Error('Failed to fetch food logs')
      const data = await response.json()
      dispatch({ type: 'SET_FOOD_LOGS', payload: data })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'An unknown error occurred' })
    }
  }, [user])

  const fetchRecentFoods = useCallback(async () => {
    if (!user) return
    try {
      const response = await fetch('/api/nutrition/recent-foods')
      if (!response.ok) throw new Error('Failed to fetch recent foods')
      const data = await response.json()
      dispatch({ type: 'SET_RECENT_FOODS', payload: data })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'An unknown error occurred' })
    }
  }, [user])

  const logEntry = async (entry: any): Promise<FoodLog | null> => {
    try {
      const response = await fetch('/api/nutrition/log-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to log entry')
      }
      const newLog = await response.json()
      await fetchFoodLogs(entry.logged_date) // Refresh logs for the day
      await fetchRecentFoods() // Refresh recent foods
      return newLog
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'An unknown error occurred' })
      return null
    }
  }

  const deleteFoodLog = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/nutrition/food-logs/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete food log')
      }
      dispatch({ type: 'REMOVE_FOOD_LOG', payload: id })
      return true
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'An unknown error occurred' })
      return false
    }
  }

  const searchFoods = async (query: string): Promise<FoodSearchResult[]> => {
    try {
      const response = await fetch(`/api/nutrition/search?query=${encodeURIComponent(query)}`)
      if (!response.ok) {
        throw new Error('Failed to search foods')
      }
      return await response.json()
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'An unknown error occurred' })
      return []
    }
  }

  useEffect(() => {
    if (user) {
      fetchRecentFoods()
    }
  }, [user, fetchRecentFoods])

  const value = {
    ...state,
    fetchFoodLogs,
    fetchRecentFoods,
    logEntry,
    deleteFoodLog,
    searchFoods,
  }

  return (
    <NutritionContext.Provider value={value}>
      {children}
    </NutritionContext.Provider>
  )
}