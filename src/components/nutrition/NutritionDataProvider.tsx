// src/components/nutrition/NutritionDataProvider.tsx
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

// Updated interface to handle manual foods
interface FoodLogData {
  fdcId: number | null  // Changed from number to number | null to support manual foods
  quantity: number
  unit: string
  logged_at: string
  logged_date: string
  foodDetails: FoodDetails | FoodSearchResult  // Support both types
}

interface NutritionContextType extends NutritionState {
  addFoodLog: (log: FoodLogData) => Promise<FoodLogWithFood | null>
  updateFoodLog: (id: string, updates: Partial<FoodLogInsert>) => Promise<FoodLogWithFood | null>
  removeFoodLog: (id: string) => Promise<boolean>
  searchFoods: (query: string) => Promise<FoodSearchResult[]>
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

    const channel = supabase
      .channel('food_logs_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'food_logs', filter: `user_id=eq.${user?.id}` },
        async (payload) => {
          if (!user) return;

          // Helper to fetch food details for a log
          const fetchFoodDetails = async (log: FoodLog): Promise<FoodLogWithFood | null> => {
            const { data: foodData, error: foodError } = await supabase
              .from('foods')
              .select('*')
              .eq('id', log.food_id)
              .single();

            if (foodError) {
              console.error('Error fetching food details for real-time update:', foodError);
              return null;
            }

            return {
              ...log,
              food: foodData,
              nutrients: calculateNutrients(foodData, log.quantity, log.unit),
            };
          };

          if (payload.eventType === 'INSERT') {
            const newLog = payload.new as FoodLog;
            const logWithFood = await fetchFoodDetails(newLog);
            if (logWithFood) {
              dispatch({ type: 'ADD_FOOD_LOG', payload: logWithFood });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedLog = payload.new as FoodLog;
            const logWithFood = await fetchFoodDetails(updatedLog);
            if (logWithFood) {
              dispatch({ type: 'UPDATE_FOOD_LOG', payload: logWithFood });
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedLogId = payload.old.id as string;
            dispatch({ type: 'REMOVE_FOOD_LOG', payload: deletedLogId });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshLogs, user, supabase]);

  // Updated addFoodLog function to handle both USDA and manual foods
  const addFoodLog = async (log: FoodLogData) => {
    if (!user) return null;

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticLog: FoodLogWithFood = {
      id: tempId,
      user_id: user.id,
      food_id: '', // Will be replaced by actual food_id from backend
      quantity: log.quantity,
      unit: log.unit,
      logged_at: log.logged_at,
      logged_date: log.logged_date,
      food: {
        id: '', // Will be replaced
        description: (log.foodDetails as FoodDetails).description || (log.foodDetails as FoodSearchResult).description,
        created_at: new Date().toISOString(),
        fdc_id: log.fdcId,
        brand_name: (log.foodDetails as FoodDetails).brandName || null,
        serving_size: (log.foodDetails as FoodDetails).servingSize || null,
        serving_unit: (log.foodDetails as FoodDetails).servingUnit || null,
        calories_per_100g: null,
        protein_per_100g: null,
        fat_per_100g: null,
        carbs_per_100g: null,
        fiber_per_100g: null,
        sugar_per_100g: null,
        sodium_per_100g: null,
        updated_at: null,
      },
      nutrients: calculateNutrients(
        {
          id: '', // Will be replaced
          description: (log.foodDetails as FoodDetails).description || (log.foodDetails as FoodSearchResult).description,
          created_at: new Date().toISOString(),
          fdc_id: log.fdcId,
          brand_name: (log.foodDetails as FoodDetails).brandName || null,
          serving_size: (log.foodDetails as FoodDetails).servingSize || null,
          serving_unit: (log.foodDetails as FoodDetails).servingUnit || null,
          calories_per_100g: null,
          protein_per_100g: null,
          fat_per_100g: null,
          carbs_per_100g: null,
          fiber_per_100g: null,
          sugar_per_100g: null,
          sodium_per_100g: null,
          updated_at: null,
        },
        log.quantity,
        log.unit
      ),
      created_at: new Date().toISOString(),
      updated_at: null,
    };
    dispatch({ type: 'ADD_FOOD_LOG', payload: optimisticLog });

    try {
      const response = await fetch('/api/nutrition/log-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(log),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add food log');
      }

      const newLog = await response.json();

      // Fetch the full food details to construct the response
      const { data: foodData, error: foodError } = await supabase
        .from('foods')
        .select('*')
        .eq('id', newLog.food_id)
        .single();

      if (foodError) throw foodError;

      const logWithNutrients: FoodLogWithFood = {
        ...newLog,
        food: foodData,
        nutrients: calculateNutrients(foodData, newLog.quantity, newLog.unit),
      };

      // Replace optimistic log with actual log
      dispatch({ type: 'REMOVE_FOOD_LOG', payload: tempId }); // Remove optimistic
      dispatch({ type: 'ADD_FOOD_LOG', payload: logWithNutrients }); // Add actual
      return logWithNutrients;
    } catch (err) {
      dispatch({ type: 'REMOVE_FOOD_LOG', payload: tempId }); // Revert optimistic update on error
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : 'Failed to add food log',
      });
      return null;
    }
  }

  const updateFoodLog = async (id: string, updates: Partial<FoodLogInsert>) => {
    // Optimistic update
    const originalLog = state.foodLogs.find(log => log.id === id);
    if (!originalLog) return null;

    const updatedOptimisticLog: FoodLogWithFood = {
      ...originalLog,
      ...updates,
      nutrients: calculateNutrients(originalLog.food, updates.quantity || originalLog.quantity, updates.unit || originalLog.unit),
    };
    dispatch({ type: 'UPDATE_FOOD_LOG', payload: updatedOptimisticLog });

    try {
      const { data, error } = await supabase
        .from('food_logs')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          food:foods(*)
        `)
        .single();

      if (error) throw error;

      const logWithNutrients: FoodLogWithFood = {
        ...data,
        food: data.food,
        nutrients: calculateNutrients(data.food, data.quantity, data.unit),
      };

      dispatch({ type: 'UPDATE_FOOD_LOG', payload: logWithNutrients }); // Confirm with actual data
      return logWithNutrients;
    } catch (err) {
      dispatch({ type: 'UPDATE_FOOD_LOG', payload: originalLog }); // Revert optimistic update on error
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : 'Failed to update food log',
      });
      return null;
    }
  }

  const removeFoodLog = async (id: string) => {
    // Optimistic update
    const originalFoodLogs = state.foodLogs;
    dispatch({ type: 'REMOVE_FOOD_LOG', payload: id });

    try {
      const { error } = await supabase
        .from('food_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (err) {
      dispatch({ type: 'SET_FOOD_LOGS', payload: originalFoodLogs }); // Revert optimistic update on error
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : 'Failed to remove food log',
      });
      return false;
    }
  }

  const searchFoods = async (query: string): Promise<FoodSearchResult[]> => {
    try {
      const response = await fetch(`/api/nutrition/search?query=${encodeURIComponent(query)}`)
      if (!response.ok) {
        throw new Error('Failed to search USDA foods')
      }
      const usdaResults: FoodSearchResult[] = await response.json()
      return usdaResults
    } catch (err) {
      console.error('Food search error:', err)
      return []
    }
  }

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