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
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none w-auto max-w-[95vw] select-none flex flex-col items-center gap-2 animate-in slide-in-from-top-3 duration-300">
      {/* Sleek Floating Glassmorphism Pill */}
      <div className="pointer-events-auto backdrop-blur-xl bg-slate-900/90 border border-slate-700/60 rounded-full px-5 py-2 shadow-2xl flex items-center gap-3 text-slate-100">
        {/* Maneuver Icon */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 border border-cyan-300/40 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 shrink-0">
          <CornerUpRight className="w-4 h-4 stroke-[2.5]" />
        </div>

        {/* Destination & Directive */}
        <div className="min-w-0 pr-2 border-r border-slate-700/80">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[9px] font-mono font-extrabold text-cyan-400 uppercase tracking-wider">
              GUIDANCE ACTIVE
            </span>
          </div>
          <h3 className="text-xs font-bold text-white truncate max-w-[150px] sm:max-w-[220px] mt-0.5">
            {destinationName || 'Strategic Hub'}
          </h3>
        </div>

        {/* Distance, Speed, ETA Telemetry Group */}
        <div className="flex items-center gap-2.5 shrink-0 font-mono">
          {/* Speed */}
          <div className="text-center pr-2 border-r border-slate-700/80 hidden sm:block">
            <span className="text-xs font-black text-emerald-400">
              {currentSpeedKmh !== null && currentSpeedKmh > 0 ? currentSpeedKmh : 48}
            </span>
            <span className="text-[8px] text-slate-400 ml-1 uppercase">km/h</span>
          </div>

          {/* Distance */}
          <div className="text-center pr-2 border-r border-slate-700/80">
            <span className="text-xs font-black text-cyan-300">
              {remainingDistanceKm.toFixed(1)}
            </span>
            <span className="text-[8px] text-slate-400 ml-1 uppercase">km</span>
          </div>

          {/* ETA */}
          <div className="flex items-center gap-1 text-xs font-bold text-slate-200">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span>{timeString}</span>
            <span className="text-[9px] text-slate-400 hidden md:inline">({etaFormatted})</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0 pl-1 border-l border-slate-700/80">
          <button
            onClick={onToggleFollowMode}
            className={`p-1 rounded-full border transition ${
              followMode
                ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title={followMode ? 'Camera Locked to Vehicle' : 'Camera Free (Click to Lock)'}
          >
            <LocateFixed className="w-3.5 h-3.5" />
          </button>

          {onToggleSimulation && (
            <button
              onClick={onToggleSimulation}
              className={`p-1 rounded-full border transition ${
                isSimulated
                  ? 'bg-purple-950 border-purple-500 text-purple-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title="Toggle Convoy Motion Simulation"
            >
              {isSimulated ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            onClick={onExitNavigation}
            className="p-1 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white transition shadow-sm"
            title="Exit Live Navigation"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Real-time Threat Radar Interception Banner */}
      {threatAlert && (
        <div className="pointer-events-auto bg-gradient-to-r from-red-950/95 via-rose-950/95 to-amber-950/95 border-2 border-red-500 rounded-2xl p-3 shadow-2xl backdrop-blur-xl text-white animate-pulse animate-in zoom-in-95 duration-200 max-w-xl">
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-red-600/30 border border-red-400 flex items-center justify-center text-red-300 shrink-0 mt-0.5">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-black text-red-300 uppercase tracking-wider">
                    ⚠️ Hazard Radar: {threatAlert.distanceAheadKm.toFixed(1)} km Ahead
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
