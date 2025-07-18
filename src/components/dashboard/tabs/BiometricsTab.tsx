// src/components/dashboard/tabs/BiometricsTab.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DailyProgressIndicator } from '@/components/dashboard/shared/DailyProgressIndicator'

export default function BiometricsTab() {
  // Placeholder data for daily biometrics progress
  const sleepDuration = 7.5 // hours
  const sleepTarget = 8 // hours
  const hydrationAmount = 2500 // ml
  const hydrationTarget = 3000 // ml

  return (
    <div className="mt-4 space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <DailyProgressIndicator
          title="Sleep Duration"
          current={sleepDuration}
          target={sleepTarget}
          unit="hours"
          description="Hours slept last night"
        />
        <DailyProgressIndicator
          title="Daily Hydration"
          current={hydrationAmount}
          target={hydrationTarget}
          unit="ml"
          description="Water intake today"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Biometrics Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Biometrics tracking is coming soon. This will include data from wearables and other sources.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
