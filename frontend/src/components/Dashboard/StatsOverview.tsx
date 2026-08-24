'use client';

import React from 'react';
import { SupplyHub, RoadDisruption, Shipment } from '@/types';
import { Building2, AlertOctagon, Truck, ShieldAlert, Activity, ArrowUpRight } from 'lucide-react';

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
      <div className="bg-[#070e1c]/80 backdrop-blur-xl rounded-2xl p-3.5 border border-slate-800/80 hover:border-cyan-500/40 shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-200 group">
        <div className="flex items-center justify-between mb-2">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-sm shadow-blue-500/20 group-hover:scale-105 transition">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.2 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            100% Online
          </span>
        </div>
        <div>
          <div className="text-2xl font-black font-mono tracking-tight text-white">
            {hubs.length}
          </div>
          <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
            Regional Hubs ({totalCapacityTonnes.toLocaleString()}T Cap)
          </div>
        </div>
      </div>

      {/* Metric 2: Active Road Hazards */}
      <div className="bg-[#070e1c]/80 backdrop-blur-xl rounded-2xl p-3.5 border border-slate-800/80 hover:border-red-500/40 shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-200 group">
        <div className="flex items-center justify-between mb-2">
          <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shadow-sm shadow-red-500/20 group-hover:scale-105 transition">
            <AlertOctagon className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-mono font-bold text-red-400 bg-red-950/60 border border-red-800/60 px-1.5 py-0.2 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
            Live Radar
          </span>
        </div>
        <div>
          <div className="text-2xl font-black font-mono tracking-tight text-rose-400">
            {disruptions.length}
          </div>
          <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
            Disruptions Intercepted
          </div>
        </div>
      </div>

      {/* Metric 3: Critical Hazards */}
      <div className="bg-[#070e1c]/80 backdrop-blur-xl rounded-2xl p-3.5 border border-slate-800/80 hover:border-amber-500/40 shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-200 group">
        <div className="flex items-center justify-between mb-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm shadow-amber-500/20 group-hover:scale-105 transition">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.2 rounded-full flex items-center gap-1">
            Severe
          </span>
        </div>
        <div>
          <div className="text-2xl font-black font-mono tracking-tight text-amber-300">
            {criticalDisruptions}
          </div>
          <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
            High & Critical Alerts
          </div>
        </div>
      </div>

      {/* Metric 4: Active In-Transit Cargo */}
      <div className="bg-[#070e1c]/80 backdrop-blur-xl rounded-2xl p-3.5 border border-slate-800/80 hover:border-cyan-500/40 shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-200 group">
        <div className="flex items-center justify-between mb-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-500/20 group-hover:scale-105 transition">
            <Truck className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-1.5 py-0.2 rounded-full flex items-center gap-1">
            <Activity className="w-3 h-3 text-cyan-400" />
            In Transit
          </span>
        </div>
        <div>
          <div className="text-2xl font-black font-mono tracking-tight text-cyan-300">
            {inTransitShipments}
          </div>
          <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
            Tracked Convoy Fleet
          </div>
        </div>
      </div>
    </div>
  );
}
