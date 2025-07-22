// src/hooks/useFormDraft.ts
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface FormDraftOptions<T> {
  key: string
  defaultValues?: T
  autoSaveDelay?: number
}

export function useFormDraft<T extends object>({
  key,
  defaultValues,
  autoSaveDelay = 1000
}: FormDraftOptions<T>) {
  const [draft, setDraft] = useState<T | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load draft from memory on mount
  useEffect(() => {
    // In Claude.ai artifacts, we use memory instead of localStorage
    // This provides session-based persistence
    const memoryKey = `form_draft_${key}`
    const savedDraft = (globalThis as unknown as { [key: string]: T })[memoryKey]
    
    if (savedDraft) {
      setDraft(savedDraft)
    } else if (defaultValues) {
      setDraft(defaultValues)
    }
    
    setIsLoaded(true)
  }, [key, defaultValues])

  // Auto-save draft with debouncing
  const saveDraft = useCallback((values: T) => {
    setDraft(values)
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      const memoryKey = `form_draft_${key}`
      ;(globalThis as unknown as { [key: string]: T })[memoryKey] = values
    }, autoSaveDelay)
  }, [key, autoSaveDelay])

  // Clear draft
  const clearDraft = useCallback(() => {
    setDraft(null)
    const memoryKey = `form_draft_${key}`
    delete (globalThis as unknown as { [key: string]: T })[memoryKey]
  }, [key])

  // Check if draft has unsaved changes
  const hasDraft = useCallback(() => {
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
    hasDraft: hasDraft()
  }
}