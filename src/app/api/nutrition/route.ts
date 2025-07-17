import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { format } from 'date-fns';

import { AddFoodLogSchema } from '@/lib/nutrition.schemas';

export const dynamic = 'force-dynamic';

// GET /api/nutrition - Get food logs for a specific date
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date'); // YYYY-MM-DD

  if (!date) {
    return NextResponse.json({ error: 'Date parameter is required.' }, { status: 400 });
  }

  const supabase = createRouteHandlerClient({ cookies: () => cookies() });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from('food_logs')
      .select(`
        *,
        foods (*)
      `)
      .eq('user_id', session.user.id)
      .eq('logged_date', date)
      .is('deleted_at', null);

    if (error) {
      console.error('Error fetching food logs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error fetching food logs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/nutrition - Add a new food log
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies: () => cookies() });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsedBody = AddFoodLogSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ error: parsedBody.error.errors }, { status: 400 });
    }

    const { fdcId, description, quantity, unit, slotHour, loggedDate, nutrients, brandName, servingSize, servingUnit } = parsedBody.data;

    let food_id: string;

    // 1. Check if food exists in our 'foods' table by fdc_id
    if (fdcId) {
      const { data: existingFood, error: foodError } = await supabase
        .from('foods')
        .select('id')
        .eq('fdc_id', fdcId)
        .single();

      if (foodError && foodError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Error checking existing food:', foodError);
        throw new Error(foodError.message);
      }

      if (existingFood) {
        food_id = existingFood.id;
      } else {
        // If not, insert it
        const { data: newFood, error: insertFoodError } = await supabase
          .from('foods')
          .insert({
            fdc_id: fdcId,
            description,
            brand_name: brandName,
            serving_size: servingSize,
            serving_unit: servingUnit,
            calories_per_100g: nutrients.calories / (quantity / 100),
            protein_per_100g: nutrients.protein / (quantity / 100),
            fat_per_100g: nutrients.fat / (quantity / 100),
            carbs_per_100g: nutrients.carbs / (quantity / 100),
            fiber_per_100g: nutrients.fiber / (quantity / 100),
            sugar_per_100g: nutrients.sugar / (quantity / 100),
            sodium_per_100g: nutrients.sodium / (quantity / 100),
          })
          .select('id')
          .single();

        if (insertFoodError) {
          console.error('Error inserting new food:', insertFoodError);
          throw new Error(insertFoodError.message);
        }
        food_id = newFood.id;
      }
    } else {
      // Handle custom food (no fdcId)
      const { data: newFood, error: insertFoodError } = await supabase
        .from('foods')
        .insert({
          description,
          calories_per_100g: nutrients.calories / (quantity / 100),
          protein_per_100g: nutrients.protein / (quantity / 100),
          fat_per_100g: nutrients.fat / (quantity / 100),
          carbs_per_100g: nutrients.carbs / (quantity / 100),
          fiber_per_100g: nutrients.fiber / (quantity / 100),
          sugar_per_100g: nutrients.sugar / (quantity / 100),
          sodium_per_100g: nutrients.sodium / (quantity / 100),
        })
        .select('id')
        .single();

      if (insertFoodError) {
        console.error('Error inserting custom food:', insertFoodError);
        throw new Error(insertFoodError.message);
      }
      food_id = newFood.id;
    }

    // 2. Insert food log
    const currentLoggedDate = loggedDate || format(new Date(), 'yyyy-MM-dd');
    const loggedAt = new Date();
    loggedAt.setHours(slotHour, 0, 0, 0);

    const { data: newFoodLog, error: logError } = await supabase
      .from('food_logs')
      .insert({
        user_id: session.user.id,
        food_id,
        quantity,
        unit,
        logged_at: loggedAt.toISOString(),
        logged_date: currentLoggedDate,
      })
      .select('*')
      .single();

    if (logError) {
      console.error('Error inserting food log:', logError);
      throw new Error(logError.message);
    }

    // 3. Update recent foods (using the RPC function)
    const { error: rpcError } = await supabase.rpc('increment_recent_food_use_count', {
      p_user_id: session.user.id,
      p_food_id: food_id,
    });

    if (rpcError) {
      console.error('Error updating recent food count:', rpcError);
      // Do not throw, as food log was already created successfully
    }

    return NextResponse.json(newFoodLog, { status: 201 });
  } catch (error) {
    console.error('Unexpected error adding food log:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}