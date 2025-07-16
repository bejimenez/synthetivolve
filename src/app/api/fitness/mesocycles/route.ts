// src/app/api/fitness/mesocycles/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'
import { z } from 'zod'

// Schema for creating a complete mesocycle (now includes plan_data)
const mesocycleCreateSchema = z.object({
  name: z.string().min(1, 'Mesocycle name is required'),
  weeks: z.number().int().min(2).max(16),
  days_per_week: z.number().int().min(1).max(7),
  specialization: z.array(z.string()).optional(),
  goal_statement: z.string().optional(),
  is_template: z.boolean().optional(),
  // plan_data will be a JSONB object containing days and exerciseDB
  plan_data: z.object({
    days: z.array(z.object({
      day_number: z.number().int().min(1).max(7),
      exercises: z.array(z.object({
        exercise_id: z.string().uuid(),
        order_index: z.number().int(),
      })),
    })),
    exerciseDB: z.record(z.string().uuid(), z.object({
      id: z.string().uuid(),
      name: z.string(),
      primary: z.string(),
      secondary: z.array(z.string()).optional(),
      equipment: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
      useRIRRPE: z.boolean(),
    })).optional(),
  }).optional().nullable(),
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
    const { data, error } = await supabase
      .from('mesocycles')
      .select('*')
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

    const { data: newMeso, error: mesoError } = await supabase
      .from('mesocycles')
      .insert({ 
        ...validation.data, 
        user_id: user.id,
        created_at: new Date().toISOString()
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

    return NextResponse.json(newMeso, { status: 201 })

  } catch (error) {
    console.error('POST request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}