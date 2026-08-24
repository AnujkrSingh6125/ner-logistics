'use client';

import React from 'react';
import { SupplyHub, HubRecommendation } from '@/types';
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Milestone,
  Clock,
} from 'lucide-react';

interface AlternateHubRecommenderProps {
  recommendations: HubRecommendation[];
  destination: SupplyHub | null;
  onSelectAlternateOrigin: (hub: SupplyHub) => void;
  onClose?: () => void;
}

export default function AlternateHubRecommender({
  recommendations,
  destination,
  onSelectAlternateOrigin,
  onClose,
}: AlternateHubRecommenderProps) {
  if (!destination || recommendations.length === 0) return null;

  return (
    <div className="bg-white dark:bg-[#1c2541]/95 backdrop-blur rounded-xl p-4 border border-slate-200 dark:border-cyan-800/60 shadow-md dark:shadow-xl space-y-3 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-100 dark:bg-cyan-500/20 border border-cyan-300 dark:border-cyan-500/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <span>Alternative Supply Hub Sourcing</span>
              <span className="text-[9px] bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-200 dark:border-cyan-800 font-semibold">
                Optimized
              </span>
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Optimal regional depots with clear corridors to {destination.name}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded transition border border-slate-200 dark:border-slate-700"
          >
            Hide
          </button>
        )}
      </div>

      {/* Ranked Hub Candidates List */}
      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {recommendations.map((rec, index) => (
          <div
            key={rec.hub.id}
            className={`p-3 rounded-lg border transition ${
              rec.isCorridorClear
                ? 'bg-slate-50 dark:bg-slate-900/90 border-slate-200 dark:border-slate-700 hover:border-cyan-500/80 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-75'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 text-cyan-700 dark:text-cyan-400 text-[10px] flex items-center justify-center font-bold font-mono">
                  #{index + 1}
                </span>
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    {rec.hub.name}
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {rec.hub.state} • {rec.availableCapacityTonnes} Tonnes Capacity
                  </span>
                </div>
              </div>

              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 flex items-center gap-1 ${
                  rec.isCorridorClear
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                }`}
              >
                {rec.isCorridorClear ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Clear Corridor</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>Hazard Alert</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950/60 px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-800 mb-2">
              <div className="flex items-center gap-1">
                <Milestone className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                <span>Road: {rec.estimatedRoadDistanceKm ?? rec.road_distance_km ?? 0} km</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>
                  Est. {Math.floor((rec.estimatedDurationMin || 0) / 60)}h{' '}
                  {Math.round((rec.estimatedDurationMin || 0) % 60)}m
                </span>
              </div>
            </div>

            <button
              onClick={() => onSelectAlternateOrigin(rec.hub)}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold py-1.5 px-3 rounded-md text-[11px] transition shadow flex items-center justify-center gap-1.5"
            >
              <span>Switch Origin & Route from this Hub</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
