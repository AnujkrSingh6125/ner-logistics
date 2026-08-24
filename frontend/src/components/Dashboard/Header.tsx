'use client';

import React, { useState } from 'react';
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
  Menu,
  X,
  Radio,
  ChevronRight,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleHazardButtonClick = () => {
    if (isGovOfficial) {
      onToggleSimulation();
    } else {
      openAuthModal('gov');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#060b16]/95 backdrop-blur-2xl border-b border-slate-200 dark:border-slate-800/80 px-3 sm:px-4 py-2 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Brand & Command Identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 shadow-md shadow-cyan-500/20 text-white flex items-center justify-center border border-cyan-400/30 shrink-0">
              <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 leading-tight">
                <h1 className="text-sm sm:text-base font-black tracking-tight bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 dark:from-cyan-400 dark:via-sky-200 dark:to-indigo-300 bg-clip-text text-transparent truncate">
                  NER Logistics
                </h1>
                <span className="text-[8px] sm:text-[9px] font-mono font-bold bg-cyan-100 text-cyan-800 border border-cyan-300 dark:bg-cyan-950/80 dark:text-cyan-300 dark:border-cyan-800/60 px-1.5 py-0.2 rounded uppercase shrink-0">
                  v2.4
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate hidden sm:block">
                Mountain Corridor Telemetry & Risk Dispatch
              </p>
            </div>
          </div>

          {/* Quick Right Driver Actions & Master Indicators */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Unified Master GPS Live Telemetry Switch (Min 44px target on mobile) */}
            <button
              type="button"
              onClick={toggleGps}
              className={`min-h-[44px] px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all duration-200 shadow-sm flex items-center gap-1.5 ${
                badgeColor === 'emerald'
                  ? 'bg-emerald-100 border-emerald-400 text-emerald-800 dark:bg-emerald-950/70 dark:border-emerald-500/60 dark:text-emerald-300 shadow-emerald-500/10'
                  : badgeColor === 'amber'
                  ? 'bg-amber-100 border-amber-400 text-amber-800 dark:bg-amber-950/70 dark:border-amber-500/60 dark:text-amber-300'
                  : 'bg-slate-100 border-slate-300 text-slate-600 hover:text-slate-900 dark:bg-slate-900/80 dark:border-slate-800 dark:text-slate-400'
              }`}
              title={
                statusText === 'LIVE CONNECTED'
                  ? 'Live GPS Telemetry Connected: Click to Mute'
                  : 'Live GPS Telemetry Muted: Click to Connect'
              }
              aria-label="Toggle GPS"
            >
              <div className="relative flex items-center justify-center">
                {badgeColor === 'emerald' && (
                  <span className="absolute w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping opacity-75"></span>
                )}
                <span
                  className={`w-2 h-2 rounded-full ${
                    badgeColor === 'emerald'
                      ? 'bg-emerald-600 dark:bg-emerald-400'
                      : badgeColor === 'amber'
                      ? 'bg-amber-600 dark:bg-amber-400'
                      : 'bg-slate-400 dark:bg-slate-500'
                  }`}
                ></span>
              </div>
              <LocateFixed
                className={`w-3.5 h-3.5 ${
                  badgeColor === 'emerald'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : badgeColor === 'amber'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-500'
                }`}
              />
              <span className="text-[11px] hidden xs:inline">
                {statusText === 'LIVE CONNECTED'
                  ? 'GPS Live'
                  : statusText === 'GPS MUTED'
                  ? 'Muted'
                  : 'Manual'}
              </span>
            </button>

            {/* Desktop Hazard Simulator Button */}
            <button
              type="button"
              onClick={handleHazardButtonClick}
              className={`hidden md:flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 shadow-sm ${
                isSimulatingHazard
                  ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse shadow-red-600/30'
                  : 'bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800'
              }`}
              title={
                isGovOfficial
                  ? 'Simulate landslide/road disruption'
                  : 'Government Clearance Required to inject disruptions'
              }
            >
              <AlertTriangle
                className={`w-3.5 h-3.5 ${isSimulatingHazard ? 'text-white' : 'text-amber-500 dark:text-amber-400'}`}
              />
              <span>
                {isSimulatingHazard
                  ? 'Hazard Mode'
                  : isGovOfficial
                  ? 'Inject Hazard'
                  : 'Simulate (Gov)'}
              </span>
              {!isGovOfficial && <Lock className="w-3 h-3 text-slate-400 dark:text-slate-500" />}
            </button>

            {/* Theme Toggle Button (Min 44px) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition shadow-sm"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-cyan-600" />
              )}
            </button>

            {/* Profile Dropdown or Auth Triggers */}
            {isLoggedIn && user ? (
              <UserProfileDropdown />
            ) : (
              <div className="hidden lg:flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openAuthModal('public')}
                  className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-md"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Citizen / Driver</span>
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal('gov')}
                  className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white transition shadow-md"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>SDMA</span>
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal('hub')}
                  className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-md"
                >
                  <Warehouse className="w-3.5 h-3.5" />
                  <span>Hub Depot</span>
                </button>
              </div>
            )}

            {/* Mobile Menu Drawer Trigger (Mobile-Only) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 transition"
              aria-label="Open Mobile Command Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Over Command Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[99999] lg:hidden flex justify-end bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-xs h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col p-5 space-y-4 overflow-y-auto">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-cyan-500" />
                <span className="font-black text-sm text-slate-900 dark:text-white">Command Center</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Telemetry Status Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                Driver Telemetry Status
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">GPS Engine</span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    badgeColor === 'emerald'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}
                >
                  {statusText}
                </span>
              </div>
            </div>

            {/* Action Buttons Stack (Driver Ergonomics) */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                Portal Authentication
              </span>

              {!isLoggedIn ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openAuthModal('public');
                    }}
                    className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-between shadow-md"
                  >
                    <div className="flex items-center gap-2.5">
                      <User className="w-4 h-4" />
                      <span>Citizen / Driver Portal</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openAuthModal('gov');
                    }}
                    className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-red-600 text-white font-bold text-xs flex items-center justify-between shadow-md"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldAlert className="w-4 h-4" />
                      <span>State SDMA Command</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openAuthModal('hub');
                    }}
                    className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-between shadow-md"
                  >
                    <div className="flex items-center gap-2.5">
                      <Warehouse className="w-4 h-4" />
                      <span>Supply Hub Terminal</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 font-bold">
                  Active Session: {user?.full_name} ({user?.role})
                </div>
              )}

              {/* Hazard Simulation Trigger */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleHazardButtonClick();
                }}
                className={`w-full min-h-[48px] px-4 py-3 rounded-2xl font-bold text-xs flex items-center justify-between border transition ${
                  isSimulatingHazard
                    ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>
                    {isSimulatingHazard
                      ? 'Hazard Mode Active'
                      : isGovOfficial
                      ? 'Inject Hazard'
                      : 'Hazard Simulator (Gov)'}
                  </span>
                </div>
                {!isGovOfficial && <Lock className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {onRefresh && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onRefresh();
                  }}
                  disabled={isRefreshing}
                  className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-between border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-2.5">
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>Sync Geospatial Layers</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
