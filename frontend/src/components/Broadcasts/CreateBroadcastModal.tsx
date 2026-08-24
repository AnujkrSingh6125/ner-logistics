'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { BroadcastSeverity } from '@/types';
import {
  ShieldAlert,
  X,
  Radio,
  Send,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

interface CreateBroadcastModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateBroadcastModal({
  onClose,
  onSuccess,
}: CreateBroadcastModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<BroadcastSeverity>('CRITICAL');
  const [affectedRegion, setAffectedRegion] = useState('Northeast Regional Freight Corridor');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setErrorMsg('Title and advisory message are required.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/broadcasts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user?.role || 'gov_official',
          'x-user-agency': user?.agency_name || 'Disaster Management Authority',
          'x-user-name': user?.full_name || 'Command Official',
        },
        body: JSON.stringify({
          title,
          message,
          severity,
          affected_region: affectedRegion,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess();
      } else {
        setErrorMsg(data.error || 'Failed to dispatch broadcast.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error dispatching broadcast.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 bg-red-950/80 border-b border-red-900/60">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-400 animate-pulse" />
            <h3 className="font-bold text-sm text-red-100">Issue Emergency System Broadcast</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-200 text-xs">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Warning Severity Level
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['INFO', 'WARNING', 'CRITICAL', 'EMERGENCY'] as BroadcastSeverity[]).map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverity(sev)}
                  className={`py-1.5 rounded-lg text-[11px] font-bold transition uppercase ${
                    severity === sev
                      ? sev === 'EMERGENCY'
                        ? 'bg-rose-600 text-white'
                        : sev === 'CRITICAL'
                        ? 'bg-amber-600 text-white'
                        : sev === 'WARNING'
                        ? 'bg-orange-600 text-white'
                        : 'bg-blue-600 text-white'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Advisory Headline
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. NH-29 Landslide Flash Red Alert"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500 text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Affected Corridor / Region
            </label>
            <input
              type="text"
              value={affectedRegion}
              onChange={(e) => setAffectedRegion(e.target.value)}
              placeholder="e.g. Kohima - Dimapur Segment"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Emergency Guidance Message
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Provide detour instructions, convoy hold points, or relief depot contacts..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500 text-xs"
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white disabled:opacity-50 transition shadow"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Dispatching...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Broadcast Across All Terminals
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
