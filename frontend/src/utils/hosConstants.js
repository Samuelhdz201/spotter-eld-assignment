// FMCSA HOS Constants for display purposes
export const HOS_RULES = {
  MAX_DRIVING_HOURS: 11,
  MAX_DUTY_WINDOW_HOURS: 14,
  MANDATORY_BREAK_AFTER_HOURS: 8,
  MANDATORY_BREAK_DURATION_MINUTES: 30,
  OFF_DUTY_REQUIRED_HOURS: 10,
  MAX_CYCLE_HOURS: 70,
  CYCLE_DAYS: 8,
  FUEL_STOP_INTERVAL_MILES: 1000,
};

// Duty status display config
export const DUTY_STATUS = {
  off_duty: {
    label: 'Off Duty',
    shortLabel: 'OFF',
    color: '#10b981',      // green
    gridRow: 0,
  },
  sleeper_berth: {
    label: 'Sleeper Berth',
    shortLabel: 'SB',
    color: '#8b5cf6',      // purple
    gridRow: 1,
  },
  driving: {
    label: 'Driving',
    shortLabel: 'D',
    color: '#2563eb',      // blue
    gridRow: 2,
  },
  on_duty_not_driving: {
    label: 'On Duty (Not Driving)',
    shortLabel: 'ON',
    color: '#f59e0b',      // amber
    gridRow: 3,
  },
};

// Stop type display config
export const STOP_TYPES = {
  start: { label: 'Start', icon: '🟢', color: '#10b981' },
  pickup: { label: 'Pickup', icon: '📦', color: '#2563eb' },
  dropoff: { label: 'Dropoff', icon: '📍', color: '#ef4444' },
  fuel: { label: 'Fuel Stop', icon: '⛽', color: '#f59e0b' },
  rest_break: { label: 'Rest Break', icon: '☕', color: '#8b5cf6' },
  required_rest: { label: '10h Rest', icon: '🛏️', color: '#6366f1' },
  cycle_rest: { label: '34h Restart', icon: '🔄', color: '#ec4899' },
  end: { label: 'End', icon: '🏁', color: '#ef4444' },
};
