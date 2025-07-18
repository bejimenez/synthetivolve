// src/app/api/nutrition/log-entry/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'
import { z } from 'zod'
import { FoodDetailsSchema } from '@/lib/nutrition/usda'

const logEntrySchema = z.object({
  fdcId: z.number().nullable(), // Allow null for manual foods
  quantity: z.number().positive(),
  unit: z.string(),
  logged_at: z.string().datetime(),
  logged_date: z.string().date(),
  foodDetails: FoodDetailsSchema.extend({
    // Extend to handle manual foods
    dataType: z.string().optional(),
  }),
})

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createSupabaseServerClient(cookieStore)

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = logEntrySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Invalid input', 
        details: validation.error.flatten() 
      }, { status: 400 })
    }

    const { fdcId, quantity, unit, logged_at, logged_date, foodDetails } = validation.data

    let food

    if (fdcId && fdcId > 0) {
      // Handle USDA foods (existing logic)
      const { data: existingFood, error: foodError } = await supabase
        .from('foods')
        .select('id')
        .eq('fdc_id', fdcId)
        .single()

      if (foodError && foodError.code !== 'PGRST116') {
        throw new Error(`Error checking for existing food: ${foodError.message}`)
      }

      if (existingFood) {
        food = existingFood
      } else {
        // Create USDA food entry
        const { data: newFood, error: newFoodError } = await supabase
          .from('foods')
          .insert({
            fdc_id: fdcId,
            description: foodDetails.description,
            brand_name: foodDetails.brandName,
            calories_per_100g: foodDetails.foodNutrients?.find(n => n.nutrientId === 1008)?.value || null,
            protein_per_100g: foodDetails.foodNutrients?.find(n => n.nutrientId === 1003)?.value || null,
            fat_per_100g: foodDetails.foodNutrients?.find(n => n.nutrientId === 1004)?.value || null,
            carbs_per_100g: foodDetails.foodNutrients?.find(n => n.nutrientId === 1005)?.value || null,
            fiber_per_100g: foodDetails.foodNutrients?.find(n => n.nutrientId === 1007)?.value || null,
            sugar_per_100g: foodDetails.foodNutrients?.find(n => n.nutrientId === 2000)?.value || null,
            sodium_per_100g: foodDetails.foodNutrients?.find(n => n.nutrientId === 1093)?.value || null,
          })
          .select('id')
          .single()
        
        if (newFoodError) {
          throw new Error(`Error creating new food entry: ${newFoodError.message}`)
        }
        food = newFood
      }
    } else {
      // Handle manual foods - look up by description since there's no fdcId
      const { data: existingManualFood, error: manualFoodError } = await supabase
        .from('foods')
        .select('id')
        .eq('description', foodDetails.description)
        .is('fdc_id', null) // Only manual entries
        .single()

      if (manualFoodError && manualFoodError.code !== 'PGRST116') {
        throw new Error(`Error checking for existing manual food: ${manualFoodError.message}`)
      }

      if (existingManualFood) {
        food = existingManualFood
      } else {
        // This shouldn't happen if the manual food was created properly
        // But we can create it here as a fallback
        const { data: newManualFood, error: newManualFoodError } = await supabase
          .from('foods')
          .insert({
            fdc_id: null,
            description: foodDetails.description,
            brand_name: foodDetails.brandName || null,
            calories_per_100g: foodDetails.foodNutrients?.find(n => n.nutrientId === 1008)?.value || null,
            protein_per_100g: foodDetails.foodNutrients?.find(n => n.nutrientId === 1003)?.value || null,
            fat_per_100g: foodDetails.foodNutrients?.find(n => n.nutrientId === 1004)?.value || null,
            carbs_per_100g: foodDetails.foodNutrients?.find(n => n.nutrientId === 1005)?.value || null,
            fiber_per_100g: foodDetails.foodNutrients?.find(n => n.nutrientId === 1007)?.value || null,
            sugar_per_100g: foodDetails.foodNutrients?.find(n => n.nutrientId === 2000)?.value || null,
            sodium_per_100g: foodDetails.foodNutrients?.find(n => n.nutrientId === 1093)?.value || null,
          })
          .select('id')
          .single()
        
        if (newManualFoodError) {
          throw new Error(`Error creating manual food entry: ${newManualFoodError.message}`)
        }
        food = newManualFood
      }
    }

    // Step 2: Create the food log entry
    const { data: newLog, error: logError } = await supabase
      .from('food_logs')
      .insert({
        user_id: user.id,
        food_id: food.id,
        quantity,
        unit,
        logged_at,
        logged_date,
      })
      .select()
      .single()

    if (logError) {
      throw new Error(`Error creating food log: ${logError.message}`)
    }

    // Step 3: Update recent food usage (fire and forget)
    try {
      await supabase.rpc('increment_recent_food_use_count', { 
        p_user_id: user.id, 
        p_food_id: food.id 
      })
    } catch (recentError) {
      // Log the error but don't fail the request
      console.warn('Failed to update recent food usage:', recentError)
    }

    return NextResponse.json(newLog, { status: 201 })

  } catch (error) {
    console.error('POST log-entry error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}