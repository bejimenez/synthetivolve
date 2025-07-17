import { Database } from './database.types';
import { z } from 'zod';
import { AddFoodLogSchema } from './nutrition.schemas';

export type Food = Database['public']['Tables']['foods']['Row'];
export type FoodLog = Database['public']['Tables']['food_logs']['Row'];
export type NutritionSettings = Database['public']['Tables']['nutrition_settings']['Row'];
export type RecentFood = Database['public']['Tables']['recent_foods']['Row'];

export type FoodLogWithFood = FoodLog & { foods: Food };

export interface NutrientTotals {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

export interface UsdaFoodSearchItem {
  fdcId: number;
  description: string;
  dataType: string;
  publishedDate: string;
  brandOwner?: string;
  gtinUpc?: string;
  foodNutrients: Array<{
    nutrientId: number;
    nutrientName: string;
    unitName: string;
    value: number;
  }>;
}

export type UsdaFoodDetails = {
  fdcId: number;
  description: string;
  brandName?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients: Array<{
    nutrient: {
      id: number;
      name: string;
      unitName: string;
    };
    amount: number;
  }>;
};

export type AddFoodLogPayload = z.infer<typeof AddFoodLogSchema>;
