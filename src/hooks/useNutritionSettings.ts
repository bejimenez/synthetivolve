// src/hooks/useNutritionSettings.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import { useAuth } from '@/components/auth/AuthProvider'
import { detectBrowserTimezone } from '@/lib/nutrition/timezone-utils'

interface NutritionSettings {
  id?: string
  user_id: string
  logging_start_hour: number
  logging_end_hour: number
  timezone: string
  created_at?: string
  updated_at?: string
}

interface UseNutritionSettingsReturn {
  settings: NutritionSettings | null
  loading: boolean
  error: string | null
  updateSettings: (updates: Partial<Omit<NutritionSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => Promise<boolean>
  refreshSettings: () => Promise<void>
}

export function useNutritionSettings(): UseNutritionSettingsReturn {
  const [settings, setSettings] = useState<NutritionSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const supabase = createSupabaseClient()

  const refreshSettings = useCallback(async () => {
    if (!user) {
      setSettings(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('nutrition_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      if (!data) {
        // Create default settings if none exist
        const defaultSettings: Omit<NutritionSettings, 'id' | 'created_at' | 'updated_at'> = {
          user_id: user.id,
          logging_start_hour: 6,
          logging_end_hour: 22,
          timezone: detectBrowserTimezone(),
        }

        const { data: newSettings, error: createError } = await supabase
          .from('nutrition_settings')
          .insert(defaultSettings)
          .select()
          .single()

        if (createError) throw createError
        setSettings(newSettings)
      } else {
        setSettings(data)
      }
    } catch (err) {
      console.error('Error loading nutrition settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  const updateSettings = useCallback(async (
    updates: Partial<Omit<NutritionSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<boolean> => {
    if (!user || !settings) return false

    try {
      setError(null)

      const { data, error: updateError } = await supabase
        .from('nutrition_settings')
        .update(updates)
        .eq('id', settings.id)
        .select()
        .single()

      if (updateError) throw updateError

      setSettings(data)
      return true
    } catch (err) {
      console.error('Error updating nutrition settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to update settings')
      return false
    }
  }, [user, settings, supabase])

  useEffect(() => {
    refreshSettings()
  }, [refreshSettings])

  return {
    settings,
    loading,
    error,
    updateSettings,
    refreshSettings,
  }
}