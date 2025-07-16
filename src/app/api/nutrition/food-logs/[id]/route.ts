// src/app/api/nutrition/food-logs/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'
import { z } from 'zod'

const foodLogUpdateSchema = z.object({
  quantity: z.number().positive().optional(),
  unit: z.string().optional(),
  logged_at: z.string().datetime().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = foodLogUpdateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('food_logs')
      .update({ ...validation.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating food log:', error)
      return NextResponse.json({ error: 'Failed to update food log' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('PUT food_log error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Soft delete the food log
    const { error } = await supabase
      .from('food_logs')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting food log:', error)
      return NextResponse.json({ error: 'Failed to delete food log' }, { status: 500 })
    }

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('DELETE food_log error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
