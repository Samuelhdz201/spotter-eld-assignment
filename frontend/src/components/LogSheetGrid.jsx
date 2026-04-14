import React, { useMemo } from 'react';
import { DUTY_STATUS } from '../utils/hosConstants';

const GRID = {
  marginLeft: 160,
  marginTop: 50,
  marginRight: 70,
  marginBottom: 30,
  rowHeight: 36,
  rowCount: 4,
  hourCount: 24,
  gridLine: '#334155',
  gridLineMajor: '#475569',
  gridLineMinor: '#1e293b',
  textColor: '#94a3b8',
  textColorLight: '#cbd5e1',
  bgColor: '#0f172a',
  dutyLineWidth: 3,
  transitionLineWidth: 2,
};

const SVG_WIDTH = 900;
const GRID_WIDTH = SVG_WIDTH - GRID.marginLeft - GRID.marginRight;
const GRID_HEIGHT = GRID.rowHeight * GRID.rowCount;
const HOUR_WIDTH = GRID_WIDTH / GRID.hourCount;

const STATUS_TO_ROW = {
  off_duty: 0,
  sleeper_berth: 1,
  driving: 2,
  on_duty_not_driving: 3,
};

export default function LogSheetGrid({ dailyLog }) {
  const { entries = [], totals = {}, date, day, total_miles = 0, remarks_locations = [] } = dailyLog || {};

  const pathSegments = useMemo(() => {
    if (!entries.length) return [];
    const segments = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const row = STATUS_TO_ROW[entry.status];
      if (row === undefined) continue;

      const x1 = GRID.marginLeft + (entry.start_hour / 24) * GRID_WIDTH;
      const x2 = GRID.marginLeft + (entry.end_hour / 24) * GRID_WIDTH;
      const y = GRID.marginTop + row * GRID.rowHeight + GRID.rowHeight / 2;

      segments.push({ type: 'duty', x1, x2, y, status: entry.status, color: DUTY_STATUS[entry.status]?.color || '#64748b' });

      if (i < entries.length - 1) {
        const nextEntry = entries[i + 1];
        const nextRow = STATUS_TO_ROW[nextEntry.status];
        if (nextRow !== undefined && nextRow !== row) {
          const nextY = GRID.marginTop + nextRow * GRID.rowHeight + GRID.rowHeight / 2;
          segments.push({ type: 'transition', x1: x2, x2: x2, y1: y, y2: nextY, color: DUTY_STATUS[nextEntry.status]?.color || '#64748b' });
        }
      }
    }
    return segments;
  }, [entries]);

  const svgHeight = GRID.marginTop + GRID_HEIGHT + GRID.marginBottom + 110;

  return (
    <div className="bg-[#0d1117] rounded-2xl border border-slate-700/50 overflow-hidden">
      <div className="bg-slate-800/80 px-5 py-3 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400">DRIVER'S DAILY LOG</span>
          <span className="text-xs text-slate-600">|</span>
          <span className="text-xs font-mono text-amber-400">Day {day}</span>
          <span className="text-xs text-slate-600">|</span>
          <span className="text-xs font-mono text-slate-300">{date}</span>
        </div>
        <div className="text-xs font-mono text-slate-400">
          {total_miles > 0 && <span>{Math.round(total_miles)} miles</span>}
        </div>
      </div>

      <svg viewBox={`0 0 ${SVG_WIDTH} ${svgHeight}`} width="100%" style={{ display: 'block' }}>
        <rect width={SVG_WIDTH} height={svgHeight} fill={GRID.bgColor} />

        {/* Row labels */}
        {Object.entries(DUTY_STATUS).map(([key, status], idx) => {
          const y = GRID.marginTop + idx * GRID.rowHeight + GRID.rowHeight / 2;
          return (
            <g key={key}>
              <rect x={GRID.marginLeft} y={GRID.marginTop + idx * GRID.rowHeight} width={GRID_WIDTH} height={GRID.rowHeight} fill={idx % 2 === 0 ? 'rgba(30,41,59,0.3)' : 'rgba(15,23,42,0.3)'} />
              <text x={12} y={y} fill={GRID.textColor} fontSize="11" fontFamily="'JetBrains Mono', monospace" dominantBaseline="central">{idx + 1}.</text>
              <text x={28} y={y} fill={status.color} fontSize="11" fontWeight="500" fontFamily="'Inter', sans-serif" dominantBaseline="central">{status.label}</text>
            </g>
          );
        })}

        {/* Hour markers */}
        {Array.from({ length: GRID.hourCount + 1 }, (_, i) => {
          const x = GRID.marginLeft + (i / GRID.hourCount) * GRID_WIDTH;
          const isMajor = i % 4 === 0;
          const isNoon = i === 12;
          return (
            <g key={`h-${i}`}>
              <line x1={x} y1={GRID.marginTop} x2={x} y2={GRID.marginTop + GRID_HEIGHT} stroke={isMajor ? GRID.gridLineMajor : GRID.gridLine} strokeWidth={isMajor ? 0.8 : 0.3} opacity={isMajor ? 0.8 : 0.4} />
              <text x={x} y={GRID.marginTop - 10} fill={isNoon ? '#f59e0b' : isMajor ? GRID.textColorLight : GRID.textColor} fontSize={isMajor ? '11' : '9'} fontWeight={isMajor ? '500' : '400'} fontFamily="'JetBrains Mono', monospace" textAnchor="middle">
                {i === 0 ? 'Mid' : i === 12 ? 'Noon' : i}
              </text>
              {i < GRID.hourCount && [1, 2, 3].map(q => (
                <line key={`q-${i}-${q}`} x1={x + (q / 4) * HOUR_WIDTH} y1={GRID.marginTop} x2={x + (q / 4) * HOUR_WIDTH} y2={GRID.marginTop + GRID_HEIGHT} stroke={GRID.gridLineMinor} strokeWidth={0.3} opacity={0.3} />
              ))}
            </g>
          );
        })}

        {/* Row dividers */}
        {Array.from({ length: GRID.rowCount + 1 }, (_, i) => (
          <line key={`row-${i}`} x1={GRID.marginLeft} y1={GRID.marginTop + i * GRID.rowHeight} x2={GRID.marginLeft + GRID_WIDTH} y2={GRID.marginTop + i * GRID.rowHeight} stroke={GRID.gridLineMajor} strokeWidth={i === 0 || i === GRID.rowCount ? 1 : 0.5} opacity={0.6} />
        ))}

        {/* Duty lines */}
        {pathSegments.map((seg, idx) =>
          seg.type === 'duty' ? (
            <line key={`d-${idx}`} x1={seg.x1} y1={seg.y} x2={seg.x2} y2={seg.y} stroke={seg.color} strokeWidth={GRID.dutyLineWidth} strokeLinecap="round" opacity={0.9} />
          ) : seg.type === 'transition' ? (
            <line key={`t-${idx}`} x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2} stroke={seg.color} strokeWidth={GRID.transitionLineWidth} strokeLinecap="round" opacity={0.7} />
          ) : null
        )}

        {/* Grid border */}
        <rect x={GRID.marginLeft} y={GRID.marginTop} width={GRID_WIDTH} height={GRID_HEIGHT} fill="none" stroke={GRID.gridLineMajor} strokeWidth={1} opacity={0.6} rx={2} />

        {/* Totals */}
        <text x={SVG_WIDTH - 8} y={GRID.marginTop - 10} fill={GRID.textColor} fontSize="10" fontFamily="'JetBrains Mono', monospace" textAnchor="end" fontWeight="500">TOTAL</text>
        {Object.entries(DUTY_STATUS).map(([key, status], idx) => (
          <text key={`tot-${key}`} x={SVG_WIDTH - 8} y={GRID.marginTop + idx * GRID.rowHeight + GRID.rowHeight / 2} fill={status.color} fontSize="12" fontWeight="600" fontFamily="'JetBrains Mono', monospace" textAnchor="end" dominantBaseline="central">
            {(totals[key] || 0).toFixed(1)}h
          </text>
        ))}

        {/* Remarks */}
        <text x={GRID.marginLeft} y={GRID.marginTop + GRID_HEIGHT + 22} fill={GRID.textColorLight} fontSize="11" fontWeight="600" fontFamily="'Inter', sans-serif">REMARKS</text>
        <line x1={GRID.marginLeft} y1={GRID.marginTop + GRID_HEIGHT + 28} x2={GRID.marginLeft + GRID_WIDTH} y2={GRID.marginTop + GRID_HEIGHT + 28} stroke={GRID.gridLine} strokeWidth={0.5} />
        {remarks_locations.slice(0, 4).map((loc, idx) => (
          <text key={`r-${idx}`} x={GRID.marginLeft + 8} y={GRID.marginTop + GRID_HEIGHT + 46 + idx * 18} fill={GRID.textColor} fontSize="10" fontFamily="'Inter', sans-serif">{loc}</text>
        ))}

        {/* 24h verification */}
        <text x={SVG_WIDTH - 8} y={GRID.marginTop + GRID_HEIGHT + 22} fill={Math.abs((totals.off_duty || 0) + (totals.sleeper_berth || 0) + (totals.driving || 0) + (totals.on_duty_not_driving || 0) - 24) < 0.1 ? '#10b981' : '#ef4444'} fontSize="11" fontWeight="600" fontFamily="'JetBrains Mono', monospace" textAnchor="end">
          = {((totals.off_duty || 0) + (totals.sleeper_berth || 0) + (totals.driving || 0) + (totals.on_duty_not_driving || 0)).toFixed(1)}h / 24h
        </text>
      </svg>
    </div>
  );
}