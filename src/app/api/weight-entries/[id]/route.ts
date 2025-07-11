// src/app/api/weight-entries/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'
import { z } from 'zod'

const weightEntryUpdateSchema = z.object({
  weight_lbs: z.number().min(50).max(1000, 'Weight must be between 50 and 1000 lbs').optional(),
  entry_date: z.string().refine((date) => {
    const parsed = new Date(date)
    return !isNaN(parsed.getTime()) && parsed <= new Date()
  }, 'Entry date must be a valid date not in the future').optional(),
  notes: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params promise (Next.js 15+ requirement)
    const { id } = await params
    
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = weightEntryUpdateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input', 
          details: validation.error.flatten() 
        }, 
        { status: 400 }
      )
    }

    // Update weight entry with updated_at timestamp
    const { data: weightEntry, error } = await supabase
      .from('weight_entries')
      .update({
        ...validation.data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only update their own entries
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Weight entry not found' }, { status: 404 })
      }
      
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update weight entry' }, { status: 500 })
    }

    if (!weightEntry) {
      return NextResponse.json({ error: 'Weight entry not found' }, { status: 404 })
    }

    return NextResponse.json(weightEntry)
  } catch (error) {
    console.error('PUT request error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params promise (Next.js 15+ requirement)
    const { id } = await params
    
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if the weight entry exists and belongs to the user before deletion
    const { data: existingEntry, error: checkError } = await supabase
      .from('weight_entries')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (checkError || !existingEntry) {
      return NextResponse.json({ error: 'Weight entry not found' }, { status: 404 })
    }

    // Hard delete weight entry (weight entries don't need soft delete for data integrity)
    const { error } = await supabase
      .from('weight_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete weight entry' }, { status: 500 })
    }

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('DELETE request error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}