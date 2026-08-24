'use client';

import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  SupplyHub,
  RoadDisruption,
  DisasterResilientRouteResponse,
  LiveJourney,
} from '@/types';
import { BASELINE_SUPPLY_HUBS, BASELINE_DISRUPTIONS } from '@/lib/supabaseClient';
import { useTheme } from '@/context/ThemeContext';
import { useGps } from '@/context/LocationContext';
import {
  Building2,
  AlertTriangle,
  Flame,
  Waves,
  ShieldAlert,
  Navigation,
  Compass,
  MapPin,
  Sparkles,
  Truck,
  Maximize2,
  Minimize2,
  Plus,
  Minus,
  RotateCcw,
  LocateFixed,
  ChevronDown,
  Layers,
} from 'lucide-react';
import LiveNavigationHUD, { ThreatAlertData } from '@/components/Navigation/LiveNavigationHUD';

// Helper component to trigger Leaflet tile re-render on resize / full-screen toggle
function MapResizer({ isFullscreen }: { isFullscreen: boolean }) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 300);
    const t3 = setTimeout(() => map.invalidateSize(), 600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isFullscreen, map]);

  return null;
}

// Unified Vertical Floating Glass Toolbar on Left Edge
function UnifiedMapToolbar({
  isFullscreen,
  onToggleFullscreen,
  userLocation,
  isGpsEnabled,
  onRecenterGps,
}: {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  userLocation?: [number, number] | null;
  isGpsEnabled?: boolean;
  onRecenterGps?: () => void;
}) {
  const map = useMap();

  return (
    <div
      className="absolute top-4 left-4 z-[9999] flex flex-col rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-slate-700/60 bg-[#070f1e]/85 backdrop-blur-xl transition-all duration-200 pointer-events-auto select-none divide-y divide-slate-800/80"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Zoom In */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          map.zoomIn();
        }}
        className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-white hover:bg-cyan-500/20 active:bg-cyan-500/40 transition"
        title="Zoom In (+)"
        aria-label="Zoom In"
      >
        <Plus className="w-4 h-4" />
      </button>

      {/* Zoom Out */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          map.zoomOut();
        }}
        className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-white hover:bg-cyan-500/20 active:bg-cyan-500/40 transition"
        title="Zoom Out (−)"
        aria-label="Zoom Out"
      >
        <Minus className="w-4 h-4" />
      </button>

      {/* Recenter on GPS */}
      {isGpsEnabled && userLocation && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            map.setView(userLocation, 14, { animate: true });
            onRecenterGps?.();
          }}
          className="w-9 h-9 flex items-center justify-center text-cyan-400 hover:text-cyan-200 hover:bg-cyan-500/20 active:bg-cyan-500/40 transition"
          title="Recenter on My Live GPS Vehicle"
          aria-label="Recenter GPS"
        >
          <LocateFixed className="w-4 h-4" />
        </button>
      )}

      {/* Reset Region View */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          map.setView([26.1445, 92.5], 7, { animate: true });
        }}
        className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white hover:bg-cyan-500/20 active:bg-cyan-500/40 transition"
        title="Reset Northeast Regional Corridor View"
        aria-label="Reset Region View"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>

      {/* Fullscreen Toggle */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleFullscreen();
        }}
        className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:bg-cyan-500/20 active:bg-cyan-500/40 transition"
        title={isFullscreen ? 'Exit Full Screen (ESC)' : 'Expand Map Full Screen'}
        aria-label="Toggle Full Screen"
      >
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>
    </div>
  );
}

// Collapsible Bottom-Right Floating Glass Corridor Legend
function CollapsibleCorridorLegend({
  hubsCount,
  disruptionsCount,
  liveJourneysCount,
  routeData,
  selectedRouteIndex,
  onSelectCandidateRoute,
}: {
  hubsCount: number;
  disruptionsCount: number;
  liveJourneysCount: number;
  routeData: DisasterResilientRouteResponse | null;
  selectedRouteIndex?: number;
  onSelectCandidateRoute?: (index: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="absolute bottom-4 right-4 z-[9999] pointer-events-auto select-none max-w-xs transition-all duration-300"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-[#070f1e]/85 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] overflow-hidden text-xs text-slate-200">
        {/* Toggle Pill Header */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-2.5 px-3.5 py-2 text-slate-300 hover:text-white hover:bg-slate-800/40 transition font-bold"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-[11px] uppercase tracking-wider font-mono text-cyan-300">
              Corridor Telemetry
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800/60 px-1.5 py-0.2 rounded font-mono">
              {hubsCount} Hubs
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {/* Collapsible Content */}
        {isOpen && (
          <div className="p-3 pt-1 space-y-2 border-t border-slate-800/80 animate-in slide-in-from-bottom-2 duration-200">
            <div className="space-y-1.5 text-[11px] text-slate-300">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block border border-white/40 shadow-sm shadow-blue-500"></span>
                  <span>Strategic Hubs</span>
                </span>
                <span className="font-mono text-slate-400">{hubsCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block border border-white/40 animate-pulse shadow-sm shadow-red-500"></span>
                  <span>Active Hazards</span>
                </span>
                <span className="font-mono text-rose-400 font-bold">{disruptionsCount}</span>
              </div>
              {liveJourneysCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block border border-white/40 shadow-sm shadow-cyan-400"></span>
                    <span>Driver Convoys</span>
                  </span>
                  <span className="font-mono text-cyan-300">{liveJourneysCount}</span>
                </div>
              )}
            </div>

            {/* Candidate Route Selectors if available */}
            {routeData?.candidateRoutes && routeData.candidateRoutes.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">
                  Active Corridors:
                </span>
                {routeData.candidateRoutes.map((c, idx) => {
                  const isSelected =
                    (selectedRouteIndex ?? routeData.selectedRouteIndex ?? 0) === idx;
                  const palette = ['#06b6d4', '#10b981', '#a855f7', '#f59e0b'];
                  const color =
                    c.is_compromised && isSelected
                      ? '#ef4444'
                      : c.color || palette[idx % palette.length];

                  return (
                    <div
                      key={`legend-corridor-${idx}`}
                      onClick={() => onSelectCandidateRoute?.(idx)}
                      className={`flex items-center justify-between gap-1.5 cursor-pointer px-2 py-1 rounded-lg transition ${
                        isSelected
                          ? 'bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 font-bold'
                          : 'hover:bg-slate-800/50 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="w-3 h-1.5 rounded shrink-0"
                          style={{ backgroundColor: color }}
                        ></span>
                        <span className="truncate text-[10px]">
                          {c.title.split('(')[0].trim()}
                        </span>
                      </div>
                      {isSelected && (
                        <span className="text-[8px] bg-cyan-800 text-cyan-100 px-1 rounded uppercase font-mono">
                          Active
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Map Controller for Camera Center, Follow Mode & FitBounds
function MapController({
  center,
  zoom,
  routeCoordinates,
  userLocation,
  isNavigating,
  followMode,
}: {
  center: [number, number];
  zoom: number;
  routeCoordinates?: [number, number][];
  userLocation?: [number, number] | null;
  isNavigating?: boolean;
  followMode?: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    try {
      if (
        userLocation &&
        !isNaN(userLocation[0]) &&
        !isNaN(userLocation[1]) &&
        (isNavigating || followMode)
      ) {
        map.panTo([userLocation[0], userLocation[1]], { animate: true, duration: 0.8 });
        return;
      }

      if (routeCoordinates && routeCoordinates.length > 1) {
        const valid = routeCoordinates.filter(
          (c) => Array.isArray(c) && c.length >= 2 && !isNaN(c[0]) && !isNaN(c[1])
        );
        if (valid.length > 1) {
          const bounds = L.latLngBounds(
            valid.map((c) => [c[1], c[0]] as [number, number])
          );
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
            return;
          }
        }
      }
      if (center && !isNaN(center[0]) && !isNaN(center[1])) {
        map.setView(center, zoom);
      }
    } catch (err) {
      console.warn('MapController camera update warning:', err);
    }
  }, [center, zoom, routeCoordinates, userLocation, isNavigating, followMode, map]);

  return null;
}

// Map Click Handler for Hazard Simulation
function MapSimulationClickHandler({
  isSimulating,
  onMapClick,
}: {
  isSimulating: boolean;
  onMapClick?: (coords: { latitude: number; longitude: number }) => void;
}) {
  useMapEvents({
    click(e) {
      if (isSimulating && onMapClick) {
        onMapClick({
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
        });
      }
    },
  });

  return null;
}

interface MapClientProps {
  hubs: SupplyHub[];
  disruptions: RoadDisruption[];
  selectedHub: SupplyHub | null;
  originHub: SupplyHub | null;
  destHub: SupplyHub | null;
  routeData: DisasterResilientRouteResponse | null;
  activeRouteView?: 'PRIMARY' | 'DETOUR' | 'BOTH';
  selectedRouteIndex?: number;
  showDisruptions?: boolean;
  showHubs?: boolean;
  showBuffers?: boolean;
  isSimulatingHazard?: boolean;
  isGpsEnabled?: boolean;
  userLocation?: [number, number] | null;
  accuracy?: number;
  heading?: number | null;
  speed?: number | null;
  isTracking?: boolean;
  isNavigating?: boolean;
  followMode?: boolean;
  isSimulated?: boolean;
  threatAlert?: ThreatAlertData | null;
  onSelectHub?: (hub: SupplyHub) => void;
  onSetOrigin?: (hub: SupplyHub) => void;
  onSetDestination?: (hub: SupplyHub) => void;
  onSelectCandidateRoute?: (index: number) => void;
  onMapClickSimulate?: (coords: { latitude: number; longitude: number }) => void;
  onToggleFollowMode?: () => void;
  onExitNavigation?: () => void;
  onAcceptDetour?: () => void;
  onDismissThreatAlert?: () => void;
  onToggleSimulation?: () => void;
}

export default function MapClient({
  hubs,
  disruptions,
  selectedHub,
  originHub,
  destHub,
  routeData,
  activeRouteView = 'BOTH',
  selectedRouteIndex,
  showDisruptions = true,
  showHubs = true,
  showBuffers = true,
  isSimulatingHazard = false,
  isGpsEnabled = false,
  userLocation,
  accuracy = 15,
  heading,
  speed,
  isTracking = false,
  isNavigating = false,
  followMode = true,
  isSimulated = false,
  threatAlert,
  onSelectHub,
  onSetOrigin,
  onSetDestination,
  onSelectCandidateRoute,
  onMapClickSimulate,
  onToggleFollowMode,
  onExitNavigation,
  onAcceptDetour,
  onDismissThreatAlert,
  onToggleSimulation,
}: MapClientProps) {
  const { theme } = useTheme();
  const gps = useGps();
  const isDark = theme !== 'light';

  // Tile layer URL: CartoDB Dark Matter for Dark Mode, CartoDB Positron for Light Mode
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png';

  const safeHubs = useMemo(() => {
    return hubs && hubs.length > 0 ? hubs : BASELINE_SUPPLY_HUBS;
  }, [hubs]);

  const safeDisruptions = useMemo(() => {
    return disruptions && disruptions.length > 0 ? disruptions : BASELINE_DISRUPTIONS;
  }, [disruptions]);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && L && L.Icon && L.Icon.Default) {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });
      }
    } catch (e) {
      console.warn('Leaflet icon init notice:', e);
    }
  }, []);

  const defaultCenter: [number, number] = [26.1445, 92.5];
  const defaultZoom = 7;

  // Custom DivIcon for Supply Hubs
  const createHubIcon = (hub: SupplyHub) => {
    const isOrigin = originHub?.id === hub.id;
    const isDest = destHub?.id === hub.id;
    const isSelected = selectedHub?.id === hub.id;

    let bgGradient = 'from-blue-600 to-indigo-700 border-blue-400 text-white';
    let ringClass = 'shadow-blue-500/20';

    if (isOrigin) {
      bgGradient = 'from-emerald-500 to-teal-600 border-emerald-300 text-white';
      ringClass = 'ring-4 ring-emerald-500/40 animate-pulse shadow-emerald-500/30';
    } else if (isDest) {
      bgGradient = 'from-rose-500 to-red-700 border-rose-300 text-white';
      ringClass = 'ring-4 ring-rose-500/40 animate-pulse shadow-rose-500/30';
    } else if (isSelected) {
      bgGradient = 'from-cyan-500 to-blue-600 border-white text-white';
      ringClass = 'ring-2 ring-cyan-400 shadow-cyan-500/30';
    }

    const html = `
      <div class="relative flex items-center justify-center">
        <div class="w-8 h-8 rounded-xl bg-gradient-to-br ${bgGradient} flex items-center justify-center border-2 shadow-xl ${ringClass} transition-transform hover:scale-110">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
            <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
            <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
          </svg>
        </div>
        <span class="absolute -bottom-5 whitespace-nowrap text-[9px] font-mono font-bold bg-[#070f1e]/90 text-slate-200 px-1.5 py-0.5 rounded-md shadow-md border border-slate-700/80 pointer-events-none">
          ${hub.name.split(' ')[0]}
        </span>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-hub-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -18],
    });
  };

  // Custom DivIcon for Road Disruptions
  const createDisruptionIcon = (d: RoadDisruption) => {
    const isCompromisingRoute = routeData?.intersectedHazards?.some(
      (h) => h.disruption.id === d.id
    );

    let color = 'bg-amber-500 text-slate-900 border-amber-300';
    let pulse = isCompromisingRoute ? 'hazard-pulse-critical' : '';

    if (d.is_simulated) {
      color = 'bg-purple-600 text-white border-purple-300';
      pulse = 'hazard-pulse-critical';
    } else if (d.severity === 'CRITICAL' || isCompromisingRoute) {
      color = 'bg-red-600 text-white border-red-300';
    } else if (d.severity === 'HIGH') {
      color = 'bg-orange-500 text-white border-orange-300';
    } else if (d.severity === 'MEDIUM') {
      color = 'bg-amber-500 text-slate-950 border-amber-300';
    }

    const html = `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-8 h-8 rounded-full ${color} opacity-40 ${pulse}"></div>
        <div class="w-7 h-7 rounded-full flex items-center justify-center border-2 shadow-lg ${color} z-10 transition-transform hover:scale-110">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <path d="M12 9v4"/>
            <path d="M12 17h.01"/>
          </svg>
        </div>
        ${
          d.is_simulated
            ? '<span class="absolute -top-4 text-[8px] bg-purple-900 text-purple-200 px-1 rounded font-bold uppercase border border-purple-600">Sim</span>'
            : ''
        }
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-disruption-icon',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
    });
  };

  // Custom DivIcon for Bypass Waypoint
  const createBypassIcon = () => {
    const html = `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-7 h-7 rounded-full bg-emerald-500/40 animate-ping"></div>
        <div class="w-7 h-7 rounded-full bg-emerald-500 border-2 border-white text-white shadow-xl flex items-center justify-center font-bold text-xs">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 19 21 12 17 5 21 12 2"/>
          </svg>
        </div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-bypass-icon',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
    });
  };

  // Custom DivIcon for Live GPS Vehicle / User Location
  const createUserGpsIcon = (headingDeg: number | null) => {
    const hasHeading = headingDeg !== null && !isNaN(headingDeg);
    const html = `
      <div class="relative flex items-center justify-center w-8 h-8 pointer-events-none">
        <div class="absolute w-8 h-8 rounded-full bg-cyan-500/35 animate-ping"></div>
        <div class="absolute w-6 h-6 rounded-full bg-cyan-400/40 animate-pulse"></div>
        <div class="w-5 h-5 rounded-full bg-cyan-500 border-2 border-white shadow-xl flex items-center justify-center text-white" style="${
          hasHeading ? `transform: rotate(${headingDeg}deg);` : ''
        }">
          <svg class="w-3 h-3 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polygon points="12 2 19 21 12 17 5 21 12 2"/>
          </svg>
        </div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-user-gps-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
  };

  // Custom DivIcon for Live Driver Telemetry Convoy Marker
  const createJourneyDriverIcon = (j: LiveJourney) => {
    const html = `
      <div class="relative flex items-center justify-center">
        <div class="w-7 h-7 rounded-full flex items-center justify-center border-2 shadow-xl bg-cyan-500 border-cyan-200 text-white ring-2 ring-cyan-400/50 transition-transform hover:scale-125">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
            <path d="M15 18H9"/>
            <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
            <circle cx="17" cy="18" r="2"/>
            <circle cx="7" cy="18" r="2"/>
          </svg>
        </div>
        <span class="absolute -bottom-4 whitespace-nowrap text-[8px] font-mono font-bold bg-[#070f1e]/90 text-cyan-200 px-1 rounded shadow-md border border-cyan-800 pointer-events-none">
          ${(j.driver_name || 'Driver').split(' ')[0]}
        </span>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-journey-icon',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
    });
  };

  const getDisruptionTypeIcon = (type: string) => {
    switch (type) {
      case 'LANDSLIDE':
        return <Flame className="w-4 h-4 text-amber-500" />;
      case 'FLOOD':
        return <Waves className="w-4 h-4 text-blue-500" />;
      case 'ROADBLOCK':
      case 'BRIDGE_COLLAPSE':
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
    }
  };

  const getBufferColor = (d: RoadDisruption) => {
    if (d.is_simulated) return '#a855f7';
    if (d.severity === 'CRITICAL') return '#ef4444';
    if (d.severity === 'HIGH') return '#f97316';
    if (d.severity === 'MEDIUM') return '#eab308';
    return '#3b82f6';
  };

  const primaryPositions = useMemo<[number, number][]>(() => {
    if (!routeData?.primaryRoute?.geometry?.coordinates) return [];
    return routeData.primaryRoute.geometry.coordinates.map(
      (c) => [c[1], c[0]] as [number, number]
    );
  }, [routeData]);

  const detourPositions = useMemo<[number, number][]>(() => {
    if (!routeData?.alternativeRoute?.geometry?.coordinates) return [];
    return routeData.alternativeRoute.geometry.coordinates.map(
      (c) => [c[1], c[0]] as [number, number]
    );
  }, [routeData]);

  const candidatePolylines = useMemo(() => {
    if (!routeData?.candidateRoutes || routeData.candidateRoutes.length === 0) return [];
    const palette = ['#06b6d4', '#10b981', '#a855f7', '#f59e0b', '#ec4899'];
    return routeData.candidateRoutes.map((c, idx) => {
      const positions = (c.geometry?.coordinates || []).map(
        (pt) => [pt[1], pt[0]] as [number, number]
      );
      return {
        ...c,
        positions,
        displayColor: c.color || palette[idx % palette.length],
      };
    });
  }, [routeData]);

  const combinedCoordinates = useMemo<[number, number][]>(() => {
    if (candidatePolylines.length > 0) {
      const selIdx = selectedRouteIndex ?? routeData?.selectedRouteIndex ?? 0;
      const target = candidatePolylines[selIdx] || candidatePolylines[0];
      return (target?.geometry?.coordinates || []).map((c) => [c[0], c[1]]);
    }
    const coords: [number, number][] = [];
    if (routeData?.primaryRoute?.geometry?.coordinates) {
      coords.push(...routeData.primaryRoute.geometry.coordinates);
    }
    if (routeData?.alternativeRoute?.geometry?.coordinates) {
      coords.push(...routeData.alternativeRoute.geometry.coordinates);
    }
    return coords;
  }, [routeData, candidatePolylines, selectedRouteIndex]);

  const [liveJourneys, setLiveJourneys] = useState<LiveJourney[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchJourneys = async () => {
      try {
        const res = await fetch('/api/telemetry/journey');
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.data) {
            setLiveJourneys(json.data);
          }
        }
      } catch (e) {}
    };

    fetchJourneys();
    const interval = setInterval(fetchJourneys, 12000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = useCallback(() => {
    const elem = mapContainerRef.current;
    if (!elem) return;

    const doc = document as any;
    const isCurrentlyFullscreen = Boolean(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );

    if (!isCurrentlyFullscreen) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch((err) => {
          console.warn(`Fullscreen error: ${err.message}`);
          setIsFullscreen(true);
        });
      } else if ((elem as any).webkitRequestFullscreen) {
        (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).mozRequestFullScreen) {
        (elem as any).mozRequestFullScreen();
      } else if ((elem as any).msRequestFullscreen) {
        (elem as any).msRequestFullscreen();
      } else {
        // Fallback: CSS full-screen mode
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => console.warn(`Exit fullscreen error: ${err.message}`));
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      const isFs = Boolean(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
      setIsFullscreen(isFs);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  const mapCenter = useMemo<[number, number]>(() => {
    if (selectedHub) return [selectedHub.latitude, selectedHub.longitude];
    return defaultCenter;
  }, [selectedHub]);

  return (
    <div
      ref={mapContainerRef}
      className={`transition-all duration-300 relative ${
        isFullscreen
          ? 'fixed inset-0 z-[99999] w-screen h-screen bg-slate-950 m-0 p-0 rounded-none border-0'
          : `isolate z-0 w-full h-full min-h-[520px] rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 ${
              isSimulatingHazard ? 'cursor-crosshair ring-2 ring-purple-500/80' : ''
            }`
      }`}
    >
      {/* GPS Inactive / Permission Prompt Banner */}
      {(!isGpsEnabled || !userLocation || gps.hasUserGrantedPermission !== 'granted') && (
        <div className="absolute top-4 left-16 z-[999] bg-slate-900/90 dark:bg-slate-900/95 border border-cyan-500/40 text-slate-100 px-3.5 py-1.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-2.5">
          <LocateFixed className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-[11px] font-medium text-slate-200 hidden sm:inline">
            {gps.hasUserGrantedPermission === 'denied'
              ? 'Browser GPS permission blocked'
              : 'Live GPS is inactive'}
          </span>
          <button
            type="button"
            onClick={() => gps.enableGps()}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-2.5 py-1 rounded-xl text-xs font-bold font-mono transition flex items-center gap-1 shadow-sm"
          >
            <LocateFixed className="w-3 h-3" />
            <span>Enable Device GPS</span>
          </button>
        </div>
      )}

      {/* Hazard Simulation Floating Tactical Pill */}
      {isSimulatingHazard && (
        <div className="absolute top-4 right-16 z-[9999] bg-purple-950/90 border border-purple-400/60 text-purple-200 px-3.5 py-1.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-1.5 text-xs font-mono font-bold animate-pulse pointer-events-none select-none">
          <Sparkles className="w-3.5 h-3.5 text-purple-300" />
          <span>Click anywhere to inject hazard</span>
        </div>
      )}

      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        zoomControl={false}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        style={{
          height: '100%',
          width: '100%',
          backgroundColor: isDark ? '#040914' : '#f8fafc',
        }}
      >
        <MapResizer isFullscreen={isFullscreen} />

        {/* High-Definition Theme CartoDB Tile Layer */}
        <TileLayer
          key={tileUrl}
          attribution='&copy; <a href="https://carto.com/">CARTO</a> | OSM Contributors'
          url={tileUrl}
          maxZoom={19}
        />

        <MapController
          center={mapCenter}
          zoom={selectedHub ? 9 : defaultZoom}
          routeCoordinates={combinedCoordinates}
          userLocation={userLocation}
          isNavigating={isNavigating}
          followMode={followMode}
        />

        {/* Unified Vertical Left Floating Glass Toolbar */}
        <UnifiedMapToolbar
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          userLocation={userLocation}
          isGpsEnabled={isGpsEnabled}
          onRecenterGps={onToggleFollowMode}
        />

        <MapSimulationClickHandler
          isSimulating={isSimulatingHazard}
          onMapClick={onMapClickSimulate}
        />

        {/* 1. Multi-Route Candidate Corridors with Neon Glow Buffer */}
        {candidatePolylines.length > 0 ? (
          candidatePolylines.map((c, idx) => {
            const isSelected =
              (selectedRouteIndex ?? routeData?.selectedRouteIndex ?? 0) === idx;
            const isCompromised = c.is_compromised;
            const evalData = c.ai_evaluation;
            const riskLevel =
              evalData?.risk_level ||
              (isCompromised ? 'CRITICAL' : idx === 1 ? 'LOW' : 'MEDIUM');
            const baseColor =
              isCompromised && isSelected ? '#ef4444' : c.displayColor;

            return (
              <React.Fragment key={`candidate-neon-route-${idx}`}>
                {/* Neon Glow Buffer Layer */}
                <Polyline
                  positions={c.positions}
                  pathOptions={{
                    color: baseColor,
                    weight: isSelected ? 11 : 6,
                    opacity: isSelected ? 0.35 : 0.15,
                  }}
                />
                {/* Sharp Core Polyline */}
                <Polyline
                  positions={c.positions}
                  eventHandlers={{
                    click: () => onSelectCandidateRoute?.(idx),
                  }}
                  pathOptions={{
                    color: isCompromised ? '#ef4444' : baseColor,
                    weight: isSelected ? 5 : 3.5,
                    opacity: isSelected ? 0.95 : 0.6,
                    dashArray: isCompromised ? '8, 8' : undefined,
                  }}
                >
                  <Popup>
                    <div className="p-2 text-xs text-slate-100 min-w-[200px]">
                      <div className="flex items-center justify-between font-bold border-b border-slate-700 pb-1 mb-1">
                        <span className="text-cyan-400">{c.title}</span>
                        {isSelected && (
                          <span className="text-[9px] bg-cyan-900 text-cyan-200 px-1 rounded uppercase font-bold">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-300 space-y-0.5">
                        <div>
                          Distance: <span className="font-semibold text-white">{c.distance_km} km</span>
                        </div>
                        <div>
                          Est Duration: <span className="font-semibold text-white">{Math.round(c.duration_minutes)} min</span>
                        </div>
                        <div>
                          Risk Level: <span className={`font-bold ${riskLevel === 'CRITICAL' || riskLevel === 'HIGH' ? 'text-red-400' : 'text-emerald-400'}`}>{riskLevel}</span>
                        </div>
                      </div>
                      {!isSelected && onSelectCandidateRoute && (
                        <button
                          onClick={() => onSelectCandidateRoute(idx)}
                          className="mt-2 w-full py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[10px] font-bold transition shadow"
                        >
                          Select This Corridor
                        </button>
                      )}
                    </div>
                  </Popup>
                </Polyline>
              </React.Fragment>
            );
          })
        ) : (
          <>
            {/* Direct Dual Primary / Detour Corridors */}
            {primaryPositions.length > 0 && (activeRouteView === 'PRIMARY' || activeRouteView === 'BOTH') && (
              <>
                {/* Glow */}
                <Polyline
                  positions={primaryPositions}
                  pathOptions={{
                    color: routeData?.isCompromised || routeData?.aiRiskData?.rerouted ? '#ef4444' : '#06b6d4',
                    weight: 11,
                    opacity: 0.35,
                  }}
                />
                {/* Core */}
                <Polyline
                  positions={primaryPositions}
                  pathOptions={{
                    color: routeData?.isCompromised || routeData?.aiRiskData?.rerouted ? '#dc2626' : '#06b6d4',
                    weight: 5,
                    opacity: 0.95,
                    dashArray: routeData?.isCompromised || routeData?.aiRiskData?.rerouted ? '8, 8' : undefined,
                  }}
                >
                  <Popup>
                    <div className="p-1 text-xs text-slate-100">
                      <div className="font-bold text-cyan-400">Primary Highway Corridor</div>
                      <div>Distance: {routeData?.primaryRoute?.distance_km} km</div>
                    </div>
                  </Popup>
                </Polyline>
              </>
            )}

            {detourPositions.length > 0 && (activeRouteView === 'DETOUR' || activeRouteView === 'BOTH') && (
              <>
                {/* Glow */}
                <Polyline
                  positions={detourPositions}
                  pathOptions={{
                    color: '#10b981',
                    weight: 11,
                    opacity: 0.35,
                  }}
                />
                {/* Core */}
                <Polyline
                  positions={detourPositions}
                  pathOptions={{
                    color: '#10b981',
                    weight: 5,
                    opacity: 0.95,
                  }}
                >
                  <Popup>
                    <div className="p-1 text-xs text-slate-100">
                      <div className="font-bold text-emerald-400">Disaster-Resilient Detour</div>
                      <div>Distance: {routeData?.alternativeRoute?.distance_km} km</div>
                    </div>
                  </Popup>
                </Polyline>
              </>
            )}
          </>
        )}

        {/* 2. Disruption Buffer Hazard Circles */}
        {showBuffers &&
          showDisruptions &&
          safeDisruptions.map((d) => (
            <Circle
              key={`buf-${d.id}`}
              center={[d.latitude, d.longitude]}
              radius={d.risk_radius_meters || 1000}
              pathOptions={{
                color: getBufferColor(d),
                fillColor: getBufferColor(d),
                fillOpacity: d.is_simulated ? 0.22 : 0.16,
                weight: 1.5,
                dashArray: '4, 4',
              }}
            />
          ))}

        {/* 3. Road Disruption Markers */}
        {showDisruptions &&
          safeDisruptions.map((d) => (
            <Marker
              key={`dis-${d.id}`}
              position={[d.latitude, d.longitude]}
              icon={createDisruptionIcon(d)}
            >
              <Popup>
                <div className="p-1 text-xs text-slate-100 min-w-[200px]">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    {getDisruptionTypeIcon(d.disruption_type)}
                    <span className="text-amber-400 truncate">{d.title}</span>
                  </div>
                  <div className="space-y-1 text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">Severity:</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${getSeverityBadgeClass(d.severity)}`}>
                        {d.severity}
                      </span>
                    </div>
                    {d.highway_reference && (
                      <div className="text-[10px] text-slate-400">
                        Highway: <span className="text-slate-200 font-semibold">{d.highway_reference}</span>
                      </div>
                    )}
                    <p className="text-[10px] text-slate-300 italic pt-1 border-t border-slate-800">
                      "{d.message || d.description}"
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* 4. Strategic Supply Hub Markers */}
        {showHubs &&
          safeHubs.map((hub) => (
            <Marker
              key={`hub-${hub.id}`}
              position={[hub.latitude, hub.longitude]}
              icon={createHubIcon(hub)}
              eventHandlers={{
                click: () => onSelectHub?.(hub),
              }}
            >
              <Popup>
                <div className="p-1.5 text-xs text-slate-100 min-w-[180px]">
                  <div className="font-black text-cyan-400 text-sm mb-1">{hub.name}</div>
                  <div className="text-[11px] text-slate-300 space-y-0.5">
                    <div>State: <span className="text-white font-semibold">{hub.state}</span></div>
                    <div>Capacity: <span className="text-white font-semibold">{hub.capacity_tonnes} tonnes</span></div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 pt-1 border-t border-slate-700">
                    {onSetOrigin && (
                      <button
                        onClick={() => onSetOrigin(hub)}
                        className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px]"
                      >
                        Set Origin
                      </button>
                    )}
                    {onSetDestination && (
                      <button
                        onClick={() => onSetDestination(hub)}
                        className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px]"
                      >
                        Set Dest
                      </button>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* 5. Live Convoy Fleet Markers */}
        {liveJourneys.map((j) => (
          <Marker
            key={`journey-${j.id}`}
            position={[j.current_lat, j.current_lng]}
            icon={createJourneyDriverIcon(j)}
          >
            <Popup>
              <div className="p-1 text-xs text-slate-100 min-w-[160px]">
                <div className="font-bold text-cyan-400">{j.driver_name}</div>
                {j.speed_kmh !== undefined && (
                  <div className="text-[10px] text-slate-300">Speed: {j.speed_kmh} km/h</div>
                )}
                {j.origin_hub && j.destination_hub && (
                  <div className="text-[10px] text-slate-400">
                    Route: {j.origin_hub} → {j.destination_hub}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 6. Live User / Convoy GPS Radar Marker */}
        {isGpsEnabled && userLocation && !isNaN(userLocation[0]) && !isNaN(userLocation[1]) && (
          <>
            <Circle
              center={userLocation}
              radius={accuracy || 15}
              pathOptions={{
                color: '#06b6d4',
                fillColor: '#22d3ee',
                fillOpacity: 0.2,
                weight: 1.5,
              }}
            />
            <Marker
              position={userLocation}
              icon={createUserGpsIcon(heading ?? null)}
              zIndexOffset={2000}
            >
              <Popup>
                <div className="p-1.5 text-xs text-slate-100 min-w-[170px]">
                  <div className="flex items-center gap-1.5 font-bold text-cyan-300 mb-1">
                    <Navigation className="w-3.5 h-3.5" />
                    <span>My Live Vehicle Position</span>
                  </div>
                  <div className="text-[11px] text-slate-300 space-y-0.5">
                    <div>Coords: {userLocation[0].toFixed(4)}°, {userLocation[1].toFixed(4)}°</div>
                    <div>Accuracy: ±{Math.round(accuracy || 15)}m</div>
                    {speed !== null && speed !== undefined && (
                      <div className="text-emerald-400 font-mono font-semibold">Speed: {speed} km/h</div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>

      {/* Live Turn-by-Turn Navigation HUD Overlay */}
      <LiveNavigationHUD
        isNavigating={Boolean(isNavigating)}
        destinationName={destHub?.name || 'Destination'}
        remainingDistanceKm={
          routeData?.candidateRoutes?.[selectedRouteIndex ?? 0]?.distance_km ||
          routeData?.primaryRoute?.distance_km ||
          0
        }
        remainingDurationMinutes={
          routeData?.candidateRoutes?.[selectedRouteIndex ?? 0]?.duration_minutes ||
          routeData?.primaryRoute?.duration_minutes ||
          0
        }
        currentSpeedKmh={speed ?? (isNavigating ? 50 : 0)}
        heading={heading ?? null}
        followMode={Boolean(followMode)}
        isSimulated={Boolean(isSimulated)}
        threatAlert={threatAlert ?? null}
        onExitNavigation={onExitNavigation || (() => {})}
        onToggleFollowMode={onToggleFollowMode || (() => {})}
        onAcceptDetour={onAcceptDetour || (() => {})}
        onDismissThreatAlert={onDismissThreatAlert || (() => {})}
        onToggleSimulation={onToggleSimulation}
      />

      {/* Collapsible Floating Bottom-Right Corridor Legend */}
      <CollapsibleCorridorLegend
        hubsCount={hubs.length}
        disruptionsCount={disruptions.length}
        liveJourneysCount={liveJourneys.length}
        routeData={routeData}
        selectedRouteIndex={selectedRouteIndex}
        onSelectCandidateRoute={onSelectCandidateRoute}
      />
    </div>
  );
}
