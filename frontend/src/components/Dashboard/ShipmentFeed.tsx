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
} from 'lucide-react';

interface ShipmentFeedProps {
  shipments: Shipment[];
}

export default function ShipmentFeed({ shipments }: ShipmentFeedProps) {
  const getCargoIcon = (type: CargoType) => {
    switch (type) {
      case 'MEDICINE':
        return <HeartPulse className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'PERISHABLE_FOOD':
        return <Apple className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'FUEL':
        return <Fuel className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      default:
        return <Box className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  return (
    <div className="bg-white dark:bg-[#1c2541]/90 backdrop-blur rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-md transition-colors duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
            Active Priority Shipments
          </h2>
        </div>
        <span className="text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-full font-semibold">
          {shipments.length} Active
        </span>
      </div>

      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
        {shipments.map((s) => (
          <div
            key={s.id}
            className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-sm"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                {getCargoIcon(s.cargo_type)}
                <span className="font-mono text-xs font-bold text-cyan-700 dark:text-cyan-300">
                  {s.tracking_code}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                  Priority {s.priority_level}/5
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    s.current_status === 'REROUTED'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                      : s.current_status === 'IN_TRANSIT'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {s.current_status}
                </span>
              </div>
            </div>

            {/* Origin -> Destination route */}
            <div className="flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-200 mb-1 font-medium">
              <span className="truncate">{s.origin_name || 'Guwahati Hub'}</span>
              <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{s.destination_name || 'Dest Terminal'}</span>
            </div>

            {s.notes && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5 line-clamp-1">
                {s.notes}
              </p>
            )}

            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800/80">
              <span>Cargo: {s.cargo_type}</span>
              <span>Weight: {s.weight_tonnes} Tonnes</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
