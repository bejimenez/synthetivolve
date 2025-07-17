import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// DELETE /api/nutrition/[id] - Soft delete a food log
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'ID parameter is required.' }, { status: 400 });
  }

  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { error } = await supabase
      .from('food_logs')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', session.user.id) // Ensure user owns the log
      .is('deleted_at', null) // Only soft delete if not already deleted
      .select('id')
      .single();

    if (error) {
      console.error('Error soft deleting food log:', error);
      if (error.code === 'PGRST116') { // No rows found
        return NextResponse.json({ error: 'Food log not found or not authorized.' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Food log soft deleted successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error soft deleting food log:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
