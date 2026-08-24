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
  Sparkles,
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

  const handleAskAboutDisruption = (e: React.MouseEvent, d: RoadDisruption) => {
    e.stopPropagation();
    const event = new CustomEvent('ask-disruption-assistant', {
      detail: {
        query: `What are the official government directives, severity, and status for "${d.title}" on ${d.highway_reference || 'this corridor'}?`,
      },
    });
    window.dispatchEvent(event);
  };

  const filteredDisruptions = disruptions.filter((d) => {
    if (filterSeverity === 'ALL') return true;
    return d.severity === filterSeverity;
  });

  const getDisruptionIcon = (type: string) => {
    switch (type) {
      case 'LANDSLIDE':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'FLASH_FLOOD':
        return <Waves className="w-4 h-4 text-cyan-400" />;
      case 'BRIDGE_DAMAGE':
        return <Construction className="w-4 h-4 text-amber-400" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
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
    <div className="bg-[#070e1c]/85 backdrop-blur-xl rounded-2xl p-4 border border-slate-800/80 shadow-[0_4px_24px_rgba(0,0,0,0.3)] transition-colors duration-200 space-y-3.5 text-slate-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-slate-100 text-sm">
              Active Road Hazards & Disruptions
            </h2>
            <p className="text-[10px] text-slate-400">Verified SDMA / BRO / NHAI Alerts</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold bg-red-950/80 text-red-300 border border-red-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
            {disruptions.length} Live Radar
          </span>
        </div>
      </div>

      {/* Severity Filter Tabs */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1 p-1 bg-[#081020] rounded-xl border border-slate-800 text-[10px] font-mono">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded-lg transition font-bold ${
                filterSeverity === sev
                  ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {isGovOfficial && onOpenReportModal && (
          <button
            onClick={onOpenReportModal}
            className="text-[10px] bg-red-600 hover:bg-red-500 text-white px-2.5 py-1.5 rounded-xl font-semibold transition flex items-center gap-1 shadow-md shadow-red-600/20"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>+ Report</span>
          </button>
        )}
      </div>

      {/* Disruptions List */}
      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
        {filteredDisruptions.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/50 rounded-xl border border-slate-800/80">
            No active road disruptions in this category.
          </div>
        ) : (
          filteredDisruptions.map((d) => {
            const agency =
              d.government_body_name ||
              d.reported_by_agency ||
              'Emergency Management Authority';

            const canDelete =
              isGovOfficial &&
              (user?.id === d.created_by || !d.created_by || d.is_simulated);

            return (
              <div
                key={d.id}
                onClick={() => onSelectDisruption?.(d)}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition cursor-pointer group shadow-sm relative space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                      {getDisruptionIcon(d.disruption_type)}
                    </div>
                    <span className="font-bold text-xs text-slate-100 group-hover:text-cyan-300 transition leading-tight truncate">
                      {d.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold ${
                        d.severity === 'CRITICAL'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : d.severity === 'HIGH'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-blue-950 text-blue-300 border border-blue-800'
                      }`}
                    >
                      {d.severity}
                    </span>

                    {canDelete && (
                      <button
                        onClick={(e) => handleDelete(e, d.id)}
                        disabled={deletingId === d.id}
                        title="Delete Disruption (Official Clearance)"
                        className="p-1 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-400 border border-red-800/60 transition"
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

                {/* Government Body Tag & Corridor */}
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-1 text-amber-300 font-medium truncate">
                    <Building2 className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="truncate">{agency}</span>
                  </div>
                  {d.highway_reference && (
                    <span className="text-cyan-400 font-mono shrink-0">
                      {d.highway_reference}
                    </span>
                  )}
                </div>

                {/* Official Directive Message */}
                {d.message ? (
                  <div className="bg-amber-950/40 border-l-2 border-amber-500/80 px-2.5 py-1.5 rounded-r-lg text-[11px] text-amber-200 leading-relaxed font-medium">
                    <span className="text-[9px] uppercase font-mono font-bold text-amber-400 block mb-0.5">
                      Official Directive:
                    </span>
                    &ldquo;{d.message}&rdquo;
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                    {d.description}
                  </p>
                )}

                {/* Ask Gemini AI Advisor Button */}
                <div className="pt-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(e) => handleAskAboutDisruption(e, d)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/60 text-[10px] font-mono font-bold transition shadow-sm"
                    title="Inquire about official directives with Gemini AI Assistant"
                  >
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>Ask Gemini About This Hazard</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1.5 border-t border-slate-850">
                  <span>Radius: {d.risk_radius_meters}m</span>
                  <span>
                    GPS: {d.latitude.toFixed(2)}°, {d.longitude.toFixed(2)}°
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
