import { z } from 'zod'

// USDA API types and schemas
const NutrientSchema = z.object({
  nutrientId: z.number(),
  nutrientName: z.string(),
  nutrientNumber: z.string(),
  unitName: z.string(),
  value: z.number(),
})

export const FoodSearchResultSchema = z.object({
  fdcId: z.number(),
  description: z.string(),
  brandName: z.string().optional(),
  brandOwner: z.string().optional(),
  dataType: z.string(),
  foodNutrients: z.array(NutrientSchema).optional(),
})

export const FoodDetailsSchema = FoodSearchResultSchema.extend({
  ingredients: z.string().optional(),
  servingSize: z.number().optional(),
  servingUnit: z.string().optional(),
})

export type FoodSearchResult = z.infer<typeof FoodSearchResultSchema>
export type FoodDetails = z.infer<typeof FoodDetailsSchema>

// Implement the USDA API client with proper caching
export class USDAClient {
  private apiKey: string
  private cache: Map<string, { data: unknown; timestamp: number }>
  private cacheTTL: number = 1000 * 60 * 60 // 1 hour

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('USDA API key is required.')
    }
    this.apiKey = apiKey
    this.cache = new Map()
  }

  private isCacheValid(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    return Date.now() - entry.timestamp < this.cacheTTL
  }

  async search(query: string): Promise<FoodSearchResult[]> {
    const cacheKey = `search:${query}`
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!.data as FoodSearchResult[]
    }

    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${this.apiKey}&query=${encodeURIComponent(
      query
    )}&dataType=Branded,Foundation,SR%20Legacy&pageSize=25`

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`USDA API request failed with status ${response.status}`)
      }
      const data = await response.json()
      
      const searchResults = z.array(FoodSearchResultSchema).parse(data.foods)
      
      this.cache.set(cacheKey, { data: searchResults, timestamp: Date.now() })
      
      return searchResults
    } catch (error) {
      console.error('Error searching USDA database:', error)
      throw error
    }
  }

  async getDetails(fdcId: number): Promise<FoodDetails | null> {
    const cacheKey = `details:${fdcId}`
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!.data as FoodDetails
    }

    const url = `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${this.apiKey}`

    try {
      const response = await fetch(url)
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error(`USDA API request failed with status ${response.status}`)
      }
      const data = await response.json()
      
      const foodDetails = FoodDetailsSchema.parse(data)
      
      this.cache.set(cacheKey, { data: foodDetails, timestamp: Date.now() })

      return foodDetails
    } catch (error) {
      console.error(`Error fetching details for FDC ID ${fdcId}:`, error)
      throw error
    }
  }
}
