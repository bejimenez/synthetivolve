'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { AddFoodLogPayload, FoodLogWithFood, UsdaFoodSearchItem, UsdaFoodDetails, NutrientTotals } from '@/lib/nutrition.types';

interface HourSlotProps {
  hour: number;
  onAddFood: (hour: number) => void;
  foodLogs: FoodLogWithFood[];
}

const HourSlot: React.FC<HourSlotProps> = ({ hour, onAddFood, foodLogs }) => (
  <div className="flex flex-col p-3 border rounded-lg shadow-sm">
    <div className="flex items-center justify-between mb-2">
      <span className="font-medium">{hour < 10 ? '0' + hour : hour}:00</span>
      <Button size="sm" onClick={() => onAddFood(hour)}>+</Button>
    </div>
    <div className="mt-2 space-y-2">
      {foodLogs
        .filter((log) => parseISO(log.logged_at).getHours() === hour)
        .map((log) => (
          <div key={log.id} className="flex justify-between items-center text-sm border-t pt-2 first:border-t-0 first:pt-0">
            <span>{log.foods.description} ({log.quantity}{log.unit})</span>
            <span className="text-muted-foreground">{Math.round(log.quantity * (log.foods.calories_per_100g || 0) / 100)} kcal</span>
          </div>
        ))}
    </div>
  </div>
);

interface FoodCardProps {
  food: UsdaFoodSearchItem;
  onSelect: (food: UsdaFoodDetails) => void;
}

const FoodCard: React.FC<FoodCardProps> = ({ food, onSelect }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSelect = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/nutrition/usda/details?fdcId=${food.fdcId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch food details');
      }
      const data: UsdaFoodDetails = await response.json();
      onSelect(data); // Pass the fetched UsdaFoodDetails
    } catch (error) {
      console.error('Error fetching food details:', error);
      toast.error('Error', {
        description: 'Could not load food details.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="ghost" className="w-full justify-between p-2 h-auto" onClick={handleSelect} disabled={isLoading}>
      <span>{food.description}</span>
      <span className="text-sm text-muted-foreground">
        {isLoading ? 'Loading...' : `${Math.round(food.foodNutrients.find(n => n.nutrientName === 'Energy' && n.unitName === 'KCAL')?.value || 0)} kcal/100g`}
      </span>
    </Button>
  );
};

interface MacroTotalsProps {
  totals: NutrientTotals;
  calorieGoal: number;
}

const MacroTotals: React.FC<MacroTotalsProps> = ({ totals, calorieGoal }) => {
  const progress = Math.min(100, (totals.calories / calorieGoal) * 100);
  let progressColor = 'bg-green-500';
  if (totals.calories > calorieGoal * 1.1) {
    progressColor = 'bg-red-500';
  } else if (totals.calories > calorieGoal) {
    progressColor = 'bg-yellow-500';
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="flex flex-col items-start">
          <span className="text-sm text-muted-foreground">Calories</span>
          <span className="text-lg font-bold">{Math.round(totals.calories)}</span>
          <span className="text-xs text-muted-foreground">/ {calorieGoal}</span>
        </div>
        <div className="flex flex-col items-start">
          <span className="text-sm text-muted-foreground">Protein</span>
          <span className="text-lg font-bold">{Math.round(totals.protein)}</span>
          <span className="text-xs text-muted-foreground">g</span>
        </div>
        <div className="flex flex-col items-start">
          <span className="text-sm text-muted-foreground">Carbs</span>
          <span className="text-lg font-bold">{Math.round(totals.carbs)}</span>
          <span className="text-xs text-muted-foreground">g</span>
        </div>
        <div className="flex flex-col items-start">
          <span className="text-sm text-muted-foreground">Fat</span>
          <span className="text-lg font-bold">{Math.round(totals.fat)}</span>
          <span className="text-xs text-muted-foreground">g</span>
        </div>
      </div>
      <Progress value={progress} className={progressColor} />
    </div>
  );
};

interface AddFoodDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFood: (foodLog: AddFoodLogPayload) => Promise<void>;
  currentSlotHour: number;
}

const AddFoodDialog: React.FC<AddFoodDialogProps> = ({ isOpen, onClose, onAddFood, currentSlotHour }) => {
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UsdaFoodSearchItem[]>([]);
  const [recentFoods, setRecentFoods] = useState<FoodLogWithFood[]>([]); // Assuming recent foods also come with food details
  const [selectedFoodDetails, setSelectedFoodDetails] = useState<UsdaFoodDetails | null>(null);
  const [quantity, setQuantity] = useState(100);
  const [unit, setUnit] = useState('g');
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingFood, setIsAddingFood] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch: (query: string) => void = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      try {
        const response = await fetch(`/api/nutrition/usda/search?query=${encodeURIComponent(query)}`);
        if (!response.ok) {
          throw new Error('Failed to search USDA foods');
        }
        const data: UsdaFoodSearchItem[] = await response.json();
        setSearchResults(data);
      } catch (error) {
        console.error('Error searching USDA foods:', error);
        toast.error('Error', {
          description: 'Could not search USDA foods.',
        });
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    [toast]
  );

  useEffect(() => {
    if (isOpen) {
      setActiveTab('search');
      setSearchQuery('');
      setSearchResults([]);
      setSelectedFoodDetails(null);
      setQuantity(100);
      setUnit('g');
      // Fetch recent foods when dialog opens
      const fetchRecentFoods = async () => {
        try {
          const response = await fetch('/api/nutrition/recent-foods'); // Assuming a new API route for recent foods
          if (!response.ok) {
            throw new Error('Failed to fetch recent foods');
          }
          const data: FoodLogWithFood[] = await response.json();
          setRecentFoods(data);
        } catch (error) {
          console.error('Error fetching recent foods:', error);
          toast.error('Error', {
            description: 'Could not load recent foods.',
          });
        }
      };
      fetchRecentFoods();
    }
  }, [isOpen]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  const handleAddFood = async () => {
    if (!selectedFoodDetails || quantity <= 0) {
      toast.error('Error', {
        description: 'Please select a food and enter a valid quantity.',
      });
      return;
    }

    setIsAddingFood(true);
    try {
      const factor = quantity / 100;
      const nutrients: NutrientTotals = {
        calories: (selectedFoodDetails.foodNutrients.find(n => n.nutrient.name === 'Energy' && n.nutrient.unitName === 'KCAL')?.amount || 0) * factor,
        protein: (selectedFoodDetails.foodNutrients.find(n => n.nutrient.name === 'Protein' && n.nutrient.unitName === 'G')?.amount || 0) * factor,
        fat: (selectedFoodDetails.foodNutrients.find(n => n.nutrient.name === 'Total lipid (fat)' && n.nutrient.unitName === 'G')?.amount || 0) * factor,
        carbs: (selectedFoodDetails.foodNutrients.find(n => n.nutrient.name === 'Carbohydrate, by difference' && n.nutrient.unitName === 'G')?.amount || 0) * factor,
        fiber: (selectedFoodDetails.foodNutrients.find(n => n.nutrient.name === 'Fiber, total dietary' && n.nutrient.unitName === 'G')?.amount || 0) * factor,
        sugar: (selectedFoodDetails.foodNutrients.find(n => n.nutrient.name === 'Sugars, total including NLEA' && n.nutrient.unitName === 'G')?.amount || 0) * factor,
        sodium: (selectedFoodDetails.foodNutrients.find(n => n.nutrient.name === 'Sodium, Na' && n.nutrient.unitName === 'MG')?.amount || 0) * factor,
      };

      const payload: AddFoodLogPayload = {
        fdcId: selectedFoodDetails.fdcId,
        description: selectedFoodDetails.description,
        quantity,
        unit,
        slotHour: currentSlotHour,
        nutrients,
        brandName: selectedFoodDetails.brandName,
        servingSize: selectedFoodDetails.servingSize,
        servingUnit: selectedFoodDetails.servingSizeUnit,
      };

      await onAddFood(payload);
      onClose();
      toast('Food Added', {
        description: `Added ${selectedFoodDetails.description} to ${currentSlotHour}:00.`,
      });
    } catch (error) {
      console.error('Error adding food log:', error);
      toast.error('Error', {
        description: 'Failed to add food log.',
      });
    } finally {
      setIsAddingFood(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{selectedFoodDetails ? selectedFoodDetails.description : 'Add Food'}</DialogTitle>
        </DialogHeader>
        {!selectedFoodDetails ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search">Search</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
            </TabsList>
            <TabsContent value="search" className="mt-4">
              <Input
                placeholder="Search for food..."
                value={searchQuery}
                onChange={handleSearchInputChange}
              />
              <ScrollArea className="h-[200px] w-full rounded-md border mt-4">
                {isSearching ? (
                  <p className="p-4 text-center text-muted-foreground">Searching...</p>
                ) : searchResults.length > 0 ? (
                  searchResults.map((food) => (
                    <FoodCard key={food.fdcId} food={food} onSelect={setSelectedFoodDetails} />
                  ))
                ) : (
                  <p className="p-4 text-center text-muted-foreground">No foods found.</p>
                )}
              </ScrollArea>
            </TabsContent>
            <TabsContent value="recent" className="mt-4">
              <ScrollArea className="h-[200px] w-full rounded-md border mt-4">
                {recentFoods.length > 0 ? (
                  recentFoods.map((log) => (
                    <FoodCard
                      key={log.food_id}
                      food={{
                        fdcId: log.foods.fdc_id || 0,
                        description: log.foods.description,
                        dataType: 'Branded',
                        publishedDate: new Date().toISOString().split('T')[0],
                        brandOwner: log.foods.brand_name || undefined,
                        foodNutrients: [
                          { nutrientId: 1008, nutrientName: 'Energy', unitName: 'KCAL', value: log.foods.calories_per_100g || 0 },
                          { nutrientId: 1003, nutrientName: 'Protein', unitName: 'G', value: log.foods.protein_per_100g || 0 },
                          { nutrientId: 1004, nutrientName: 'Total lipid (fat)', unitName: 'G', value: log.foods.fat_per_100g || 0 },
                          { nutrientId: 1005, nutrientName: 'Carbohydrate, by difference', unitName: 'G', value: log.foods.carbs_per_100g || 0 },
                          { nutrientId: 1079, nutrientName: 'Fiber, total dietary', unitName: 'G', value: log.foods.fiber_per_100g || 0 },
                          { nutrientId: 2000, nutrientName: 'Sugars, total including NLEA', unitName: 'G', value: log.foods.sugar_per_100g || 0 },
                          { nutrientId: 1093, nutrientName: 'Sodium, Na', unitName: 'MG', value: log.foods.sodium_per_100g || 0 },
                        ].filter(n => n.value !== null) as Array<{
                          nutrientId: number;
                          nutrientName: string;
                          unitName: string;
                          value: number;
                        }>,
                      }}
                      onSelect={setSelectedFoodDetails}
                    />
                  ))
                ) : (
                  <p className="p-4 text-center text-muted-foreground">No recent foods.</p>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p><strong>Per 100g:</strong></p>
              <ul>
                <li>Calories: {Math.round(selectedFoodDetails.foodNutrients.find(n => n.nutrient.name === 'Energy' && n.nutrient.unitName === 'KCAL')?.amount || 0)}</li>
                <li>Protein: {Math.round(selectedFoodDetails.foodNutrients.find(n => n.nutrient.name === 'Protein' && n.nutrient.unitName === 'G')?.amount || 0)} g</li>
                <li>Fat: {Math.round(selectedFoodDetails.foodNutrients.find(n => n.nutrient.name === 'Total lipid (fat)' && n.nutrient.unitName === 'G')?.amount || 0)} g</li>
                <li>Carbs: {Math.round(selectedFoodDetails.foodNutrients.find(n => n.nutrient.name === 'Carbohydrate, by difference' && n.nutrient.unitName === 'G')?.amount || 0)} g</li>
                <li>Fiber: {Math.round(selectedFoodDetails.foodNutrients.find(n => n.nutrient.name === 'Fiber, total dietary' && n.nutrient.unitName === 'G')?.amount || 0)} g</li>
                <li>Sugar: {Math.round(selectedFoodDetails.foodNutrients.find(n => n.nutrient.name === 'Sugars, total including NLEA' && n.nutrient.unitName === 'G')?.amount || 0)} g</li>
                <li>Sodium: {Math.round(selectedFoodDetails.foodNutrients.find(n => n.nutrient.name === 'Sodium, Na' && n.nutrient.unitName === 'MG')?.amount || 0)} mg</li>
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value))}
                  min="1"
                  step="0.1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger id="unit">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="g">grams (g)</SelectItem>
                    <SelectItem value="ml">milliliters (ml)</SelectItem>
                    <SelectItem value="oz">ounces (oz)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleAddFood} className="w-full" disabled={isAddingFood}>
              {isAddingFood ? 'Adding...' : 'Add Food'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

function debounce<T extends (...args: A) => R, A extends unknown[], R>(func: T, delay: number): (...args: A) => void {
  let timeout: NodeJS.Timeout;
  return (...args: A) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

export function NutritionLogger() {
  const [isAddFoodDialogOpen, setIsAddFoodDialogOpen] = useState(false);
  const [currentSlotHour, setCurrentSlotHour] = useState(0);
  const [foodLogs, setFoodLogs] = useState<FoodLogWithFood[]>([]);
  const [calorieGoal] = useState(2000); // This should come from user settings

  const HOURS = Array.from({ length: 18 }, (_, i) => i + 3); // 3 AM to 8 PM

  const fetchFoodLogs = useCallback(async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    try {
      const response = await fetch(`/api/nutrition?date=${today}`);
      if (!response.ok) {
        throw new Error('Failed to fetch food logs');
      }
      const data: FoodLogWithFood[] = await response.json();
      setFoodLogs(data);
    } catch (error) {
      console.error('Error fetching food logs:', error);
      toast.error('Error', {
        description: "Could not load today's food logs.",
      });
    }
  }, []);

  useEffect(() => {
    fetchFoodLogs();
  }, [fetchFoodLogs]);

  const handleAddFoodClick = (hour: number) => {
    setCurrentSlotHour(hour);
    setIsAddFoodDialogOpen(true);
  };

  const handleAddFood = async (newFoodLog: AddFoodLogPayload) => {
    try {
      const response = await fetch('/api/nutrition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newFoodLog),
      });

      if (!response.ok) {
        throw new Error('Failed to add food log');
      }

      // Re-fetch logs to update the UI
      await fetchFoodLogs();
    } catch (error) {
      console.error('Error adding food log:', error);
      toast.error('Error', {
        description: 'Failed to add food log.',
      });
    }
  };

  const dailyTotals: NutrientTotals = foodLogs.reduce(
    (acc, log) => {
      const calories = log.quantity * (log.foods.calories_per_100g || 0) / 100;
      const protein = log.quantity * (log.foods.protein_per_100g || 0) / 100;
      const carbs = log.quantity * (log.foods.carbs_per_100g || 0) / 100;
      const fat = log.quantity * (log.foods.fat_per_100g || 0) / 100;
      const fiber = log.quantity * (log.foods.fiber_per_100g || 0) / 100;
      const sugar = log.quantity * (log.foods.sugar_per_100g || 0) / 100;
      const sodium = log.quantity * (log.foods.sodium_per_100g || 0) / 100;

      acc.calories += calories;
      acc.protein += protein;
      acc.carbs += carbs;
      acc.fat += fat;
      acc.fiber += fiber;
      acc.sugar += sugar;
      acc.sodium += sodium;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
  );

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Today&apos;s Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <MacroTotals totals={dailyTotals} calorieGoal={calorieGoal} />
        </CardContent>
      </Card>

      <div className="space-y-4">
        {HOURS.map((hour) => (
          <Card key={hour}>
            <CardContent className="p-4">
              <HourSlot hour={hour} onAddFood={handleAddFoodClick} foodLogs={foodLogs} />
            </CardContent>
          </Card>
        ))}
      </div>

      <AddFoodDialog
        isOpen={isAddFoodDialogOpen}
        onClose={() => {
          setIsAddFoodDialogOpen(false);
        }}
        onAddFood={handleAddFood}
        currentSlotHour={currentSlotHour}
      />
    </div>
  );
}