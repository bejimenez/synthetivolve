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

import type { Exercise, MesocyclePlan, MuscleGroup } from '@/lib/fitness.types'
import { exerciseToRow, exerciseRowToExercise } from '@/lib/fitness.types'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

interface FitnessState {
  exercises: Exercise[]
  mesocycles: MesocycleRow[]
  workoutLogs: WorkoutLogRow[]
  activeMesocycle: MesocycleRow | null
  loading: boolean
  error: string | null
}

type FitnessAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FITNESS_DATA'; payload: { exercises: Exercise[], mesocycles: MesocycleRow[], workoutLogs: WorkoutLogRow[] } }

interface FitnessContextType extends FitnessState {
  createExercise: (exercise: Omit<Exercise, 'id'>) => Promise<Exercise | null>
  createMesocycle: (mesocycle: Omit<MesocyclePlan, 'id' | 'exerciseDB'> & { days: Array<{ day_number: number; exercises: Array<{ exercise_id: string; order_index: number }> }> }) => Promise<MesocycleRow | null>
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
  const supabase = createSupabaseClient()

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
      const mesocycles = await mesocyclesRes.json();
      const workoutLogs = await workoutLogsRes.json();

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

  // The function signature should match what's expected:
const createMesocycle = useCallback(async (mesocycleData: {
  name: string;
  weeks: number;
  daysPerWeek: number;
  specialization: MuscleGroup[];
  goalStatement?: string;
  days: Array<{
    day_number: number;
    exercises: Array<{
      exercise_id: string;
      order_index: number;
    }>;
  }>;
}) => {
  if (!user) {
    dispatch({ type: 'SET_ERROR', payload: 'No authenticated user' });
    return null;
  }

  try {
    // First create the mesocycle
    const { data: mesocycle, error: mesocycleError } = await supabase
      .from('mesocycles')
      .insert({
        user_id: user.id,
        name: mesocycleData.name,
        weeks: mesocycleData.weeks,
        days_per_week: mesocycleData.daysPerWeek,
        specialization: mesocycleData.specialization,
        goal_statement: mesocycleData.goalStatement
      })
      .select()
      .single();

    if (mesocycleError) throw mesocycleError;

    // Then create the days and exercises
    for (const day of mesocycleData.days) {
      const { data: dayData, error: dayError } = await supabase
        .from('mesocycle_days')
        .insert({
          mesocycle_id: mesocycle.id,
          day_number: day.day_number
        })
        .select()
        .single();

      if (dayError) throw dayError;

      // Insert exercises for this day
      if (day.exercises.length > 0) {
        const { error: exercisesError } = await supabase
          .from('day_exercises')
          .insert(
            day.exercises.map(ex => ({
              day_id: dayData.id,
              exercise_id: ex.exercise_id,
              order_index: ex.order_index
            }))
          );

        if (exercisesError) throw exercisesError;
      }
    }

    await refreshAll();
    return mesocycle;
  } catch (err) {
    dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to create mesocycle' });
    return null;
  }
}, [user, supabase, refreshAll]);

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
function createSupabaseClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error('Supabase URL or anon key is not set in environment variables.')
  }
  return createClient<Database>(url, anonKey)
}

