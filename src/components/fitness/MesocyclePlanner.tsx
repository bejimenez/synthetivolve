'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useFormDraft } from '@/hooks/useFormDraft';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Save } from 'lucide-react';
import { MesocyclePlan, MuscleGroup, Exercise, DayPlan } from '@/lib/fitness.types';
import { MUSCLE_GROUPS, calculateWeeklyMuscleVolume, getMuscleGroupWarning, getWarningColor, formatMuscleGroupName, validateMesocyclePlan } from '@/lib/fitness_utils';
import ExerciseLibrary from './ExerciseLibrary';
import DayBuilder from './DayBuilder';

interface MesocyclePlannerProps {
  onSave?: (mesocycle: MesocyclePlan) => void;
  editingMesocycle?: MesocyclePlan | null;
}

const defaultValues: Partial<MesocyclePlan> = {
  name: '',
  weeks: 4,
  daysPerWeek: 4,
  specialization: [],
  goalStatement: '',
  days: [],
  exerciseDB: {}
};

const MesocyclePlanner: React.FC<MesocyclePlannerProps> = ({ onSave, editingMesocycle }) => {
  const [mesocycle, setMesocycle] = useState<Partial<MesocyclePlan>>(defaultValues);
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false);
  const [selectedDayForExercise, setSelectedDayForExercise] = useState<number | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const draftKey = `mesocycle-planner-${editingMesocycle?.id || 'new'}`;
  const { draft, saveDraft, clearDraft, isLoaded } = useFormDraft<Partial<MesocyclePlan>>({
    key: draftKey,
    defaultValues,
  });

  const initializeDays = useCallback((daysPerWeek: number, existingDays?: DayPlan[]) => {
    if (!daysPerWeek) return [];

    // Check if existingDays already match the expected structure
    if (existingDays && existingDays.length === daysPerWeek &&
        existingDays.every((day, index) => day.day === index + 1)) {
      return existingDays; // Return the same instance if already correct
    }
    
    const days: DayPlan[] = [];
    for (let i = 1; i <= daysPerWeek; i++) {
      const existingDay = existingDays?.find(d => d.day === i);
      days.push(existingDay || { day: i, exercises: [] });
    }
    
    return days;
  }, []);

  useEffect(() => {
    if (editingMesocycle) {
      setMesocycle(editingMesocycle);
    } else if (isLoaded && draft) {
      setMesocycle(draft);
    }
  }, [editingMesocycle, isLoaded, draft]);

  useEffect(() => {
    if (mesocycle && Object.keys(mesocycle).length > 0 && mesocycle.name !== '') { // only save if there is some data
      saveDraft(mesocycle);
    }
  }, [mesocycle, saveDraft]);

  useEffect(() => {
    if (!editingMesocycle && mesocycle.daysPerWeek) {
      const newDays = initializeDays(mesocycle.daysPerWeek, mesocycle.days);
      setMesocycle(prev => ({ ...prev, days: newDays }));
    }
  }, [mesocycle.daysPerWeek, editingMesocycle, initializeDays, mesocycle.days]);

  const handleInputChange = (field: keyof MesocyclePlan, value: string | number | string[]) => {
    setMesocycle(prev => ({ ...prev, [field]: value }));
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSpecializationToggle = (muscle: MuscleGroup) => {
    const current = mesocycle.specialization || [];
    let updated: MuscleGroup[];
    
    if (current.includes(muscle)) {
      updated = current.filter(m => m !== muscle);
    } else if (current.length < 2) {
      updated = [...current, muscle];
    } else {
      updated = [current[1], muscle];
    }
    
    handleInputChange('specialization', updated);
  };

  const handleExerciseAdd = (exercise: Exercise) => {
    const updatedDB = { ...mesocycle.exerciseDB, [exercise.id]: exercise };

    let updatedDays = mesocycle.days;
    if (selectedDayForExercise !== null && updatedDays) {
      updatedDays = updatedDays.map(day =>
        day.day === selectedDayForExercise
          ? { ...day, exercises: [...day.exercises, { exercise_id: exercise.id, order_index: day.exercises.length }] }
          : day
      );
    }

    setMesocycle(prev => ({ ...prev, exerciseDB: updatedDB, days: updatedDays }));
    setShowExerciseLibrary(false);
    setSelectedDayForExercise(null);
  };

  const handleDayUpdate = (dayNumber: number, exercises: Array<{ exercise_id: string; order_index: number }>) => {
    const updatedDays = mesocycle.days?.map(day => 
      day.day === dayNumber ? { ...day, exercises: exercises } : day
    ) || [];
    
    setMesocycle(prev => ({ ...prev, days: updatedDays }));
  };

  const calculateMuscleVolume = () => {
    if (!mesocycle.days || !mesocycle.exerciseDB) return {};
    return calculateWeeklyMuscleVolume(mesocycle as MesocyclePlan);
  };

  const handleSave = async () => {
    const validationErrors = validateMesocyclePlan(mesocycle);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    const mesocycleToSave: MesocyclePlan = {
      name: mesocycle.name!,
      weeks: mesocycle.weeks!,
      daysPerWeek: mesocycle.daysPerWeek!,
      specialization: mesocycle.specialization || [],
      goalStatement: mesocycle.goalStatement || undefined,
      days: mesocycle.days || [],
      exerciseDB: mesocycle.exerciseDB || {},
    };

    if (onSave) {
      onSave(mesocycleToSave);
    }
    clearDraft();
  };

  const handleCancel = () => {
    clearDraft();
    window.history.back();
  }

  const muscleVolume = calculateMuscleVolume();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {editingMesocycle ? 'Edit Mesocycle' : 'Create New Mesocycle'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 dark:bg-red-950/30 dark:border-red-900">
              <ul className="text-red-600 text-sm space-y-1 dark:text-red-300">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Mesocycle Name</Label>
              <Input
                id="name"
                value={mesocycle.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Strength Block 1"
              />
            </div>

            <div>
              <Label htmlFor="weeks">Weeks (2-16)</Label>
              <Select
                value={mesocycle.weeks?.toString() || '4'}
                onValueChange={(value) => handleInputChange('weeks', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 15 }, (_, i) => i + 2).map(week => (
                    <SelectItem key={week} value={week.toString()}>
                      {week} weeks
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="daysPerWeek">Days per Week (1-7)</Label>
              <Select
                value={mesocycle.daysPerWeek?.toString() || '4'}
                onValueChange={(value) => handleInputChange('daysPerWeek', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 7 }, (_, i) => i + 1).map(day => (
                    <SelectItem key={day} value={day.toString()}>
                      {day} {day === 1 ? 'day' : 'days'} per week
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="goalStatement">Goal Statement</Label>
            <Textarea
              id="goalStatement"
              value={mesocycle.goalStatement || ''}
              onChange={(e) => handleInputChange('goalStatement', e.target.value)}
              placeholder="What do you want to focus on today?"
              rows={3}
            />
          </div>

          <div>
            <Label>Specialization (up to 2 muscle groups)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {MUSCLE_GROUPS.map(muscle => (
                <Badge
                  key={muscle}
                  variant={mesocycle.specialization?.includes(muscle) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleSpecializationToggle(muscle)}
                >
                  {formatMuscleGroupName(muscle)}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {mesocycle.daysPerWeek && mesocycle.days && (
        <Card>
          <CardHeader>
            <CardTitle>Training Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {mesocycle.days.map(day => (
                <DayBuilder
                  key={day.day}
                  day={day}
                  exercises={Object.values(mesocycle.exerciseDB || {})}
                  onUpdate={(exercises) => handleDayUpdate(day.day, exercises)}
                  onExerciseLibraryOpen={(dayNumber) => {
                    setShowExerciseLibrary(true);
                    setSelectedDayForExercise(dayNumber);
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {Object.keys(muscleVolume).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Volume Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(Object.entries(muscleVolume) as [string, number][]).map(([muscle, count]) => {
                const isSpecialized = mesocycle.specialization?.includes(muscle as MuscleGroup) ?? false;
                const warning = getMuscleGroupWarning(Number(count), isSpecialized);
                const color = getWarningColor(warning);
                
                return (
                  <div key={muscle} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {formatMuscleGroupName(muscle as MuscleGroup)}
                        </span>
                        {isSpecialized && (
                          <Badge variant="secondary" className="text-xs dark:bg-secondary/20 dark:text-secondary-foreground">
                            Specialized
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{count} sets/week</span>
                    </div>
                    <Progress
                      value={(Number(count) / 30) * 100}
                      className="h-2"
                      style={{ backgroundColor: `${color}20` }}
                    />
                    {warning && (
                      <p className="text-xs" style={{ color }}>
                        {warning}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={handleCancel}
        >
          Cancel
        </Button>
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Mesocycle
        </Button>
      </div>

      {showExerciseLibrary && (
        <ExerciseLibrary
          onClose={() => setShowExerciseLibrary(false)}
          onExerciseAdd={handleExerciseAdd}
          existingExercises={mesocycle.days?.find(day => day.day === selectedDayForExercise)?.exercises.map(ex => mesocycle.exerciseDB?.[ex.exercise_id]).filter(Boolean) as Exercise[] || []}
        />
      )}
    </div>
  );
};

export default MesocyclePlanner;
