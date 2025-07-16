// src/app/api/nutrition/recent-foods/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('recent_foods')
      .select(`
        *,
        foods (*)
      `)
      .eq('user_id', user.id)
      .order('last_used', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching recent foods:', error)
      return NextResponse.json({ error: 'Failed to fetch recent foods' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('GET recent-foods error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
