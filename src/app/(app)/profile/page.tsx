
'use client'

import { ProfileSettings } from '@/components/profile/ProfileSettings'
import { EnhancedCalorieCalculator } from '@/components/calories/EnhancedCalorieCalculator'

export default function ProfilePage() {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-blue-900 dark:text-blue-300 text-center mb-6">
        Profile Settings
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ProfileSettings onSuccess={() => {}} />
        <EnhancedCalorieCalculator />
      </div>
    </div>
  )
}
