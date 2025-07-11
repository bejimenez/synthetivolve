// src/app/api/fitness/exercises/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'
import { z } from 'zod'

const exerciseUpdateSchema = z.object({
  name: z.string().min(1, 'Exercise name is required').optional(),
  primary_muscle: z.string().optional(),
  secondary_muscles: z.array(z.string()).optional(),
  equipment: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  use_rir_rpe: z.boolean().optional(),
})

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = createSupabaseServerClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const validation = exerciseUpdateSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('exercises')
    .update({ ...validation.data, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = createSupabaseServerClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Soft delete by setting the deleted_at timestamp
  const { error } = await supabase
    .from('exercises')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new Response(null, { status: 204 })
}
