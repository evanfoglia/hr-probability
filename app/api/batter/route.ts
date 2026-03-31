import { NextRequest, NextResponse } from 'next/server';
import { getBatterStats } from '@/lib/mcp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerName, year = 2024 } = body;

    if (!playerName) {
      return NextResponse.json({ error: 'playerName is required' }, { status: 400 });
    }

    const data = await getBatterStats(String(playerName), Number(year));
    return NextResponse.json(data);
  } catch (error) {
    console.error('Batter API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch batter data' },
      { status: 500 }
    );
  }
}
