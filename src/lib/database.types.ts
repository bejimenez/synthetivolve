// src/lib/database.types.ts
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          height_inches: number | null
          biological_sex: 'male' | 'female' | null
          birth_date: string | null
          activity_level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          height_inches?: number | null
          biological_sex?: 'male' | 'female' | null
          birth_date?: string | null
          activity_level?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          height_inches?: number | null
          biological_sex?: 'male' | 'female' | null
          birth_date?: string | null
          activity_level?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active' | null
          updated_at?: string
        }
      }
      weight_entries: {
        Row: {
          id: string
          user_id: string
          weight_lbs: number
          entry_date: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          weight_lbs: number
          entry_date: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          weight_lbs?: number
          entry_date?: string
          notes?: string | null
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          goal_type: 'fat_loss' | 'maintenance' | 'muscle_gain'
          start_weight: number
          start_date: string
          duration_weeks: number
          end_date: string
          target_rate_lbs: number | null
          target_rate_percent: number | null
          rate_type: 'absolute' | 'percentage' | null
          surplus_calories: number | null
          is_active: boolean
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal_type: 'fat_loss' | 'maintenance' | 'muscle_gain'
          start_weight: number
          start_date?: string
          duration_weeks: number
          target_rate_lbs?: number | null
          target_rate_percent?: number | null
          rate_type?: 'absolute' | 'percentage' | null
          surplus_calories?: number | null
          is_active?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal_type?: 'fat_loss' | 'maintenance' | 'muscle_gain'
          start_weight?: number
          start_date?: string
          duration_weeks?: number
          target_rate_lbs?: number | null
          target_rate_percent?: number | null
          rate_type?: 'absolute' | 'percentage' | null
          surplus_calories?: number | null
          is_active?: boolean
          completed_at?: string | null
          updated_at?: string
        }
      }
      daily_targets: {
        Row: {
          id: string
          user_id: string
          goal_id: string
          target_date: string
          recommended_calories: number
          recommended_protein: number
          recommended_fat: number
          recommended_carbs: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal_id: string
          target_date: string
          recommended_calories: number
          recommended_protein: number
          recommended_fat: number
          recommended_carbs: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal_id?: string
          target_date?: string
          recommended_calories?: number
          recommended_protein?: number
          recommended_fat?: number
          recommended_carbs?: number
        }
      }
      exercises: {
        Row: {
          id: string
          user_id: string
          name: string
          primary_muscle_group: string
          secondary_muscle_groups: string[]
          equipment: string | null
          notes: string | null
          use_rir_rpe: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          primary_muscle_group: string
          secondary_muscle_groups?: string[]
          equipment?: string | null
          notes?: string | null
          use_rir_rpe?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          primary_muscle_group?: string
          secondary_muscle_groups?: string[]
          equipment?: string | null
          notes?: string | null
          use_rir_rpe?: boolean
          updated_at?: string
          deleted_at?: string | null
        }
      }
      mesocycles: {
        Row: {
          id: string
          user_id: string
          name: string
          weeks: number
          days_per_week: number
          specialization: string[]
          goal_statement: string | null
          is_template: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          weeks: number
          days_per_week: number
          specialization?: string[]
          goal_statement?: string | null
          is_template?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          weeks?: number
          days_per_week?: number
          specialization?: string[]
          goal_statement?: string | null
          is_template?: boolean
          updated_at?: string
          deleted_at?: string | null
        }
      }
      mesocycle_days: {
        Row: {
          id: string
          mesocycle_id: string
          day_number: number
          created_at: string
        }
        Insert: {
          id?: string
          mesocycle_id: string
          day_number: number
          created_at?: string
        }
        Update: {
          id?: string
          mesocycle_id?: string
          day_number?: number
        }
      }
      day_exercises: {
        Row: {
          id: string
          day_id: string
          exercise_id: string
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          day_id: string
          exercise_id: string
          order_index: number
          created_at?: string
        }
        Update: {
          id?: string
          day_id?: string
          exercise_id?: string
          order_index?: number
        }
      }
      workout_logs: {
        Row: {
          id: string
          user_id: string
          mesocycle_id: string | null
          week_number: number | null
          day_number: number | null
          workout_date: string
          custom_goal_entry: string | null
          started_at: string
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          mesocycle_id?: string | null
          week_number?: number | null
          day_number?: number | null
          workout_date?: string
          custom_goal_entry?: string | null
          started_at?: string
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          mesocycle_id?: string | null
          week_number?: number | null
          day_number?: number | null
          workout_date?: string
          custom_goal_entry?: string | null
          started_at?: string
          completed_at?: string | null
        }
      }
      exercise_logs: {
        Row: {
          id: string
          workout_log_id: string
          exercise_id: string
          order_index: number
          replaced_original: boolean
          was_accessory: boolean
          created_at: string
        }
        Insert: {
          id?: string
          workout_log_id: string
          exercise_id: string
          order_index: number
          replaced_original?: boolean
          was_accessory?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          workout_log_id?: string
          exercise_id?: string
          order_index?: number
          replaced_original?: boolean
          was_accessory?: boolean
        }
      }
      set_logs: {
        Row: {
          id: string
          exercise_log_id: string
          set_number: number
          weight: number
          reps: number
          rir: number | null
          rpe: number | null
          created_at: string
        }
        Insert: {
          id?: string
          exercise_log_id: string
          set_number: number
          weight: number
          reps: number
          rir?: number | null
          rpe?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          exercise_log_id?: string
          set_number?: number
          weight?: number
          reps?: number
          rir?: number | null
          rpe?: number | null
        }
      }
      foods: {
        Row: {
          id: string
          fdc_id: number | null
          description: string
          brand_name: string | null
          serving_size: number | null
          serving_unit: string | null
          calories_per_100g: number | null
          protein_per_100g: number | null
          fat_per_100g: number | null
          carbs_per_100g: number | null
          fiber_per_100g: number | null
          sugar_per_100g: number | null
          sodium_per_100g: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          fdc_id?: number | null
          description: string
          brand_name?: string | null
          serving_size?: number | null
          serving_unit?: string | null
          calories_per_100g?: number | null
          protein_per_100g?: number | null
          fat_per_100g?: number | null
          carbs_per_100g?: number | null
          fiber_per_100g?: number | null
          sugar_per_100g?: number | null
          sodium_per_100g?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          fdc_id?: number | null
          description?: string
          brand_name?: string | null
          serving_size?: number | null
          serving_unit?: string | null
          calories_per_100g?: number | null
          protein_per_100g?: number | null
          fat_per_100g?: number | null
          carbs_per_100g?: number | null
          fiber_per_100g?: number | null
          sugar_per_100g?: number | null
          sodium_per_100g?: number | null
          updated_at?: string
        }
      }
      food_logs: {
        Row: {
          id: string
          user_id: string
          food_id: string
          quantity: number
          unit: string
          logged_at: string
          logged_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          food_id: string
          quantity: number
          unit: string
          logged_at: string
          logged_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          food_id?: string
          quantity?: number
          unit?: string
          logged_at?: string
          logged_date?: string
          updated_at?: string
        }
      }
      nutrition_settings: {
        Row: {
          id: string
          user_id: string
          logging_start_hour: number
          logging_end_hour: number
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          logging_start_hour?: number
          logging_end_hour?: number
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          logging_start_hour?: number
          logging_end_hour?: number
          timezone?: string
          updated_at?: string
        }
      }
      recent_foods: {
        Row: {
          id: string
          user_id: string
          food_id: string
          last_used: string
          use_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          food_id: string
          last_used?: string
          use_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          food_id?: string
          last_used?: string
          use_count?: number
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_recent_food_use_count: {
        Args: { p_user_id: string; p_food_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Export type helpers
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Define a generic Json type
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]