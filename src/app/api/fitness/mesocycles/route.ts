// src/app/api/fitness/mesocycles/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'
import { z } from 'zod'

// We'll need a more complex schema for creating a full mesocycle
const dayExerciseSchema = z.object({
  exercise_id: z.string().uuid(),
  order_index: z.number().int(),
});

const dayPlanSchema = z.object({
  day_number: z.number().int().min(1).max(7),
  exercises: z.array(dayExerciseSchema),
});

const mesocycleCreateSchema = z.object({
  name: z.string().min(1),
  weeks: z.number().int().min(2).max(16),
  days_per_week: z.number().int().min(1).max(7),
  specialization: z.array(z.string()).optional(),
  goal_statement: z.string().optional(),
  is_template: z.boolean().optional(),
  days: z.array(dayPlanSchema),
});


export async function GET() {
  const cookieStore = cookies()
  const supabase = createSupabaseServerClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // This is a simplified GET. A real implementation would fetch and join related data.
  const { data, error } = await supabase
    .from('mesocycles')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createSupabaseServerClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const validation = mesocycleCreateSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 })
  }

  // In a real app, you would use a database transaction (RPC call in Supabase)
  // to create the mesocycle and all its related days and exercises atomically.
  // For simplicity here, we'll do it in steps.

  const { days, ...mesoData } = validation.data;

  // 1. Create the mesocycle
  const { data: newMeso, error: mesoError } = await supabase
    .from('mesocycles')
    .insert({ ...mesoData, user_id: user.id })
    .select()
    .single();

  if (mesoError) {
    return NextResponse.json({ error: `Failed to create mesocycle: ${mesoError.message}` }, { status: 500 });
  }

  // 2. Create the days for the mesocycle
  for (const day of days) {
    const { data: newDay, error: dayError } = await supabase
      .from('mesocycle_days')
      .insert({ mesocycle_id: newMeso.id, day_number: day.day_number })
      .select()
      .single();

    if (dayError) {
      // Attempt to clean up if a step fails
      await supabase.from('mesocycles').delete().eq('id', newMeso.id);
      return NextResponse.json({ error: `Failed to create day ${day.day_number}: ${dayError.message}` }, { status: 500 });
    }

    // 3. Create the exercises for the day
    if (day.exercises.length > 0) {
        const dayExercisesData = day.exercises.map(ex => ({
            day_id: newDay.id,
            exercise_id: ex.exercise_id,
            order_index: ex.order_index,
        }));

        const { error: dayExercisesError } = await supabase
            .from('day_exercises')
            .insert(dayExercisesData);

        if (dayExercisesError) {
            await supabase.from('mesocycles').delete().eq('id', newMeso.id); // Cleanup
            return NextResponse.json({ error: `Failed to add exercises to day ${day.day_number}: ${dayExercisesError.message}` }, { status: 500 });
        }
    }
  }

  // Refetch the full mesocycle data to return
  // (A more complex query would be needed to get all nested data)
  return NextResponse.json(newMeso, { status: 201 });
}
