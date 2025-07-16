// src/components/nutrition/AddFoodDialog.tsx
'use client'

import { useState, useEffect } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { useNutrition } from './NutritionDataProvider'
import { FoodSearchResult } from '@/lib/nutrition/usda'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Search } from 'lucide-react'
import { format } from 'date-fns'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { RecentFood, Food } from './NutritionDataProvider'

interface AddFoodDialogProps {
  open: boolean
  onClose: () => void
  onFoodAdded: () => void
  selectedDate: Date
}

export function AddFoodDialog({ open, onClose, onFoodAdded, selectedDate }: AddFoodDialogProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'recent'>('search')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([])
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null)
  const [quantity, setQuantity] = useState(100)
  const [unit, setUnit] = useState('g')
  const [loading, setLoading] = useState(false)

  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const { searchFoods, addFoodLog, recentFoods, refreshLogs } = useNutrition() // Removed logEntry, added addFoodLog

  useEffect(() => {
    if (open && activeTab === 'recent') {
      refreshLogs() // Use refreshLogs to fetch recent foods
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
      fdcId: foodDetails.fdc_id || 0, // Assuming fdc_id exists for recent foods, or provide a fallback
      description: foodDetails.description,
      brandName: foodDetails.brand_name || undefined,
      dataType: 'Database', // Placeholder, as this food comes from our DB
      // Optionally map other nutrients if needed for display in the next step
      foodNutrients: [
        { nutrientId: 1008, nutrientName: 'Calories', nutrientNumber: '208', unitName: 'KCAL', value: foodDetails.calories_per_100g || 0 },
        { nutrientId: 1003, nutrientName: 'Protein', nutrientNumber: '203', unitName: 'G', value: foodDetails.protein_per_100g || 0 },
        { nutrientId: 1004, nutrientName: 'Fat', nutrientNumber: '204', unitName: 'G', value: foodDetails.fat_per_100g || 0 },
        { nutrientId: 1005, nutrientName: 'Carbohydrate', nutrientNumber: '205', unitName: 'G', value: foodDetails.carbs_per_100g || 0 },
        { nutrientId: 1007, nutrientName: 'Fiber', nutrientNumber: '291', unitName: 'G', value: foodDetails.fiber_per_100g || 0 },
        { nutrientId: 2000, nutrientName: 'Sugars', nutrientNumber: '269', unitName: 'G', value: foodDetails.sugar_per_100g || 0 },
        { nutrientId: 1093, nutrientName: 'Sodium', nutrientNumber: '307', unitName: 'MG', value: foodDetails.sodium_per_100g || 0 },
      ]
    };
    setSelectedFood(transformedFood);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{selectedFood ? `Log "${selectedFood.description}"` : 'Add Food'}</DialogTitle>
        </DialogHeader>
        
        {!selectedFood ? (
          // Search/Recent Step
          <div className="space-y-4">
            <div className="flex border-b">
              <button onClick={() => setActiveTab('search')} className={`flex-1 p-2 text-sm font-medium ${activeTab === 'search' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>Search</button>
              <button onClick={() => setActiveTab('recent')} className={`flex-1 p-2 text-sm font-medium ${activeTab === 'recent' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>Recent</button>
            </div>

            {activeTab === 'search' && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search for a food..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {loading && <Loader2 className="mx-auto h-6 w-6 animate-spin" />}
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {searchResults.map(food => (
                    <div
                      key={food.fdcId}
                      onClick={() => setSelectedFood(food)}
                      className="p-3 border rounded-lg hover:bg-accent cursor-pointer"
                    >
                      <p className="font-semibold">{food.description}</p>
                      <p className="text-sm text-muted-foreground">{food.brandName}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'recent' && (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {recentFoods.length === 0 && <p className="text-center text-muted-foreground">No recent foods.</p>}
                {recentFoods.map(recent => (
                  <div
                    key={recent.food_id}
                    onClick={() => handleSelectRecent(recent)}
                    className="p-3 border rounded-lg hover:bg-accent cursor-pointer"
                  >
                    <p className="font-semibold">{recent.food.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Quantity Step
          <div className="space-y-4">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium">
                Quantity
              </label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="unit" className="block text-sm font-medium">
                Unit
              </label>
              <Select value={unit} onValueChange={(value) => setUnit(value)}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">grams (g)</SelectItem>
                  <SelectItem value="oz">ounces (oz)</SelectItem>
                  <SelectItem value="ml">milliliters (ml)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setSelectedFood(null)}>Back to Search</Button>
              <Button onClick={handleAddFood}>Add to Log</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

