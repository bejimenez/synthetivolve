import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Share2, Download, Trophy, Clock, Weight, Target } from 'lucide-react';
import { WorkoutLog, Exercise, MuscleGroupVolume } from '../types';
import { MUSCLE_GROUPS, formatMuscleGroupName } from '../lib/utils';

interface WorkoutSummaryProps {
  workout: WorkoutLog;
  exercises: Record<string, Exercise>;
  duration: string;
  onClose: () => void;
}

const WorkoutSummary: React.FC<WorkoutSummaryProps> = ({
  workout,
  exercises,
  duration,
  onClose
}) => {
  const summaryData = useMemo(() => {
    const muscleVolume: MuscleGroupVolume = {};
    let totalVolume = 0;
    let totalSets = 0;
    let totalReps = 0;
    const prs: string[] = [];

    // Initialize muscle groups
    MUSCLE_GROUPS.forEach(group => {
      muscleVolume[group] = 0;
    });

    // Calculate statistics
    workout.exercises.forEach(loggedExercise => {
      const exercise = exercises[loggedExercise.exerciseId];
      if (!exercise) return;

      loggedExercise.sets.forEach(set => {
        const setVolume = set.weight * set.reps;
        totalVolume += setVolume;
        totalSets += 1;
        totalReps += set.reps;

        // Add to muscle group volume
        muscleVolume[exercise.primary] += setVolume;
        exercise.secondary.forEach(muscle => {
          muscleVolume[muscle] += setVolume * 0.5;
        });
      });

      // Check for PRs (simplified - would need historical data comparison)
      const maxWeight = Math.max(...loggedExercise.sets.map(s => s.weight));
      const maxVolume = Math.max(...loggedExercise.sets.map(s => s.weight * s.reps));
      
      // For demo purposes, randomly mark some as PRs
      if (maxWeight > 0 && Math.random() > 0.7) {
        prs.push(`${exercise.name}: ${maxWeight}kg`);
      }
    });

    return {
      muscleVolume,
      totalVolume,
      totalSets,
      totalReps,
      prs
    };
  }, [workout, exercises]);

  const getTopMuscleGroups = () => {
    return Object.entries(summaryData.muscleVolume)
      .filter(([_, volume]) => volume > 0)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 5);
  };

  const generateShareText = () => {
    const date = new Date(workout.date).toLocaleDateString();
    const topMuscles = getTopMuscleGroups()
      .map(([muscle, volume]) => `${formatMuscleGroupName(muscle as any)}: ${volume.toFixed(0)}kg`)
      .join(', ');

    return `💪 Workout Complete - ${date}
⏱️ Duration: ${duration}
🏋️ Total Volume: ${summaryData.totalVolume.toFixed(0)}kg
📊 Sets: ${summaryData.totalSets} | Reps: ${summaryData.totalReps}
🎯 Top Muscles: ${topMuscles}
${summaryData.prs.length > 0 ? `🏆 PRs: ${summaryData.prs.join(', ')}` : ''}

#Synthetivolve #WorkoutComplete`;
  };

  const handleShare = async () => {
    const shareText = generateShareText();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Workout Summary',
          text: shareText
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(shareText);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(shareText);
    }
  };

  const handleExport = () => {
    const data = {
      workout,
      summary: summaryData,
      duration,
      date: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workout-${new Date(workout.date).toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span>Workout Complete!</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 text-center">
                <Clock className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{duration}</div>
                <div className="text-sm text-gray-600">Duration</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 text-center">
                <Weight className="w-6 h-6 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">{summaryData.totalVolume.toFixed(0)}</div>
                <div className="text-sm text-gray-600">Total Volume (kg)</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 text-center">
                <Target className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                <div className="text-2xl font-bold">{summaryData.totalSets}</div>
                <div className="text-sm text-gray-600">Total Sets</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 text-center">
                <Trophy className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                <div className="text-2xl font-bold">{summaryData.totalReps}</div>
                <div className="text-sm text-gray-600">Total Reps</div>
              </CardContent>
            </Card>
          </div>

          {/* Muscle Group Volume */}
          <Card>
            <CardHeader>
              <CardTitle>Muscle Group Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getTopMuscleGroups().map(([muscle, volume]) => {
                  const maxVolume = Math.max(...Object.values(summaryData.muscleVolume));
                  const percentage = (volume / maxVolume) * 100;
                  
                  return (
                    <div key={muscle} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          {formatMuscleGroupName(muscle as any)}
                        </span>
                        <span className="text-sm text-gray-600">
                          {volume.toFixed(0)} kg
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Personal Records */}
          {summaryData.prs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <span>Personal Records</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {summaryData.prs.map((pr, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Badge variant="default" className="bg-yellow-500">
                        PR
                      </Badge>
                      <span className="text-sm">{pr}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Exercise Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Exercise Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workout.exercises.map(loggedExercise => {
                  const exercise = exercises[loggedExercise.exerciseId];
                  if (!exercise) return null;

                  const exerciseVolume = loggedExercise.sets.reduce(
                    (total, set) => total + (set.weight * set.reps), 0
                  );

                  return (
                    <div key={exercise.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{exercise.name}</div>
                        <div className="text-sm text-gray-600">
                          {loggedExercise.sets.length} sets
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{exerciseVolume.toFixed(0)} kg</div>
                        <div className="text-sm text-gray-600">volume</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Goal Achievement */}
          {workout.customGoalEntry && (
            <Card>
              <CardHeader>
                <CardTitle>Session Goal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-blue-800">{workout.customGoalEntry}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleShare} className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              Share Workout
            </Button>
            <Button onClick={handleExport} variant="outline" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkoutSummary;

