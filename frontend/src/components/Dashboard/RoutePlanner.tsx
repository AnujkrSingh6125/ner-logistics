'use client';

import React, { useState } from 'react';
import {
  SupplyHub,
  DisasterResilientRouteResponse,
  RouteCalculationResult,
  CargoTier,
} from '@/types';
import { calculateRoute } from '@/lib/api';
import {
  CARGO_MANIFEST_PRESETS,
  calculateCargoAdjustedETA,
} from '@/lib/spatial';
import {
  Navigation,
  ArrowRightLeft,
  Clock,
  Milestone,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Compass,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Package,
  Activity,
  Building2,
  Radio,
  Globe,
  FileText,
  LocateFixed,
} from 'lucide-react';

interface RoutePlannerProps {
  hubs: SupplyHub[];
  originHub: SupplyHub | null;
  destHub: SupplyHub | null;
  routeData: DisasterResilientRouteResponse | null;
  activeRouteView: 'PRIMARY' | 'DETOUR' | 'BOTH';
  cargoTier: CargoTier;
  selectedRouteIndex?: number;
  // Live GPS Navigation Props
  userLocation?: [number, number] | null;
  isTracking?: boolean;
  isNavigating?: boolean;
  isGpsEnabled?: boolean;
  onSetOrigin: (hub: SupplyHub | null) => void;
  onSetDestination: (hub: SupplyHub | null) => void;
  onSetCargoTier: (tier: CargoTier) => void;
  onRouteCalculated: (data: DisasterResilientRouteResponse | null) => void;
  onSelectRouteView: (view: 'PRIMARY' | 'DETOUR' | 'BOTH') => void;
  onSelectCandidateRoute?: (index: number) => void;
  onToggleAlternateHubs?: () => void;
  onClear?: () => void;
  onUseCurrentLocation?: () => void;
  onStartNavigation?: () => void;
  onStopNavigation?: () => void;
  onToggleGps?: () => void;
}

export default function RoutePlanner({
  hubs,
  originHub,
  destHub,
  routeData,
  activeRouteView,
  cargoTier,
  selectedRouteIndex,
  userLocation,
  isTracking,
  isNavigating,
  isGpsEnabled = false,
  onSetOrigin,
  onSetDestination,
  onSetCargoTier,
  onRouteCalculated,
  onSelectRouteView,
  onSelectCandidateRoute,
  onToggleAlternateHubs,
  onClear,
  onUseCurrentLocation,
  onStartNavigation,
  onStopNavigation,
  onToggleGps,
}: RoutePlannerProps) {
  const [loading, setLoading] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [profile, setProfile] = useState<'driving' | 'truck'>('driving');

  const cargoConfig = CARGO_MANIFEST_PRESETS[cargoTier];

  const handleSwap = () => {
    const temp = originHub;
    onSetOrigin(destHub);
    onSetDestination(temp);
  };

  const handleCalculateRoute = async () => {
    if (!originHub || !destHub) return;
    setLoading(true);
    try {
      const result = await calculateRoute(
        originHub.latitude,
        originHub.longitude,
        destHub.latitude,
        destHub.longitude,
        profile,
        originHub.name,
        destHub.name,
        cargoTier
      );
      onRouteCalculated(result);

      if (result.isCompromised && result.alternativeRoute) {
        onSelectRouteView('BOTH');
      } else {
        onSelectRouteView('PRIMARY');
      }
    } catch (err) {
      console.error('Failed to calculate disaster-resilient route:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearRoute = () => {
    onSetOrigin(null);
    onSetDestination(null);
    onRouteCalculated(null);
    onSelectRouteView('PRIMARY');
    setShowSteps(false);
    if (onClear) {
      onClear();
    }
  };

  const primary = routeData?.primaryRoute;
  const detour = routeData?.alternativeRoute;

  // Compute cargo adjusted ETA
  const primaryETA = primary
    ? calculateCargoAdjustedETA(
        primary.duration_minutes,
        primary.distance_km,
        cargoTier
      )
    : null;

  const detourETA = detour
    ? calculateCargoAdjustedETA(
        detour.duration_minutes,
        detour.distance_km,
        cargoTier
      )
    : null;

  const deltaDistance =
    primary && detour
      ? Math.round((detour.distance_km - primary.distance_km) * 10) / 10
      : 0;

  const deltaTime =
    primaryETA && detourETA
      ? Math.round(
          detourETA.adjustedDurationMinutes -
            primaryETA.adjustedDurationMinutes
        )
      : 0;

  return (
    <div className="bg-[#070e1c]/85 backdrop-blur-xl rounded-2xl p-4 border border-slate-800/80 shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-3.5 text-slate-100 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-slate-100 text-sm">
              Disaster-Resilient Route Engine
            </h2>
            <p className="text-[10px] text-slate-400">Multi-Corridor Risk Evaluation & Routing</p>
          </div>
        </div>
        <span className="text-[10px] text-cyan-300 font-mono font-bold bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-800/60 flex items-center gap-1">
          Active Engine
        </span>
      </div>

      {/* Cargo Priority Tier Selector */}
      <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/90 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cargo Manifest & Priority Tier:</span>
          </label>
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
              cargoTier === 'TIER_1_CRITICAL'
                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                : cargoTier === 'TIER_2_ESSENTIAL'
                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                : 'bg-blue-950 text-blue-300 border border-blue-800'
            }`}
          >
            Urgency: {cargoConfig.urgencyScore}/100
          </span>
        </div>

        <select
          value={cargoTier}
          onChange={(e) => onSetCargoTier(e.target.value as CargoTier)}
          className="w-full bg-[#081020] border border-slate-700/80 text-slate-100 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none font-medium"
        >
          <option value="TIER_1_CRITICAL">
            Tier 1 (Critical): Vaccines / Blood / Oxygen (Priority Bypass)
          </option>
          <option value="TIER_2_ESSENTIAL">
            Tier 2 (Essential): Dry Food Rations / Potable Water
          </option>
          <option value="TIER_3_BULK">
            Tier 3 (Bulk): Heavy Relief Machinery / Shelters / Fuel
          </option>
        </select>

        <p className="text-[10px] text-slate-400 leading-tight">
          {cargoConfig.description}
        </p>
      </div>

      {/* Select Hubs Form */}
      <div className="space-y-2.5">
        {/* Origin Hub Selector with Dynamic GPS Privacy Switch */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-medium text-slate-400">
              Origin Strategic Hub:
            </label>
            <div className="flex items-center gap-1.5">
              {onToggleGps && (
                <button
                  type="button"
                  onClick={onToggleGps}
                  className={`text-[10px] px-2 py-0.5 rounded flex items-center gap-1 font-bold transition border ${
                    isGpsEnabled
                      ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title={
                    isGpsEnabled
                      ? 'Live GPS Active (Click to Pause Tracking)'
                      : 'Click to Connect Live GPS'
                  }
                >
                  <LocateFixed
                    className={`w-3 h-3 ${
                      isGpsEnabled ? 'text-emerald-500 animate-pulse' : 'text-slate-400'
                    }`}
                  />
                  <span>{isGpsEnabled ? 'GPS: Connected' : 'GPS: Paused'}</span>
                </button>
              )}

              {onUseCurrentLocation && !isGpsEnabled && (
                <button
                  type="button"
                  onClick={onUseCurrentLocation}
                  className="text-[10px] px-2 py-0.5 rounded flex items-center gap-1 font-semibold transition border bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                  title="Activate GPS and set as origin"
                >
                  <span>Use Live Location</span>
                </button>
              )}
            </div>
          </div>
          <select
            value={originHub?.id || ''}
            onChange={(e) => {
              if (e.target.value === 'current-location') {
                onUseCurrentLocation?.();
                return;
              }
              const selected =
                hubs.find((h) => h.id === e.target.value) || null;
              onSetOrigin(selected);
            }}
            className="w-full bg-[#081020] border border-slate-700/80 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:outline-none font-medium"
          >
            <option value="">-- Select Origin Hub (Manual) --</option>
            {isGpsEnabled && userLocation && (
              <option value="current-location">
                📍 My Current Location (Live GPS: {userLocation[0].toFixed(3)}°, {userLocation[1].toFixed(3)}°)
              </option>
            )}
            {hubs.map((hub) => (
              <option key={`orig-${hub.id}`} value={hub.id}>
                {hub.name} ({hub.state})
              </option>
            ))}
          </select>
        </div>

        {/* Swap button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleSwap}
            disabled={!originHub && !destHub}
            className="p-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-700/80 transition disabled:opacity-30 shadow-sm"
            title="Swap Origin & Destination"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 rotate-90 md:rotate-0" />
          </button>
        </div>

        {/* Destination Hub Selector */}
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Destination Strategic Hub:
          </label>
          <select
            value={destHub?.id || ''}
            onChange={(e) => {
              const selected =
                hubs.find((h) => h.id === e.target.value) || null;
              onSetDestination(selected);
            }}
            className="w-full bg-[#081020] border border-slate-700/80 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:outline-none font-medium"
          >
            <option value="">-- Select Destination Hub --</option>
            {hubs.map((hub) => (
              <option key={`dest-${hub.id}`} value={hub.id}>
                {hub.name} ({hub.state})
              </option>
            ))}
          </select>
        </div>

        {/* Action Button */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleCalculateRoute}
            disabled={!originHub || !destHub || loading}
            className="flex-1 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed border border-cyan-400/30"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing Corridor Risk...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                <span>Analyze & Dispatch Corridor</span>
              </>
            )}
          </button>
          {(originHub || destHub || routeData) && (
            <button
              onClick={handleClearRoute}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition border border-slate-200 dark:border-slate-700 shadow-sm"
              title="Clear Route & Reset Dropdowns"
            >
              Clear
            </button>
          )}
        </div>

        {/* Start Live GPS Navigation CTA */}
        {routeData && onStartNavigation && (
          <button
            type="button"
            onClick={isNavigating ? onStopNavigation : onStartNavigation}
            className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 ${
              isNavigating
                ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white animate-pulse'
                : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white'
            }`}
          >
            <Navigation className="w-4 h-4 stroke-[2.5]" />
            <span>
              {isNavigating
                ? 'Exit Live GPS Navigation'
                : 'Start Google Maps-Style Live GPS Navigation'}
            </span>
          </button>
        )}
      </div>

      {/* Calculated Route Results & Hazard Analysis */}
      {routeData && (
        <div className="pt-3 border-t border-slate-200 dark:border-slate-700/80 space-y-3">
          {/* Multi-Route Alternative Exploration & Threat Assessment Matrix */}
          {routeData.candidateRoutes && routeData.candidateRoutes.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-md space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">Multi-Route Alternative Exploration</h4>
                    <p className="text-[10px] text-slate-400">Per-Corridor Gemini AI Threat Evaluation</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/60 px-2 py-0.5 rounded-full">
                  {routeData.candidateRoutes.length} Candidate Paths
                </span>
              </div>

              <div className="space-y-2">
                {routeData.candidateRoutes.map((corridor, idx) => {
                  const isSelected = (selectedRouteIndex ?? routeData.selectedRouteIndex ?? 0) === idx;
                  const evalData = corridor.ai_evaluation;
                  const isCompromised = corridor.is_compromised;
                  const riskLevel = evalData?.risk_level || (isCompromised ? 'CRITICAL' : (idx === 1 ? 'LOW' : 'MEDIUM'));
                  const riskScore = evalData?.risk_score ?? (isCompromised ? 88 : (idx === 1 ? 14 : 35));
                  const isRecommended = Boolean(corridor.is_recommended || evalData?.recommended);

                  // Route color palette
                  const palette = ['#06b6d4', '#10b981', '#a855f7', '#f59e0b'];
                  const color = isCompromised && isSelected ? '#ef4444' : (corridor.color || palette[idx % palette.length]);

                  return (
                    <div
                      key={`corridor-card-${corridor.id || idx}`}
                      onClick={() => onSelectCandidateRoute?.(idx)}
                      className={`p-2.5 rounded-lg border transition cursor-pointer space-y-1.5 ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-950/40 ring-1 ring-cyan-500 shadow-md'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-bold text-xs text-slate-100 truncate">
                            {corridor.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {isRecommended && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              AI Recommended
                            </span>
                          )}
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                              riskLevel === 'CRITICAL'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : riskLevel === 'HIGH'
                                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                                : riskLevel === 'MEDIUM'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            {riskLevel}
                          </span>
                        </div>
                      </div>

                      {/* Metrics & Risk Score */}
                      <div className="flex items-center justify-between text-[11px] text-slate-300 pt-0.5">
                        <div>
                          <span className="font-mono font-bold text-white">{corridor.distance_km} km</span> •{' '}
                          <span className="font-mono text-emerald-400 font-bold">
                            {Math.floor(corridor.duration_minutes / 60)}h {Math.round(corridor.duration_minutes % 60)}m
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          Threat Score: <span className={`font-bold ${riskScore > 60 ? 'text-rose-400' : riskScore > 30 ? 'text-amber-400' : 'text-emerald-400'}`}>{riskScore}/100</span>
                        </div>
                      </div>

                      {/* Risk Progress Bar */}
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            riskScore > 60 ? 'bg-rose-500' : riskScore > 30 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(5, riskScore))}%` }}
                        />
                      </div>

                      {/* AI Brief */}
                      {evalData?.ai_brief && (
                        <p className="text-[10px] text-slate-300 bg-slate-900/90 p-1.5 rounded border border-slate-800 leading-relaxed">
                          <span className="text-cyan-400 font-semibold">Gemini Brief: </span>
                          {evalData.ai_brief}
                        </p>
                      )}

                      {/* Hazards list */}
                      {evalData?.hazards_detected && evalData.hazards_detected.length > 0 && (
                        <div className="space-y-1 pt-0.5">
                          {evalData.hazards_detected.map((h, hIdx) => (
                            <div
                              key={`haz-tag-${hIdx}`}
                              className="text-[10px] text-rose-300 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-900/60 flex items-center gap-1"
                            >
                              <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                              <span>{h}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Selection button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCandidateRoute?.(idx);
                        }}
                        className={`w-full mt-1 py-1 px-2 rounded text-[10px] font-bold transition flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-cyan-600 text-white shadow-sm'
                            : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{isSelected ? 'Active Dispatch Corridor' : 'Select This Alternative'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dual-Stream Intelligence Assessment (Government Authorized vs Live Web Grounding) */}
          {routeData.dualStreamIntelligence && (
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-md space-y-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
                    <Radio className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <span>Dual-Stream Corridor Intelligence</span>
                      <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-800/80 px-1.5 py-0.2 rounded font-mono">
                        LIVE SYNC
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Segregated Official Database Directives vs Real-Time Web Grounding
                    </p>
                  </div>
                </div>
              </div>

              {/* Stream 1: Government Authorized Data */}
              <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-800/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    Stream 1: Government Authorized Data
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-900/60 text-amber-200 border border-amber-700/60 uppercase">
                    {routeData.dualStreamIntelligence.government_authorized_data.has_disruptions
                      ? `${routeData.dualStreamIntelligence.government_authorized_data.records.length} Directives`
                      : 'Zero Disruptions'}
                  </span>
                </div>

                {routeData.dualStreamIntelligence.government_authorized_data.records.length > 0 ? (
                  <div className="space-y-1.5">
                    {routeData.dualStreamIntelligence.government_authorized_data.records.map(
                      (rec, rIdx) => (
                        <div
                          key={`gov-rec-${rIdx}`}
                          className="bg-slate-950/80 p-2 rounded border border-amber-900/40 text-[11px] space-y-1"
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-amber-300 truncate">
                              🏛️ {rec.government_body}
                            </span>
                            <span className="font-mono text-rose-400 font-bold">
                              {rec.severity} ({rec.distance_to_route_km} km)
                            </span>
                          </div>
                          <div className="text-slate-200 text-[10px] font-medium leading-tight bg-amber-950/30 p-1.5 rounded border-l-2 border-amber-500">
                            &ldquo;{rec.message}&rdquo;
                          </div>
                          <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                            <span>Corridor: {rec.highway}</span>
                            <span>GPS: {rec.coordinates[0]?.toFixed(2)}, {rec.coordinates[1]?.toFixed(2)}</span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-300 italic">
                    {routeData.dualStreamIntelligence.government_authorized_data.official_summary}
                  </p>
                )}
                <div className="text-[9px] text-amber-400/80 font-mono">
                  🔒 {routeData.dualStreamIntelligence.government_authorized_data.official_summary}
                </div>
              </div>

              {/* Stream 2: Internet Live Intelligence (Gemini + Google Search Grounding) */}
              <div className="p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-800/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    Stream 2: Internet Live Intelligence
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-900/60 text-cyan-200 border border-cyan-700/60 uppercase">
                    Web Grounded
                  </span>
                </div>

                <div className="bg-slate-950/80 p-2 rounded border border-cyan-900/40 text-[11px] space-y-1.5">
                  <div>
                    <span className="text-[9px] font-bold uppercase text-cyan-400 block">
                      🌦️ Live Weather Bulletin:
                    </span>
                    <p className="text-slate-200 text-[10px] leading-tight">
                      {routeData.dualStreamIntelligence.internet_live_intelligence.weather_advisory}
                    </p>
                  </div>

                  <div>
                    <span className="text-[9px] font-bold uppercase text-cyan-400 block">
                      🚗 Real-Time Highway Movement:
                    </span>
                    <p className="text-slate-200 text-[10px] leading-tight">
                      {routeData.dualStreamIntelligence.internet_live_intelligence.live_traffic_status}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-cyan-300/80 pt-1 border-t border-slate-800 font-mono">
                    <span>
                      Sources: {routeData.dualStreamIntelligence.internet_live_intelligence.sources.join(', ')}
                    </span>
                    <span>Gemini Live Search Grounding</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status Banner */}
          {routeData.isCompromised ? (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-red-800 dark:text-red-300">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 animate-pulse" />
                  <span>CRITICAL: Route Intersects Hazard Zone</span>
                </span>
                <span className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-[10px] px-1.5 py-0.5 rounded font-mono">
                  {(routeData.intersectedHazards || routeData.compromisedHazards || []).length} Collision(s)
                </span>
              </div>

              <div className="space-y-1">
                {(routeData.intersectedHazards || routeData.compromisedHazards || []).map((h: any, idx: number) => (
                  <div
                    key={`hazard-${idx}`}
                    className="p-1.5 rounded bg-white dark:bg-slate-900/90 border border-red-200 dark:border-red-900/60 text-[11px] text-slate-800 dark:text-slate-200 flex items-start justify-between gap-2 shadow-sm"
                  >
                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-300">
                        {h.disruption?.title || 'Active Road Disruption'}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {h.disruption?.disruption_type || 'HAZARD'} • Highway:{' '}
                        {h.disruption?.highway_reference || 'Corridor'}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 shrink-0">
                      {h.distance_to_route_km ?? 0} km to route
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Buttons: Emergency Bypass + Alternate Hub Sourcing */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {routeData.alternativeRoute && (
                  <button
                    onClick={() => onSelectRouteView('DETOUR')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-2.5 rounded-lg text-[11px] transition shadow flex items-center justify-center gap-1"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Apply Safe Detour</span>
                  </button>
                )}

                {onToggleAlternateHubs && (
                  <button
                    onClick={onToggleAlternateHubs}
                    className="bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-2 px-2.5 rounded-lg text-[11px] transition shadow flex items-center justify-center gap-1"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Alternate Hubs</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold">Corridor 100% Clear: </span>
                  <span>No active disruptions intersect route.</span>
                </div>
              </div>
              {onToggleAlternateHubs && (
                <button
                  onClick={onToggleAlternateHubs}
                  className="text-[10px] bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 px-2 py-0.5 rounded hover:bg-emerald-200 dark:hover:bg-emerald-800"
                >
                  Multi-Hub Options
                </button>
              )}
            </div>
          )}

          {/* Route Comparison (Primary vs Detour) with Cargo Adjusted ETA */}
          {primary && detour && primaryETA && detourETA && (
            <div className="bg-slate-50 dark:bg-slate-900/80 p-3 rounded-lg border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs">
              <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between text-[11px]">
                <span>Telemetry with Cargo Elevation Factor</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                  +{deltaDistance} km ({deltaTime > 0 ? `+${deltaTime}m` : '0m'})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Primary stats */}
                <div
                  onClick={() => onSelectRouteView('PRIMARY')}
                  className={`p-2 rounded border cursor-pointer transition ${
                    activeRouteView === 'PRIMARY'
                      ? 'border-red-500 bg-red-100/50 dark:bg-red-950/30 ring-1 ring-red-500'
                      : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="text-[10px] text-red-600 dark:text-red-400 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Primary (Compromised)
                  </div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                    {primary.distance_km} km
                  </div>
                  <div className="text-[10px] text-slate-700 dark:text-slate-300 font-medium">
                    ETA: {primaryETA.etaString}
                  </div>
                  {primaryETA.delayBufferMinutes > 0 && (
                    <div className="text-[9px] text-slate-500 dark:text-slate-400">
                      +{primaryETA.delayBufferMinutes}m mountain buffer
                    </div>
                  )}
                </div>

                {/* Detour stats */}
                <div
                  onClick={() => onSelectRouteView('DETOUR')}
                  className={`p-2 rounded border cursor-pointer transition ${
                    activeRouteView === 'DETOUR'
                      ? 'border-emerald-500 bg-emerald-100/50 dark:bg-emerald-950/40 ring-1 ring-emerald-500'
                      : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Safe Detour (Verified)
                  </div>
                  <div className="font-bold text-emerald-700 dark:text-emerald-300 text-sm mt-0.5">
                    {detour.distance_km} km
                  </div>
                  <div className="text-[10px] text-emerald-800 dark:text-emerald-300 font-medium">
                    ETA: {detourETA.etaString}
                  </div>
                  {detourETA.delayBufferMinutes > 0 && (
                    <div className="text-[9px] text-slate-500 dark:text-slate-400">
                      +{detourETA.delayBufferMinutes}m mountain buffer
                    </div>
                  )}
                </div>
              </div>

              {/* View Selector Tabs */}
              <div className="flex gap-1 pt-1">
                {(['BOTH', 'PRIMARY', 'DETOUR'] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => onSelectRouteView(view)}
                    className={`flex-1 py-1 rounded text-[10px] font-semibold transition ${
                      activeRouteView === view
                        ? 'bg-cyan-600 text-white dark:bg-slate-700 dark:text-cyan-300 shadow-sm'
                        : 'bg-slate-200 dark:bg-slate-800/80 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {view === 'BOTH'
                      ? 'Compare Both'
                      : view === 'PRIMARY'
                      ? 'Show Primary'
                      : 'Show Detour'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Single primary route stats (if not compromised and no detour) */}
          {primary && !detour && primaryETA && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 dark:bg-slate-900/90 p-2 rounded-lg border border-slate-200 dark:border-slate-700/60 shadow-sm">
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[10px] mb-0.5">
                  <Milestone className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                  <span>Road Distance</span>
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {primary.distance_km} km
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/90 p-2 rounded-lg border border-slate-200 dark:border-slate-700/60 shadow-sm">
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[10px] mb-0.5">
                  <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Estimated Safe ETA</span>
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {primaryETA.etaString}
                </div>
                {primaryETA.delayBufferMinutes > 0 && (
                  <div className="text-[9px] text-slate-500 dark:text-slate-400">
                    Includes +{primaryETA.delayBufferMinutes}m terrain delay
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step-by-step maneuvers */}
          {((activeRouteView === 'DETOUR' && detour?.steps) ||
            primary?.steps) && (
            <div>
              <button
                onClick={() => setShowSteps(!showSteps)}
                className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 py-1"
              >
                <span>
                  {activeRouteView === 'DETOUR'
                    ? `Detour Maneuvers (${detour?.steps?.length || 0})`
                    : `Primary Maneuvers (${primary?.steps?.length || 0})`}
                </span>
                {showSteps ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {showSteps && (
                <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1 mt-1">
                  {(activeRouteView === 'DETOUR'
                    ? detour?.steps
                    : primary?.steps
                  )?.map((step, idx) => (
                    <div
                      key={`step-${idx}`}
                      className="p-1.5 rounded bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-800 dark:text-slate-300 flex items-start gap-2 shadow-sm"
                    >
                      <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 text-[9px] flex items-center justify-center shrink-0 font-mono">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <div className="font-medium text-slate-900 dark:text-slate-200">
                          {step.instruction || step.name || 'Continue forward'}
                        </div>
                        {((step.distance_meters || 0) > 0 || (step.distance || 0) > 0) && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {((step.distance_meters || (step.distance ? step.distance * 1000 : 0)) / 1000).toFixed(1)} km
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
