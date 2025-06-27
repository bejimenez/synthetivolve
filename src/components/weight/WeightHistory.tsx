'use client'

import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { useWeightEntries } from '@/hooks/useWeightEntries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Minus, Scale } from 'lucide-react'

// Calculate 7-day rolling average
function calculateRollingAverage(entries: Array<{ weight_lbs: number; entry_date: string }>, days: number = 7) {
  const sortedEntries = [...entries].sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime())
  
  return sortedEntries.map((entry, index) => {
    const startIndex = Math.max(0, index - days + 1)
    const relevantEntries = sortedEntries.slice(startIndex, index + 1)
    const average = relevantEntries.reduce((sum, e) => sum + e.weight_lbs, 0) / relevantEntries.length
    
    return {
      ...entry,
      rollingAverage: Number(average.toFixed(1)),
      date: format(parseISO(entry.entry_date), 'MMM dd'),
    }
  })
}

export function WeightHistory() {
  const { weightEntries, loading, error } = useWeightEntries()

  const chartData = useMemo(() => {
    if (!weightEntries.length) return []
    return calculateRollingAverage(weightEntries)
  }, [weightEntries])

  const stats = useMemo(() => {
    if (chartData.length < 2) return null

    const latest = chartData[chartData.length - 1]
    const previous = chartData[chartData.length - 2]
    const earliest = chartData[0]
    
    const recentChange = latest.weight_lbs - previous.weight_lbs
    const totalChange = latest.weight_lbs - earliest.weight_lbs
    const avgChange = totalChange / (chartData.length - 1)

    return {
      currentWeight: latest.weight_lbs,
      recentChange,
      totalChange,
      avgChange,
      entryCount: chartData.length,
    }
  }, [chartData])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Weight History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading weight history...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Weight History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!weightEntries.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Weight History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Scale className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No weight entries yet. Start by logging your first weight!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4" />
    if (change < 0) return <TrendingDown className="h-4 w-4" />
    return <Minus className="h-4 w-4" />
  }

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-red-600'
    if (change < 0) return 'text-green-600'
    return 'text-muted-foreground'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Weight History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.currentWeight}</p>
              <p className="text-sm text-muted-foreground">Current Weight</p>
            </div>
            <div className="text-center">
              <div className={`flex items-center justify-center gap-1 ${getTrendColor(stats.recentChange)}`}>
                {getTrendIcon(stats.recentChange)}
                <span className="font-bold">
                  {stats.recentChange > 0 ? '+' : ''}{stats.recentChange.toFixed(1)} lbs
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Recent Change</p>
            </div>
            <div className="text-center">
              <div className={`flex items-center justify-center gap-1 ${getTrendColor(stats.totalChange)}`}>
                {getTrendIcon(stats.totalChange)}
                <span className="font-bold">
                  {stats.totalChange > 0 ? '+' : ''}{stats.totalChange.toFixed(1)} lbs
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Total Change</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{stats.entryCount}</p>
              <p className="text-sm text-muted-foreground">Entries</p>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                axisLine={{ stroke: '#6B7280' }}
                tickLine={{ stroke: '#6B7280' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={['dataMin - 2', 'dataMax + 2']}
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                axisLine={{ stroke: '#6B7280' }}
                tickLine={{ stroke: '#6B7280' }}
              />
              <Tooltip 
                labelFormatter={(label) => `Date: ${label}`}
                formatter={(value: number, name: string) => [
                  `${value} lbs`,
                  name === 'weight_lbs' ? 'Daily Weight' : '7-Day Average'
                ]}
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  color: '#F3F4F6'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="weight_lbs" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ r: 5, fill: '#3B82F6', strokeWidth: 2, stroke: '#FFFFFF' }}
                activeDot={{ r: 6, fill: '#3B82F6', strokeWidth: 2, stroke: '#FFFFFF' }}
                name="weight_lbs"
              />
              {chartData.length >= 7 && (
                <Line 
                  type="monotone" 
                  dataKey="rollingAverage" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  strokeDasharray="8 4"
                  dot={false}
                  activeDot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#FFFFFF' }}
                  name="rollingAverage"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-1 bg-blue-500 rounded"></div>
            <span className="text-gray-300">Daily Weight</span>
          </div>
          {chartData.length >= 7 && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 bg-green-500 rounded border-dashed border-t-2"></div>
              <span className="text-gray-300">7-Day Average</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}