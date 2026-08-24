import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'NER Smart Logistics Next.js Full-Stack Engine',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    region: 'North Eastern Region (NER), India',
    spatial_engine: 'Turf.js + PostGIS',
    routing_engine: 'OSRM + Mountain Terrain Model',
  });
}
