'use client';

import React, { useState } from 'react';
import {
  DisruptionType,
  SeverityLevel,
  SimulatedHazardInput,
} from '@/types';
import { useAuth } from '@/context/AuthContext';
import {
  AlertTriangle,
  Flame,
  Waves,
  ShieldAlert,
  ShieldCheck,
  Construction,
  X,
  MapPin,
  Sparkles,
  Sliders,
  Send,
  Loader2,
} from 'lucide-react';

interface HazardSimulationModalProps {
  isOpen: boolean;
  clickedCoords: { latitude: number; longitude: number } | null;
  onClose: () => void;
  onSubmit: (hazard: SimulatedHazardInput) => Promise<void>;
}

export default function HazardSimulationModal({
  isOpen,
  clickedCoords,
  onClose,
  onSubmit,
}: HazardSimulationModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('Severe Mudslide & Debris Flow');
  const [govBody, setGovBody] = useState(
    user?.agency_name ? `${user.agency_name} (${user.state || 'Command'})` : 'Assam SDMA (State Disaster Management)'
  );
  const [type, setType] = useState<DisruptionType>('LANDSLIDE');
  const [severity, setSeverity] = useState<SeverityLevel>('CRITICAL');
  const [radiusMeters, setRadiusMeters] = useState<number>(3000);
  const [highway, setHighway] = useState('NH-27 / Asian Highway 1');
  const [message, setMessage] = useState(
    'Heavy mudslide and slope failure blocking both carriageway lanes. Commercial freight trucks must divert immediately.'
  );
  const [description, setDescription] = useState(
    'Heavy precipitation triggered slope failure blocking dual carriageway. Urgent logistics reroute requested.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !clickedCoords) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message.trim()) return;

    setIsSubmitting(true);
    try {
      const reportingAgency = govBody.trim() || (user?.agency_name ? `${user.agency_name} (${user.state || 'Command'})` : 'Emergency Management Authority');

      await onSubmit({
        title,
        disruption_type: type,
        severity,
        latitude: clickedCoords.latitude,
        longitude: clickedCoords.longitude,
        risk_radius_meters: radiusMeters,
        highway_reference: highway,
        message: message.slice(0, 500).trim(),
        government_body_name: reportingAgency,
        reported_by_agency: reportingAgency,
        created_by: user?.id,
        description: `${description || message} [Reported by: ${reportingAgency}]`,
      });
      onClose();
    } catch (err) {
      console.error('Failed to submit simulated hazard:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1c2541] border border-slate-700 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-red-950/60 to-purple-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-100">
                  Simulate / Report Road Disruption
                </h3>
                <span className="text-[10px] bg-red-950 text-red-300 border border-red-800/60 px-1.5 py-0.5 rounded font-mono flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                  Official Broadcast
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Reporting Authority: <span className="text-amber-300 font-semibold">{govBody || 'Verified Official'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {/* Coordinates Chip */}
          <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span className="font-medium">Target GPS Coordinates:</span>
            </div>
            <span className="font-mono text-cyan-300 font-bold bg-slate-800 px-2 py-0.5 rounded">
              {clickedCoords.latitude.toFixed(4)}° N,{' '}
              {clickedCoords.longitude.toFixed(4)}° E
            </span>
          </div>

          {/* Reporting Government Body Name */}
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Submitting Government Agency / Body:
            </label>
            <input
              type="text"
              value={govBody}
              onChange={(e) => setGovBody(e.target.value)}
              placeholder="e.g. BRO Project Vartak, Assam SDMA, NHAI Dimapur"
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
              required
            />
          </div>

          {/* Hazard Title */}
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Hazard Incident Title:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Flash Flood near Guwahati-Shillong Highway"
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
              required
            />
          </div>

          {/* Type & Severity Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Disruption Type:
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as DisruptionType)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
              >
                <option value="LANDSLIDE">Landslide / Mudslide</option>
                <option value="FLASH_FLOOD">Flash Flood / Inundation</option>
                <option value="BRIDGE_DAMAGE">Bridge Structural Damage</option>
                <option value="ROAD_BLOCK">Transit Road Blockade</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Hazard Severity:
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none font-bold"
              >
                <option value="CRITICAL" className="text-red-400">
                  CRITICAL (Complete Block)
                </option>
                <option value="HIGH" className="text-orange-400">
                  HIGH (Severe Hazard)
                </option>
                <option value="MEDIUM" className="text-amber-400">
                  MEDIUM (Moderate Delay)
                </option>
                <option value="LOW" className="text-yellow-400">
                  LOW (Caution)
                </option>
              </select>
            </div>
          </div>

          {/* Impact Radius Slider */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Impact / Risk Radius (Turf.js Buffer):</span>
              </label>
              <span className="font-mono font-bold text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {(radiusMeters / 1000).toFixed(1)} km ({radiusMeters}m)
              </span>
            </div>
            <input
              type="range"
              min="1000"
              max="10000"
              step="500"
              value={radiusMeters}
              onChange={(e) => setRadiusMeters(Number(e.target.value))}
              className="w-full accent-red-500 bg-slate-900 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
              <span>1 km (Local)</span>
              <span>5 km (Regional Corridor)</span>
              <span>10 km (Catastrophic)</span>
            </div>
          </div>

          {/* Highway Reference */}
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Highway / Route Reference:
            </label>
            <input
              type="text"
              value={highway}
              onChange={(e) => setHighway(e.target.value)}
              placeholder="e.g. NH-29 / NH-06 / NH-27"
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>

          {/* Official Government Directive Message (Max 500 chars) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-medium text-slate-300">
                Official Advisory Message / Directive (Broadcasted to Fleets):
              </label>
              <span
                className={`font-mono text-[10px] font-bold ${
                  message.length > 450
                    ? 'text-red-400'
                    : message.length > 350
                    ? 'text-amber-400'
                    : 'text-cyan-400'
                }`}
              >
                {message.length}/500
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={500}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Sinking zone at Pagla Pahar restricts heavy freight vehicles. Reroute via NH-02 immediately."
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 focus:outline-none text-xs leading-relaxed"
              required
            />
            <p className="text-[10px] text-slate-500 mt-0.5">
              This exact official directive is stored in the database and cited verbatim by the AI Assistant.
            </p>
          </div>

          {/* Submit & Cancel Actions */}
          <div className="flex gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-2 flex-grow bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold px-4 py-2 rounded-lg transition shadow-lg flex items-center justify-center gap-2 text-xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Broadcasting Incident...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Broadcast Hazard & Auto-Reroute</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
