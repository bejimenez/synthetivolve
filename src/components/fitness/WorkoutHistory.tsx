import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar, ChevronDown, ChevronUp, Filter, TrendingUp, Weight, Target } from 'lucide-react';
import { WorkoutLog, Exercise, MesocyclePlan } from '@/lib/fitness.types';
import { StorageService } from '../lib/storage'; // This will be replaced later
import { formatMuscleGroupName } from '@/lib/fitness_utils';

interface WorkoutHistoryProps {
  selectedMesocycle?: string;
}

const WorkoutHistory: React.FC<WorkoutHistoryProps> = ({ selectedMesocycle }) => {
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [exercises, setExercises] = useState<Record<string, Exercise>>({});
  const [mesocycles, setMesocycles] = useState<Record<string, MesocyclePlan>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMesocycle, setFilterMesocycle] = useState<string>(selectedMesocycle || 'ALL');
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const logs = StorageService.getAllWorkoutLogs();
    const allExercises = StorageService.getAllExercises();
    const allMesocycles = StorageService.getAllMesocycles();

    setWorkoutLogs(logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
    // Create exercise lookup
    const exerciseMap: Record<string, Exercise> = {};
    allExercises.forEach(ex => {
      exerciseMap[ex.id] = ex;
    });
    
    // Add exercises from mesocycles
    allMesocycles.forEach(meso => {
      Object.values(meso.exerciseDB).forEach(ex => {
        exerciseMap[ex.id] = ex;
      });
    });
    
    setExercises(exerciseMap);

    // Create mesocycle lookup
    const mesocycleMap: Record<string, MesocyclePlan> = {};
    allMesocycles.forEach(meso => {
      mesocycleMap[meso.id] = meso;
    });
    setMesocycles(mesocycleMap);
  };

  const filteredWorkouts = workoutLogs.filter(workout => {
    const matchesSearch = searchTerm === '' || 
      Object.values(workout.exercises).some(ex => {
        const exercise = exercises[ex.exerciseId];
        return exercise?.name.toLowerCase().includes(searchTerm.toLowerCase());
      });

    const matchesMesocycle = filterMesocycle === 'ALL' || 
      workout.mesocycleId === filterMesocycle ||
      (filterMesocycle === 'FREESTYLE' && !workout.mesocycleId);

    return matchesSearch && matchesMesocycle;
  });

  const toggleWorkoutExpansion = (workoutIndex: string) => {
    const newExpanded = new Set(expandedWorkouts);
    if (newExpanded.has(workoutIndex)) {
      newExpanded.delete(workoutIndex);
    } else {
      newExpanded.add(workoutIndex);
    }
    setExpandedWorkouts(newExpanded);
  };

  const calculateWorkoutStats = (workout: WorkoutLog) => {
    let totalVolume = 0;
    let totalSets = 0;
    let totalReps = 0;

    workout.exercises.forEach(ex => {
      ex.sets.forEach(set => {
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
    if (workout.mesocycleId && mesocycles[workout.mesocycleId]) {
      const mesocycle = mesocycles[workout.mesocycleId];
      return `${mesocycle.name} - Week ${workout.week}, Day ${workout.day}`;
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
          />
        </div>
        
        <Select value={filterMesocycle} onValueChange={setFilterMesocycle}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Workouts</SelectItem>
            <SelectItem value="FREESTYLE">Freestyle Only</SelectItem>
            {Object.values(mesocycles).map(meso => (
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
        {filteredWorkouts.map((workout, index) => {
          const workoutKey = `${workout.date}-${index}`;
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
                            {formatDate(workout.date)} at {formatTime(workout.date)}
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
                        {!workout.mesocycleId && (
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
                    {workout.customGoalEntry && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                        <p className="text-sm text-blue-800">
                          <strong>Goal:</strong> {workout.customGoalEntry}
                        </p>
                      </div>
                    )}

                    <div className="space-y-4">
                      {workout.exercises.map((loggedExercise, exIndex) => {
                        const exercise = exercises[loggedExercise.exerciseId];
                        if (!exercise) return null;

                        const exerciseVolume = loggedExercise.sets.reduce(
                          (total, set) => total + (set.weight * set.reps), 0
                        );

                        return (
                          <div key={exIndex} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="font-medium">{exercise.name}</h4>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant="default" className="text-xs">
                                    {formatMuscleGroupName(exercise.primary)}
                                  </Badge>
                                  {exercise.secondary.map(muscle => (
                                    <Badge key={muscle} variant="outline" className="text-xs">
                                      {formatMuscleGroupName(muscle)}
                                    </Badge>
                                  ))}
                                  {loggedExercise.wasAccessory && (
                                    <Badge variant="secondary" className="text-xs">
                                      Accessory
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">{exerciseVolume.toFixed(0)} kg</div>
                                <div className="text-sm text-gray-600">
                                  {loggedExercise.sets.length} sets
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="grid grid-cols-4 gap-2 text-xs font-medium text-gray-600">
                                <span>Weight</span>
                                <span>Reps</span>
                                <span>{exercise.useRIRRPE ? 'RIR' : 'RPE'}</span>
                                <span>Volume</span>
                              </div>
                              {loggedExercise.sets.map((set, setIndex) => (
                                <div key={setIndex} className="grid grid-cols-4 gap-2 text-sm">
                                  <span>{set.weight} kg</span>
                                  <span>{set.reps}</span>
                                  <span>
                                    {exercise.useRIRRPE ? (set.rir || '-') : (set.rpe || '-')}
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
