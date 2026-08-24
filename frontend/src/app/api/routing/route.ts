import { NextRequest, NextResponse } from 'next/server';
import {
  RouteCalculationResult,
  RouteStep,
  RouteGeometry,
  DisasterResilientRouteResponse,
} from '@/types';
import {
  checkRouteCollisions,
  calculateBypassWaypoints,
  calculateHaversineDistance,
  generateHazardBuffersFeatureCollection,
} from '@/lib/spatial';
import { fetchRoadDisruptions } from '@/lib/supabaseClient';

const OSRM_URL = process.env.OSRM_URL || 'http://router.project-osrm.org';

/**
 * Helper to fetch single or multi-alternative driving routes from OSRM
 * Waypoints format: array of [longitude, latitude]
 */
async function fetchOSRMMultiRoutes(
  waypoints: [number, number][],
  profile: string = 'driving'
): Promise<Array<{
  distanceKm: number;
  durationMinutes: number;
  geometry: RouteGeometry;
  steps: RouteStep[];
  summary: string;
}> | null> {
  const coordString = waypoints.map((w) => `${w[0]},${w[1]}`).join(';');
  const url = `${OSRM_URL}/route/v1/${profile}/${coordString}?overview=full&geometries=geojson&steps=true&alternatives=true`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return null;
    }

    return data.routes.map((route: any, idx: number) => {
      const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
      const durationMinutes = Math.round((route.duration / 60) * 10) / 10;

      const steps: RouteStep[] = [];
      let highwayRef = '';
      if (route.legs) {
        for (const leg of route.legs) {
          if (leg.steps) {
            for (const s of leg.steps) {
              if (s.ref && !highwayRef) highwayRef = s.ref;
              if (s.name && !highwayRef && (s.name.startsWith('NH') || s.name.startsWith('SH'))) highwayRef = s.name;
              const man = s.maneuver || {};
              const inst =
                `${man.type || ''} ${man.modifier || ''}`.trim() ||
                'Continue forward';
              steps.push({
                name: s.name || s.ref || 'Regional Highway',
                instruction: inst,
                distance_meters: Math.round(s.distance || 0),
                duration_seconds: Math.round(s.duration || 0),
                mode: s.mode || 'driving',
              });
            }
          }
        }
      }

      return {
        distanceKm,
        durationMinutes,
        geometry: route.geometry as RouteGeometry,
        steps,
        summary: highwayRef ? `via ${highwayRef}` : (route.weight_name || `${distanceKm} km`),
      };
    });
  } catch (err) {
    console.warn('OSRM multi-route request error:', err);
    return null;
  }
}

/**
 * Generate synthetic geodesic mountain route when OSRM is offline
 */
function generateMountainFallbackRoute(
  waypoints: [number, number][],
  isDetour: boolean = false,
  reason: string = '',
  offsetMultiplier: number = 0
): RouteCalculationResult {
  const originLon = waypoints[0][0];
  const originLat = waypoints[0][1];
  const destLon = waypoints[waypoints.length - 1][0];
  const destLat = waypoints[waypoints.length - 1][1];

  let totalStraightKm = 0;
  const denseCoords: [number, number][] = [];

  const midLat = (originLat + destLat) / 2.0;
  const midLon = (originLon + destLon) / 2.0;
  const dLat = destLat - originLat;
  const dLon = destLon - originLon;
  const dist = Math.hypot(dLat, dLon);

  const perpLat = midLat - (dLon / (dist || 1)) * offsetMultiplier;
  const perpLon = midLon + (dLat / (dist || 1)) * offsetMultiplier;

  const intermediateWaypoints: [number, number][] =
    offsetMultiplier !== 0
      ? [[originLon, originLat], [perpLon, perpLat], [destLon, destLat]]
      : waypoints;

  for (let s = 0; s < intermediateWaypoints.length - 1; s++) {
    const w1 = intermediateWaypoints[s];
    const w2 = intermediateWaypoints[s + 1];
    const legDist = calculateHaversineDistance(w1[1], w1[0], w2[1], w2[0]);
    totalStraightKm += legDist;

    const segments = 12;
    for (let i = 0; i <= segments; i++) {
      const frac = i / segments;
      const lon = w1[0] + (w2[0] - w1[0]) * frac;
      const lat = w1[1] + (w2[1] - w1[1]) * frac;
      denseCoords.push([
        Math.round(lon * 100000) / 100000,
        Math.round(lat * 100000) / 100000,
      ]);
    }
  }

  // Winding mountain detour factor for NER (~1.45x)
  const roadDistKm = Math.round(totalStraightKm * (1.45 + Math.abs(offsetMultiplier) * 0.5) * 10) / 10;
  const durationMinutes = Math.round((roadDistKm / (isDetour ? 28.0 : 35.0)) * 60);

  const steps: RouteStep[] = [
    {
      name: 'Origin Departure',
      instruction: `Depart from supply point [${originLat.toFixed(3)}, ${originLon.toFixed(3)}]`,
      distance_meters: 0,
      duration_seconds: 0,
      mode: 'driving',
    },
    {
      name: isDetour
        ? 'Disaster-Resilient Emergency Bypass'
        : 'Regional Mountain Corridor',
      instruction: isDetour
        ? 'Reroute via safe lateral bypass corridor around hazard zone'
        : 'Navigate hill terrain road network towards destination depot',
      distance_meters: roadDistKm * 1000,
      duration_seconds: durationMinutes * 60,
      mode: 'driving',
    },
    {
      name: 'Destination Arrival',
      instruction: `Arrive at target hub [${destLat.toFixed(3)}, ${destLon.toFixed(3)}]`,
      distance_meters: 0,
      duration_seconds: 0,
      mode: 'driving',
    },
  ];

  return {
    status: 'success',
    distance_km: roadDistKm,
    duration_minutes: durationMinutes,
    geometry: {
      type: 'LineString',
      coordinates: denseCoords,
    },
    steps,
    origin: { latitude: originLat, longitude: originLon },
    destination: { latitude: destLat, longitude: destLon },
    summary: isDetour
      ? `Safe Emergency Detour (${roadDistKm} km)`
      : `Estimated hill transit corridor (${roadDistKm} km)`,
    is_fallback: true,
    is_detour: isDetour,
    message: reason || 'Terrain estimated route',
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origin, destination, profile = 'driving' } = body;

    if (
      !origin?.latitude ||
      !origin?.longitude ||
      !destination?.latitude ||
      !destination?.longitude
    ) {
      return NextResponse.json(
        {
          error:
            'Origin and Destination coordinates (latitude, longitude) are required.',
        },
        { status: 400 }
      );
    }

    const originLat = Number(origin.latitude);
    const originLon = Number(origin.longitude);
    const destLat = Number(destination.latitude);
    const destLon = Number(destination.longitude);

    // 1. Fetch active disruptions from Supabase
    const activeDisruptions = await fetchRoadDisruptions();
    const hazardBuffersGeoJSON =
      generateHazardBuffersFeatureCollection(activeDisruptions);

    // 2. Fetch multi-alternative routes from OSRM
    const osrmRoutes = await fetchOSRMMultiRoutes(
      [
        [originLon, originLat],
        [destLon, destLat],
      ],
      profile
    );

    let parsedRoutes: Array<{
      distanceKm: number;
      durationMinutes: number;
      geometry: RouteGeometry;
      steps: RouteStep[];
      summary: string;
    }> = [];

    if (osrmRoutes && osrmRoutes.length > 0) {
      parsedRoutes = osrmRoutes;
    }

    // 3. Fallback / Augment if fewer than 2 distinct routes exist
    if (parsedRoutes.length === 0) {
      const primaryFallback = generateMountainFallbackRoute(
        [[originLon, originLat], [destLon, destLat]],
        false,
        'Direct mountain corridor',
        0
      );
      const bypassNorthFallback = generateMountainFallbackRoute(
        [[originLon, originLat], [destLon, destLat]],
        true,
        'Northern Ridge Bypass',
        0.18
      );
      const bypassSouthFallback = generateMountainFallbackRoute(
        [[originLon, originLat], [destLon, destLat]],
        true,
        'Southern Valley Transit Corridor',
        -0.20
      );

      parsedRoutes = [
        {
          distanceKm: primaryFallback.distance_km,
          durationMinutes: primaryFallback.duration_minutes,
          geometry: primaryFallback.geometry,
          steps: primaryFallback.steps || [],
          summary: 'Direct Highway Corridor',
        },
        {
          distanceKm: bypassNorthFallback.distance_km,
          durationMinutes: bypassNorthFallback.duration_minutes,
          geometry: bypassNorthFallback.geometry,
          steps: bypassNorthFallback.steps || [],
          summary: 'via Northern Ridge Bypass',
        },
        {
          distanceKm: bypassSouthFallback.distance_km,
          durationMinutes: bypassSouthFallback.duration_minutes,
          geometry: bypassSouthFallback.geometry,
          steps: bypassSouthFallback.steps || [],
          summary: 'via Southern Valley Cut',
        },
      ];
    } else if (parsedRoutes.length === 1) {
      // If OSRM only returned 1 route, compute a safe geometric lateral bypass
      const bypassNorth = generateMountainFallbackRoute(
        [[originLon, originLat], [destLon, destLat]],
        true,
        'Elevated Bypass Corridor',
        0.22
      );
      parsedRoutes.push({
        distanceKm: bypassNorth.distance_km,
        durationMinutes: bypassNorth.duration_minutes,
        geometry: bypassNorth.geometry,
        steps: bypassNorth.steps || [],
        summary: 'via Elevated Ridge Bypass',
      });
    }

    // 4. Build CandidateCorridor array with per-route Turf.js collision analysis
    const candidateCorridors: any[] = [];
    const routeColors = ['#06b6d4', '#10b981', '#8b5cf6', '#f59e0b'];

    for (let i = 0; i < parsedRoutes.length; i++) {
      const r = parsedRoutes[i];
      const coll = checkRouteCollisions(r.geometry, activeDisruptions);

      let title = `Route ${i + 1}: ${r.summary}`;
      if (i === 0) {
        title = `Primary Direct Corridor (${r.summary})`;
      } else {
        title = `Alternative Bypass ${i} (${r.summary})`;
      }

      candidateCorridors.push({
        id: `corridor-${i}`,
        route_index: i,
        route_id: i,
        name: title,
        title,
        distance_km: r.distanceKm,
        duration_minutes: r.durationMinutes,
        geometry: r.geometry,
        steps: r.steps,
        waypoints: [[originLon, originLat], [destLon, destLat]],
        summary: r.summary,
        is_compromised: coll.isCompromised,
        intersected_hazards: coll.intersectedHazards,
        is_recommended: !coll.isCompromised && i > 0,
        color: coll.isCompromised ? '#ef4444' : routeColors[i % routeColors.length],
      });
    }

    // Set primaryRoute and alternativeRoute for backward compatibility
    const primaryRouteObj = candidateCorridors[0];
    const primaryRoute: RouteCalculationResult = {
      status: 'success',
      distance_km: primaryRouteObj.distance_km,
      duration_minutes: primaryRouteObj.duration_minutes,
      geometry: primaryRouteObj.geometry,
      steps: primaryRouteObj.steps,
      origin: { latitude: originLat, longitude: originLon },
      destination: { latitude: destLat, longitude: destLon },
      summary: primaryRouteObj.summary,
      is_fallback: false,
      is_detour: false,
    };

    const isCompromised = primaryRouteObj.is_compromised;
    let alternativeRoute: RouteCalculationResult | null = null;
    let bypassWaypoint: { latitude: number; longitude: number } | null = null;

    // Find the first clear alternative or secondary route
    const clearAlt = candidateCorridors.find((c, idx) => idx > 0 && !c.is_compromised) || candidateCorridors[1];
    if (clearAlt) {
      alternativeRoute = {
        status: 'success',
        distance_km: clearAlt.distance_km,
        duration_minutes: clearAlt.duration_minutes,
        geometry: clearAlt.geometry,
        steps: clearAlt.steps,
        origin: { latitude: originLat, longitude: originLon },
        destination: { latitude: destLat, longitude: destLon },
        summary: clearAlt.summary,
        is_fallback: false,
        is_detour: true,
      };
    }

    // Determine initial recommended route index
    let selectedRouteIndex = 0;
    const recommendedCandidate = candidateCorridors.find((c) => !c.is_compromised) || candidateCorridors[0];
    selectedRouteIndex = recommendedCandidate.route_index;

    const responseData: DisasterResilientRouteResponse = {
      isCompromised,
      intersectedHazards: primaryRouteObj.intersected_hazards || [],
      primaryRoute,
      alternativeRoute,
      candidateRoutes: candidateCorridors,
      routesList: candidateCorridors,
      selectedRouteIndex,
      bypassWaypoint,
      hazardBuffersGeoJSON,
      recommendation: isCompromised
        ? 'ACTIVATE_DETOUR'
        : 'PROCEED_PRIMARY',
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Error in /api/routing:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const originLat = parseFloat(searchParams.get('origin_lat') || '');
  const originLon = parseFloat(searchParams.get('origin_lon') || '');
  const destLat = parseFloat(searchParams.get('dest_lat') || '');
  const destLon = parseFloat(searchParams.get('dest_lon') || '');
  const profile = searchParams.get('profile') || 'driving';

  if (
    isNaN(originLat) ||
    isNaN(originLon) ||
    isNaN(destLat) ||
    isNaN(destLon)
  ) {
    return NextResponse.json(
      {
        error:
          'Missing or invalid origin_lat, origin_lon, dest_lat, or dest_lon parameters',
      },
      { status: 400 }
    );
  }

  const mockPostReq = new NextRequest(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin: { latitude: originLat, longitude: originLon },
      destination: { latitude: destLat, longitude: destLon },
      profile,
    }),
  });

  return POST(mockPostReq);
}
