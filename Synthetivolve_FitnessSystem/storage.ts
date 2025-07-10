import { MesocyclePlan, Exercise, WorkoutLog } from '../types';

const STORAGE_KEYS = {
  MESOCYCLES: 'synthetivolve_mesocycles',
  EXERCISES: 'synthetivolve_exercises',
  WORKOUT_LOGS: 'synthetivolve_workout_logs',
  CURRENT_MESOCYCLE: 'synthetivolve_current_mesocycle',
  CURRENT_WEEK: 'synthetivolve_current_week',
  CURRENT_DAY: 'synthetivolve_current_day'
};

export class StorageService {
  // Mesocycle operations
  static saveMesocycle(mesocycle: MesocyclePlan): void {
    const mesocycles = this.getAllMesocycles();
    const existingIndex = mesocycles.findIndex(m => m.id === mesocycle.id);
    
    if (existingIndex >= 0) {
      mesocycles[existingIndex] = mesocycle;
    } else {
      mesocycles.push(mesocycle);
    }
    
    localStorage.setItem(STORAGE_KEYS.MESOCYCLES, JSON.stringify(mesocycles));
  }

  static getAllMesocycles(): MesocyclePlan[] {
    const stored = localStorage.getItem(STORAGE_KEYS.MESOCYCLES);
    return stored ? JSON.parse(stored) : [];
  }

  static getMesocycleById(id: string): MesocyclePlan | null {
    const mesocycles = this.getAllMesocycles();
    return mesocycles.find(m => m.id === id) || null;
  }

  static deleteMesocycle(id: string): void {
    const mesocycles = this.getAllMesocycles();
    const filtered = mesocycles.filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.MESOCYCLES, JSON.stringify(filtered));
  }

  // Exercise operations
  static saveExercise(exercise: Exercise): void {
    const exercises = this.getAllExercises();
    const existingIndex = exercises.findIndex(e => e.id === exercise.id);
    
    if (existingIndex >= 0) {
      exercises[existingIndex] = exercise;
    } else {
      exercises.push(exercise);
    }
    
    localStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(exercises));
  }

  static getAllExercises(): Exercise[] {
    const stored = localStorage.getItem(STORAGE_KEYS.EXERCISES);
    return stored ? JSON.parse(stored) : [];
  }

  static getExerciseById(id: string): Exercise | null {
    const exercises = this.getAllExercises();
    return exercises.find(e => e.id === id) || null;
  }

  static deleteExercise(id: string): void {
    const exercises = this.getAllExercises();
    const filtered = exercises.filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(filtered));
  }

  // Workout log operations
  static saveWorkoutLog(log: WorkoutLog): void {
    const logs = this.getAllWorkoutLogs();
    logs.push(log);
    localStorage.setItem(STORAGE_KEYS.WORKOUT_LOGS, JSON.stringify(logs));
  }

  static getAllWorkoutLogs(): WorkoutLog[] {
    const stored = localStorage.getItem(STORAGE_KEYS.WORKOUT_LOGS);
    return stored ? JSON.parse(stored) : [];
  }

  static getWorkoutLogsByMesocycle(mesocycleId: string): WorkoutLog[] {
    const logs = this.getAllWorkoutLogs();
    return logs.filter(log => log.mesocycleId === mesocycleId);
  }

  static getLastWorkoutForExercise(exerciseId: string): WorkoutLog | null {
    const logs = this.getAllWorkoutLogs();
    const exerciseLogs = logs.filter(log => 
      log.exercises.some(ex => ex.exerciseId === exerciseId)
    );
    
    if (exerciseLogs.length === 0) return null;
    
    // Sort by date and return the most recent
    exerciseLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return exerciseLogs[0];
  }

  // Current session tracking
  static setCurrentMesocycle(mesocycleId: string): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_MESOCYCLE, mesocycleId);
  }

  static getCurrentMesocycle(): string | null {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_MESOCYCLE);
  }

  static setCurrentWeek(week: number): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_WEEK, week.toString());
  }

  static getCurrentWeek(): number {
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_WEEK);
    return stored ? parseInt(stored, 10) : 1;
  }

  static setCurrentDay(day: number): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_DAY, day.toString());
  }

  static getCurrentDay(): number {
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_DAY);
    return stored ? parseInt(stored, 10) : 1;
  }

  // Progress tracking
  static getNextPlannedDay(): { week: number; day: number } | null {
    const currentMesocycleId = this.getCurrentMesocycle();
    if (!currentMesocycleId) return null;

    const mesocycle = this.getMesocycleById(currentMesocycleId);
    if (!mesocycle) return null;

    const currentWeek = this.getCurrentWeek();
    const currentDay = this.getCurrentDay();

    // Check if we need to advance to next day
    if (currentDay < mesocycle.daysPerWeek) {
      return { week: currentWeek, day: currentDay + 1 };
    }

    // Check if we need to advance to next week
    if (currentWeek < mesocycle.weeks) {
      return { week: currentWeek + 1, day: 1 };
    }

    // Mesocycle is complete
    return null;
  }

  // Data export/import
  static exportData(): string {
    const data = {
      mesocycles: this.getAllMesocycles(),
      exercises: this.getAllExercises(),
      workoutLogs: this.getAllWorkoutLogs(),
      currentMesocycle: this.getCurrentMesocycle(),
      currentWeek: this.getCurrentWeek(),
      currentDay: this.getCurrentDay()
    };
    
    return JSON.stringify(data, null, 2);
  }

  static importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.mesocycles) {
        localStorage.setItem(STORAGE_KEYS.MESOCYCLES, JSON.stringify(data.mesocycles));
      }
      
      if (data.exercises) {
        localStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(data.exercises));
      }
      
      if (data.workoutLogs) {
        localStorage.setItem(STORAGE_KEYS.WORKOUT_LOGS, JSON.stringify(data.workoutLogs));
      }
      
      if (data.currentMesocycle) {
        this.setCurrentMesocycle(data.currentMesocycle);
      }
      
      if (data.currentWeek) {
        this.setCurrentWeek(data.currentWeek);
      }
      
      if (data.currentDay) {
        this.setCurrentDay(data.currentDay);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  static clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}

