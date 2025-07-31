// src/hooks/useFitness.ts
import { useAppData } from '@/components/data/AppDataProvider'
import { Exercise, MesocyclePlan, WorkoutLog } from '@/lib/fitness.types'

interface UseFitnessReturn {
  exercises: Exercise[]
  mesocycles: MesocyclePlan[]
  workoutLogs: WorkoutLog[]
  activeMesocycle: MesocyclePlan | null
  loading: boolean
  error: string | null
  createExercise: (exercise: Omit<Exercise, 'id'>) => Promise<Exercise | null>
  updateExercise: (id: string, updates: Partial<Omit<Exercise, 'id'>>) => Promise<Exercise | null>
  deleteExercise: (id: string) => Promise<boolean>
  refreshAll: () => Promise<void>
}

export function useFitness(): UseFitnessReturn {
  const {
    exercises,
    mesocycles,
    workoutLogs,
    activeMesocycle,
    fitnessLoading,
    fitnessError,
    createExercise,
    updateExercise,
    deleteExercise,
    refreshFitness,
  } = useAppData()

  return {
    exercises,
    mesocycles,
    workoutLogs,
    activeMesocycle,
    loading: fitnessLoading,
    error: fitnessError,
    createExercise,
    updateExercise,
    deleteExercise,
    refreshAll: refreshFitness,
  }
}

// Re-export types for backward compatibility
export type { Exercise, MesocyclePlan, WorkoutLog }
