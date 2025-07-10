import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Copy, Edit, Trash2, Plus, Search, Calendar, Target } from 'lucide-react';
import { MesocyclePlan } from '../types';
import { StorageService } from '../lib/storage';
import { formatMuscleGroupName } from '../lib/utils';

interface TemplateManagerProps {
  onSelectTemplate?: (template: MesocyclePlan) => void;
  onCreateNew?: () => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ 
  onSelectTemplate, 
  onCreateNew 
}) => {
  const [templates, setTemplates] = useState<MesocyclePlan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    const stored = StorageService.getAllMesocycles();
    setTemplates(stored);
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.goalStatement?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDuplicate = (template: MesocyclePlan) => {
    const duplicated: MesocyclePlan = {
      ...template,
      id: Math.random().toString(36).substr(2, 9),
      name: `${template.name} (Copy)`
    };

    StorageService.saveMesocycle(duplicated);
    loadTemplates();
  };

  const handleDelete = (templateId: string) => {
    StorageService.deleteMesocycle(templateId);
    loadTemplates();
    setShowDeleteDialog(null);
  };

  const getTemplateStats = (template: MesocyclePlan) => {
    const totalExercises = template.days.reduce((total, day) => total + day.exercises.length, 0);
    const uniqueExercises = new Set(template.days.flatMap(day => day.exercises)).size;
    
    return {
      totalExercises,
      uniqueExercises,
      totalDays: template.days.length
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex-1 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        {onCreateNew && (
          <Button onClick={onCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            Create New
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => {
          const stats = getTemplateStats(template);
          
          return (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="w-3 h-3 mr-1" />
                    {template.weeks}w
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {template.daysPerWeek}d/week
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {stats.uniqueExercises} exercises
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {template.goalStatement && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <div className="flex items-start space-x-2">
                      <Target className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-800">{template.goalStatement}</p>
                    </div>
                  </div>
                )}

                {template.specialization.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Specialization:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.specialization.map(muscle => (
                        <Badge key={muscle} variant="default" className="text-xs">
                          {formatMuscleGroupName(muscle)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
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
                      className="flex-1"
                    >
                      Use Template
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => handleDuplicate(template)}
                    size="sm"
                    variant="outline"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    onClick={() => setShowDeleteDialog(template.id)}
                    size="sm"
                    variant="outline"
                    className="text-red-500 hover:text-red-700"
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
          <div className="text-gray-400 mb-4">
            <Target className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No templates found' : 'No templates yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm 
              ? 'Try adjusting your search terms'
              : 'Create your first mesocycle template to get started'
            }
          </p>
          {onCreateNew && !searchTerm && (
            <Button onClick={onCreateNew}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Template
            </Button>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <Dialog open={true} onOpenChange={() => setShowDeleteDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-600">
                Are you sure you want to delete this template? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(null)}
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

