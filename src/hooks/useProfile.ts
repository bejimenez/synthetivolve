// src/hooks/useProfile.ts
import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createSupabaseClient()

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        throw new Error('Authentication required')
      }

      if (!user) {
        throw new Error('No authenticated user found')
      }

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        throw profileError
      }

      // If no profile exists, create a basic one
      if (!data) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (createError) {
          throw createError
        }

        setProfile(newProfile)
      } else {
        setProfile(data)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Omit<ProfileUpdate, 'id' | 'updated_at'>) => {
    try {
      setError(null)

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        throw new Error('Authentication required')
      }

      if (!user) {
        throw new Error('No authenticated user found')
      }

      const updateData: ProfileUpdate = {
        ...updates,
        updated_at: new Date().toISOString(),
      }

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      setProfile(data)
      return data
    } catch (err) {
      console.error('Error updating profile:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const isProfileComplete = () => {
    if (!profile) return false
    
    return !!(
      profile.height_inches &&
      profile.biological_sex &&
      profile.birth_date &&
      profile.activity_level
    )
  }

  const getAge = () => {
    if (!profile?.birth_date) return null
    
    const birthDate = new Date(profile.birth_date)
    const today = new Date()
    const age = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    
    return age
  }

  // Load profile on mount
  useEffect(() => {
    fetchProfile()
  }, [])

  return {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile: fetchProfile,
    isProfileComplete: isProfileComplete(),
    age: getAge(),
  }
}