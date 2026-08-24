'use client';

import React from 'react';
import {
  Navigation,
  CornerUpRight,
  X,
  Play,
  Pause,
  LocateFixed,
  Clock,
  ShieldAlert,
  ArrowRight,
  Gauge,
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
    <div className="absolute top-2 sm:top-4 inset-x-2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-[1000] pointer-events-none w-auto max-w-full sm:max-w-xl select-none flex flex-col items-center gap-2 animate-in slide-in-from-top-3 duration-300">
      {/* Driver-Grade Glanceable Floating Pill */}
      <div className="w-full pointer-events-auto backdrop-blur-2xl bg-slate-950/95 border border-slate-700/80 rounded-2xl sm:rounded-full px-3.5 sm:px-5 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.7)] flex items-center justify-between gap-2.5 text-slate-100">
        {/* Maneuver Icon */}
        <div className="w-10 h-10 rounded-xl sm:rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 border border-cyan-300/40 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 shrink-0">
          <CornerUpRight className="w-5 h-5 stroke-[2.5]" />
        </div>

        {/* Destination & Guidance Directive */}
        <div className="min-w-0 flex-1 pr-1.5 border-r border-slate-800">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] font-mono font-black text-cyan-400 uppercase tracking-wider">
              GUIDANCE ACTIVE
            </span>
          </div>
          <h3 className="text-xs sm:text-sm font-black text-white truncate max-w-[130px] sm:max-w-[200px] mt-0.5">
            {destinationName || 'Strategic Hub'}
          </h3>
        </div>

        {/* Distance, Speed & ETA Telemetry */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 font-mono">
          {/* Speed */}
          <div className="text-center pr-1.5 sm:pr-2 border-r border-slate-800 hidden xs:block">
            <div className="text-xs sm:text-sm font-black text-emerald-400 leading-none">
              {currentSpeedKmh !== null && currentSpeedKmh > 0 ? currentSpeedKmh : 48}
            </div>
            <span className="text-[8px] text-slate-400 uppercase">km/h</span>
          </div>

          {/* Distance */}
          <div className="text-center pr-1.5 sm:pr-2 border-r border-slate-800">
            <div className="text-xs sm:text-sm font-black text-cyan-300 leading-none">
              {remainingDistanceKm.toFixed(1)}
            </div>
            <span className="text-[8px] text-slate-400 uppercase">km</span>
          </div>

          {/* ETA */}
          <div className="text-left">
            <div className="flex items-center gap-1 text-xs sm:text-sm font-black text-white leading-none">
              <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>{timeString}</span>
            </div>
            <span className="text-[8px] text-slate-400 font-mono">ETA {etaFormatted}</span>
          </div>
        </div>

        {/* Driver Quick Action Controls (Min 44px touch targets) */}
        <div className="flex items-center gap-1 shrink-0 pl-1 border-l border-slate-800">
          <button
            type="button"
            onClick={onToggleFollowMode}
            className={`min-h-[40px] min-w-[40px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center rounded-xl border transition ${
              followMode
                ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/20'
                : 'bg-slate-850 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title={followMode ? 'Camera Centered on Vehicle' : 'Camera Free (Click to Lock)'}
            aria-label="Toggle Camera Follow"
          >
            <LocateFixed className="w-4 h-4" />
          </button>

          {onToggleSimulation && (
            <button
              type="button"
              onClick={onToggleSimulation}
              className={`min-h-[40px] min-w-[40px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center rounded-xl border transition ${
                isSimulated
                  ? 'bg-purple-950 border-purple-500 text-purple-300'
                  : 'bg-slate-850 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title="Toggle Motion Simulation"
              aria-label="Toggle Motion Simulation"
            >
              {isSimulated ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          )}

          <button
            type="button"
            onClick={onExitNavigation}
            className="min-h-[40px] min-w-[40px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition shadow-lg shadow-rose-600/30"
            title="Exit Live Navigation"
            aria-label="Exit Live Navigation"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Real-time Threat Radar Interception Banner */}
      {threatAlert && (
        <div className="w-full pointer-events-auto bg-gradient-to-r from-red-950/95 via-rose-950/95 to-amber-950/95 border-2 border-red-500 rounded-2xl p-3 sm:p-3.5 shadow-2xl backdrop-blur-2xl text-white animate-pulse animate-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-red-600/30 border border-red-400 flex items-center justify-center text-red-300 shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black text-red-300 uppercase tracking-wider">
                    ⚠️ Hazard Radar: {threatAlert.distanceAheadKm.toFixed(1)} km Ahead
                  </span>
                  <span className="text-[9px] bg-red-900 text-red-200 font-bold px-1.5 py-0.2 rounded font-mono">
                    {threatAlert.disruption.severity}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-100 font-bold truncate mt-0.5">
                  {threatAlert.disruption.title}
                </p>
                <p className="text-[11px] text-amber-200/90 italic line-clamp-1">
                  &ldquo;{threatAlert.disruption.message || threatAlert.disruption.description}&rdquo;
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onDismissThreatAlert}
              className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
              aria-label="Dismiss Alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-2.5 pt-2 border-t border-red-800/60 flex items-center justify-end">
            <button
              type="button"
              onClick={onAcceptDetour}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-black text-xs shadow-lg transition flex items-center justify-center gap-2 min-h-[44px]"
            >
              <ArrowRight className="w-4 h-4" />
              <span>Activate Disaster-Resilient Detour</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
