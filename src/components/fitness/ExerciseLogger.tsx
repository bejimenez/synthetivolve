'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Plus, Minus, ChevronDown, ChevronUp, History } from 'lucide-react';
import { Exercise, SetLog, WorkoutExercise, MuscleGroup } from '@/lib/fitness.types';
import { formatMuscleGroupName } from '@/lib/fitness_utils';
import { useFitness } from '@/hooks/useFitness';

interface ExerciseLoggerProps {
  exercise: Exercise;
  onUpdate: (sets: SetLog[]) => void;
  existingSets: SetLog[];
  showPreviousData?: boolean;
  isAccessory?: boolean;
}

const ExerciseLogger: React.FC<ExerciseLoggerProps> = ({
  exercise,
  onUpdate,
  existingSets,
  showPreviousData = true,
  isAccessory = false
}) => {
  const [sets, setSets] = useState<SetLog[]>(existingSets);
  const [showPrevious, setShowPrevious] = useState(false);
  const [previousWorkout, setPreviousWorkout] = useState<WorkoutExercise | null>(null);
  const { workoutLogs } = useFitness();

  useEffect(() => {
    setSets(existingSets);
  }, [existingSets]);

  useEffect(() => {
    if (showPreviousData) {
      const lastWorkout = workoutLogs
        .filter(log => log.exercises.some(ex => ex.exercise_id === exercise.id)) // Use exercise_id
        .sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0; // Treat null as very old
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0; // Treat null as very old
          return dateB - dateA;
        })[0];
      
      if (lastWorkout) {
        const exerciseData = lastWorkout.exercises.find(ex => ex.exercise_id === exercise.id); // Use exercise_id
        setPreviousWorkout(exerciseData || null);
      }
    }
  }, [exercise.id, showPreviousData, workoutLogs]);

  const addSet = () => {
    const newSet: Partial<SetLog> = {
      set_number: sets.length + 1,
      weight: 0,
      reps: 0,
      ...(exercise.use_rir_rpe ? { rir: 0 } : { rpe: 0 })
    };
    
    const updatedSets = [...sets, newSet as SetLog];
    setSets(updatedSets);
    onUpdate(updatedSets);
  };

  const removeSet = (index: number) => {
    const updatedSets = sets.filter((_, i) => i !== index);
    setSets(updatedSets);
    onUpdate(updatedSets);
  };

  const updateSet = (index: number, field: keyof SetLog, value: number | null) => {
    const updatedSets = sets.map((set, i) => 
      i === index ? { ...set, [field]: value } : set
    );
    setSets(updatedSets);
    onUpdate(updatedSets);
  };

  const copyFromPrevious = (setIndex: number) => {
    if (!previousWorkout || !previousWorkout.sets[setIndex]) return;
    
    const previousSet = previousWorkout.sets[setIndex];
    updateSet(setIndex, 'weight', previousSet.weight);
    updateSet(setIndex, 'reps', previousSet.reps);
    
    if (exercise.use_rir_rpe && previousSet.rir !== undefined) {
      updateSet(setIndex, 'rir', previousSet.rir);
    } else if (!exercise.use_rir_rpe && previousSet.rpe !== undefined) {
      updateSet(setIndex, 'rpe', previousSet.rpe);
    }
  };

  const calculateVolume = (): number => {
    return sets.reduce((total, set) => total + (set.weight * set.reps), 0);
  };

  return (
    <Card className={`${isAccessory ? 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{exercise.name}</span>
            {isAccessory && (
              <Badge variant="outline" className="text-xs">
                Accessory
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {showPreviousData && previousWorkout && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPrevious(!showPrevious)}
              >
                <History className="w-4 h-4 mr-1" />
                Previous
                {showPrevious ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
              </Button>
            )}
            
            <Badge variant="outline" className="text-xs">
              {calculateVolume().toFixed(0)} kg total
            </Badge>
          </div>
        </CardTitle>
        
        <div className="flex items-center space-x-2">
          <Badge variant="default" className="text-xs">
            {formatMuscleGroupName(exercise.primary_muscle_group as MuscleGroup)}
          </Badge>
          {exercise.secondary_muscle_groups.map((muscle) => (
            <Badge key={muscle} variant="outline" className="text-xs">
              {formatMuscleGroupName(muscle as MuscleGroup)}
            </Badge>
          ))}
          {exercise.equipment && (
            <Badge variant="outline" className="text-xs">
              {exercise.equipment}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            {exercise.use_rir_rpe ? 'RIR' : 'RPE'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Previous Workout Data */}
        {showPreviousData && previousWorkout && (
          <Collapsible open={showPrevious} onOpenChange={setShowPrevious}>
            <CollapsibleContent>
              <div className="bg-gray-50 border rounded-md p-3 mb-4 dark:bg-gray-900 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                  Previous Workout
                </h4>
                <div className="grid grid-cols-4 gap-2 text-xs text-gray-600 mb-2 dark:text-gray-400">
                  <span>Weight</span>
                  <span>Reps</span>
                  <span>{exercise.use_rir_rpe ? 'RIR' : 'RPE'}</span>
                  <span>Volume</span>
                </div>
                {(previousWorkout.sets as SetLog[]).map((set, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 text-sm text-gray-900 dark:text-gray-100">
                    <span>{set.weight} kg</span>
                    <span>{set.reps}</span>
                    <span>{exercise.use_rir_rpe ? set.rir || '-' : set.rpe || '-'}</span>
                    <span>{(set.weight * set.reps).toFixed(0)} kg</span>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Current Sets */}
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
            <span className="col-span-1">Set</span>
            <span className="col-span-3">Weight (kg)</span>
            <span className="col-span-2">Reps</span>
            <span className="col-span-2">{exercise.use_rir_rpe ? 'RIR' : 'RPE'}</span>
            <span className="col-span-2">Volume</span>
            <span className="col-span-2">Actions</span>
          </div>

          {sets.map((set, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-center">
              <span className="col-span-1 text-sm font-medium text-gray-900 dark:text-gray-100">{index + 1}</span>
              
              <div className="col-span-3">
                <Input
                  type="number"
                  value={set.weight || ''}
                  onChange={(e) => updateSet(index, 'weight', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="h-8"
                  step="0.5"
                  min="0"
                />
              </div>
              
              <div className="col-span-2">
                <Input
                  type="number"
                  value={set.reps || ''}
                  onChange={(e) => updateSet(index, 'reps', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="h-8"
                  min="0"
                />
              </div>
              
              <div className="col-span-2">
                <Input
                  type="number"
                  value={exercise.use_rir_rpe ? (set.rir || '') : (set.rpe || '')}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    updateSet(index, exercise.use_rir_rpe ? 'rir' : 'rpe', value);
                  }}
                  placeholder="0"
                  className="h-8"
                  min="0"
                  max={exercise.use_rir_rpe ? 10 : 10}
                />
              </div>
              
              <div className="col-span-2 text-sm text-gray-600 dark:text-gray-400">
                {(set.weight * set.reps).toFixed(0)} kg
              </div>
              
              <div className="col-span-2 flex space-x-1">
                {previousWorkout && previousWorkout.sets[index] && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyFromPrevious(index)}
                    className="h-8 px-2 text-xs"
                    title="Copy from previous workout"
                  >
                    Copy
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSet(index)}
                  className="h-8 px-2 text-red-500 hover:text-red-700"
                >
                  <Minus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}

          {sets.length === 0 && (
            <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg dark:text-gray-400 dark:border-gray-700">
              <p className="text-sm">No sets logged yet</p>
              <p className="text-xs mt-1">Click &quot;Add Set&quot; to start logging</p>
            </div>
          )}
        </div>

        {/* Add Set Button */}
        <Button
          onClick={addSet}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Set
        </Button>

        {/* Exercise Notes */}
        {exercise.notes && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 dark:bg-yellow-950/30 dark:border-yellow-900">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              <strong>Notes:</strong> {exercise.notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExerciseLogger;
