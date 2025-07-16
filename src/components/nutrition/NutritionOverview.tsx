// src/components/nutrition/NutritionOverview.tsx
'use client'

import { useMemo } from 'react'
import { useNutrition } from './NutritionDataProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export function NutritionOverview() {
  const { foodLogs } = useNutrition()

  const chartData = useMemo(() => {
    const totals = { protein: 0, carbs: 0, fat: 0 }
    const calorieSources: { name: string, value: number }[] = []

    foodLogs.forEach(log => {
      const factor = log.quantity / 100
      const protein = (log.food.protein_per_100g || 0) * factor
      const carbs = (log.food.carbs_per_100g || 0) * factor
      const fat = (log.food.fat_per_100g || 0) * factor
      
      totals.protein += protein
      totals.carbs += carbs
      totals.fat += fat

      const existingSource = calorieSources.find(s => s.name === log.food.description)
      const calories = (log.food.calories_per_100g || 0) * factor
      if (existingSource) {
        existingSource.value += calories
      } else {
        calorieSources.push({ name: log.food.description, value: calories })
      }
    })

    const macroData = [
      { name: 'Protein', value: Math.round(totals.protein) },
      { name: 'Carbs', value: Math.round(totals.carbs) },
      { name: 'Fat', value: Math.round(totals.fat) },
    ]

    return { macroData, calorieSources }
  }, [foodLogs])

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Macro Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.macroData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Calorie Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.calorieSources}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.calorieSources.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
