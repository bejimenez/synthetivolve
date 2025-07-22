// src/hooks/useTabPersistence.ts
'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

export function useTabPersistence(defaultTab: string = 'daily-metrics') {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [persistedTab, setPersistedTab] = useState(defaultTab)
  const isInitialized = useRef(false)

  // Initialize from URL on mount
  useEffect(() => {
    if (!isInitialized.current) {
      const urlTab = searchParams.get('tab')
      if (urlTab && ['daily-metrics', 'fitness', 'nutrition', 'biometrics'].includes(urlTab)) {
        setPersistedTab(urlTab)
      }
      isInitialized.current = true
    }
  }, [searchParams])

  // Sync URL when tab changes
  const setTab = (tab: string) => {
    setPersistedTab(tab)
    
    // Create new URL with updated tab parameter
    const current = new URLSearchParams(Array.from(searchParams.entries()))
    current.set('tab', tab)
    
    // Use replace to avoid adding to history stack
    router.replace(`${pathname}?${current.toString()}`, { scroll: false })
  }

  return {
    currentTab: persistedTab,
    setTab
  }
}