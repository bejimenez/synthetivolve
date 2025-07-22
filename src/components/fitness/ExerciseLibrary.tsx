'use client'

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Search, Plus, Edit, Trash2, Check } from 'lucide-react';
import { useFitness } from '@/hooks/useFitness';
import { MUSCLE_GROUPS, formatMuscleGroupName } from '@/lib/fitness_utils';
import type { Exercise as FitnessExercise, MuscleGroup } from '@/lib/fitness.types';

interface ExerciseLibraryProps {
  onClose: () => void;
  onExerciseAdd: (exercise: FitnessExercise) => void;
  existingExercises: FitnessExercise[];
}

const ExerciseLibrary: React.FC<ExerciseLibraryProps> = ({ 
  onClose, 
  onExerciseAdd, 
  existingExercises 
}) => {
  const { exercises, createExercise, updateExercise, deleteExercise } = useFitness();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | 'ALL'>('ALL');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<FitnessExercise | null>(null);
  
  const [newExercise, setNewExercise] = useState<Partial<FitnessExercise>>({
    name: '',
    primary: 'CHEST',
    secondary: [],
    equipment: null,
    notes: null,
    useRIRRPE: true
  });

  const filteredExercises = exercises.filter(exercise => {
  const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase());
  const matchesMuscle = filterMuscle === 'ALL' || 
                       exercise.primary === filterMuscle ||
                       (exercise.secondary || []).includes(filterMuscle);
  return matchesSearch && matchesMuscle;
  });

  const resetForm = () => {
    setNewExercise({
      name: '',
      primary: 'CHEST',
      secondary: [],
      equipment: null,
      notes: null,
      useRIRRPE: true
    });
    setEditingExercise(null);
    setShowCreateForm(false);
  };

  const handleSubmitExercise = async () => {
    if (!newExercise.name || !newExercise.primary) return;

    if (editingExercise) {
      // Update existing exercise
      await updateExercise(editingExercise.id, {
        name: newExercise.name,
        primary: newExercise.primary,
        secondary: newExercise.secondary || [],
        equipment: newExercise.equipment || null,
        notes: newExercise.notes || null,
        useRIRRPE: newExercise.useRIRRPE ?? true
      });
    } else {
      // Create new exercise
      await createExercise({
        name: newExercise.name,
        primary: newExercise.primary,
        secondary: newExercise.secondary || [],
        equipment: newExercise.equipment || null,
        notes: newExercise.notes || null,
        useRIRRPE: newExercise.useRIRRPE ?? true
      });
    }
    
    resetForm();
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    if (window.confirm('Are you sure you want to delete this exercise? This cannot be undone.')) {
      await deleteExercise(exerciseId);
    }
  };

  const handleEditClick = (exercise: FitnessExercise) => {
    setEditingExercise(exercise);
    setNewExercise({
      name: exercise.name,
      primary: exercise.primary,
      secondary: exercise.secondary,
      equipment: exercise.equipment,
      notes: exercise.notes,
      useRIRRPE: exercise.useRIRRPE
    });
    setShowCreateForm(true);
  };

  // Update and Delete would be implemented here using the useFitness hook

  const handleSecondaryMuscleToggle = (muscle: MuscleGroup) => {
    const current = newExercise.secondary || [];
    const updated = current.includes(muscle)
      ? current.filter(m => m !== muscle)
      : [...current, muscle];
    
    setNewExercise(prev => ({ ...prev, secondary: updated }));
  };

  const isExerciseInMesocycle = (exerciseId: string) => {
    return existingExercises.some(ex => ex.id === exerciseId);
  };

  return (
    // 1. Main Dialog Container
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto 
                              bg-white dark:bg-gray-900 
                              border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100">
            Exercise Library
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filter with dark mode support */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 
                                  text-gray-400 dark:text-gray-500 w-4 h-4" />
                <Input
                  placeholder="Search exercises..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white dark:bg-gray-800 
                            border-gray-200 dark:border-gray-700
                            text-gray-900 dark:text-gray-100
                            placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>
            
            <Select value={filterMuscle} onValueChange={(value) => setFilterMuscle(value as MuscleGroup | 'ALL')}>
              <SelectTrigger className="w-full sm:w-48 
                                      bg-white dark:bg-gray-800 
                                      border-gray-200 dark:border-gray-700
                                      text-gray-900 dark:text-gray-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 
                                        border-gray-200 dark:border-gray-700">
                <SelectItem value="ALL" className="text-gray-900 dark:text-gray-100 
                                                  hover:bg-gray-100 dark:hover:bg-gray-700">
                  All Muscles
                </SelectItem>
                {MUSCLE_GROUPS.map(muscle => (
                  <SelectItem 
                    key={muscle} 
                    value={muscle}
                    className="text-gray-900 dark:text-gray-100 
                              hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {formatMuscleGroupName(muscle)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setShowCreateForm(true)}
              className="bg-white dark:bg-gray-800 
                        border-gray-200 dark:border-gray-700
                        text-gray-900 dark:text-gray-100
                        hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Exercise
            </Button>
          </div>

          {/* Create/Edit Form */}
          {showCreateForm && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="exerciseName">Exercise Name</Label>
                    <Input
                      id="exerciseName"
                      value={newExercise.name || ''}
                      onChange={(e) => setNewExercise(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Barbell Bench Press"
                    />
                  </div>

                  <div>
                    <Label htmlFor="equipment">Equipment</Label>
                    <Input
                      id="equipment"
                      value={newExercise.equipment || ''}
                      onChange={(e) => setNewExercise(prev => ({ ...prev, equipment: e.target.value }))}
                      placeholder="e.g., Barbell, Dumbbells"
                    />
                  </div>

                  <div>
                    <Label htmlFor="primaryMuscle">Primary Muscle Group</Label>
                    <Select
                      value={newExercise.primary || 'CHEST'}
                      onValueChange={(value) => setNewExercise(prev => ({ ...prev, primary: value as MuscleGroup }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MUSCLE_GROUPS.map(muscle => (
                          <SelectItem key={muscle} value={muscle}>
                            {formatMuscleGroupName(muscle)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="useRIRRPE"
                      checked={newExercise.useRIRRPE ?? true}
                      onCheckedChange={(checked) => setNewExercise(prev => ({ ...prev, useRIRRPE: checked }))}
                    />
                    <Label htmlFor="useRIRRPE">Use RIR/RPE (vs %1RM)</Label>
                  </div>
                </div>

                <div>
                  <Label>Secondary Muscle Groups</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {MUSCLE_GROUPS.filter(muscle => muscle !== newExercise.primary).map(muscle => (
                      <Badge
                        key={muscle}
                        variant={newExercise.secondary?.includes(muscle) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleSecondaryMuscleToggle(muscle)}
                      >
                        {formatMuscleGroupName(muscle)}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={newExercise.notes || ''}
                    onChange={(e) => setNewExercise(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional notes about this exercise..."
                    rows={2}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={resetForm}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSubmitExercise}>
                    {editingExercise ? 'Update' : 'Create'} Exercise
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Exercise List with improved dark mode hover states */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredExercises.map(exercise => (
              <div 
                key={exercise.id} 
                className="flex items-center justify-between p-3 rounded-lg 
                          border border-gray-200 dark:border-gray-700
                          bg-white dark:bg-gray-900
                          hover:bg-gray-50 dark:hover:bg-gray-800 
                          transition-colors duration-150"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {exercise.name}
                  </h3>
                  <div className="flex flex-wrap items-center space-x-1 mt-1">
                    <Badge variant="default" className="text-xs">
                      {formatMuscleGroupName(exercise.primary)}
                    </Badge>
                    {(exercise.secondary || []).map(muscle => (
                      <Badge key={muscle} variant="outline" className="text-xs">
                        {formatMuscleGroupName(muscle)}
                      </Badge>
                    ))}
                    {exercise.equipment && (
                      <Badge variant="outline" className="text-xs">
                        {exercise.equipment}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {exercise.useRIRRPE ? 'RIR/RPE' : '%1RM'}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex space-x-1 ml-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onExerciseAdd(exercise);
                      onClose();
                    }}
                    disabled={isExerciseInMesocycle(exercise.id)}
                    className="hover:bg-gray-100 dark:hover:bg-gray-700
                              border-gray-200 dark:border-gray-600"
                  >
                    {isExerciseInMesocycle(exercise.id) ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditClick(exercise)}
                    className="hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteExercise(exercise.id)}
                    className="text-red-500 hover:text-red-700 
                              dark:text-red-400 dark:hover:text-red-300
                              hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state with dark mode support */}
          {filteredExercises.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No exercises found matching your criteria.</p>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(true)}
                className="mt-2 
                          bg-white dark:bg-gray-800 
                          border-gray-200 dark:border-gray-700
                          text-gray-900 dark:text-gray-100
                          hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Exercise
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseLibrary;
