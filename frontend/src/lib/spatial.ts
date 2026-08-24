import * as turf from '@turf/turf';
import type { Feature, Polygon, FeatureCollection } from 'geojson';
import {
  RoadDisruption,
  RouteGeometry,
  CompromisedHazard,
  SupplyHub,
  HubRecommendation,
  CargoTier,
  CargoManifest,
} from '@/types';

/**
 * Cargo Manifest Presets for Phase 3 Multi-Tier Priority Dispatch
 */
export const CARGO_MANIFEST_PRESETS: Record<CargoTier, CargoManifest> = {
  TIER_1_CRITICAL: {
    tier: 'TIER_1_CRITICAL',
    label: 'Tier 1: Critical (Vaccines, Blood & Oxygen)',
    description: 'Emergency medical cargo. Strict bypass priority & fastest available mountain transit.',
    weightTonnes: 2.5,
    urgencyScore: 95,
    mountainDelayFactor: 1.0, // High-speed transit with priority escorts
    strictBypass: true,
  },
  TIER_2_ESSENTIAL: {
    tier: 'TIER_2_ESSENTIAL',
    label: 'Tier 2: Essential (Dry Food Rations & Water)',
    description: 'Relief food & potable water purification systems. Standard bypass protocol.',
    weightTonnes: 8.0,
    urgencyScore: 75,
    mountainDelayFactor: 1.12, // +12% terrain safety buffer
    strictBypass: true,
  },
  TIER_3_BULK: {
    tier: 'TIER_3_BULK',
    label: 'Tier 3: Bulk (Heavy Relief Machinery & Shelter)',
    description: 'Excavators, temporary bridges & shelter kits. Heavy freight speed profile.',
    weightTonnes: 22.0,
    urgencyScore: 45,
    mountainDelayFactor: 1.35, // +35% heavy truck mountain curve delay
    strictBypass: false,
  },
};

/**
 * Calculate cargo-adjusted ETA and Urgency Score factoring in terrain elevation & cargo tier
 */
export function calculateCargoAdjustedETA(
  baseDurationMinutes: number,
  distanceKm: number,
  tier: CargoTier = 'TIER_1_CRITICAL'
): {
  adjustedDurationMinutes: number;
  urgencyScore: number;
  delayBufferMinutes: number;
  etaString: string;
} {
  const config = CARGO_MANIFEST_PRESETS[tier] || CARGO_MANIFEST_PRESETS.TIER_1_CRITICAL;
  const delayFactor = config.mountainDelayFactor ?? config.mountain_delay_factor ?? 1.0;
  const urgency = config.urgencyScore ?? config.urgency_score ?? 95;
  
  // Adjusted transit time
  const adjustedDurationMinutes = Math.round(baseDurationMinutes * delayFactor);
  const delayBufferMinutes = Math.max(0, adjustedDurationMinutes - baseDurationMinutes);

  const hours = Math.floor(adjustedDurationMinutes / 60);
  const mins = Math.round(adjustedDurationMinutes % 60);
  const etaString = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  return {
    adjustedDurationMinutes,
    urgencyScore: urgency,
    delayBufferMinutes,
    etaString,
  };
}

/**
 * Generate a dynamic hazard safety buffer polygon using Turf.js
 * Default radius is based on disruption.risk_radius_meters (or default 1.5 - 3.0 km)
 */
export function generateHazardBuffer(
  disruption: RoadDisruption,
  customRadiusKm?: number
): Feature<Polygon> {
  const radiusKm =
    customRadiusKm ??
    Math.max(1.0, (disruption.risk_radius_meters || 1500) / 1000.0);

  const pt = turf.point([disruption.longitude, disruption.latitude], {
    id: disruption.id,
    title: disruption.title,
    severity: disruption.severity,
    disruption_type: disruption.disruption_type,
    highway_reference: disruption.highway_reference,
    radiusKm,
  });

  // Generate circular polygon buffer around hazard point
  const buffered = turf.buffer(pt, radiusKm, { units: 'kilometers' });
  return buffered as Feature<Polygon>;
}

/**
 * Generate a FeatureCollection of hazard buffer polygons for all active disruptions
 */
export function generateHazardBuffersFeatureCollection(
  disruptions: RoadDisruption[]
): FeatureCollection<Polygon> {
  const active = disruptions.filter((d) => d.is_active);
  const features = active.map((d) => generateHazardBuffer(d));
  return turf.featureCollection(features) as FeatureCollection<Polygon>;
}

/**
 * Perform spatial collision detection between an OSRM route LineString
 * and all active disruption hazard buffer polygons using Turf.js booleanIntersects
 */
export function checkRouteCollisions(
  routeGeometry: RouteGeometry,
  disruptions: RoadDisruption[]
): {
  isCompromised: boolean;
  intersectedHazards: CompromisedHazard[];
} {
  if (
    !routeGeometry ||
    !routeGeometry.coordinates ||
    routeGeometry.coordinates.length < 2
  ) {
    return { isCompromised: false, intersectedHazards: [] };
  }

  const routeLine = turf.lineString(routeGeometry.coordinates);
  const intersectedHazards: CompromisedHazard[] = [];

  for (const disruption of disruptions) {
    if (!disruption.is_active) continue;

    const bufferPolygon = generateHazardBuffer(disruption);
    const hazardPt = turf.point([disruption.longitude, disruption.latitude]);

    // 1. Check if the route line intersects the buffer polygon
    const hasIntersection = turf.booleanIntersects(routeLine, bufferPolygon);

    // 2. Also calculate exact point-to-line distance for severity ranking
    const distanceKm = Math.round(
      turf.pointToLineDistance(hazardPt, routeLine, { units: 'kilometers' }) * 10
    ) / 10;

    const riskRadiusKm = (disruption.risk_radius_meters || 1500) / 1000.0;
    const isDirectBlockage = distanceKm <= riskRadiusKm;

    if (hasIntersection || isDirectBlockage) {
      // Find exact intersection coordinate points if any
      let intersectionPoints: [number, number][] = [];
      try {
        const intersects = turf.lineIntersect(routeLine, bufferPolygon);
        if (intersects.features.length > 0) {
          intersectionPoints = intersects.features.map(
            (f) => f.geometry.coordinates as [number, number]
          );
        }
      } catch (err) {
        // Safe fallback
      }

      intersectedHazards.push({
        disruption,
        distance_to_route_km: distanceKm,
        is_direct_blockage: isDirectBlockage,
        intersection_points: intersectionPoints,
      });
    }
  }

  // Sort by closest distance to route
  intersectedHazards.sort(
    (a, b) => a.distance_to_route_km - b.distance_to_route_km
  );

  return {
    isCompromised: intersectedHazards.length > 0,
    intersectedHazards,
  };
}

/**
 * Calculate dynamic bypass waypoints outside the danger buffer zone
 * Projects perpendicular lateral offsets (left/right) from the hazard point
 * to find the clearest corridor around the disaster zone.
 */
export function calculateBypassWaypoints(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  primaryHazard: RoadDisruption,
  activeDisruptions: RoadDisruption[] = []
): {
  selectedBypass: { latitude: number; longitude: number };
  candidates: { latitude: number; longitude: number; isClear: boolean }[];
} {
  const origPt = turf.point([origin.longitude, origin.latitude]);
  const destPt = turf.point([destination.longitude, destination.latitude]);
  const hazardPt = turf.point([
    primaryHazard.longitude,
    primaryHazard.latitude,
  ]);

  // Corridor base bearing from origin to destination
  const corridorBearing = turf.bearing(origPt, destPt);

  // Buffer clearance distance: at least 1.8x the hazard risk radius (min 6.0 km)
  const hazardRadiusKm = (primaryHazard.risk_radius_meters || 2000) / 1000.0;
  const bypassOffsetKm = Math.max(6.0, hazardRadiusKm * 2.2);

  // Perpendicular angles: Left (-90°) and Right (+90°)
  const leftBearing = (corridorBearing - 90 + 360) % 360;
  const rightBearing = (corridorBearing + 90) % 360;

  // Project candidate bypass points
  const leftBypassPt = turf.destination(hazardPt, bypassOffsetKm, leftBearing, {
    units: 'kilometers',
  });
  const rightBypassPt = turf.destination(
    hazardPt,
    bypassOffsetKm,
    rightBearing,
    {
      units: 'kilometers',
    }
  );

  const candidates = [
    {
      latitude: leftBypassPt.geometry.coordinates[1],
      longitude: leftBypassPt.geometry.coordinates[0],
      isClear: true,
    },
    {
      latitude: rightBypassPt.geometry.coordinates[1],
      longitude: rightBypassPt.geometry.coordinates[0],
      isClear: true,
    },
  ];

  // Evaluate which candidate is furthest from any other active disruptions
  let bestCandidate = candidates[0];
  let maxMinDistance = -1;

  for (const cand of candidates) {
    const candPt = turf.point([cand.longitude, cand.latitude]);
    let minDistanceToAnyDisruption = 9999;

    for (const d of activeDisruptions) {
      if (!d.is_active) continue;
      const dPt = turf.point([d.longitude, d.latitude]);
      const dist = turf.distance(candPt, dPt, { units: 'kilometers' });
      if (dist < minDistanceToAnyDisruption) {
        minDistanceToAnyDisruption = dist;
      }
    }

    if (minDistanceToAnyDisruption > maxMinDistance) {
      maxMinDistance = minDistanceToAnyDisruption;
      bestCandidate = cand;
    }
  }

  return {
    selectedBypass: {
      latitude: Math.round(bestCandidate.latitude * 10000) / 10000,
      longitude: Math.round(bestCandidate.longitude * 10000) / 10000,
    },
    candidates,
  };
}

/**
 * Alternative Hub Recommendation Engine (Multi-Hub Sourcing)
 * Uses Turf.js spatial distance & hazard checks to rank alternate supply depots
 */
export function recommendAlternateHubs(
  destination: SupplyHub,
  currentOrigin: SupplyHub | null,
  allHubs: SupplyHub[],
  disruptions: RoadDisruption[],
  requiredCapacityTonnes: number = 5.0
): HubRecommendation[] {
  const destPt = turf.point([destination.longitude, destination.latitude]);
  const candidates: HubRecommendation[] = [];

  for (const hub of allHubs) {
    // Skip if it is the destination itself or current origin
    if (hub.id === destination.id || (currentOrigin && hub.id === currentOrigin.id)) {
      continue;
    }

    const capacity = Number(hub.capacity_tonnes) || 0;
    if (capacity < requiredCapacityTonnes) continue;

    const hubPt = turf.point([hub.longitude, hub.latitude]);
    const straightDistKm = Math.round(turf.distance(hubPt, destPt, { units: 'kilometers' }) * 10) / 10;
    
    // Mountain road detour factor (~1.45x)
    const estimatedRoadKm = Math.round(straightDistKm * 1.45 * 10) / 10;
    const estimatedDurationMin = Math.round((estimatedRoadKm / 35.0) * 60);

    // Check if line to destination has direct hazard intersections
    const directLine: RouteGeometry = {
      type: 'LineString',
      coordinates: [
        [hub.longitude, hub.latitude],
        [destination.longitude, destination.latitude],
      ],
    };
    const collision = checkRouteCollisions(directLine, disruptions);

    let reason = 'Direct regional corridor clear';
    if (collision.isCompromised) {
      reason = `Corridor intersects ${collision.intersectedHazards[0].disruption.title}`;
    } else if (capacity >= 200) {
      reason = `High capacity strategic hub (${capacity}T available)`;
    }

    candidates.push({
      hub,
      straightDistanceKm: straightDistKm,
      estimatedRoadDistanceKm: estimatedRoadKm,
      estimatedDurationMin,
      isCorridorClear: !collision.isCompromised,
      availableCapacityTonnes: capacity,
      reason,
    });
  }

  // Sort: Clear corridors first, then shortest road distance
  return candidates.sort((a, b) => {
    if (a.isCorridorClear && !b.isCorridorClear) return -1;
    if (!a.isCorridorClear && b.isCorridorClear) return 1;
    return (a.estimatedRoadDistanceKm || a.road_distance_km || 0) - (b.estimatedRoadDistanceKm || b.road_distance_km || 0);
  });
}

/**
 * Calculate great-circle distance between two points in kilometers.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const from = turf.point([lon1, lat1]);
  const to = turf.point([lon2, lat2]);
  return (
    Math.round(turf.distance(from, to, { units: 'kilometers' }) * 10) / 10
  );
}
