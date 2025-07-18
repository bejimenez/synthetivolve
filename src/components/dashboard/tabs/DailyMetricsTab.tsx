// src/components/dashboard/tabs/DailyMetricsTab.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/hooks/useProfile'
import { WeightEntryForm } from '@/components/weight/WeightEntryForm'
import { WeightHistory } from '@/components/weight/WeightHistory'
import { GoalProgressWidget } from '@/components/goals/GoalProgressWidget'
import { GoalProgressChart } from '@/components/goals/GoalProgressChart'
import { GoalCreationForm } from '@/components/goals/GoalCreationForm'
import { EnhancedNutritionDisplay } from '@/components/dashboard/nutrition/EnhancedNutritionDisplay'
import { NutritionDataProvider, useNutrition } from '@/components/nutrition/NutritionDataProvider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

// Separate component to use the nutrition hook
function CompactNutritionSummary() {
  const { foodLogs, loading } = useNutrition()
  
  return (
    <EnhancedNutritionDisplay 
      foodLogs={foodLogs}
      nutritionLoading={loading}
      variant="compact"
    />
  )
}

export function DailyMetricsTab() {
  const { isProfileComplete } = useProfile()
  const [showGoalCreation, setShowGoalCreation] = useState(false)
  const [isWeightHistoryOpen, setIsWeightHistoryOpen] = useState(true) // Default open
  const router = useRouter()

  return (
    <div className="space-y-8 mt-4">
      {/* Profile Completion Alert */}
      {!isProfileComplete && (
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-900">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            Complete your <Button variant="link" className="p-0 h-auto align-baseline text-amber-800 dark:text-amber-200" onClick={() => router.push('/profile')}>profile settings</Button> to unlock personalized calorie and macro recommendations.
          </AlertDescription>
        </Alert>
      )}

      {/* Weight Entry and History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeightEntryForm />
        <Collapsible open={isWeightHistoryOpen} onOpenChange={setIsWeightHistoryOpen} className="lg:col-span-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Weight History</h3>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 p-0">
                <ChevronDown className={cn("h-4 w-4 transition-transform", isWeightHistoryOpen ? "rotate-180" : "rotate-0")} />
                <span className="sr-only">Toggle Weight History</span>
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="overflow-hidden transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <WeightHistory />
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Compact Nutrition Summary - replaces CompactCalorieCalculator */}
      <NutritionDataProvider>
        <CompactNutritionSummary />
      </NutritionDataProvider>

      {/* Goal Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GoalProgressWidget onCreateGoal={() => setShowGoalCreation(true)} />
        <Collapsible className="lg:col-span-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Goal Progress Chart</h3>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 p-0">
                <ChevronDown className={cn("h-4 w-4 transition-transform", isWeightHistoryOpen ? "rotate-180" : "rotate-0")} />
                <span className="sr-only">Toggle Goal Progress Chart</span>
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="overflow-hidden transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <GoalProgressChart />
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Goal Creation Form */}
      {showGoalCreation && (
        <GoalCreationForm onCancel={() => setShowGoalCreation(false)} />
      )}
    </div>
  )
}