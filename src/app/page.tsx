
'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { useProfile } from '@/hooks/useProfile'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

import { useRouter } from 'next/navigation'
import { DashboardTabs } from '@/components/dashboard/DashboardTabs'

export default function HomePage() {
  const { user } = useAuth()
  const { isProfileComplete } = useProfile()
  
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

      

      <DashboardTabs />
    </div>
  )
}
