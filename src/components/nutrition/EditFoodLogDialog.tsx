// src/components/nutrition/EditFoodLogDialog.tsx
'use client'

import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
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

export function EditFoodLogDialog({ open, onClose, onFoodLogUpdated, foodLog }: EditFoodLogDialogProps) {
  const [quantity, setQuantity] = useState(foodLog?.quantity || 0)
  const [unit, setUnit] = useState(foodLog?.unit || 'g')
  const [loggedAt, setLoggedAt] = useState(foodLog?.logged_at ? format(parseISO(foodLog.logged_at), "yyyy-MM-dd'T'HH:mm") : '')
  const [loading, setLoading] = useState(false)

  const { updateFoodLog } = useNutrition()

  useEffect(() => {
    if (foodLog) {
      setQuantity(foodLog.quantity)
      setUnit(foodLog.unit)
      setLoggedAt(foodLog.logged_at ? format(parseISO(foodLog.logged_at), "yyyy-MM-dd'T'HH:mm") : '')
    }
  }, [foodLog])

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
    setLoading(false)
    onClose()
  }

  if (!foodLog) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Food Log</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="font-semibold text-lg">{foodLog.food.description}</div>
          {foodLog.food.brand_name && (
            <p className="text-sm text-muted-foreground">{foodLog.food.brand_name}</p>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="quantity" className="text-right">
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
            <label htmlFor="unit" className="text-right">
              Unit
            </label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="g">grams (g)</SelectItem>
                <SelectItem value="oz">ounces (oz)</SelectItem>
                <SelectItem value="cup">cup</SelectItem>
                <SelectItem value="tbsp">tablespoon</SelectItem>
                <SelectItem value="tsp">teaspoon</SelectItem>
                <SelectItem value="piece">piece</SelectItem>
                <SelectItem value="serving">serving</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="logged_at" className="text-right">
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
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleUpdateFoodLog} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
