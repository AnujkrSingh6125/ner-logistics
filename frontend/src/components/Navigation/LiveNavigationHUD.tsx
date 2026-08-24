'use client';

import React from 'react';
import {
  Navigation,
  Compass,
  ShieldAlert,
  ArrowRight,
  CornerUpRight,
  X,
  Play,
  Pause,
  LocateFixed,
  Gauge,
  Clock,
  MapPin,
} from 'lucide-react';
import { RoadDisruption } from '@/types';

export interface ThreatAlertData {
  disruption: RoadDisruption;
  distanceAheadKm: number;
  isDirectBlockage: boolean;
}

interface LiveNavigationHUDProps {
  isNavigating: boolean;
  destinationName: string;
  remainingDistanceKm: number;
  remainingDurationMinutes: number;
  currentSpeedKmh: number | null;
  heading: number | null;
  followMode: boolean;
  isSimulated: boolean;
  threatAlert: ThreatAlertData | null;
  onExitNavigation: () => void;
  onToggleFollowMode: () => void;
  onAcceptDetour: () => void;
  onDismissThreatAlert: () => void;
  onToggleSimulation?: () => void;
}

export default function LiveNavigationHUD({
  isNavigating,
  destinationName,
  remainingDistanceKm,
  remainingDurationMinutes,
  currentSpeedKmh,
  heading,
  followMode,
  isSimulated,
  threatAlert,
  onExitNavigation,
  onToggleFollowMode,
  onAcceptDetour,
  onDismissThreatAlert,
  onToggleSimulation,
}: LiveNavigationHUDProps) {
  if (!isNavigating) return null;

  const hours = Math.floor(remainingDurationMinutes / 60);
  const mins = Math.round(remainingDurationMinutes % 60);
  const timeString = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const now = new Date();
  now.setMinutes(now.getMinutes() + remainingDurationMinutes);
  const etaFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none w-[95%] max-w-2xl select-none space-y-2 animate-in slide-in-from-top-3 duration-300">
      {/* Sleek Top-Center Glass Navigation Card */}
      <div className="pointer-events-auto bg-[#070f1e]/90 backdrop-blur-xl border border-cyan-500/40 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] p-3 text-slate-100 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
        {/* Left: Maneuver Directive & Destination */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 border border-cyan-300/40 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 shrink-0">
            <CornerUpRight className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-extrabold text-cyan-400 uppercase tracking-wider">
                NAVIGATING CORRIDOR
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <h3 className="text-xs sm:text-sm font-black text-white truncate max-w-[200px] sm:max-w-xs">
              Towards {destinationName || 'Strategic Hub'}
            </h3>
          </div>
        </div>

        {/* Middle: Distance, Speed, ETA Telemetry Grid */}
        <div className="flex items-center gap-2 sm:gap-3 bg-slate-950/70 border border-slate-800/90 rounded-xl px-2.5 py-1.5 shrink-0">
          {/* Speed */}
          <div className="text-center pr-2 border-r border-slate-800">
            <div className="text-sm font-black font-mono text-emerald-400">
              {currentSpeedKmh !== null && currentSpeedKmh > 0 ? currentSpeedKmh : 48}
            </div>
            <div className="text-[8px] font-mono text-slate-400 uppercase">km/h</div>
          </div>

          {/* Distance */}
          <div className="text-center pr-2 border-r border-slate-800">
            <div className="text-sm font-black font-mono text-cyan-300">
              {remainingDistanceKm.toFixed(1)}
            </div>
            <div className="text-[8px] font-mono text-slate-400 uppercase">km left</div>
          </div>

          {/* Time & ETA */}
          <div className="text-left">
            <div className="text-xs font-extrabold font-mono text-white flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>{timeString}</span>
            </div>
            <div className="text-[9px] font-mono text-slate-400">
              ETA <span className="text-cyan-300 font-bold">{etaFormatted}</span>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
          {/* Follow Mode Toggle */}
          <button
            onClick={onToggleFollowMode}
            className={`p-1.5 rounded-lg border text-xs transition ${
              followMode
                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title={followMode ? 'Camera Locked to Vehicle' : 'Camera Free (Click to Lock)'}
          >
            <LocateFixed className="w-4 h-4" />
          </button>

          {/* Simulation Toggle */}
          {onToggleSimulation && (
            <button
              onClick={onToggleSimulation}
              className={`p-1.5 rounded-lg border text-xs transition ${
                isSimulated
                  ? 'bg-purple-950/80 border-purple-500 text-purple-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title="Simulate Convoy Motion"
            >
              {isSimulated ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          )}

          {/* Exit Navigation */}
          <button
            onClick={onExitNavigation}
            className="p-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-500 border border-rose-400/50 text-white transition shadow-md"
            title="Exit Live Navigation Mode"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Real-time Threat Radar Interception Banner (Compact Military Pill) */}
      {threatAlert && (
        <div className="pointer-events-auto bg-gradient-to-r from-red-950/95 via-rose-950/95 to-amber-950/95 border-2 border-red-500 rounded-2xl p-3 shadow-2xl backdrop-blur-xl text-white animate-pulse animate-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-red-600/30 border border-red-400 flex items-center justify-center text-red-300 shrink-0 mt-0.5">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-black text-red-300 uppercase tracking-wider">
                    ⚠️ Threat Intercepted ({threatAlert.distanceAheadKm.toFixed(1)} km)
                  </span>
                  <span className="text-[9px] bg-red-900 text-red-200 font-bold px-1 rounded font-mono">
                    {threatAlert.disruption.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-bold truncate">
                  {threatAlert.disruption.title}
                </p>
                <p className="text-[10px] text-amber-200/90 italic truncate">
                  "{threatAlert.disruption.message || threatAlert.disruption.description}"
                </p>
              </div>
            </div>

            <button
              onClick={onDismissThreatAlert}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-2 pt-2 border-t border-red-800/60 flex items-center justify-end">
            <button
              onClick={onAcceptDetour}
              className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-bold text-xs shadow-lg transition flex items-center gap-1.5"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Activate Disaster-Resilient Detour</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
