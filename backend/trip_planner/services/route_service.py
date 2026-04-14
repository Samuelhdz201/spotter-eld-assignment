"""
Route Service — Geocoding and route calculation using OpenRouteService.

OpenRouteService (ORS) is free with API key registration.
Docs: https://openrouteservice.org/dev/#/api-docs

Fallback: if ORS is unavailable, uses Nominatim for geocoding
and calculates straight-line distance estimates.
"""

import requests
import math
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

ORS_BASE_URL = "https://api.openrouteservice.org"
NOMINATIM_URL = "https://nominatim.openstreetmap.org"


def geocode_location(location_str: str) -> dict:
    """
    Convert a location string to coordinates.
    Returns: {'lat': float, 'lon': float, 'display_name': str}
    """
    api_key = getattr(settings, 'ORS_API_KEY', '')

    # Try ORS geocoding first
    if api_key:
        try:
            resp = requests.get(
                f"{ORS_BASE_URL}/geocode/search",
                params={
                    "api_key": api_key,
                    "text": location_str,
                    "size": 1,
                    "boundary.country": "US",
                },
                timeout=10,
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get('features'):
                    feat = data['features'][0]
                    coords = feat['geometry']['coordinates']
                    return {
                        'lat': coords[1],
                        'lon': coords[0],
                        'display_name': feat['properties'].get('label', location_str),
                    }
        except Exception as e:
            logger.warning(f"ORS geocode failed: {e}")

    # Fallback to Nominatim
    try:
        resp = requests.get(
            f"{NOMINATIM_URL}/search",
            params={
                "q": location_str,
                "format": "json",
                "limit": 1,
                "countrycodes": "us",
            },
            headers={"User-Agent": "SpotterELD/1.0"},
            timeout=10,
        )
        if resp.status_code == 200:
            data = resp.json()
            if data:
                return {
                    'lat': float(data[0]['lat']),
                    'lon': float(data[0]['lon']),
                    'display_name': data[0].get('display_name', location_str),
                }
    except Exception as e:
        logger.warning(f"Nominatim geocode failed: {e}")

    raise ValueError(f"Could not geocode location: {location_str}")


def calculate_route(waypoints: list) -> dict:
    """
    Calculate driving route between waypoints.

    Args:
        waypoints: List of dicts with 'lat' and 'lon' keys
                   (minimum 2: origin and destination)

    Returns:
        {
            'total_distance_miles': float,
            'total_duration_hours': float,
            'geometry': [[lon, lat], ...],   # Full polyline for map
            'legs': [
                {
                    'distance_miles': float,
                    'duration_hours': float,
                    'start_location': str,
                    'end_location': str,
                    'start_coords': [lat, lon],
                    'end_coords': [lat, lon],
                    'waypoints': [[lon, lat], ...],
                }
            ]
        }
    """
    api_key = getattr(settings, 'ORS_API_KEY', '')

    if api_key and len(waypoints) >= 2:
        try:
            return _ors_route(waypoints, api_key)
        except Exception as e:
            logger.warning(f"ORS route calculation failed: {e}, using fallback")

    return _fallback_route(waypoints)


def _ors_route(waypoints: list, api_key: str) -> dict:
    """Calculate route using OpenRouteService Directions API."""
    coordinates = [[wp['lon'], wp['lat']] for wp in waypoints]

    resp = requests.post(
        f"{ORS_BASE_URL}/v2/directions/driving-hgv",
        json={
            "coordinates": coordinates,
            "instructions": True,
            "geometry": True,
            "units": "mi",
        },
        headers={
            "Authorization": api_key,
            "Content-Type": "application/json",
        },
        timeout=30,
    )

    if resp.status_code != 200:
        raise Exception(f"ORS API error: {resp.status_code} - {resp.text}")

    data = resp.json()
    route = data['routes'][0]

    # Decode geometry (ORS returns encoded polyline or GeoJSON)
    geometry = []
    if 'geometry' in route:
        if isinstance(route['geometry'], str):
            geometry = _decode_polyline(route['geometry'])
        elif isinstance(route['geometry'], dict):
            geometry = route['geometry'].get('coordinates', [])

    # Build legs
    legs = []
    segments = route.get('segments', [])
    for i, segment in enumerate(segments):
        start_idx = 0 if i == 0 else i
        end_idx = min(i + 1, len(waypoints) - 1)

        # Get waypoints for this segment from geometry
        seg_waypoints = geometry  # Simplified: use full geometry

        legs.append({
            'distance_miles': round(segment['distance'] / 1609.344, 1),  # meters to miles
            'duration_hours': round(segment['duration'] / 3600, 2),      # seconds to hours
            'start_location': waypoints[start_idx].get('display_name', f'Point {start_idx}'),
            'end_location': waypoints[end_idx].get('display_name', f'Point {end_idx}'),
            'start_coords': [waypoints[start_idx]['lat'], waypoints[start_idx]['lon']],
            'end_coords': [waypoints[end_idx]['lat'], waypoints[end_idx]['lon']],
            'waypoints': seg_waypoints,
        })

    total_dist = sum(l['distance_miles'] for l in legs)
    total_dur = sum(l['duration_hours'] for l in legs)

    return {
        'total_distance_miles': round(total_dist, 1),
        'total_duration_hours': round(total_dur, 2),
        'geometry': geometry,
        'legs': legs,
    }


def _fallback_route(waypoints: list) -> dict:
    """
    Fallback route calculation using haversine distance.
    Used when ORS API is unavailable.
    Applies a 1.3x road winding factor to straight-line distance.
    """
    WINDING_FACTOR = 1.3
    AVERAGE_SPEED_MPH = 55

    legs = []
    geometry = []
    total_dist = 0
    total_dur = 0

    for i in range(len(waypoints) - 1):
        start = waypoints[i]
        end = waypoints[i + 1]

        straight_dist = _haversine(start['lat'], start['lon'],
                                    end['lat'], end['lon'])
        road_dist = straight_dist * WINDING_FACTOR
        duration = road_dist / AVERAGE_SPEED_MPH

        # Generate simple geometry (straight line with intermediate points)
        leg_geometry = _generate_intermediate_points(
            start['lon'], start['lat'],
            end['lon'], end['lat'],
            num_points=20
        )
        geometry.extend(leg_geometry)

        legs.append({
            'distance_miles': round(road_dist, 1),
            'duration_hours': round(duration, 2),
            'start_location': start.get('display_name', f'Point {i}'),
            'end_location': end.get('display_name', f'Point {i + 1}'),
            'start_coords': [start['lat'], start['lon']],
            'end_coords': [end['lat'], end['lon']],
            'waypoints': leg_geometry,
        })

        total_dist += road_dist
        total_dur += duration

    return {
        'total_distance_miles': round(total_dist, 1),
        'total_duration_hours': round(total_dur, 2),
        'geometry': geometry,
        'legs': legs,
    }


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance in miles between two points."""
    R = 3959  # Earth's radius in miles

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) *
         math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.asin(math.sqrt(a))
    return R * c


def _generate_intermediate_points(lon1, lat1, lon2, lat2, num_points=20):
    """Generate intermediate points along a great circle arc."""
    points = []
    for i in range(num_points + 1):
        t = i / num_points
        lon = lon1 + (lon2 - lon1) * t
        lat = lat1 + (lat2 - lat1) * t
        points.append([round(lon, 6), round(lat, 6)])
    return points


def _decode_polyline(encoded: str) -> list:
    """Decode Google-encoded polyline to list of [lon, lat] coordinates."""
    points = []
    index = 0
    lat = 0
    lng = 0

    while index < len(encoded):
        # Decode latitude
        shift = 0
        result = 0
        while True:
            b = ord(encoded[index]) - 63
            index += 1
            result |= (b & 0x1F) << shift
            shift += 5
            if b < 0x20:
                break
        dlat = ~(result >> 1) if result & 1 else result >> 1
        lat += dlat

        # Decode longitude
        shift = 0
        result = 0
        while True:
            b = ord(encoded[index]) - 63
            index += 1
            result |= (b & 0x1F) << shift
            shift += 5
            if b < 0x20:
                break
        dlng = ~(result >> 1) if result & 1 else result >> 1
        lng += dlng

        points.append([round(lng / 1e5, 6), round(lat / 1e5, 6)])

    return points
