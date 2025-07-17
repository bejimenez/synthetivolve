import { NextResponse } from 'next/server';
import { FdcDetails, getNutrientsFromUsdaDetails } from '@/lib/usda';

export const dynamic = 'force-dynamic';

// GET /api/nutrition/usda/details?fdcId=... - Get USDA food details
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fdcId = searchParams.get('fdcId');

  if (!fdcId) {
    return NextResponse.json({ error: 'fdcId parameter is required.' }, { status: 400 });
  }

  try {
    const details = await FdcDetails(parseInt(fdcId));
    if (!details) {
      return NextResponse.json({ error: 'Food details not found.' }, { status: 404 });
    }
    const nutrients = getNutrientsFromUsdaDetails(details);
    return NextResponse.json({ ...details, nutrients });
  } catch (error) {
    console.error('Error fetching USDA food details:', error);
    return NextResponse.json({ error: 'Failed to fetch USDA food details.' }, { status: 500 });
  }
}
