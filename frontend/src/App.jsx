import React, { useState } from 'react';
import TripForm from './components/TripForm';
import RouteMap from './components/RouteMap';
import LogSheet from './components/LogSheet';
import StopsList from './components/StopsList';
import Dashboard from './components/Dashboard';
import { planTrip } from './services/api';
import 'leaflet/dist/leaflet.css';

// Usaremos algunos iconos simples de SVG para darle el look profesional
const Icons = {
  Dashboard: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  Map: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m6 13l5.447-2.724A1 1 0 0021 16.382V5.618a1 1 0 00-1.447-.894L15 7m-6 13V7m6 13V7m-6 0l6-2" /></svg>,
  History: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
};

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
      const message = err.response?.data?.error || 'Error de conexión con el servidor logístico.';
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
    <div className="min-h-screen bg-[#020617] text-slate-200 flex">
      
      {/* --- SIDEBAR (Toque Industrial) --- */}
      <aside className="w-20 hidden md:flex flex-col items-center py-8 bg-slate-900/40 border-r border-slate-800/60 sticky top-0 h-screen">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20 mb-10">
           <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        </div>
        <div className="flex flex-col gap-8 text-slate-500">
          <button className="text-blue-500 transition-colors"><Icons.Dashboard /></button>
          <button className="hover:text-white transition-colors"><Icons.Map /></button>
          <button className="hover:text-white transition-colors"><Icons.History /></button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        {/* --- NAVBAR --- */}
        <header className="h-16 border-b border-slate-800/60 bg-slate-900/20 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-white tracking-tight">
              Spotter <span className="text-blue-500">ELD</span>
            </h1>
            <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20 tracking-widest uppercase">
              FMCSA Compliant
            </span>
          </div>
          {tripData && (
            <button onClick={handleReset} className="text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-700 transition-all">
              New Dispatch
            </button>
          )}
        </header>

        {/* --- MAIN CONTENT --- */}
        <main className="p-6 md:p-10 max-w-[1400px] mx-auto w-full">
          {!tripData ? (
            /* ─── INPUT VIEW (Landing Pro) ─── */
            <div className="grid lg:grid-cols-2 gap-12 items-center mt-10">
              <div>
                <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6 text-balance">
                  Next-Gen <span className="text-blue-500">Logistics</span> Compliance.
                </h2>
                <p className="text-slate-400 text-lg mb-8 max-w-md leading-relaxed">
                  Generación automática de rutas y logs ELD bajo regulaciones FMCSA 395. Optimiza tus tiempos de conducción hoy.
                </p>
                <div className="flex gap-4 items-center p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 w-fit">
                   <div className="text-center px-4 border-r border-slate-800">
                      <p className="text-xl font-bold text-white">70h</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Cycle</p>
                   </div>
                   <div className="text-center px-4">
                      <p className="text-xl font-bold text-white">395</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">CFR Part</p>
                   </div>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 p-8 rounded-3xl shadow-2xl backdrop-blur-sm relative">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-600/10 rounded-full blur-3xl"></div>
                <TripForm onSubmit={handleSubmit} isLoading={isLoading} />
              </div>
            </div>
          ) : (
            /* ─── RESULTS VIEW (Dashboard) ─── */
            <div className="space-y-8 animate-in fade-in duration-700">
              
              {/* Dashboard Widgets */}
              <Dashboard tripData={tripData} />

              {/* Tactical View (Map & Stops) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 h-[500px] rounded-3xl overflow-hidden border border-slate-800 shadow-inner bg-slate-900">
                  <RouteMap route={tripData.route} stops={tripData.stops} />
                </div>
                <div className="lg:col-span-4 h-[500px]">
                  <StopsList stops={tripData.stops} />
                </div>
              </div>

              {/* Log Sheets */}
              <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-6">
                   <Icons.History />
                   <h3 className="text-lg font-bold text-white uppercase tracking-wider text-sm">Registro de Bitácoras Diarias</h3>
                </div>
                <LogSheet dailyLogs={tripData.daily_logs} />
              </div>
            </div>
          )}

          {error && (
            <div className="fixed bottom-10 right-10 p-4 rounded-2xl bg-red-950/40 border border-red-500/50 text-red-400 text-sm backdrop-blur-md flex items-center gap-3 animate-in slide-in-from-right-10">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="font-medium">{error}</p>
            </div>
          )}
        </main>

        <footer className="mt-auto py-8 text-center border-t border-slate-800/40">
           <p className="text-[10px] text-slate-600 uppercase tracking-[0.2em]">
             SPOTTER ELD SYSTEM • 2026 • 49 CFR Part 395 COMPLIANT
           </p>
        </footer>
      </div>
    </div>
  );
}