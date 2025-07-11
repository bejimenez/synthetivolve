// src/app/api/fitness/mesocycles/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = createSupabaseServerClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Soft delete the mesocycle.
  // Note: In a real application with foreign key constraints, you might need to
  // cascade this delete or handle orphaned rows in child tables. The current
  // schema uses ON DELETE CASCADE, which will handle this automatically if a hard delete was used.
  // For soft delete, a trigger or manual cleanup would be needed.
  const { error } = await supabase
    .from('mesocycles')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new Response(null, { status: 204 })
}

// A PUT/update handler would be very complex here. It would need to:
// 1. Start a transaction.
// 2. Update the top-level mesocycle data.
// 3. Diff the incoming days and exercises with the existing ones.
// 4. Delete days/exercises that were removed.
// 5. Update days/exercises that were changed.
// 6. Insert new days/exercises.
// This is best handled by a Supabase Edge Function (RPC).
