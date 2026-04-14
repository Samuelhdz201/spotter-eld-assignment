import React from 'react';
import { HOS_RULES } from '../utils/hosConstants';

export default function Dashboard({ tripData }) {
  if (!tripData) return null;

  const { trip, daily_logs = [], stops = [] } = tripData;

  // Calculate aggregate stats
  const totalDriving = daily_logs.reduce((sum, log) => sum + (log.totals?.driving || 0), 0);
  const totalOnDuty = daily_logs.reduce(
    (sum, log) => sum + (log.totals?.driving || 0) + (log.totals?.on_duty_not_driving || 0), 0
  );
  const cycleAfterTrip = (trip?.current_cycle_used || 0) + totalOnDuty;
  const cycleRemaining = Math.max(0, HOS_RULES.MAX_CYCLE_HOURS - cycleAfterTrip);

  const fuelStops = stops.filter(s => s.type === 'fuel').length;
  const restStops = stops.filter(s => s.type === 'required_rest' || s.type === 'rest_break').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h2 className="text-lg font-semibold text-white">Trip Summary</h2>
      </div>

      {/* Main stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Distance"
          value={`${Math.round(trip?.total_distance_miles || 0)}`}
          unit="miles"
          gradient="from-blue-500/20 to-blue-600/10"
          textColor="text-blue-400"
        />
        <StatCard
          label="Driving Time"
          value={totalDriving.toFixed(1)}
          unit="hours"
          gradient="from-amber-500/20 to-amber-600/10"
          textColor="text-amber-400"
        />
        <StatCard
          label="Trip Duration"
          value={`${trip?.total_trip_days || 0}`}
          unit={trip?.total_trip_days === 1 ? 'day' : 'days'}
          gradient="from-violet-500/20 to-violet-600/10"
          textColor="text-violet-400"
        />
        <StatCard
          label="Total Stops"
          value={`${stops.length}`}
          unit="stops"
          gradient="from-emerald-500/20 to-emerald-600/10"
          textColor="text-emerald-400"
        />
      </div>

      {/* 70-Hour Cycle gauge */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">70-Hour Cycle Status</span>
          <span className="text-xs font-mono text-slate-400">
            {cycleAfterTrip.toFixed(1)}h / {HOS_RULES.MAX_CYCLE_HOURS}h used after trip
          </span>
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          {/* Before trip portion */}
          <div className="h-full flex">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${((trip?.current_cycle_used || 0) / HOS_RULES.MAX_CYCLE_HOURS) * 100}%`,
                background: '#475569',
              }}
            />
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${(totalOnDuty / HOS_RULES.MAX_CYCLE_HOURS) * 100}%`,
                background: cycleAfterTrip > 60
                  ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                  : 'linear-gradient(90deg, #2563eb, #3b82f6)',
              }}
            />
          </div>
        </div>
        <div className="flex justify-between mt-1.5 text-xs">
          <span className="text-slate-500">
            Before: {(trip?.current_cycle_used || 0).toFixed(1)}h
          </span>
          <span className={cycleRemaining < 10 ? 'text-red-400 font-semibold' : 'text-emerald-400'}>
            Remaining: {cycleRemaining.toFixed(1)}h
          </span>
        </div>
      </div>

      {/* Stop breakdown */}
      <div className="grid grid-cols-3 gap-2">
        <MiniStat icon="⛽" label="Fuel Stops" value={fuelStops} color="text-amber-400" />
        <MiniStat icon="🛏️" label="Rest Stops" value={restStops} color="text-violet-400" />
        <MiniStat icon="📋" label="Log Sheets" value={daily_logs.length} color="text-blue-400" />
      </div>

      {/* Route legs */}
      {trip && (
        <div className="glass-card rounded-xl p-4">
          <div className="text-sm font-medium text-slate-300 mb-3">Route</div>
          <div className="flex items-center gap-2 text-sm">
            <LocationBadge label={trip.current_location} color="bg-emerald-500/20 text-emerald-400" />
            <Arrow />
            <LocationBadge label={trip.pickup_location} color="bg-blue-500/20 text-blue-400" />
            <Arrow />
            <LocationBadge label={trip.dropoff_location} color="bg-red-500/20 text-red-400" />
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, unit, gradient, textColor }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl p-3 border border-slate-700/30`}>
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className={`text-xl font-bold font-mono ${textColor}`}>{value}</span>
        <span className="text-xs text-slate-500">{unit}</span>
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value, color }) {
  return (
    <div className="glass-card rounded-lg p-2.5 text-center">
      <div className="text-lg mb-0.5">{icon}</div>
      <div className={`text-base font-bold font-mono ${color}`}>{value}</div>
      <div className="text-[10px] text-slate-500">{label}</div>
    </div>
  );
}

function LocationBadge({ label, color }) {
  return (
    <span className={`${color} text-xs px-2 py-1 rounded-md truncate max-w-[140px]`}>
      {label}
    </span>
  );
}

function Arrow() {
  return (
    <svg className="w-4 h-4 text-slate-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
