import logging
import math
from typing import List, Tuple, Dict, Any
import requests

logger = logging.getLogger("ner_corridor_intelligence.routing")

OSRM_BASE_URL = "http://router.project-osrm.org/route/v1/driving"
MOUNTAIN_TERRAIN_DETOUR_MULTIPLIER = 1.42  # Within 1.35x - 1.50x terrain slowdown range
DEFAULT_REQUEST_TIMEOUT = 6.0


def _haversine_distance_km(coord1: List[float], coord2: List[float]) -> float:
    """Calculates Haversine distance in km between [lat1, lon1] and [lat2, lon2]."""
    lat1, lon1 = coord1[0], coord1[1]
    lat2, lon2 = coord2[0], coord2[1]
    
    r = 6371.0  # Earth radius in kilometers
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c


def _calculate_detour_waypoint(origin: List[float], dest: List[float]) -> List[float]:
    """
    Computes a realistic bypass detour waypoint offset perpendicular to the main corridor line.
    origin: [lat, lon], dest: [lat, lon]
    returns: [detour_lat, detour_lon]
    """
    lat1, lon1 = origin[0], origin[1]
    lat2, lon2 = dest[0], dest[1]

    mid_lat = (lat1 + lat2) / 2.0
    mid_lon = (lon1 + lon2) / 2.0

    d_lat = lat2 - lat1
    d_lon = lon2 - lon1
    dist = math.hypot(d_lat, d_lon)

    if dist < 1e-4:
        return [lat1 + 0.1, lon1 + 0.1]

    # Perpendicular offset vector (~15% to 25% of corridor span)
    offset_scale = max(0.12, min(0.35, dist * 0.22))
    detour_lat = mid_lat - (d_lon / dist) * offset_scale
    detour_lon = mid_lon + (d_lat / dist) * offset_scale

    return [round(detour_lat, 5), round(detour_lon, 5)]


def _generate_fallback_geometry(origin: List[float], dest: List[float], detour: List[float] = None) -> List[List[float]]:
    """
    Generates a realistic curved linestring in GeoJSON [[lon, lat], ...] format
    simulating mountain highway trajectories when external routing engines are unreachable.
    """
    control_points = []
    if detour:
        control_points = [origin, detour, dest]
    else:
        # Subtle mountain curvature midpoint
        mid = _calculate_detour_waypoint(origin, dest)
        subtle_mid = [(origin[0] + mid[0]) / 2.0, (origin[1] + mid[1]) / 2.0]
        control_points = [origin, subtle_mid, dest]

    # Quadratic Bezier interpolation for smooth highway curvature
    num_steps = 25
    linestring: List[List[float]] = []
    p0, p1, p2 = control_points[0], control_points[1], control_points[2]

    for i in range(num_steps + 1):
        t = i / float(num_steps)
        lat = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * p2[0]
        lon = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * p2[1]
        linestring.append([round(lon, 5), round(lat, 5)])

    return linestring


def _fallback_driving_route(origin_coords: List[float], dest_coords: List[float], avoid_hazard: bool = False) -> Dict[str, Any]:
    """Generates synthetic mountain routing metrics with high fidelity when OSRM is offline."""
    base_direct_km = _haversine_distance_km(origin_coords, dest_coords)
    
    # Mountain road winding factor (ghat roads are 1.35x - 1.6x longer than straight lines)
    terrain_factor = 1.48 if not avoid_hazard else 1.82
    distance_km = round(base_direct_km * terrain_factor, 1)

    # Average mountain commercial transit speed: ~38 km/h on clear roads, ~28 km/h on detour/bypass
    avg_speed_kmh = 38.0 if not avoid_hazard else 28.0
    duration_hrs = round(distance_km / avg_speed_kmh, 1)

    detour_point = _calculate_detour_waypoint(origin_coords, dest_coords) if avoid_hazard else None
    coordinates = _generate_fallback_geometry(origin_coords, dest_coords, detour_point)

    return {
        "coordinates": coordinates,
        "distance_km": distance_km,
        "duration_hrs": duration_hrs,
    }


def get_driving_route(
    origin_coords: List[float],
    dest_coords: List[float],
    avoid_hazard: bool = False
) -> Dict[str, Any]:
    """
    Computes driving route geometry and transit metrics using OSRM routing engine.
    
    Args:
        origin_coords: Source coordinates in [lat, lon]
        dest_coords: Destination coordinates in [lat, lon]
        avoid_hazard: If True, inserts an alternative mountain detour waypoint and applies terrain slowdown multiplier.

    Returns:
        Dict containing:
        - coordinates: List of [lon, lat] coordinates representing route linestring
        - distance_km: Total driving distance in kilometers
        - duration_hrs: Estimated duration in hours (adjusted for mountain terrain when rerouted)
    """
    try:
        # Validate inputs
        if len(origin_coords) < 2 or len(dest_coords) < 2:
            raise ValueError("Coordinates must contain at least [lat, lon]")

        lat1, lon1 = origin_coords[0], origin_coords[1]
        lat2, lon2 = dest_coords[0], dest_coords[1]

        waypoints: List[Tuple[float, float]] = []
        if avoid_hazard:
            detour_pt = _calculate_detour_waypoint(origin_coords, dest_coords)
            waypoints = [(lon1, lat1), (detour_pt[1], detour_pt[0]), (lon2, lat2)]
        else:
            waypoints = [(lon1, lat1), (lon2, lat2)]

        # OSRM expects coordinates formatted as "{lon},{lat};{lon},{lat}..."
        coords_str = ";".join([f"{pt[0]:.6f},{pt[1]:.6f}" for pt in waypoints])
        osrm_url = f"{OSRM_BASE_URL}/{coords_str}?overview=full&geometries=geojson&steps=false"

        response = requests.get(osrm_url, timeout=DEFAULT_REQUEST_TIMEOUT)

        if response.status_code == 200:
            data = response.json()
            if data.get("code") == "Ok" and data.get("routes"):
                best_route = data["routes"][0]
                geometry = best_route.get("geometry", {})
                coordinates = geometry.get("coordinates", [])

                raw_distance_m = float(best_route.get("distance", 0.0))
                raw_duration_s = float(best_route.get("duration", 0.0))

                distance_km = round(raw_distance_m / 1000.0, 1)
                duration_hrs = raw_duration_s / 3600.0

                # If hazard detour was enforced, apply mountain terrain slowdown multiplier (1.35x - 1.50x)
                if avoid_hazard:
                    duration_hrs = duration_hrs * MOUNTAIN_TERRAIN_DETOUR_MULTIPLIER

                duration_hrs = round(duration_hrs, 1)

                if coordinates:
                    return {
                        "coordinates": coordinates,
                        "distance_km": distance_km,
                        "duration_hrs": duration_hrs,
                    }

        logger.warning(f"OSRM returned non-OK status ({response.status_code}). Switching to resilient fallback.")
        return _fallback_driving_route(origin_coords, dest_coords, avoid_hazard)

    except requests.RequestException as req_err:
        logger.warning(f"OSRM service network/timeout error: {req_err}. Using fallback routing.")
        return _fallback_driving_route(origin_coords, dest_coords, avoid_hazard)
    except Exception as e:
        logger.error(f"Error in get_driving_route: {e}. Using fallback routing.")
        return _fallback_driving_route(origin_coords, dest_coords, avoid_hazard)
