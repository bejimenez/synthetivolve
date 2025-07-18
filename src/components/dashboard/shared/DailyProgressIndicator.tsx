// src/components/dashboard/shared/DailyProgressIndicator.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import React from 'react'

interface DailyProgressIndicatorProps {
  title: string
  current: number
  target: number
  unit: string
  description: string
  className?: string
}

export const DailyProgressIndicator = React.memo(function DailyProgressIndicator({
  title,
  current,
  target,
  unit,
  description,
  className,
}: DailyProgressIndicatorProps) {
  const percentage = target > 0 ? Math.min(100, (current / target) * 100) : 0

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {current.toFixed(0)} / {target.toFixed(0)}
        </div>
        <Progress value={percentage} className="h-2 mt-2" />
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
})
