// src/lib/fitness.types.ts (Complete Refactor)
import type { Database } from './database.types'

// Database types from the new schema
export type ExerciseRow = Database['public']['Tables']['exercises']['Row']
export type MesocycleRow = Database['public']['Tables']['mesocycles']['Row']
export type MesocycleExerciseRow = Database['public']['Tables']['mesocycle_exercises']['Row']
export type WorkoutSessionRow = Database['public']['Tables']['workout_sessions']['Row']
export type WorkoutExerciseRow = Database['public']['Tables']['workout_exercises']['Row']
export type SetLogRow = Database['public']['Tables']['set_logs']['Row']
export type WorkoutLogRow = Database['public']['Tables']['workout_sessions']['Row']

// Muscle group enum
export type MuscleGroup = 
  | 'CHEST' | 'BACK' | 'SHOULDERS' | 'TRICEPS' | 'BICEPS' 
  | 'QUADS' | 'HAMSTRINGS' | 'GLUTES' | 'CALVES' | 'ABS' | 'FOREARMS'

// Weight type for exercise programming
export type WeightType = 'percentage' | 'rpe' | 'absolute'

// Exercise interface (matches database)
export interface Exercise {
  id: string
  name: string
  primary_muscle_group: MuscleGroup
  secondary_muscle_groups: MuscleGroup[]
  equipment?: string | null
  notes?: string | null
  use_rir_rpe: boolean
  user_id?: string | null
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

// Mesocycle interface (updated to match new database schema)
export interface Mesocycle {
  id: string
  user_id: string
  name: string
  weeks: number
  days_per_week: number
  specialization: string[] | null
  goal_statement: string | null
  is_template: boolean
  is_active: boolean  // NEW: Now properly tracked
  start_date: string | null  // NEW: Proper date tracking
  end_date: string | null    // NEW: Calculated or set end date
  created_at: string
  updated_at: string
  deleted_at: string | null
  
  // Computed properties
  current_week?: number
  days_remaining?: number
  is_completed?: boolean
}

// Mesocycle exercise (replaces complex JSONB storage)
export interface MesocycleExercise {
  id: string
  mesocycle_id: string
  exercise_id: string
  day_number: number
  order_index: number
  sets: number
  reps_min: number
  reps_max: number
  weight_type: WeightType
  weight_value: number | null
  rpe_target: number | null
  rest_seconds: number
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  
  // Joined data
  exercise?: Exercise
}

// Complete mesocycle with exercises (for planning interface)
export interface MesocycleWithExercises extends Mesocycle {
  exercises_by_day: Record<number, MesocycleExercise[]>
  total_exercises: number
  unique_exercises: string[]
}

// Workout session (replaces old WorkoutLog)
export interface WorkoutSession {
  id: string
  user_id: string
  mesocycle_id: string | null
  session_date: string
  week_number: number | null
  day_number: number | null
  session_name: string | null
  notes: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  
  // Related data
  exercises: WorkoutExercise[]
  mesocycle?: Mesocycle
}

// Workout exercise (exercise performed in a session)
export interface WorkoutExercise {
  id: string
  workout_session_id: string
  exercise_id: string
  mesocycle_exercise_id: string | null  // Link to planned exercise
  order_index: number
  is_substitution: boolean
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  
  // Related data
  exercise: Exercise
  sets: SetLog[]
  planned_exercise?: MesocycleExercise
}

// Set log (actual set performed)
export interface SetLog {
  id: string
  workout_exercise_id: string  // Updated to reference workout_exercises
  set_number: number
  weight: number
  reps: number
  rir: number | null
  rpe: number | null
  created_at: string | null
}

// Input types for API operations
export interface CreateMesocycleInput {
  name: string
  weeks: number
  days_per_week: number
  specialization?: string[]
  goal_statement?: string
  is_template?: boolean
  start_date?: string
}

export interface UpdateMesocycleInput {
  name?: string
  weeks?: number
  days_per_week?: number
  specialization?: string[]
  goal_statement?: string
  is_template?: boolean
  is_active?: boolean
  start_date?: string
  end_date?: string
}

export interface CreateMesocycleExerciseInput {
  mesocycle_id: string
  exercise_id: string
  day_number: number
  order_index?: number
  sets?: number
  reps_min?: number
  reps_max?: number
  weight_type?: WeightType
  weight_value?: number
  rpe_target?: number
  rest_seconds?: number
  notes?: string
}

export interface CreateWorkoutSessionInput {
  mesocycle_id?: string
  session_date: string
  week_number?: number
  day_number?: number
  session_name?: string
  notes?: string
}

export interface CreateWorkoutExerciseInput {
  workout_session_id: string
  exercise_id: string
  mesocycle_exercise_id?: string
  order_index?: number
  is_substitution?: boolean
  notes?: string
}

export interface CreateSetLogInput {
  workout_exercise_id: string
  set_number: number
  weight: number
  reps: number
  rir?: number
  rpe?: number
}

// Helper functions for data transformation
export function exerciseRowToExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    primary_muscle_group: row.primary_muscle_group as MuscleGroup,
    secondary_muscle_groups: (row.secondary_muscle_groups || []) as MuscleGroup[],
    equipment: row.equipment,
    notes: row.notes,
    use_rir_rpe: row.use_rir_rpe || false,
    user_id: row.user_id,
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
    deleted_at: row.deleted_at
  }
}

export function exerciseToRow(exercise: Omit<Exercise, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Omit<ExerciseRow, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> {
  return {
    name: exercise.name,
    primary_muscle_group: exercise.primary_muscle_group,
    secondary_muscle_groups: exercise.secondary_muscle_groups,
    equipment: exercise.equipment || null,
    notes: exercise.notes || null,
    use_rir_rpe: exercise.use_rir_rpe,
    user_id: exercise.user_id || null
  }
}

export function mesocycleRowToMesocycle(row: MesocycleRow): Mesocycle {
  const startDate = row.start_date ? new Date(row.start_date) : null
  const currentDate = new Date()
  
  // Calculate current week if mesocycle has started
  let current_week: number | undefined
  let days_remaining: number | undefined
  let is_completed = false
  
  if (startDate && row.weeks) {
    const daysSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    current_week = Math.max(1, Math.floor(daysSinceStart / 7) + 1)
    
    const totalDays = row.weeks * 7
    days_remaining = Math.max(0, totalDays - daysSinceStart)
    is_completed = days_remaining === 0
  }
  
  return {
    id: row.id,
    user_id: row.user_id || '',
    name: row.name,
    weeks: row.weeks,
    days_per_week: row.days_per_week,
    specialization: row.specialization,
    goal_statement: row.goal_statement,
    is_template: row.is_template || false,
    is_active: row.is_active || false,
    start_date: row.start_date,
    end_date: row.end_date,
    created_at: row.created_at || '',
    updated_at: row.updated_at || '',
    deleted_at: row.deleted_at,
    current_week,
    days_remaining,
    is_completed
  }
}

export function mesocycleToRow(mesocycle: Omit<Mesocycle, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'current_week' | 'days_remaining' | 'is_completed'>): Omit<MesocycleRow, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> {
  return {
    user_id: mesocycle.user_id,
    name: mesocycle.name,
    weeks: mesocycle.weeks,
    days_per_week: mesocycle.days_per_week,
    specialization: mesocycle.specialization,
    goal_statement: mesocycle.goal_statement,
    is_template: mesocycle.is_template,
    is_active: mesocycle.is_active,
    start_date: mesocycle.start_date,
    end_date: mesocycle.end_date,
    plan_data: null // Legacy field, no longer used
  }
}

// Validation helpers
export function validateMesocycleInput(input: CreateMesocycleInput): string[] {
  const errors: string[] = []
  
  if (!input.name || input.name.trim().length === 0) {
    errors.push('Mesocycle name is required')
  }
  
  if (input.weeks < 2 || input.weeks > 16) {
    errors.push('Mesocycle duration must be between 2 and 16 weeks')
  }
  
  if (input.days_per_week < 1 || input.days_per_week > 7) {
    errors.push('Days per week must be between 1 and 7')
  }
  
  if (input.start_date) {
    const startDate = new Date(input.start_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (startDate < today) {
      errors.push('Start date cannot be in the past')
    }
  }
  
  return errors
}

// Legacy type compatibility (for gradual migration)
export interface DayPlan {
  day: number;
  exercises: Array<{ exercise_id: string; order_index: number }>;
}

export interface MesocyclePlan extends Mesocycle {
  // Legacy properties for backward compatibility
  daysPerWeek: number
  isTemplate?: boolean
  days?: DayPlan[] // Legacy day structure
  exerciseDB?: Record<string, Exercise>
}

// Convert new mesocycle to legacy format for existing components
export function mesocycleToLegacyPlan(mesocycle: Mesocycle): MesocyclePlan {
  return {
    ...mesocycle,
    daysPerWeek: mesocycle.days_per_week,
    isTemplate: mesocycle.is_template,
    days: [], // Will be populated from mesocycle_exercises
    exerciseDB: {} // Will be populated from related exercises
  }
}

// Get formatted muscle group names
export function formatMuscleGroupName(muscle: MuscleGroup): string {
  const formatted = muscle.toLowerCase().replace('_', ' ')
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

// Calculate total volume for a mesocycle
export function calculateMesocycleVolume(exercises: MesocycleExercise[]): Record<MuscleGroup, number> {
  const volume: Record<MuscleGroup, number> = {} as Record<MuscleGroup, number>
  
  exercises.forEach(me => {
    if (me.exercise) {
      const primaryVolume = me.sets * ((me.reps_min + me.reps_max) / 2)
      volume[me.exercise.primary_muscle_group] = (volume[me.exercise.primary_muscle_group] || 0) + primaryVolume
      
      me.exercise.secondary_muscle_groups.forEach(secondary => {
        const secondaryVolume = primaryVolume * 0.5 // Secondary muscles get 50% volume credit
        volume[secondary] = (volume[secondary] || 0) + secondaryVolume
      })
    }
  })
  
  return volume
}

// Legacy types for workout logs, will be replaced by WorkoutSession
//export type WorkoutLogRow = Database['public']['Tables']['workout_sessions']['Row']
export type ExerciseLogRow = Database['public']['Tables']['exercise_logs']['Row']

export interface LoggedExercise {
  exercise_id: string
  order_index: number
  replaced_original: boolean | null
  was_accessory: boolean | null
  sets: SetLog[]
}

export interface WorkoutLog {
  id: string
  user_id: string
  mesocycle_id: string | null
  week_number: number | null
  day_number: number | null
  workout_date: string
  started_at: string | null
  completed_at: string | null
  custom_goal_entry: string | null
  created_at: string | null
  exercises: LoggedExercise[]
}

export function buildWorkoutLogFromRows(
  workoutRow: WorkoutLogRow,
  exerciseLogs: (ExerciseLogRow & { set_logs: SetLogRow[] })[]
): WorkoutLog {
  return {
    id: workoutRow.id,
    user_id: workoutRow.user_id || '',
    mesocycle_id: workoutRow.mesocycle_id,
    week_number: workoutRow.week_number,
    day_number: workoutRow.day_number,
    workout_date: workoutRow.workout_date,
    started_at: workoutRow.started_at,
    completed_at: workoutRow.completed_at,
    custom_goal_entry: workoutRow.custom_goal_entry,
    created_at: workoutRow.created_at,
    exercises: exerciseLogs.map(exLogRow => ({
      exercise_id: exLogRow.exercise_id || '',
      order_index: exLogRow.order_index,
      replaced_original: exLogRow.replaced_original,
      was_accessory: exLogRow.was_accessory,
      sets: exLogRow.set_logs,
    })),
  }
}