import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Calendar, 
  Dumbbell, 
  TrendingUp, 
  Target, 
  Clock,
  Play,
  Plus,
  BookOpen,
  Award
} from 'lucide-react';
import { MesocyclePlan, WorkoutLog } from '../types';
import { StorageService } from '../lib/storage';
import { calculateWeeklyMuscleVolume, formatMuscleGroupName, MUSCLE_GROUPS } from '../lib/utils';

interface DashboardProps {
  onNavigate: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [currentMesocycle, setCurrentMesocycle] = useState<MesocyclePlan | null>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutLog[]>([]);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalVolume: 0,
    currentWeek: 1,
    currentDay: 1,
    weeklyProgress: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    // Load current mesocycle
    const currentMesocycleId = StorageService.getCurrentMesocycle();
    if (currentMesocycleId) {
      const mesocycle = StorageService.getMesocycleById(currentMesocycleId);
      setCurrentMesocycle(mesocycle);
    }

    // Load recent workouts
    const allWorkouts = StorageService.getAllWorkoutLogs();
    const recent = allWorkouts
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
    setRecentWorkouts(recent);

    // Calculate stats
    const totalWorkouts = allWorkouts.length;
    const totalVolume = allWorkouts.reduce((total, workout) => {
      return total + workout.exercises.reduce((workoutTotal, exercise) => {
        return workoutTotal + exercise.sets.reduce((setTotal, set) => {
          return setTotal + (set.weight * set.reps);
        }, 0);
      }, 0);
    }, 0);

    const currentWeek = StorageService.getCurrentWeek();
    const currentDay = StorageService.getCurrentDay();
    
    // Calculate weekly progress
    let weeklyProgress = 0;
    if (currentMesocycleId && mesocycle) {
      const completedDays = currentDay - 1;
      weeklyProgress = (completedDays / mesocycle.daysPerWeek) * 100;
    }

    setStats({
      totalWorkouts,
      totalVolume,
      currentWeek,
      currentDay,
      weeklyProgress
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getNextWorkout = () => {
    if (!currentMesocycle) return null;
    
    const nextDay = StorageService.getNextPlannedDay();
    if (!nextDay) return null;

    const dayPlan = currentMesocycle.days.find(d => d.day === nextDay.day);
    if (!dayPlan) return null;

    return {
      week: nextDay.week,
      day: nextDay.day,
      exerciseCount: dayPlan.exercises.length
    };
  };

  const nextWorkout = getNextWorkout();

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-2">Welcome to Synthetivolve</h1>
        <p className="text-blue-100">
          Your intelligent training companion for structured muscle building and strength development.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <Dumbbell className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{stats.totalWorkouts}</div>
            <div className="text-sm text-gray-600">Total Workouts</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{(stats.totalVolume / 1000).toFixed(1)}k</div>
            <div className="text-sm text-gray-600">Total Volume (kg)</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 text-center">
            <Calendar className="w-6 h-6 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">W{stats.currentWeek}</div>
            <div className="text-sm text-gray-600">Current Week</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 text-center">
            <Target className="w-6 h-6 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold">D{stats.currentDay}</div>
            <div className="text-sm text-gray-600">Current Day</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Mesocycle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Current Mesocycle</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentMesocycle ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-lg">{currentMesocycle.name}</h3>
                  <p className="text-sm text-gray-600">
                    Week {stats.currentWeek} of {currentMesocycle.weeks} • 
                    Day {stats.currentDay} of {currentMesocycle.daysPerWeek}
                  </p>
                </div>

                {currentMesocycle.goalStatement && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-sm text-blue-800">{currentMesocycle.goalStatement}</p>
                  </div>
                )}

                {currentMesocycle.specialization.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Specialization:</p>
                    <div className="flex flex-wrap gap-1">
                      {currentMesocycle.specialization.map(muscle => (
                        <Badge key={muscle} variant="default" className="text-xs">
                          {formatMuscleGroupName(muscle)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Weekly Progress</span>
                    <span className="text-sm text-gray-600">{stats.weeklyProgress.toFixed(0)}%</span>
                  </div>
                  <Progress value={stats.weeklyProgress} className="h-2" />
                </div>

                {nextWorkout && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-800">Next Workout</p>
                        <p className="text-xs text-green-600">
                          Week {nextWorkout.week}, Day {nextWorkout.day} • {nextWorkout.exerciseCount} exercises
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => onNavigate('workout')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Mesocycle</h3>
                <p className="text-gray-600 mb-4">Create a mesocycle to start structured training</p>
                <Button onClick={() => onNavigate('planner')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Mesocycle
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Workouts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Recent Workouts</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('history')}
              >
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentWorkouts.length > 0 ? (
              <div className="space-y-3">
                {recentWorkouts.map((workout, index) => {
                  const workoutVolume = workout.exercises.reduce((total, exercise) => {
                    return total + exercise.sets.reduce((setTotal, set) => {
                      return setTotal + (set.weight * set.reps);
                    }, 0);
                  }, 0);

                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">
                          {workout.mesocycleId ? `Week ${workout.week}, Day ${workout.day}` : 'Freestyle'}
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatDate(workout.date)} • {workout.exercises.length} exercises
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">{workoutVolume.toFixed(0)} kg</p>
                        <p className="text-xs text-gray-600">volume</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <Dumbbell className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Workouts Yet</h3>
                <p className="text-gray-600 mb-4">Start logging workouts to see your progress</p>
                <Button onClick={() => onNavigate('workout')}>
                  <Play className="w-4 h-4 mr-2" />
                  Start Workout
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              onClick={() => onNavigate('workout')}
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <Play className="w-6 h-6" />
              <span className="text-sm">Start Workout</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => onNavigate('planner')}
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <Calendar className="w-6 h-6" />
              <span className="text-sm">Plan Mesocycle</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => onNavigate('templates')}
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <BookOpen className="w-6 h-6" />
              <span className="text-sm">Browse Templates</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => onNavigate('history')}
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <Award className="w-6 h-6" />
              <span className="text-sm">View Progress</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

