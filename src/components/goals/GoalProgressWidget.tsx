// src/components/goals/GoalProgressWidget.tsx
'use client'

import { useMemo } from 'react'
import { useGoals } from '@/hooks/useGoals'
import { useWeightEntries } from '@/hooks/useWeightEntries'
import { calculateGoalProgress } from '@/lib/goal_calculations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Target, Calendar, TrendingDown, TrendingUp, Minus, CheckCircle2, AlertCircle } from 'lucide-react'

interface GoalProgressWidgetProps {
  onCreateGoal?: () => void
  onManageGoals?: () => void
}

export function GoalProgressWidget({ onCreateGoal, onManageGoals }: GoalProgressWidgetProps) {
  const { activeGoal, loading: goalLoading } = useGoals()
  const { weightEntries } = useWeightEntries()

  const currentWeight = weightEntries.length > 0
    ? weightEntries.sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime())[0].weight_lbs
    : null

  const progressData = useMemo(() => {
    if (!activeGoal || !currentWeight) return null
    return calculateGoalProgress(activeGoal, currentWeight)
  }, [activeGoal, currentWeight])

  const getGoalTypeDisplay = (goalType: string) => {
    switch (goalType) {
      case 'fat_loss':
        return { label: 'Fat Loss', icon: TrendingDown, color: 'bg-red-100 text-red-800 border-red-200' }
      case 'muscle_gain':
        return { label: 'Muscle Gain', icon: TrendingUp, color: 'bg-green-100 text-green-800 border-green-200' }
      case 'maintenance':
        return { label: 'Maintenance', icon: Minus, color: 'bg-blue-100 text-blue-800 border-blue-200' }
      default:
        return { label: goalType, icon: Target, color: 'bg-gray-100 text-gray-800 border-gray-200' }
    }
  }

  const getProgressStatus = () => {
    if (!progressData || progressData.onTrack === null) {
      return { icon: AlertCircle, color: 'text-gray-500', message: 'Need more data to assess progress' }
    }
    
    if (progressData.onTrack) {
      return { icon: CheckCircle2, color: 'text-green-600', message: 'On track with your goal' }
    } else {
      return { icon: AlertCircle, color: 'text-amber-600', message: 'Progress needs attention' }
    }
  }

  if (goalLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Current Goal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Loading goal...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!activeGoal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Current Goal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-center">
            No active goal set. Create a goal to get personalized calorie recommendations.
          </p>
          <div className="flex gap-2">
            <Button onClick={onCreateGoal} className="flex-1">
              Create Goal
            </Button>
            {onManageGoals && (
              <Button variant="outline" onClick={onManageGoals}>
                Manage Goals
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const goalDisplay = getGoalTypeDisplay(activeGoal.goal_type)
  const GoalIcon = goalDisplay.icon
  const progressStatus = getProgressStatus()
  const StatusIcon = progressStatus.icon

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Current Goal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Goal Type and Duration */}
        <div className="flex items-center justify-between">
          <Badge className={goalDisplay.color}>
            <GoalIcon className="h-3 w-3 mr-1" />
            {goalDisplay.label}
          </Badge>
          <div className="text-sm text-muted-foreground">
            {activeGoal.duration_weeks} weeks
          </div>
        </div>

        {/* Progress Bar */}
        {progressData && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progressData.progressPercent)}%</span>
            </div>
            <Progress value={progressData.progressPercent} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Started {new Date(activeGoal.start_date || '').toLocaleDateString()}</span>
            <span>Ends {new Date(activeGoal.end_date || '').toLocaleDateString()}</span>
            </div>
          </div>
        )}

        {/* Timeline */}
        {progressData && (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar className="h-4 w-4 text-gray-600" />
                <span className="font-semibold text-gray-900">{progressData.daysElapsed}</span>
              </div>
              <p className="text-xs text-gray-600">Days Completed</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-blue-900">{progressData.daysRemaining}</span>
              </div>
              <p className="text-xs text-blue-700">Days Remaining</p>
            </div>
          </div>
        )}

        {/* Weight Progress */}
        {progressData && progressData.currentWeightChange !== null && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Weight Progress</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Expected Change</p>
                <p className="font-semibold">
                  {progressData.expectedWeightChange > 0 ? '+' : ''}
                  {progressData.expectedWeightChange.toFixed(1)} lbs
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Actual Change</p>
                <p className="font-semibold">
                  {progressData.currentWeightChange > 0 ? '+' : ''}
                  {progressData.currentWeightChange.toFixed(1)} lbs
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Status */}
        <div className="flex items-center gap-2 text-sm">
          <StatusIcon className={`h-4 w-4 ${progressStatus.color}`} />
          <span className={progressStatus.color}>{progressStatus.message}</span>
        </div>

        {/* Goal Details */}
        <div className="space-y-2 text-sm border-t pt-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Start Weight:</span>
            <span className="font-medium">{activeGoal.start_weight} lbs</span>
          </div>
          
          {activeGoal.goal_type === 'fat_loss' && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Target Rate:</span>
              <span className="font-medium">
                {activeGoal.rate_type === 'absolute' 
                  ? `${activeGoal.target_rate_lbs} lbs/week`
                  : `${activeGoal.target_rate_percent}% bodyweight/week`
                }
              </span>
            </div>
          )}
          
          {activeGoal.goal_type === 'muscle_gain' && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Calorie Surplus:</span>
              <span className="font-medium">+{activeGoal.surplus_calories} cal/day</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onManageGoals && (
            <Button variant="outline" onClick={onManageGoals} className="flex-1">
              Manage Goals
            </Button>
          )}
          {onCreateGoal && (
            <Button variant="outline" onClick={onCreateGoal} size="sm">
              New Goal
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}