// src/lib/nutrition/nutrition.types.ts
import type { Database } from '@/lib/database.types'

// Database types
export type Food = Database['public']['Tables']['foods']['Row']
export type FoodInsert = Database['public']['Tables']['foods']['Insert']
export type FoodUpdate = Database['public']['Tables']['foods']['Update']

export type FoodLog = Database['public']['Tables']['food_logs']['Row']
export type FoodLogInsert = Database['public']['Tables']['food_logs']['Insert']
export type FoodLogUpdate = Database['public']['Tables']['food_logs']['Update']

export type RecentFood = Database['public']['Tables']['recent_foods']['Row']
export type RecentFoodInsert = Database['public']['Tables']['recent_foods']['Insert']

export type NutritionSettings = Database['public']['Tables']['nutrition_settings']['Row']
export type NutritionSettingsInsert = Database['public']['Tables']['nutrition_settings']['Insert']
export type NutritionSettingsUpdate = Database['public']['Tables']['nutrition_settings']['Update']

// Extended types with calculated fields
export interface FoodWithNutrients extends Food {
  nutrients: {
    calories: number
    protein: number
    fat: number
    carbs: number
    fiber: number
    sugar: number
    sodium: number
  }
}

export interface FoodLogWithFood extends FoodLog {
  food: Food
  nutrients: {
    calories: number
    protein: number
    fat: number
    carbs: number
    fiber: number
    sugar: number
    sodium: number
  }
}

// USDA API types
export interface USDAFood {
  fdcId: number
  description: string
  brandName?: string
  brandOwner?: string
  dataType: string
  foodNutrients?: Array<{
    nutrientId: number
    nutrientName: string
    nutrientNumber: string
    unitName: string
    value: number
  }>
}

export interface USDASearchResponse {
  foods: USDAFood[]
  totalHits: number
  currentPage: number
  totalPages: number
}

// Helper function to calculate nutrients based on quantity
export function calculateNutrients(
  food: Food,
  quantity: number,
  unit: string = 'g'
): FoodWithNutrients['nutrients'] {
  // Convert to grams if needed
  let quantityInGrams = quantity
  if (unit === 'oz') {
    quantityInGrams = quantity * 28.3495
  } else if (unit === 'ml') {
    // Assume 1ml = 1g for simplicity (can be adjusted based on food density)
    quantityInGrams = quantity
  }
  
  const factor = quantityInGrams / 100
  
  return {
    calories: (food.calories_per_100g || 0) * factor,
    protein: (food.protein_per_100g || 0) * factor,
    fat: (food.fat_per_100g || 0) * factor,
    carbs: (food.carbs_per_100g || 0) * factor,
    fiber: (food.fiber_per_100g || 0) * factor,
    sugar: (food.sugar_per_100g || 0) * factor,
    sodium: (food.sodium_per_100g || 0) * factor
  }
}