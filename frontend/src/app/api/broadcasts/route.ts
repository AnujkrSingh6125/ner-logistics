import { NextRequest, NextResponse } from 'next/server';
import { supabase, broadcastCrossSessionEvent } from '@/lib/supabaseClient';
import { SystemBroadcast, BroadcastSeverity } from '@/types';

// Regional Baseline Warnings Fallback (starts empty for clean dynamic state)
const BASELINE_BROADCASTS: SystemBroadcast[] = [];

let memoryBroadcasts: SystemBroadcast[] = [];

export async function GET() {
  try {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('system_broadcasts')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return NextResponse.json(data);
        }
      } catch (err) {
        console.warn('Supabase system_broadcasts fetch notice:', err);
      }
    }

    return NextResponse.json(memoryBroadcasts);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error fetching broadcasts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userRole = (request.headers.get('x-user-role') || '').trim();
    const userAgency = request.headers.get('x-user-agency') || 'Disaster Management Command';
    const userName = request.headers.get('x-user-name') || 'Official Command Desk';

    const isGov =
      userRole === 'gov_official' ||
      userRole === 'GOV_AUTHORITY' ||
      userRole === 'government_official' ||
      userRole === 'admin';

    if (!isGov) {
      return NextResponse.json(
        { error: 'Access Denied (403): Emergency system broadcasts are strictly restricted to verified Government & Defense Command Officials.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, message, severity = 'WARNING', affected_region = 'Northeast Regional Corridor' } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required for emergency broadcast.' },
        { status: 400 }
      );
    }

    const newBroadcast: SystemBroadcast = {
      id: `broadcast-${Date.now()}`,
      issued_by_name: userName,
      agency: userAgency,
      severity: severity as BroadcastSeverity,
      title,
      message,
      affected_region,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('system_broadcasts')
          .insert([
            {
              issued_by_name: newBroadcast.issued_by_name,
              agency: newBroadcast.agency,
              severity: newBroadcast.severity,
              title: newBroadcast.title,
              message: newBroadcast.message,
              affected_region: newBroadcast.affected_region,
              is_active: true,
            },
          ])
          .select()
          .single();

        if (!error && data) {
          newBroadcast.id = data.id;
        }
      } catch (err) {
        console.warn('Supabase system_broadcasts insert notice:', err);
      }
    }

    memoryBroadcasts = [newBroadcast, ...memoryBroadcasts];
    broadcastCrossSessionEvent({ type: 'broadcast_insert', payload: newBroadcast });

    return NextResponse.json({
      success: true,
      message: 'Emergency warning broadcast dispatched across all active terminals.',
      broadcast: newBroadcast,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Broadcast creation error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Broadcast id is required' }, { status: 400 });
    }

    if (supabase) {
      await supabase.from('system_broadcasts').update({ is_active: false }).eq('id', id);
    }

    memoryBroadcasts = memoryBroadcasts.filter((b) => b.id !== id);
    broadcastCrossSessionEvent({ type: 'broadcast_delete', payload: id });

    return NextResponse.json({ success: true, message: 'Broadcast resolved.' });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error resolving broadcast' }, { status: 500 });
  }
}
