// src/app/api/fitness/mesocycles/[id]/route.ts
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

    // Soft delete the mesocycle
    // Note: In a real application with foreign key constraints, you might need to
    // cascade this delete or handle orphaned rows in child tables. The current
    // schema uses ON DELETE CASCADE, which will handle this automatically if a hard delete was used.
    // For soft delete, a trigger or manual cleanup would be needed.
    const { error } = await supabase
      .from('mesocycles')
      .update({ deleted_at: new Date().toISOString() })
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

// A PUT/update handler would be very complex here. It would need to:
// 1. Start a transaction.
// 2. Update the top-level mesocycle data.
// 3. Diff the incoming days and exercises with the existing ones.
// 4. Delete days/exercises that were removed.
// 5. Update days/exercises that were changed.
// 6. Insert new days/exercises.
// This is best handled by a Supabase Edge Function (RPC).