'use client';

import React from 'react';
import {
  Navigation,
  Compass,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  CornerUpRight,
  CornerUpLeft,
  ArrowUp,
  X,
  RotateCcw,
  Play,
  Pause,
  LocateFixed,
  MapPin,
  Volume2,
  VolumeX,
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
  const timeString = hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;

  // Calculate dynamic arrival time
  const now = new Date();
  now.setMinutes(now.getMinutes() + remainingDurationMinutes);
  const etaFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="absolute inset-0 pointer-events-none z-[9999] flex flex-col justify-between p-3 select-none">
      {/* Top Banner: Turn-by-Turn Maneuver & Road Header */}
      <div className="pointer-events-auto max-w-xl mx-auto w-full space-y-2">
        <div className="bg-gradient-to-r from-slate-900/95 via-[#0d1b2a]/95 to-slate-900/95 border border-cyan-500/40 rounded-2xl shadow-2xl backdrop-blur-md p-3.5 flex items-center justify-between text-white animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-cyan-600/30 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-lg">
              <CornerUpRight className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-cyan-400 font-mono tracking-wide">
                  CONTINUE FORWARD
                </span>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800/80 px-1.5 py-0.5 rounded font-mono">
                  Active Guidance
                </span>
              </div>
              <h2 className="text-sm font-extrabold text-slate-100 truncate max-w-[280px] sm:max-w-md">
                Towards {destinationName || 'Strategic Destination'}
              </h2>
            </div>
          </div>

          <div className="text-right pl-2 border-l border-slate-700/60">
            <div className="text-base font-black font-mono text-cyan-300">
              {remainingDistanceKm.toFixed(1)} <span className="text-[11px] font-normal">km</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              {timeString}
            </div>
          </div>
        </div>

        {/* Realtime Threat Interception Banner (if a hazard lies in forward corridor) */}
        {threatAlert && (
          <div className="bg-gradient-to-r from-red-950/95 via-rose-950/95 to-amber-950/95 border-2 border-red-500 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md text-white animate-pulse animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-600/30 border border-red-400 flex items-center justify-center text-red-300 shrink-0 mt-0.5">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-red-300 uppercase tracking-wider">
                      ⚠️ Hazard Intercepted Ahead ({threatAlert.distanceAheadKm.toFixed(1)} km)
                    </span>
                    <span className="text-[10px] bg-red-900/90 text-red-200 font-bold px-1.5 py-0.5 rounded font-mono">
                      {threatAlert.disruption.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 font-semibold mt-0.5">
                    {threatAlert.disruption.title}
                  </p>
                  <p className="text-[11px] text-amber-200/90 italic mt-0.5 line-clamp-2">
                    "{threatAlert.disruption.message || threatAlert.disruption.description}"
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Authority: <span className="text-cyan-300">{threatAlert.disruption.government_body_name}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={onDismissThreatAlert}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-2.5 pt-2 border-t border-red-800/60 flex items-center justify-end gap-2">
              <button
                onClick={onAcceptDetour}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-bold text-xs shadow-lg transition flex items-center gap-1.5"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Recalculate & Detour Around Hazard</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar: Trip Status, Speedometer, Recenter & Exit */}
      <div className="pointer-events-auto max-w-xl mx-auto w-full">
        <div className="bg-[#0b132b]/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md p-3.5 flex items-center justify-between text-slate-100 animate-in slide-in-from-bottom-4 duration-300">
          {/* Speed & ETA Gauge */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-center min-w-[58px]">
              <div className="text-lg font-black font-mono text-emerald-400">
                {currentSpeedKmh !== null && currentSpeedKmh > 0 ? currentSpeedKmh : '45'}
              </div>
              <div className="text-[9px] font-mono text-slate-400 uppercase">km/h</div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-white font-mono">{timeString}</span>
                <span className="text-xs text-slate-400">({remainingDistanceKm.toFixed(1)} km)</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                <span>ETA:</span>
                <span className="text-cyan-300 font-bold">{etaFormatted}</span>
                {heading !== null && (
                  <span className="ml-1 text-[10px] text-slate-500 flex items-center gap-0.5">
                    <Compass className="w-3 h-3 text-cyan-400" />
                    {heading}°
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-1.5">
            {/* Follow Mode Toggle */}
            <button
              onClick={onToggleFollowMode}
              className={`p-2 rounded-xl border text-xs font-semibold transition flex items-center gap-1 ${
                followMode
                  ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title={followMode ? 'Camera Locked to Vehicle' : 'Camera Free (Click to Lock)'}
            >
              <LocateFixed className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px]">{followMode ? 'Following' : 'Free'}</span>
            </button>

            {/* Simulation Motion Toggle (Optional for testing) */}
            {onToggleSimulation && (
              <button
                onClick={onToggleSimulation}
                className={`p-2 rounded-xl border text-xs font-semibold transition flex items-center gap-1 ${
                  isSimulated
                    ? 'bg-purple-950/80 border-purple-500 text-purple-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
                title="Simulate Vehicle Motion on Route"
              >
                {isSimulated ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span className="hidden sm:inline text-[11px]">
                  {isSimulated ? 'Simulating' : 'Simulate'}
                </span>
              </button>
            )}

            {/* Exit Navigation */}
            <button
              onClick={onExitNavigation}
              className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Exit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
