// src/app/api/nutrition/foods/manual/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'
import { z } from 'zod'

const manualFoodSchema = z.object({
  description: z.string().min(1, 'Food name is required').max(255),
  brand_name: z.string().max(255).optional(),
  serving_size: z.number().positive().optional(),
  serving_unit: z.string().max(50).optional(),
  calories_per_100g: z.number().min(0).max(9999).optional(),
  protein_per_100g: z.number().min(0).max(999).optional(),
  fat_per_100g: z.number().min(0).max(999).optional(),
  carbs_per_100g: z.number().min(0).max(999).optional(),
  fiber_per_100g: z.number().min(0).max(999).optional(),
  sugar_per_100g: z.number().min(0).max(999).optional(),
  sodium_per_100g: z.number().min(0).max(99999).optional()
})

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createSupabaseServerClient(cookieStore)

  try {
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = manualFoodSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Invalid input', 
        details: validation.error.flatten() 
      }, { status: 400 })
    }

    const foodData = validation.data

    // Check if a food with the same description already exists for this user
    // This prevents duplicate manual entries
    const { data: existingFood, error: checkError } = await supabase
      .from('foods')
      .select('id, description')
      .eq('description', foodData.description)
      .is('fdc_id', null) // Only check manual entries (no USDA ID)
      .limit(1)

    if (checkError) {
      console.error('Error checking for existing food:', checkError)
      return NextResponse.json({ 
        error: 'Failed to check for existing food' 
      }, { status: 500 })
    }

    if (existingFood && existingFood.length > 0) {
      return NextResponse.json({ 
        error: 'A food with this name already exists',
        existing_food: existingFood[0]
      }, { status: 409 })
    }

    // Create the new manual food entry
    const { data: newFood, error: insertError } = await supabase
      .from('foods')
      .insert({
        fdc_id: null, // Explicitly null for manual entries
        description: foodData.description,
        brand_name: foodData.brand_name || null,
        serving_size: foodData.serving_size || null,
        serving_unit: foodData.serving_unit || null,
        calories_per_100g: foodData.calories_per_100g || null,
        protein_per_100g: foodData.protein_per_100g || null,
        fat_per_100g: foodData.fat_per_100g || null,
        carbs_per_100g: foodData.carbs_per_100g || null,
        fiber_per_100g: foodData.fiber_per_100g || null,
        sugar_per_100g: foodData.sugar_per_100g || null,
        sodium_per_100g: foodData.sodium_per_100g || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating manual food entry:', insertError)
      return NextResponse.json({ 
        error: 'Failed to create food entry' 
      }, { status: 500 })
    }

    return NextResponse.json(newFood, { status: 201 })

  } catch (error) {
    console.error('POST manual food error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}