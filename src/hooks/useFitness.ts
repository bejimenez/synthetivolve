import { useAppData } from '@/components/data/AppDataProvider'
import type { 
  Exercise, 
  Mesocycle, 
  WorkoutSession, 
  CreateMesocycleInput,
  UpdateMesocycleInput,
  MesocyclePlan // Legacy type for backward compatibility
} from '@/lib/fitness.types'
import { mesocycleToLegacyPlan } from '@/lib/fitness.types'

interface UseFitnessReturn {
  exercises: Exercise[]
  mesocycles: MesocyclePlan[] // Legacy format for existing components
  workoutLogs: WorkoutSession[] // Renamed from workoutSessions for backward compatibility
  activeMesocycle: MesocyclePlan | null // Legacy format
  loading: boolean
  error: string | null
  createExercise: (exercise: Omit<Exercise, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>) => Promise<Exercise | null>
  updateExercise: (id: string, updates: Partial<Omit<Exercise, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>) => Promise<Exercise | null>
  deleteExercise: (id: string) => Promise<boolean>
  createMesocycle: (mesocycle: any) => Promise<any> // Legacy signature, will adapt internally
  updateMesocycle: (id: string, updates: any) => Promise<any>
  deleteMesocycle: (id: string) => Promise<boolean>
  setMesocycleActive: (id: string) => Promise<boolean>
  refreshAll: () => Promise<void>
}

export function useFitness(): UseFitnessReturn {
  const {
    exercises,
    mesocycles,
    workoutSessions,
    activeMesocycle,
    fitnessLoading,
    fitnessError,
    createExercise,
    updateExercise,
    deleteExercise,
    createMesocycle: createMesocycleNew,
    updateMesocycle: updateMesocycleNew,
    deleteMesocycle,
    setMesocycleActive,
    refreshFitness,
  } = useAppData()

  // Convert new mesocycles to legacy format for backward compatibility
  const legacyMesocycles = mesocycles.map(mesocycleToLegacyPlan)
  const legacyActiveMesocycle = activeMesocycle ? mesocycleToLegacyPlan(activeMesocycle) : null

  // Adapter function for createMesocycle to handle legacy input format
  const createMesocycle = async (legacyMesocycle: any): Promise<any> => {
    // Convert legacy MesocyclePlan input to new CreateMesocycleInput format
    const newMesocycleInput: CreateMesocycleInput = {
      name: legacyMesocycle.name,
      weeks: legacyMesocycle.weeks,
      days_per_week: legacyMesocycle.daysPerWeek || legacyMesocycle.days_per_week,
      specialization: legacyMesocycle.specialization,
      goal_statement: legacyMesocycle.goalStatement || legacyMesocycle.goal_statement,
      is_template: legacyMesocycle.isTemplate || legacyMesocycle.is_template || false,
      start_date: legacyMesocycle.start_date,
    }

    const result = await createMesocycleNew(newMesocycleInput)
    return result ? mesocycleToLegacyPlan(result) : null
  }

  // Adapter function for updateMesocycle
  const updateMesocycle = async (id: string, legacyUpdates: any): Promise<any> => {
    // Convert legacy updates to new format
    const newUpdates: UpdateMesocycleInput = {}
    
    if (legacyUpdates.name) newUpdates.name = legacyUpdates.name
    if (legacyUpdates.weeks) newUpdates.weeks = legacyUpdates.weeks
    if (legacyUpdates.daysPerWeek) newUpdates.days_per_week = legacyUpdates.daysPerWeek
    if (legacyUpdates.days_per_week) newUpdates.days_per_week = legacyUpdates.days_per_week
    if (legacyUpdates.specialization) newUpdates.specialization = legacyUpdates.specialization
    if (legacyUpdates.goalStatement) newUpdates.goal_statement = legacyUpdates.goalStatement
    if (legacyUpdates.goal_statement) newUpdates.goal_statement = legacyUpdates.goal_statement
    if (legacyUpdates.isTemplate !== undefined) newUpdates.is_template = legacyUpdates.isTemplate
    if (legacyUpdates.is_template !== undefined) newUpdates.is_template = legacyUpdates.is_template
    if (legacyUpdates.is_active !== undefined) newUpdates.is_active = legacyUpdates.is_active
    if (legacyUpdates.start_date) newUpdates.start_date = legacyUpdates.start_date
    if (legacyUpdates.end_date) newUpdates.end_date = legacyUpdates.end_date

    const result = await updateMesocycleNew(id, newUpdates)
    return result ? mesocycleToLegacyPlan(result) : null
  }

  return {
    exercises,
    mesocycles: legacyMesocycles,
    workoutLogs: workoutSessions, // Backward compatibility naming
    activeMesocycle: legacyActiveMesocycle,
    loading: fitnessLoading,
    error: fitnessError,
    createExercise,
    updateExercise,
    deleteExercise,
    createMesocycle,
    updateMesocycle,
    deleteMesocycle,
    setMesocycleActive,
    refreshAll: refreshFitness,
  }
}

// Re-export types for backward compatibility
export type { Exercise, MesocyclePlan, WorkoutSession }
export type WorkoutLog = WorkoutSession // Alias for backward compatibility