// src/components/weight/WeightEntryForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { useWeightData } from '@/components/weight/WeightDataProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Scale, CheckCircle } from 'lucide-react'

const weightEntrySchema = z.object({
  weight_lbs: z.coerce.number()
    .min(50, 'Weight must be at least 50 lbs')
    .max(1000, 'Weight must be less than 1000 lbs'),
  entry_date: z.string()
    .refine((date) => {
      const parsed = new Date(date)
      return !isNaN(parsed.getTime()) && parsed <= new Date()
    }, 'Entry date must be a valid date not in the future'),
  notes: z.string().optional(),
})

type WeightEntryFormData = z.infer<typeof weightEntrySchema>

interface WeightEntryFormProps {
  onSuccess?: () => void
}

export function WeightEntryForm({ onSuccess }: WeightEntryFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [justSubmitted, setJustSubmitted] = useState(false)
  const { createWeightEntry, error } = useWeightData()

  useEffect(() => {
    setMounted(true)
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<WeightEntryFormData>({
    resolver: zodResolver(weightEntrySchema),
    defaultValues: {
      entry_date: '', // Set empty initially to prevent hydration mismatch
    },
  })

  // Set today's date after component mounts
  useEffect(() => {
    if (mounted) {
      setValue('entry_date', format(new Date(), 'yyyy-MM-dd'))
    }
  }, [mounted, setValue])

  const onSubmit = async (data: WeightEntryFormData) => {
    setSubmitting(true)
    setJustSubmitted(false)
    
    try {
      const entry = await createWeightEntry({
        weight_lbs: data.weight_lbs,
        entry_date: data.entry_date,
        notes: data.notes,
      })

      if (entry) {
        reset({
          entry_date: format(new Date(), 'yyyy-MM-dd'),
          weight_lbs: undefined,
          notes: '',
        })
        
        // Show success feedback
        setJustSubmitted(true)
        setTimeout(() => setJustSubmitted(false), 3000)
        
        onSuccess?.()
      }
    } catch (error) {
      console.error('Error creating weight entry:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="w-full h-fit">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Scale className="h-5 w-5" />
          Log Today&apos;s Weight
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Alert components remain the same */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {justSubmitted && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Weight entry saved successfully! 🎉
              </AlertDescription>
            </Alert>
          )}

          {/* Compact form layout */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="weight_lbs" className="text-sm font-medium">
                  Weight (lbs)
                </Label>
                <Input
                  id="weight_lbs"
                  type="number"
                  step="0.1"
                  placeholder="Enter weight"
                  className="h-9"
                  {...register('weight_lbs')}
                  disabled={submitting}
                />
                {errors.weight_lbs && (
                  <p className="text-xs text-destructive">{errors.weight_lbs.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="entry_date" className="text-sm font-medium">
                  Date
                </Label>
                <Input
                  id="entry_date"
                  type="date"
                  className="h-9"
                  {...register('entry_date')}
                  disabled={submitting}
                />
                {errors.entry_date && (
                  <p className="text-xs text-destructive">{errors.entry_date.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">
                Notes (optional)
              </Label>
              <Input
                id="notes"
                placeholder="Any notes about today..."
                className="h-9"
                {...register('notes')}
                disabled={submitting}
              />
            </div>

            <Button type="submit" className="w-full h-9" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? 'Saving...' : 'Log Weight'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}