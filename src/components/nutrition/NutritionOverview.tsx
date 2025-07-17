'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { FoodLogWithFood, NutrientTotals } from '@/lib/nutrition.types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6B6B'];

export function NutritionOverview() {
  const [totals, setTotals] = useState<NutrientTotals>({
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
  });
  const [caloriesByFoodData, setCaloriesByFoodData] = useState<Array<{ name: string; value: number }>>([]);

  const fetchDailyLogs = useCallback(async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    try {
      const response = await fetch(`/api/nutrition?date=${today}`);
      if (!response.ok) {
        throw new Error('Failed to fetch food logs');
      }
      const data: FoodLogWithFood[] = await response.json();

      const calculatedTotals = data.reduce(
        (acc, log) => {
          const calories = log.quantity * (log.foods.calories_per_100g || 0) / 100;
          const protein = log.quantity * (log.foods.protein_per_100g || 0) / 100;
          const carbs = log.quantity * (log.foods.carbs_per_100g || 0) / 100;
          const fat = log.quantity * (log.foods.fat_per_100g || 0) / 100;
          const fiber = log.quantity * (log.foods.fiber_per_100g || 0) / 100;
          const sugar = log.quantity * (log.foods.sugar_per_100g || 0) / 100;
          const sodium = log.quantity * (log.foods.sodium_per_100g || 0) / 100;

          acc.calories += calories;
          acc.protein += protein;
          acc.carbs += carbs;
          acc.fat += fat;
          acc.fiber += fiber;
          acc.sugar += sugar;
          acc.sodium += sodium;
          return acc;
        },
        { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sugar: 0, sodium: 0 }
      );
      setTotals(calculatedTotals);

      const foodCaloriesMap = new Map<string, number>();
      data.forEach(log => {
        const calories = log.quantity * (log.foods.calories_per_100g || 0) / 100;
        foodCaloriesMap.set(log.foods.description, (foodCaloriesMap.get(log.foods.description) || 0) + calories);
      });
      setCaloriesByFoodData(Array.from(foodCaloriesMap.entries()).map(([name, value]) => ({ name, value })));

    } catch (error) {
      console.error('Error fetching daily logs for overview:', error);
      toast.error('Error', {
        description: 'Could not load nutrition overview data.',
      });
    }
  }, []);

  useEffect(() => {
    fetchDailyLogs();
  }, [fetchDailyLogs]);

  const macroData = [
    { name: 'Protein', grams: Math.round(totals.protein) },
    { name: 'Fat', grams: Math.round(totals.fat) },
    { name: 'Carbs', grams: Math.round(totals.carbs) },
  ];

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Daily Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Macro Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={macroData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="grams" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calories by Food</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={caloriesByFoodData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {caloriesByFoodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Micronutrients</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>Fiber: {Math.round(totals.fiber)} g</p>
            <p>Sugar: {Math.round(totals.sugar)} g</p>
            <p>Sodium: {Math.round(totals.sodium)} mg</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
