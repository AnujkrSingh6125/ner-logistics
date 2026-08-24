'use client';

import React from 'react';
import LogisticsMap from './Map/LogisticsMap';
import { SupplyHub, RoadDisruption, DisasterResilientRouteResponse } from '@/types';

interface SpatialMapProps {
  hubs?: SupplyHub[];
  disruptions?: RoadDisruption[];
  selectedHub?: SupplyHub | null;
  originHub?: SupplyHub | null;
  destHub?: SupplyHub | null;
  routeData?: DisasterResilientRouteResponse | null;
  activeRouteView?: 'PRIMARY' | 'DETOUR' | 'BOTH';
  showDisruptions?: boolean;
  showHubs?: boolean;
  showBuffers?: boolean;
  isSimulatingHazard?: boolean;
  onSelectHub?: (hub: SupplyHub) => void;
  onSetOrigin?: (hub: SupplyHub) => void;
  onSetDestination?: (hub: SupplyHub) => void;
  onMapClickSimulate?: (coords: { latitude: number; longitude: number }) => void;
  [key: string]: any;
}

export default function SpatialMap({
  hubs = [],
  disruptions = [],
  selectedHub = null,
  originHub = null,
  destHub = null,
  routeData = null,
  ...props
}: SpatialMapProps) {
  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-800 relative z-0 shadow-2xl isolate">
      <LogisticsMap
        hubs={hubs}
        disruptions={disruptions}
        selectedHub={selectedHub}
        originHub={originHub}
        destHub={destHub}
        routeData={routeData}
        {...props}
      />
    </div>
  );
}
