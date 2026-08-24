import { NextRequest, NextResponse } from 'next/server';
import { PRE_SEEDED_GOV_ACCOUNTS, PRE_SEEDED_HUB_TERMINALS } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, role, agency_name, hub_code } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    // 1. Government Command Official Authentication
    if (role === 'gov_official') {
      const match = PRE_SEEDED_GOV_ACCOUNTS.find(
        (acc) =>
          acc.email.toLowerCase() === trimmedEmail &&
          acc.password === password &&
          (!agency_name || acc.agency_name === agency_name || acc.agency_name.includes(agency_name))
      );

      if (!match) {
        return NextResponse.json(
          { error: 'Unauthorized: Invalid Official Government Credentials or Agency match.' },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        user: {
          id: `gov-${Date.now()}`,
          official_id: match.official_id || 'GOV-HQ-01',
          email: match.email,
          full_name: match.full_name,
          phone: match.phone,
          role: 'gov_official',
          agency_name: match.agency_name,
          state: match.state,
          is_verified: true,
        },
        token: `gov-auth-token-${Date.now()}`,
      });
    }

    // 2. Strategic Supply Hub Terminal Authentication
    if (role === 'hub_operator') {
      const match = PRE_SEEDED_HUB_TERMINALS.find(
        (hub) =>
          hub.email.toLowerCase() === trimmedEmail &&
          hub.password === password &&
          (!hub_code || hub.hub_code === hub_code || hub.hub_name.includes(hub_code))
      );

      if (!match) {
        return NextResponse.json(
          { error: 'Unauthorized: Invalid Strategic Hub Depot Credentials or Hub Code.' },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        user: {
          id: `hub-${match.hub_code}`,
          hub_code: match.hub_code,
          email: match.email,
          full_name: `${match.hub_name} Terminal`,
          agency_name: match.hub_name,
          role: 'hub_operator',
          state: match.state,
          is_verified: true,
        },
        token: `hub-auth-token-${Date.now()}`,
      });
    }

    // 3. Citizen & Driver Authentication (Supabase client_users or Demo)
    if (
      (trimmedEmail === 'citizen.demo@example.com' || trimmedEmail === 'anirban.das@gmail.com') &&
      (password === 'Citizen@2026' || password === 'Demo@2026')
    ) {
      return NextResponse.json({
        success: true,
        user: {
          id: 'citizen-demo-01',
          citizen_uid: 'NER-CIT-10024',
          email: 'citizen.demo@example.com',
          full_name: 'Anirban Das',
          phone: '+91 98765 43210',
          role: 'citizen',
          state: 'Assam',
          is_verified: true,
          is_sharing_location: true,
        },
        token: `citizen-auth-token-${Date.now()}`,
      });
    }

    // Check live Supabase client_users if connected
    if (supabase) {
      try {
        const { data: clientUser } = await supabase
          .from('client_users')
          .select('*')
          .eq('email', trimmedEmail)
          .single();

        if (clientUser) {
          return NextResponse.json({
            success: true,
            user: {
              id: clientUser.id,
              citizen_uid: clientUser.citizen_uid,
              email: clientUser.email,
              full_name: clientUser.full_name,
              phone: clientUser.phone,
              role: 'citizen',
              state: 'Assam',
              is_verified: true,
              is_sharing_location: clientUser.is_sharing_location ?? true,
            },
            token: `citizen-auth-token-${Date.now()}`,
          });
        }
      } catch (err) {
        console.warn('Supabase client_users query note:', err);
      }
    }

    return NextResponse.json(
      { error: 'Invalid citizen email/phone or password. Please verify your credentials or register.' },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Authentication error' },
      { status: 500 }
    );
  }
}
