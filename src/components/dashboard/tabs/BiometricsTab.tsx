// src/components/dashboard/tabs/BiometricsTab.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function BiometricsTab() {
  return (
    <div className="mt-4">
      <Card>
        <CardHeader>
          <CardTitle>Biometrics</CardTitle>
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
