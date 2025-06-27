// src/lib/supabase.ts
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// For client-side operations
export const createSupabaseClient = () => {
  return createClientComponentClient<Database>()
}

// For server-side operations
export const createSupabaseServerClient = () => {
  return createServerComponentClient<Database>({ cookies })
}

// Export the Database type for use in other files
export type { Database }

// Type definitions for our database
export type Database = {
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