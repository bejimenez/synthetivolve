// src/app/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { Loader2 } from 'lucide-react'

export default function HomePage() {
  const { user, loading } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [redirected, setRedirected] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || loading || redirected) return

    // Let AuthProvider handle navigation automatically
    // This component just shows loading state
    setRedirected(true)
  }, [user, loading, mounted, redirected])

  // Show loading state until auth resolves and navigation occurs
  if (!mounted || loading || !redirected) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Synthetivolve</h1>
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-gray-600 mt-4">Loading your health dashboard...</p>
        </div>
      </div>
    )
  }

  return null
}