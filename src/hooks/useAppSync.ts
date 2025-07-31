// src/hooks/useAppSync.ts - New hook for global data synchronization
import { useAppData } from '@/components/data/AppDataProvider'
import type { DataModule } from '@/components/data/AppDataProvider'

interface UseAppSyncReturn {
  // Global state
  syncInProgress: boolean
  lastSyncTime: number | null
  globalLoading: boolean
  
  // Sync methods
  syncAll: (force?: boolean) => Promise<void>
  syncModules: (modules: DataModule[], force?: boolean) => Promise<void>
  
  // Cache management
  clearCache: (modules?: DataModule[]) => void
  invalidateCache: (modules: DataModule[]) => void
  
  // Utility methods
  isDataStale: (module: DataModule) => boolean
  getLastFetchTime: (module: DataModule) => number | null
  
  // Individual module sync methods
  syncWeight: (force?: boolean) => Promise<void>
  syncGoals: (force?: boolean) => Promise<void>
  syncFitness: (force?: boolean) => Promise<void>
}

export function useAppSync(): UseAppSyncReturn {
  const {
    syncInProgress,
    lastSyncTime,
    globalLoading,
    refreshAllData,
    refreshWeightEntries,
    refreshGoals,
    refreshFitness,
    clearCache,
    invalidateCache,
    isDataStale,
    getLastFetchTime,
  } = useAppData()

  const syncModules = async (modules: DataModule[], force = false) => {
    const promises = modules.map(module => {
      switch (module) {
        case 'weight':
          return refreshWeightEntries(force)
        case 'goals':
          return refreshGoals(force)
        case 'fitness':
          return refreshFitness(force)
        default:
          return Promise.resolve()
      }
    })
    
    await Promise.all(promises)
  }

  return {
    // Global state
    syncInProgress,
    lastSyncTime,
    globalLoading,
    
    // Sync methods
    syncAll: refreshAllData,
    syncModules,
    
    // Cache management
    clearCache,
    invalidateCache,
    
    // Utility methods
    isDataStale,
    getLastFetchTime,
    
    // Individual sync methods
    syncWeight: refreshWeightEntries,
    syncGoals: refreshGoals,
    syncFitness: refreshFitness,
  }
}