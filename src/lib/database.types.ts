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
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          primary_muscle_group: string
          secondary_muscle_groups: string[]
          equipment?: string | null
          notes?: string | null
          use_rir_rpe?: boolean
          created_at?: string
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
          plan_data: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          weeks: number
          days_per_week: number
          specialization: string[]
          goal_statement?: string | null
          plan_data: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          weeks?: number
          days_per_week?: number
          specialization?: string[]
          goal_statement?: string | null
          plan_data?: Json
        }
      }
      workout_logs: {
        Row: {
          id: string
          user_id: string
          mesocycle_id: string | null
          week: number | null
          day: number | null
          log_data: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          mesocycle_id?: string | null
          week?: number | null
          day?: number | null
          log_data: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          mesocycle_id?: string | null
          week?: number | null
          day?: number | null
          log_data?: Json
        }
      }
    }
  }
}

// Define a generic Json type
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]
