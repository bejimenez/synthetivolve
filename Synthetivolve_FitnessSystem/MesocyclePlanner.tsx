import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Plus, Save, Trash2 } from 'lucide-react';
import { MesocyclePlan, MuscleGroup, Exercise, DayPlan } from '../types';
import { MUSCLE_GROUPS, calculateWeeklyMuscleVolume, getMuscleGroupWarning, getWarningColor, formatMuscleGroupName, generateId, validateMesocyclePlan } from '../lib/utils';
import { StorageService } from '../lib/storage';
import ExerciseLibrary from './ExerciseLibrary';
import DayBuilder from './DayBuilder';

interface MesocyclePlannerProps {
  onSave?: (mesocycle: MesocyclePlan) => void;
  editingMesocycle?: MesocyclePlan | null;
}

const MesocyclePlanner: React.FC<MesocyclePlannerProps> = ({ onSave, editingMesocycle }) => {
  const [mesocycle, setMesocycle] = useState<Partial<MesocyclePlan>>({
    name: '',
    weeks: 4,
    daysPerWeek: 4,
    specialization: [],
    goalStatement: '',
    days: [],
    exerciseDB: {}
  });

  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (editingMesocycle) {
      setMesocycle(editingMesocycle);
    } else {
      // Initialize days based on daysPerWeek
      initializeDays();
    }
  }, [editingMesocycle]);

  useEffect(() => {
    initializeDays();
  }, [mesocycle.daysPerWeek]);

  const initializeDays = () => {
    if (!mesocycle.daysPerWeek) return;
    
    const days: DayPlan[] = [];
    for (let i = 1; i <= mesocycle.daysPerWeek; i++) {
      const existingDay = mesocycle.days?.find(d => d.day === i);
      days.push(existingDay || { day: i, exercises: [] });
    }
    
    setMesocycle(prev => ({ ...prev, days }));
  };

  const handleInputChange = (field: keyof MesocyclePlan, value: any) => {
    setMesocycle(prev => ({ ...prev, [field]: value }));
    
    // Clear errors when user makes changes
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
      // Replace the first specialization if already at max
      updated = [current[1], muscle];
    }
    
    handleInputChange('specialization', updated);
  };

  const handleExerciseAdd = (exercise: Exercise) => {
    const updatedDB = { ...mesocycle.exerciseDB, [exercise.id]: exercise };
    setMesocycle(prev => ({ ...prev, exerciseDB: updatedDB }));
  };

  const handleDayUpdate = (dayNumber: number, exerciseIds: string[]) => {
    const updatedDays = mesocycle.days?.map(day => 
      day.day === dayNumber ? { ...day, exercises: exerciseIds } : day
    ) || [];
    
    setMesocycle(prev => ({ ...prev, days: updatedDays }));
  };

  const calculateMuscleVolume = () => {
    if (!mesocycle.days || !mesocycle.exerciseDB) return {};
    
    const fullMesocycle = mesocycle as MesocyclePlan;
    return calculateWeeklyMuscleVolume(fullMesocycle);
  };

  const handleSave = () => {
    const validationErrors = validateMesocyclePlan(mesocycle);
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const completeMesocycle: MesocyclePlan = {
      id: mesocycle.id || generateId(),
      name: mesocycle.name!,
      weeks: mesocycle.weeks!,
      daysPerWeek: mesocycle.daysPerWeek!,
      specialization: mesocycle.specialization || [],
      goalStatement: mesocycle.goalStatement,
      days: mesocycle.days || [],
      exerciseDB: mesocycle.exerciseDB || {}
    };

    StorageService.saveMesocycle(completeMesocycle);
    
    if (onSave) {
      onSave(completeMesocycle);
    }
  };

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
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <ul className="text-red-600 text-sm space-y-1">
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
                      {day} {day === 1 ? 'day' : 'days'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Goal Statement (Optional)</Label>
            <Textarea
              value={mesocycle.goalStatement || ''}
              onChange={(e) => handleInputChange('goalStatement', e.target.value)}
              placeholder="Describe your goals for this mesocycle..."
              rows={3}
            />
          </div>

          <div>
            <Label>Specialization (Max 2 muscle groups)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {MUSCLE_GROUPS.map(muscle => (
                <Badge
                  key={muscle}
                  variant={mesocycle.specialization?.includes(muscle) ? "default" : "outline"}
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

      {/* Muscle Group Volume Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Muscle Group Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {MUSCLE_GROUPS.map(muscle => {
              const volume = muscleVolume[muscle] || 0;
              const isSpecialized = mesocycle.specialization?.includes(muscle) || false;
              const warning = getMuscleGroupWarning(volume, isSpecialized);
              const colorClass = getWarningColor(warning);
              
              return (
                <div key={muscle} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {formatMuscleGroupName(muscle)}
                      {isSpecialized && <span className="text-xs text-blue-600 ml-1">*</span>}
                    </span>
                    <span className="text-sm text-gray-600">{volume.toFixed(1)}</span>
                  </div>
                  <Progress 
                    value={Math.min(volume * 20, 100)} 
                    className="h-2"
                  />
                  <div className={`h-1 rounded ${colorClass}`} />
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-4">
            * Specialized muscle groups should have ≥3 sets/week
          </p>
        </CardContent>
      </Card>

      {/* Day Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Workout Days
            <Button
              onClick={() => setShowExerciseLibrary(true)}
              size="sm"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Exercise Library
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mesocycle.days?.map(day => (
              <DayBuilder
                key={day.day}
                day={day}
                exercises={Object.values(mesocycle.exerciseDB || {})}
                onUpdate={(exerciseIds) => handleDayUpdate(day.day, exerciseIds)}
                onExerciseLibraryOpen={() => setShowExerciseLibrary(true)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end space-x-2">
        <Button onClick={handleSave} className="flex items-center">
          <Save className="w-4 h-4 mr-2" />
          Save Mesocycle
        </Button>
      </div>

      {/* Exercise Library Modal */}
      {showExerciseLibrary && (
        <ExerciseLibrary
          onClose={() => setShowExerciseLibrary(false)}
          onExerciseAdd={handleExerciseAdd}
          existingExercises={Object.values(mesocycle.exerciseDB || {})}
        />
      )}
    </div>
  );
};

export default MesocyclePlanner;

