'use client';

import React, { useState, useEffect } from 'react';
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
  Navigation,
  CheckCircle2,
} from 'lucide-react';

interface HazardSimulationModalProps {
  isOpen: boolean;
  clickedCoords: { latitude: number; longitude: number } | null;
  onClose: () => void;
  onSubmit: (hazard: SimulatedHazardInput) => Promise<void>;
}

// Preset Northeast Indian highway coordinates for rapid government dispatch
const CORRIDOR_PRESETS = [
  { name: 'NH-29 Kohima-Dimapur (Pagla Pahar)', lat: 25.782, lng: 93.921, highway: 'NH-29' },
  { name: 'NH-06 Silchar Kalain (Barak Valley)', lat: 24.965, lng: 92.652, highway: 'NH-06' },
  { name: 'NH-06 Umiam-Shillong Highland', lat: 25.672, lng: 91.912, highway: 'NH-06' },
  { name: 'NH-27 Guwahati East Corridor', lat: 26.1445, lng: 91.7362, highway: 'NH-27' },
  { name: 'NH-13 Bomdila High Pass', lat: 27.264, lng: 92.421, highway: 'NH-13' },
  { name: 'NH-02 Senapati-Imphal Link', lat: 25.263, lng: 94.021, highway: 'NH-02' },
];

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

  // Manual GPS Coordinates State
  const [latInput, setLatInput] = useState<string>('25.7820');
  const [lngInput, setLngInput] = useState<string>('93.9210');
  const [coordError, setCoordError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync coordinates when clickedCoords prop changes
  useEffect(() => {
    if (clickedCoords) {
      setLatInput(clickedCoords.latitude.toFixed(4));
      setLngInput(clickedCoords.longitude.toFixed(4));
      setCoordError(null);
    }
  }, [clickedCoords]);

  // Update default agency if user logs in
  useEffect(() => {
    if (user?.agency_name) {
      setGovBody(`${user.agency_name} (${user.state || 'Command'})`);
    }
  }, [user]);

  if (!isOpen) return null;

  // Validate GPS Coordinates
  const validateGps = (latStr: string, lngStr: string): { valid: boolean; lat: number; lng: number; error?: string } => {
    const lat = parseFloat(latStr.trim());
    const lng = parseFloat(lngStr.trim());

    if (isNaN(lat) || isNaN(lng)) {
      return {
        valid: false,
        lat: 0,
        lng: 0,
        error: 'GPS Coordinates must be valid numeric values (e.g. Latitude: 26.1445, Longitude: 91.7362).',
      };
    }

    if (lat < -90 || lat > 90) {
      return {
        valid: false,
        lat,
        lng,
        error: `Invalid Latitude (${lat}°). Latitude must be between -90.0° and +90.0°.`,
      };
    }

    if (lng < -180 || lng > 180) {
      return {
        valid: false,
        lat,
        lng,
        error: `Invalid Longitude (${lng}°). Longitude must be between -180.0° and +180.0°.`,
      };
    }

    return { valid: true, lat, lng };
  };

  const handleApplyPreset = (preset: typeof CORRIDOR_PRESETS[0]) => {
    setLatInput(preset.lat.toFixed(4));
    setLngInput(preset.lng.toFixed(4));
    setHighway(preset.highway);
    setCoordError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCoordError(null);

    // Validate GPS Coordinates
    const check = validateGps(latInput, lngInput);
    if (!check.valid) {
      setCoordError(check.error || 'Invalid GPS Coordinates.');
      return;
    }

    if (!title.trim() || !message.trim()) {
      alert('Hazard Title and Official Directive Message are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const reportingAgency =
        govBody.trim() ||
        (user?.agency_name ? `${user.agency_name} (${user.state || 'Command'})` : 'Emergency Management Authority');

      await onSubmit({
        title: title.trim(),
        disruption_type: type,
        severity,
        latitude: check.lat,
        longitude: check.lng,
        risk_radius_meters: radiusMeters,
        highway_reference: highway.trim(),
        message: message.slice(0, 500).trim(),
        government_body_name: reportingAgency,
        reported_by_agency: reportingAgency,
        created_by: user?.id,
        description: `${description || message} [Reported by: ${reportingAgency}]`,
      });
      onClose();
    } catch (err: any) {
      console.error('Failed to submit simulated hazard:', err);
      setCoordError(err.message || 'Failed to inject hazard.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const gpsCheck = validateGps(latInput, lngInput);

  return (
    <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#1c2541] border border-slate-700/80 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-100 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-red-950/70 to-purple-950/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-100">
                  Broadcast & Inject Road Hazard
                </h3>
                <span className="text-[10px] bg-red-950 text-red-300 border border-red-800/60 px-1.5 py-0.5 rounded font-mono flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                  Government Direct Access
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Reporting Authority: <span className="text-amber-300 font-semibold">{govBody || 'Verified Official'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
          {/* Manual GPS Coordinates Input Section */}
          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                <span>Manual GPS Coordinates / Pin Point:</span>
              </div>
              {gpsCheck.valid ? (
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Valid Coordinate
                </span>
              ) : (
                <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800/60 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  Invalid GPS
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-medium text-slate-400 mb-1">
                  Latitude (° North/South):
                </label>
                <input
                  type="text"
                  value={latInput}
                  onChange={(e) => {
                    setLatInput(e.target.value);
                    setCoordError(null);
                  }}
                  placeholder="e.g. 25.7820"
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 font-mono rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-slate-400 mb-1">
                  Longitude (° East/West):
                </label>
                <input
                  type="text"
                  value={lngInput}
                  onChange={(e) => {
                    setLngInput(e.target.value);
                    setCoordError(null);
                  }}
                  placeholder="e.g. 93.9210"
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 font-mono rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-xs"
                  required
                />
              </div>
            </div>

            {/* Error Banner if Coordinates are Invalid */}
            {(coordError || !gpsCheck.valid) && (
              <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-200 text-[11px] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{coordError || gpsCheck.error}</span>
              </div>
            )}

            {/* Quick Regional Presets */}
            <div>
              <label className="block text-[10px] font-medium text-slate-400 mb-1">
                Quick Regional Highway Presets:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CORRIDOR_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="px-2 py-1 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/50 transition font-sans"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
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
          <div className="flex gap-2 pt-2 border-t border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !gpsCheck.valid}
              className="flex-2 flex-grow bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold px-4 py-2 rounded-lg transition shadow-lg flex items-center justify-center gap-2 text-xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Injecting Hazard at Target Coordinates...</span>
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
