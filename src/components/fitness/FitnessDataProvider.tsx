// src/components/fitness/FitnessDataProvider.tsx
'use client'

import { createContext, useContext, useCallback, useReducer, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import type { Database } from '@/lib/database.types'
// Using the migrated types

// More specific types from the database schema can be used if needed
type ExerciseRow = Database['public']['Tables']['exercises']['Row']
type MesocycleRow = Database['public']['Tables']['mesocycles']['Row']
type WorkoutLogFromApi = Database['public']['Tables']['workout_logs']['Row'] & {
  exercise_logs: (Database['public']['Tables']['exercise_logs']['Row'] & {
    set_logs: Database['public']['Tables']['set_logs']['Row'][]
  })[]
}

import type { Exercise, MesocycleSavePayload, WorkoutLogResponse, WorkoutLogData } from '@/lib/fitness.types'

interface FitnessState {
  exercises: Exercise[]
  mesocycles: MesocycleRow[]
  workoutLogs: WorkoutLogResponse[]
  activeMesocycle: MesocycleRow | null
  loading: boolean
  error: string | null
}

type FitnessAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FITNESS_DATA'; payload: { exercises: Exercise[], mesocycles: MesocycleRow[], workoutLogs: WorkoutLogResponse[] } }

interface FitnessContextType extends FitnessState {
  createExercise: (exercise: Omit<ExerciseRow, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'>) => Promise<Exercise | null>
  createMesocycle: (mesocycle: MesocycleSavePayload) => Promise<MesocycleRow | null>
  refreshAll: () => Promise<void>
}

const FitnessContext = createContext<FitnessContextType | undefined>(undefined)

function fitnessReducer(state: FitnessState, action: FitnessAction): FitnessState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
    case 'SET_FITNESS_DATA':
      return { 
        ...state, 
        ...action.payload,
        activeMesocycle: action.payload.mesocycles.length > 0 ? action.payload.mesocycles[0] : null,
        loading: false, 
        error: null 
      }
    default:
      return state
  }
}

export function FitnessDataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(fitnessReducer, {
    exercises: [],
    mesocycles: [],
    workoutLogs: [],
    activeMesocycle: null,
    loading: true,
    error: null
  })
  const { user } = useAuth()

  const refreshAll = useCallback(async () => {
    if (!user) {
      dispatch({ type: 'SET_FITNESS_DATA', payload: { exercises: [], mesocycles: [], workoutLogs: [] } })
      return
    }

    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const [exercisesRes, mesocyclesRes, workoutLogsRes] = await Promise.all([
        fetch('/api/fitness/exercises'),
        fetch('/api/fitness/mesocycles'),
        fetch('/api/fitness/workout-logs'),
      ]);

      if (!exercisesRes.ok || !mesocyclesRes.ok || !workoutLogsRes.ok) {
        throw new Error('Failed to fetch fitness data');
      }

      const exercises = (await exercisesRes.json()).map((ex: ExerciseRow) => ({
        id: ex.id,
        name: ex.name,
        primary_muscle_group: ex.primary_muscle_group,
        secondary_muscle_groups: ex.secondary_muscle_groups || [],
        equipment: ex.equipment || '',
        notes: ex.notes || undefined,
        use_rir_rpe: ex.use_rir_rpe,
      }));
      const mesocycles = await mesocyclesRes.json();
      const rawWorkoutLogs: WorkoutLogFromApi[] = await workoutLogsRes.json();

      // Transform rawWorkoutLogs to ClientWorkoutLog
      const workoutLogs: WorkoutLogResponse[] = rawWorkoutLogs.map(log => ({
        id: log.id,
        user_id: log.user_id || '',
        mesocycle_id: log.mesocycle_id,
        week_number: log.week_number,
        day_number: log.day_number,
        workout_date: log.workout_date,
        custom_goal_entry: log.custom_goal_entry,
        started_at: log.started_at,
        completed_at: log.completed_at,
        created_at: log.created_at || '',
        log_data: log.log_data as WorkoutLogData | null,
        exercise_logs: log.exercise_logs.map(exLog => ({
          id: exLog.id,
          exercise_id: exLog.exercise_id,
          order_index: exLog.order_index,
          replaced_original: exLog.replaced_original,
          was_accessory: exLog.was_accessory,
          workout_log_id: exLog.workout_log_id,
          created_at: exLog.created_at,
          set_logs: exLog.set_logs.map(setLog => ({
            id: setLog.id,
            exercise_log_id: setLog.exercise_log_id,
            set_number: setLog.set_number,
            weight: setLog.weight,
            reps: setLog.reps,
            rir: setLog.rir,
            rpe: setLog.rpe,
            created_at: setLog.created_at,
          }))
        }))
      }));

      dispatch({ type: 'SET_FITNESS_DATA', payload: { exercises, mesocycles, workoutLogs } })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'An unknown error occurred' })
    }
  }, [user])

  const createExercise = async (exerciseData: Omit<ExerciseRow, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'>) => {
    try {
        const response = await fetch('/api/fitness/exercises', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(exerciseData),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create exercise');
        }
        const newExercise = await response.json();
        await refreshAll(); // Refresh data after creation
        return {
          id: newExercise.id,
          name: newExercise.name,
          primary_muscle_group: newExercise.primary_muscle_group,
          secondary_muscle_groups: newExercise.secondary_muscle_groups || [],
          equipment: newExercise.equipment || '',
          notes: newExercise.notes || undefined,
          use_rir_rpe: newExercise.use_rir_rpe,
        };
    } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'An unknown error occurred' });
        return null;
    }
  }

  const createMesocycle = async (mesocycleData: MesocycleSavePayload) => {
    try {
      const response = await fetch('/api/fitness/mesocycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mesocycleData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create mesocycle');
      }
      const newMesocycle = await response.json();
      await refreshAll();
      return newMesocycle;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'An unknown error occurred' });
      return null;
    }
  }

  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  const value = {
    ...state,
    createExercise,
    createMesocycle,
    refreshAll,
  }

  return (
    <FitnessContext.Provider value={value}>
      {children}
    </FitnessContext.Provider>
  )
}

export function useFitness() {
  const context = useContext(FitnessContext)
  if (context === undefined) {
    throw new Error('useFitness must be used within a FitnessDataProvider')
  }
  return context
}
