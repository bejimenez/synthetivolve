import { z } from 'zod';

export const FoodSchema = z.object({
  id: z.string().uuid().optional(),
  fdc_id: z.number().int().optional().nullable(),
  description: z.string().min(1, 'Description is required'),
  brand_name: z.string().nullable().optional(),
  serving_size: z.number().nullable().optional(),
  serving_unit: z.string().nullable().optional(),
  calories_per_100g: z.number().nullable().optional(),
  protein_per_100g: z.number().nullable().optional(),
  fat_per_100g: z.number().nullable().optional(),
  carbs_per_100g: z.number().nullable().optional(),
  fiber_per_100g: z.number().nullable().optional(),
  sugar_per_100g: z.number().nullable().optional(),
  sodium_per_100g: z.number().nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const FoodLogSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  food_id: z.string().uuid(),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  logged_at: z.string().datetime(),
  logged_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  deleted_at: z.string().datetime().nullable().optional(),
});

export const NutritionSettingsSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  logging_start_hour: z.number().int().min(0).max(23).optional(),
  logging_end_hour: z.number().int().min(0).max(23).optional(),
  timezone: z.string().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const RecentFoodSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  food_id: z.string().uuid(),
  last_used: z.string().datetime().optional(),
  use_count: z.number().int().min(0).optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

// Schemas for USDA API responses
const UsdaNutrientSchema = z.object({
  nutrientId: z.number().int(),
  nutrientName: z.string(),
  unitName: z.string(),
  value: z.number(),
});

export const UsdaFoodSearchItemSchema = z.object({
  fdcId: z.number().int(),
  description: z.string(),
  dataType: z.string(),
  publishedDate: z.string(),
  brandOwner: z.string().optional(),
  gtinUpc: z.string().optional(),
  foodNutrients: z.array(UsdaNutrientSchema),
});

export const UsdaFoodSearchResponseSchema = z.object({
  foods: z.array(UsdaFoodSearchItemSchema),
  totalHits: z.number().int(),
  currentPage: z.number().int(),
  totalPages: z.number().int(),
});

const UsdaFoodDetailsNutrientSchema = z.object({
  nutrient: z.object({
    id: z.number().int(),
    name: z.string(),
    unitName: z.string(),
  }),
  amount: z.number(),
});

export const UsdaFoodDetailsSchema = z.object({
  fdcId: z.number().int(),
  description: z.string(),
  brandName: z.string().optional(),
  servingSize: z.number().optional(),
  servingSizeUnit: z.string().optional(),
  foodNutrients: z.array(UsdaFoodDetailsNutrientSchema),
});

// Schema for adding a food log from the UI
export const AddFoodLogSchema = z.object({
  fdcId: z.number().int().optional(), // Optional if food is custom
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  slotHour: z.number().int().min(0).max(23), // Hour of the day
  loggedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(), // YYYY-MM-DD, defaults to today
  nutrients: z.object({
    calories: z.number(),
    protein: z.number(),
    fat: z.number(),
    carbs: z.number(),
    fiber: z.number(),
    sugar: z.number(),
    sodium: z.number(),
  }),
  brandName: z.string().nullable().optional(),
  servingSize: z.number().nullable().optional(),
  servingUnit: z.string().nullable().optional(),
});


