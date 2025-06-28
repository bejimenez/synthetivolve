// src/components/profile/ProfileSettings.tsx
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { useProfile } from '@/hooks/useProfile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Loader2, User, Save } from 'lucide-react'

const profileSchema = z.object({
  height_inches: z.coerce.number()
    .min(36, 'Height must be at least 36 inches (3 feet)')
    .max(96, 'Height must be less than 96 inches (8 feet)'),
  biological_sex: z.enum(['male', 'female'], {
    required_error: 'Please select your biological sex - this is required for accurate calorie calculations',
  }),
  birth_date: z.string()
    .refine((date) => {
      const parsed = new Date(date)
      const age = (new Date().getTime() - parsed.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
      return !isNaN(parsed.getTime()) && age >= 13 && age <= 120
    }, 'Please enter a valid birth date (age 13-120)'),
  activity_level: z.enum([
    'sedentary',
    'lightly_active', 
    'moderately_active',
    'very_active',
    'extremely_active'
  ], {
    required_error: 'Please select your activity level'
  })
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileSettingsProps {
  onSuccess?: () => void
  className?: string
}

export function ProfileSettings({ onSuccess, className }: ProfileSettingsProps) {
  const [submitting, setSubmitting] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const { profile, loading, error, updateProfile } = useProfile()

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  })

  // Load existing profile data when available
  useEffect(() => {
    if (profile && !loading) {
      reset({
        height_inches: profile.height_inches || undefined,
        biological_sex: profile.biological_sex || undefined,
        birth_date: profile.birth_date || undefined,
        activity_level: profile.activity_level || undefined,
      })
    }
  }, [profile, loading, reset])

  const onSubmit = async (data: ProfileFormData) => {
    setSubmitting(true)
    setJustSaved(false)
    
    try {
      const updatedProfile = await updateProfile(data)
      
      if (updatedProfile) {
        setJustSaved(true)
        setTimeout(() => setJustSaved(false), 3000)
        onSuccess?.()
      }
    } catch {
      // Error handling is managed by the hook
    } finally {
      setSubmitting(false)
    }
  }

  // Helper function to convert inches to feet/inches display
  const formatHeight = (inches: number) => {
    const feet = Math.floor(inches / 12)
    const remainingInches = inches % 12
    return `${feet}'${remainingInches}"`
  }

  const watchedHeight = watch('height_inches')

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {justSaved && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <AlertDescription>Profile updated successfully! 🎉</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Height Input */}
            <div className="space-y-2">
              <Label htmlFor="height_inches">Height</Label>
              <div className="relative">
                <Input
                  id="height_inches"
                  type="number"
                  placeholder="70"
                  {...register('height_inches')}
                  disabled={submitting}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  inches
                </div>
              </div>
              {watchedHeight && (
                <p className="text-sm text-muted-foreground">
                  = {formatHeight(watchedHeight)}
                </p>
              )}
              {errors.height_inches && (
                <p className="text-sm text-destructive">{errors.height_inches.message}</p>
              )}
            </div>

            {/* Biological Sex */}
            <div className="space-y-2">
              <Label htmlFor="biological_sex">Biological Sex</Label>
              <Select
                onValueChange={(value: 'male' | 'female') => setValue('biological_sex', value, { shouldDirty: true })}
                defaultValue={profile?.biological_sex || undefined}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
              {errors.biological_sex && (
                <p className="text-sm text-destructive">{errors.biological_sex.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Birth Date */}
            <div className="space-y-2">
              <Label htmlFor="birth_date">Birth Date</Label>
              <Input
                id="birth_date"
                type="date"
                max={format(new Date(), 'yyyy-MM-dd')}
                {...register('birth_date')}
                disabled={submitting}
              />
              {errors.birth_date && (
                <p className="text-sm text-destructive">{errors.birth_date.message}</p>
              )}
            </div>

            {/* Activity Level */}
            <div className="space-y-2">
              <Label htmlFor="activity_level">Activity Level</Label>
              <Select
                onValueChange={(value: ProfileFormData['activity_level']) => 
                  setValue('activity_level', value, { shouldDirty: true })
                }
                defaultValue={profile?.activity_level || undefined}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select activity level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">
                    Sedentary (office job, no exercise)
                  </SelectItem>
                  <SelectItem value="lightly_active">
                    Lightly Active (light exercise 1-3 days/week)
                  </SelectItem>
                  <SelectItem value="moderately_active">
                    Moderately Active (moderate exercise 3-5 days/week)
                  </SelectItem>
                  <SelectItem value="very_active">
                    Very Active (hard exercise 6-7 days/week)
                  </SelectItem>
                  <SelectItem value="extremely_active">
                    Extremely Active (very hard exercise, 2x/day)
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.activity_level && (
                <p className="text-sm text-destructive">{errors.activity_level.message}</p>
              )}
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={submitting || !isDirty}
            className="w-full"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Profile
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}