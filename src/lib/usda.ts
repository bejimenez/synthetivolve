import { UsdaFoodSearchResponseSchema, UsdaFoodDetailsSchema } from './nutrition.schemas';
import { UsdaFoodSearchItem, UsdaFoodDetails } from './nutrition.types';

const USDA_API_KEY = process.env.NEXT_PUBLIC_USDA_API_KEY;
const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const searchCache = new Map<string, CacheEntry<UsdaFoodSearchItem[]>>();
const detailsCache = new Map<number, CacheEntry<UsdaFoodDetails>>();

const CACHE_DURATION_SEARCH = 10 * 60 * 1000; // 10 minutes
const CACHE_DURATION_DETAILS = 24 * 60 * 60 * 1000; // 24 hours

let activeAbortController: AbortController | null = null;

const getNutrientAmount = (foodNutrients: UsdaFoodDetails['foodNutrients'], nutrientName: string, unitName: string): number => {
  const nutrient = foodNutrients.find(n => n.nutrient.name.toLowerCase() === nutrientName.toLowerCase() && n.nutrient.unitName.toLowerCase() === unitName.toLowerCase());
  return nutrient ? nutrient.amount : 0;
};

export async function FdcSearch(query: string): Promise<UsdaFoodSearchItem[]> {
  if (!USDA_API_KEY) {
    console.error('USDA API Key is not set.');
    return [];
  }

  if (query.length < 2) {
    return [];
  }

  const cached = searchCache.get(query);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_SEARCH) {
    return cached.data;
  }

  // Abort any ongoing search requests
  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();
  const { signal } = activeAbortController;

  try {
    const response = await fetch(`${BASE_URL}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&dataType=Branded&pageSize=20`, {
      signal,
    });

    if (!response.ok) {
      throw new Error(`USDA API search failed: ${response.statusText}`);
    }

    const data = await response.json();
    const parsedData = UsdaFoodSearchResponseSchema.parse(data);

    const foods = parsedData.foods.map(item => ({
      fdcId: item.fdcId,
      description: item.description,
      dataType: item.dataType,
      publishedDate: item.publishedDate,
      brandOwner: item.brandOwner,
      gtinUpc: item.gtinUpc,
      foodNutrients: item.foodNutrients,
    }));

    searchCache.set(query, { data: foods, timestamp: Date.now() });
    return foods;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.log('USDA search aborted.');
    } else {
      console.error('Error searching USDA foods:', error);
    }
    return [];
  } finally {
    activeAbortController = null;
  }
}

export async function FdcDetails(fdcId: number): Promise<UsdaFoodDetails | null> {
  if (!USDA_API_KEY) {
    console.error('USDA API Key is not set.');
    return null;
  }

  const cached = detailsCache.get(fdcId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_DETAILS) {
    return cached.data;
  }

  try {
    const response = await fetch(`${BASE_URL}/food/${fdcId}?api_key=${USDA_API_KEY}`);

    if (!response.ok) {
      throw new Error(`USDA API details failed: ${response.statusText}`);
    }

    const data = await response.json();
    const parsedData = UsdaFoodDetailsSchema.parse(data);

    const details: UsdaFoodDetails = {
      fdcId: parsedData.fdcId,
      description: parsedData.description,
      brandName: parsedData.brandName,
      servingSize: parsedData.servingSize,
      servingSizeUnit: parsedData.servingSizeUnit,
      foodNutrients: parsedData.foodNutrients,
    };

    detailsCache.set(fdcId, { data: details, timestamp: Date.now() });
    return details;
  } catch (error) {
    console.error(`Error fetching USDA food details for FDC ID ${fdcId}:`, error);
    return null;
  }
}

export const getNutrientsFromUsdaDetails = (details: UsdaFoodDetails) => {
  const nutrients = details.foodNutrients;
  return {
    calories: getNutrientAmount(nutrients, 'Energy', 'KCAL'),
    protein: getNutrientAmount(nutrients, 'Protein', 'G'),
    fat: getNutrientAmount(nutrients, 'Total lipid (fat)', 'G'),
    carbs: getNutrientAmount(nutrients, 'Carbohydrate, by difference', 'G'),
    fiber: getNutrientAmount(nutrients, 'Fiber, total dietary', 'G'),
    sugar: getNutrientAmount(nutrients, 'Sugars, total including NLEA', 'G'),
    sodium: getNutrientAmount(nutrients, 'Sodium, Na', 'MG'),
  };
};
