// src/app/api/nutrition/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'
import { USDAClient } from '@/lib/nutrition/usda'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
    }

    if (!process.env.USDA_API_KEY) {
      console.error('USDA_API_KEY environment variable not set.')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const usdaClient = new USDAClient(process.env.USDA_API_KEY)
    const results = await usdaClient.search(query)

    return NextResponse.json(results);

  } catch (error) {
    console.error('Nutrition search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
