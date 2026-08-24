'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  User,
  Shield,
  Warehouse,
  Copy,
  Check,
  LogOut,
  Trash2,
  Radio,
  ChevronDown,
  Navigation,
  Mail,
  Phone,
  Sun,
  Moon,
  AlertTriangle,
} from 'lucide-react';

export default function UserProfileDropdown() {
  const {
    user,
    isGovOfficial,
    isHubOperator,
    isPublicUser,
    logout,
    deleteAccount,
    toggleLocationSharing,
  } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const displayName = user.full_name || (user as any).fullName || 'Citizen User';
  const displayId =
    user.citizen_uid ||
    user.official_id ||
    user.hub_code ||
    (user as any).uniqueId ||
    user.id;
  const displayPhone = user.phone || '+91 98765 43210';
  const isSharingLoc = user.is_sharing_location ?? (user as any).isSharingLocation ?? true;

  const handleCopyId = () => {
    if (displayId) {
      navigator.clipboard.writeText(displayId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDeletePermanent = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      setShowDeleteConfirm(false);
      setIsOpen(false);
    } catch (err) {
      console.error('Account deletion failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadge = () => {
    if (isGovOfficial || user.role === 'gov_official' || (user.role as string) === 'government') {
      return {
        label: user.agency_name || 'Gov / SDMA Terminal',
        color: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
        icon: Shield,
        tag: 'Official Clearance ID',
      };
    }
    if (isHubOperator || user.role === 'hub_operator' || (user.role as string) === 'supply_hub') {
      return {
        label: user.agency_name || 'Strategic Supply Hub',
        color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
        icon: Warehouse,
        tag: 'Depot Terminal Code',
      };
    }
    return {
      label: 'Verified Citizen / Driver',
      color: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
      icon: User,
      tag: 'Citizen Tracking UID',
    };
  };

  const roleInfo = getRoleBadge();
  const RoleIcon = roleInfo.icon;
  const avatarLetter = (displayName ? displayName.charAt(0) : user.email?.charAt(0) || 'U').toUpperCase();

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Topbar Avatar Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 dark:bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-inner ${
            isGovOfficial
              ? 'bg-gradient-to-tr from-amber-600 to-red-600'
              : isHubOperator
              ? 'bg-gradient-to-tr from-emerald-600 to-teal-500'
              : 'bg-gradient-to-tr from-cyan-600 to-blue-600'
          }`}
        >
          {avatarLetter}
        </div>
        <div className="flex flex-col text-left hidden sm:flex leading-tight">
          <span className="text-xs font-bold text-slate-100 dark:text-slate-100 truncate max-w-[130px]">
            {displayName}
          </span>
          <span className="text-[10px] text-cyan-400 font-mono truncate max-w-[130px]">
            {displayId}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-cyan-400' : ''
          }`}
        />
      </button>

      {/* Dropdown Drawer Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 rounded-2xl bg-slate-900 dark:bg-slate-900 border border-slate-700/90 shadow-2xl z-50 overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150 text-slate-100">
          {/* Header & Identity Card */}
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${roleInfo.color}`}
              >
                <RoleIcon className="w-3 h-3" />
                <span className="truncate max-w-[160px]">{roleInfo.label}</span>
              </span>

              {isPublicUser && (
                <button
                  type="button"
                  onClick={toggleLocationSharing}
                  className={`flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-md border transition ${
                    isSharingLoc
                      ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                  title="Click to toggle GPS location telemetry sharing"
                >
                  <Radio
                    className={`w-3 h-3 text-emerald-400 ${
                      isSharingLoc ? 'animate-pulse' : 'opacity-40'
                    }`}
                  />
                  <span>{isSharingLoc ? 'GPS Live' : 'GPS Idle'}</span>
                </button>
              )}
            </div>

            {/* Profile Info Details */}
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                <User className="w-4 h-4 text-cyan-400" />
                <span>{displayName}</span>
              </h4>
              <p className="text-xs text-slate-300 truncate flex items-center gap-1.5 font-mono">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{user.email}</span>
              </p>
              <p className="text-xs text-emerald-300 truncate flex items-center gap-1.5 font-mono">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{displayPhone}</span>
              </p>
            </div>

            {/* Unique Citizen / Terminal Tracking UID */}
            <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                  {roleInfo.tag}
                </p>
                <p className="text-xs font-mono font-bold text-cyan-400 tracking-wide">
                  {displayId}
                </p>
              </div>
              <button
                onClick={handleCopyId}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Copy Unique ID to clipboard"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Action List */}
          <div className="p-2 space-y-1">
            {/* Theme Toggle in Dropdown */}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <span className="flex items-center gap-2.5">
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-cyan-400" />
                )}
                <span>Interface Theme</span>
              </span>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </span>
            </button>

            {/* GPS Telemetry Toggle Option for Drivers */}
            {isPublicUser && (
              <button
                onClick={toggleLocationSharing}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Navigation className="w-4 h-4 text-cyan-400" />
                  <span>Live GPS Corridor Telemetry</span>
                </span>
                <span
                  className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                    isSharingLoc
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isSharingLoc ? 'ACTIVE' : 'MUTED'}
                </span>
              </button>
            )}

            {/* Logout Option */}
            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              <span>Sign Out from Terminal</span>
            </button>

            {/* Delete Account (Citizen Exclusive) */}
            {isPublicUser && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Delete Citizen Profile Permanently</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Overlay */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div
            className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-rose-400">
              <Trash2 className="w-5 h-5" /> Permanent Account Deletion
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Are you sure you want to permanently delete your citizen account? All registered profile data for{' '}
              <strong className="text-white">{displayName}</strong> (<span className="text-emerald-400 font-mono">{displayPhone}</span>), tracking UID (
              <span className="text-cyan-400 font-mono font-bold">{displayId}</span>), and live GPS telemetry journeys will be permanently erased from PostgreSQL. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePermanent}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors flex items-center gap-2 shadow"
              >
                {isDeleting ? 'Purging Database Records...' : 'Yes, Purge Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
