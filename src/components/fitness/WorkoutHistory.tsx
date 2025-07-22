'use client'

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar, ChevronDown, ChevronUp, TrendingUp, Weight, Target } from 'lucide-react';
import { formatMuscleGroupName } from '@/lib/fitness_utils';
import { useFitness } from '@/hooks/useFitness';
import type { WorkoutLog, MuscleGroup, MesocyclePlan } from '@/lib/fitness.types';

interface WorkoutHistoryProps {
  selectedMesocycle?: string;
}

const WorkoutHistory: React.FC<WorkoutHistoryProps> = ({ selectedMesocycle }) => {
  const fitnessContext = useFitness();
  const workoutLogs: WorkoutLog[] = fitnessContext.workoutLogs;
  const exercises = fitnessContext.exercises;
  const mesocycles: MesocyclePlan[] = fitnessContext.mesocycles;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMesocycle, setFilterMesocycle] = useState<string>(selectedMesocycle || 'ALL');
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set());

  const filteredWorkouts = workoutLogs.filter(workout => {
  const matchesSearch = searchTerm === '' || 
    workout.exercises.some(loggedEx => {
      const exercise = exercises.find(e => e.id === loggedEx.exercise_id);
      return exercise?.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

  const matchesMesocycle = filterMesocycle === 'ALL' || 
    workout.mesocycle_id === filterMesocycle ||
    (filterMesocycle === 'FREESTYLE' && !workout.mesocycle_id);

  return matchesSearch && matchesMesocycle;
  });

  const toggleWorkoutExpansion = (workoutId: string) => {
    const newExpanded = new Set(expandedWorkouts);
    if (newExpanded.has(workoutId)) {
      newExpanded.delete(workoutId);
    } else {
      newExpanded.add(workoutId);
    }
    setExpandedWorkouts(newExpanded);
  };

  const calculateWorkoutStats = (workout: WorkoutLog) => {
    let totalVolume = 0;
    let totalSets = 0;
    let totalReps = 0;
    
    workout.exercises.forEach(loggedEx => {
      loggedEx.sets.forEach(set => {
        totalVolume += set.weight * set.reps;
        totalSets += 1;
        totalReps += set.reps;
      });
    });
    return { totalVolume, totalSets, totalReps };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getWorkoutTitle = (workout: WorkoutLog) => {
    if (workout.mesocycle_id && mesocycles.find(m => m.id === workout.mesocycle_id)) {
      const mesocycle = mesocycles.find(m => m.id === workout.mesocycle_id);
      return `${mesocycle?.name} - ${formatDate(workout.workout_date)}`;
    }
    return 'Freestyle Workout';
  };

  const getUniqueExerciseCount = (workout: WorkoutLog) => {
    return workout.exercises.length;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by exercise name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
          />
        </div>
        
        <Select value={filterMesocycle} onValueChange={setFilterMesocycle}>
          <SelectTrigger className="w-full sm:w-48 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
            <SelectItem value="ALL" className="dark:text-gray-100 dark:hover:bg-gray-700">All Workouts</SelectItem>
            <SelectItem value="FREESTYLE" className="dark:text-gray-100 dark:hover:bg-gray-700">Freestyle Only</SelectItem>
            {Object.values(mesocycles).map((meso) => (
              <SelectItem key={meso.id!} value={meso.id!} className="dark:text-gray-100 dark:hover:bg-gray-700">
                {meso.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      {filteredWorkouts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="dark:bg-gray-900 dark:border-gray-700">
            <CardContent className="pt-4 text-center">
              <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-500 dark:text-blue-400" />
              <div className="text-2xl font-bold dark:text-gray-100">{filteredWorkouts.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Workouts</div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-900 dark:border-gray-700">
            <CardContent className="pt-4 text-center">
              <Weight className="w-6 h-6 mx-auto mb-2 text-green-500 dark:text-green-400" />
              <div className="text-2xl font-bold dark:text-gray-100">
                {filteredWorkouts.reduce((total, workout) => {
                  const stats = calculateWorkoutStats(workout);
                  return total + stats.totalVolume;
                }, 0).toFixed(0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Volume (kg)</div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-900 dark:border-gray-700">
            <CardContent className="pt-4 text-center">
              <Target className="w-6 h-6 mx-auto mb-2 text-purple-500 dark:text-purple-400" />
              <div className="text-2xl font-bold dark:text-gray-100">
                {filteredWorkouts.reduce((total, workout) => {
                  const stats = calculateWorkoutStats(workout);
                  return total + stats.totalSets;
                }, 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Sets</div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-900 dark:border-gray-700">
            <CardContent className="pt-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-orange-500 dark:text-orange-400" />
              <div className="text-2xl font-bold dark:text-gray-100">
                {Math.round(filteredWorkouts.reduce((total, workout) => {
                  const stats = calculateWorkoutStats(workout);
                  return total + stats.totalVolume;
                }, 0) / filteredWorkouts.length) || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Volume/Workout</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Workout List */}
      <div className="space-y-4">
        {filteredWorkouts.map((workout) => {
          const workoutKey = workout.id;
          const isExpanded = expandedWorkouts.has(workoutKey);
          const stats = calculateWorkoutStats(workout);
          
          return (
            <Card key={workoutKey} className="dark:bg-gray-900 dark:border-gray-700">
              <Collapsible open={isExpanded} onOpenChange={() => toggleWorkoutExpansion(workoutKey)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors dark:hover:bg-gray-800">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg dark:text-gray-100">{getWorkoutTitle(workout)}</CardTitle>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(workout.workout_date)} at {formatTime(workout.started_at || '')}
                          </span>
                          <Badge variant="outline" className="text-xs dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                            {getUniqueExerciseCount(workout)} exercises
                          </Badge>
                          <Badge variant="outline" className="text-xs dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                            {stats.totalVolume.toFixed(0)} kg
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!workout.mesocycle_id && (
                          <Badge variant="secondary" className="text-xs dark:bg-secondary/20 dark:text-secondary-foreground">
                            Freestyle
                          </Badge>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 dark:text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 dark:text-gray-400" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {workout.custom_goal_entry && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4 dark:bg-blue-950/30 dark:border-blue-900">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                          <strong>Goal:</strong> {workout.custom_goal_entry}
                        </p>
                      </div>
                    )}
                    <div className="space-y-4">
                      {workout.exercises.map((loggedExercise, exIndex) => {
                        const exercise = exercises.find(e => e.id === loggedExercise.exercise_id);
                        if (!exercise) return null;
                        const exerciseVolume = loggedExercise.sets.reduce(
                          (total, set) => total + (set.weight * set.reps), 0
                        );
                        return (
                          <div key={exIndex} className="border rounded-lg p-4 dark:border-gray-700 dark:bg-gray-900">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="font-medium dark:text-gray-100">{exercise.name}</h4>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant="default" className="text-xs">
                                    {formatMuscleGroupName(exercise.primary as MuscleGroup)}
                                  </Badge>
                                  {exercise.secondary.map((muscle: string) => (
                                    <Badge key={muscle} variant="outline" className="text-xs dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                                      {formatMuscleGroupName(muscle as MuscleGroup)}
                                    </Badge>
                                  ))}
                                  {loggedExercise.was_accessory && (
                                    <Badge variant="secondary" className="text-xs dark:bg-secondary/20 dark:text-secondary-foreground">
                                      Accessory
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium dark:text-gray-100">{exerciseVolume.toFixed(0)} kg</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {loggedExercise.sets.length} sets
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="grid grid-cols-4 gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                                <span>Weight</span>
                                <span>Reps</span>
                                <span>{exercise.useRIRRPE ? 'RIR' : 'RPE'}</span>
                                <span>Volume</span>
                              </div>
                              {loggedExercise.sets.map((set, setIndex) => (
                                <div key={setIndex} className="grid grid-cols-4 gap-2 text-sm text-gray-900 dark:text-gray-100">
                                  <span>{set.weight} kg</span>
                                  <span>{set.reps}</span>
                                  <span>
                                    {exercise.useRIRRPE ? (set.rir ?? '-') : (set.rpe ?? '-')}
                                  </span>
                                  <span>{(set.weight * set.reps).toFixed(0)} kg</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {filteredWorkouts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <Calendar className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {searchTerm || filterMesocycle !== 'ALL' ? 'No workouts found' : 'No workouts yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || filterMesocycle !== 'ALL'
              ? 'Try adjusting your search or filter criteria'
              : 'Start logging workouts to see your history here'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default WorkoutHistory;
