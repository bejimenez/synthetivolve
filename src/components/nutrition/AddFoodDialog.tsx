// src/components/nutrition/AddFoodDialog.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { useFormDraft } from '@/hooks/useFormDraft'
import { useNutrition } from './NutritionDataProvider'
import { FoodSearchResult } from '@/lib/nutrition/usda'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Search, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ManualFoodForm } from './ManualFoodForm'
import type { RecentFood, Food } from './NutritionDataProvider'

interface AddFoodDialogProps {
  open: boolean
  onClose: () => void
  onFoodAdded: () => void
  selectedDate: Date
  initialHour: number | null
}

type TabType = 'search' | 'recent' | 'manual'

interface AddFoodDraft {
  searchTerm: string
  quantity: number
  unit: string
  activeTab: TabType
}

export function AddFoodDialog({ open, onClose, onFoodAdded, selectedDate, initialHour }: AddFoodDialogProps) {
  const [activeTab, setActiveTab] = useState<TabType>('search')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([])
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null)
  const [quantity, setQuantity] = useState(100)
  const [unit, setUnit] = useState('g')
  const [loading, setLoading] = useState(false)
  
  const [intendedLoggingHour, setIntendedLoggingHour] = useState<number | null>(null)

  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const { searchFoods, addFoodLog, recentFoods, refreshLogs } = useNutrition()
  
  const { draft, saveDraft, clearDraft, isLoaded } = useFormDraft<AddFoodDraft>({
    key: 'add-food-dialog',
    defaultValues: {
      searchTerm: '',
      quantity: 100,
      unit: 'g',
      activeTab: 'search',
    },
  })

  const isInitialLoadRef = useRef(true)

  useEffect(() => {
    if (isLoaded && isInitialLoadRef.current && draft) {
      setSearchTerm(draft.searchTerm)
      setQuantity(draft.quantity)
      setUnit(draft.unit)
      setActiveTab(draft.activeTab)
      isInitialLoadRef.current = false
    }
  }, [isLoaded, draft])

  useEffect(() => {
    saveDraft({ searchTerm, quantity, unit, activeTab })
  }, [searchTerm, quantity, unit, activeTab, saveDraft])

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

const handleAddFood = async () => {
  if (!selectedFood) return

  const localDate = new Date(selectedDate)
  const targetHour = intendedLoggingHour ?? new Date().getHours()
  
  localDate.setHours(targetHour, 0, 0, 0)
  
  const timezoneOffset = localDate.getTimezoneOffset()
  
  const adjustedDate = new Date(localDate.getTime() - (timezoneOffset * 60000))

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
    const transformedFood: FoodSearchResult = {
      fdcId: 0,
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
    setActiveTab('search')
  }

  const handleClose = () => {
    setSearchTerm('')
    setSearchResults([])
    setSelectedFood(null)
    setQuantity(100)
    setActiveTab('search')
    setIntendedLoggingHour(null)
    clearDraft()
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto dark:bg-gray-900 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="dark:text-gray-100">
            {selectedFood ? `Log "${selectedFood.description}"` : 'Add Food'}
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
            <div className="flex border-b dark:border-gray-700">
              {tabConfig.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-muted-foreground hover:text-foreground dark:hover:text-gray-100'
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
                    className="pl-10 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
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
                      className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors dark:border-gray-700 dark:hover:bg-gray-800"
                    >
                      <p className="font-semibold dark:text-gray-100">{food.description}</p>
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
                      className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors dark:border-gray-700 dark:hover:bg-gray-800"
                    >
                      <p className="font-semibold dark:text-gray-100">{recent.food.description}</p>
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
              <h3 className="font-semibold text-lg dark:text-gray-100">{selectedFood.description}</h3>
              {selectedFood.brandName && (
                <p className="text-sm text-muted-foreground">{selectedFood.brandName}</p>
              )}
            </div>

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
                className="col-span-2"
                min="0"
              />
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="g" className="dark:text-gray-100 dark:hover:bg-gray-700">grams</SelectItem>
                  <SelectItem value="oz" className="dark:text-gray-100 dark:hover:bg-gray-700">ounces</SelectItem>
                  <SelectItem value="cup" className="dark:text-gray-100 dark:hover:bg-gray-700">cup</SelectItem>
                  <SelectItem value="tbsp" className="dark:text-gray-100 dark:hover:bg-gray-700">tablespoon</SelectItem>
                  <SelectItem value="tsp" className="dark:text-gray-100 dark:hover:bg-gray-700">teaspoon</SelectItem>
                  <SelectItem value="piece" className="dark:text-gray-100 dark:hover:bg-gray-700">piece</SelectItem>
                  <SelectItem value="serving" className="dark:text-gray-100 dark:hover:bg-gray-700">serving</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedFood(null)} className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700">
                Back
              </Button>
              <Button onClick={handleAddFood} className="dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90">
                Add Food
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
