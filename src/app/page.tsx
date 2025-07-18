
'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { DashboardTabs } from '@/components/dashboard/DashboardTabs'
import { NutritionDataProvider } from '@/components/nutrition/NutritionDataProvider'

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-blue-900 dark:text-blue-300 mb-2">
          Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Track your health journey with personalized insights and recommendations.
        </p>
      </div>
      <NutritionDataProvider>
        <DashboardTabs />
      </NutritionDataProvider>
    </div>
  )
}
