import React, { useMemo } from 'react';
import { DUTY_STATUS } from '../utils/hosConstants';

/**
 * LogSheetGrid — Renders an FMCSA-compliant daily log graph grid.
 *
 * This is the core visual component that replicates the official
 * Driver's Daily Log format from 49 CFR Part 395.
 *
 * The grid shows 24 hours (midnight to midnight) with 4 duty status rows:
 *   Row 1: Off Duty
 *   Row 2: Sleeper Berth
 *   Row 3: Driving
 *   Row 4: On Duty (Not Driving)
 *
 * Each hour is divided into 4 quarter-hour segments (15-min increments).
 * Duty status lines are drawn as horizontal bars with vertical transitions.
 */

const GRID = {
  // Layout dimensions
  marginLeft: 140,
  marginTop: 50,
  marginRight: 20,
  marginBottom: 30,
  rowHeight: 32,
  rowCount: 4,
  hourCount: 24,

  // Colors
  gridLine: '#334155',
  gridLineMajor: '#475569',
  gridLineMinor: '#1e293b',
  textColor: '#94a3b8',
  textColorLight: '#cbd5e1',
  bgColor: '#0f172a',
  headerBg: '#1e293b',

  // Line drawing
  dutyLineWidth: 3,
  transitionLineWidth: 2,
};

// Computed dimensions
const GRID_WIDTH_CALC = 680 - GRID.marginLeft - GRID.marginRight;
const GRID_HEIGHT = GRID.rowHeight * GRID.rowCount;
const HOUR_WIDTH = GRID_WIDTH_CALC / GRID.hourCount;

const STATUS_TO_ROW = {
  off_duty: 0,
  sleeper_berth: 1,
  driving: 2,
  on_duty_not_driving: 3,
};

export default function LogSheetGrid({ dailyLog, dayInfo = {} }) {
  const { entries = [], totals = {}, date, day, total_miles = 0, remarks_locations = [] } = dailyLog || {};

  // Build the drawn path segments from log entries
  const pathSegments = useMemo(() => {
    if (!entries.length) return [];

    const segments = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const row = STATUS_TO_ROW[entry.status];
      if (row === undefined) continue;

      const x1 = GRID.marginLeft + (entry.start_hour / 24) * GRID_WIDTH_CALC;
      const x2 = GRID.marginLeft + (entry.end_hour / 24) * GRID_WIDTH_CALC;
      const y = GRID.marginTop + row * GRID.rowHeight + GRID.rowHeight / 2;

      // Horizontal duty line
      segments.push({
        type: 'duty',
        x1, x2, y,
        status: entry.status,
        color: DUTY_STATUS[entry.status]?.color || '#64748b',
      });

      // Vertical transition line to next entry
      if (i < entries.length - 1) {
        const nextEntry = entries[i + 1];
        const nextRow = STATUS_TO_ROW[nextEntry.status];
        if (nextRow !== undefined && nextRow !== row) {
          const nextY = GRID.marginTop + nextRow * GRID.rowHeight + GRID.rowHeight / 2;
          segments.push({
            type: 'transition',
            x1: x2, x2: x2,
            y1: y, y2: nextY,
            color: DUTY_STATUS[nextEntry.status]?.color || '#64748b',
          });
        }
      }
    }

    return segments;
  }, [entries]);

  const svgWidth = 720;
  const svgHeight = GRID.marginTop + GRID_HEIGHT + GRID.marginBottom + 120; // extra for remarks

  return (
    <div className="bg-[#0d1117] rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header bar */}
      <div className="bg-slate-800/80 px-4 py-2 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400">DRIVER'S DAILY LOG</span>
          <span className="text-xs text-slate-500">|</span>
          <span className="text-xs font-mono text-amber-400">Day {day}</span>
          <span className="text-xs text-slate-500">|</span>
          <span className="text-xs font-mono text-slate-300">{date}</span>
        </div>
        <div className="text-xs font-mono text-slate-400">
          {total_miles > 0 && <span>{Math.round(total_miles)} miles</span>}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        width="100%"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        {/* Background */}
        <rect width={svgWidth} height={svgHeight} fill={GRID.bgColor} />

        {/* Row labels (duty statuses) */}
        {Object.entries(DUTY_STATUS).map(([key, status], idx) => {
          const y = GRID.marginTop + idx * GRID.rowHeight + GRID.rowHeight / 2;
          return (
            <g key={key}>
              {/* Row background alternating */}
              <rect
                x={GRID.marginLeft}
                y={GRID.marginTop + idx * GRID.rowHeight}
                width={GRID_WIDTH_CALC}
                height={GRID.rowHeight}
                fill={idx % 2 === 0 ? 'rgba(30,41,59,0.3)' : 'rgba(15,23,42,0.3)'}
              />
              {/* Row number */}
              <text
                x={12}
                y={y}
                fill={GRID.textColor}
                fontSize="10"
                fontFamily="'JetBrains Mono', monospace"
                dominantBaseline="central"
              >
                {idx + 1}.
              </text>
              {/* Status label */}
              <text
                x={24}
                y={y}
                fill={status.color}
                fontSize="10"
                fontWeight="500"
                fontFamily="'Inter', sans-serif"
                dominantBaseline="central"
              >
                {status.label}
              </text>
            </g>
          );
        })}

        {/* Hour markers and grid lines */}
        {Array.from({ length: GRID.hourCount + 1 }, (_, i) => {
          const x = GRID.marginLeft + (i / GRID.hourCount) * GRID_WIDTH_CALC;
          const isMajor = i % 4 === 0;
          const isNoon = i === 12;

          return (
            <g key={`h-${i}`}>
              {/* Vertical grid line */}
              <line
                x1={x} y1={GRID.marginTop}
                x2={x} y2={GRID.marginTop + GRID_HEIGHT}
                stroke={isMajor ? GRID.gridLineMajor : GRID.gridLine}
                strokeWidth={isMajor ? 0.8 : 0.3}
                opacity={isMajor ? 0.8 : 0.4}
              />
              {/* Hour label at top */}
              <text
                x={x}
                y={GRID.marginTop - 8}
                fill={isNoon ? '#f59e0b' : isMajor ? GRID.textColorLight : GRID.textColor}
                fontSize={isMajor ? "10" : "8"}
                fontWeight={isMajor ? "500" : "400"}
                fontFamily="'JetBrains Mono', monospace"
                textAnchor="middle"
              >
                {i === 0 ? 'Mid' : i === 12 ? 'Noon' : i > 12 ? i : i}
              </text>

              {/* 15-minute tick marks within each hour */}
              {i < GRID.hourCount && [1, 2, 3].map(q => {
                const qx = x + (q / 4) * HOUR_WIDTH;
                return (
                  <line
                    key={`q-${i}-${q}`}
                    x1={qx} y1={GRID.marginTop}
                    x2={qx} y2={GRID.marginTop + GRID_HEIGHT}
                    stroke={GRID.gridLineMinor}
                    strokeWidth={0.3}
                    opacity={0.3}
                  />
                );
              })}
            </g>
          );
        })}

        {/* Horizontal row dividers */}
        {Array.from({ length: GRID.rowCount + 1 }, (_, i) => {
          const y = GRID.marginTop + i * GRID.rowHeight;
          return (
            <line
              key={`row-${i}`}
              x1={GRID.marginLeft} y1={y}
              x2={GRID.marginLeft + GRID_WIDTH_CALC} y2={y}
              stroke={GRID.gridLineMajor}
              strokeWidth={i === 0 || i === GRID.rowCount ? 1 : 0.5}
              opacity={0.6}
            />
          );
        })}

        {/* ═══ DRAWN DUTY STATUS LINES ═══ */}
        {pathSegments.map((seg, idx) => {
          if (seg.type === 'duty') {
            return (
              <line
                key={`duty-${idx}`}
                x1={seg.x1} y1={seg.y}
                x2={seg.x2} y2={seg.y}
                stroke={seg.color}
                strokeWidth={GRID.dutyLineWidth}
                strokeLinecap="round"
                className="log-grid-line"
                opacity={0.9}
              />
            );
          }
          if (seg.type === 'transition') {
            return (
              <line
                key={`trans-${idx}`}
                x1={seg.x1} y1={seg.y1}
                x2={seg.x2} y2={seg.y2}
                stroke={seg.color}
                strokeWidth={GRID.transitionLineWidth}
                strokeLinecap="round"
                opacity={0.7}
              />
            );
          }
          return null;
        })}

        {/* Grid border */}
        <rect
          x={GRID.marginLeft}
          y={GRID.marginTop}
          width={GRID_WIDTH_CALC}
          height={GRID_HEIGHT}
          fill="none"
          stroke={GRID.gridLineMajor}
          strokeWidth={1}
          opacity={0.6}
          rx={2}
        />

        {/* ═══ TOTALS (right side) ═══ */}
        <text
          x={svgWidth - 10}
          y={GRID.marginTop - 8}
          fill={GRID.textColor}
          fontSize="9"
          fontFamily="'JetBrains Mono', monospace"
          textAnchor="end"
          fontWeight="500"
        >
          TOTAL
        </text>
        {Object.entries(DUTY_STATUS).map(([key, status], idx) => {
          const y = GRID.marginTop + idx * GRID.rowHeight + GRID.rowHeight / 2;
          const hours = totals[key] || 0;
          return (
            <text
              key={`total-${key}`}
              x={svgWidth - 10}
              y={y}
              fill={status.color}
              fontSize="11"
              fontWeight="600"
              fontFamily="'JetBrains Mono', monospace"
              textAnchor="end"
              dominantBaseline="central"
            >
              {hours.toFixed(1)}h
            </text>
          );
        })}

        {/* ═══ REMARKS SECTION ═══ */}
        <text
          x={GRID.marginLeft}
          y={GRID.marginTop + GRID_HEIGHT + 20}
          fill={GRID.textColorLight}
          fontSize="10"
          fontWeight="500"
          fontFamily="'Inter', sans-serif"
        >
          REMARKS
        </text>
        <line
          x1={GRID.marginLeft}
          y1={GRID.marginTop + GRID_HEIGHT + 26}
          x2={GRID.marginLeft + GRID_WIDTH_CALC}
          y2={GRID.marginTop + GRID_HEIGHT + 26}
          stroke={GRID.gridLine}
          strokeWidth={0.5}
        />
        {remarks_locations.slice(0, 5).map((loc, idx) => (
          <text
            key={`rem-${idx}`}
            x={GRID.marginLeft + 8}
            y={GRID.marginTop + GRID_HEIGHT + 42 + idx * 16}
            fill={GRID.textColor}
            fontSize="9"
            fontFamily="'Inter', sans-serif"
          >
            {loc}
          </text>
        ))}

        {/* 24-hour total verification */}
        {totals && (
          <text
            x={svgWidth - 10}
            y={GRID.marginTop + GRID_HEIGHT + 20}
            fill={
              Math.abs(
                (totals.off_duty || 0) +
                (totals.sleeper_berth || 0) +
                (totals.driving || 0) +
                (totals.on_duty_not_driving || 0) -
                24
              ) < 0.1
                ? '#10b981'
                : '#ef4444'
            }
            fontSize="10"
            fontWeight="600"
            fontFamily="'JetBrains Mono', monospace"
            textAnchor="end"
          >
            = {(
              (totals.off_duty || 0) +
              (totals.sleeper_berth || 0) +
              (totals.driving || 0) +
              (totals.on_duty_not_driving || 0)
            ).toFixed(1)}h / 24h
          </text>
        )}
      </svg>
    </div>
  );
}
