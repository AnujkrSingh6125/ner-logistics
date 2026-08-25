'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TrackedCitizenTelemetry } from '@/types';
import { useAuth } from '@/context/AuthContext';
import {
  Radar,
  Radio,
  Search,
  MapPin,
  Compass,
  Gauge,
  User,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Square,
  Play,
  RotateCw,
  Phone,
  Mail,
  Clock,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

interface ClientUserTrackerProps {
  onTrackedLocationChange?: (telemetry: TrackedCitizenTelemetry | null) => void;
  activeTrackedUser?: TrackedCitizenTelemetry | null;
}

export default function ClientUserTracker({
  onTrackedLocationChange,
  activeTrackedUser,
}: ClientUserTrackerProps) {
  const { user, isGovOfficial, isSupplyHub, canObserveTelemetry } = useAuth();

  const [inputIdentifier, setInputIdentifier] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isAutoPolling, setIsAutoPolling] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentTelemetry, setCurrentTelemetry] = useState<TrackedCitizenTelemetry | null>(
    activeTrackedUser || null
  );
  const [lastPingTime, setLastPingTime] = useState<Date | null>(null);
  const [pulseCount, setPulseCount] = useState(0);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Stop polling on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  // Fetch location handler
  const handleFetchLocation = async (idToFetch?: string) => {
    const target = (idToFetch || inputIdentifier).trim();
    if (!target) {
      setErrorMsg('Please enter a User ID, Citizen UID, or Email.');
      return;
    }

    setIsFetching(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/telemetry/track-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: target }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to query telemetry.');
      }

      if (!data.found || !data.user) {
        setErrorMsg(data.message || `No citizen user found matching "${target}".`);
        setCurrentTelemetry(null);
        onTrackedLocationChange?.(null);
        return;
      }

      const telemetry: TrackedCitizenTelemetry = data.user;
      setCurrentTelemetry(telemetry);
      setLastPingTime(new Date());
      setPulseCount((prev) => prev + 1);
      onTrackedLocationChange?.(telemetry);

      // Start automatic live radar polling every 3.5 seconds
      if (!isAutoPolling) {
        setIsAutoPolling(true);
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        pollTimerRef.current = setInterval(() => {
          performBackgroundPoll(target);
        }, 3500);
      }
    } catch (err: any) {
      console.error('[ClientUserTracker] Error:', err);
      setErrorMsg(err.message || 'Error fetching user live location.');
    } finally {
      setIsFetching(false);
    }
  };

  const performBackgroundPoll = async (target: string) => {
    try {
      const res = await fetch('/api/telemetry/track-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: target }),
      });
      const data = await res.json();
      if (data.success && data.found && data.user) {
        setCurrentTelemetry(data.user);
        setLastPingTime(new Date());
        setPulseCount((prev) => prev + 1);
        onTrackedLocationChange?.(data.user);
      }
    } catch (e) {
      console.warn('[Background Telemetry Poll Notice]:', e);
    }
  };

  // Stop fetching & release tracking
  const handleStopFetching = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    setIsAutoPolling(false);
    setIsFetching(false);
    setCurrentTelemetry(null);
    onTrackedLocationChange?.(null);
  };

  if (!canObserveTelemetry) {
    return null;
  }

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 shadow-xl text-slate-100 space-y-3.5 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl border ${
            isAutoPolling
              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 animate-pulse'
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}>
            <Radar className={`w-4 h-4 ${isAutoPolling ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-slate-100 flex items-center gap-1.5">
              <span>On-Demand Citizen Live GPS Radar</span>
              {isAutoPolling && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/50 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  RADAR ACTIVE
                </span>
              )}
            </h3>
            <p className="text-[10px] text-slate-400">
              Query & track client driver coordinates on demand (Supply Hub & Gov Authority)
            </p>
          </div>
        </div>

        {isAutoPolling && (
          <button
            type="button"
            onClick={handleStopFetching}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 transition shadow-sm"
            title="Stop live GPS radar polling"
          >
            <Square className="w-3 h-3 fill-rose-400" />
            <span>Stop Fetching</span>
          </button>
        )}
      </div>

      {/* Search Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleFetchLocation();
        }}
        className="flex flex-col sm:flex-row gap-2"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={inputIdentifier}
            onChange={(e) => setInputIdentifier(e.target.value)}
            placeholder="Enter Citizen UID (e.g. NER-CIT-49210), Email, or User ID"
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isAutoPolling ? (
            <button
              type="submit"
              disabled={isFetching || !inputIdentifier.trim()}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50 transition shadow-md shadow-cyan-600/20"
            >
              {isFetching ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching GPS...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" /> Fetch Live Location
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStopFetching}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition shadow-md shadow-rose-600/20"
            >
              <Square className="w-3.5 h-3.5 fill-white" /> Stop Fetching
            </button>
          )}
        </div>
      </form>

      {/* Quick Suggestion Badges */}
      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 flex-wrap">
        <span className="font-mono text-slate-500">Quick Test Targets:</span>
        {['NER-CIT-84920', 'NER-CIT-49210', 'NER-CIT-GUEST'].map((sample) => (
          <button
            key={sample}
            type="button"
            onClick={() => {
              setInputIdentifier(sample);
              handleFetchLocation(sample);
            }}
            className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-cyan-400 font-mono text-[10px] border border-slate-700 hover:border-cyan-500/40 transition"
          >
            {sample}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Live Telemetry Display Card */}
      {currentTelemetry && (
        <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/40 shadow-inner space-y-2.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-400/50 flex items-center justify-center text-cyan-400 font-bold text-xs">
                <User className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-100 flex items-center gap-2">
                  <span>{currentTelemetry.full_name}</span>
                  <span className="font-mono text-[10px] text-cyan-400 px-1.5 py-0.2 bg-cyan-950/80 rounded border border-cyan-800">
                    {currentTelemetry.citizen_uid}
                  </span>
                </div>
                {currentTelemetry.phone && (
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                    <Phone className="w-2.5 h-2.5 text-slate-500" />
                    <span>{currentTelemetry.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 ${
                  currentTelemetry.is_sharing_location
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                    : 'bg-amber-950 text-amber-400 border border-amber-500/40'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    currentTelemetry.is_sharing_location ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                {currentTelemetry.is_sharing_location ? 'LIVE GPS ACTIVE' : 'HISTORICAL COORDS'}
              </span>
            </div>
          </div>

          {/* Coordinates & Velocity Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Latitude</span>
              <span className="font-mono font-bold text-slate-200 text-[11px]">
                {currentTelemetry.current_lat.toFixed(5)}° N
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Longitude</span>
              <span className="font-mono font-bold text-slate-200 text-[11px]">
                {currentTelemetry.current_lng.toFixed(5)}° E
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Speed</span>
              <span className="font-mono font-bold text-cyan-400 text-[11px] flex items-center gap-1">
                <Gauge className="w-3 h-3" />
                {Math.round(currentTelemetry.speed_kmh || 0)} km/h
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Heading</span>
              <span className="font-mono font-bold text-slate-200 text-[11px] flex items-center gap-1">
                <Compass className="w-3 h-3 text-cyan-400" />
                {Math.round(currentTelemetry.heading || 0)}°
              </span>
            </div>
          </div>

          {/* Route info if active */}
          {(currentTelemetry.origin_hub || currentTelemetry.destination_hub) && (
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] flex items-center justify-between text-slate-300">
              <span className="text-slate-400 font-mono text-[10px]">CORRIDOR:</span>
              <span className="font-semibold text-slate-200 truncate">
                {currentTelemetry.origin_hub || 'Origin Hub'} → {currentTelemetry.destination_hub || 'Destination'}
              </span>
            </div>
          )}

          {/* Telemetry Status Footer */}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/80">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-500" />
              <span>Ping #{pulseCount}</span>
              {lastPingTime && <span>• {lastPingTime.toLocaleTimeString()}</span>}
            </span>
            <span className="text-cyan-400">Map Beacon Centered</span>
          </div>
        </div>
      )}
    </div>
  );
}
