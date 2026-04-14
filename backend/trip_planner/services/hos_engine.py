"""
FMCSA Hours of Service (HOS) Compliance Engine

Implements the following rules for property-carrying CMV drivers:
- 11-Hour Driving Limit: Max 11 hours driving after 10 consecutive hours off duty
- 14-Hour Driving Window: Cannot drive beyond 14th hour after coming on duty
- 30-Minute Rest Break: Required after 8 cumulative hours of driving
- 70-Hour/8-Day Limit: Cannot drive after 70 hours on duty in 8 consecutive days
- 10-Hour Off-Duty: Must have 10 consecutive hours off between shifts
- Fuel stops: At least every 1,000 miles
- Pickup/Dropoff: 1 hour each (on-duty not driving)

Reference: 49 CFR Part 395 — FMCSA HOS Regulations
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional
import math


class DutyStatus(str, Enum):
    OFF_DUTY = "off_duty"
    SLEEPER_BERTH = "sleeper_berth"
    DRIVING = "driving"
    ON_DUTY_NOT_DRIVING = "on_duty_not_driving"


class StopType(str, Enum):
    START = "start"
    PICKUP = "pickup"
    DROPOFF = "dropoff"
    FUEL = "fuel"
    REST_BREAK = "rest_break"          # 30-min mandatory break
    REQUIRED_REST = "required_rest"     # 10-hour off-duty
    CYCLE_REST = "cycle_rest"           # Rest to reset 70-hour cycle
    END = "end"


# ─── HOS Constants ──────────────────────────────────────────────
MAX_DRIVING_HOURS = 11.0
MAX_DUTY_WINDOW_HOURS = 14.0
MANDATORY_BREAK_AFTER_HOURS = 8.0
MANDATORY_BREAK_DURATION_HOURS = 0.5    # 30 minutes
OFF_DUTY_REQUIRED_HOURS = 10.0
MAX_CYCLE_HOURS = 70.0
CYCLE_DAYS = 8
FUEL_STOP_INTERVAL_MILES = 1000
FUEL_STOP_DURATION_HOURS = 0.5          # 30 min fuel stop
PICKUP_DROPOFF_DURATION_HOURS = 1.0     # 1 hour per assessment
AVERAGE_SPEED_MPH = 55.0               # Average truck speed
PRE_TRIP_INSPECTION_HOURS = 0.25        # 15 min pre-trip
POST_TRIP_INSPECTION_HOURS = 0.25       # 15 min post-trip


@dataclass
class Stop:
    """Represents a stop along the route."""
    type: str
    location: str
    coordinates: list  # [lat, lon]
    mile_marker: float
    arrival_time: str   # ISO format
    departure_time: str  # ISO format
    duration_hours: float = 0
    remarks: str = ""


@dataclass
class LogEntry:
    """A single entry on the daily log sheet (one horizontal line on the grid)."""
    status: str          # DutyStatus value
    start_hour: float    # 0-24 (hour of day, supports decimals for 15-min increments)
    end_hour: float      # 0-24
    location: str = ""
    remarks: str = ""

    @property
    def duration(self) -> float:
        return round(self.end_hour - self.start_hour, 2)


@dataclass
class DailyLog:
    """One complete daily log sheet (24 hours)."""
    day: int
    date: str  # YYYY-MM-DD
    entries: list = field(default_factory=list)
    total_miles: float = 0
    carrier_name: str = ""
    truck_number: str = ""
    remarks_locations: list = field(default_factory=list)

    @property
    def totals(self) -> dict:
        """Calculate total hours per duty status. Must sum to 24."""
        totals = {
            "off_duty": 0,
            "sleeper_berth": 0,
            "driving": 0,
            "on_duty_not_driving": 0,
        }
        for entry in self.entries:
            if entry.status in totals:
                totals[entry.status] = round(totals[entry.status] + entry.duration, 2)
        return totals


@dataclass
class ShiftState:
    """Tracks the current state of the driver's shift for HOS compliance."""
    driving_hours_in_shift: float = 0        # Resets after 10h off-duty
    duty_window_start: Optional[float] = None  # When the 14-hour window started
    hours_since_last_break: float = 0        # For 30-min break rule
    cycle_hours_used: float = 0              # 70-hour rolling total
    miles_since_fuel: float = 0              # For fuel stop tracking
    is_on_duty: bool = False
    shift_on_duty_hours: float = 0           # Total on-duty in current shift

    def can_drive(self, hours_needed: float) -> tuple:
        """
        Check if the driver can drive for the requested hours.
        Returns (can_drive: bool, max_hours: float, reason: str)
        """
        available = MAX_DRIVING_HOURS - self.driving_hours_in_shift
        if available <= 0:
            return False, 0, "11-hour driving limit reached"

        # 14-hour window check
        if self.duty_window_start is not None:
            window_remaining = MAX_DUTY_WINDOW_HOURS - self.shift_on_duty_hours
            if window_remaining <= 0:
                return False, 0, "14-hour duty window expired"
            available = min(available, window_remaining)

        # 30-minute break check
        if self.hours_since_last_break >= MANDATORY_BREAK_AFTER_HOURS:
            return False, 0, "30-minute break required (8h driving reached)"

        hours_until_break = MANDATORY_BREAK_AFTER_HOURS - self.hours_since_last_break
        available = min(available, hours_until_break)

        # 70-hour cycle check
        cycle_remaining = MAX_CYCLE_HOURS - self.cycle_hours_used
        if cycle_remaining <= 0:
            return False, 0, "70-hour/8-day cycle limit reached"
        available = min(available, cycle_remaining)

        available = round(max(0, available), 2)
        if available <= 0:
            return False, 0, "No available driving hours"

        return True, available, "OK"

    def add_driving(self, hours: float):
        self.driving_hours_in_shift += hours
        self.hours_since_last_break += hours
        self.cycle_hours_used += hours
        self.shift_on_duty_hours += hours
        self.is_on_duty = True

    def add_on_duty_not_driving(self, hours: float):
        self.cycle_hours_used += hours
        self.shift_on_duty_hours += hours
        self.is_on_duty = True

    def take_break(self):
        """30-minute mandatory break resets the 8-hour driving counter."""
        self.hours_since_last_break = 0

    def take_off_duty(self, hours: float):
        """Take off-duty time. If >= 10 hours, resets shift limits."""
        if hours >= OFF_DUTY_REQUIRED_HOURS:
            self.driving_hours_in_shift = 0
            self.duty_window_start = None
            self.hours_since_last_break = 0
            self.shift_on_duty_hours = 0
            self.is_on_duty = False

    def start_duty(self):
        """Mark the beginning of a new duty period."""
        if self.duty_window_start is None:
            self.duty_window_start = 0
        self.is_on_duty = True


def plan_trip_stops(
    legs: list,
    current_cycle_used: float,
    start_time: datetime,
) -> tuple:
    """
    Given route legs, plan all required stops for HOS compliance.

    Args:
        legs: List of dicts with 'distance_miles', 'duration_hours',
              'start_location', 'end_location', 'start_coords', 'end_coords',
              'waypoints' (list of [lon, lat] along the leg)
        current_cycle_used: Hours already used in the 70-hour cycle
        start_time: When the trip starts

    Returns:
        (stops: list[Stop], daily_logs: list[DailyLog])
    """
    state = ShiftState(cycle_hours_used=current_cycle_used)
    stops = []
    daily_logs = []
    current_time = start_time
    current_mile = 0.0

    # We assume driver starts the day off-duty and begins their shift
    # The trip day starts at the current time
    day_number = 1
    current_day_entries = []
    day_start_time = datetime(current_time.year, current_time.month, current_time.day)

    def hour_of_day(dt: datetime) -> float:
        """Get the decimal hour of the day (0.0 - 24.0)."""
        return dt.hour + dt.minute / 60.0 + dt.second / 3600.0

    def add_entry(status: str, start_dt: datetime, end_dt: datetime,
                  location: str = "", remarks: str = ""):
        """Add a log entry, handling day boundary crossings."""
        nonlocal current_day_entries, day_number, daily_logs, day_start_time, current_mile

        s_hour = hour_of_day(start_dt)
        e_hour = hour_of_day(end_dt)

        # Check if entry crosses midnight
        if end_dt.date() > start_dt.date():
            # Split at midnight
            # First part: start to midnight
            if s_hour < 24.0:
                current_day_entries.append(LogEntry(
                    status=status,
                    start_hour=round(s_hour, 2),
                    end_hour=24.0,
                    location=location,
                    remarks=remarks,
                ))

            # Finalize current day
            _finalize_day(daily_logs, current_day_entries, day_number,
                          day_start_time, current_mile, location)
            day_number += 1
            day_start_time = datetime(end_dt.year, end_dt.month, end_dt.day)
            current_day_entries = []

            # Handle multiple full days (for long off-duty periods)
            days_diff = (end_dt.date() - start_dt.date()).days
            for d in range(1, days_diff):
                mid_day = day_start_time + timedelta(days=d - 1)
                off_day_entries = [LogEntry(
                    status=status, start_hour=0, end_hour=24.0,
                    location=location, remarks="Continuous " + status
                )]
                _finalize_day(daily_logs, off_day_entries, day_number,
                              mid_day, 0, location)
                day_number += 1

            day_start_time = datetime(end_dt.year, end_dt.month, end_dt.day)

            # Second part: midnight to end
            if e_hour > 0:
                current_day_entries.append(LogEntry(
                    status=status,
                    start_hour=0,
                    end_hour=round(e_hour, 2),
                    location=location,
                    remarks=remarks,
                ))
        else:
            current_day_entries.append(LogEntry(
                status=status,
                start_hour=round(s_hour, 2),
                end_hour=round(e_hour, 2),
                location=location,
                remarks=remarks,
            ))

    def add_stop(stop_type: str, location: str, coords: list,
                 mile: float, arrival: datetime, departure: datetime,
                 remarks: str = ""):
        stops.append(Stop(
            type=stop_type,
            location=location,
            coordinates=coords,
            mile_marker=round(mile, 1),
            arrival_time=arrival.isoformat(),
            departure_time=departure.isoformat(),
            duration_hours=round((departure - arrival).total_seconds() / 3600, 2),
            remarks=remarks,
        ))

    # ─── Fill off-duty time from midnight to start ──────────────
    if hour_of_day(current_time) > 0:
        add_entry(DutyStatus.OFF_DUTY, day_start_time, current_time,
                  legs[0]['start_location'] if legs else "", "Off duty")

    # ─── Start of trip: pre-trip inspection ──────────────────────
    state.start_duty()
    pre_trip_end = current_time + timedelta(hours=PRE_TRIP_INSPECTION_HOURS)
    add_entry(DutyStatus.ON_DUTY_NOT_DRIVING, current_time, pre_trip_end,
              legs[0]['start_location'] if legs else "", "Pre-trip inspection")
    state.add_on_duty_not_driving(PRE_TRIP_INSPECTION_HOURS)
    current_time = pre_trip_end

    add_stop(StopType.START, legs[0]['start_location'] if legs else "",
             legs[0]['start_coords'] if legs else [0, 0],
             0, start_time, current_time, "Trip start")

    # ─── Process each leg ────────────────────────────────────────
    for leg_idx, leg in enumerate(legs):
        leg_miles = leg['distance_miles']
        leg_location_start = leg['start_location']
        leg_location_end = leg['end_location']
        leg_coords_end = leg['end_coords']

        # Pickup stop (1 hour on-duty not driving)
        if leg_idx == 0 and len(legs) > 1:
            # Driving to pickup first
            pass  # Handled below in driving loop

        miles_remaining_in_leg = leg_miles
        leg_start_location = leg_location_start

        while miles_remaining_in_leg > 0.01:
            # Check if we need a fuel stop
            miles_to_fuel = FUEL_STOP_INTERVAL_MILES - state.miles_since_fuel
            if miles_to_fuel <= 0:
                miles_to_fuel = FUEL_STOP_INTERVAL_MILES

            # Check how many miles we can drive in available hours
            can_drive, max_hours, reason = state.can_drive(1)

            if not can_drive:
                if "30-minute break" in reason:
                    # Take 30-minute rest break
                    break_end = current_time + timedelta(hours=MANDATORY_BREAK_DURATION_HOURS)
                    loc = _interpolate_location(leg, miles_remaining_in_leg, leg_miles)
                    add_entry(DutyStatus.ON_DUTY_NOT_DRIVING, current_time, break_end,
                              loc, "30-min rest break")
                    add_stop(StopType.REST_BREAK, loc,
                             _interpolate_coords(leg, miles_remaining_in_leg, leg_miles),
                             current_mile, current_time, break_end,
                             "30-minute mandatory break (§395.3(a)(3)(ii))")
                    state.add_on_duty_not_driving(MANDATORY_BREAK_DURATION_HOURS)
                    state.take_break()
                    current_time = break_end
                    continue

                elif "11-hour" in reason or "14-hour" in reason:
                    # Need 10-hour off-duty rest
                    loc = _interpolate_location(leg, miles_remaining_in_leg, leg_miles)
                    rest_end = current_time + timedelta(hours=OFF_DUTY_REQUIRED_HOURS)

                    # Post-trip inspection before rest
                    post_end = current_time + timedelta(hours=POST_TRIP_INSPECTION_HOURS)
                    add_entry(DutyStatus.ON_DUTY_NOT_DRIVING, current_time, post_end,
                              loc, "Post-trip inspection")
                    state.add_on_duty_not_driving(POST_TRIP_INSPECTION_HOURS)
                    current_time = post_end

                    add_entry(DutyStatus.SLEEPER_BERTH, current_time, rest_end,
                              loc, "Required 10-hour rest")
                    add_stop(StopType.REQUIRED_REST, loc,
                             _interpolate_coords(leg, miles_remaining_in_leg, leg_miles),
                             current_mile, current_time, rest_end,
                             "10-hour off-duty required (§395.3(a)(1))")
                    state.take_off_duty(OFF_DUTY_REQUIRED_HOURS)
                    current_time = rest_end

                    # Pre-trip after rest
                    state.start_duty()
                    pre_end = current_time + timedelta(hours=PRE_TRIP_INSPECTION_HOURS)
                    add_entry(DutyStatus.ON_DUTY_NOT_DRIVING, current_time, pre_end,
                              loc, "Pre-trip inspection")
                    state.add_on_duty_not_driving(PRE_TRIP_INSPECTION_HOURS)
                    current_time = pre_end
                    continue

                elif "70-hour" in reason:
                    # Need 34-hour restart to reset cycle
                    restart_hours = 34.0
                    loc = _interpolate_location(leg, miles_remaining_in_leg, leg_miles)
                    rest_end = current_time + timedelta(hours=restart_hours)

                    post_end = current_time + timedelta(hours=POST_TRIP_INSPECTION_HOURS)
                    add_entry(DutyStatus.ON_DUTY_NOT_DRIVING, current_time, post_end,
                              loc, "Post-trip inspection")
                    state.add_on_duty_not_driving(POST_TRIP_INSPECTION_HOURS)
                    current_time = post_end

                    add_entry(DutyStatus.OFF_DUTY, current_time, rest_end,
                              loc, "34-hour restart (§395.3(c))")
                    add_stop(StopType.CYCLE_REST, loc,
                             _interpolate_coords(leg, miles_remaining_in_leg, leg_miles),
                             current_mile, current_time, rest_end,
                             "34-hour restart for 70-hour cycle (§395.3(c))")
                    state.take_off_duty(restart_hours)
                    state.cycle_hours_used = 0  # Full reset
                    current_time = rest_end

                    state.start_duty()
                    pre_end = current_time + timedelta(hours=PRE_TRIP_INSPECTION_HOURS)
                    add_entry(DutyStatus.ON_DUTY_NOT_DRIVING, current_time, pre_end,
                              loc, "Pre-trip inspection")
                    state.add_on_duty_not_driving(PRE_TRIP_INSPECTION_HOURS)
                    current_time = pre_end
                    continue
                else:
                    # Fallback: take rest
                    loc = _interpolate_location(leg, miles_remaining_in_leg, leg_miles)
                    rest_end = current_time + timedelta(hours=OFF_DUTY_REQUIRED_HOURS)
                    add_entry(DutyStatus.SLEEPER_BERTH, current_time, rest_end,
                              loc, "Required rest")
                    state.take_off_duty(OFF_DUTY_REQUIRED_HOURS)
                    current_time = rest_end
                    state.start_duty()
                    continue

            # Calculate how many miles to drive in this segment
            max_drive_miles = max_hours * AVERAGE_SPEED_MPH
            segment_miles = min(miles_remaining_in_leg, max_drive_miles, miles_to_fuel)
            segment_hours = segment_miles / AVERAGE_SPEED_MPH
            segment_hours = round(segment_hours, 2)

            if segment_hours <= 0:
                break

            # Drive the segment
            drive_end = current_time + timedelta(hours=segment_hours)
            loc_start = _interpolate_location(leg, miles_remaining_in_leg, leg_miles)
            miles_remaining_in_leg -= segment_miles
            current_mile += segment_miles
            state.miles_since_fuel += segment_miles
            loc_end = _interpolate_location(leg, miles_remaining_in_leg, leg_miles)

            add_entry(DutyStatus.DRIVING, current_time, drive_end,
                      loc_start, f"Driving to {loc_end}")
            state.add_driving(segment_hours)
            if state.duty_window_start is None:
                state.start_duty()
            current_time = drive_end

            # Check if fuel stop needed
            if state.miles_since_fuel >= FUEL_STOP_INTERVAL_MILES and miles_remaining_in_leg > 10:
                fuel_end = current_time + timedelta(hours=FUEL_STOP_DURATION_HOURS)
                loc = _interpolate_location(leg, miles_remaining_in_leg, leg_miles)
                add_entry(DutyStatus.ON_DUTY_NOT_DRIVING, current_time, fuel_end,
                          loc, "Fuel stop")
                add_stop(StopType.FUEL, loc,
                         _interpolate_coords(leg, miles_remaining_in_leg, leg_miles),
                         current_mile, current_time, fuel_end, "Fuel stop")
                state.add_on_duty_not_driving(FUEL_STOP_DURATION_HOURS)
                state.miles_since_fuel = 0
                current_time = fuel_end

        # End of leg — add pickup or dropoff stop
        if leg_idx == 0 and len(legs) > 1:
            # Arrived at pickup
            pickup_end = current_time + timedelta(hours=PICKUP_DROPOFF_DURATION_HOURS)
            add_entry(DutyStatus.ON_DUTY_NOT_DRIVING, current_time, pickup_end,
                      leg_location_end, "Pickup — loading")
            add_stop(StopType.PICKUP, leg_location_end, leg_coords_end,
                     current_mile, current_time, pickup_end,
                     "Pickup location — 1 hour loading")
            state.add_on_duty_not_driving(PICKUP_DROPOFF_DURATION_HOURS)
            current_time = pickup_end

        elif leg_idx == len(legs) - 1:
            # Arrived at dropoff
            dropoff_end = current_time + timedelta(hours=PICKUP_DROPOFF_DURATION_HOURS)
            add_entry(DutyStatus.ON_DUTY_NOT_DRIVING, current_time, dropoff_end,
                      leg_location_end, "Dropoff — unloading")
            add_stop(StopType.DROPOFF, leg_location_end, leg_coords_end,
                     current_mile, current_time, dropoff_end,
                     "Dropoff location — 1 hour unloading")
            state.add_on_duty_not_driving(PICKUP_DROPOFF_DURATION_HOURS)
            current_time = dropoff_end

    # ─── Post-trip inspection ───────────────────────────────────
    post_end = current_time + timedelta(hours=POST_TRIP_INSPECTION_HOURS)
    final_loc = legs[-1]['end_location'] if legs else ""
    add_entry(DutyStatus.ON_DUTY_NOT_DRIVING, current_time, post_end,
              final_loc, "Post-trip inspection")
    state.add_on_duty_not_driving(POST_TRIP_INSPECTION_HOURS)
    current_time = post_end

    add_stop(StopType.END, final_loc,
             legs[-1]['end_coords'] if legs else [0, 0],
             current_mile, current_time, current_time, "Trip end")

    # ─── Fill remaining off-duty to end of day ──────────────────
    end_of_day_hour = hour_of_day(current_time)
    if end_of_day_hour < 24.0:
        end_of_day = datetime(current_time.year, current_time.month,
                              current_time.day) + timedelta(days=1)
        add_entry(DutyStatus.OFF_DUTY, current_time, end_of_day,
                  final_loc, "Off duty")

    # ─── Finalize last day ──────────────────────────────────────
    if current_day_entries:
        _finalize_day(daily_logs, current_day_entries, day_number,
                      day_start_time, current_mile, final_loc)

    return stops, daily_logs


def _finalize_day(daily_logs, entries, day_number, day_start, miles, location):
    """Finalize a daily log, ensuring entries sum to 24 hours."""
    # Sort by start hour
    entries.sort(key=lambda e: e.start_hour)

    # Fill any gaps with off-duty
    filled = []
    expected_start = 0.0
    for entry in entries:
        if entry.start_hour > expected_start + 0.01:
            filled.append(LogEntry(
                status=DutyStatus.OFF_DUTY,
                start_hour=round(expected_start, 2),
                end_hour=round(entry.start_hour, 2),
                location=location,
                remarks="Off duty",
            ))
        filled.append(entry)
        expected_start = entry.end_hour

    if expected_start < 23.99:
        filled.append(LogEntry(
            status=DutyStatus.OFF_DUTY,
            start_hour=round(expected_start, 2),
            end_hour=24.0,
            location=location,
            remarks="Off duty",
        ))

    # Merge consecutive entries with same status
    merged = []
    for entry in filled:
        if merged and merged[-1].status == entry.status and \
           abs(merged[-1].end_hour - entry.start_hour) < 0.01:
            merged[-1] = LogEntry(
                status=entry.status,
                start_hour=merged[-1].start_hour,
                end_hour=entry.end_hour,
                location=merged[-1].location,
                remarks=merged[-1].remarks,
            )
        else:
            merged.append(entry)

    daily_log = DailyLog(
        day=day_number,
        date=day_start.strftime('%Y-%m-%d'),
        entries=merged,
        total_miles=round(miles, 1),
    )

    # Collect unique locations for remarks
    locations = []
    for e in merged:
        if e.location and e.location not in locations:
            locations.append(e.location)
    daily_log.remarks_locations = locations

    daily_logs.append(daily_log)


def _interpolate_location(leg, miles_remaining, total_miles):
    """Get approximate location name based on progress through leg."""
    progress = 1.0 - (miles_remaining / total_miles) if total_miles > 0 else 1.0
    if progress < 0.1:
        return leg['start_location']
    elif progress > 0.9:
        return leg['end_location']
    else:
        return f"En route ({leg['start_location']} → {leg['end_location']})"


def _interpolate_coords(leg, miles_remaining, total_miles):
    """Interpolate coordinates along the leg based on progress."""
    if not leg.get('waypoints') or len(leg['waypoints']) < 2:
        # Fallback to linear interpolation between start and end
        progress = 1.0 - (miles_remaining / total_miles) if total_miles > 0 else 1.0
        start = leg['start_coords']
        end = leg['end_coords']
        return [
            round(start[0] + (end[0] - start[0]) * progress, 6),
            round(start[1] + (end[1] - start[1]) * progress, 6),
        ]

    progress = 1.0 - (miles_remaining / total_miles) if total_miles > 0 else 1.0
    idx = int(progress * (len(leg['waypoints']) - 1))
    idx = min(idx, len(leg['waypoints']) - 1)
    wp = leg['waypoints'][idx]
    return [round(wp[1], 6), round(wp[0], 6)]  # ORS gives [lon, lat], we return [lat, lon]
