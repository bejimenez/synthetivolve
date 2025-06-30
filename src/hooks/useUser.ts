// src/hooks/useUser.ts (OPTIONAL - if you want to create this hook)
'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Session, AuthChangeEvent } from '@supabase/auth-js'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createSupabaseClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          setError(error.message)
          console.error('Error getting user:', error)
          return
        }

        setUser(user)
      } catch (err) {
        console.error('Error in getUser:', err)
        setError(err instanceof Error ? err.message : 'Failed to get user')
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null)
        setLoading(false)
        setError(null)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user
  }
}