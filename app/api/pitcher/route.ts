import { NextRequest, NextResponse } from 'next/server';
import { getPitcherData } from '@/lib/mcp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerName } = body;

    if (!playerName) {
      return NextResponse.json({ error: 'playerName is required' }, { status: 400 });
    }

    const data = await getPitcherData(String(playerName));
    return NextResponse.json(data);
  } catch (error) {
    console.error('Pitcher API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch pitcher data' },
      { status: 500 }
    );
  }
}
