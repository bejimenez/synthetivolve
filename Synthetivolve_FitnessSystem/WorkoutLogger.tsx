import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Play, Plus, Save, RotateCcw } from 'lucide-react';
import { MesocyclePlan, WorkoutLog, LoggedExercise, SetLog, Exercise } from '../types';
import { StorageService } from '../lib/storage';
import { formatMuscleGroupName } from '../lib/utils';
import ExerciseLogger from './ExerciseLogger';
import WorkoutSummary from './WorkoutSummary';

interface WorkoutLoggerProps {
  onWorkoutComplete?: (log: WorkoutLog) => void;
}

const WorkoutLogger: React.FC<WorkoutLoggerProps> = ({ onWorkoutComplete }) => {
  const [mesocycles, setMesocycles] = useState<MesocyclePlan[]>([]);
  const [selectedMesocycle, setSelectedMesocycle] = useState<MesocyclePlan | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [workoutMode, setWorkoutMode] = useState<'planned' | 'freestyle' | null>(null);
  const [currentWorkout, setCurrentWorkout] = useState<Partial<WorkoutLog> | null>(null);
  const [loggedExercises, setLoggedExercises] = useState<LoggedExercise[]>([]);
  const [customGoal, setCustomGoal] = useState<string>('');
  const [showSummary, setShowSummary] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    loadMesocycles();
    loadCurrentSession();
  }, []);

  const loadMesocycles = () => {
    const stored = StorageService.getAllMesocycles();
    setMesocycles(stored);
    
    // Auto-load current mesocycle if available
    const currentMesocycleId = StorageService.getCurrentMesocycle();
    if (currentMesocycleId) {
      const current = stored.find(m => m.id === currentMesocycleId);
      if (current) {
        setSelectedMesocycle(current);
        setSelectedWeek(StorageService.getCurrentWeek());
        setSelectedDay(StorageService.getCurrentDay());
      }
    }
  };

  const loadCurrentSession = () => {
    // Check if there's an ongoing workout session
    const savedWorkout = localStorage.getItem('synthetivolve_current_workout');
    if (savedWorkout) {
      const workout = JSON.parse(savedWorkout);
      setCurrentWorkout(workout);
      setLoggedExercises(workout.exercises || []);
      setCustomGoal(workout.customGoalEntry || '');
      setWorkoutMode(workout.mesocycleId ? 'planned' : 'freestyle');
      setStartTime(new Date(workout.startTime));
    }
  };

  const startPlannedWorkout = () => {
    if (!selectedMesocycle) return;

    const nextDay = StorageService.getNextPlannedDay();
    if (nextDay) {
      setSelectedWeek(nextDay.week);
      setSelectedDay(nextDay.day);
    }

    const workout: Partial<WorkoutLog> = {
      mesocycleId: selectedMesocycle.id,
      week: selectedWeek,
      day: selectedDay,
      date: new Date().toISOString(),
      exercises: [],
      customGoalEntry: customGoal
    };

    setCurrentWorkout(workout);
    setWorkoutMode('planned');
    setStartTime(new Date());
    setLoggedExercises([]);

    // Save current session
    localStorage.setItem('synthetivolve_current_workout', JSON.stringify({
      ...workout,
      startTime: new Date().toISOString()
    }));
  };

  const startFreestyleWorkout = () => {
    const workout: Partial<WorkoutLog> = {
      date: new Date().toISOString(),
      exercises: [],
      customGoalEntry: customGoal
    };

    setCurrentWorkout(workout);
    setWorkoutMode('freestyle');
    setStartTime(new Date());
    setLoggedExercises([]);

    // Save current session
    localStorage.setItem('synthetivolve_current_workout', JSON.stringify({
      ...workout,
      startTime: new Date().toISOString()
    }));
  };

  const getPlannedExercises = (): Exercise[] => {
    if (!selectedMesocycle || workoutMode !== 'planned') return [];
    
    const dayPlan = selectedMesocycle.days.find(d => d.day === selectedDay);
    if (!dayPlan) return [];

    return dayPlan.exercises
      .map(exerciseId => selectedMesocycle.exerciseDB[exerciseId])
      .filter(Boolean);
  };

  const handleExerciseUpdate = (exerciseId: string, sets: SetLog[]) => {
    const updatedExercises = loggedExercises.map(ex => 
      ex.exerciseId === exerciseId ? { ...ex, sets } : ex
    );

    // If exercise doesn't exist, add it
    if (!loggedExercises.find(ex => ex.exerciseId === exerciseId)) {
      updatedExercises.push({
        exerciseId,
        sets,
        replacedOriginal: false,
        wasAccessory: workoutMode === 'freestyle'
      });
    }

    setLoggedExercises(updatedExercises);

    // Update current workout
    const updatedWorkout = {
      ...currentWorkout,
      exercises: updatedExercises,
      customGoalEntry: customGoal
    };
    setCurrentWorkout(updatedWorkout);

    // Save session
    localStorage.setItem('synthetivolve_current_workout', JSON.stringify({
      ...updatedWorkout,
      startTime: startTime?.toISOString()
    }));
  };

  const handleAddAccessoryExercise = (exercise: Exercise) => {
    const newLoggedExercise: LoggedExercise = {
      exerciseId: exercise.id,
      sets: [],
      replacedOriginal: false,
      wasAccessory: true
    };

    const updatedExercises = [...loggedExercises, newLoggedExercise];
    setLoggedExercises(updatedExercises);

    // Update mesocycle exercise DB if not already there
    if (selectedMesocycle && !selectedMesocycle.exerciseDB[exercise.id]) {
      const updatedMesocycle = {
        ...selectedMesocycle,
        exerciseDB: { ...selectedMesocycle.exerciseDB, [exercise.id]: exercise }
      };
      setSelectedMesocycle(updatedMesocycle);
      StorageService.saveMesocycle(updatedMesocycle);
    }
  };

  const completeWorkout = () => {
    if (!currentWorkout) return;

    const completedWorkout: WorkoutLog = {
      mesocycleId: currentWorkout.mesocycleId,
      week: currentWorkout.week,
      day: currentWorkout.day,
      date: currentWorkout.date!,
      exercises: loggedExercises,
      customGoalEntry: customGoal || undefined
    };

    // Save workout log
    StorageService.saveWorkoutLog(completedWorkout);

    // Update current session tracking for planned workouts
    if (workoutMode === 'planned' && selectedMesocycle) {
      const nextDay = StorageService.getNextPlannedDay();
      if (nextDay) {
        StorageService.setCurrentWeek(nextDay.week);
        StorageService.setCurrentDay(nextDay.day);
      }
    }

    // Clear current session
    localStorage.removeItem('synthetivolve_current_workout');

    // Show summary
    setShowSummary(true);

    if (onWorkoutComplete) {
      onWorkoutComplete(completedWorkout);
    }
  };

  const cancelWorkout = () => {
    setCurrentWorkout(null);
    setLoggedExercises([]);
    setWorkoutMode(null);
    setCustomGoal('');
    setStartTime(null);
    localStorage.removeItem('synthetivolve_current_workout');
  };

  const getWorkoutDuration = (): string => {
    if (!startTime) return '0:00';
    
    const now = new Date();
    const diff = now.getTime() - startTime.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return hours > 0 ? `${hours}:${remainingMinutes.toString().padStart(2, '0')}` : `${minutes}:00`;
  };

  if (showSummary && currentWorkout) {
    return (
      <WorkoutSummary
        workout={currentWorkout as WorkoutLog}
        exercises={selectedMesocycle?.exerciseDB || {}}
        duration={getWorkoutDuration()}
        onClose={() => {
          setShowSummary(false);
          setCurrentWorkout(null);
          setLoggedExercises([]);
          setWorkoutMode(null);
          setCustomGoal('');
          setStartTime(null);
        }}
      />
    );
  }

  if (currentWorkout && workoutMode) {
    const plannedExercises = getPlannedExercises();
    const allExercises = workoutMode === 'planned' 
      ? selectedMesocycle?.exerciseDB || {}
      : StorageService.getAllExercises().reduce((acc, ex) => ({ ...acc, [ex.id]: ex }), {});

    return (
      <div className="space-y-6">
        {/* Workout Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div>
                {workoutMode === 'planned' ? (
                  <span>
                    {selectedMesocycle?.name} - Week {selectedWeek}, Day {selectedDay}
                  </span>
                ) : (
                  <span>Freestyle Workout</span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline">{getWorkoutDuration()}</Badge>
                <Button variant="outline" onClick={cancelWorkout}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={completeWorkout}>
                  <Save className="w-4 h-4 mr-2" />
                  Complete
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          {customGoal && (
            <CardContent>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <strong>Goal:</strong> {customGoal}
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Exercise Logging */}
        <div className="space-y-4">
          {workoutMode === 'planned' && plannedExercises.map(exercise => (
            <ExerciseLogger
              key={exercise.id}
              exercise={exercise}
              onUpdate={(sets) => handleExerciseUpdate(exercise.id, sets)}
              existingSets={loggedExercises.find(ex => ex.exerciseId === exercise.id)?.sets || []}
              showPreviousData={true}
            />
          ))}

          {/* Accessory/Additional Exercises */}
          {loggedExercises
            .filter(ex => workoutMode === 'freestyle' || !plannedExercises.find(pe => pe.id === ex.exerciseId))
            .map(loggedEx => {
              const exercise = allExercises[loggedEx.exerciseId];
              if (!exercise) return null;

              return (
                <ExerciseLogger
                  key={exercise.id}
                  exercise={exercise}
                  onUpdate={(sets) => handleExerciseUpdate(exercise.id, sets)}
                  existingSets={loggedEx.sets}
                  showPreviousData={true}
                  isAccessory={loggedEx.wasAccessory}
                />
              );
            })}

          {/* Add Exercise Button */}
          <Card>
            <CardContent className="pt-6">
              <Button
                variant="outline"
                onClick={() => {
                  // This would open the exercise library
                  // For now, we'll implement a simple version
                }}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Exercise
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Workout Selection Screen
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Start Workout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="customGoal">Session Goal (Optional)</Label>
            <Textarea
              id="customGoal"
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              placeholder="What do you want to focus on today?"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Planned Workout Option */}
      <Card>
        <CardHeader>
          <CardTitle>Continue Planned Mesocycle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mesocycles.length === 0 ? (
            <p className="text-gray-500">No mesocycles available. Create one first.</p>
          ) : (
            <>
              <div>
                <Label htmlFor="mesocycle">Select Mesocycle</Label>
                <Select
                  value={selectedMesocycle?.id || ''}
                  onValueChange={(value) => {
                    const mesocycle = mesocycles.find(m => m.id === value);
                    setSelectedMesocycle(mesocycle || null);
                    if (mesocycle) {
                      StorageService.setCurrentMesocycle(mesocycle.id);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a mesocycle" />
                  </SelectTrigger>
                  <SelectContent>
                    {mesocycles.map(mesocycle => (
                      <SelectItem key={mesocycle.id} value={mesocycle.id}>
                        {mesocycle.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedMesocycle && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="week">Week</Label>
                    <Select
                      value={selectedWeek.toString()}
                      onValueChange={(value) => setSelectedWeek(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: selectedMesocycle.weeks }, (_, i) => i + 1).map(week => (
                          <SelectItem key={week} value={week.toString()}>
                            Week {week}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="day">Day</Label>
                    <Select
                      value={selectedDay.toString()}
                      onValueChange={(value) => setSelectedDay(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: selectedMesocycle.daysPerWeek }, (_, i) => i + 1).map(day => (
                          <SelectItem key={day} value={day.toString()}>
                            Day {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <Button
                onClick={startPlannedWorkout}
                disabled={!selectedMesocycle}
                className="w-full"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Planned Workout
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Freestyle Workout Option */}
      <Card>
        <CardHeader>
          <CardTitle>Freestyle Workout</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Start a workout from scratch without following a planned mesocycle.
          </p>
          <Button onClick={startFreestyleWorkout} variant="outline" className="w-full">
            <Play className="w-4 h-4 mr-2" />
            Start Freestyle Workout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkoutLogger;

