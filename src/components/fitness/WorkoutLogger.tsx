'use client'

import React, { useState, useMemo, useEffect } from 'react';
import { useFormDraft } from '@/hooks/useFormDraft';
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
import { type MesocyclePlan as Mesocycle, type WorkoutLog, type LoggedExercise, type SetLog, type Exercise } from '@/lib/fitness.types';
import ExerciseLibrary from './ExerciseLibrary';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useTabPersistence } from '@/hooks/useTabPersistence';

interface WorkoutLoggerProps {
  onWorkoutComplete?: (log: WorkoutLog) => void;
}

interface WorkoutLoggerDraft {
  selectedMesocycle: Mesocycle | null;
  selectedWeek: number;
  selectedDay: number;
  workoutMode: 'planned' | 'freestyle' | null;
  loggedExercises: LoggedExercise[];
  customGoal: string;
  startTime: string | null;
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
  const [showExerciseLibrary, setShowExerciseLibrary] = useState<boolean>(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);

  const { draft, saveDraft, clearDraft, isLoaded, hasDraft } = useFormDraft<WorkoutLoggerDraft>({
    key: 'workout-logger',
    persistToUrl: true,        // Enable URL persistence
    urlStateKey: 'workout',    // URL parameter name
  })

  const { setTab } = useTabPersistence()

  useEffect(() => {
  if (isLoaded && hasDraft) {
    // Auto-switch to fitness tab if workout is in progress
    setTab('fitness')
    setShowResumeDialog(true)
  }
}, [isLoaded, hasDraft, setTab])

  const resumeWorkout = () => {
    if (draft) {
      setSelectedMesocycle(draft.selectedMesocycle);
      setSelectedWeek(draft.selectedWeek);
      setSelectedDay(draft.selectedDay);
      setWorkoutMode(draft.workoutMode);
      setLoggedExercises(draft.loggedExercises);
      setCustomGoal(draft.customGoal);
      setStartTime(draft.startTime ? new Date(draft.startTime) : null);
      setCurrentWorkout({
        mesocycle_id: draft.selectedMesocycle?.id,
        week_number: draft.selectedWeek,
        day_number: draft.selectedDay,
        workout_date: new Date().toISOString().split('T')[0],
        started_at: draft.startTime,
        exercises: draft.loggedExercises,
        custom_goal_entry: draft.customGoal,
      });
    }
    setShowResumeDialog(false);
  };

  const discardDraft = () => {
    clearDraft();
    setShowResumeDialog(false);
  };

  useEffect(() => {
    if (workoutMode) {
      saveDraft({
        selectedMesocycle,
        selectedWeek,
        selectedDay,
        workoutMode,
        loggedExercises,
        customGoal,
        startTime: startTime?.toISOString() || null,
      });
    }
  }, [selectedMesocycle, selectedWeek, selectedDay, workoutMode, loggedExercises, customGoal, startTime, saveDraft]);

  const allExercises = useMemo(() => {
    return rawExercises.reduce((acc, ex) => {
      acc[ex.id] = ex;
      return acc;
    }, {} as Record<string, Exercise>);
  }, [rawExercises]);

  const startPlannedWorkout = () => {
    if (!selectedMesocycle) return;
    const newStartTime = new Date();
    setStartTime(newStartTime);
    const workout: Partial<WorkoutLog> = {
      mesocycle_id: selectedMesocycle.id,
      week_number: selectedWeek,
      day_number: selectedDay,
      workout_date: new Date().toISOString().split('T')[0],
      started_at: newStartTime.toISOString(),
      exercises: [],
      custom_goal_entry: customGoal,
    };

    setCurrentWorkout(workout);
    setWorkoutMode('planned');
    setLoggedExercises([]);
  };

  const startFreestyleWorkout = () => {
    const newStartTime = new Date();
    setStartTime(newStartTime);
    const workout: Partial<WorkoutLog> = {
      workout_date: new Date().toISOString().split('T')[0],
      started_at: newStartTime.toISOString(),
      exercises: [],
      custom_goal_entry: customGoal,
    };

    setCurrentWorkout(workout);
    setWorkoutMode('freestyle');
    setLoggedExercises([]);
  };

  const getPlannedExercises = (): Exercise[] => {
    if (!selectedMesocycle || workoutMode !== 'planned') return [];
    
    const dayPlan = selectedMesocycle.days.find((d) => d.day === selectedDay); // Use day
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
        replaced_original: false,
        was_accessory: workoutMode === 'freestyle'
      });
    }

    setLoggedExercises(updatedExercises);
  };

  // Function to handle adding an exercise from the library
const handleAddExercise = (exercise: Exercise) => {
  // Check if exercise is already logged
  if (loggedExercises.find(ex => ex.exercise_id === exercise.id)) {
    console.log('Exercise already added to workout');
    setShowExerciseLibrary(false);
    return;
  }

  // Calculate the next order index
  const nextOrderIndex = loggedExercises.length > 0 
    ? Math.max(...loggedExercises.map(ex => ex.order_index)) + 1 
    : 0;

  // Create a new logged exercise entry
  const newLoggedExercise: LoggedExercise = {
    exercise_id: exercise.id,
    order_index: nextOrderIndex,
    sets: [],
    was_accessory: workoutMode === 'freestyle' || !plannedExercises.some(pe => pe.id === exercise.id)
  };

  // Add to logged exercises
  setLoggedExercises(prev => [...prev, newLoggedExercise]);
  
  // Close the exercise library
  setShowExerciseLibrary(false);
  
  console.log(`Added exercise: ${exercise.name} to ${workoutMode} workout at order ${nextOrderIndex}`);
  };

  const completeWorkout = async () => {
    if (!currentWorkout) return;

    const completedWorkout: WorkoutLog = {
      ...currentWorkout as WorkoutLog,
      completed_at: new Date().toISOString(),
      exercises: loggedExercises,
      // Ensure all required properties are present, even if null/undefined from Partial
      id: currentWorkout?.id || '', // Placeholder, should be generated by DB
      user_id: '', // Placeholder, should be set by auth context
      created_at: currentWorkout?.created_at || new Date().toISOString(),
    };

    // TODO: Call API to save workout log
    // await createWorkoutLog(completedWorkout);

    setShowSummary(true);
    clearDraft();

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
    clearDraft();
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


  // Always define plannedExercises so it is available for all functions
  const plannedExercises = getPlannedExercises();

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
    return (
      <div className="space-y-6">
        {/* Workout Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div>
                {workoutMode === 'planned' ? (
                  <span className="dark:text-gray-100">
                    {selectedMesocycle?.name} - Week {selectedWeek}, Day {selectedDay}
                  </span>
                ) : (
                  <span className="dark:text-gray-100">Freestyle Workout</span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">{getWorkoutDuration()}</Badge>
                <Button variant="outline" onClick={cancelWorkout} className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={completeWorkout} className="dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90">
                  <Save className="w-4 h-4 mr-2" />
                  Complete
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          {customGoal && (
            <CardContent>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 dark:bg-blue-950/30 dark:border-blue-900">
                <p className="text-sm text-blue-800 dark:text-blue-300">
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
              if (!loggedEx.exercise_id) return null; // Handle null exercise_id
              const exercise = allExercises[loggedEx.exercise_id]; // Use exercise_id
              if (!exercise) return null;

              return (
                <ExerciseLogger
                  key={exercise.id}
                  exercise={exercise}
                  onUpdate={(sets) => handleExerciseUpdate(exercise.id, sets)}
                  existingSets={loggedEx.sets}
                  showPreviousData={true}
                  isAccessory={loggedEx.was_accessory}
                />
              );
            })}

          {/* Add Exercise Button */}
          <Card>
            <CardContent className="pt-6">
              <Button
                variant="outline"
                onClick={() => setShowExerciseLibrary(true)}
                className="w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Exercise
              </Button>
            </CardContent>
          </Card>
          {showExerciseLibrary && (
        <ExerciseLibrary
          onExerciseAdd={handleAddExercise}
          onClose={() => setShowExerciseLibrary(false)}
          existingExercises={loggedExercises
            .filter(ex => ex.exercise_id)
            .map(ex => allExercises[ex.exercise_id!])
            .filter(Boolean)}
        />
      )}
        </div>
      </div>
    );
  }

  // Workout Selection Screen
  return (
    <div className="space-y-6">
       <AlertDialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <AlertDialogContent className="dark:bg-gray-900 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-gray-100">Resume Workout?</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              You have an unfinished workout. Would you like to resume where you left off?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={discardDraft} className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700">
              Discard
            </AlertDialogCancel>
            <AlertDialogAction onClick={resumeWorkout} className="dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90">
              Resume
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Card className="dark:bg-gray-900 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Start Workout</CardTitle>
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
      <Card className="dark:bg-gray-900 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Continue Planned Mesocycle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mesocycles.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No mesocycles available. Create one first.</p>
          ) : (
            <>
              <div>
                <Label htmlFor="mesocycle">Select Mesocycle</Label>
                <Select
                  value={selectedMesocycle?.id || ''}
                  onValueChange={(value) => {
                    const mesocycleRow = mesocycles.find(m => m.id === value);
                    if (mesocycleRow) {
                        const mesocycle: Mesocycle = {
                            id: mesocycleRow.id,
                            name: mesocycleRow.name,
                            weeks: mesocycleRow.weeks,
                            daysPerWeek: mesocycleRow.daysPerWeek,
                            specialization: mesocycleRow.specialization,
                            goalStatement: mesocycleRow.goalStatement,
                            isTemplate: mesocycleRow.isTemplate,
                            days: mesocycleRow.days || [],
                            exerciseDB: mesocycleRow.exerciseDB || {},
                        };
                        setSelectedMesocycle(mesocycle);
                    } else {
                        setSelectedMesocycle(null);
                    }
                  }}
                >
                  <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                    <SelectValue placeholder="Choose a mesocycle" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    {mesocycles.map(mesocycle => (
                      <SelectItem key={mesocycle.id!} value={mesocycle.id!} className="dark:text-gray-100 dark:hover:bg-gray-700">
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
                      <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                        {Array.from({ length: selectedMesocycle.weeks }, (_, i) => i + 1).map(week => (
                          <SelectItem key={week} value={week.toString()} className="dark:text-gray-100 dark:hover:bg-gray-700">
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
                      <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                        {Array.from({ length: selectedMesocycle.daysPerWeek }, (_, i) => i + 1).map((day: number) => (
                          <SelectItem key={day} value={day.toString()} className="dark:text-gray-100 dark:hover:bg-gray-700">
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
                className="w-full dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Planned Workout
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Freestyle Workout Option */}
      <Card className="dark:bg-gray-900 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Freestyle Workout</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4 dark:text-gray-400">
            Start a workout from scratch without following a planned mesocycle.
          </p>
          <Button onClick={startFreestyleWorkout} variant="outline" className="w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700">
            <Play className="w-4 h-4 mr-2" />
            Start Freestyle Workout
          </Button>
        </CardContent>
      </Card>
      
    </div>
  );
};

export default WorkoutLogger;
