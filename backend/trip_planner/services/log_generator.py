"""
Log Generator Service — Orchestrates route calculation and HOS engine
to produce a complete trip plan with daily log sheets.
"""

from datetime import datetime, timedelta
from .route_service import geocode_location, calculate_route
from .hos_engine import plan_trip_stops


def generate_trip_plan(
    current_location: str,
    pickup_location: str,
    dropoff_location: str,
    current_cycle_used: float,
    start_time: datetime = None,
) -> dict:
    """
    Generate a complete trip plan including route, stops, and daily logs.

    Args:
        current_location: Starting location string
        pickup_location: Pickup location string
        dropoff_location: Dropoff location string
        current_cycle_used: Hours already used in 70-hour cycle
        start_time: When the trip starts (defaults to tomorrow at 8 AM)

    Returns:
        Complete trip plan dict with route, stops, and daily_logs
    """
    if start_time is None:
        tomorrow = datetime.now() + timedelta(days=1)
        start_time = tomorrow.replace(hour=8, minute=0, second=0, microsecond=0)

    # ─── Step 1: Geocode all locations ──────────────────────────
    current_geo = geocode_location(current_location)
    pickup_geo = geocode_location(pickup_location)
    dropoff_geo = geocode_location(dropoff_location)

    # Attach display names
    current_geo['display_name'] = _clean_display_name(
        current_geo.get('display_name', current_location), current_location)
    pickup_geo['display_name'] = _clean_display_name(
        pickup_geo.get('display_name', pickup_location), pickup_location)
    dropoff_geo['display_name'] = _clean_display_name(
        dropoff_geo.get('display_name', dropoff_location), dropoff_location)

    # ─── Step 2: Calculate route ────────────────────────────────
    waypoints = [current_geo, pickup_geo, dropoff_geo]
    route_data = calculate_route(waypoints)

    # ─── Step 3: Plan stops and generate logs ───────────────────
    stops, daily_logs = plan_trip_stops(
        legs=route_data['legs'],
        current_cycle_used=current_cycle_used,
        start_time=start_time,
    )

    # ─── Step 4: Build response ─────────────────────────────────
    total_driving = sum(
        log.totals.get('driving', 0) for log in daily_logs
    )

    response = {
        'trip': {
            'current_location': current_geo['display_name'],
            'pickup_location': pickup_geo['display_name'],
            'dropoff_location': dropoff_geo['display_name'],
            'current_cycle_used': current_cycle_used,
            'total_distance_miles': route_data['total_distance_miles'],
            'total_driving_hours': round(total_driving, 2),
            'total_trip_days': len(daily_logs),
            'start_time': start_time.isoformat(),
        },
        'route': {
            'geometry': route_data['geometry'],
            'legs': [
                {
                    'distance_miles': leg['distance_miles'],
                    'duration_hours': leg['duration_hours'],
                    'start_location': leg['start_location'],
                    'end_location': leg['end_location'],
                    'start_coords': leg['start_coords'],
                    'end_coords': leg['end_coords'],
                }
                for leg in route_data['legs']
            ],
        },
        'stops': [
            {
                'type': stop.type,
                'location': stop.location,
                'coordinates': stop.coordinates,
                'mile_marker': stop.mile_marker,
                'arrival_time': stop.arrival_time,
                'departure_time': stop.departure_time,
                'duration_hours': stop.duration_hours,
                'remarks': stop.remarks,
            }
            for stop in stops
        ],
        'daily_logs': [
            {
                'day': log.day,
                'date': log.date,
                'entries': [
                    {
                        'status': entry.status,
                        'start_hour': entry.start_hour,
                        'end_hour': entry.end_hour,
                        'location': entry.location,
                        'remarks': entry.remarks,
                    }
                    for entry in log.entries
                ],
                'totals': log.totals,
                'total_miles': log.total_miles,
                'remarks_locations': log.remarks_locations,
            }
            for log in daily_logs
        ],
    }

    return response


def _clean_display_name(geocoded_name: str, original: str) -> str:
    """
    Clean up geocoded display names to be shorter and readable.
    Prefer the original user input if geocoded name is too long.
    """
    if len(geocoded_name) > 60:
        # Try to extract city, state from geocoded name
        parts = geocoded_name.split(',')
        if len(parts) >= 3:
            # Typically: "City, County, State, Country"
            return f"{parts[0].strip()}, {parts[-2].strip()}"
        return original
    return geocoded_name
