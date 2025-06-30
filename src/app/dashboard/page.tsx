// src/app/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import { useProfile } from '@/hooks/useProfile'
import type { User } from '@supabase/supabase-js'
import { ProfileSettings } from '@/components/profile/ProfileSettings'
import { WeightEntryForm } from '@/components/weight/WeightEntryForm'
import { WeightHistory } from '@/components/weight/WeightHistory'
import { EnhancedCalorieCalculator } from '@/components/calories/EnhancedCalorieCalculator'
import { GoalProgressWidget } from '@/components/goals/GoalProgressWidget'
import { GoalCreationForm } from '@/components/goals/GoalCreationForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Settings } from 'lucide-react'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const { isProfileComplete } = useProfile()
  const [showProfileSettings, setShowProfileSettings] = useState(false)
  const [showGoalCreation, setShowGoalCreation] = useState(false)

  const supabase = createSupabaseClient()

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) {
          console.error('Error getting user:', error)
          return
        }
        setUser(user)
      } catch (error) {
        console.error('Error in getUser:', error)
      } finally {
        setUserLoading(false)
      }
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: import('@supabase/auth-js').AuthChangeEvent, session: import('@supabase/auth-js').Session | null) => {
      setUser(session?.user ?? null)
      setUserLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Please sign in to access your dashboard.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Dashboard
              </h1>
              <h2 className="text-xl text-gray-600">
                Welcome back{user.email ? `, ${user.email.split('@')[0]}` : ''}!
              </h2>
              <p className="text-gray-600">
                Track your health journey with personalized insights and recommendations.
              </p>
            </div>

            {/* Settings Button */}
            <Button
              variant="outline"
              onClick={() => setShowProfileSettings(true)}
              className="sm:self-start"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>

          {/* Profile Completion Alert */}
          {!isProfileComplete && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Complete your profile settings to unlock personalized calorie and macro recommendations.
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

          {/* Profile Settings Modal */}
          {showProfileSettings && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <ProfileSettings 
                    onSuccess={() => setShowProfileSettings(false)}
                  />
                  <div className="flex justify-end mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setShowProfileSettings(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Dashboard Grid */}
          {isProfileComplete ? (
            <>
              {/* Top Row: Goal Progress and Weight Entry */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <GoalProgressWidget
                  onCreateGoal={() => setShowGoalCreation(true)}
                />
                <WeightEntryForm />
              </div>

              {/* Middle Row: Weight History */}
              <WeightHistory />

              {/* Bottom Row: Calorie Calculator */}
              <EnhancedCalorieCalculator />
            </>
          ) : (
            /* Profile Incomplete Layout */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ProfileSettings 
                onSuccess={() => {
                  setShowProfileSettings(false)
                }}
              />
              <div className="space-y-8">
                <WeightEntryForm />
                <EnhancedCalorieCalculator />
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