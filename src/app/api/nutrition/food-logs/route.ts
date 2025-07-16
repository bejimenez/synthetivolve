// src/app/api/nutrition/food-logs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'
import { z } from 'zod'

const foodLogSchema = z.object({
  food_id: z.string().uuid(),
  quantity: z.number().positive(),
  unit: z.string(),
  logged_at: z.string().datetime(),
  logged_date: z.string().date(),
})

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') // Expects YYYY-MM-DD format

    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('food_logs')
      .select(`
        *,
        foods (*)
      `)
      .eq('user_id', user.id)
      .eq('logged_date', date)
      .order('logged_at', { ascending: true })

    if (error) {
      console.error('Error fetching food logs:', error)
      return NextResponse.json({ error: 'Failed to fetch food logs' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('GET food_logs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = foodLogSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 })
    }

    const { data: newLog, error } = await supabase
      .from('food_logs')
      .insert({ ...validation.data, user_id: user.id })
      .select()
      .single()

    if (error) {
      console.error('Error creating food log:', error)
      return NextResponse.json({ error: 'Failed to create food log' }, { status: 500 })
    }

    return NextResponse.json(newLog, { status: 201 })
  } catch (error) {
    console.error('POST food_logs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
