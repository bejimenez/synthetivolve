// src/components/fitness/FitnessDataProvider.tsx
'use client'

import { createContext, useContext, useCallback, useReducer, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import type { Database } from '@/lib/database.types'
// Using the migrated types

// More specific types from the database schema can be used if needed
type ExerciseRow = Database['public']['Tables']['exercises']['Row']
type MesocycleRow = Database['public']['Tables']['mesocycles']['Row']
type WorkoutLogRow = Database['public']['Tables']['workout_logs']['Row']

import type { Exercise, MesocyclePlan, MuscleGroup, WorkoutLog, DayPlan, ExerciseLogRow, SetLogRow } from '@/lib/fitness.types'
import { exerciseToRow, exerciseRowToExercise, buildWorkoutLogFromRows } from '@/lib/fitness.types'

interface FitnessState {
  exercises: Exercise[]
  mesocycles: MesocyclePlan[]
  workoutLogs: WorkoutLog[]
  activeMesocycle: MesocyclePlan | null
  loading: boolean
  error: string | null
}

type FitnessAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FITNESS_DATA'; payload: { exercises: Exercise[], mesocycles: MesocyclePlan[], workoutLogs: WorkoutLog[] } }

interface FitnessContextType extends FitnessState {
  createExercise: (exercise: Omit<Exercise, 'id'>) => Promise<Exercise | null>
  updateExercise: (id: string, updates: Partial<Omit<Exercise, 'id'>>) => Promise<Exercise | null>
  deleteExercise: (id: string) => Promise<boolean>
  createMesocycle: (mesocycle: MesocyclePlan) => Promise<MesocycleRow | null>
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
        primary: ex.primary_muscle_group,
        secondary: ex.secondary_muscle_groups || [],
        equipment: ex.equipment || '',
        notes: ex.notes || undefined,
        useRIRRPE: ex.use_rir_rpe,
      }));
      const mesocycles = (await mesocyclesRes.json()).map((mesoRow: MesocycleRow) => {
        const planData = mesoRow.plan_data as { days?: DayPlan[], exerciseDB?: Record<string, Exercise> } | null;
        return {
          id: mesoRow.id,
          name: mesoRow.name,
          weeks: mesoRow.weeks,
          daysPerWeek: mesoRow.days_per_week,
          specialization: mesoRow.specialization as MuscleGroup[],
          goalStatement: mesoRow.goal_statement || undefined,
          days: planData?.days || [],
          exerciseDB: planData?.exerciseDB || {},
        };
      });
      const workoutLogs = (await workoutLogsRes.json()).map((workoutRow: WorkoutLogRow & { exercise_logs: (ExerciseLogRow & { set_logs: SetLogRow[] })[] }) => {
        return buildWorkoutLogFromRows(workoutRow, workoutRow.exercise_logs);
      });

      dispatch({ type: 'SET_FITNESS_DATA', payload: { exercises, mesocycles, workoutLogs } })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'An unknown error occurred' })
    }
  }, [user])

  const createExercise = async (exerciseData: Omit<Exercise, 'id'>) => {
  try {
    // Convert Exercise format to database format
    const rowData = exerciseToRow(exerciseData);
    
    const response = await fetch('/api/fitness/exercises', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rowData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create exercise');
    }
    
    const newExerciseRow = await response.json();
    await refreshAll();
    
    // Return as Exercise type
    return exerciseRowToExercise(newExerciseRow);
  } catch (err) {
    dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'An error occurred' });
    return null;
  }
};

  const createMesocycle = useCallback(async (mesocycleData: MesocyclePlan) => {
    if (!user) {
      dispatch({ type: 'SET_ERROR', payload: 'No authenticated user' });
      return null;
    }

    try {
      // Construct the plan_data JSONB object
      const plan_data = {
        days: mesocycleData.days,
        exerciseDB: mesocycleData.exerciseDB,
      };

      const response = await fetch('/api/fitness/mesocycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: mesocycleData.name,
          weeks: mesocycleData.weeks,
          days_per_week: mesocycleData.daysPerWeek,
          specialization: mesocycleData.specialization,
          goal_statement: mesocycleData.goalStatement || null,
          is_template: mesocycleData.isTemplate || false, // Assuming isTemplate might be part of MesocyclePlan
          plan_data: plan_data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create mesocycle');
      }

      const newMesocycle = await response.json();
      await refreshAll();
      return newMesocycle;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to create mesocycle' });
      return null;
    }
  }, [user, refreshAll]);

  const updateExercise = async (id: string, updates: Partial<Omit<Exercise, 'id'>>) => {
    try {
      const rowData = exerciseToRow(updates as Omit<Exercise, 'id'>);
      const response = await fetch(`/api/fitness/exercises/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rowData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update exercise');
      }

      const updatedExerciseRow = await response.json();
      await refreshAll();
      return exerciseRowToExercise(updatedExerciseRow);
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'An error occurred during exercise update' });
      return null;
    }
  };

  const deleteExercise = async (id: string) => {
    try {
      const response = await fetch(`/api/fitness/exercises/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete exercise');
      }

      await refreshAll();
      return true;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'An error occurred during exercise deletion' });
      return false;
    }
  };

  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  const value = {
    ...state,
    createExercise,
    updateExercise,
    deleteExercise,
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

