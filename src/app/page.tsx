
'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { useProfile } from '@/hooks/useProfile'
import { WeightEntryForm } from '@/components/weight/WeightEntryForm'
import { WeightHistory } from '@/components/weight/WeightHistory'
import { GoalProgressWidget } from '@/components/goals/GoalProgressWidget'
import { GoalProgressChart } from '@/components/goals/GoalProgressChart'
import { GoalCreationForm } from '@/components/goals/GoalCreationForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CompactCalorieCalculator } from '@/components/calories/CompactCalorieCalculator'
import { FitnessOverview } from '@/components/fitness/dashboard/FitnessOverview'

export default function HomePage() {
  const { user } = useAuth()
  const { isProfileComplete } = useProfile()
  const [showGoalCreation, setShowGoalCreation] = useState(false)
  const router = useRouter()

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

      {/* Profile Completion Alert */}
      {!isProfileComplete && (
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-900">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            Complete your <Button variant="link" className="p-0 h-auto align-baseline text-amber-800 dark:text-amber-200" onClick={() => router.push('/profile')}>profile settings</Button> to unlock personalized calorie and macro recommendations.
          </AlertDescription>
        </Alert>
      )}

      {/* Goal Creation Form Modal */}
      {showGoalCreation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <GoalCreationForm
              onSuccess={() => setShowGoalCreation(false)}
              onCancel={() => setShowGoalCreation(false)}
            />
          </div>
        </div>
      )}

      {/* Main Dashboard Content - Only show when profile is complete */}
      {isProfileComplete && (
        <>
          {/* Row 1: Weight Entry + Weight History */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WeightEntryForm />
            <WeightHistory />
          </div>

          {/* Row 2: Goal Progress + Goal Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GoalProgressWidget
              onCreateGoal={() => setShowGoalCreation(true)}
            />
            <GoalProgressChart />
          </div>

          {/* Row 3: Compact Calorie Calculator (less vertical space) */}
          <CompactCalorieCalculator />

          {/* Row 4: Fitness Overview */}
          <FitnessOverview />
        </>
      )}

      {/* Show basic layout when profile incomplete */}
      {!isProfileComplete && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Weight Entry Form */}
          <div className="lg:col-span-1">
            <WeightEntryForm />
          </div>

          {/* Weight History Chart */}
          <div className="lg:col-span-2">
            <WeightHistory />
          </div>
        </div>
      )}

      {/* Coming Soon Section */}
      <Card className="dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="dark:text-white">Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 border rounded-lg dark:border-gray-700 dark:bg-gray-900">
              <h3 className="font-semibold mb-2 dark:text-white">Nutrition Tracking</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Log meals, track macros, and get adherence insights
              </p>
            </div>
            <div className="p-4 border rounded-lg dark:border-gray-700 dark:bg-gray-900">
              <h3 className="font-semibold mb-2 dark:text-white">Smart Adjustments</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Dynamic calorie adjustments based on your progress and adherence
              </p>
            </div>
            <div className="p-4 border rounded-lg dark:border-gray-700 dark:bg-gray-900">
              <h3 className="font-semibold mb-2 dark:text-white">Fitness Integration</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Plan workouts, track progress, and sync with wearable devices
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
