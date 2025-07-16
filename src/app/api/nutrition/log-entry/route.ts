// src/app/api/nutrition/log-entry/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'
import { z } from 'zod'
import { FoodDetailsSchema } from '@/lib/nutrition/usda'

const logEntrySchema = z.object({
  fdcId: z.number(),
  quantity: z.number().positive(),
  unit: z.string(),
  logged_at: z.string().datetime(),
  logged_date: z.string().date(),
  foodDetails: FoodDetailsSchema, // Pass the full food details from the client
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
      return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 })
    }

    const { fdcId, quantity, unit, logged_at, logged_date, foodDetails } = validation.data

    // Step 1: Check if food exists in our `foods` table, or create it.
    let food;
    const { data: existingFood, error: foodError } = await supabase
      .from('foods')
      .select('id')
      .eq('fdc_id', fdcId)
      .single()

    if (foodError && foodError.code !== 'PGRST116') { // 'PGRST116' means no rows found
      throw new Error(`Error checking for existing food: ${foodError.message}`)
    }

    if (existingFood) {
      food = existingFood;
    } else {
      // Food not found, so create it
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
        })
        .select('id')
        .single()
      
      if (newFoodError) {
        throw new Error(`Error creating new food entry: ${newFoodError.message}`)
      }
      food = newFood
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

    // Step 3: Increment recent food usage (fire and forget)
    await supabase.rpc('increment_recent_food_use_count', { p_user_id: user.id, p_food_id: food.id })

    return NextResponse.json(newLog, { status: 201 })

  } catch (error) {
    console.error('POST log-entry error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
