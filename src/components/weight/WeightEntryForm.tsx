'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { useWeightEntries } from '@/hooks/useWeightEntries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Scale } from 'lucide-react'

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
  const { createWeightEntry, error } = useWeightEntries()

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
        onSuccess?.()
      }
    } catch {
      // Error handling is managed by the hook
    } finally {
      setSubmitting(false)
    }
  }

  const setToday = () => {
    setValue('entry_date', format(new Date(), 'yyyy-MM-dd'))
  }

  // Don't render form until mounted
  if (!mounted) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Log Weight
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Loading form...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Log Weight
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight_lbs">Weight (lbs)</Label>
              <Input
                id="weight_lbs"
                type="number"
                step="0.1"
                placeholder="150.5"
                {...register('weight_lbs')}
                disabled={submitting}
              />
              {errors.weight_lbs && (
                <p className="text-sm text-destructive">{errors.weight_lbs.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="entry_date">Date</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={setToday}
                  disabled={submitting}
                >
                  Today
                </Button>
              </div>
              <Input
                id="entry_date"
                type="date"
                {...register('entry_date')}
                disabled={submitting}
              />
              {errors.entry_date && (
                <p className="text-sm text-destructive">{errors.entry_date.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              placeholder="How are you feeling today?"
              {...register('notes')}
              disabled={submitting}
            />
            {errors.notes && (
              <p className="text-sm text-destructive">{errors.notes.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Log Weight
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}