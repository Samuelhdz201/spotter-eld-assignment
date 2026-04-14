import React from 'react';
import LogSheetGrid from './LogSheetGrid';

export default function LogSheet({ dailyLogs = [] }) {
  if (!dailyLogs.length) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Daily Log Sheets
        </h2>
        <span className="text-xs font-mono text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
          {dailyLogs.length} {dailyLogs.length === 1 ? 'day' : 'days'}
        </span>
      </div>

      {dailyLogs.map((log, idx) => (
        <div key={idx} className="space-y-2">
          <LogSheetGrid dailyLog={log} />

          {/* Summary stats below each log */}
          <div className="grid grid-cols-4 gap-2 px-1">
            <StatBadge label="Driving" value={`${(log.totals?.driving || 0).toFixed(1)}h`} color="bg-blue-500/20 text-blue-400" />
            <StatBadge label="On Duty" value={`${(log.totals?.on_duty_not_driving || 0).toFixed(1)}h`} color="bg-amber-500/20 text-amber-400" />
            <StatBadge label="Off Duty" value={`${(log.totals?.off_duty || 0).toFixed(1)}h`} color="bg-emerald-500/20 text-emerald-400" />
            <StatBadge label="Sleeper" value={`${(log.totals?.sleeper_berth || 0).toFixed(1)}h`} color="bg-violet-500/20 text-violet-400" />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatBadge({ label, value, color }) {
  return (
    <div className={`${color} rounded-lg px-3 py-1.5 text-center`}>
      <div className="text-xs opacity-70">{label}</div>
      <div className="text-sm font-mono font-semibold">{value}</div>
    </div>
  );
}
