import React, { useState } from 'react';
import { HOS_RULES } from '../utils/hosConstants';

export default function TripForm({ onSubmit, isLoading }) {
  const [form, setForm] = useState({
    currentLocation: '',
    pickupLocation: '',
    dropoffLocation: '',
    currentCycleUsed: '0',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.currentLocation.trim()) errs.currentLocation = 'Required';
    if (!form.pickupLocation.trim()) errs.pickupLocation = 'Required';
    if (!form.dropoffLocation.trim()) errs.dropoffLocation = 'Required';

    const cycle = parseFloat(form.currentCycleUsed);
    if (isNaN(cycle) || cycle < 0) errs.currentCycleUsed = 'Must be 0 or more';
    if (cycle >= 70) errs.currentCycleUsed = 'Must be less than 70 (need 34h restart)';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(form);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-white">Trip Details</h2>
      </div>

      <InputField
        label="Current Location"
        placeholder="e.g., Dallas, TX"
        value={form.currentLocation}
        onChange={(v) => handleChange('currentLocation', v)}
        error={errors.currentLocation}
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" strokeWidth={2} />
            <path strokeLinecap="round" strokeWidth={2} d="M12 2v4m0 12v4m10-10h-4M6 12H2" />
          </svg>
        }
      />

      <InputField
        label="Pickup Location"
        placeholder="e.g., Oklahoma City, OK"
        value={form.pickupLocation}
        onChange={(v) => handleChange('pickupLocation', v)}
        error={errors.pickupLocation}
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        }
      />

      <InputField
        label="Dropoff Location"
        placeholder="e.g., Denver, CO"
        value={form.dropoffLocation}
        onChange={(v) => handleChange('dropoffLocation', v)}
        error={errors.dropoffLocation}
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
      />

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Current Cycle Used (Hours)
        </label>
        <div className="relative">
          <input
            type="range"
            min="0"
            max="69"
            step="0.5"
            value={form.currentCycleUsed}
            onChange={(e) => handleChange('currentCycleUsed', e.target.value)}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-slate-500">0h</span>
            <span className="text-sm font-mono font-semibold text-amber-400">
              {parseFloat(form.currentCycleUsed).toFixed(1)}h / {HOS_RULES.MAX_CYCLE_HOURS}h
            </span>
            <span className="text-xs text-slate-500">70h</span>
          </div>
          {/* Visual cycle bar */}
          <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(parseFloat(form.currentCycleUsed) / HOS_RULES.MAX_CYCLE_HOURS) * 100}%`,
                background: parseFloat(form.currentCycleUsed) > 55
                  ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                  : 'linear-gradient(90deg, #2563eb, #3b82f6)',
              }}
            />
          </div>
        </div>
        {errors.currentCycleUsed && (
          <p className="text-xs text-red-400 mt-1">{errors.currentCycleUsed}</p>
        )}
      </div>

      {/* HOS Rules summary */}
      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
        <div className="text-xs font-medium text-slate-400 mb-2">HOS Rules Applied</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500">
          <span>Max driving: <span className="text-slate-300">11h</span></span>
          <span>Duty window: <span className="text-slate-300">14h</span></span>
          <span>Break after: <span className="text-slate-300">8h driving</span></span>
          <span>Off-duty: <span className="text-slate-300">10h min</span></span>
          <span>Cycle: <span className="text-slate-300">70h/8 days</span></span>
          <span>Fuel every: <span className="text-slate-300">1,000 mi</span></span>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200
          bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400
          disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed
          shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40
          active:scale-[0.98]"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Calculating Route & Logs...
          </span>
        ) : (
          'Generate Trip Plan'
        )}
      </button>
    </form>
  );
}

function InputField({ label, placeholder, value, onChange, error, icon }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
          {icon}
        </div>
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border text-white
            placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition-all
            ${error
              ? 'border-red-500/50 focus:ring-red-500/30'
              : 'border-slate-700/50 focus:ring-blue-500/30 focus:border-blue-500/50'
            }`}
        />
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
