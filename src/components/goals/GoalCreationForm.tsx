// src/components/goals/GoalCreationForm.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useGoals } from '@/hooks/useGoals'
import { useWeightEntries } from '@/hooks/useWeightEntries'
import { validateGoalParameters } from '@/lib/goal_calculations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
//import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Slider } from '@/components/ui/slider'
import { Target, AlertTriangle, Info } from 'lucide-react'

const goalSchema = z.object({
  goal_type: z.enum(['fat_loss', 'maintenance', 'muscle_gain']),
  duration_weeks: z.number().min(2).max(16),
  rate_type: z.enum(['absolute', 'percentage']).optional(),
  target_rate_lbs: z.number().min(0.1).max(3).optional(),
  target_rate_percent: z.number().min(0.1).max(2).optional(),
  surplus_calories: z.number().min(100).max(1000).optional(),
})

type GoalFormData = z.infer<typeof goalSchema>

interface GoalCreationFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function GoalCreationForm({ onSuccess, onCancel }: GoalCreationFormProps) {
  const { createGoal, loading: goalLoading } = useGoals()
  const { weightEntries } = useWeightEntries()

  const currentWeight = weightEntries.length > 0 
    ? weightEntries.sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime())[0].weight_lbs
    : 0

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    setError,
    clearErrors
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      goal_type: 'fat_loss',
      duration_weeks: 8,
      surplus_calories: 300
    }
  })

  const goalType = watch('goal_type')
  const rateType = watch('rate_type')
  const targetRateLbs = watch('target_rate_lbs')
  const targetRatePercent = watch('target_rate_percent')
  const surplusCalories = watch('surplus_calories')

  const onSubmit = async (data: GoalFormData) => {
    clearErrors()

    // Validate goal parameters
    const validation = validateGoalParameters({
      ...data,
      currentWeight
    })

    if (!validation.isValid) {
      validation.errors.forEach((error: string) => {
        setError('root', { message: error })
      })
      return
    }

    // Create goal data
    const goalData = {
      goal_type: data.goal_type,
      start_weight: currentWeight,
      duration_weeks: data.duration_weeks,
      target_rate_lbs: data.goal_type === 'fat_loss' && data.rate_type === 'absolute' ? data.target_rate_lbs : null,
      target_rate_percent: data.goal_type === 'fat_loss' && data.rate_type === 'percentage' ? data.target_rate_percent : null,
      rate_type: data.goal_type === 'fat_loss' ? data.rate_type : null,
      surplus_calories: data.goal_type === 'muscle_gain' ? data.surplus_calories : null,
    }

    const result = await createGoal(goalData)
    if (result) {
      onSuccess?.()
    }
  }

  // Calculate warnings for current settings
  const getWarnings = () => {
    const warnings: string[] = []
    
    if (goalType === 'fat_loss') {
      if (rateType === 'absolute' && targetRateLbs && targetRateLbs > 2) {
        warnings.push('Weight loss rate above 2 lbs/week might be unsustainable')
      }
      if (rateType === 'percentage' && targetRatePercent && targetRatePercent > 1.5) {
        warnings.push('Weight loss rate above 1.5% bodyweight/week might be unsustainable')
      }
    }
    
    if (goalType === 'muscle_gain' && surplusCalories && surplusCalories > 500) {
      warnings.push('Large calorie surplus might result in more fat gain than muscle gain')
    }
    
    return warnings
  }

  if (currentWeight === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Please log your current weight before setting goals.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Create New Goal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Goal Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Goal Type</Label>
            <RadioGroup
              value={goalType}
              onValueChange={(value: 'fat_loss' | 'maintenance' | 'muscle_gain') => setValue('goal_type', value)}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div className="flex items-center space-x-2 border rounded-lg p-4">
                <RadioGroupItem value="fat_loss" id="fat_loss" />
                <Label htmlFor="fat_loss" className="flex-1 cursor-pointer">
                  <div className="font-medium">Fat Loss</div>
                  <div className="text-sm text-muted-foreground">Lose weight and maintain muscle</div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-4">
                <RadioGroupItem value="maintenance" id="maintenance" />
                <Label htmlFor="maintenance" className="flex-1 cursor-pointer">
                  <div className="font-medium">Maintenance</div>
                  <div className="text-sm text-muted-foreground">Maintain current weight</div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-4">
                <RadioGroupItem value="muscle_gain" id="muscle_gain" />
                <Label htmlFor="muscle_gain" className="flex-1 cursor-pointer">
                  <div className="font-medium">Muscle Gain</div>
                  <div className="text-sm text-muted-foreground">Gain muscle with minimal fat</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Duration */}
          <div className="space-y-3">
            <Label htmlFor="duration" className="text-base font-semibold">
              Goal Duration: {watch('duration_weeks')} weeks
            </Label>
            <Slider
              value={[watch('duration_weeks') || 8]}
              onValueChange={([value]) => setValue('duration_weeks', value)}
              min={2}
              max={16}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>2 weeks</span>
              <span>16 weeks</span>
            </div>
          </div>

          {/* Fat Loss Specific Settings */}
          {goalType === 'fat_loss' && (
            <div className="space-y-4 border rounded-lg p-4 bg-red-50">
              <Label className="text-base font-semibold">Weight Loss Rate</Label>
              
              <RadioGroup
                value={rateType}
                onValueChange={(value: 'absolute' | 'percentage') => setValue('rate_type', value)}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="absolute" id="absolute" />
                  <Label htmlFor="absolute" className="flex-1">
                    Fixed amount (lbs per week)
                  </Label>
                </div>
                {rateType === 'absolute' && (
                  <div className="ml-6 space-y-2">
                    <Input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="3.0"
                      placeholder="1.0"
                      {...register('target_rate_lbs', { valueAsNumber: true })}
                    />
                    <p className="text-sm text-muted-foreground">
                      Recommended: 1-2 lbs/week. Current: {currentWeight} lbs
                    </p>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="percentage" id="percentage" />
                  <Label htmlFor="percentage" className="flex-1">
                    Percentage of body weight per week
                  </Label>
                </div>
                {rateType === 'percentage' && (
                  <div className="ml-6 space-y-2">
                    <Input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="2.0"
                      placeholder="0.75"
                      {...register('target_rate_percent', { valueAsNumber: true })}
                    />
                    <p className="text-sm text-muted-foreground">
                      Recommended: 0.5-1.0% per week. {targetRatePercent ? `${((currentWeight * targetRatePercent) / 100).toFixed(1)} lbs/week` : ''}
                    </p>
                  </div>
                )}
              </RadioGroup>
            </div>
          )}

          {/* Muscle Gain Specific Settings */}
          {goalType === 'muscle_gain' && (
            <div className="space-y-4 border rounded-lg p-4 bg-green-50">
              <Label className="text-base font-semibold">Calorie Surplus</Label>
              <div className="space-y-3">
                <Label htmlFor="surplus">
                  Daily Surplus: {surplusCalories} calories
                </Label>
                <Slider
                  value={[surplusCalories || 300]}
                  onValueChange={([value]) => setValue('surplus_calories', value)}
                  min={100}
                  max={800}
                  step={50}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>100 cal (conservative)</span>
                  <span>800 cal (aggressive)</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Recommended: 300-500 calories for optimal muscle gain with minimal fat gain
                </p>
              </div>
            </div>
          )}

          {/* Warnings */}
          {getWarnings().length > 0 && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <ul className="list-disc pl-4 space-y-1">
                  {getWarnings().map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Form Errors */}
          {errors.root && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {errors.root.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={goalLoading}
              className="flex-1"
            >
              {goalLoading ? 'Creating Goal...' : 'Create Goal'}
            </Button>
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={goalLoading}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}