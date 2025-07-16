'use client'

import { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import { useAuth } from '@/components/auth/AuthProvider'
import type { RecentFood, Food, FoodLogInsert, FoodLogWithFood, FoodLog } from '@/lib/nutrition/nutrition.types'
import { calculateNutrients } from '@/lib/nutrition/nutrition.types'

interface NutritionState {
  foodLogs: FoodLogWithFood[]
  recentFoods: (RecentFood & { food: Food })[]
  loading: boolean
  error: string | null
}

type NutritionAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FOOD_LOGS'; payload: FoodLogWithFood[] }
  | { type: 'SET_RECENT_FOODS'; payload: (RecentFood & { food: Food })[] }
  | { type: 'ADD_FOOD_LOG'; payload: FoodLogWithFood }
  | { type: 'UPDATE_FOOD_LOG'; payload: FoodLogWithFood }
  | { type: 'REMOVE_FOOD_LOG'; payload: string }

import { FoodSearchResult, FoodDetails } from '@/lib/nutrition/usda'

interface NutritionContextType extends NutritionState {
  addFoodLog: (log: {
    fdcId: number;
    quantity: number;
    unit: string;
    logged_at: string;
    logged_date: string;
    foodDetails: FoodDetails;
  }) => Promise<FoodLogWithFood | null>
  updateFoodLog: (id: string, updates: Partial<FoodLogInsert>) => Promise<FoodLogWithFood | null>
  removeFoodLog: (id: string) => Promise<boolean>
  searchFoods: (query: string) => Promise<FoodSearchResult[]>
  // getFoodDetails: (fdcId: number) => Promise<Food | null> // Commented out for now
  refreshLogs: () => Promise<void>
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
      return { ...state, foodLogs: [...state.foodLogs, action.payload] }
    case 'UPDATE_FOOD_LOG':
      return {
        ...state,
        foodLogs: state.foodLogs.map(log => 
          log.id === action.payload.id ? action.payload : log
        )
      }
    case 'REMOVE_FOOD_LOG':
      return {
        ...state,
        foodLogs: state.foodLogs.filter(log => log.id !== action.payload)
      }
    default:
      return state
  }
}

export function NutritionDataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(nutritionReducer, {
    foodLogs: [],
    recentFoods: [],
    loading: true,
    error: null
  })
  const { user } = useAuth()
  const supabase = createSupabaseClient()

  const refreshLogs = useCallback(async () => {
    if (!user) return

    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Fetch today's food logs with food details
      const { data: logs, error: logsError } = await supabase
        .from('food_logs')
        .select(`
          *,
          food:foods(*)
        `)
        .eq('user_id', user.id)
        .eq('logged_date', today)
        .order('logged_at', { ascending: true })

      if (logsError) throw logsError

      // Transform logs to include calculated nutrients
      const logsWithNutrients: FoodLogWithFood[] = (logs || []).map((log: FoodLog & { food: Food }) => ({
        ...log,
        food: log.food,
        nutrients: calculateNutrients(log.food, log.quantity, log.unit)
      }))

      dispatch({ type: 'SET_FOOD_LOGS', payload: logsWithNutrients })

      // Fetch recent foods
      const { data: recent, error: recentError } = await supabase
        .from('recent_foods')
        .select(`
          *,
          food:foods(*)
        `)
        .eq('user_id', user.id)
        .order('last_used', { ascending: false })
        .limit(10)

      if (recentError) throw recentError

      dispatch({ type: 'SET_RECENT_FOODS', payload: (recent || []) as (RecentFood & { food: Food })[] })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to load nutrition data' })
    }
  }, [user, supabase])

  useEffect(() => {
    refreshLogs()
  }, [refreshLogs])

  const addFoodLog = async (log: {
    fdcId: number;
    quantity: number;
    unit: string;
    logged_at: string;
    logged_date: string;
    foodDetails: FoodDetails;
  }) => {
    if (!user) return null

    try {
      const response = await fetch('/api/nutrition/log-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(log),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add food log')
      }

      const newLog = await response.json()

      // The newLog from the API will be a FoodLog, but we need FoodLogWithFood for the state.
      // We'll need to fetch the full food details or rely on the API to return it.
      // For now, we'll assume the API returns enough to construct FoodLogWithFood.
      // In a real scenario, the API might return the joined data directly.
      const foodData = await supabase.from('foods').select('*').eq('id', newLog.food_id).single()
      if (foodData.error) throw foodData.error

      const logWithNutrients: FoodLogWithFood = {
        ...newLog,
        food: foodData.data,
        nutrients: calculateNutrients(foodData.data, newLog.quantity, newLog.unit)
      }

      dispatch({ type: 'ADD_FOOD_LOG', payload: logWithNutrients })

      // Recent food usage is now handled by the /api/nutrition/log-entry route

      return logWithNutrients
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to add food log' })
      return null
    }
  }

  const updateFoodLog = async (id: string, updates: Partial<FoodLogInsert>) => {
    try {
      const { data, error } = await supabase
        .from('food_logs')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          food:foods(*)
        `)
        .single()

      if (error) throw error

      const logWithNutrients: FoodLogWithFood = {
        ...data,
        food: data.food,
        nutrients: calculateNutrients(data.food, data.quantity, data.unit)
      }

      dispatch({ type: 'UPDATE_FOOD_LOG', payload: logWithNutrients })
      return logWithNutrients
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to update food log' })
      return null
    }
  }

  const removeFoodLog = async (id: string) => {
    try {
      const { error } = await supabase
        .from('food_logs')
        .delete()
        .eq('id', id)

      if (error) throw error

      dispatch({ type: 'REMOVE_FOOD_LOG', payload: id })
      return true
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to remove food log' })
      return false
    }
  }

  const searchFoods = async (query: string): Promise<FoodSearchResult[]> => {
    try {
      const response = await fetch(`/api/nutrition/search?query=${encodeURIComponent(query)}`)
      if (!response.ok) {
        throw new Error('Failed to search USDA foods');
      }
      const usdaResults: FoodSearchResult[] = await response.json();
      return usdaResults;
    } catch (err) {
      console.error('Food search error:', err);
      return [];
    }
  }

  // const getFoodDetails = async (fdcId: number): Promise<Food | null> => {
  //   try {
  //     // This function would ideally call a new API route like /api/nutrition/food/[id]
  //     // that handles fetching from USDA and inserting into our DB if not found.
  //     // For now, it's commented out as it's not directly used by AddFoodDialog
  //     // and requires a new API route to be implemented.
  //     return null;
  //   } catch (err) {
  //     console.error('Food details error:', err);
  //     return null;
  //   }
  // }

  const value: NutritionContextType = {
    ...state,
    addFoodLog,
    updateFoodLog,
    removeFoodLog,
    searchFoods,
    refreshLogs
  }

  return (
    <NutritionContext.Provider value={value}>
      {children}
    </NutritionContext.Provider>
  )
}

export function useNutrition() {
  const context = useContext(NutritionContext)
  if (!context) {
    throw new Error('useNutrition must be used within NutritionDataProvider')
  }
  return context
}

// Re-export types for convenience
export type { FoodLog, RecentFood, Food, FoodLogWithFood } from '@/lib/nutrition/nutrition.types'