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
  primary: MuscleGroup;
  secondary: MuscleGroup[];
  equipment: string;
  notes?: string;
  useRIRRPE: boolean; // true=use RIR/RPE, false=use %1RM
}

export interface DayPlan {
  day: number; // 1-indexed
  exercises: string[]; // Array of exercise IDs
}

export interface MesocyclePlan {
  id: string;
  name: string;
  weeks: number; // 2–16
  daysPerWeek: number;
  specialization: MuscleGroup[]; // Up to 2
  goalStatement?: string;
  days: DayPlan[]; // Length == daysPerWeek
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

export interface WorkoutLog {
  mesocycleId?: string; // absent if "workout from scratch"
  week?: number;
  day?: number;
  date: string;
  exercises: LoggedExercise[];
  customGoalEntry?: string;
}

export interface MuscleGroupVolume {
  [key: string]: number;
}

export interface SessionSummary {
  totalVolume: MuscleGroupVolume;
  prs: string[];
  duration?: number;
}
