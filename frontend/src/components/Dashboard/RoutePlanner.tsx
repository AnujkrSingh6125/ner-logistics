'use client';

import React, { useState } from 'react';
import {
  SupplyHub,
  DisasterResilientRouteResponse,
  RouteCalculationResult,
  CargoTier,
  Shipment,
} from '@/types';
import { calculateRoute } from '@/lib/api';
import {
  CARGO_MANIFEST_PRESETS,
  calculateCargoAdjustedETA,
} from '@/lib/spatial';
import { useAuth } from '@/context/AuthContext';
import { BASELINE_SUPPLY_HUBS } from '@/lib/supabaseClient';
import RegisterShipmentModal from './RegisterShipmentModal';
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
  Truck,
  Lock,
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
  onShipmentRegistered?: (shipment: Shipment) => void;
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
  onShipmentRegistered,
}: RoutePlannerProps) {
  const { canDispatch, openAuthModal } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [profile, setProfile] = useState<'driving' | 'truck'>('driving');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const cargoConfig = CARGO_MANIFEST_PRESETS[cargoTier];

  // Ensure robust hub dataset with guaranteed baseline fallback
  const availableHubs = React.useMemo(() => {
    const rawList = hubs && hubs.length > 0 ? hubs : BASELINE_SUPPLY_HUBS;
    const map = new Map<string, SupplyHub>();
    for (const h of rawList) {
      if (h && (h.id || h.name)) {
        const key = h.id || h.name;
        if (!map.has(key)) {
          map.set(key, h);
        }
      }
    }
    return Array.from(map.values());
  }, [hubs]);

  // Robust value resolution for Origin
  const resolvedOriginValue = React.useMemo(() => {
    if (!originHub) return '';
    if (originHub.id === 'current-location') return 'current-location';
    const match = availableHubs.find(
      (h) =>
        h.id === originHub.id ||
        (h.name && originHub.name && h.name.toLowerCase().trim() === originHub.name.toLowerCase().trim())
    );
    return match ? match.id : originHub.id;
  }, [originHub, availableHubs]);

  // Robust value resolution for Destination
  const resolvedDestValue = React.useMemo(() => {
    if (!destHub) return '';
    const match = availableHubs.find(
      (h) =>
        h.id === destHub.id ||
        (h.name && destHub.name && h.name.toLowerCase().trim() === destHub.name.toLowerCase().trim())
    );
    return match ? match.id : destHub.id;
  }, [destHub, availableHubs]);

  const handleOriginChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'current-location') {
      onUseCurrentLocation?.();
      return;
    }
    if (!val) {
      onSetOrigin(null);
      return;
    }
    const selected =
      availableHubs.find(
        (h) =>
          h.id === val ||
          (h.name && h.name.toLowerCase().trim() === val.toLowerCase().trim())
      ) || null;
    onSetOrigin(selected);
  };

  const handleDestinationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      onSetDestination(null);
      return;
    }
    const selected =
      availableHubs.find(
        (h) =>
          h.id === val ||
          (h.name && h.name.toLowerCase().trim() === val.toLowerCase().trim())
      ) || null;
    onSetDestination(selected);
  };

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
    <div className="bg-white/95 dark:bg-[#070e1c]/90 backdrop-blur-xl rounded-2xl p-4 border border-slate-200 dark:border-slate-800/80 border-t-4 border-t-cyan-500 shadow-md dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-3.5 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Header (Slate / Cyan Mission Control) */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 p-2 rounded-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shadow-inner">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-tight flex items-center gap-1.5">
              <span>Disaster-Resilient Route Engine</span>
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Mission Control • Multi-Corridor AI Evaluation</p>
          </div>
        </div>
        <span className="text-[10px] text-cyan-700 dark:text-cyan-300 font-mono font-bold bg-cyan-100 dark:bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-300 dark:border-cyan-700/60 shadow-sm flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-pulse" />
          Active Engine
        </span>
      </div>

      {/* Cargo Priority Tier Selector */}
      <div className="bg-slate-50 dark:bg-slate-950/70 p-3 rounded-xl border border-slate-200 dark:border-slate-800/90 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Cargo Manifest & Priority Tier:</span>
          </label>
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
              cargoTier === 'TIER_1_CRITICAL'
                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                : cargoTier === 'TIER_2_ESSENTIAL'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
            }`}
          >
            Urgency: {cargoConfig.urgencyScore}/100
          </span>
        </div>

        <select
          value={cargoTier}
          onChange={(e) => onSetCargoTier(e.target.value as CargoTier)}
          className="w-full bg-white dark:bg-[#081020] border border-slate-300 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none font-medium"
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

        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
          {cargoConfig.description}
        </p>
      </div>

      {/* Select Hubs Form */}
      <div className="space-y-2.5">
        {/* Origin Hub Selector with Dynamic GPS Privacy Switch */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Origin Strategic Hub:</span>
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
          <div className="relative">
            <select
              id="origin-hub-select"
              name="origin-hub"
              value={resolvedOriginValue}
              onChange={handleOriginChange}
              className="w-full bg-white dark:bg-[#081020] border border-slate-300 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 text-xs rounded-xl px-3 py-2.5 pr-8 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none font-medium transition cursor-pointer appearance-none shadow-sm"
            >
              <option value="">-- Select Origin Hub (Manual) --</option>
              {isGpsEnabled && (
                <option value="current-location">
                  📍 My Current Location (Live GPS{userLocation ? `: ${userLocation[0].toFixed(3)}°, ${userLocation[1].toFixed(3)}°` : ''})
                </option>
              )}
              {availableHubs.map((hub) => (
                <option key={`orig-${hub.id || hub.name}`} value={hub.id}>
                  {hub.name} ({hub.state})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Swap button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleSwap}
            disabled={!originHub && !destHub}
            className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300 border border-slate-200 dark:border-slate-700/80 transition disabled:opacity-30 shadow-sm"
            title="Swap Origin & Destination"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 rotate-90 md:rotate-0" />
          </button>
        </div>

        {/* Destination Hub Selector */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Destination Strategic Hub:</span>
            </label>
            {destHub && (
              <span className="text-[9px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                {destHub.state || 'NER Hub'}
              </span>
            )}
          </div>
          <div className="relative">
            <select
              id="destination-hub-select"
              name="destination-hub"
              value={resolvedDestValue}
              onChange={handleDestinationChange}
              className="w-full bg-white dark:bg-[#081020] border border-slate-300 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 text-xs rounded-xl px-3 py-2.5 pr-8 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none font-medium transition cursor-pointer appearance-none shadow-sm"
            >
              <option value="">-- Select Destination Hub ({availableHubs.length} Available) --</option>
              {availableHubs.map((hub) => (
                <option key={`dest-${hub.id || hub.name}`} value={hub.id}>
                  {hub.name} ({hub.state})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleCalculateRoute}
            disabled={!originHub || !destHub || loading}
            className="flex-1 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-all shadow-lg shadow-cyan-600/25 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed border border-cyan-400/40 active:scale-[0.99]"
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

        {/* Supply Hub Dispatch RBAC Control */}
        {!canDispatch ? (
          <div className="p-3 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <Lock className="w-4 h-4 shrink-0 text-amber-500" />
              <span className="font-medium text-[11px]">
                Restricted: Only Verified Supply Hub Accounts Can Dispatch Active Shipments.
              </span>
            </div>
            <button
              type="button"
              onClick={() => openAuthModal('hub')}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[10px] whitespace-nowrap transition shadow-sm"
            >
              Hub Login
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsRegisterModalOpen(true)}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 border border-emerald-400/30"
          >
            <Truck className="w-4 h-4" />
            <span>Register & Dispatch Active Convoy</span>
          </button>
        )}

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

      <RegisterShipmentModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onShipmentCreated={(shipment) => {
          onShipmentRegistered?.(shipment);
        }}
        defaultOriginHub={originHub}
        defaultDestHub={destHub}
        defaultCargoTier={cargoTier}
      />

      {/* Calculated Route Results & Hazard Analysis */}
      {routeData && (
        <div className="pt-3 border-t border-slate-200 dark:border-slate-700/80 space-y-3">
          {/* Multi-Route Alternative Exploration & Threat Assessment Matrix (Panel 2: Deep Indigo / Alert Charcoal) */}
          {routeData.candidateRoutes && routeData.candidateRoutes.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-900/95 dark:bg-[#090d1f]/95 border border-indigo-500/40 border-t-4 border-t-indigo-500 shadow-lg space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-indigo-500/20">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <span>AI Threat Evaluation & Corridors</span>
                      <span className="text-[9px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-700/50 px-1.5 py-0.2 rounded">
                        GEMINI AI
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-400">Threat Matrix & Real-Time Bypass Corridors</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-700/60 px-2 py-0.5 rounded-full">
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
                      className={`p-3 rounded-xl border transition cursor-pointer space-y-2 ${
                        isCompromised
                          ? 'border-rose-500/50 bg-rose-950/30 text-rose-200 hover:border-rose-500 hover:bg-rose-950/40'
                          : isRecommended
                          ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-200 hover:border-emerald-500 hover:bg-emerald-950/40'
                          : isSelected
                          ? 'border-cyan-500 bg-cyan-950/40 ring-1 ring-cyan-500 text-cyan-200 shadow-md'
                          : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 text-slate-300'
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
                              AI Safe Detour
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
                        <p className="text-[10px] text-slate-300 bg-slate-900/90 p-2 rounded-lg border border-slate-800 leading-relaxed">
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
                        className={`w-full mt-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm'
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

          {/* Dual-Stream Corridor Intelligence Panel (Panel 3: Amber & Electric Blue Split) */}
          {routeData.dualStreamIntelligence && (
            <div className="p-3.5 rounded-xl bg-slate-900/95 dark:bg-[#0c0d14]/95 border border-amber-500/40 border-t-4 border-t-amber-500 shadow-md space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
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
                      Official Government Directives vs Real-Time Web Grounding
                    </p>
                  </div>
                </div>
              </div>

              {/* Stream 1: Government Authorized Data (Warm Amber / Orange Tinted Card) */}
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    Stream 1: Government Authorized Data
                  </span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-900/60 text-amber-200 border border-amber-700/60 uppercase font-mono">
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
                          className="bg-slate-950/90 p-2.5 rounded-lg border border-amber-900/50 text-[11px] space-y-1 text-slate-200"
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-amber-300 truncate">
                              🏛️ {rec.government_body}
                            </span>
                            <span className="font-mono text-rose-400 font-bold">
                              {rec.severity} ({rec.distance_to_route_km} km)
                            </span>
                          </div>
                          <div className="text-amber-100 text-[10px] font-medium leading-relaxed bg-amber-950/40 p-2 rounded border-l-2 border-amber-500">
                            &ldquo;{rec.message}&rdquo;
                          </div>
                          <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono pt-0.5">
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
                <div className="text-[9px] text-amber-400/90 font-mono">
                  🔒 {routeData.dualStreamIntelligence.government_authorized_data.official_summary}
                </div>
              </div>

              {/* Stream 2: Internet Live Intelligence (Electric Cyan / Sky Blue Tinted Card) */}
              <div className="p-3 rounded-xl bg-sky-950/20 border border-sky-500/30 text-sky-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-sky-300 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-sky-400" />
                    Stream 2: Internet Live Intelligence
                  </span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-sky-900/60 text-sky-200 border border-sky-700/60 uppercase font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                    Web Grounded
                  </span>
                </div>

                <div className="bg-slate-950/90 p-2.5 rounded-lg border border-sky-900/50 text-[11px] space-y-2 text-slate-200">
                  <div>
                    <span className="text-[9px] font-bold uppercase text-sky-400 block mb-0.5">
                      🌦️ Live Weather Bulletin:
                    </span>
                    <p className="text-sky-100 text-[10px] leading-relaxed">
                      {routeData.dualStreamIntelligence.internet_live_intelligence.weather_advisory}
                    </p>
                  </div>

                  <div>
                    <span className="text-[9px] font-bold uppercase text-sky-400 block mb-0.5">
                      🚗 Real-Time Highway Movement:
                    </span>
                    <p className="text-sky-100 text-[10px] leading-relaxed">
                      {routeData.dualStreamIntelligence.internet_live_intelligence.live_traffic_status}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-sky-300/80 pt-1.5 border-t border-slate-800 font-mono">
                    <span className="truncate max-w-[200px]">
                      Sources: {routeData.dualStreamIntelligence.internet_live_intelligence.sources.join(', ')}
                    </span>
                    <span className="shrink-0 text-sky-400">Gemini Live Grounding</span>
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
            <div className="bg-slate-900/90 dark:bg-[#070b16] p-3.5 rounded-xl border border-slate-700/80 border-t-4 border-t-indigo-500 space-y-2.5 text-xs shadow-md">
              <div className="font-bold text-slate-200 flex items-center justify-between text-[11px] pb-1.5 border-b border-slate-800">
                <span>AI Corridor Comparison & Elevation Factor</span>
                <span className="text-emerald-400 font-mono font-bold">
                  +{deltaDistance} km ({deltaTime > 0 ? `+${deltaTime}m` : '0m'})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Primary stats (High-visibility Crimson Alert Container) */}
                <div
                  onClick={() => onSelectRouteView('PRIMARY')}
                  className={`p-2.5 rounded-xl border cursor-pointer transition ${
                    activeRouteView === 'PRIMARY'
                      ? 'border-rose-500 bg-rose-950/40 text-rose-200 ring-1 ring-rose-500 shadow-md shadow-rose-950/50'
                      : 'border-rose-500/50 bg-rose-950/30 text-rose-200 hover:border-rose-500/80 hover:bg-rose-950/40'
                  }`}
                >
                  <div className="text-[10px] text-rose-300 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                    Primary (Compromised)
                  </div>
                  <div className="font-bold text-white text-sm mt-0.5 font-mono">
                    {primary.distance_km} km
                  </div>
                  <div className="text-[10px] text-rose-200 font-medium">
                    ETA: {primaryETA.etaString}
                  </div>
                  {primaryETA.delayBufferMinutes > 0 && (
                    <div className="text-[9px] text-rose-300/80 font-mono">
                      +{primaryETA.delayBufferMinutes}m terrain delay
                    </div>
                  )}
                </div>

                {/* Detour stats (High-visibility Emerald Green Safety Container) */}
                <div
                  onClick={() => onSelectRouteView('DETOUR')}
                  className={`p-2.5 rounded-xl border cursor-pointer transition ${
                    activeRouteView === 'DETOUR'
                      ? 'border-emerald-500 bg-emerald-950/50 text-emerald-200 ring-1 ring-emerald-500 shadow-md shadow-emerald-950/50'
                      : 'border-emerald-500/50 bg-emerald-950/30 text-emerald-200 hover:border-emerald-500/80 hover:bg-emerald-950/40'
                  }`}
                >
                  <div className="text-[10px] text-emerald-300 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Safe Detour (Verified)
                  </div>
                  <div className="font-bold text-emerald-300 text-sm mt-0.5 font-mono">
                    {detour.distance_km} km
                  </div>
                  <div className="text-[10px] text-emerald-200 font-medium">
                    ETA: {detourETA.etaString}
                  </div>
                  {detourETA.delayBufferMinutes > 0 && (
                    <div className="text-[9px] text-emerald-300/80 font-mono">
                      +{detourETA.delayBufferMinutes}m terrain delay
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
