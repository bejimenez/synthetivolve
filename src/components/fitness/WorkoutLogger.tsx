'use client'

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Play, Plus, Save, RotateCcw } from 'lucide-react';
import { useFitness } from '@/hooks/useFitness';
import ExerciseLogger from './ExerciseLogger';
import WorkoutSummary from './WorkoutSummary';
import { type MesocyclePlan as Mesocycle, type WorkoutLog, type LoggedExercise, type SetLog, type Exercise, type MuscleGroup, type DayPlan, exerciseRowToExercise } from '@/lib/fitness.types';

interface WorkoutLoggerProps {
  onWorkoutComplete?: (log: WorkoutLog) => void;
}

const WorkoutLogger: React.FC<WorkoutLoggerProps> = ({ onWorkoutComplete }) => {
  const { mesocycles, exercises: rawExercises } = useFitness();
  const [selectedMesocycle, setSelectedMesocycle] = useState<Mesocycle | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [workoutMode, setWorkoutMode] = useState<'planned' | 'freestyle' | null>(null);
  const [currentWorkout, setCurrentWorkout] = useState<Partial<WorkoutLog> | null>(null);
  const [loggedExercises, setLoggedExercises] = useState<LoggedExercise[]>([]);
  const [customGoal, setCustomGoal] = useState<string>('');
  const [showSummary, setShowSummary] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const allExercises = useMemo(() => {
    return rawExercises.reduce((acc, exRow) => {
      acc[exRow.id] = exerciseRowToExercise(exRow);
      return acc;
    }, {} as Record<string, Exercise>);
  }, [rawExercises]);

  const startPlannedWorkout = () => {
    if (!selectedMesocycle) return;

    const workout: Partial<WorkoutLog> = {
      mesocycle_id: selectedMesocycle.id, // Use mesocycle_id
      week_number: selectedWeek, // Use week_number
      day_number: selectedDay, // Use day_number
      workout_date: new Date().toISOString().split('T')[0], // Use workout_date
      started_at: new Date().toISOString(), // Use started_at
      exercises: [],
      custom_goal_entry: customGoal // Use custom_goal_entry
    };

    setCurrentWorkout(workout);
    setWorkoutMode('planned');
    setStartTime(new Date());
    setLoggedExercises([]);
  };

  const startFreestyleWorkout = () => {
    const workout: Partial<WorkoutLog> = {
      workout_date: new Date().toISOString().split('T')[0], // Use workout_date
      started_at: new Date().toISOString(), // Use started_at
      exercises: [],
      custom_goal_entry: customGoal // Use custom_goal_entry
    };

    setCurrentWorkout(workout);
    setWorkoutMode('freestyle');
    setStartTime(new Date());
    setLoggedExercises([]);
  };

  const getPlannedExercises = (): Exercise[] => {
    if (!selectedMesocycle || workoutMode !== 'planned') return [];
    
    const dayPlan = selectedMesocycle.days.find((d) => d.day_number === selectedDay); // Use day_number
    if (!dayPlan) return [];

    return dayPlan.exercises
      .map((dayExercise) => allExercises[dayExercise.exercise_id]) // Access exercise_id
      .filter(Boolean);
  };

  const handleExerciseUpdate = (exerciseId: string, sets: SetLog[]) => {
    const updatedExercises = loggedExercises.map(ex => 
      ex.exercise_id === exerciseId ? { ...ex, sets } : ex // Use exercise_id
    );

    if (!loggedExercises.find(ex => ex.exercise_id === exerciseId)) { // Use exercise_id
      updatedExercises.push({
        exercise_id: exerciseId, // Use exercise_id
        order_index: loggedExercises.length, // Assign an order index
        sets,
        replacedOriginal: false,
        wasAccessory: workoutMode === 'freestyle'
      });
    }

    setLoggedExercises(updatedExercises);
  };

  const completeWorkout = async () => {
    if (!currentWorkout) return;

    const completedWorkout: WorkoutLog = {
      ...currentWorkout,
      completed_at: new Date().toISOString(), // Set completed_at
      exercises: loggedExercises,
    } as WorkoutLog;

    // TODO: Call API to save workout log
    // await createWorkoutLog(completedWorkout);

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
        exercises={allExercises}
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
              existingSets={loggedExercises.find(ex => ex.exercise_id === exercise.id)?.sets || []} // Use exercise_id
              showPreviousData={true}
            />
          ))}

          {/* Accessory/Additional Exercises */}
          {loggedExercises
            .filter(ex => workoutMode === 'freestyle' || !plannedExercises.find(pe => pe.id === ex.exercise_id)) // Use exercise_id
            .map(loggedEx => {
              const exercise = allExercises[loggedEx.exercise_id]; // Use exercise_id
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
                    const mesocycleRow = mesocycles.find(m => m.id === value);
                    if (mesocycleRow) {
                        const planData = mesocycleRow.plan_data as { days?: DayPlan[], exerciseDB?: Record<string, Exercise> } | null;
                        const mesocycle: Mesocycle = {
                            id: mesocycleRow.id,
                            name: mesocycleRow.name,
                            weeks: mesocycleRow.weeks,
                            daysPerWeek: mesocycleRow.days_per_week,
                            specialization: mesocycleRow.specialization as MuscleGroup[],
                            goalStatement: mesocycleRow.goal_statement || undefined,
                            days: planData?.days || [],
                            exerciseDB: planData?.exerciseDB || {},
                        };
                        setSelectedMesocycle(mesocycle);
                    } else {
                        setSelectedMesocycle(null);
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
                        {Array.from({ length: selectedMesocycle.daysPerWeek }, (_, i) => i + 1).map((day: number) => (
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