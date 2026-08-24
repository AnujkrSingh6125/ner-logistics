'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  SupplyHub,
  RoadDisruption,
  DisasterResilientRouteResponse,
  Shipment,
} from '@/types';
import { ThreatAlertData } from '@/components/Navigation/LiveNavigationHUD';

interface LogisticsMapProps {
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
  trackedShipment?: Shipment | null;
  fleetShipments?: Shipment[];
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

const DynamicMapClient = dynamic(
  () => import('./MapClient'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[540px] rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-cyan-400">Loading Geospatial Telemetry Grid...</span>
      </div>
    ),
  }
);

export default function LogisticsMap(props: LogisticsMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-[540px] rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <DynamicMapClient {...props} />;
}
