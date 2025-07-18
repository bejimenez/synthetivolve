// src/components/nutrition/AddFoodDialog.tsx
'use client'

import { useState, useEffect } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
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
}

type TabType = 'search' | 'recent' | 'manual'

export function AddFoodDialog({ open, onClose, onFoodAdded, selectedDate }: AddFoodDialogProps) {
  const [activeTab, setActiveTab] = useState<TabType>('search')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([])
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null)
  const [quantity, setQuantity] = useState(100)
  const [unit, setUnit] = useState('g')
  const [loading, setLoading] = useState(false)

  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const { searchFoods, addFoodLog, recentFoods, refreshLogs } = useNutrition()

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

    const newLog = {
      fdcId: selectedFood.fdcId,
      quantity,
      unit,
      logged_at: new Date().toISOString(),
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
  }

  const handleClose = () => {
    setSearchTerm('')
    setSearchResults([])
    setSelectedFood(null)
    setQuantity(100)
    setActiveTab('search')
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
                  <p className="text-center text-muted-foreground py-4">No recent foods.</p>
                ) : (
                  recentFoods.map(recent => (
                    <div
                      key={recent.food_id}
                      onClick={() => handleSelectRecent(recent)}
                      className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    >
                      <p className="font-semibold">{recent.food.description}</p>
                      {recent.food.brand_name && (
                        <p className="text-sm text-muted-foreground">{recent.food.brand_name}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {recent.food.fdc_id ? 'USDA Database' : 'Manual Entry'}
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
          // Quantity Selection Step
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold">{selectedFood.description}</h3>
              {selectedFood.brandName && (
                <p className="text-sm text-muted-foreground">{selectedFood.brandName}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {selectedFood.dataType === 'Manual' ? 'Manual Entry' : 'USDA Database'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium mb-2">
                  Quantity
                </label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.1"
                  value={quantity}
                  onChange={e => setQuantity(parseFloat(e.target.value) || 0)}
                  min="0"
                />
              </div>
              <div>
                <label htmlFor="unit" className="block text-sm font-medium mb-2">
                  Unit
                </label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger>
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
            </div>

            {/* Nutrition Preview */}
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Nutrition Preview</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {selectedFood.foodNutrients?.map(nutrient => {
                  const value = (nutrient.value * quantity) / 100
                  return (
                    <div key={nutrient.nutrientId} className="flex justify-between">
                      <span>{nutrient.nutrientName}:</span>
                      <span>
                        {value.toFixed(1)} {nutrient.unitName.toLowerCase()}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setSelectedFood(null)}
              >
                Back
              </Button>
              <Button onClick={handleAddFood}>
                Add to Log
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}