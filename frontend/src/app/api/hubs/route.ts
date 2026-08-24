import { NextResponse } from 'next/server';
import { fetchSupplyHubs } from '@/lib/supabaseClient';

export async function GET() {
  try {
    const hubs = await fetchSupplyHubs();
    return NextResponse.json(hubs);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
