// src/components/goals/GoalProgressChart.tsx
'use client'

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useGoals } from '@/hooks/useGoals'
import { useWeightEntries } from '@/hooks/useWeightEntries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TrendingDown, TrendingUp, Calendar, Info } from 'lucide-react'
import { format, startOfWeek, addWeeks, isAfter, isBefore, parseISO } from 'date-fns'

interface ChartDataPoint {
  week: string
  weekNumber: number
  expectedWeight: number
  actualWeight?: number
  isFuture: boolean
}

interface GoalProgressChartProps {
  className?: string
}

export function GoalProgressChart({ className }: GoalProgressChartProps) {
  const { activeGoal } = useGoals()
  const { weightEntries } = useWeightEntries()

  const chartData = useMemo((): ChartDataPoint[] => {
    if (!activeGoal) return []

    const startDate = parseISO(activeGoal.start_date)
    const endDate = parseISO(activeGoal.end_date!)
    const now = new Date()

    // Find the first Sunday on or after the goal start date
    const firstSunday = startOfWeek(startDate, { weekStartsOn: 0 }) // 0 = Sunday
    let effectiveStartSunday: Date
    if (isBefore(firstSunday, startDate)) {
      // If start date is after the first Sunday of that week, move to next Sunday
      const nextSunday = addWeeks(firstSunday, 1)
      effectiveStartSunday = nextSunday
    } else {
      effectiveStartSunday = firstSunday
    }

    // Calculate weekly expected progress
    const data: ChartDataPoint[] = []
    let currentSunday = effectiveStartSunday
    let weekNumber = 0

    // Calculate weekly weight change based on goal type
    let weeklyWeightChange = 0
    if (activeGoal.goal_type === 'fat_loss') {
      if (activeGoal.rate_type === 'absolute' && activeGoal.target_rate_lbs) {
        weeklyWeightChange = -activeGoal.target_rate_lbs
      } else if (activeGoal.rate_type === 'percentage' && activeGoal.target_rate_percent) {
        // Use start weight for percentage calculation
        weeklyWeightChange = -(activeGoal.start_weight * activeGoal.target_rate_percent) / 100
      }
    } else if (activeGoal.goal_type === 'muscle_gain') {
      // Assume ~0.5 lbs per week muscle gain
      weeklyWeightChange = 0.5
    }
    // maintenance = 0 change

    // Generate data points for each Sunday until goal end date
    while (isBefore(currentSunday, endDate) || currentSunday.getTime() === endDate.getTime()) {
      const expectedWeight = activeGoal.start_weight + (weeklyWeightChange * weekNumber)
      const weekLabel = format(currentSunday, 'MMM d')
      const isFuture = isAfter(currentSunday, now)

      // Find actual weight entry for this Sunday (or closest within the week)
      let actualWeight: number | undefined
      if (!isFuture) {
        // Look for weight entries within the week ending on this Sunday
        const weekStart = addWeeks(currentSunday, -1)
        const weekEntries = weightEntries.filter(entry => {
          const entryDate = parseISO(entry.entry_date)
          return isAfter(entryDate, weekStart) && 
                 (isBefore(entryDate, currentSunday) || entryDate.getTime() === currentSunday.getTime())
        })

        if (weekEntries.length > 0) {
          // Use the entry closest to Sunday (prefer Sunday itself)
          const sortedEntries = weekEntries.sort((a, b) => {
            const aDate = parseISO(a.entry_date)
            const bDate = parseISO(b.entry_date)
            const aDiff = Math.abs(currentSunday.getTime() - aDate.getTime())
            const bDiff = Math.abs(currentSunday.getTime() - bDate.getTime())
            return aDiff - bDiff
          })
          actualWeight = sortedEntries[0].weight_lbs
        }
      }

      data.push({
        week: weekLabel,
        weekNumber: weekNumber,
        expectedWeight: Math.round(expectedWeight * 10) / 10, // Round to 1 decimal
        actualWeight: actualWeight ? Math.round(actualWeight * 10) / 10 : undefined,
        isFuture
      })

      currentSunday = addWeeks(currentSunday, 1)
      weekNumber++
    }

    return data
  }, [activeGoal, weightEntries])

  const getNextSundayUpdate = () => {
    const now = new Date()
    const nextSunday = startOfWeek(addWeeks(now, 1), { weekStartsOn: 0 })
    return format(nextSunday, 'MMM d \'at 8:00 PM PST\'')
  }

  const getGoalTypeInfo = () => {
    if (!activeGoal) return null

    switch (activeGoal.goal_type) {
      case 'fat_loss':
        return {
          icon: TrendingDown,
          color: 'text-red-600',
          bgColor: 'bg-red-50 border-red-200',
          label: 'Fat Loss Goal'
        }
      case 'muscle_gain':
        return {
          icon: TrendingUp,
          color: 'text-green-600',
          bgColor: 'bg-green-50 border-green-200',
          label: 'Muscle Gain Goal'
        }
      case 'maintenance':
        return {
          icon: Calendar,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 border-blue-200',
          label: 'Maintenance Goal'
        }
      default:
        return null
    }
  }

  if (!activeGoal) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Goal Progress Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Set a goal to see your progress chart</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Goal Progress Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No chart data available for this goal</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const goalInfo = getGoalTypeInfo()
  const GoalIcon = goalInfo?.icon || TrendingDown
  const hasActualData = chartData.some(point => point.actualWeight !== undefined)

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GoalIcon className={`h-5 w-5 ${goalInfo?.color}`} />
            Weekly Progress Chart
          </CardTitle>
          <Badge className={goalInfo?.bgColor}>
            {goalInfo?.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chart */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="week" 
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                domain={['dataMin - 2', 'dataMax + 2']}
                className="text-xs"
                tick={{ fontSize: 12 }}
                label={{ value: 'Weight (lbs)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  `${value} lbs`,
                  name === 'expectedWeight' ? 'Expected' : 'Actual'
                ]}
                labelFormatter={(label) => `Week of ${label}`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px'
                }}
              />
              
              {/* Expected weight line - always visible */}
              <Line
                type="monotone"
                dataKey="expectedWeight"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#3b82f6', strokeWidth: 0, r: 3 }}
                name="Expected"
                connectNulls={false}
              />
              
              {/* Actual weight line - only shows where data exists */}
              {hasActualData && (
                <Line
                  type="monotone"
                  dataKey="actualWeight"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }}
                  name="Actual"
                  connectNulls={false}
                />
              )}

              {/* Starting weight reference line */}
              <ReferenceLine 
                y={activeGoal.start_weight} 
                stroke="#6b7280" 
                strokeDasharray="2 2"
                label={{ value: "Start", position: "right" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-blue-500 border-dashed border-t-2 border-blue-500"></div>
            <span>Expected Progress</span>
          </div>
          {hasActualData && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-green-500"></div>
              <span>Actual Progress</span>
            </div>
          )}
        </div>

        {/* Update Schedule Info */}
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Weekly Updates:</strong> This chart updates every Sunday at 8:00 PM PST with your latest weigh-ins. 
            Next update: {getNextSundayUpdate()}
          </AlertDescription>
        </Alert>

        {/* Mid-week start notice */}
        {(() => {
          const goalStartDate = parseISO(activeGoal.start_date)
          const goalStartDay = goalStartDate.getDay() // 0 = Sunday
          
          if (goalStartDay !== 0) {
            return (
              <Alert className="border-amber-200 bg-amber-50">
                <Calendar className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  Your goal started mid-week. The chart shows weekly progress starting from the first Sunday after your goal began.
                </AlertDescription>
              </Alert>
            )
          }
          return null
        })()}
      </CardContent>
    </Card>
  )
}