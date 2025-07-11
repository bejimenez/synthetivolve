import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GripVertical, X, Plus } from 'lucide-react';
import { DayPlan, Exercise } from '@/lib/fitness.types';
import { formatMuscleGroupName } from '@/lib/fitness_utils';

interface SortableExerciseItemProps {
  exercise: Exercise;
  onRemove: () => void;
}

const SortableExerciseItem: React.FC<SortableExerciseItemProps> = ({ exercise, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exercise.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
          
          <div className="flex-1">
            <div className="font-medium text-sm">{exercise.name}</div>
            <div className="flex items-center space-x-1 mt-1">
              <Badge variant="default" className="text-xs">
                {formatMuscleGroupName(exercise.primary)}
              </Badge>
              {exercise.secondary.map(muscle => (
                <Badge key={muscle} variant="outline" className="text-xs">
                  {formatMuscleGroupName(muscle)}
                </Badge>
              ))}
            </div>
            {exercise.equipment && (
              <div className="text-xs text-gray-500 mt-1">{exercise.equipment}</div>
            )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

interface DayBuilderProps {
  day: DayPlan;
  exercises: Exercise[];
  onUpdate: (exerciseIds: string[]) => void;
  onExerciseLibraryOpen: () => void;
}

const DayBuilder: React.FC<DayBuilderProps> = ({ 
  day, 
  exercises, 
  onUpdate, 
  onExerciseLibraryOpen 
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const dayExercises = day.exercises
    .map(exerciseId => exercises.find(ex => ex.id === exerciseId))
    .filter(Boolean) as Exercise[];

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = day.exercises.indexOf(active.id as string);
      const newIndex = day.exercises.indexOf(over?.id as string);
      
      const newOrder = arrayMove(day.exercises, oldIndex, newIndex);
      onUpdate(newOrder);
    }
  };

  const handleRemoveExercise = (exerciseId: string) => {
    const updatedExercises = day.exercises.filter(id => id !== exerciseId);
    onUpdate(updatedExercises);
  };

  const getDayName = (dayNumber: number): string => {
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return dayNames[dayNumber - 1] || `Day ${dayNumber}`;
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          {getDayName(day.day)}
          <Badge variant="outline" className="text-xs">
            {dayExercises.length} exercises
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={day.exercises}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2 min-h-[100px]">
              {dayExercises.length === 0 ? (
                <div className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-sm">No exercises added</p>
                  <p className="text-xs mt-1">Click "Add Exercise" to get started</p>
                </div>
              ) : (
                dayExercises.map(exercise => (
                  <SortableExerciseItem
                    key={exercise.id}
                    exercise={exercise}
                    onRemove={() => handleRemoveExercise(exercise.id)}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </DndContext>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onExerciseLibraryOpen}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Exercise
        </Button>
      </CardContent>
    </Card>
  );
};

export default DayBuilder;
