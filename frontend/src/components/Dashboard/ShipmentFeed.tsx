import React, { useState } from 'react';
import { Shipment, CargoType, TrackedCitizenTelemetry } from '@/types';
import { useAuth } from '@/context/AuthContext';
import ClientUserTracker from './ClientUserTracker';
import {
  HeartPulse,
  Apple,
  Fuel,
  Box,
  Truck,
  ArrowRight,
  Activity,
  LocateFixed,
  Lock,
  Radio,
  User,
  Gauge,
  Compass,
  ShieldAlert,
  Trash2,
  Loader2,
  Radar,
} from 'lucide-react';

interface ShipmentFeedProps {
  shipments: Shipment[];
  selectedShipmentId?: string | null;
  onSelectShipment?: (shipment: Shipment) => void;
  onDeleteShipment?: (shipmentId: string) => Promise<void>;
  onTrackedCitizenChange?: (telemetry: TrackedCitizenTelemetry | null) => void;
  trackedCitizen?: TrackedCitizenTelemetry | null;
}

export default function ShipmentFeed({
  shipments,
  selectedShipmentId,
  onSelectShipment,
  onDeleteShipment,
  onTrackedCitizenChange,
  trackedCitizen,
}: ShipmentFeedProps) {
  const { user, canObserveTelemetry, isSupplyHub, isGovOfficial, openAuthModal } = useAuth();
  const [unauthorizedWarning, setUnauthorizedWarning] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedTab, setFeedTab] = useState<'fleet' | 'radar'>('fleet');

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

  // Check multi-tenant ownership: Only the originating Supply Hub or Government Officials can delete
  const canDeleteShipment = (s: Shipment): boolean => {
    if (isGovOfficial || user?.role === 'gov_official' || user?.role === 'GOV_AUTHORITY') {
      return true;
    }
    if (!isSupplyHub && user?.role !== 'hub_operator' && user?.role !== 'SUPPLY_HUB') {
      return false;
    }

    const cleanUserHub = (user?.hub_code || user?.hub_name || user?.agency_name || user?.id || '').toLowerCase().trim();
    if (!cleanUserHub) return false;

    const shipmentHub = (s.hub_id || s.hub_code || s.dispatched_by_hub_id || '').toLowerCase().trim();
    const originName = (s.origin_name || '').toLowerCase().trim();

    if (shipmentHub && shipmentHub === cleanUserHub) return true;
    if (originName && (originName.includes(cleanUserHub) || cleanUserHub.includes(originName))) return true;
    if (s.origin_hub_id && user?.id && s.origin_hub_id === user.id) return true;

    return false;
  };

  const handleDelete = async (e: React.MouseEvent, shipment: Shipment) => {
    e.stopPropagation();

    if (!canDeleteShipment(shipment)) {
      setUnauthorizedWarning(`🔒 Permission Denied: You can only decommission shipments created by your Supply Hub.`);
      setTimeout(() => setUnauthorizedWarning(null), 5000);
      return;
    }

    const confirmed = window.confirm(
      `Decommission and delete convoy shipment [${shipment.tracking_code}]?\n\nThis will immediately remove the convoy from all active real-time maps and decrement the fleet count across connected platforms.`
    );
    if (!confirmed) return;

    setDeletingId(shipment.id);
    try {
      if (onDeleteShipment) {
        await onDeleteShipment(shipment.id);
      }
    } catch (err: any) {
      console.error('Failed to delete shipment:', err);
      alert(`Failed to delete shipment: ${err.message || 'Server error'}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCardClick = (shipment: Shipment) => {
    if (!canObserveTelemetry) {
      setUnauthorizedWarning(
        `🔒 Fleet Telemetry Restricted: Supply Hub & Government Authority clearance required to track ${shipment.tracking_code}.`
      );
      setTimeout(() => setUnauthorizedWarning(null), 5000);
      return;
    }

    onSelectShipment?.(shipment);
  };

  return (
    <div className="bg-white/95 dark:bg-[#041217]/90 backdrop-blur-xl rounded-2xl p-4 border border-slate-200 dark:border-teal-500/30 border-t-4 border-t-teal-500 shadow-md dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] transition-colors duration-200 space-y-3.5 text-slate-900 dark:text-slate-100">
      {/* Header (Tactical Dark Teal / Radar Emerald) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800/80 bg-teal-50/40 dark:bg-teal-950/20 p-2 rounded-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-inner">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-tight">
              Active Logistics & Fleet Tracking
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {canObserveTelemetry
                ? 'Tactical Telemetry, Dispatches & Citizen Radar'
                : 'Convoy Manifest Overview (Telemetry Locked)'}
            </p>
          </div>
        </div>

        {/* Tab Switcher (Fleet vs Radar) */}
        {canObserveTelemetry && (
          <div className="flex items-center bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200 dark:border-teal-800/40 text-xs">
            <button
              type="button"
              onClick={() => setFeedTab('fleet')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition ${
                feedTab === 'fleet'
                  ? 'bg-white dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-slate-200 dark:border-teal-600/50 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Convoys ({shipments.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFeedTab('radar')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition ${
                feedTab === 'radar'
                  ? 'bg-white dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-slate-200 dark:border-teal-600/50 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Radar className={`w-3.5 h-3.5 ${trackedCitizen ? 'text-emerald-400 animate-spin' : ''}`} />
              <span>Citizen Radar</span>
              {trackedCitizen && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Unauthorized Access Warning Banner */}
      {unauthorizedWarning && (
        <div className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500" />
            <span className="text-[11px] font-medium">{unauthorizedWarning}</span>
          </div>
          <button
            type="button"
            onClick={() => openAuthModal('hub')}
            className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[10px] whitespace-nowrap transition shadow-sm"
          >
            Hub Clearance
          </button>
        </div>
      )}

      {/* Mode View: Citizen Radar vs Convoy List */}
      {feedTab === 'radar' && canObserveTelemetry ? (
        <ClientUserTracker
          onTrackedLocationChange={onTrackedCitizenChange}
          activeTrackedUser={trackedCitizen}
        />
      ) : (
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
          {shipments.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 font-mono border border-dashed border-slate-300 dark:border-slate-800 rounded-xl">
              No active convoy shipments dispatched yet.
            </div>
          ) : (
          shipments.map((s) => {
            const isSelected = selectedShipmentId === s.id;
            const userCanDelete = canDeleteShipment(s);

            return (
              <div
                key={s.id}
                onClick={() => handleCardClick(s)}
                className={`p-3.5 rounded-xl border transition shadow-sm space-y-2 cursor-pointer relative group ${
                  isSelected
                    ? 'bg-cyan-500/10 border-cyan-500 dark:border-cyan-400 ring-1 ring-cyan-500/50 dark:bg-cyan-950/40 shadow-lg'
                    : 'bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800/80 hover:border-cyan-500/40 dark:hover:border-cyan-500/30'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0">
                      {getCargoIcon(s.cargo_type)}
                    </div>
                    <div>
                      <span className="font-mono text-xs font-bold text-cyan-700 dark:text-cyan-400">
                        {s.tracking_code}
                      </span>
                      {s.driver_name && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{s.driver_name}</span>
                          {s.driver_id && <span className="font-mono text-[9px]">({s.driver_id})</span>}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      P{s.priority_level}/5
                    </span>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                        s.current_status === 'REROUTED'
                          ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                          : s.current_status === 'IN_TRANSIT'
                          ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                          : s.current_status === 'DISRUPTED'
                          ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                      }`}
                    >
                      {s.current_status}
                    </span>

                    {/* Multi-Tenant Delete / Decommission Shipment Button */}
                    {userCanDelete && (
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, s)}
                        disabled={deletingId === s.id}
                        className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 transition text-[10px] font-bold flex items-center gap-1 shrink-0 ml-1"
                        title="Decommission Convoy (Hub Origin Owner Authorized)"
                      >
                        {deletingId === s.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Origin -> Destination route */}
                <div className="flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium">
                  <span className="truncate">{s.origin_name || 'Guwahati Hub'}</span>
                  <ArrowRight className="w-3 h-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <span className="truncate">{s.destination_name || 'Dest Terminal'}</span>
                </div>

                {s.cargo_manifest && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1">
                    📦 {s.cargo_manifest}
                  </p>
                )}

                {/* Real-time Telemetry Bar for Authorized Users */}
                {canObserveTelemetry && s.current_lat && s.current_lng ? (
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-[10px] font-mono text-cyan-300">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-slate-400">
                        <LocateFixed className="w-3 h-3 text-cyan-400 animate-pulse" />
                        {s.current_lat.toFixed(3)}°, {s.current_lng.toFixed(3)}°
                      </span>
                      {s.speed !== undefined && (
                        <span className="flex items-center gap-1 text-slate-300">
                          <Gauge className="w-3 h-3 text-teal-400" />
                          {s.speed} km/h
                        </span>
                      )}
                      {s.heading !== undefined && (
                        <span className="flex items-center gap-1 text-slate-300">
                          <Compass className="w-3 h-3 text-indigo-400" />
                          {s.heading}°
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] font-bold text-cyan-400 flex items-center gap-1">
                      <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                      {isSelected ? 'TRACKING' : 'CLICK TO TRACK'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-200 dark:border-slate-850">
                    <span>Weight: {s.weight_tonnes} Tonnes</span>
                    {!canObserveTelemetry && (
                      <span className="flex items-center gap-1 text-amber-500 dark:text-amber-400">
                        <Lock className="w-3 h-3" />
                        Telemetry Locked
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        </div>
      )}
    </div>
  );
}
