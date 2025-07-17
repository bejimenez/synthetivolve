export type MuscleGroup =
  | 'CHEST'
  | 'BACK'
  | 'SHOULDERS'
  | 'TRICEPS'
  | 'BICEPS'
  | 'QUADS'
  | 'HAMSTRINGS'
  | 'GLUTES'
  | 'CALVES'
  | 'ABS'
  | 'FOREARMS';

export interface Exercise {
  id: string;
  name: string;
  primary_muscle_group: MuscleGroup; // Changed from 'primary'
  secondary_muscle_groups: MuscleGroup[]; // Changed from 'secondary'
  equipment: string;
  notes?: string;
  use_rir_rpe: boolean; // Changed from 'useRIRRPE'
}

export interface DayPlan {
  day: number; // 1-indexed
  exercises: string[]; // Array of exercise IDs
}

export interface MesocyclePlan {
  id: string;
  name: string;
  weeks: number; // 2–16
  days_per_week: number; // Changed from 'daysPerWeek'
  specialization: MuscleGroup[]; // Up to 2
  goal_statement?: string; // Changed from 'goalStatement'
  days: DayPlan[]; // Length == daysPerWeek
  exerciseDB: Record<string, Exercise>;
  plan_data?: MesocyclePlanData | null; // Added to match database structure
}

export interface MesocyclePlanData {
  days: DayPlan[];
  exerciseDB: Record<string, Exercise>;
}


export interface SetLog {
  weight: number;
  reps: number;
  rir?: number;
  rpe?: number;
}

export interface LoggedExercise {
  exerciseId: string;
  sets: SetLog[];
  replacedOriginal?: boolean;
  wasAccessory?: boolean;
}


export interface ExerciseLogFromApi {
  id: string;
  exercise_id: string | null;
  order_index: number;
  replaced_original: boolean | null;
  was_accessory: boolean | null;
  workout_log_id: string | null;
  created_at: string | null;
  set_logs: SetLogFromApi[]; // Joined sets
}

export interface SetLogFromApi {
  id: string;
  exercise_log_id: string | null;
  set_number: number;
  weight: number;
  reps: number;
  rir: number | null;
  rpe: number | null;
  created_at: string | null;
}

export interface WorkoutLogResponse {
  id: string;
  user_id: string;
  mesocycle_id?: string | null;
  week_number?: number | null;
  day_number?: number | null;
  workout_date: string;
  custom_goal_entry?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  log_data?: WorkoutLogData | null; // For client-side data when creating/updating
  exercises?: LoggedExercise[]; // Optional, for client-side use if log_data is parsed
  exercise_logs?: ExerciseLogFromApi[]; // Data from API GET response
}

export interface WorkoutLogCreatePayload {
  mesocycle_id?: string | null;
  week_number?: number | null;
  day_number?: number | null;
  workout_date: string;
  custom_goal_entry?: string | null;
  exercises: LoggedExercise[]; // This is what the API expects for POST
  started_at?: string | null;
  completed_at?: string | null;
  log_data?: WorkoutLogData | null; // Optional, for client-side data when creating/updating
}


export interface WorkoutLogData {
  exercises: LoggedExercise[];
  customGoalEntry?: string; // Original name from POC
}

export interface MuscleGroupVolume {
  [key: string]: number;
}

export interface SessionSummary {
  totalVolume: MuscleGroupVolume;
  prs: string[];
  duration?: number;
}

export interface MesocycleSavePayload {
  name: string;
  weeks: number;
  days_per_week: number;
  specialization: MuscleGroup[];
  goal_statement: string | null;
  days: Array<{
    day_number: number;
    exercises: Array<{
      exercise_id: string;
      order_index: number;
    }>;
  }>;
  plan_data: MesocyclePlanData;
}
