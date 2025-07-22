// src/components/nutrition/ManualFoodForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { useFormDraft } from '@/hooks/useFormDraft'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Info } from 'lucide-react'

interface ManualFoodData {
  description: string
  brand_name?: string
  serving_size?: number
  serving_unit?: string
  calories_per_100g?: number
  protein_per_100g?: number
  fat_per_100g?: number
  carbs_per_100g?: number
  fiber_per_100g?: number
  sugar_per_100g?: number
  sodium_per_100g?: number
}

interface Food {
  id: string
  fdc_id: number | null
  description: string
  brand_name: string | null
  serving_size: number | null
  serving_unit: string | null
  calories_per_100g: number | null
  protein_per_100g: number | null
  fat_per_100g: number | null
  carbs_per_100g: number | null
  fiber_per_100g: number | null
  sugar_per_100g: number | null
  sodium_per_100g: number | null
  created_at: string | null
  updated_at: string | null
}

interface ManualFoodFormProps {
  onFoodCreated: (food: Food) => void
  onCancel: () => void
}

const defaultValues: ManualFoodData = {
  description: '',
  brand_name: '',
  serving_size: undefined,
  serving_unit: '',
  calories_per_100g: undefined,
  protein_per_100g: undefined,
  fat_per_100g: undefined,
  carbs_per_100g: undefined,
  fiber_per_100g: undefined,
  sugar_per_100g: undefined,
  sodium_per_100g: undefined,
}

export function ManualFoodForm({ onFoodCreated, onCancel }: ManualFoodFormProps) {
  const [formData, setFormData] = useState<ManualFoodData>(defaultValues)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { draft, saveDraft, clearDraft, isLoaded } = useFormDraft<ManualFoodData>({
    key: 'manual-food-form',
    defaultValues,
  })

  useEffect(() => {
    if (isLoaded && draft) {
      setFormData(draft)
    }
  }, [isLoaded, draft])

  const handleInputChange = (field: keyof ManualFoodData, value: string) => {
    setError(null)
    
    let newFormData: ManualFoodData;
    if (field === 'description' || field === 'brand_name' || field === 'serving_unit') {
      newFormData = { ...formData, [field]: value };
    } else {
      const numValue = value === '' ? undefined : parseFloat(value)
      newFormData = { ...formData, [field]: numValue };
    }
    setFormData(newFormData);
    saveDraft(newFormData);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.description.trim()) {
      setError('Food name is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const cleanedData = Object.entries(formData).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== '') {
          acc[key as keyof ManualFoodData] = value
        }
        return acc
      }, {} as Partial<ManualFoodData>)

      const response = await fetch('/api/nutrition/foods/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create food entry')
      }

      clearDraft()
      onFoodCreated(result)
    } catch (err) {
      console.error('Error creating manual food:', err)
      setError(err instanceof Error ? err.message : 'Failed to create food entry')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    clearDraft();
    onCancel();
  }

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Enter nutrition information per 100g/100ml. Only food name is required - you can fill in nutrition details later.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="description" className="text-sm font-medium">
                Food Name *
              </Label>
              <Input
                id="description"
                type="text"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="e.g., Homemade Pasta Salad"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="brand_name" className="text-sm font-medium">
                Brand Name (Optional)
              </Label>
              <Input
                id="brand_name"
                type="text"
                value={formData.brand_name}
                onChange={(e) => handleInputChange('brand_name', e.target.value)}
                placeholder="e.g., Mom's Recipe"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="serving_size" className="text-sm font-medium">
                  Serving Size
                </Label>
                <Input
                  id="serving_size"
                  type="number"
                  step="0.1"
                  value={formData.serving_size || ''}
                  onChange={(e) => handleInputChange('serving_size', e.target.value)}
                  placeholder="e.g., 150"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="serving_unit" className="text-sm font-medium">
                  Serving Unit
                </Label>
                <Input
                  id="serving_unit"
                  type="text"
                  value={formData.serving_unit}
                  onChange={(e) => handleInputChange('serving_unit', e.target.value)}
                  placeholder="e.g., g, cup, piece"
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nutrition Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nutrition Information (per 100g)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="calories_per_100g" className="text-sm font-medium">
                  Calories
                </Label>
                <Input
                  id="calories_per_100g"
                  type="number"
                  step="0.1"
                  value={formData.calories_per_100g || ''}
                  onChange={(e) => handleInputChange('calories_per_100g', e.target.value)}
                  placeholder="kcal"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="protein_per_100g" className="text-sm font-medium">
                  Protein (g)
                </Label>
                <Input
                  id="protein_per_100g"
                  type="number"
                  step="0.1"
                  value={formData.protein_per_100g || ''}
                  onChange={(e) => handleInputChange('protein_per_100g', e.target.value)}
                  placeholder="grams"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="fat_per_100g" className="text-sm font-medium">
                  Fat (g)
                </Label>
                <Input
                  id="fat_per_100g"
                  type="number"
                  step="0.1"
                  value={formData.fat_per_100g || ''}
                  onChange={(e) => handleInputChange('fat_per_100g', e.target.value)}
                  placeholder="grams"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="carbs_per_100g" className="text-sm font-medium">
                  Carbohydrates (g)
                </Label>
                <Input
                  id="carbs_per_100g"
                  type="number"
                  step="0.1"
                  value={formData.carbs_per_100g || ''}
                  onChange={(e) => handleInputChange('carbs_per_100g', e.target.value)}
                  placeholder="grams"
                  className="mt-1"
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="fiber_per_100g" className="text-sm font-medium">
                  Fiber (g)
                </Label>
                <Input
                  id="fiber_per_100g"
                  type="number"
                  step="0.1"
                  value={formData.fiber_per_100g || ''}
                  onChange={(e) => handleInputChange('fiber_per_100g', e.target.value)}
                  placeholder="grams"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="sugar_per_100g" className="text-sm font-medium">
                  Sugar (g)
                </Label>
                <Input
                  id="sugar_per_100g"
                  type="number"
                  step="0.1"
                  value={formData.sugar_per_100g || ''}
                  onChange={(e) => handleInputChange('sugar_per_100g', e.target.value)}
                  placeholder="grams"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="sodium_per_100g" className="text-sm font-medium">
                Sodium (mg)
              </Label>
              <Input
                id="sodium_per_100g"
                type="number"
                step="0.1"
                value={formData.sodium_per_100g || ''}
                onChange={(e) => handleInputChange('sodium_per_100g', e.target.value)}
                placeholder="milligrams"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !formData.description.trim()}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Food
          </Button>
        </div>
      </form>
    </div>
  )
}
