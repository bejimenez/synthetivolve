import { NextResponse } from 'next/server';
import { FdcSearch } from '@/lib/usda';

export const dynamic = 'force-dynamic';

// GET /api/nutrition/usda/search?query=... - Search USDA foods
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required.' }, { status: 400 });
  }

  try {
    const results = await FdcSearch(query);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching USDA foods:', error);
    return NextResponse.json({ error: 'Failed to search USDA foods.' }, { status: 500 });
  }
}
