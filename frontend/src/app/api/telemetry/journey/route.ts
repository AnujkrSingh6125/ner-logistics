import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { LiveJourney } from '@/types';

// Baseline Live Simulated Driver Convoys in NER
const BASELINE_JOURNEYS: LiveJourney[] = [
  {
    id: 'journey-01',
    citizen_uid: 'NER-CIT-49210',
    driver_name: 'Debojit Kalita (Oxygen Tanker Convoy)',
    origin_hub: 'Guwahati Multi-Modal Transshipment Hub',
    destination_hub: 'Imphal Eastern Logistics Depot',
    current_lat: 25.6751,
    current_lng: 92.8933,
    heading: 115,
    speed_kmh: 42,
    is_active: true,
    shared_with: 'ALL',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'journey-02',
    citizen_uid: 'NER-CIT-88412',
    driver_name: 'Tashi Namgyal (Vaccine Cold-Chain Truck)',
    origin_hub: 'Dimapur Railhead Strategic Hub',
    destination_hub: 'Kohima Hill Logistics Center',
    current_lat: 25.8210,
    current_lng: 93.8500,
    heading: 85,
    speed_kmh: 34,
    is_active: true,
    shared_with: 'ALL',
    updated_at: new Date().toISOString(),
  },
];

let memoryJourneys: LiveJourney[] = [...BASELINE_JOURNEYS];

export async function GET() {
  try {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('live_journeys')
          .select('*')
          .eq('is_active', true)
          .order('updated_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return NextResponse.json(data);
        }
      } catch (err) {
        console.warn('Supabase live_journeys query notice:', err);
      }
    }

    return NextResponse.json(memoryJourneys);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error fetching live journeys' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      client_id,
      citizen_uid = 'NER-CIT-GUEST',
      driver_name = 'Citizen Driver',
      origin_hub = 'Guwahati Central Depot',
      destination_hub = 'Destination Corridor',
      current_lat,
      current_lng,
      heading = 0,
      speed_kmh = 40,
      shared_with = 'ALL',
    } = body;

    if (current_lat === undefined || current_lng === undefined) {
      return NextResponse.json({ error: 'Latitude and Longitude are required' }, { status: 400 });
    }

    const journey: LiveJourney = {
      id: `journey-${Date.now()}`,
      client_id,
      citizen_uid,
      driver_name,
      origin_hub,
      destination_hub,
      current_lat: Number(current_lat),
      current_lng: Number(current_lng),
      heading: Number(heading),
      speed_kmh: Number(speed_kmh),
      is_active: true,
      shared_with,
      updated_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('live_journeys')
          .upsert(
            {
              citizen_uid: journey.citizen_uid,
              driver_name: journey.driver_name,
              origin_hub: journey.origin_hub,
              destination_hub: journey.destination_hub,
              current_lat: journey.current_lat,
              current_lng: journey.current_lng,
              heading: journey.heading,
              speed_kmh: journey.speed_kmh,
              is_active: true,
              shared_with: journey.shared_with,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'citizen_uid' }
          )
          .select()
          .single();

        if (!error && data) {
          journey.id = data.id;
        }

        // Also update last known position in client_users table
        if (citizen_uid) {
          await supabase
            .from('client_users')
            .update({
              current_lat: journey.current_lat,
              current_lng: journey.current_lng,
              is_sharing_location: true,
              last_location_update: new Date().toISOString(),
            })
            .eq('citizen_uid', citizen_uid);
        }
      } catch (err) {
        console.warn('Supabase live_journeys upsert notice:', err);
      }
    }

    // Upsert in local memory
    const existingIndex = memoryJourneys.findIndex((j) => j.citizen_uid === journey.citizen_uid);
    if (existingIndex >= 0) {
      memoryJourneys[existingIndex] = journey;
    } else {
      memoryJourneys = [journey, ...memoryJourneys];
    }

    return NextResponse.json({
      success: true,
      message: 'Driver live telemetry position synchronized.',
      journey,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Telemetry error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const citizenUid = searchParams.get('citizen_uid');

    if (!citizenUid) {
      return NextResponse.json({ error: 'citizen_uid parameter required' }, { status: 400 });
    }

    if (supabase) {
      await supabase.from('live_journeys').update({ is_active: false }).eq('citizen_uid', citizenUid);
      await supabase.from('client_users').update({ is_sharing_location: false }).eq('citizen_uid', citizenUid);
    }

    memoryJourneys = memoryJourneys.filter((j) => j.citizen_uid !== citizenUid);

    return NextResponse.json({ success: true, message: 'Driver journey ended and GPS sharing deactivated.' });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Journey termination error' }, { status: 500 });
  }
}
