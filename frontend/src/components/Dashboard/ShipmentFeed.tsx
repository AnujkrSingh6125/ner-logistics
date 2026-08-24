'use client';

import React from 'react';
import { Shipment, CargoType } from '@/types';
import {
  HeartPulse,
  Apple,
  Fuel,
  Box,
  Truck,
  ArrowRight,
  Activity,
} from 'lucide-react';

interface ShipmentFeedProps {
  shipments: Shipment[];
}

export default function ShipmentFeed({ shipments }: ShipmentFeedProps) {
  const getCargoIcon = (type: CargoType) => {
    switch (type) {
      case 'MEDICINE':
        return <HeartPulse className="w-4 h-4 text-emerald-400" />;
      case 'PERISHABLE_FOOD':
        return <Apple className="w-4 h-4 text-amber-400" />;
      case 'FUEL':
        return <Fuel className="w-4 h-4 text-rose-400" />;
      default:
        return <Box className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="bg-white/95 dark:bg-[#070e1c]/85 backdrop-blur-xl rounded-2xl p-4 border border-slate-200 dark:border-slate-800/80 shadow-md dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] transition-colors duration-200 space-y-3.5 text-slate-900 dark:text-slate-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              Active Priority Shipments
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Tracked Multi-Corridor Convoys</p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
          <Activity className="w-3 h-3 text-emerald-600 dark:text-emerald-400 animate-pulse" />
          {shipments.length} Active
        </span>
      </div>

      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
        {shipments.map((s) => (
          <div
            key={s.id}
            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-sm space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0">
                  {getCargoIcon(s.cargo_type)}
                </div>
                <span className="font-mono text-xs font-bold text-cyan-700 dark:text-cyan-400">
                  {s.tracking_code}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-mono bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  Priority {s.priority_level}/5
                </span>
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                    s.current_status === 'REROUTED'
                      ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                      : s.current_status === 'IN_TRANSIT'
                      ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                      : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800'
                  }`}
                >
                  {s.current_status}
                </span>
              </div>
            </div>

            {/* Origin -> Destination route */}
            <div className="flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium">
              <span className="truncate">{s.origin_name || 'Guwahati Hub'}</span>
              <ArrowRight className="w-3 h-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span className="truncate">{s.destination_name || 'Dest Terminal'}</span>
            </div>

            {s.notes && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                &ldquo;{s.notes}&rdquo;
              </p>
            )}

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-200 dark:border-slate-850">
              <span>Cargo: {s.cargo_type}</span>
              <span>Weight: {s.weight_tonnes} Tonnes</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
