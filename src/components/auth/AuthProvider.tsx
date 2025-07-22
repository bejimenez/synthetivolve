// src/components/auth/AuthProvider.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { createSupabaseClient } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const supabase = createSupabaseClient()

  useEffect(() => {
    setMounted(true)
  }, [])

useEffect(() => {
  if (!mounted) return

  // Get initial session
  const getInitialSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
    } catch (error) {
      console.error('Error getting session:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  getInitialSession()

  // Listen for auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      const newUser = session?.user ?? null
      setUser(newUser)
      setLoading(false)

      // Handle navigation after auth state changes
      if (event === 'SIGNED_IN' && newUser) {
        // Preserve current URL parameters when redirecting after sign in
        const currentUrl = new URL(window.location.href)
        const searchParams = currentUrl.searchParams.toString()
        const redirectUrl = searchParams ? `/?${searchParams}` : '/'
        
        setTimeout(() => {
          router.push(redirectUrl)
          router.refresh()
        }, 100)
      } else if (event === 'SIGNED_OUT') {
        setTimeout(() => {
          router.push('/auth')
          router.refresh()
        }, 100)
      }
    }
  )

  return () => subscription.unsubscribe()
}, [mounted, supabase.auth, router])

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return null
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}