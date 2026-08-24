'use client';

import React, { useState } from 'react';
import { RoadDisruption } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { deleteRoadDisruption } from '@/lib/supabaseClient';
import {
  AlertTriangle,
  Waves,
  ShieldAlert,
  Construction,
  Trash2,
  Building2,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

interface DisruptionAlertsProps {
  disruptions: RoadDisruption[];
  onSelectDisruption?: (disruption: RoadDisruption) => void;
  onDeleteDisruption?: (disruptionId: string) => void;
  onOpenReportModal?: () => void;
}

export default function DisruptionAlerts({
  disruptions,
  onSelectDisruption,
  onDeleteDisruption,
  onOpenReportModal,
}: DisruptionAlertsProps) {
  const { user } = useAuth();
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredDisruptions = disruptions.filter((d) => {
    if (filterSeverity === 'ALL') return true;
    return d.severity === filterSeverity;
  });

  const getDisruptionIcon = (type: string) => {
    switch (type) {
      case 'LANDSLIDE':
        return <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case 'FLASH_FLOOD':
        return <Waves className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'BRIDGE_DAMAGE':
        return <Construction className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this government road disruption record?')) {
      return;
    }

    setDeletingId(id);
    try {
      const success = await deleteRoadDisruption(id);
      if (success) {
        onDeleteDisruption?.(id);
      }
    } catch (err) {
      console.error('Failed to delete disruption:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const isGovOfficial = user?.role === 'gov_official';

  return (
    <div className="bg-white dark:bg-[#1c2541]/90 backdrop-blur rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-md transition-colors duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
            Active Road Hazards & Disruptions
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/60 px-2 py-0.5 rounded-full font-semibold">
            {disruptions.length} Live
          </span>
        </div>
      </div>

      {/* Severity Filter Tabs */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1 text-[11px]">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded-md transition font-medium ${
                filterSeverity === sev
                  ? 'bg-slate-800 text-white dark:bg-slate-700 dark:text-cyan-300 font-bold'
                  : 'bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {isGovOfficial && onOpenReportModal && (
          <button
            onClick={onOpenReportModal}
            className="text-[10px] bg-red-600/90 hover:bg-red-500 text-white px-2.5 py-1 rounded-md font-semibold transition flex items-center gap-1 shadow-2xs"
          >
            <ShieldCheck className="w-3 h-3" />
            + Report
          </button>
        )}
      </div>

      {/* Disruptions List */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {filteredDisruptions.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
            No active road disruptions in this category.
          </div>
        ) : (
          filteredDisruptions.map((d) => {
            const agency =
              d.government_body_name ||
              d.reported_by_agency ||
              'Emergency Management Authority';

            // Show delete if user created it or is authorized government official
            const canDelete =
              isGovOfficial &&
              (user?.id === d.created_by || !d.created_by || d.is_simulated);

            return (
              <div
                key={d.id}
                onClick={() => onSelectDisruption?.(d)}
                className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer group shadow-sm relative"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {getDisruptionIcon(d.disruption_type)}
                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition leading-tight truncate">
                      {d.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${
                        d.severity === 'CRITICAL'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400 border border-red-300 dark:border-red-800'
                          : d.severity === 'HIGH'
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-400 border border-orange-300 dark:border-orange-800'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                      }`}
                    >
                      {d.severity}
                    </span>

                    {canDelete && (
                      <button
                        onClick={(e) => handleDelete(e, d.id)}
                        disabled={deletingId === d.id}
                        title="Delete Disruption (Creator / Official)"
                        className="p-1 rounded bg-red-100 dark:bg-red-950/80 hover:bg-red-200 dark:hover:bg-red-900 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800 transition"
                      >
                        {deletingId === d.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Government Body Tag */}
                <div className="flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300 font-medium mb-1">
                  <Building2 className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="truncate">Authority: {agency}</span>
                </div>

                {d.highway_reference && (
                  <div className="text-[10px] text-cyan-700 dark:text-cyan-400 font-mono mb-1">
                    Corridor: {d.highway_reference}
                  </div>
                )}

                {/* Official Directive Message */}
                {d.message ? (
                  <div className="bg-amber-50 dark:bg-amber-950/40 border-l-2 border-amber-500 px-2 py-1.5 rounded-r my-1.5 text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                    <span className="text-[9px] uppercase font-bold text-amber-700 dark:text-amber-400 block">
                      Official Directive:
                    </span>
                    &ldquo;{d.message}&rdquo;
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 mb-2 leading-relaxed">
                    {d.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span>Radius: {d.risk_radius_meters}m</span>
                  <span>
                    GPS: {d.latitude.toFixed(2)}, {d.longitude.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
