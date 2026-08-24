'use client';

import React, { useState } from 'react';
import { SystemBroadcast } from '@/types';
import { useAuth } from '@/context/AuthContext';
import {
  X,
  Radio,
  AlertTriangle,
  ShieldAlert,
  MapPin,
  Clock,
  Trash2,
  PlusCircle,
  Search,
  Filter,
  RefreshCw,
  Megaphone,
} from 'lucide-react';

interface AllBroadcastsModalProps {
  broadcasts: SystemBroadcast[];
  onClose: () => void;
  onRefresh: () => void;
  onOpenCreate: () => void;
  onDeleteBroadcast?: (id: string) => Promise<void>;
}

export default function AllBroadcastsModal({
  broadcasts,
  onClose,
  onRefresh,
  onOpenCreate,
  onDeleteBroadcast,
}: AllBroadcastsModalProps) {
  const { isGovOfficial } = useAuth();
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredBroadcasts = broadcasts.filter((b) => {
    const matchesSev =
      filterSeverity === 'ALL' || b.severity?.toUpperCase() === filterSeverity.toUpperCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      b.title.toLowerCase().includes(query) ||
      b.message.toLowerCase().includes(query) ||
      b.agency.toLowerCase().includes(query) ||
      (b.affected_region && b.affected_region.toLowerCase().includes(query));
    return matchesSev && matchesSearch;
  });

  const getSeverityBadgeClass = (severity?: string) => {
    switch (severity?.toUpperCase()) {
      case 'EMERGENCY':
      case 'CRITICAL':
        return 'bg-rose-500/15 border-rose-500/30 text-rose-400';
      case 'WARNING':
        return 'bg-amber-500/15 border-amber-500/30 text-amber-400';
      case 'INFO':
        return 'bg-blue-500/15 border-blue-500/30 text-blue-400';
      default:
        return 'bg-slate-500/15 border-slate-500/30 text-slate-400';
    }
  };

  const handleDelete = async (id: string) => {
    if (!onDeleteBroadcast) return;
    setDeletingId(id);
    try {
      await onDeleteBroadcast(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-600/10 border border-red-500/20 text-red-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  Regional Emergency Bulletins & Broadcasts
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
                  {broadcasts.length} Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official alerts issued by NDMA, BRO, and 8 Northeast State Disaster Management Authorities.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
              title="Refresh alerts"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition text-xs ${
                  filterSeverity === sev
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {sev === 'ALL' ? `All (${broadcasts.length})` : sev}
              </button>
            ))}
          </div>

          <div className="relative flex-1 sm:max-w-xs min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search region, agency, highway..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
            />
          </div>
        </div>

        {/* Broadcasts List Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[58vh]">
          {filteredBroadcasts.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Megaphone className="w-10 h-10 mx-auto mb-3 text-slate-600 opacity-40" />
              <p className="text-sm font-semibold">No broadcasts match your search filter.</p>
              <p className="text-xs text-slate-500 mt-1">
                All transport routes are operating normally under selected criteria.
              </p>
            </div>
          ) : (
            filteredBroadcasts.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition space-y-2.5"
              >
                {/* Top Row: Severity + Agency + Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${getSeverityBadgeClass(
                        b.severity
                      )}`}
                    >
                      {b.severity || 'WARNING'}
                    </span>
                    <span className="text-xs font-semibold text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded">
                      {b.agency}
                    </span>
                    {b.issued_by_name && (
                      <span className="text-[11px] text-slate-400">
                        • Issued by: <strong className="text-slate-300">{b.issued_by_name}</strong>
                      </span>
                    )}
                  </div>

                  {isGovOfficial && (
                    <button
                      onClick={() => handleDelete(b.id)}
                      disabled={deletingId === b.id}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-950/60 border border-red-800/40 transition shrink-0"
                      title="Deactivate / Delete Broadcast"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Resolve</span>
                    </button>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-slate-100">{b.title}</h3>

                {/* Message Body */}
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
                  &ldquo;{b.message}&rdquo;
                </div>

                {/* Footer: Affected Region & Date */}
                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
                  <div className="flex items-center gap-1.5 text-amber-300/90">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Affected Area:{' '}
                      <strong className="font-semibold">{b.affected_region || 'Northeast Regional Corridor'}</strong>
                    </span>
                  </div>

                  {b.created_at && (
                    <div className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(b.created_at).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Showing <strong className="text-slate-200">{filteredBroadcasts.length}</strong> of{' '}
            <strong className="text-slate-200">{broadcasts.length}</strong> broadcasts
          </div>

          <div className="flex items-center gap-2">
            {isGovOfficial && (
              <button
                onClick={onOpenCreate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition shadow"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Issue New Broadcast</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
