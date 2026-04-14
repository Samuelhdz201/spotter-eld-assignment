import React, { useState } from 'react';
import TripForm from './components/TripForm';
import RouteMap from './components/RouteMap';
import LogSheet from './components/LogSheet';
import StopsList from './components/StopsList';
import Dashboard from './components/Dashboard';
import { planTrip } from './services/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function App() {
  const [tripData, setTripData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (formData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await planTrip(formData);
      setTripData(result);
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(', ')
          : 'Failed to generate trip plan. Please check your inputs and try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setTripData(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-spotter-dark">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">
                Spotter <span className="text-blue-400">ELD</span>
              </h1>
              <p className="text-[10px] text-slate-500 -mt-0.5">Trip Planner & Log Generator</p>
            </div>
          </div>

          {tripData && (
            <button
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg
                border border-slate-700/50 hover:border-slate-600 transition-all"
            >
              New Trip
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {!tripData ? (
          /* ─── INPUT VIEW ─── */
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                Plan Your Trip
              </h2>
              <p className="text-sm text-slate-400">
                Enter your trip details and we'll generate a compliant route
                with ELD daily log sheets.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <TripForm onSubmit={handleSubmit} isLoading={isLoading} />
            </div>

            {error && (
              <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* HOS info footer */}
            <div className="mt-8 text-center">
              <p className="text-xs text-slate-600">
                Compliant with FMCSA Hours of Service regulations (49 CFR Part 395)
              </p>
              <p className="text-xs text-slate-700 mt-1">
                Property-carrying CMV driver • 70hr/8-day cycle • No adverse conditions
              </p>
            </div>
          </div>
        ) : (
          /* ─── RESULTS VIEW ─── */
          <div className="space-y-8">
            {/* Dashboard */}
            <Dashboard tripData={tripData} />

            {/* Map + Stops side by side on larger screens */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3">
                <RouteMap route={tripData.route} stops={tripData.stops} />
              </div>
              <div className="lg:col-span-2">
                <StopsList stops={tripData.stops} />
              </div>
            </div>

            {/* Daily Log Sheets */}
            <LogSheet dailyLogs={tripData.daily_logs} />

            {/* Compliance footer */}
            <div className="text-center py-4 border-t border-slate-800">
              <p className="text-xs text-slate-600">
                Generated per FMCSA HOS regulations (49 CFR Part 395) •
                Property-carrying driver • 70hr/8-day cycle
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
