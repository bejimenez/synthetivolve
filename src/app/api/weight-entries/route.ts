// src/app/api/weight-entries/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'
import { z } from 'zod'

// Validation schema for weight entry
const weightEntrySchema = z.object({
  weight_lbs: z.number().min(50).max(1000, 'Weight must be between 50 and 1000 lbs'),
  entry_date: z.string().refine((date) => {
    const parsed = new Date(date)
    return !isNaN(parsed.getTime()) && parsed <= new Date()
  }, 'Entry date must be a valid date not in the future'),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 30
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    // Fetch weight entries
    const { data: weightEntries, error } = await supabase
      .from('weight_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching weight entries:', error)
      return NextResponse.json({ error: 'Failed to fetch weight entries' }, { status: 500 })
    }

    return NextResponse.json({ data: weightEntries })
  } catch (error) {
    console.error('Unexpected error in GET /api/weight-entries:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = weightEntrySchema.parse(body)

    // Insert weight entry
    const { data: weightEntry, error } = await supabase
      .from('weight_entries')
      .insert({
        user_id: user.id,
        weight_lbs: validatedData.weight_lbs,
        entry_date: validatedData.entry_date,
        notes: validatedData.notes || null,
      })
      .select()
      .single()

    if (error) {
      // Handle unique constraint violation (duplicate date)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Weight entry already exists for this date' },
          { status: 409 }
        )
      }
      
      console.error('Error creating weight entry:', error)
      return NextResponse.json({ error: 'Failed to create weight entry' }, { status: 500 })
    }

    return NextResponse.json({ data: weightEntry }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Unexpected error in POST /api/weight-entries:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}