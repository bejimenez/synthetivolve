// src/app/api/fitness/mesocycles/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'
import { z } from 'zod'

// Schema for day exercise configuration
const dayExerciseSchema = z.object({
  exercise_id: z.string().uuid(),
  order_index: z.number().int(),
})

// Schema for day plan configuration
const dayPlanSchema = z.object({
  day_number: z.number().int().min(1).max(7),
  exercises: z.array(dayExerciseSchema),
})

// Schema for creating a complete mesocycle
const mesocycleCreateSchema = z.object({
  name: z.string().min(1, 'Mesocycle name is required'),
  weeks: z.number().int().min(2).max(16),
  days_per_week: z.number().int().min(1).max(7),
  specialization: z.array(z.string()).optional(),
  goal_statement: z.string().optional(),
  is_template: z.boolean().optional(),
  days: z.array(dayPlanSchema),
  plan_data: z.any().optional(), // Added plan_data to schema
})

export async function GET() {
  try {
    // Await the cookies() function (Next.js 15+ requirement)
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's mesocycles (excluding soft-deleted ones)
    // This is a simplified GET. A real implementation would fetch and join related data.
    const { data, error } = await supabase
      .from('mesocycles')
      .select('*, plan_data')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('GET request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // Await the cookies() function (Next.js 15+ requirement)
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = mesocycleCreateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input', 
          details: validation.error.flatten() 
        }, 
        { status: 400 }
      )
    }

    // In a real app, you would use a database transaction (RPC call in Supabase)
    // to create the mesocycle and all its related days and exercises atomically.
    // For simplicity here, we'll do it in steps with cleanup on failure.

    const { days, ...mesoData } = validation.data

    // Step 1: Create the mesocycle
    const { data: newMeso, error: mesoError } = await supabase
      .from('mesocycles')
      .insert({ 
        ...mesoData, 
        user_id: user.id,
        created_at: new Date().toISOString()
        // Note: updated_at exists in mesocycles table
      })
      .select()
      .single()

    if (mesoError) {
      console.error('Mesocycle creation error:', mesoError)
      return NextResponse.json(
        { error: `Failed to create mesocycle: ${mesoError.message}` }, 
        { status: 500 }
      )
    }

    // Step 2: Create the days and exercises for the mesocycle
    try {
      for (const day of days) {
        // Create mesocycle day
        const { data: newDay, error: dayError } = await supabase
          .from('mesocycle_days')
          .insert({ 
            mesocycle_id: newMeso.id, 
            day_number: day.day_number,
            created_at: new Date().toISOString()
            // Note: mesocycle_days table does NOT have updated_at
          })
          .select()
          .single()

        if (dayError) {
          throw new Error(`Failed to create day ${day.day_number}: ${dayError.message}`)
        }

        // Step 3: Create the exercises for the day
        if (day.exercises.length > 0) {
          const dayExercisesData = day.exercises.map(ex => ({
            day_id: newDay.id,
            exercise_id: ex.exercise_id,
            order_index: ex.order_index,
            created_at: new Date().toISOString()
            // Note: day_exercises table does NOT have updated_at
          }))

          const { error: dayExercisesError } = await supabase
            .from('day_exercises')
            .insert(dayExercisesData)

          if (dayExercisesError) {
            throw new Error(`Failed to add exercises to day ${day.day_number}: ${dayExercisesError.message}`)
          }
        }
      }

      // Success: Return the created mesocycle
      // (A more complex query would be needed to get all nested data)
      return NextResponse.json(newMeso, { status: 201 })

    } catch (stepError) {
      // Cleanup: Delete the mesocycle if any step fails
      console.error('Mesocycle creation step failed:', stepError)
      
      const { error: cleanupError } = await supabase
        .from('mesocycles')
        .delete()
        .eq('id', newMeso.id)

      if (cleanupError) {
        console.error('Cleanup failed:', cleanupError)
      }

      const errorMessage = stepError instanceof Error ? stepError.message : 'An unknown error occurred during a creation step.';
      return NextResponse.json(
        { error: errorMessage }, 
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('POST request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}