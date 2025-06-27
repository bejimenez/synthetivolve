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
    }
  }
}