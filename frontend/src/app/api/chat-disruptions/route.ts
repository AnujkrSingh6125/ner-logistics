import { NextRequest, NextResponse } from 'next/server';
import { supabase, FALLBACK_DISRUPTIONS } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, messages } = body;

    const userQuery =
      query ||
      (Array.isArray(messages) && messages.length > 0
        ? messages[messages.length - 1].content || messages[messages.length - 1].text
        : '');

    if (!userQuery || typeof userQuery !== 'string' || !userQuery.trim()) {
      return NextResponse.json(
        { error: 'User query is required.' },
        { status: 400 }
      );
    }

    // 1. Fetch current active disruptions & broadcasts from Supabase as strict ground truth
    let disruptions: any[] = [];
    let broadcasts: any[] = [];

    if (supabase) {
      try {
        const [disruptRes, broadRes] = await Promise.all([
          supabase
            .from('road_disruptions')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false }),
          supabase
            .from('system_broadcasts')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false }),
        ]);

        if (!disruptRes.error && disruptRes.data && disruptRes.data.length > 0) {
          disruptions = disruptRes.data;
        }
        if (!broadRes.error && broadRes.data && broadRes.data.length > 0) {
          broadcasts = broadRes.data;
        }
      } catch (err) {
        console.warn('[CHAT-DISRUPTIONS] Supabase fetch error, using local fallback:', err);
      }
    }

    if (disruptions.length === 0) {
      disruptions = FALLBACK_DISRUPTIONS;
    }

    // 2. Try proxying to FastAPI AI microservice
    const serviceUrl = (process.env.AI_MODEL_SERVICE_URL || 'http://localhost:8000').replace(/\/$/, '');
    const apiKey = process.env.AI_MODEL_API_KEY || 'ner_ai_live_secret_key_2026';
    const targetEndpoint = `${serviceUrl}/api/v1/chat-disruptions`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500);

      const aiRes = await fetch(targetEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AI-API-KEY': apiKey,
          accept: 'application/json',
        },
        body: JSON.stringify({
          query: userQuery.trim(),
          disruptions: disruptions.map((d) => ({
            id: d.id,
            title: d.title,
            disruption_type: d.disruption_type,
            severity: d.severity,
            highway_reference: d.highway_reference,
            latitude: d.latitude,
            longitude: d.longitude,
            risk_radius_meters: d.risk_radius_meters,
            message: d.message || d.description,
            description: d.description || d.message,
            government_body_name:
              d.government_body_name || d.reported_by_agency || 'Emergency Management Authority',
          })),
          broadcasts: broadcasts.map((b) => ({
            id: b.id,
            title: b.title,
            agency: b.agency,
            severity: b.severity,
            message: b.message,
            affected_region: b.affected_region,
            issued_by_name: b.issued_by_name,
          })),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (aiRes.ok) {
        const data = await aiRes.json();
        const citedBodies = (data.cited_disruptions || [])
          .map((d: any) => d.government_body_name || d.reported_by_agency)
          .filter(Boolean);

        return NextResponse.json({
          status: 'success',
          reply: data.answer || data.reply,
          citations: Array.from(new Set(citedBodies)),
          active_hazards_count: disruptions.length,
          cited_disruptions: data.cited_disruptions || [],
        });
      }
    } catch (err: any) {
      console.warn(`[CHAT-DISRUPTIONS] Microservice error (${err.message}). Using local strictly bounded evaluator.`);
    }

    // 3. Local Deterministic Zero-Shot Grounded Bounded Fallback Engine
    const queryLower = userQuery.toLowerCase().trim();
    const matchedRecords: any[] = [];

    for (const d of disruptions) {
      const title = String(d.title || '').toLowerCase();
      const highway = String(d.highway_reference || '').toLowerCase();
      const dtype = String(d.disruption_type || '').toLowerCase();
      const desc = String(d.description || '').toLowerCase();
      const msg = String(d.message || '').toLowerCase();
      const agency = String(d.government_body_name || d.reported_by_agency || '').toLowerCase();

      if (
        (queryLower.includes('landslide') || queryLower.includes('mudslide') || queryLower.includes('slope')) &&
        (dtype.includes('landslide') || title.includes('landslide') || desc.includes('landslide') || msg.includes('landslide'))
      ) {
        matchedRecords.push(d);
      } else if (
        (queryLower.includes('flood') || queryLower.includes('inundat') || queryLower.includes('water')) &&
        (dtype.includes('flood') || title.includes('flood') || desc.includes('flood') || msg.includes('flood'))
      ) {
        matchedRecords.push(d);
      } else if (
        (queryLower.includes('bridge') || queryLower.includes('scour') || queryLower.includes('culvert')) &&
        (dtype.includes('bridge') || desc.includes('bridge') || msg.includes('bridge'))
      ) {
        matchedRecords.push(d);
      } else if (highway && (highway.includes(queryLower) || queryLower.includes(highway.replace(/[\s\/-]/g, '')))) {
        matchedRecords.push(d);
      } else if (
        (queryLower.includes('nh-29') || queryLower.includes('nh29') || queryLower.includes('dimapur') || queryLower.includes('kohima') || queryLower.includes('pagla')) &&
        (highway.includes('nh-29') || title.includes('kohima') || title.includes('dimapur') || desc.includes('pagla') || msg.includes('pagla'))
      ) {
        matchedRecords.push(d);
      } else if (
        (queryLower.includes('nh-6') || queryLower.includes('nh6') || queryLower.includes('silchar') || queryLower.includes('barak') || queryLower.includes('umiam')) &&
        (highway.includes('nh-6') || title.includes('silchar') || desc.includes('barak') || desc.includes('umiam'))
      ) {
        matchedRecords.push(d);
      } else if (agency && queryLower.includes(agency)) {
        matchedRecords.push(d);
      } else if (
        queryLower.includes('all') ||
        queryLower.includes('list') ||
        queryLower.includes('summary') ||
        queryLower.includes('critical') ||
        queryLower.includes('status') ||
        queryLower.includes('active') ||
        queryLower.includes('directive') ||
        queryLower.includes('message') ||
        queryLower.includes('hazard') ||
        queryLower.includes('disruption')
      ) {
        matchedRecords.push(d);
      }
    }

    const uniqueMatches = Array.from(new Map(matchedRecords.map((m) => [m.id, m])).values());

    if (uniqueMatches.length === 0) {
      return NextResponse.json({
        status: 'success',
        reply: 'No active government-reported disruptions are recorded for this corridor.',
        citations: [],
        active_hazards_count: disruptions.length,
        cited_disruptions: [],
      });
    }

    const lines: string[] = [
      '**Official Government Disruption Intelligence Assessment:**\n',
    ];

    uniqueMatches.forEach((d) => {
      const agency = d.government_body_name || d.reported_by_agency || 'Emergency Management Authority';
      lines.push(`• **${d.title}** (${d.highway_reference || 'Regional Highway'})`);
      lines.push(`  *Severity:* **${d.severity}** | *Risk Radius:* ${d.risk_radius_meters || 1000}m | *Reporting Body:* **${agency}**`);
      if (d.message) {
        lines.push(`  *Official Directive:* &ldquo;${d.message}&rdquo;`);
      }
      if (d.description && d.description !== d.message) {
        lines.push(`  *Field Notes:* ${d.description}`);
      }
      lines.push(`  *(Verified Government Record)*\n`);
    });

    const citations = Array.from(
      new Set(uniqueMatches.map((d) => d.government_body_name || d.reported_by_agency || 'Emergency Authority'))
    );

    return NextResponse.json({
      status: 'success',
      reply: lines.join('\n').trim(),
      citations,
      active_hazards_count: disruptions.length,
      cited_disruptions: uniqueMatches,
    });
  } catch (error: any) {
    console.error('Error in /api/chat-disruptions:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error in chat disruptions' },
      { status: 500 }
    );
  }
}
