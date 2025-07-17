import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies: () => cookies() });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from('recent_foods')
      .select(`
        *,
        foods (*)
      `)
      .eq('user_id', session.user.id)
      .order('last_used', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching recent foods:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error fetching recent foods:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
