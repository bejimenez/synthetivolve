// src/components/nutrition/NutritionOverview.tsx
'use client'

import { useMemo, useState, useEffect } from 'react'
import { useNutrition } from './NutritionDataProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export function NutritionOverview() {
  const { foodLogs } = useNutrition()

  const [chartColors, setChartColors] = useState({
    primary: '#000000',
    secondary: '#009900',
    chart1: '#0088FE',
    chart2: '#00C49F',
    chart3: '#FFBB28',
    chart4: '#FF8042',
    chart5: '#FF8042',
    popover: '#ffffff',
    popoverForeground: '#000000',
    border: '#e2e8f0',
  });

  useEffect(() => {
    const getResolvedColor = (variableName: string) => {
      const style = getComputedStyle(document.documentElement);
      const oklchValue = style.getPropertyValue(variableName);
      if (!oklchValue) return '#000';
      const tempEl = document.createElement('div');
      tempEl.style.color = `var(${variableName})`;
      document.body.appendChild(tempEl);
      const color = window.getComputedStyle(tempEl).color;
      document.body.removeChild(tempEl);
      return color;
    }

    const updateColors = () => {
      setChartColors({
        primary: getResolvedColor('--primary'),
        secondary: getResolvedColor('--secondary'),
        chart1: getResolvedColor('--chart-1'),
        chart2: getResolvedColor('--chart-2'),
        chart3: getResolvedColor('--chart-3'),
        chart4: getResolvedColor('--chart-4'),
        chart5: getResolvedColor('--chart-5'),
        popover: getResolvedColor('--popover'),
        popoverForeground: getResolvedColor('--popover-foreground'),
        border: getResolvedColor('--border'),
      });
    }

    updateColors();

    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

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

  const COLORS = [chartColors.chart1, chartColors.chart2, chartColors.chart3, chartColors.chart4, chartColors.chart5];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="dark:bg-gray-900 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Macro Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.macroData}>
              <XAxis dataKey="name" className="fill-muted-foreground text-xs" />
              <YAxis className="fill-muted-foreground text-xs" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: chartColors.popover,
                  border: `1px solid ${chartColors.border}`,
                  borderRadius: '0.5rem',
                  color: chartColors.popoverForeground
                }}
              />
              <Bar dataKey="value" fill={chartColors.primary} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="dark:bg-gray-900 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Calorie Sources</CardTitle>
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
                fill={chartColors.primary}
                dataKey="value"
              >
                {chartData.calorieSources.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: chartColors.popover,
                  border: `1px solid ${chartColors.border}`,
                  borderRadius: '0.5rem',
                  color: chartColors.popoverForeground
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}