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
  onRemove: (exerciseId: string) => void;
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
      className="bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow dark:bg-gray-900 dark:border-gray-700"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded dark:hover:bg-gray-800"
          >
            <GripVertical className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          </div>
          
          <div className="flex-1">
            <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{exercise.name}</div>
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
              <div className="text-xs text-gray-500 mt-1 dark:text-gray-400">{exercise.equipment}</div>
            )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(exercise.id)}
          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
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
  onUpdate: (exercises: Array<{ exercise_id: string; order_index: number }>) => void; // Updated to pass objects
  onExerciseLibraryOpen: (dayNumber: number) => void;
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

  // Map day.exercises to include the full Exercise object for rendering
  const dayExercises = day.exercises
    .map(dayExercise => exercises.find(ex => ex.id === dayExercise.exercise_id))
    .filter(Boolean) as Exercise[];

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = day.exercises.findIndex(ex => ex.exercise_id === active.id);
      const newIndex = day.exercises.findIndex(ex => ex.exercise_id === over?.id);
      
      const newOrder = arrayMove(day.exercises, oldIndex, newIndex);
      onUpdate(newOrder); // Pass the updated array of objects
    }
  };

  const handleRemoveExercise = (exerciseId: string) => {
    const updatedExercises = day.exercises.filter(ex => ex.exercise_id !== exerciseId);
    onUpdate(updatedExercises); // Pass the updated array of objects
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
            items={day.exercises.map(ex => ex.exercise_id)} // Provide unique identifiers for dnd-kit
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2 min-h-[100px]">
              {dayExercises.length === 0 ? (
                <div className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-200 rounded-lg dark:text-gray-400 dark:border-gray-700">
                  <p className="text-sm">No exercises added</p>
                  <p className="text-xs mt-1">Click &quot;Add Exercise&quot; to get started</p>
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
          onClick={() => onExerciseLibraryOpen(day.day)}
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
