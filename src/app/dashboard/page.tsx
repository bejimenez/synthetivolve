// src/app/dashboard/page.tsx
'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { useProfile } from '@/hooks/useProfile'
import { WeightEntryForm } from '@/components/weight/WeightEntryForm'
import { WeightHistory } from '@/components/weight/WeightHistory'
import { ProfileSettings } from '@/components/profile/ProfileSettings'
import { EnhancedCalorieCalculator } from '@/components/calories/EnhancedCalorieCalculator'
import { GoalProgressWidget } from '@/components/goals/GoalProgressWidget'
import { GoalProgressChart } from '@/components/goals/GoalProgressChart'
import { GoalCreationForm } from '@/components/goals/GoalCreationForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { LogOut, Settings, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { ModeToggle } from '@/components/ui/mode-toggle'
import { CompactCalorieCalculator } from '@/components/calories/CompactCalorieCalculator'

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const { isProfileComplete } = useProfile()
  const [showProfileSettings, setShowProfileSettings] = useState(false)
  const [showGoalCreation, setShowGoalCreation] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">
                Health & Wellness Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <ModeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProfileSettings(!showProfileSettings)}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-blue-900 mb-2">
              Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
            </h2>
            <p className="text-gray-600">
              Track your health journey with personalized insights and recommendations.
            </p>
          </div>

          {/* Profile Completion Alert */}
          {!isProfileComplete && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Complete your profile settings below to unlock personalized calorie and macro recommendations.
              </AlertDescription>
            </Alert>
          )}

          {/* Goal Creation Form Modal */}
          {showGoalCreation && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <GoalCreationForm
                  onSuccess={() => setShowGoalCreation(false)}
                  onCancel={() => setShowGoalCreation(false)}
                />
              </div>
            </div>
          )}

          {/* Profile Settings Section (Conditional) */}
          {(showProfileSettings || !isProfileComplete) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ProfileSettings 
                onSuccess={() => {
                  setShowProfileSettings(false)
                }}
              />
              <EnhancedCalorieCalculator />
            </div>
          )}

          {/* Main Dashboard Content - Only show when profile is complete and not in settings mode - Improved 2x2 grid */}
          {/* Complete Profile Layout - Optimized 3-Row Layout */}
          {isProfileComplete && (
            <>
              {/* Row 1: Goal Progress + Weight Entry */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GoalProgressWidget
                  onCreateGoal={() => setShowGoalCreation(true)}
                />
                <WeightEntryForm />
              </div>

              {/* Row 2: Goal Chart + Weight History */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GoalProgressChart />
                <WeightHistory />
              </div>

              {/* Row 3: Compact Calorie Calculator (less vertical space) */}
              <CompactCalorieCalculator />
            </>
          )}

          {/* Show basic layout when profile incomplete but not in settings mode */}
          {!isProfileComplete && !showProfileSettings && (
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
          <Card>
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Nutrition Tracking</h3>
                  <p className="text-sm text-gray-600">
                    Log meals, track macros, and get adherence insights
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Smart Adjustments</h3>
                  <p className="text-sm text-gray-600">
                    Dynamic calorie adjustments based on your progress and adherence
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Fitness Integration</h3>
                  <p className="text-sm text-gray-600">
                    Plan workouts, track progress, and sync with wearable devices
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}