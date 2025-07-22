// src/hooks/useFormDraft.ts - Enhanced version
'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface FormDraftOptions<T> {
  key: string
  defaultValues?: T
  autoSaveDelay?: number
  persistToUrl?: boolean // New option for URL persistence
  urlStateKey?: string   // Key for URL state parameter
}

export function useFormDraft<T extends object>({
  key,
  defaultValues,
  autoSaveDelay = 1000,
  persistToUrl = false,
  urlStateKey
}: FormDraftOptions<T>) {
  const [draft, setDraft] = useState<T | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Load draft from memory AND URL on mount
  useEffect(() => {
    const memoryKey = `form_draft_${key}`
    let savedDraft = (globalThis as unknown as { [key: string]: T })[memoryKey]
    
    // If URL persistence is enabled, also check URL state
    if (persistToUrl && urlStateKey) {
      const urlState = searchParams.get(urlStateKey)
      if (urlState) {
        try {
          const parsedUrlState = JSON.parse(decodeURIComponent(urlState))
          savedDraft = parsedUrlState // URL state takes precedence
        } catch (error) {
          console.warn('Failed to parse URL state:', error)
        }
      }
    }
    
    setDraft(prevDraft => {
      const newDraft = savedDraft || defaultValues || null;
      if (JSON.stringify(prevDraft) !== JSON.stringify(newDraft)) {
        return newDraft;
      }
      return prevDraft;
    });
    
    setIsLoaded(true)
  }, [key, defaultValues, persistToUrl, urlStateKey, searchParams.toString()])

  // Auto-save draft with debouncing (memory + URL)
  const saveDraft = useCallback((values: T) => {
    setDraft(values)
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      // Save to memory
      const memoryKey = `form_draft_${key}`
      ;(globalThis as unknown as { [key: string]: T })[memoryKey] = values
      
      // Save to URL if enabled
      if (persistToUrl && urlStateKey) {
        const current = new URLSearchParams(Array.from(searchParams.entries()))
        const encodedState = encodeURIComponent(JSON.stringify(values))
        current.set(urlStateKey, encodedState)
        
        // Update URL without causing navigation
        router.replace(`${pathname}?${current.toString()}`, { scroll: false })
      }
    }, autoSaveDelay)
  }, [key, autoSaveDelay, persistToUrl, urlStateKey, router, pathname, searchParams])

  // Clear draft (memory + URL)
  const clearDraft = useCallback(() => {
    setDraft(null)
    
    // Clear memory
    const memoryKey = `form_draft_${key}`
    delete (globalThis as unknown as { [key: string]: T })[memoryKey]
    
    // Clear URL state if enabled
    if (persistToUrl && urlStateKey) {
      const current = new URLSearchParams(Array.from(searchParams.entries()))
      current.delete(urlStateKey)
      router.replace(`${pathname}?${current.toString()}`, { scroll: false })
    }
  }, [key, persistToUrl, urlStateKey, router, pathname, searchParams])

  // Check if draft has unsaved changes
  const hasDraftValue = useMemo(() => {
    return draft !== null && Object.keys(draft).length > 0
  }, [draft])

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    draft,
    isLoaded,
    saveDraft,
    clearDraft,
    hasDraft: hasDraftValue
  }
}