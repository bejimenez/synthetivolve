'use client'

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Copy, Trash2, Plus, Search, Calendar, Target } from 'lucide-react';
import type { MesocyclePlan as Mesocycle, MuscleGroup } from '@/lib/fitness.types';
import { formatMuscleGroupName } from '@/lib/fitness_utils';
import { useFitness } from '@/hooks/useFitness';

interface TemplateManagerProps {
  onSelectTemplate?: (template: Mesocycle) => void;
  onCreateNew?: () => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ 
  onSelectTemplate, 
  onCreateNew 
}) => {
  const { mesocycles } = useFitness();
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);

  const filteredTemplates: Mesocycle[] = mesocycles.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.goalStatement?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDuplicate = (template: Mesocycle) => {
    console.log("Duplicating template:", template.id);
  };

  const handleDelete = (templateId: string) => {
    console.log("Deleting template:", templateId);
    setShowDeleteDialog(null);
  };

  const getTemplateStats = (template: Mesocycle) => {
    const totalExercises = template.days.reduce((total, day) => total + day.exercises.length, 0);
    const uniqueExercises = new Set(template.days.flatMap(day => day.exercises.map(ex => ex.exercise_id))).size; // Access exercise_id
    
    return {
      totalExercises,
      uniqueExercises,
      totalDays: template.days.length
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex-1 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
            />
          </div>
        </div>
        
        {onCreateNew && (
          <Button onClick={onCreateNew} className="dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Create New
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => {
          const stats = getTemplateStats(template);
          
          return (
            <Card key={template.id} className="hover:shadow-lg transition-shadow dark:bg-gray-900 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg dark:text-gray-100">{template.name}</CardTitle>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                    <Calendar className="w-3 h-3 mr-1" />
                    {template.weeks}w
                  </Badge>
                  <Badge variant="outline" className="text-xs dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                    {template.daysPerWeek}d/week
                  </Badge>
                  <Badge variant="outline" className="text-xs dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                    {stats.uniqueExercises} exercises
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {template.goalStatement && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 dark:bg-blue-950/30 dark:border-blue-900">
                    <div className="flex items-start space-x-2">
                      <Target className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-800 dark:text-blue-300">{template.goalStatement}</p>
                    </div>
                  </div>
                )}

                {template.specialization.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Specialization:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.specialization.map(muscle => (
                        <Badge key={muscle} variant="default" className="text-xs">
                          {formatMuscleGroupName(muscle as MuscleGroup)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div>
                    <span className="font-medium">Total Days:</span>
                    <br />
                    {stats.totalDays}
                  </div>
                  <div>
                    <span className="font-medium">Exercises:</span>
                    <br />
                    {stats.uniqueExercises} unique
                  </div>
                </div>

                <div className="flex space-x-2">
                  {onSelectTemplate && (
                    <Button
                      onClick={() => onSelectTemplate(template)}
                      size="sm"
                      className="flex-1 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
                    >
                      Use Template
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => handleDuplicate(template)}
                    size="sm"
                    variant="outline"
                    className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    onClick={() => setShowDeleteDialog(template.id!)}
                    size="sm"
                    variant="outline"
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <Target className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {searchTerm ? 'No templates found' : 'No templates yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm 
              ? 'Try adjusting your search terms'
              : 'Create your first mesocycle template to get started'
            }
          </p>
          {onCreateNew && !searchTerm && (
            <Button onClick={onCreateNew} className="dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Template
            </Button>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <Dialog open={true} onOpenChange={() => setShowDeleteDialog(null)}>
          <DialogContent className="dark:bg-gray-900 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="dark:text-gray-100">Delete Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to delete this template? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(null)}
                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(showDeleteDialog)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default TemplateManager;
