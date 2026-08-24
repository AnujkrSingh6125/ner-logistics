'use client';

import React, { useState, useEffect } from 'react';
import { SystemBroadcast } from '@/types';
import { useAuth } from '@/context/AuthContext';
import {
  AlertTriangle,
  Megaphone,
  Radio,
  PlusCircle,
  X,
  ShieldAlert,
  ChevronRight,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import CreateBroadcastModal from './CreateBroadcastModal';
import AllBroadcastsModal from './AllBroadcastsModal';

export default function BroadcastBanner() {
  const { isGovOfficial } = useAuth();
  const [broadcasts, setBroadcasts] = useState<SystemBroadcast[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAllModalOpen, setIsAllModalOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBroadcasts = async () => {
    try {
      const res = await fetch('/api/broadcasts');
      if (res.ok) {
        const data = await res.json();
        setBroadcasts(data);
      }
    } catch (err) {
      console.warn('Error loading broadcasts:', err);
    }
  };

  const handleDeleteBroadcast = async (id: string) => {
    if (!confirm('Are you sure you want to resolve and permanently remove this emergency broadcast?')) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/broadcasts?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBroadcasts((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete broadcast:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetchBroadcasts();
    const interval = setInterval(fetchBroadcasts, 30000); // 30s polling
    return () => clearInterval(interval);
  }, []);

  const activeBroadcasts = broadcasts.filter((b) => !dismissedIds.includes(b.id));

  // Rotate broadcasts every 7 seconds if multiple
  useEffect(() => {
    if (activeBroadcasts.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBroadcasts.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [activeBroadcasts.length]);

  if (activeBroadcasts.length === 0 && !isGovOfficial) return null;

  const current = activeBroadcasts[currentIndex] || activeBroadcasts[0];

  return (
    <>
      <div className="w-full bg-white/95 dark:bg-[#070e1c]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 text-xs px-4 py-2 flex items-center justify-between gap-3 shadow-xs dark:shadow-md z-30 transition-colors duration-200">
        <div
          onClick={() => setIsAllModalOpen(true)}
          className="flex items-center gap-2.5 overflow-hidden flex-1 cursor-pointer group"
          title="Click to view all regional emergency broadcasts"
        >
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-500/50 text-red-700 dark:text-red-400 font-mono font-bold text-[10px] shrink-0 animate-pulse shadow-sm shadow-red-500/20">
            <Radio className="w-3 h-3 text-red-600 dark:text-red-400" />
            <span>CORRIDOR ALERT</span>
          </div>

          {current ? (
            <div className="flex items-center gap-2 truncate">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 ${
                  current.severity === 'CRITICAL' || current.severity === 'EMERGENCY'
                    ? 'bg-red-600 text-white'
                    : 'bg-amber-600 text-white'
                }`}
              >
                {current.severity}
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition">
                {current.title}:
              </span>
              <span className="text-slate-600 dark:text-slate-300 truncate hidden sm:inline">
                {current.message}
              </span>
              <span className="text-[11px] text-cyan-700 dark:text-cyan-400 shrink-0 hidden md:inline font-mono">
                [{current.agency}]
              </span>
            </div>
          ) : (
            <span className="text-slate-500 dark:text-slate-400 italic">
              No active regional hazard advisories at this time.
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* View All Broadcasts Button */}
          <button
            type="button"
            onClick={() => setIsAllModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-mono font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-cyan-700 dark:text-cyan-300 border border-slate-200 dark:border-cyan-800/50 transition-all shadow-sm"
            title="View all active broadcasts bulletin"
          >
            <Megaphone className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
            <span>Bulletin ({broadcasts.length})</span>
          </button>

          {/* Government Official Emergency Alert Trigger */}
          {isGovOfficial && (
            <>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-semibold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white transition shadow-md shadow-red-600/20"
              >
                <PlusCircle className="w-3 h-3" />
                <span>Issue Alert</span>
              </button>

              {current && (
                <button
                  type="button"
                  onClick={() => handleDeleteBroadcast(current.id)}
                  disabled={isDeleting}
                  className="p-1 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 transition border border-red-200 dark:border-red-800/50"
                  title="Resolve & Permanently Delete Broadcast (Official Command)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}

          {current && !isGovOfficial && (
            <button
              type="button"
              onClick={() => setDismissedIds((prev) => [...prev, current.id])}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition"
              title="Dismiss for this session"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* View All Broadcasts Modal */}
      {isAllModalOpen && (
        <AllBroadcastsModal
          broadcasts={broadcasts}
          onClose={() => setIsAllModalOpen(false)}
          onRefresh={fetchBroadcasts}
          onOpenCreate={() => {
            setIsAllModalOpen(false);
            setIsModalOpen(true);
          }}
          onDeleteBroadcast={handleDeleteBroadcast}
        />
      )}

      {/* Emergency Broadcast Creator Modal */}
      {isModalOpen && (
        <CreateBroadcastModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchBroadcasts();
          }}
        />
      )}
    </>
  );
}
