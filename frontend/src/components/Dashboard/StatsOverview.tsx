'use client';

import React from 'react';
import { SupplyHub, RoadDisruption, Shipment } from '@/types';
import { Building2, AlertOctagon, Truck, ShieldAlert } from 'lucide-react';

interface StatsOverviewProps {
  hubs: SupplyHub[];
  disruptions: RoadDisruption[];
  shipments: Shipment[];
}

export default function StatsOverview({
  hubs,
  disruptions,
  shipments,
}: StatsOverviewProps) {
  const criticalDisruptions = disruptions.filter(
    (d) => d.severity === 'CRITICAL' || d.severity === 'HIGH'
  ).length;

  const inTransitShipments = shipments.filter(
    (s) => s.current_status === 'IN_TRANSIT' || s.current_status === 'REROUTED'
  ).length;

  const totalCapacityTonnes = hubs.reduce(
    (sum, h) => sum + (Number(h.capacity_tonnes) || 0),
    0
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Metric 1: Operational Supply Hubs */}
      <div className="bg-white dark:bg-[#1c2541]/80 backdrop-blur rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 transition-colors duration-200">
        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{hubs.length}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Regional Hubs ({totalCapacityTonnes}T)
          </div>
        </div>
      </div>

      {/* Metric 2: Active Road Hazards */}
      <div className="bg-white dark:bg-[#1c2541]/80 backdrop-blur rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 transition-colors duration-200">
        <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 flex items-center justify-center shrink-0">
          <AlertOctagon className="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{disruptions.length}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Active Disruptions
          </div>
        </div>
      </div>

      {/* Metric 3: Critical Hazards */}
      <div className="bg-white dark:bg-[#1c2541]/80 backdrop-blur rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 transition-colors duration-200">
        <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{criticalDisruptions}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">High / Critical Alerts</div>
        </div>
      </div>

      {/* Metric 4: Active In-Transit Cargo */}
      <div className="bg-white dark:bg-[#1c2541]/80 backdrop-blur rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 transition-colors duration-200">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center shrink-0">
          <Truck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{inTransitShipments}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Active Shipments</div>
        </div>
      </div>
    </div>
  );
}
