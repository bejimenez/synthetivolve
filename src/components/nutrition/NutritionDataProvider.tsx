'use client'

import { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import { useAuth } from '@/components/auth/AuthProvider'
import type { FoodLog, RecentFood, Food, FoodLogInsert, FoodLogWithFood } from '@/lib/nutrition/nutrition.types'
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

interface NutritionContextType extends NutritionState {
  addFoodLog: (log: Omit<FoodLogInsert, 'user_id'>) => Promise<FoodLogWithFood | null>
  updateFoodLog: (id: string, updates: Partial<FoodLogInsert>) => Promise<FoodLogWithFood | null>
  removeFoodLog: (id: string) => Promise<boolean>
  searchFoods: (query: string) => Promise<Food[]>
  getFoodDetails: (fdcId: number) => Promise<Food | null>
  refreshLogs: () => Promise<void>
}

const NutritionContext = createContext<NutritionContextType | undefined>(undefined)

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
      const logsWithNutrients: FoodLogWithFood[] = (logs || []).map(log => ({
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

      dispatch({ type: 'SET_RECENT_FOODS', payload: recent || [] })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to load nutrition data' })
    }
  }, [user, supabase])

  useEffect(() => {
    refreshLogs()
  }, [refreshLogs])

  const addFoodLog = async (log: Omit<FoodLogInsert, 'user_id'>) => {
    if (!user) return null

    try {
      const { data, error } = await supabase
        .from('food_logs')
        .insert({
          ...log,
          user_id: user.id
        })
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

      dispatch({ type: 'ADD_FOOD_LOG', payload: logWithNutrients })

      // Update recent foods
      await supabase.rpc('increment_recent_food_use_count', {
        p_user_id: user.id,
        p_food_id: log.food_id
      })

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

  const searchFoods = async (query: string): Promise<Food[]> => {
    try {
      // First, try to find foods in our local database by description
      const { data: localFoodsByDescription, error: localError } = await supabase
        .from('foods')
        .select('*')
        .ilike('description', `%${query}%`)
        .limit(10)

      if (localError) throw localError

      // If we have enough local results, return them
      if (localFoodsByDescription && localFoodsByDescription.length >= 5) {
        return localFoodsByDescription
      }

      // Otherwise, search USDA API
      const response = await fetch(`/api/nutrition/search?query=${encodeURIComponent(query)}`)
      if (!response.ok) {
        throw new Error('Failed to search USDA foods');
      }
      const usdaResults: FoodSearchResult[] = await response.json();

      const processedFoods: Food[] = [];
      for (const usdaFood of usdaResults) {
        // Check if this USDA food (by fdcId) already exists in our database
        const { data: existingFood, error: existingFoodError } = await supabase
          .from('foods')
          .select('*')
          .eq('fdc_id', usdaFood.fdcId)
          .maybeSingle();

        if (existingFoodError && existingFoodError.code !== 'PGRST116') { // PGRST116 means no rows found
          console.error('Error checking for existing food by fdcId:', existingFoodError);
          continue; // Skip this food if there's a database error
        }

        if (existingFood) {
          processedFoods.push(existingFood);
        } else {
          // If not existing, insert it into our database
          const { data: newFood, error: insertError } = await supabase
            .from('foods')
            .insert({
              fdc_id: usdaFood.fdcId,
              description: usdaFood.description,
              brand_name: usdaFood.brandName || null,
              calories_per_100g: usdaFood.foodNutrients?.find(n => n.nutrientId === 1008)?.value || null,
              protein_per_100g: usdaFood.foodNutrients?.find(n => n.nutrientId === 1003)?.value || null,
              fat_per_100g: usdaFood.foodNutrients?.find(n => n.nutrientId === 1004)?.value || null,
              carbs_per_100g: usdaFood.foodNutrients?.find(n => n.nutrientId === 1005)?.value || null,
              // Add other nutrients if needed
            })
            .select('*')
            .single();

          if (insertError) {
            console.error('Error inserting new food from USDA:', insertError);
            continue; // Skip this food if insertion fails
          }
          processedFoods.push(newFood);
        }
      }
      
      // Combine local results (if any) with processed USDA results, ensuring no duplicates by ID
      const combinedResultsMap = new Map<string, Food>();
      (localFoodsByDescription || []).forEach(food => combinedResultsMap.set(food.id, food));
      processedFoods.forEach(food => combinedResultsMap.set(food.id, food));

      return Array.from(combinedResultsMap.values());

    } catch (err) {
      console.error('Food search error:', err);
      return [];
    }
  }

  const getFoodDetails = async (fdcId: number): Promise<Food | null> => {
    try {
      // Check if we already have it cached in our local database
      const { data: existing, error: existingError } = await supabase
        .from('foods')
        .select('*')
        .eq('fdc_id', fdcId)
        .maybeSingle()

      if (existingError && existingError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Error checking for existing food by fdcId:', existingError);
        return null;
      }

      if (existing) return existing;

      // If not found in local DB, fetch from USDA API
      const response = await fetch(`/api/nutrition/food/${fdcId}`);
      if (!response.ok) {
        if (response.status === 404) return null; // Food not found in USDA
        throw new Error(`Failed to fetch food details from USDA: ${response.statusText}`);
      }

      const usdaFoodDetails: FoodDetails = await response.json();
      
      // Insert the USDA food into our database
      const { data: newFood, error: insertError } = await supabase
        .from('foods')
        .insert({
          fdc_id: usdaFoodDetails.fdcId,
          description: usdaFoodDetails.description,
          brand_name: usdaFoodDetails.brandName || null,
          calories_per_100g: usdaFoodDetails.foodNutrients?.find(n => n.nutrientId === 1008)?.value || null,
          protein_per_100g: usdaFoodDetails.foodNutrients?.find(n => n.nutrientId === 1003)?.value || null,
          fat_per_100g: usdaFoodDetails.foodNutrients?.find(n => n.nutrientId === 1004)?.value || null,
          carbs_per_100g: usdaFoodDetails.foodNutrients?.find(n => n.nutrientId === 1005)?.value || null,
          // Add other nutrients if needed
        })
        .select('*')
        .single();

      if (insertError) {
        console.error('Error inserting new food from USDA details:', insertError);
        return null;
      }

      return newFood;

    } catch (err) {
      console.error('Food details error:', err);
      return null;
    }
  }

  const value: NutritionContextType = {
    ...state,
    addFoodLog,
    updateFoodLog,
    removeFoodLog,
    searchFoods,
    getFoodDetails,
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