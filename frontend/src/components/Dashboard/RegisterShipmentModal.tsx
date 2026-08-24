'use client';

import React, { useState } from 'react';
import { SupplyHub, CargoTier, CargoType, RegisterShipmentInput, Shipment } from '@/types';
import { BASELINE_SUPPLY_HUBS, insertShipment } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import {
  Truck,
  X,
  ShieldCheck,
  PackageCheck,
  AlertOctagon,
  Layers,
  FileText,
  User,
  Hash,
  MapPin,
  Scale,
} from 'lucide-react';

interface RegisterShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShipmentCreated: (shipment: Shipment) => void;
  defaultOriginHub?: SupplyHub | null;
  defaultDestHub?: SupplyHub | null;
  defaultCargoTier?: CargoTier;
}

export default function RegisterShipmentModal({
  isOpen,
  onClose,
  onShipmentCreated,
  defaultOriginHub,
  defaultDestHub,
  defaultCargoTier = 'TIER_1_CRITICAL',
}: RegisterShipmentModalProps) {
  const { user, isSupplyHub } = useAuth();

  const [driverName, setDriverName] = useState('Rajesh Borah');
  const [driverId, setDriverId] = useState(`NER-CIT-${Math.floor(10000 + Math.random() * 90000)}`);
  const [originHubId, setOriginHubId] = useState(defaultOriginHub?.id || BASELINE_SUPPLY_HUBS[0].id);
  const [destHubId, setDestHubId] = useState(defaultDestHub?.id || BASELINE_SUPPLY_HUBS[1].id);
  const [cargoType, setCargoType] = useState<CargoType>('MEDICINE');
  const [cargoTier, setCargoTier] = useState<CargoTier>(defaultCargoTier);
  const [cargoManifest, setCargoManifest] = useState('Critical Anti-Venom, Blood Units & Trauma Kits');
  const [weightTonnes, setWeightTonnes] = useState<number>(4.5);
  const [notes, setNotes] = useState('Priority Mountain Transit: Armed Escort & Active BRO Satellite Monitor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const originHub = BASELINE_SUPPLY_HUBS.find((h) => h.id === originHubId) || BASELINE_SUPPLY_HUBS[0];
  const destHub = BASELINE_SUPPLY_HUBS.find((h) => h.id === destHubId) || BASELINE_SUPPLY_HUBS[1];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName.trim()) {
      setErrorMessage('Driver Name is required.');
      return;
    }
    if (originHubId === destHubId) {
      setErrorMessage('Origin and Destination hubs must be distinct.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const input: RegisterShipmentInput = {
        driver_name: driverName.trim(),
        driver_id: driverId.trim(),
        origin_hub_id: originHub.id,
        origin_name: originHub.name,
        origin_lat: originHub.latitude,
        origin_lng: originHub.longitude,
        destination_hub_id: destHub.id,
        destination_name: destHub.name,
        destination_lat: destHub.latitude,
        destination_lng: destHub.longitude,
        cargo_type: cargoType,
        cargo_tier: cargoTier,
        cargo_manifest: cargoManifest.trim(),
        weight_tonnes: Number(weightTonnes) || 5,
        priority_level:
          cargoTier === 'TIER_1_CRITICAL' ? 5 : cargoTier === 'TIER_2_ESSENTIAL' ? 4 : 3,
        notes: notes.trim(),
      };

      const created = await insertShipment(input, user?.hub_code || user?.id);
      onShipmentCreated(created);
      onClose();
    } catch (err: any) {
      console.error('Shipment registration failed:', err);
      setErrorMessage(err?.message || 'Failed to dispatch shipment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 text-white flex items-center justify-between border-b border-cyan-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-400">
              <Truck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-wide text-white">
                  Dispatch Active Convoy Shipment
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  SUPPLY HUB AUTH
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Register driver telemetry & deploy corridor tracking to PostgreSQL
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/40 text-rose-600 dark:text-rose-400 rounded-2xl text-xs flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Hub Authorization Banner */}
          <div className="p-3 bg-cyan-500/5 dark:bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-4 h-4 text-cyan-500" />
              <span>
                Dispatching Operator:{' '}
                <strong className="text-cyan-600 dark:text-cyan-400">
                  {user?.full_name || 'Supply Hub Terminal Commander'}
                </strong>
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
              {user?.hub_code || 'HUB-SEC-01'}
            </span>
          </div>

          {/* Row 1: Driver Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-500" />
                Driver Full Name
              </label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="e.g. Rajesh Borah"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-cyan-500" />
                Citizen Driver UID
              </label>
              <input
                type="text"
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                placeholder="e.g. NER-CIT-88412"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
          </div>

          {/* Row 2: Route Strategic Hubs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                Origin Strategic Hub
              </label>
              <select
                value={originHubId}
                onChange={(e) => setOriginHubId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                {BASELINE_SUPPLY_HUBS.map((hub) => (
                  <option key={hub.id} value={hub.id}>
                    {hub.name} ({hub.state})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                Destination Supply Depot
              </label>
              <select
                value={destHubId}
                onChange={(e) => setDestHubId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                {BASELINE_SUPPLY_HUBS.map((hub) => (
                  <option key={hub.id} value={hub.id}>
                    {hub.name} ({hub.state})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Cargo Priority Tier & Cargo Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-500" />
                Cargo Priority Tier
              </label>
              <select
                value={cargoTier}
                onChange={(e) => setCargoTier(e.target.value as CargoTier)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <option value="TIER_1_CRITICAL">Tier 1: Critical (Medical / Relief / Rescue)</option>
                <option value="TIER_2_ESSENTIAL">Tier 2: Essential (Rations / Drinking Water)</option>
                <option value="TIER_3_BULK">Tier 3: Bulk (Fuel / Heavy Construction)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <PackageCheck className="w-3.5 h-3.5 text-cyan-500" />
                Cargo Category
              </label>
              <select
                value={cargoType}
                onChange={(e) => setCargoType(e.target.value as CargoType)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <option value="MEDICINE">Medical Supplies & Vaccines</option>
                <option value="PERISHABLE_FOOD">Perishable Rations & Food Packs</option>
                <option value="FUEL">Emergency Fuel & Petroleum</option>
                <option value="GENERAL">General Disaster Cargo</option>
              </select>
            </div>
          </div>

          {/* Row 4: Weight & Manifest */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-cyan-500" />
                Payload Weight (Tonnes)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="50"
                value={weightTonnes}
                onChange={(e) => setWeightTonnes(parseFloat(e.target.value) || 0)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-500" />
                Manifest Description
              </label>
              <input
                type="text"
                value={cargoManifest}
                onChange={(e) => setCargoManifest(e.target.value)}
                placeholder="e.g. Critical Anti-Venom, Blood Units & Trauma Kits"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
          </div>

          {/* Row 5: Tactical Notes */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-cyan-500" />
              Tactical Escort / Transit Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Priority Mountain Transit: Armed Escort & Active BRO Satellite Monitor"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl font-black text-xs bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 dark:text-white flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition"
            >
              {isSubmitting ? (
                <span>Authorizing in PostgreSQL...</span>
              ) : (
                <>
                  <Truck className="w-4 h-4" />
                  <span>Authorize & Deploy Convoy</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
