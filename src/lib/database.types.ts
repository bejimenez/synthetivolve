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
    }
  }
}