'use client';

import React from 'react';
import {
  Truck,
  RefreshCw,
  RotateCcw,
  AlertTriangle,
  Lock,
  User,
  ShieldAlert,
  Warehouse,
  Sun,
  Moon,
  LocateFixed,
  Radio,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useGps } from '@/context/LocationContext';
import UserProfileDropdown from '@/components/UserProfileDropdown';

interface HeaderProps {
  isSimulatingHazard: boolean;
  onToggleSimulation: () => void;
  onResetSimulation: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isGpsEnabled?: boolean;
  onToggleGps?: () => void;
}

export default function Header({
  isSimulatingHazard,
  onToggleSimulation,
  onResetSimulation,
  onRefresh,
  isRefreshing,
}: HeaderProps) {
  const { user, isGovOfficial, isLoggedIn, openAuthModal } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { statusText, badgeColor, toggleGps } = useGps();

  const handleHazardButtonClick = () => {
    if (isGovOfficial) {
      onToggleSimulation();
    } else {
      openAuthModal('gov');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#060b16]/85 backdrop-blur-xl border-b border-slate-800/70 px-4 py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Command Identity */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 shadow-md shadow-cyan-500/20 text-white flex items-center justify-center border border-cyan-400/30">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-sky-200 to-indigo-300 bg-clip-text text-transparent">
                NER Smart Logistics
              </h1>
              <span className="text-[9px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 px-1.5 py-0.2 rounded uppercase">
                v2.4 Live
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Disaster-Resilient Mountain Corridor Telemetry & Risk Dispatch
            </p>
          </div>
        </div>

        {/* Global Controls & Master Indicators */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all duration-200 shadow-sm"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-cyan-400" />
            )}
          </button>

          {/* Unified Master GPS Live Telemetry Switch */}
          <button
            onClick={toggleGps}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all duration-200 shadow-sm ${
              badgeColor === 'emerald'
                ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 hover:bg-emerald-900/60 shadow-emerald-500/10'
                : badgeColor === 'amber'
                ? 'bg-amber-950/60 border-amber-500/60 text-amber-300 hover:bg-amber-900/60'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/90'
            }`}
            title={
              statusText === 'LIVE CONNECTED'
                ? 'Live GPS Telemetry Connected: Click to Mute'
                : 'Live GPS Telemetry Muted: Click to Connect'
            }
          >
            <div className="relative flex items-center justify-center">
              {badgeColor === 'emerald' && (
                <span className="absolute w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-75"></span>
              )}
              <span
                className={`w-2 h-2 rounded-full ${
                  badgeColor === 'emerald'
                    ? 'bg-emerald-400'
                    : badgeColor === 'amber'
                    ? 'bg-amber-400'
                    : 'bg-slate-500'
                }`}
              ></span>
            </div>
            <LocateFixed
              className={`w-3.5 h-3.5 ${
                badgeColor === 'emerald'
                  ? 'text-emerald-400'
                  : badgeColor === 'amber'
                  ? 'text-amber-400'
                  : 'text-slate-500'
              }`}
            />
            <span className="hidden sm:inline">
              {statusText === 'LIVE CONNECTED'
                ? 'GPS Live: Connected'
                : statusText === 'GPS MUTED'
                ? 'GPS Muted'
                : 'GPS Paused: Manual'}
            </span>
          </button>

          {/* Refresh Spatial Layers Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all duration-200 disabled:opacity-50"
              title="Refresh spatial telemetry layers"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  isRefreshing ? 'animate-spin text-cyan-400' : 'text-slate-400'
                }`}
              />
              <span className="hidden sm:inline">Sync Data</span>
            </button>
          )}

          {/* Hazard Simulator Trigger */}
          <button
            onClick={handleHazardButtonClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 shadow-sm ${
              isSimulatingHazard
                ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse shadow-red-600/30'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-800'
            }`}
            title={
              isGovOfficial
                ? 'Simulate landslide/road disruption'
                : 'Government Clearance Required to inject disruptions'
            }
          >
            <AlertTriangle
              className={`w-3.5 h-3.5 ${isSimulatingHazard ? 'text-white' : 'text-amber-400'}`}
            />
            <span>
              {isSimulatingHazard
                ? 'Hazard Mode Active'
                : isGovOfficial
                ? 'Inject Hazard'
                : 'Simulate (Gov Locked)'}
            </span>
            {!isGovOfficial && <Lock className="w-3 h-3 text-slate-500" />}
          </button>

          {isGovOfficial && (
            <button
              onClick={onResetSimulation}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all duration-200"
              title="Reset custom injected hazards"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reset</span>
            </button>
          )}

          {/* User Profile Dropdown or Auth Portals */}
          {isLoggedIn && user ? (
            <UserProfileDropdown />
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => openAuthModal('public')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md shadow-cyan-600/20"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Citizen / Driver</span>
              </button>

              <button
                onClick={() => openAuthModal('gov')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white transition-all shadow-md"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">SDMA Command</span>
              </button>

              <button
                onClick={() => openAuthModal('hub')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md"
              >
                <Warehouse className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hub Depot</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
