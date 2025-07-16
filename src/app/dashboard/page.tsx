'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { FitnessOverview } from '@/components/fitness/dashboard/FitnessOverview'
import { NutritionOverview } from '@/components/nutrition/NutritionOverview'
import { WeightHistory } from '@/components/weight/WeightHistory'
import { CalorieCalculator } from '@/components/calories/CalorieCalculator'

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <FitnessOverview />
          <NutritionOverview />
        </div>
        <div className="space-y-6">
          <CalorieCalculator />
          <WeightHistory />
        </div>
      </div>
    </DashboardLayout>
  )
}
