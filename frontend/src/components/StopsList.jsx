import React from 'react';
import { STOP_TYPES } from '../utils/hosConstants';

export default function StopsList({ stops = [] }) {
  if (!stops.length) return null;

  return (
    <div className="h-full flex flex-col bg-slate-900/40 border border-slate-800/60 rounded-3xl overflow-hidden">
      {/* Header fijo */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          Route Stops
        </h2>
        <span className="text-xs font-mono text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
          {stops.length} stops
        </span>
      </div>

      {/* Lista con scroll */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="relative">
          <div className="absolute left-[18px] top-4 bottom-4 w-px bg-gradient-to-b from-emerald-500/50 via-blue-500/50 to-red-500/50" />

          <div className="space-y-1">
            {stops.map((stop, idx) => {
              const config = STOP_TYPES[stop.type] || { label: stop.type, color: '#64748b' };
              const arrivalTime = stop.arrival_time ? formatTime(stop.arrival_time) : '';

              return (
                <div key={idx} className="relative flex items-start gap-3 pl-1 py-1.5 group">
                  <div
                    className="relative z-10 w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 text-[9px] font-bold"
                    style={{
                      borderColor: config.color,
                      backgroundColor: `${config.color}20`,
                      color: config.color,
                    }}
                  >
                    {idx + 1}
                  </div>

                  <div className="flex-1 min-w-0 bg-slate-800/40 rounded-lg px-3 py-2 border border-slate-700/30 group-hover:border-slate-600/50 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0"
                          style={{
                            backgroundColor: `${config.color}20`,
                            color: config.color,
                          }}
                        >
                          {config.label}
                        </span>
                        <span className="text-xs text-slate-300 truncate">
                          {stop.location}
                        </span>
                      </div>
                      {stop.mile_marker > 0 && (
                        <span className="text-[10px] font-mono text-slate-500 flex-shrink-0">
                          mi {Math.round(stop.mile_marker)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                      {arrivalTime && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {arrivalTime}
                        </span>
                      )}
                      {stop.duration_hours > 0 && (
                        <span>{formatDuration(stop.duration_hours)}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(isoString) {
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

function formatDuration(hours) {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}