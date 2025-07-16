// src/app/api/nutrition/food/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'
import { USDAClient, FoodDetailsSchema } from '@/lib/nutrition/usda'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const fdcId = parseInt(id, 10)
    if (isNaN(fdcId)) {
      return NextResponse.json({ error: 'Invalid FDC ID' }, { status: 400 })
    }

    // 1. Check if food exists in our `foods` table
    const { data: existingFood, error: existingFoodError } = await supabase
      .from('foods')
      .select('*')
      .eq('fdc_id', fdcId)
      .maybeSingle()

    if (existingFoodError && existingFoodError.code !== 'PGRST116') { // 'PGRST116' means no rows found
      console.error('Error checking for existing food:', existingFoodError)
      return NextResponse.json({ error: 'Failed to check existing food' }, { status: 500 })
    }

    if (existingFood) {
      return NextResponse.json(existingFood)
    }

    // 2. If not found, fetch from USDA API
    if (!process.env.USDA_API_KEY) {
      console.error('USDA_API_KEY environment variable not set.')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const usdaClient = new USDAClient(process.env.USDA_API_KEY)
    const usdaFoodDetails = await usdaClient.getDetails(fdcId)

    if (!usdaFoodDetails) {
      return NextResponse.json({ error: 'Food not found in USDA database' }, { status: 404 })
    }

    // Validate USDA response with Zod
    const validation = FoodDetailsSchema.safeParse(usdaFoodDetails)
    if (!validation.success) {
      console.error('USDA Food Details validation error:', validation.error.flatten())
      return NextResponse.json({ error: 'Invalid USDA food details received' }, { status: 500 })
    }

    // 3. Insert into our `foods` table
    const { data: newFood, error: insertError } = await supabase
      .from('foods')
      .insert({
        fdc_id: validation.data.fdcId,
        description: validation.data.description,
        brand_name: validation.data.brandName || null,
        serving_size: validation.data.servingSize || null,
        serving_unit: validation.data.servingUnit || null,
        calories_per_100g: validation.data.foodNutrients?.find(n => n.nutrientId === 1008)?.value || null,
        protein_per_100g: validation.data.foodNutrients?.find(n => n.nutrientId === 1003)?.value || null,
        fat_per_100g: validation.data.foodNutrients?.find(n => n.nutrientId === 1004)?.value || null,
        carbs_per_100g: validation.data.foodNutrients?.find(n => n.nutrientId === 1005)?.value || null,
        fiber_per_100g: validation.data.foodNutrients?.find(n => n.nutrientId === 1007)?.value || null,
        sugar_per_100g: validation.data.foodNutrients?.find(n => n.nutrientId === 2000)?.value || null,
        sodium_per_100g: validation.data.foodNutrients?.find(n => n.nutrientId === 1093)?.value || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting new food from USDA:', insertError)
      return NextResponse.json({ error: 'Failed to save food details' }, { status: 500 })
    }

    return NextResponse.json(newFood, { status: 201 })

  } catch (error) {
    console.error('GET food/[id] error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}