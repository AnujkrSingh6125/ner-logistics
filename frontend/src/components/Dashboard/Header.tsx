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
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import UserProfileDropdown from '@/components/UserProfileDropdown';

interface HeaderProps {
  isSimulatingHazard: boolean;
  onToggleSimulation: () => void;
  onResetSimulation: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function Header({
  isSimulatingHazard,
  onToggleSimulation,
  onResetSimulation,
  onRefresh,
  isRefreshing,
}: HeaderProps) {
  const {
    user,
    isGovOfficial,
    isLoggedIn,
    openAuthModal,
  } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleHazardButtonClick = () => {
    if (isGovOfficial) {
      onToggleSimulation();
    } else {
      openAuthModal('gov');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 shadow-sm dark:shadow-lg transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 shadow-md shadow-blue-500/20 text-white flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-600 dark:from-blue-400 dark:via-indigo-200 dark:to-cyan-400 bg-clip-text text-transparent">
              NER Smart Logistics
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Disaster-Resilient Logistics & Corridor Monitoring Platform
            </p>
          </div>
        </div>

        {/* Global Action & Auth Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition shadow-sm"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-cyan-600" />
            )}
          </button>

          {/* Refresh Spatial Layers Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition disabled:opacity-50"
              title="Refresh spatial layers"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-600 dark:text-cyan-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}

          {/* Hazard Simulator Trigger */}
          <button
            onClick={handleHazardButtonClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
              isSimulatingHazard
                ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                : 'bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
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
                ? 'Hazard Active'
                : isGovOfficial
                ? 'Inject Hazard'
                : 'Simulate (Gov Locked)'}
            </span>
            {!isGovOfficial && <Lock className="w-3 h-3 text-slate-400" />}
          </button>

          {isGovOfficial && (
            <button
              onClick={onResetSimulation}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
              title="Reset custom injected hazards"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span>Reset Demo</span>
            </button>
          )}

          {/* User Profile Dropdown or Auth Portals Trigger */}
          {isLoggedIn && user ? (
            <UserProfileDropdown />
          ) : (
            /* Unauthenticated: 3 Auth Portals Trigger */
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => openAuthModal('public')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition shadow"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Citizen / Driver</span>
              </button>

              <button
                onClick={() => openAuthModal('gov')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white transition shadow"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">SDMA / Command</span>
              </button>

              <button
                onClick={() => openAuthModal('hub')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow"
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
