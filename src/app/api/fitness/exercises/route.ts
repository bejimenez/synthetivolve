// src/app/api/fitness/exercises/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'
import { z } from 'zod'

const exerciseSchema = z.object({
  name: z.string().min(1, 'Exercise name is required'),
  primary_muscle: z.string(),
  secondary_muscles: z.array(z.string()).optional(),
  equipment: z.string().optional(),
  notes: z.string().optional(),
  use_rir_rpe: z.boolean().optional(),
})

export async function GET() {
  const cookieStore = cookies()
  const supabase = createSupabaseServerClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('name', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createSupabaseServerClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const validation = exerciseSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('exercises')
    .insert({ ...validation.data, user_id: user.id })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
