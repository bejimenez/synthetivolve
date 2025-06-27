// src/app/api/weight-entries/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
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
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = weightEntryUpdateSchema.parse(body)

    // Update weight entry
    const { data: weightEntry, error } = await supabase
      .from('weight_entries')
      .update(validatedData)
      .eq('id', params.id)
      .eq('user_id', user.id) // Ensure user can only update their own entries
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Weight entry not found' }, { status: 404 })
      }
      
      console.error('Error updating weight entry:', error)
      return NextResponse.json({ error: 'Failed to update weight entry' }, { status: 500 })
    }

    return NextResponse.json({ data: weightEntry })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Unexpected error in PUT /api/weight-entries/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete weight entry
    const { error } = await supabase
      .from('weight_entries')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id) // Ensure user can only delete their own entries

    if (error) {
      console.error('Error deleting weight entry:', error)
      return NextResponse.json({ error: 'Failed to delete weight entry' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Weight entry deleted successfully' })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/weight-entries/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}