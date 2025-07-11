// src/app/api/fitness/workout-logs/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'

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

    // Check if the workout log exists and belongs to the user before deletion
    const { data: existingWorkout, error: checkError } = await supabase
      .from('workout_logs')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (checkError || !existingWorkout) {
      return NextResponse.json({ error: 'Workout log not found' }, { status: 404 })
    }

    // The schema is set to ON DELETE CASCADE, so deleting the workout_log
    // will automatically delete all related exercise_logs and set_logs.
    const { error } = await supabase
      .from('workout_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('DELETE request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}