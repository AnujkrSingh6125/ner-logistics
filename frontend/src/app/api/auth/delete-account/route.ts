import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  try {
    const { email, userId, citizenUid } = await req.json();

    if (!email && !userId && !citizenUid) {
      return NextResponse.json(
        { success: false, error: 'User identifier (email, userId, or citizenUid) is required' },
        { status: 400 }
      );
    }

    const targetEmail = email ? email.trim().toLowerCase() : null;

    console.log(`[ACCOUNT PERMANENT PURGE] Purging citizen data for: ${targetEmail || userId || citizenUid}`);

    if (supabase) {
      // 1. Delete associated citizen reports from road_disruptions
      if (userId) {
        await supabase.from('road_disruptions').delete().eq('reported_by', userId);
      }
      if (citizenUid) {
        await supabase.from('road_disruptions').delete().eq('reported_by', citizenUid);
      }

      // 2. Delete live journeys
      if (userId) {
        await supabase.from('live_journeys').delete().eq('client_id', userId);
      }
      if (citizenUid) {
        await supabase.from('live_journeys').delete().eq('citizen_uid', citizenUid);
      }

      // 3. Delete primary record from profiles (email PK) and client_users table
      if (targetEmail) {
        await supabase.from('profiles').delete().eq('email', targetEmail);
        await supabase.from('client_users').delete().eq('email', targetEmail);
      } else if (userId) {
        await supabase.from('profiles').delete().eq('user_id', userId);
        await supabase.from('client_users').delete().eq('id', userId);
      } else if (citizenUid) {
        await supabase.from('client_users').delete().eq('citizen_uid', citizenUid);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Citizen profile, live GPS telemetry, and associated reports permanently purged.',
    });
  } catch (error: any) {
    console.error('[DELETE ACCOUNT EXCEPTION]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal deletion failure' },
      { status: 500 }
    );
  }
}
