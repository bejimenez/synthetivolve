// src/lib/fitness.types.ts
import type { Database } from './database.types'

// Use database types as base
export type ExerciseRow = Database['public']['Tables']['exercises']['Row']
export type MesocycleRow = Database['public']['Tables']['mesocycles']['Row']
export type WorkoutLogRow = Database['public']['Tables']['workout_logs']['Row']
export type ExerciseLogRow = Database['public']['Tables']['exercise_logs']['Row']
export type SetLogRow = Database['public']['Tables']['set_logs']['Row']

// Muscle group type
export type MuscleGroup = 
  | 'CHEST' | 'BACK' | 'SHOULDERS' | 'TRICEPS' | 'BICEPS' 
  | 'QUADS' | 'HAMSTRINGS' | 'GLUTES' | 'CALVES' | 'ABS' | 'FOREARMS'

// Legacy Exercise type for backward compatibility
export interface Exercise {
  id: string
  name: string
  primary: MuscleGroup
  secondary: MuscleGroup[]
  equipment?: string
  notes?: string
  useRIRRPE: boolean
}

// Convert database row to Exercise type
export function exerciseRowToExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    primary: row.primary_muscle_group as MuscleGroup,
    secondary: (row.secondary_muscle_groups || []) as MuscleGroup[],
    equipment: row.equipment || undefined,
    notes: row.notes || undefined,
    useRIRRPE: row.use_rir_rpe
  }
}

// Convert Exercise type to database row format
export function exerciseToRow(exercise: Omit<Exercise, 'id'>): Omit<ExerciseRow, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'> {
  return {
    name: exercise.name,
    primary_muscle_group: exercise.primary,
    secondary_muscle_groups: exercise.secondary,
    equipment: exercise.equipment || null,
    notes: exercise.notes || null,
    use_rir_rpe: exercise.useRIRRPE
  }
}

// Set type
export interface Set {
  reps: number
  weight: number
  rir?: number
  rpe?: number
  isWarmup?: boolean
}

// DayPlan type
export interface DayPlan {
  day: number; // Day number (1-7)
  exercises: Array<{
    exercise_id: string;
    order_index: number;
  }>;
}

// Set type for logging
export interface SetLog {
  set_number?: number; // Optional, can be assigned on backend or during processing
  weight: number;
  reps: number;
  rir?: number | null;
  rpe?: number | null;
}

// Logged Exercise type for workout logs
export interface LoggedExercise {
  exercise_id: string;
  order_index: number;
  replaced_original?: boolean;
  was_accessory?: boolean;
  sets: SetLog[];
}

// Workout log types
export interface WorkoutLog {
  id: string;
  user_id: string;
  mesocycle_id?: string | null;
  week_number?: number | null;
  day_number?: number | null;
  workout_date: string;
  custom_goal_entry?: string | null;
  started_at: string;
  completed_at?: string | null;
  created_at: string;
  exercises: LoggedExercise[]; // Nested logged exercises
}

// Helper function to convert database workout log with relations
export function buildWorkoutLogFromRows(
  workoutRow: WorkoutLogRow,
  exerciseLogs: (ExerciseLogRow & { sets: SetLogRow[] })[]
): WorkoutLog {
  return {
    id: workoutRow.id,
    user_id: workoutRow.user_id,
    mesocycle_id: workoutRow.mesocycle_id,
    week_number: workoutRow.week_number,
    day_number: workoutRow.day_number,
    workout_date: workoutRow.workout_date,
    custom_goal_entry: workoutRow.custom_goal_entry,
    exercises: exerciseLogs.map(log => ({
      exercise_id: log.exercise_id,
      order_index: log.order_index,
      replaced_original: log.replaced_original || false,
      was_accessory: log.was_accessory || false,
      sets: log.sets.map(set => ({
        set_number: set.set_number,
        reps: set.reps,
        weight: set.weight,
        rir: set.rir || undefined,
        rpe: set.rpe || undefined
      }))
    })),
    started_at: workoutRow.started_at,
    completed_at: workoutRow.completed_at || undefined,
    created_at: workoutRow.created_at
  }
}


export interface MesocyclePlan {
  id?: string
  name: string
  weeks: number
  daysPerWeek: number
  specialization: MuscleGroup[]
  goalStatement?: string
  days: DayPlan[] // Use the new DayPlan structure
  exerciseDB?: Record<string, Exercise>
}

// Workout log types
export interface WorkoutExercise {
  exerciseId: string
  sets: Set[]
  replacedOriginal?: boolean
  wasAccessory?: boolean
  orderIndex: number
}

export interface WorkoutLog {
  id: string
  userId: string
  mesocycleId?: string | null
  weekNumber?: number | null
  dayNumber?: number | null
  workoutDate: string
  customGoalEntry?: string | null
  exercises: WorkoutExercise[]
  startedAt: string
  completedAt?: string | null
  createdAt: string
}

// Helper function to convert database workout log with relations
export function buildWorkoutLogFromRows(
  workoutRow: WorkoutLogRow,
  exerciseLogs: (ExerciseLogRow & { sets: SetLogRow[] })[]
): WorkoutLog {
  return {
    id: workoutRow.id,
    userId: workoutRow.user_id,
    mesocycleId: workoutRow.mesocycle_id,
    weekNumber: workoutRow.week_number,
    dayNumber: workoutRow.day_number,
    workoutDate: workoutRow.workout_date,
    customGoalEntry: workoutRow.custom_goal_entry,
    exercises: exerciseLogs.map(log => ({
      exerciseId: log.exercise_id,
      orderIndex: log.order_index,
      replacedOriginal: log.replaced_original || false,
      wasAccessory: log.was_accessory || false,
      sets: log.sets.map(set => ({
        reps: set.reps,
        weight: set.weight,
        rir: set.rir || undefined,
        rpe: set.rpe || undefined
      }))
    })),
    startedAt: workoutRow.started_at,
    completedAt: workoutRow.completed_at || undefined,
    createdAt: workoutRow.created_at
  }
}