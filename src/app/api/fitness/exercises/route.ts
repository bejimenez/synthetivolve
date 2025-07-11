// src/app/api/fitness/exercises/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'
import { z } from 'zod'

const exerciseSchema = z.object({
  name: z.string().min(1, 'Exercise name is required'),
  primary_muscle_group: z.string(),
  secondary_muscle_groups: z.array(z.string()).optional(),
  equipment: z.string().optional(),
  notes: z.string().optional(),
  use_rir_rpe: z.boolean().optional(),
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

    // Fetch user's exercises (excluding soft-deleted ones)
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('name', { ascending: true })

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

export async function POST(request: NextRequest) {
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
    const validation = exerciseSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input', 
          details: validation.error.flatten() 
        }, 
        { status: 400 }
      )
    }

    // Insert new exercise
    const { data, error } = await supabase
      .from('exercises')
      .insert({ 
        ...validation.data, 
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('POST request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}