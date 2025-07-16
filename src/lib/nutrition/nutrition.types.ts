// src/lib/nutrition/nutrition.types.ts
import type { Database } from '@/lib/database.types'

export type Food = Database['public']['Tables']['foods']['Row']
export type FoodLog = Database['public']['Tables']['food_logs']['Row'] & { foods: Food }
export type RecentFood = Database['public']['Tables']['recent_foods']['Row'] & { foods: Food }
export type FoodLogInsert = Omit<Database['public']['Tables']['food_logs']['Insert'], 'user_id' | 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
