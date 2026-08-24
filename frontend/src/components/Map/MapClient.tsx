'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
  ZoomControl,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  SupplyHub,
  RoadDisruption,
  DisasterResilientRouteResponse,
  RouteCalculationResult,
  LiveJourney,
} from '@/types';
import { BASELINE_SUPPLY_HUBS, BASELINE_DISRUPTIONS } from '@/lib/supabaseClient';
import {
  Building2,
  AlertTriangle,
  Flame,
  Waves,
  ShieldAlert,
  ShieldCheck,
  Navigation,
  Compass,
  CheckCircle2,
  MapPin,
  Sparkles,
  Truck,
  Maximize2,
  Minimize2,
  Plus,
  Minus,
  RotateCcw,
  LocateFixed,
} from 'lucide-react';
import LiveNavigationHUD, { ThreatAlertData } from '@/components/Navigation/LiveNavigationHUD';

// Custom Interactive Zoom Controls inside MapContainer
function CustomZoomControls() {
  const map = useMap();

  return (
    <div
      className="absolute bottom-16 left-4 z-[9999] flex flex-col rounded-lg overflow-hidden shadow-md border border-slate-300 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm transition-colors duration-200 pointer-events-auto select-none"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          map.zoomIn();
        }}
        className="w-7 h-7 flex items-center justify-center text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 transition-colors border-b border-slate-200 dark:border-slate-700 font-bold text-sm"
        title="Zoom in (+)"
        aria-label="Zoom in"
      >
        +
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          map.zoomOut();
        }}
        className="w-7 h-7 flex items-center justify-center text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 transition-colors border-b border-slate-200 dark:border-slate-700 font-bold text-sm"
        title="Zoom out (−)"
        aria-label="Zoom out"
      >
        −
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          map.setView([26.1445, 92.5], 7);
        }}
        className="w-7 h-7 flex items-center justify-center text-cyan-600 dark:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 transition-colors"
        title="Recenter Northeast Corridor View"
        aria-label="Recenter Regional View"
      >
        <RotateCcw className="w-3 h-3" />
      </button>
    </div>
  );
}

// Helper component to trigger Leaflet tile re-render on resize / full-screen toggle
function MapResizer({ isFullscreen }: { isFullscreen: boolean }) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    const t2 = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    const t3 = setTimeout(() => {
      map.invalidateSize();
    }, 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isFullscreen, map]);

  return null;
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
      if (isNavigating && followMode && userLocation && !isNaN(userLocation[0]) && !isNaN(userLocation[1])) {
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

// Map Recenter on Me Floating Action Button (FAB)
function MapRecenterControl({
  userLocation,
  onRecenter,
}: {
  userLocation?: [number, number] | null;
  onRecenter?: () => void;
}) {
  const map = useMap();
  if (!userLocation) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    map.setView(userLocation, 14, { animate: true });
    if (onRecenter) onRecenter();
  };

  return (
    <div
      className="absolute bottom-16 right-4 z-[9999] pointer-events-auto select-none"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={handleClick}
        className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-md flex items-center justify-center text-cyan-600 dark:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition"
        title="Recenter Map on Me"
      >
        <LocateFixed className="w-4 h-4" />
      </button>
    </div>
  );
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
  // Live GPS Tracking Props
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
  // Safe fallbacks to guarantee instant rendering even if API returns empty array
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

  // Center of North East India (Guwahati / Brahmaputra Valley)
  const defaultCenter: [number, number] = [26.1445, 92.5];
  const defaultZoom = 7;

  // Custom DivIcon for Supply Hubs
  const createHubIcon = (hub: SupplyHub) => {
    const isOrigin = originHub?.id === hub.id;
    const isDest = destHub?.id === hub.id;
    const isSelected = selectedHub?.id === hub.id;

    let bgClass = 'bg-blue-600 border-blue-400 text-white';
    let ringClass = '';

    if (isOrigin) {
      bgClass = 'bg-emerald-600 border-emerald-300 text-white';
      ringClass = 'ring-4 ring-emerald-500/40 animate-pulse';
    } else if (isDest) {
      bgClass = 'bg-rose-600 border-rose-300 text-white';
      ringClass = 'ring-4 ring-rose-500/40 animate-pulse';
    } else if (isSelected) {
      bgClass = 'bg-cyan-500 border-white text-white';
      ringClass = 'ring-2 ring-cyan-400';
    }

    const html = `
      <div class="relative flex items-center justify-center">
        <div class="w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-lg ${bgClass} ${ringClass} transition-transform hover:scale-110">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
            <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
            <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
            <path d="M10 6h4"/>
            <path d="M10 10h4"/>
            <path d="M10 14h4"/>
            <path d="M10 18h4"/>
          </svg>
        </div>
        <span class="absolute -bottom-5 whitespace-nowrap text-[10px] font-semibold bg-slate-900/90 text-slate-200 px-1.5 py-0.5 rounded shadow border border-slate-700 pointer-events-none">
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

  // Custom DivIcon for Road Disruptions (Regular vs Simulated)
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
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
          ${
            hasHeading
              ? `<svg class="w-3 h-3 fill-current text-white" viewBox="0 0 24 24"><polygon points="12,2 22,22 12,17 2,22" /></svg>`
              : `<div class="w-1.5 h-1.5 rounded-full bg-white"></div>`
          }
        </div>
      </div>
    `;
    return L.divIcon({
      html,
      className: 'custom-live-gps-user-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  const [liveJourneys, setLiveJourneys] = React.useState<LiveJourney[]>([]);

  // Periodically fetch active live journeys from backend telemetry
  useEffect(() => {
    const fetchJourneys = async () => {
      try {
        const res = await fetch('/api/telemetry/journey');
        if (res.ok) {
          const data = await res.json();
          setLiveJourneys(data);
        }
      } catch (err) {
        console.warn('Telemetry fetch error:', err);
      }
    };

    fetchJourneys();
    const interval = setInterval(fetchJourneys, 8000);
    return () => clearInterval(interval);
  }, []);

  // Custom DivIcon for Live Driver Telemetry Convoy
  const createJourneyIcon = (journey: LiveJourney) => {
    const html = `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-8 h-8 rounded-full bg-cyan-400/30 animate-ping"></div>
        <div class="w-7 h-7 rounded-full bg-cyan-600 border-2 border-white text-white shadow-xl flex items-center justify-center font-bold text-xs">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="1" y="3" width="15" height="13"/>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
            <circle cx="5.5" cy="18.5" r="2.5"/>
            <circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
        </div>
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

  // Convert Candidate Corridors to Leaflet polyline sets
  const candidatePolylines = useMemo(() => {
    if (!routeData?.candidateRoutes || routeData.candidateRoutes.length === 0) return [];
    return routeData.candidateRoutes.map((c, idx) => {
      const positions = (c.geometry?.coordinates || []).map(
        (pt) => [pt[1], pt[0]] as [number, number]
      );
      return {
        ...c,
        positions,
        index: idx,
      };
    });
  }, [routeData]);

  // Convert Primary Route GeoJSON [[lon, lat], ...] to Leaflet [[lat, lon], ...]
  const primaryPositions = useMemo(() => {
    if (routeData?.primaryRoute?.geometry?.coordinates && routeData.primaryRoute.geometry.coordinates.length > 0) {
      return routeData.primaryRoute.geometry.coordinates.map(
        (c) => [c[1], c[0]] as [number, number]
      );
    }
    if (routeData?.aiRiskData?.route_geometry?.coordinates && routeData.aiRiskData.route_geometry.coordinates.length > 0) {
      return routeData.aiRiskData.route_geometry.coordinates.map(
        (c) => [c[1], c[0]] as [number, number]
      );
    }
    return [];
  }, [routeData]);

  // Convert Alternative Detour Route GeoJSON [[lon, lat], ...] to Leaflet [[lat, lon], ...]
  const detourPositions = useMemo(() => {
    if (!routeData?.alternativeRoute?.geometry?.coordinates) return [];
    return routeData.alternativeRoute.geometry.coordinates.map(
      (c) => [c[1], c[0]] as [number, number]
    );
  }, [routeData]);

  // Combined bounds for camera fit
  const combinedCoordinates = useMemo(() => {
    if (candidatePolylines.length > 0) {
      const allCoords: [number, number][] = [];
      for (const c of routeData!.candidateRoutes!) {
        if (c.geometry?.coordinates) {
          allCoords.push(...c.geometry.coordinates);
        }
      }
      if (allCoords.length > 0) return allCoords;
    }
    if (activeRouteView === 'DETOUR' && routeData?.alternativeRoute) {
      return routeData.alternativeRoute.geometry.coordinates;
    }
    if (routeData?.alternativeRoute && primaryPositions.length > 0) {
      return [
        ...routeData.primaryRoute.geometry.coordinates,
        ...routeData.alternativeRoute.geometry.coordinates,
      ];
    }
    if (routeData?.primaryRoute?.geometry?.coordinates) {
      return routeData.primaryRoute.geometry.coordinates;
    }
    if (routeData?.aiRiskData?.route_geometry?.coordinates) {
      return routeData.aiRiskData.route_geometry.coordinates;
    }
    return undefined;
  }, [routeData, candidatePolylines, primaryPositions, activeRouteView]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Sync fullscreen state with HTML Fullscreen API events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = Boolean(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFs);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      const isFsActive = Boolean(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement
      );

      if (!isFsActive) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        } else if ((containerRef.current as any).mozRequestFullScreen) {
          await (containerRef.current as any).mozRequestFullScreen();
        } else {
          setIsFullscreen(true);
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else {
          setIsFullscreen(false);
        }
      }
    } catch (err) {
      console.warn('HTML Fullscreen API toggle fallback:', err);
      setIsFullscreen((prev) => !prev);
    }
  };

  // Keyboard shortcut: ESC to exit full screen fallback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Lock body scroll when in full screen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isFullscreen]);

  const mapCenter = useMemo<[number, number]>(() => {
    if (selectedHub) return [selectedHub.latitude, selectedHub.longitude];
    return defaultCenter;
  }, [selectedHub]);

  return (
    <div
      ref={containerRef}
      className={`transition-all duration-300 relative ${
        isFullscreen
          ? 'fixed inset-0 z-[99999] w-screen h-screen bg-slate-950 m-0 p-0 rounded-none border-0'
          : `isolate z-0 w-full h-full min-h-[520px] rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 ${
              isSimulatingHazard ? 'cursor-crosshair ring-2 ring-purple-500/80' : ''
            }`
      }`}
    >
      {/* Full-Screen Toggle Floating Control */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2">
        <button
          onClick={toggleFullscreen}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-lg backdrop-blur-md transition-all duration-150 border ${
            isFullscreen
              ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400/60 ring-2 ring-amber-400/40'
              : 'bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700'
          }`}
          title={isFullscreen ? 'Exit Full Screen (ESC)' : 'Expand Map to Full Screen'}
          aria-label="Toggle Full Screen"
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-3.5 h-3.5 text-white" />
              <span>Exit Full Screen (ESC)</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Full Screen</span>
            </>
          )}
        </button>

        {isFullscreen && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 text-cyan-700 dark:text-cyan-300 text-xs font-medium backdrop-blur-md shadow-lg">
            <Navigation className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Tactical Corridor View</span>
          </div>
        )}
      </div>

      {/* Simulation Banner Overlay */}
      {isSimulatingHazard && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-purple-950/95 border border-purple-500 text-purple-200 px-4 py-2 rounded-full shadow-2xl backdrop-blur flex items-center gap-2 text-xs font-semibold animate-pulse">
          <Sparkles className="w-4 h-4 text-purple-300" />
          <span>SIMULATION MODE: Click anywhere on the map to inject a hazard</span>
        </div>
      )}

      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        zoomControl={false}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        style={{ height: '100%', width: '100%', backgroundColor: '#020617' }}
      >
        <CustomZoomControls />
        <MapResizer isFullscreen={isFullscreen} />
        {/* OpenStreetMap Clean CartoDB Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> | OSM Contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
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

        <MapRecenterControl
          userLocation={userLocation}
          onRecenter={onToggleFollowMode}
        />

        <MapSimulationClickHandler
          isSimulating={isSimulatingHazard}
          onMapClick={onMapClickSimulate}
        />

        {/* 1. Multi-Route Candidate Corridors Rendering (Alternative Exploration) */}
        {candidatePolylines.length > 0 ? (
          candidatePolylines.map((c, idx) => {
            const isSelected = (selectedRouteIndex ?? routeData?.selectedRouteIndex ?? 0) === idx;
            const isCompromised = c.is_compromised;
            const evalData = c.ai_evaluation;
            const riskLevel = evalData?.risk_level || (isCompromised ? 'CRITICAL' : (idx === 1 ? 'LOW' : 'MEDIUM'));
            const riskScore = evalData?.risk_score ?? (isCompromised ? 88 : (idx === 1 ? 14 : 35));

            // Visual route color palette
            const palette = ['#06b6d4', '#10b981', '#a855f7', '#f59e0b'];
            const baseColor = isCompromised && isSelected ? '#ef4444' : (c.color || palette[idx % palette.length]);

            return (
              <React.Fragment key={`candidate-polyline-${c.id || idx}`}>
                {/* Glow Polyline for Selected Candidate Corridor */}
                {isSelected && (
                  <Polyline
                    positions={c.positions}
                    pathOptions={{
                      color: baseColor,
                      weight: 10,
                      opacity: 0.45,
                    }}
                  />
                )}
                {/* Core Interactive Polyline */}
                <Polyline
                  positions={c.positions}
                  eventHandlers={{
                    click: () => {
                      if (onSelectCandidateRoute) {
                        onSelectCandidateRoute(idx);
                      }
                    },
                  }}
                  pathOptions={{
                    color: isCompromised ? '#dc2626' : baseColor,
                    weight: isSelected ? 5.5 : 3.5,
                    opacity: isSelected ? 1.0 : 0.6,
                    dashArray: isCompromised ? '8, 8' : undefined,
                  }}
                >
                  <Popup>
                    <div className="p-2.5 min-w-[240px] text-xs text-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            riskLevel === 'CRITICAL'
                              ? 'bg-rose-950 text-rose-300 border border-rose-700'
                              : riskLevel === 'HIGH'
                              ? 'bg-orange-950 text-orange-300 border border-orange-700'
                              : riskLevel === 'MEDIUM'
                              ? 'bg-amber-950 text-amber-300 border border-amber-700'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          }`}
                        >
                          {riskLevel} RISK ({riskScore}/100)
                        </span>
                        {c.is_recommended && (
                          <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-700 px-1.5 py-0.5 rounded font-semibold">
                            AI RECOMMENDED
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-100 text-sm leading-snug">{c.title}</h4>

                      <div className="text-[11px] text-slate-300">
                        Distance: <span className="font-bold text-white">{c.distance_km} km</span> • ETA:{' '}
                        <span className="font-bold text-emerald-400">
                          {Math.floor(c.duration_minutes / 60)}h {Math.round(c.duration_minutes % 60)}m
                        </span>
                      </div>

                      {evalData?.ai_brief && (
                        <p className="text-[10px] text-slate-300 bg-slate-900/80 p-1.5 rounded border border-slate-800 leading-relaxed">
                          {evalData.ai_brief}
                        </p>
                      )}

                      {evalData?.hazards_detected && evalData.hazards_detected.length > 0 && (
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-rose-400 font-semibold block">Detected Threats:</span>
                          {evalData.hazards_detected.map((h: string, hIdx: number) => (
                            <div key={`haz-${hIdx}`} className="text-[10px] text-rose-300 bg-rose-950/50 px-1.5 py-0.5 rounded">
                              ⚠ {h}
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        onClick={() => onSelectCandidateRoute?.(idx)}
                        className={`w-full mt-2 py-1.5 rounded text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-cyan-600 text-white shadow'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isSelected ? 'Active Corridor Selected' : 'Select & Dispatch This Corridor'}</span>
                      </button>
                    </div>
                  </Popup>
                </Polyline>
              </React.Fragment>
            );
          })
        ) : (
          /* 2. Fallback Direct Primary and Detour Polylines */
          <>
            {primaryPositions.length > 0 &&
              (activeRouteView === 'PRIMARY' || activeRouteView === 'BOTH') && (
                <>
                  <Polyline
                    positions={primaryPositions}
                    pathOptions={{
                      color: (routeData?.isCompromised || routeData?.aiRiskData?.rerouted) ? '#ef4444' : '#10b981',
                      weight: (routeData?.isCompromised || routeData?.aiRiskData?.rerouted) ? 8 : 7,
                      opacity: (routeData?.isCompromised || routeData?.aiRiskData?.rerouted) ? 0.45 : 0.35,
                    }}
                  />
                  <Polyline
                    positions={primaryPositions}
                    pathOptions={{
                      color: (routeData?.isCompromised || routeData?.aiRiskData?.rerouted) ? '#dc2626' : '#059669',
                      weight: (routeData?.isCompromised || routeData?.aiRiskData?.rerouted) ? 4.5 : 4,
                      opacity: 0.95,
                      dashArray: (routeData?.isCompromised || routeData?.aiRiskData?.rerouted) ? '8, 10' : undefined,
                    }}
                  >
                    <Popup>
                      <div className="p-2 text-xs text-slate-100">
                        <div className="flex items-center gap-1.5 mb-1 font-bold">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              (routeData?.isCompromised || routeData?.aiRiskData?.rerouted) ? 'bg-red-500' : 'bg-emerald-400'
                            }`}
                          ></span>
                          <span>
                            {(routeData?.isCompromised || routeData?.aiRiskData?.rerouted)
                              ? 'Hazard Intersected Route (Rerouted)'
                              : 'Clear Verified Corridor'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300">
                          Distance: {routeData?.primaryRoute?.distance_km} km • Time:{' '}
                          {Math.floor((routeData?.primaryRoute?.duration_minutes || 0) / 60)}h{' '}
                          {Math.round((routeData?.primaryRoute?.duration_minutes || 0) % 60)}m
                        </div>
                      </div>
                    </Popup>
                  </Polyline>
                </>
              )}

            {detourPositions.length > 0 &&
              (activeRouteView === 'DETOUR' || activeRouteView === 'BOTH') && (
                <>
                  <Polyline
                    positions={detourPositions}
                    pathOptions={{
                      color: '#10b981',
                      weight: 9,
                      opacity: 0.5,
                    }}
                  />
                  <Polyline
                    positions={detourPositions}
                    pathOptions={{
                      color: '#059669',
                      weight: 5,
                      opacity: 1.0,
                    }}
                  >
                    <Popup>
                      <div className="p-2 text-xs text-slate-100">
                        <div className="flex items-center gap-1.5 mb-1 font-bold text-emerald-400">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span>Disaster-Resilient Detour</span>
                        </div>
                        <div className="text-[11px] text-slate-300">
                          Distance: {routeData?.alternativeRoute?.distance_km} km • Time:{' '}
                          {Math.floor((routeData?.alternativeRoute?.duration_minutes || 0) / 60)}h{' '}
                          {Math.round((routeData?.alternativeRoute?.duration_minutes || 0) % 60)}m
                        </div>
                      </div>
                    </Popup>
                  </Polyline>
                </>
              )}
          </>
        )}

        {/* 3. Emergency Bypass Waypoint Marker */}
        {routeData?.bypassWaypoint && (
          <Marker
            position={[
              routeData.bypassWaypoint.latitude,
              routeData.bypassWaypoint.longitude,
            ]}
            icon={createBypassIcon()}
          >
            <Popup>
              <div className="p-2 text-xs text-slate-100 min-w-[200px]">
                <div className="flex items-center gap-1.5 mb-1 font-bold text-emerald-400">
                  <Compass className="w-4 h-4" />
                  <span>Emergency Bypass Waypoint</span>
                </div>
                <p className="text-[11px] text-slate-300 mb-1">
                  Dynamic spatial offset calculated by Turf.js to circumvent the hazard safety zone.
                </p>
                <div className="text-[10px] font-mono text-cyan-300 bg-slate-900 p-1 rounded">
                  GPS: {routeData.bypassWaypoint.latitude.toFixed(4)},{' '}
                  {routeData.bypassWaypoint.longitude.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 4. Road Disruptions & Hazard Safety Buffer Polygons */}
        {showDisruptions &&
          safeDisruptions.map((d) => {
            const isCompromised = routeData?.intersectedHazards?.some(
              (h) => h.disruption.id === d.id
            );

            let circleColor = '#eab308';
            if (d.is_simulated) {
              circleColor = '#a855f7'; // Purple for simulated
            } else if (isCompromised || d.severity === 'CRITICAL') {
              circleColor = '#ef4444';
            } else if (d.severity === 'HIGH') {
              circleColor = '#f97316';
            }

            return (
              <React.Fragment key={d.id}>
                {/* Risk Radius Safety Buffer */}
                {showBuffers && (
                  <Circle
                    center={[d.latitude, d.longitude]}
                    radius={d.risk_radius_meters || 1500}
                    pathOptions={{
                      color: circleColor,
                      fillColor: circleColor,
                      fillOpacity: isCompromised ? 0.38 : d.is_simulated ? 0.3 : 0.18,
                      weight: isCompromised || d.is_simulated ? 2.5 : 1.5,
                      dashArray: isCompromised ? '5, 5' : '4, 4',
                    }}
                  />
                )}

                {/* Disruption Hazard Marker */}
                <Marker
                  position={[d.latitude, d.longitude]}
                  icon={createDisruptionIcon(d)}
                >
                  <Popup>
                    <div className="p-2 max-w-xs text-xs text-slate-100">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span
                          className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                            d.is_simulated
                              ? 'bg-purple-950 text-purple-300 border border-purple-700'
                              : isCompromised || d.severity === 'CRITICAL'
                              ? 'bg-red-950 text-red-300 border border-red-700'
                              : d.severity === 'HIGH'
                              ? 'bg-orange-950 text-orange-300 border border-orange-700'
                              : 'bg-amber-950 text-amber-300 border border-amber-700'
                          }`}
                        >
                          {d.is_simulated
                            ? 'SIMULATED HAZARD'
                            : isCompromised
                            ? 'COLLISION HAZARD'
                            : `${d.severity} HAZARD`}
                        </span>
                        <span className="text-slate-400 font-mono">
                          {d.disruption_type}
                        </span>
                      </div>
                      <h4 className="font-semibold text-slate-100 text-sm mb-1 leading-snug">
                        {d.title}
                      </h4>
                      {d.highway_reference && (
                        <p className="text-cyan-400 font-mono text-[11px] mb-1">
                          Highway: {d.highway_reference}
                        </p>
                      )}
                      <p className="text-slate-300 text-[11px] mb-2 leading-relaxed">
                        {d.description}
                      </p>
                      <div className="bg-slate-900/80 p-1.5 rounded border border-slate-700/60 flex justify-between items-center text-[10px] text-slate-400">
                        <span>Risk Buffer: {d.risk_radius_meters}m</span>
                        <span className="text-emerald-400 font-medium">
                          {d.is_simulated ? 'Live Injected' : 'BRO Monitored'}
                        </span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}

        {/* 5. Supply Hub Markers */}
        {showHubs &&
          safeHubs.map((hub) => (
            <Marker
              key={hub.id}
              position={[hub.latitude, hub.longitude]}
              icon={createHubIcon(hub)}
              eventHandlers={{
                click: () => onSelectHub?.(hub),
              }}
            >
              <Popup>
                <div className="p-2 min-w-[220px] max-w-xs text-xs text-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="bg-cyan-950 text-cyan-300 border border-cyan-700/60 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                      {hub.state}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                      Operational
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-100 mb-1 leading-snug">
                    {hub.name}
                  </h3>
                  <div className="text-[11px] text-slate-300 space-y-1 mb-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Storage Capacity:</span>
                      <span className="font-semibold text-slate-200">
                        {hub.capacity_tonnes} Tonnes
                      </span>
                    </div>
                    {hub.contact_person && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Coordinator:</span>
                        <span>{hub.contact_person}</span>
                      </div>
                    )}
                    {hub.contact_phone && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Contact:</span>
                        <span className="font-mono text-cyan-300">
                          {hub.contact_phone}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Action buttons for route planning */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-700/60">
                    <button
                      onClick={() => onSetOrigin?.(hub)}
                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-semibold transition flex items-center justify-center gap-1"
                    >
                      Set as Origin
                    </button>
                    <button
                      onClick={() => onSetDestination?.(hub)}
                      className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-semibold transition flex items-center justify-center gap-1"
                    >
                      Set as Dest
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* 6. Live Driver Journeys & Telemetry Convoys */}
        {liveJourneys.map((journey) => (
          <Marker
            key={journey.id}
            position={[journey.current_lat, journey.current_lng]}
            icon={createJourneyIcon(journey)}
          >
            <Popup>
              <div className="p-2 min-w-[210px] text-xs text-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="bg-cyan-950 text-cyan-300 border border-cyan-700/60 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                    {journey.citizen_uid}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                    {journey.speed_kmh || 40} km/h
                  </span>
                </div>
                <h4 className="font-bold text-slate-100 text-sm mb-1">{journey.driver_name}</h4>
                <div className="text-[11px] text-slate-300 space-y-1 mb-2">
                  <div className="text-slate-400">
                    From: <span className="text-slate-200">{journey.origin_hub || 'Guwahati Depot'}</span>
                  </div>
                  <div className="text-slate-400">
                    To: <span className="text-slate-200">{journey.destination_hub || 'Regional Freight Corridor'}</span>
                  </div>
                </div>
                <div className="p-1 rounded bg-slate-900 text-[10px] font-mono text-cyan-300 border border-slate-700">
                  GPS: {journey.current_lat.toFixed(4)}, {journey.current_lng.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        {/* 7. Live GPS User / Commercial Convoy Marker */}
        {userLocation && !isNaN(userLocation[0]) && !isNaN(userLocation[1]) && (
          <>
            <Circle
              center={userLocation}
              radius={accuracy || 15}
              pathOptions={{
                color: '#0284c7',
                fillColor: '#38bdf8',
                fillOpacity: 0.18,
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
                    <div>
                      Coords: {userLocation[0].toFixed(4)}°, {userLocation[1].toFixed(4)}°
                    </div>
                    <div>Accuracy Radius: ±{Math.round(accuracy || 15)}m</div>
                    {speed !== null && speed !== undefined && (
                      <div className="text-emerald-400 font-mono font-semibold">
                        Speed: {speed} km/h
                      </div>
                    )}
                    {heading !== null && heading !== undefined && (
                      <div className="text-slate-400">Heading: {heading}°</div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>

      {/* Live Google Maps-Style Turn-by-Turn Navigation HUD */}
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

      {/* Map Overlay Controls / Legend */}
      <div className="absolute top-3 right-3 z-[1000] bg-white/95 dark:bg-slate-900/90 backdrop-blur-md p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-xl text-xs space-y-2 max-w-[220px] transition-colors duration-200">
        <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
          <span>Corridor Legend</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
        </div>
        <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block border border-white/50"></span>
            <span>Supply Hubs ({hubs.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400 inline-block border border-white/50"></span>
            <span>Live Driver GPS ({liveJourneys.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block border border-white/50"></span>
            <span>Disruption Zone</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500 inline-block border border-white/50"></span>
            <span>Simulated Hazard</span>
          </div>
          {routeData && (
            <>
              {routeData.candidateRoutes && routeData.candidateRoutes.length > 0 ? (
                routeData.candidateRoutes.map((c, idx) => {
                  const isSelected = (selectedRouteIndex ?? routeData.selectedRouteIndex ?? 0) === idx;
                  const palette = ['#06b6d4', '#10b981', '#a855f7', '#f59e0b'];
                  const color = c.is_compromised && isSelected ? '#ef4444' : (c.color || palette[idx % palette.length]);

                  return (
                    <div
                      key={`legend-c-${idx}`}
                      onClick={() => onSelectCandidateRoute?.(idx)}
                      className={`flex items-center justify-between gap-1.5 cursor-pointer p-0.5 rounded transition ${
                        isSelected ? 'bg-cyan-950/60 font-bold text-cyan-300' : 'hover:text-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="w-3.5 h-1.5 inline-block rounded shrink-0"
                          style={{ backgroundColor: color }}
                        ></span>
                        <span className="truncate text-[10px]">{c.title.split('(')[0].trim()}</span>
                      </div>
                      {isSelected && (
                        <span className="text-[8px] bg-cyan-800 text-cyan-200 px-1 rounded uppercase font-bold shrink-0">
                          Active
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-1 inline-block rounded"
                      style={{
                        backgroundColor: routeData.isCompromised
                          ? '#ef4444'
                          : '#06b6d4',
                      }}
                    ></span>
                    <span>
                      {routeData.isCompromised
                        ? 'Compromised (Red)'
                        : 'Primary Route (Cyan)'}
                    </span>
                  </div>
                  {routeData.alternativeRoute && (
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-1.5 inline-block rounded bg-emerald-500"></span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        Safe Detour (Emerald)
                      </span>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
