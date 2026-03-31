import { NextRequest, NextResponse } from 'next/server';
import { playerLookup } from '@/lib/mcp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters' },
        { status: 400 }
      );
    }

    const players = await playerLookup(name.trim());

    return NextResponse.json({ players });
  } catch (error) {
    console.error('Lookup API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Lookup failed' },
      { status: 500 }
    );
  }
}
