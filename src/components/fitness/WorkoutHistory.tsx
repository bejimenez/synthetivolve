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
import type { WorkoutLogResponse, Exercise, MuscleGroup } from '@/lib/fitness.types';

interface WorkoutHistoryProps {
  selectedMesocycle?: string;
}

const WorkoutHistory: React.FC<WorkoutHistoryProps> = ({ selectedMesocycle }) => {
  const { workoutLogs, exercises, mesocycles } = useFitness();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMesocycle, setFilterMesocycle] = useState<string>(selectedMesocycle || 'ALL');
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set());

  const filteredWorkouts = workoutLogs.filter(workout => {
    const matchesSearch = searchTerm === '' || 
      workout.exercise_logs?.some((ex) => {
        const exercise = exercises.find(e => e.id === ex.exercise_id);
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

  const calculateWorkoutStats = (workout: WorkoutLogResponse) => {
    let totalVolume = 0;
    let totalSets = 0;
    let totalReps = 0;
    workout.exercise_logs?.forEach((ex) => {
      ex.set_logs?.forEach((set) => {
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

  const getWorkoutTitle = (workout: WorkoutLogResponse) => {
    if (workout.mesocycle_id && mesocycles.find(m => m.id === workout.mesocycle_id)) {
      const mesocycle = mesocycles.find(m => m.id === workout.mesocycle_id);
      return `${mesocycle?.name} - Week ${workout.week_number}, Day ${workout.day_number}`;
    }
    return 'Freestyle Workout';
  };

  const getUniqueExerciseCount = (workout: WorkoutLogResponse) => {
    return workout.exercise_logs?.length || 0;
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
          />
        </div>
        
        <Select value={filterMesocycle} onValueChange={setFilterMesocycle}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Workouts</SelectItem>
            <SelectItem value="FREESTYLE">Freestyle Only</SelectItem>
            {Object.values(mesocycles).map((meso) => (
              <SelectItem key={meso.id} value={meso.id}>
                {meso.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      {filteredWorkouts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{filteredWorkouts.length}</div>
              <div className="text-sm text-gray-600">Total Workouts</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 text-center">
              <Weight className="w-6 h-6 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">
                {filteredWorkouts.reduce((total, workout) => {
                  const stats = calculateWorkoutStats(workout);
                  return total + stats.totalVolume;
                }, 0).toFixed(0)}
              </div>
              <div className="text-sm text-gray-600">Total Volume (kg)</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 text-center">
              <Target className="w-6 h-6 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold">
                {filteredWorkouts.reduce((total, workout) => {
                  const stats = calculateWorkoutStats(workout);
                  return total + stats.totalSets;
                }, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Sets</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">
                {Math.round(filteredWorkouts.reduce((total, workout) => {
                  const stats = calculateWorkoutStats(workout);
                  return total + stats.totalVolume;
                }, 0) / filteredWorkouts.length) || 0}
              </div>
              <div className="text-sm text-gray-600">Avg Volume/Workout</div>
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
            <Card key={workoutKey}>
              <Collapsible open={isExpanded} onOpenChange={() => toggleWorkoutExpansion(workoutKey)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{getWorkoutTitle(workout)}</CardTitle>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-sm text-gray-600">
                            {formatDate(workout.created_at || '')} at {formatTime(workout.created_at || '')}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {getUniqueExerciseCount(workout)} exercises
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {stats.totalVolume.toFixed(0)} kg
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {!workout.mesocycle_id && (
                          <Badge variant="secondary" className="text-xs">
                            Freestyle
                          </Badge>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {(workout.log_data as { custom_goal_entry: string | null } | null)?.custom_goal_entry && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                        <p className="text-sm text-blue-800">
                          <strong>Goal:</strong> {(workout.log_data as { custom_goal_entry: string | null } | null)?.custom_goal_entry}
                        </p>
                      </div>
                    )}

                    <div className="space-y-4">
                      {workout.exercise_logs?.map((loggedExercise, exIndex: number) => {
                        const exercise = exercises.find(e => e.id === loggedExercise.exercise_id) as Exercise | undefined;
                        if (!exercise) return null;

                        const exerciseVolume = loggedExercise.set_logs.reduce(
                          (total: number, set: { weight: number, reps: number }) => total + (set.weight * set.reps), 0
                        );

                        return (
                          <div key={exIndex} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="font-medium">{exercise.name}</h4>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant="default" className="text-xs">
                                    {formatMuscleGroupName(exercise.primary_muscle_group as MuscleGroup)}
                                  </Badge>
                                  {exercise.secondary_muscle_groups.map((muscle: MuscleGroup) => (
                                    <Badge key={muscle} variant="outline" className="text-xs">
                                      {formatMuscleGroupName(muscle)}
                                    </Badge>
                                  ))}
                                  {loggedExercise.was_accessory && (
                                    <Badge variant="secondary" className="text-xs">
                                      Accessory
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">{exerciseVolume.toFixed(0)} kg</div>
                                <div className="text-sm text-gray-600">
                                  {loggedExercise.set_logs.length} sets
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="grid grid-cols-4 gap-2 text-xs font-medium text-gray-600">
                                <span>Weight</span>
                                <span>Reps</span>
                                <span>{exercise.use_rir_rpe ? 'RIR' : 'RPE'}</span>
                                <span>Volume</span>
                              </div>
                              {loggedExercise.set_logs.map((set: { weight: number, reps: number, rir: number | null, rpe: number | null }, setIndex: number) => (
                                <div key={setIndex} className="grid grid-cols-4 gap-2 text-sm">
                                  <span>{set.weight} kg</span>
                                  <span>{set.reps}</span>
                                  <span>
                                    {exercise.use_rir_rpe ? (set.rir || '-') : (set.rpe || '-')}
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
          <div className="text-gray-400 mb-4">
            <Calendar className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filterMesocycle !== 'ALL' ? 'No workouts found' : 'No workouts yet'}
          </h3>
          <p className="text-gray-600">
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
