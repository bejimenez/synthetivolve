// src/components/nutrition/AddFoodDialog.tsx
'use client'

import { useState, useEffect } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { useNutrition } from './NutritionDataProvider'
import { useNutritionSettings } from '@/hooks/useNutritionSettings'
import { FoodSearchResult } from '@/lib/nutrition/usda'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Search, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ManualFoodForm } from './ManualFoodForm'
import { createTimezoneAwareLoggedAt } from '@/lib/nutrition/timezone-utils'
import type { RecentFood, Food } from './NutritionDataProvider'

interface AddFoodDialogProps {
  open: boolean
  onClose: () => void
  onFoodAdded: () => void
  selectedDate: Date
  initialHour: number | null
}

type TabType = 'search' | 'recent' | 'manual'

export function AddFoodDialog({ open, onClose, onFoodAdded, selectedDate, initialHour }: AddFoodDialogProps) {
  const [activeTab, setActiveTab] = useState<TabType>('search')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([])
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null)
  const [quantity, setQuantity] = useState(100)
  const [unit, setUnit] = useState('g')
  const [loading, setLoading] = useState(false)
  
  // 🔥 FIX: Store the intended logging hour in local state to preserve it throughout the workflow
  const [intendedLoggingHour, setIntendedLoggingHour] = useState<number | null>(null)

  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const { searchFoods, addFoodLog, recentFoods, refreshLogs } = useNutrition()
  const { settings: nutritionSettings } = useNutritionSettings()

  // 🔥 FIX: Set the intended logging hour when dialog opens and preserve it
  useEffect(() => {
    if (open && initialHour !== null) {
      setIntendedLoggingHour(initialHour)
    }
  }, [open, initialHour])

  useEffect(() => {
    if (open && activeTab === 'recent') {
      refreshLogs()
    }
  }, [open, activeTab, refreshLogs])

  useEffect(() => {
    if (debouncedSearchTerm) {
      setLoading(true)
      searchFoods(debouncedSearchTerm).then(results => {
        setSearchResults(results)
        setLoading(false)
      })
    } else {
      setSearchResults([])
    }
  }, [debouncedSearchTerm, searchFoods])

  // Simple fix for AddFoodDialog.tsx handleAddFood function
// Replace the existing handleAddFood function with this:

const handleAddFood = async () => {
  if (!selectedFood) return

  // 🔥 SIMPLE FIX: Create date in local timezone and adjust for UTC conversion
  const localDate = new Date(selectedDate)
  const targetHour = intendedLoggingHour ?? new Date().getHours()
  
  // Set the time in local timezone
  localDate.setHours(targetHour, 0, 0, 0)
  
  // Get timezone offset in minutes
  const timezoneOffset = localDate.getTimezoneOffset()
  
  // Create a new date that accounts for the timezone offset
  // This ensures that when converted to UTC, it maintains the intended local hour
  const adjustedDate = new Date(localDate.getTime() - (timezoneOffset * 60000))
  
  // 🔥 DEBUG: Log the conversion
  console.log('🔍 DEBUG - Simple timezone fix:')
  console.log('Target hour:', targetHour)
  console.log('Local date after setHours:', localDate)
  console.log('Timezone offset (minutes):', timezoneOffset)
  console.log('Adjusted date:', adjustedDate)
  console.log('Final ISO string:', adjustedDate.toISOString())
  console.log('Expected hour in local time:', targetHour)

  const newLog = {
    fdcId: selectedFood.fdcId === 0 ? null : selectedFood.fdcId,
    quantity,
    unit,
    logged_at: adjustedDate.toISOString(),
    logged_date: format(selectedDate, 'yyyy-MM-dd'),
    foodDetails: selectedFood,
  }
  
  await addFoodLog(newLog)
  onFoodAdded()
  handleClose()
}

  const handleManualFoodCreated = (newFood: Food) => {
    // Transform the created food into a FoodSearchResult for logging
    const transformedFood: FoodSearchResult = {
      fdcId: 0, // No USDA ID for manual foods
      description: newFood.description,
      brandName: newFood.brand_name || undefined,
      dataType: 'Manual',
      foodNutrients: [
        { nutrientId: 1008, nutrientName: 'Calories', nutrientNumber: '208', unitName: 'KCAL', value: newFood.calories_per_100g || 0 },
        { nutrientId: 1003, nutrientName: 'Protein', nutrientNumber: '203', unitName: 'G', value: newFood.protein_per_100g || 0 },
        { nutrientId: 1004, nutrientName: 'Fat', nutrientNumber: '204', unitName: 'G', value: newFood.fat_per_100g || 0 },
        { nutrientId: 1005, nutrientName: 'Carbohydrate', nutrientNumber: '205', unitName: 'G', value: newFood.carbs_per_100g || 0 },
        { nutrientId: 1007, nutrientName: 'Fiber', nutrientNumber: '291', unitName: 'G', value: newFood.fiber_per_100g || 0 },
        { nutrientId: 2000, nutrientName: 'Sugars', nutrientNumber: '269', unitName: 'G', value: newFood.sugar_per_100g || 0 },
        { nutrientId: 1093, nutrientName: 'Sodium', nutrientNumber: '307', unitName: 'MG', value: newFood.sodium_per_100g || 0 },
      ]
    }
    
    setSelectedFood(transformedFood)
    setActiveTab('search') // Switch to quantity selection view
    // 🔥 NOTE: intendedLoggingHour is now preserved across this tab switch
  }

  const handleClose = () => {
    setSearchTerm('')
    setSearchResults([])
    setSelectedFood(null)
    setQuantity(100)
    setActiveTab('search')
    // 🔥 FIX: Reset intended logging hour when dialog closes
    setIntendedLoggingHour(null)
    onClose()
  }

  const handleSelectRecent = (recent: RecentFood & { food: Food }) => {
    const foodDetails = recent.food
    const transformedFood: FoodSearchResult = {
      fdcId: foodDetails.fdc_id || 0,
      description: foodDetails.description,
      brandName: foodDetails.brand_name || undefined,
      dataType: foodDetails.fdc_id ? 'Database' : 'Manual',
      foodNutrients: [
        { nutrientId: 1008, nutrientName: 'Calories', nutrientNumber: '208', unitName: 'KCAL', value: foodDetails.calories_per_100g || 0 },
        { nutrientId: 1003, nutrientName: 'Protein', nutrientNumber: '203', unitName: 'G', value: foodDetails.protein_per_100g || 0 },
        { nutrientId: 1004, nutrientName: 'Fat', nutrientNumber: '204', unitName: 'G', value: foodDetails.fat_per_100g || 0 },
        { nutrientId: 1005, nutrientName: 'Carbohydrate', nutrientNumber: '205', unitName: 'G', value: foodDetails.carbs_per_100g || 0 },
        { nutrientId: 1007, nutrientName: 'Fiber', nutrientNumber: '291', unitName: 'G', value: foodDetails.fiber_per_100g || 0 },
        { nutrientId: 2000, nutrientName: 'Sugars', nutrientNumber: '269', unitName: 'G', value: foodDetails.sugar_per_100g || 0 },
        { nutrientId: 1093, nutrientName: 'Sodium', nutrientNumber: '307', unitName: 'MG', value: foodDetails.sodium_per_100g || 0 },
      ]
    }
    setSelectedFood(transformedFood)
  }

  const tabConfig = [
    { id: 'search' as const, label: 'Search', icon: Search },
    { id: 'recent' as const, label: 'Recent', icon: undefined },
    { id: 'manual' as const, label: 'Manual', icon: Plus },
  ]

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedFood ? `Log "${selectedFood.description}"` : 'Add Food'}
            {/* 🔥 DEBUG: Temporary display to verify intended time is preserved */}
            {intendedLoggingHour !== null && (
              <span className="text-sm text-muted-foreground ml-2">
                → {intendedLoggingHour.toString().padStart(2, '0')}:00
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {!selectedFood ? (
          <div className="space-y-4">
            {/* Tab Navigation */}
            <div className="flex border-b">
              {tabConfig.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Tab Content */}
            {activeTab === 'search' && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search USDA food database..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {loading && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                )}
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {searchResults.map(food => (
                    <div
                      key={food.fdcId}
                      onClick={() => setSelectedFood(food)}
                      className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    >
                      <p className="font-semibold">{food.description}</p>
                      {food.brandName && (
                        <p className="text-sm text-muted-foreground">{food.brandName}</p>
                      )}
                    </div>
                  ))}
                  {searchTerm && !loading && searchResults.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      No foods found. Try a different search term or create a manual entry.
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'recent' && (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {recentFoods.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No recent foods found.
                  </p>
                ) : (
                  recentFoods.map(recent => (
                    <div
                      key={recent.id}
                      onClick={() => handleSelectRecent(recent)}
                      className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    >
                      <p className="font-semibold">{recent.food.description}</p>
                      {recent.food.brand_name && (
                        <p className="text-sm text-muted-foreground">{recent.food.brand_name}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Last used: {format(new Date(recent.last_used || recent.created_at || new Date()), 'MMM d, yyyy')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'manual' && (
              <ManualFoodForm 
                onFoodCreated={handleManualFoodCreated} 
                onCancel={() => setActiveTab('search')}
              />
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{selectedFood.description}</h3>
              {selectedFood.brandName && (
                <p className="text-sm text-muted-foreground">{selectedFood.brandName}</p>
              )}
            </div>

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
                className="col-span-2"
                min="0"
              />
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">grams</SelectItem>
                  <SelectItem value="oz">ounces</SelectItem>
                  <SelectItem value="cup">cup</SelectItem>
                  <SelectItem value="tbsp">tablespoon</SelectItem>
                  <SelectItem value="tsp">teaspoon</SelectItem>
                  <SelectItem value="piece">piece</SelectItem>
                  <SelectItem value="serving">serving</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleAddFood}>
                Add Food
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}