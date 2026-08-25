import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, userId, citizenUid, email } = body;

    const rawId = (identifier || citizenUid || userId || email || '').trim();
    if (!rawId) {
      return NextResponse.json(
        { success: false, error: 'User ID, Citizen UID, or Email is required for live tracking.' },
        { status: 400 }
      );
    }

    const cleanId = rawId.toLowerCase();
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rawId);

    let clientUser: any = null;
    let liveJourney: any = null;

    if (supabase) {
      try {
        // 1. Search in client_users
        let query = supabase.from('client_users').select('*');
        if (isUUID) {
          query = query.or(`id.eq.${rawId},citizen_uid.ilike.${rawId},email.ilike.${cleanId}`);
        } else {
          query = query.or(`citizen_uid.ilike.${rawId},email.ilike.${cleanId},phone.ilike.${rawId}`);
        }

        const { data: userData } = await query.maybeSingle();
        if (userData) {
          clientUser = userData;
        }

        // 2. Search in live_journeys for real-time telemetry stream
        let journeyQuery = supabase.from('live_journeys').select('*');
        if (clientUser?.citizen_uid) {
          journeyQuery = journeyQuery.or(`citizen_uid.ilike.${clientUser.citizen_uid},client_id.eq.${clientUser.id}`);
        } else if (isUUID) {
          journeyQuery = journeyQuery.or(`client_id.eq.${rawId},citizen_uid.ilike.${rawId}`);
        } else {
          journeyQuery = journeyQuery.ilike('citizen_uid', rawId);
        }

        const { data: journeyData } = await journeyQuery.order('updated_at', { ascending: false }).maybeSingle();
        if (journeyData) {
          liveJourney = journeyData;
        }
      } catch (err) {
        console.warn('[TRACK-USER API] Supabase query notice:', err);
      }
    }

    if (!clientUser && !liveJourney) {
      return NextResponse.json({
        success: true,
        found: false,
        message: `No active user record or live telemetry stream found matching identifier: "${rawId}".`,
      });
    }

    const resolvedUid = clientUser?.citizen_uid || liveJourney?.citizen_uid || rawId;
    const resolvedName = clientUser?.full_name || liveJourney?.driver_name || 'Citizen Driver';
    const lat = liveJourney?.current_lat ?? clientUser?.current_lat ?? 26.1445;
    const lng = liveJourney?.current_lng ?? clientUser?.current_lng ?? 91.7362;
    const speed = liveJourney?.speed_kmh ?? 0;
    const heading = liveJourney?.heading ?? 0;
    const isSharing = clientUser?.is_sharing_location ?? (liveJourney?.is_active ?? true);
    const lastUpdate = liveJourney?.updated_at || clientUser?.last_location_update || clientUser?.updated_at || new Date().toISOString();

    return NextResponse.json({
      success: true,
      found: true,
      user: {
        id: clientUser?.id || `usr-${resolvedUid}`,
        citizen_uid: resolvedUid,
        full_name: resolvedName,
        email: clientUser?.email || null,
        phone: clientUser?.phone || null,
        role: clientUser?.role || 'citizen',
        is_sharing_location: Boolean(isSharing),
        current_lat: Number(lat),
        current_lng: Number(lng),
        speed_kmh: Number(speed),
        heading: Number(heading),
        origin_hub: liveJourney?.origin_hub || null,
        destination_hub: liveJourney?.destination_hub || null,
        is_active_journey: Boolean(liveJourney?.is_active),
        last_location_update: lastUpdate,
      },
    });
  } catch (error: any) {
    console.error('[TRACK-USER EXCEPTION]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch user telemetry.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const identifier = searchParams.get('id') || searchParams.get('citizen_uid') || searchParams.get('email');

  if (!identifier) {
    return NextResponse.json(
      { success: false, error: 'User identifier is required.' },
      { status: 400 }
    );
  }

  // Forward to POST handler
  return POST(
    new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify({ identifier }),
      headers: { 'Content-Type': 'application/json' },
    })
  );
}
