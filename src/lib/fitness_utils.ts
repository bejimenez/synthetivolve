import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { MuscleGroup, Exercise, MesocyclePlan, MuscleGroupVolume } from './fitness.types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'CHEST',
  'BACK',
  'SHOULDERS',
  'TRICEPS',
  'BICEPS',
  'QUADS',
  'HAMSTRINGS',
  'GLUTES',
  'CALVES',
  'ABS',
  'FOREARMS'
];

export function calculateMuscleGroupVolume(exercises: Exercise[], exerciseIds: string[]): MuscleGroupVolume {
  const volume: MuscleGroupVolume = {};
  
  // Initialize all muscle groups to 0
  MUSCLE_GROUPS.forEach(group => {
    volume[group] = 0;
  });

  exerciseIds.forEach(exerciseId => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (exercise) {
      // Primary muscle group gets 1 set
      volume[exercise.primary] += 1;
      
      // Secondary muscle groups get 0.5 sets each
      exercise.secondary.forEach(secondaryGroup => {
        volume[secondaryGroup] += 0.5;
      });
    }
  });

  return volume;
}

export function calculateWeeklyMuscleVolume(mesocycle: MesocyclePlan): MuscleGroupVolume {
  const weeklyVolume: MuscleGroupVolume = {};
  
  // Initialize all muscle groups to 0
  MUSCLE_GROUPS.forEach(group => {
    weeklyVolume[group] = 0;
  });

  // Sum up volume from all days
  mesocycle.days.forEach(day => {
    const dayVolume = calculateMuscleGroupVolume(
      Object.values(mesocycle.exerciseDB),
      day.exercises
    );
    
    MUSCLE_GROUPS.forEach(group => {
      weeklyVolume[group] += dayVolume[group];
    });
  });

  return weeklyVolume;
}

export function getMuscleGroupWarning(volume: number, isSpecialized: boolean): 'low' | 'normal' | 'high' | null {
  if (isSpecialized) {
    if (volume < 3) return 'low';
    if (volume >= 3 && volume <= 5) return 'normal';
    return 'high';
  } else {
    if (volume < 2) return 'low';
    if (volume >= 2 && volume <= 4) return 'normal';
    return 'high';
  }
}

export function getWarningColor(warning: 'low' | 'normal' | 'high' | null): string {
  switch (warning) {
    case 'low':
      return 'bg-red-500';
    case 'normal':
      return 'bg-green-500';
    case 'high':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-300';
  }
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function formatMuscleGroupName(group: MuscleGroup): string {
  return group.charAt(0) + group.slice(1).toLowerCase();
}

export function validateMesocyclePlan(plan: Partial<MesocyclePlan>): string[] {
  const errors: string[] = [];

  if (!plan.name || plan.name.trim() === '') {
    errors.push('Mesocycle name is required');
  }

  if (!plan.weeks || plan.weeks < 2 || plan.weeks > 16) {
    errors.push('Weeks must be between 2 and 16');
  }

  if (!plan.daysPerWeek || plan.daysPerWeek < 1 || plan.daysPerWeek > 7) {
    errors.push('Days per week must be between 1 and 7');
  }

  if (plan.specialization && plan.specialization.length > 2) {
    errors.push('Maximum 2 muscle groups can be specialized');
  }

  return errors;
}
