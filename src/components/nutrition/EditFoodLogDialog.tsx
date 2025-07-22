// src/components/nutrition/EditFoodLogDialog.tsx
'use client'

import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { useFormDraft } from '@/hooks/useFormDraft'
import { useNutrition, FoodLogWithFood } from './NutritionDataProvider'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface EditFoodLogDialogProps {
  open: boolean
  onClose: () => void
  onFoodLogUpdated: () => void
  foodLog: FoodLogWithFood | null
}

interface EditFoodLogDraft {
  quantity: number
  unit: string
  loggedAt: string
}

export function EditFoodLogDialog({ open, onClose, onFoodLogUpdated, foodLog }: EditFoodLogDialogProps) {
  const [quantity, setQuantity] = useState(foodLog?.quantity || 0)
  const [unit, setUnit] = useState(foodLog?.unit || 'g')
  const [loggedAt, setLoggedAt] = useState(foodLog?.logged_at ? format(parseISO(foodLog.logged_at), "yyyy-MM-dd'T'HH:mm") : '')
  const [loading, setLoading] = useState(false)

  const { updateFoodLog } = useNutrition()

  const { draft, saveDraft, clearDraft, isLoaded } = useFormDraft<EditFoodLogDraft>({
    key: `edit-food-log-${foodLog?.id}`,
  })

  useEffect(() => {
    if (foodLog) {
      const initialValues = {
        quantity: foodLog.quantity,
        unit: foodLog.unit,
        loggedAt: foodLog.logged_at ? format(parseISO(foodLog.logged_at), "yyyy-MM-dd'T'HH:mm") : '',
      }
      
      if (isLoaded && draft) {
        setQuantity(draft.quantity)
        setUnit(draft.unit)
        setLoggedAt(draft.loggedAt)
      } else {
        setQuantity(initialValues.quantity)
        setUnit(initialValues.unit)
        setLoggedAt(initialValues.loggedAt)
      }
    }
  }, [foodLog, isLoaded, draft])

  useEffect(() => {
    if (foodLog) {
      saveDraft({ quantity, unit, loggedAt })
    }
  }, [quantity, unit, loggedAt, saveDraft, foodLog])

  const handleUpdateFoodLog = async () => {
    if (!foodLog) return

    setLoading(true)
    try {
      const updatedLog = await updateFoodLog(foodLog.id, {
        quantity,
        unit,
        logged_at: loggedAt,
      })

      if (updatedLog) {
        toast.success('Food log updated successfully!')
        clearDraft()
        onFoodLogUpdated()
        onClose()
      } else {
        toast.error('Failed to update food log.')
      }
    } catch (error) {
      console.error('Error updating food log:', error)
      toast.error('An error occurred while updating food log.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    clearDraft()
    setLoading(false)
    onClose()
  }

  if (!foodLog) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] dark:bg-gray-900 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="dark:text-gray-100">Edit Food Log</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="font-semibold text-lg dark:text-gray-100">{foodLog.food.description}</div>
          {foodLog.food.brand_name && (
            <p className="text-sm text-muted-foreground">{foodLog.food.brand_name}</p>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="quantity" className="text-right dark:text-gray-100">
              Quantity
            </label>
            <Input
              id="quantity"
              type="number"
              step="0.1"
              value={quantity}
              onChange={e => setQuantity(parseFloat(e.target.value) || 0)}
              className="col-span-3"
              min="0"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="unit" className="text-right dark:text-gray-100">
              Unit
            </label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger className="col-span-3 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                <SelectItem value="g" className="dark:text-gray-100 dark:hover:bg-gray-700">grams (g)</SelectItem>
                <SelectItem value="oz" className="dark:text-gray-100 dark:hover:bg-gray-700">ounces (oz)</SelectItem>
                <SelectItem value="cup" className="dark:text-gray-100 dark:hover:bg-gray-700">cup</SelectItem>
                <SelectItem value="tbsp" className="dark:text-gray-100 dark:hover:bg-gray-700">tablespoon</SelectItem>
                <SelectItem value="tsp" className="dark:text-gray-100 dark:hover:bg-gray-700">teaspoon</SelectItem>
                <SelectItem value="piece" className="dark:text-gray-100 dark:hover:bg-gray-700">piece</SelectItem>
                <SelectItem value="serving" className="dark:text-gray-100 dark:hover:bg-gray-700">serving</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="logged_at" className="text-right dark:text-gray-100">
              Time
            </label>
            <Input
              id="logged_at"
              type="datetime-local"
              value={loggedAt}
              onChange={e => setLoggedAt(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading} className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700">
            Cancel
          </Button>
          <Button onClick={handleUpdateFoodLog} disabled={loading} className="dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
