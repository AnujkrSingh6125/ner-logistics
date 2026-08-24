import { NextRequest, NextResponse } from 'next/server';
import {
  fetchRoadDisruptions,
  insertSimulatedDisruption,
  resetSimulatedDisruptions,
} from '@/lib/supabaseClient';

export async function GET() {
  try {
    const disruptions = await fetchRoadDisruptions();
    return NextResponse.json(disruptions);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // RBAC Guard: Verify that the requester is an authorized Government Official
    const userRole = request.headers.get('x-user-role');
    const userAgency = request.headers.get('x-user-agency');

    if (userRole !== 'gov_official') {
      return NextResponse.json(
        {
          error:
            'Access Denied (403): Road disruption reporting and disaster hazard simulation is strictly restricted to verified Government & Defense Officials (BRO / NDMA / ASDMA).',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      disruption_type,
      severity,
      latitude,
      longitude,
      risk_radius_meters = 2500,
      highway_reference = 'Regional Highway',
      message,
      description = 'Official disaster hazard broadcast injected by verified authority.',
      government_body_name,
    } = body;

    if (!title || !latitude || !longitude || !disruption_type || !severity) {
      return NextResponse.json(
        {
          error:
            'Fields title, disruption_type, severity, latitude, and longitude are required.',
        },
        { status: 400 }
      );
    }

    const agency = government_body_name || userAgency || 'Government Disaster Management Authority';
    const officialMessage = message ? message.slice(0, 500) : description;

    const newDisruption = await insertSimulatedDisruption({
      title,
      disruption_type,
      severity,
      latitude: Number(latitude),
      longitude: Number(longitude),
      risk_radius_meters: Number(risk_radius_meters),
      highway_reference,
      message: officialMessage,
      government_body_name: agency,
      description: `${description || officialMessage} [Reported by: ${agency}]`,
      reported_by_agency: agency,
      verified_by_official: 'Verified Command Official',
    });

    return NextResponse.json({
      success: true,
      message: 'Disruption injected successfully by authorized agency',
      disruption: newDisruption,
    });
  } catch (error: any) {
    console.error('Error inserting disruption:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // RBAC Guard
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'gov_official') {
      return NextResponse.json(
        {
          error:
            'Access Denied (403): Resetting disaster simulation state is restricted to authorized Government Officials.',
        },
        { status: 403 }
      );
    }

    const resetList = await resetSimulatedDisruptions();
    return NextResponse.json({
      success: true,
      message: 'Simulated disruptions reset to regional baseline',
      disruptions: resetList,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
