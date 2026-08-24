'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Dashboard/Header';
import BroadcastBanner from '@/components/Broadcasts/BroadcastBanner';
import StatsOverview from '@/components/Dashboard/StatsOverview';
import LogisticsMap from '@/components/Map/LogisticsMap';
import RoutePlanner from '@/components/Dashboard/RoutePlanner';
import DisruptionAlerts from '@/components/Dashboard/DisruptionAlerts';
import ShipmentFeed from '@/components/Dashboard/ShipmentFeed';
import HazardSimulationModal from '@/components/Dashboard/HazardSimulationModal';
import AlternateHubRecommender from '@/components/Dashboard/AlternateHubRecommender';
import DisruptionAssistantChat from '@/components/Chat/DisruptionAssistantChat';
import AuthModal from '@/components/Auth/AuthModal';
import { useAuth } from '@/context/AuthContext';
import {
  supabase,
  fetchSupplyHubs,
  fetchRoadDisruptions,
  fetchShipments,
  BASELINE_SUPPLY_HUBS,
  BASELINE_DISRUPTIONS,
  FALLBACK_SHIPMENTS,
} from '@/lib/supabaseClient';
import {
  SupplyHub,
  RoadDisruption,
  Shipment,
  DisasterResilientRouteResponse,
  SimulatedHazardInput,
  CargoTier,
  HubRecommendation,
} from '@/types';
import { calculateRoute } from '@/lib/api';
import { recommendAlternateHubs } from '@/lib/spatial';
import {
  Layers,
  Eye,
  EyeOff,
  ShieldAlert,
  CircleDot,
  Sparkles,
  Building2,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isGovOfficial, openAuthModal } = useAuth();

  // Pre-seed state with baseline data for instant hydration & 100% offline resilience
  const [hubs, setHubs] = useState<SupplyHub[]>(BASELINE_SUPPLY_HUBS);
  const [disruptions, setDisruptions] = useState<RoadDisruption[]>(BASELINE_DISRUPTIONS);
  const [shipments, setShipments] = useState<Shipment[]>(FALLBACK_SHIPMENTS);

  // Selection and routing states
  const [selectedHub, setSelectedHub] = useState<SupplyHub | null>(null);
  const [originHub, setOriginHub] = useState<SupplyHub | null>(
    BASELINE_SUPPLY_HUBS.find((h) => h.name.includes('Dimapur')) || BASELINE_SUPPLY_HUBS[0]
  );
  const [destHub, setDestHub] = useState<SupplyHub | null>(
    BASELINE_SUPPLY_HUBS.find((h) => h.name.includes('Kohima')) || BASELINE_SUPPLY_HUBS[4]
  );
  const [cargoTier, setCargoTier] = useState<CargoTier>('TIER_1_CRITICAL');
  const [routeData, setRouteData] =
    useState<DisasterResilientRouteResponse | null>(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [activeRouteView, setActiveRouteView] = useState<
    'PRIMARY' | 'DETOUR' | 'BOTH'
  >('BOTH');

  // Simulation State (Restricted to Government Officials)
  const [isSimulatingHazard, setIsSimulatingHazard] = useState<boolean>(false);
  const [simulationModalOpen, setSimulationModalOpen] = useState<boolean>(false);
  const [clickedMapCoords, setClickedMapCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Alternate Hubs Recommendation State
  const [showAlternateHubs, setShowAlternateHubs] = useState<boolean>(false);
  const [hubRecommendations, setHubRecommendations] = useState<
    HubRecommendation[]
  >([]);

  // Layer visibility toggles
  const [showHubs, setShowHubs] = useState<boolean>(true);
  const [showDisruptions, setShowDisruptions] = useState<boolean>(true);
  const [showBuffers, setShowBuffers] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Initial Data Load from Supabase (fails gracefully to baseline)
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [hubsData, disruptionsData, shipmentsData] = await Promise.all([
        fetchSupplyHubs(),
        fetchRoadDisruptions(),
        fetchShipments(),
      ]);
      if (hubsData && hubsData.length > 0) setHubs(hubsData);
      if (disruptionsData && disruptionsData.length > 0) setDisruptions(disruptionsData);
      if (shipmentsData && shipmentsData.length > 0) setShipments(shipmentsData);
    } catch (err) {
      console.warn('Supabase fetch error, fallback active:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime Supabase Subscription on road_disruptions table
  useEffect(() => {
    if (!supabase) return;

    console.log('[SUPABASE REALTIME] Subscribing to public:road_disruptions...');
    const channel = supabase
      .channel('public:road_disruptions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'road_disruptions' },
        (payload) => {
          console.log('[SUPABASE REALTIME DISRUPTIONS EVENT]', payload.eventType, payload);
          if (payload.eventType === 'INSERT') {
            const newDisruption = payload.new as RoadDisruption;
            setDisruptions((prev) => {
              if (prev.some((d) => d.id === newDisruption.id)) return prev;
              return [newDisruption, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedDisruption = payload.new as RoadDisruption;
            setDisruptions((prev) =>
              prev.map((d) => (d.id === updatedDisruption.id ? updatedDisruption : d))
            );
          } else if (payload.eventType === 'DELETE') {
            const oldId = payload.old?.id;
            if (oldId) {
              setDisruptions((prev) => prev.filter((d) => d.id !== oldId));
            }
          }
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // If user logs out, turn off simulation mode automatically
  useEffect(() => {
    if (!isGovOfficial && isSimulatingHazard) {
      setIsSimulatingHazard(false);
    }
  }, [isGovOfficial, isSimulatingHazard]);

  // Initial Route Calculation on mount (Dimapur -> Kohima)
  useEffect(() => {
    if (originHub && destHub && !routeData) {
      calculateRoute(
        originHub.latitude,
        originHub.longitude,
        destHub.latitude,
        destHub.longitude,
        'driving',
        originHub.name,
        destHub.name,
        cargoTier
      ).then((res) => {
        setRouteData(res);
      }).catch((err) => {
        console.warn('Initial route calculation error:', err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Complete Dashboard State Reset Handler
  const handleClear = useCallback(() => {
    setOriginHub(null);
    setDestHub(null);
    setSelectedHub(null);
    setRouteData(null);
    setSelectedRouteIndex(0);
    setActiveRouteView('PRIMARY');
    setShowAlternateHubs(false);
    setHubRecommendations([]);
  }, []);

  // Select candidate alternative route
  const handleSelectCandidateRoute = useCallback((index: number) => {
    setSelectedRouteIndex(index);
    if (routeData?.candidateRoutes && routeData.candidateRoutes[index]) {
      const chosen = routeData.candidateRoutes[index];
      const updatedRouteData: DisasterResilientRouteResponse = {
        ...routeData,
        selectedRouteIndex: index,
        primaryRoute: {
          status: 'success',
          distance_km: chosen.distance_km,
          duration_minutes: chosen.duration_minutes,
          geometry: chosen.geometry,
          steps: chosen.steps,
          origin: routeData.primaryRoute.origin,
          destination: routeData.primaryRoute.destination,
          summary: chosen.summary,
        },
        isCompromised: chosen.is_compromised,
      };
      setRouteData(updatedRouteData);
    }
  }, [routeData]);

  // Update Alternate Hub Recommendations whenever destination or disruptions change
  useEffect(() => {
    if (destHub && hubs.length > 0) {
      const recommendations = recommendAlternateHubs(
        destHub,
        originHub,
        hubs,
        disruptions,
        5.0
      );
      setHubRecommendations(recommendations);
    }
  }, [destHub, originHub, hubs, disruptions]);

  // Handle map click in simulation mode
  const handleMapClickSimulate = (coords: {
    latitude: number;
    longitude: number;
  }) => {
    if (!isGovOfficial) {
      openAuthModal('gov');
      return;
    }
    setClickedMapCoords(coords);
    setSimulationModalOpen(true);
  };

  // Submit newly simulated hazard with RBAC headers & auto-reroute
  const handleSubmitSimulatedHazard = async (
    hazardInput: SimulatedHazardInput
  ) => {
    try {
      const res = await fetch('/api/disruptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user?.role || 'public_user',
          'x-user-agency': user?.agency_name || 'Public User',
        },
        body: JSON.stringify(hazardInput),
      });
      const data = await res.json();

      if (data.success && data.disruption) {
        const updatedList = [data.disruption, ...disruptions];
        setDisruptions(updatedList);

        // Immediate Auto-Reroute: If a route is active, re-evaluate collisions live
        if (originHub && destHub) {
          const freshRoute = await calculateRoute(
            originHub.latitude,
            originHub.longitude,
            destHub.latitude,
            destHub.longitude
          );
          setRouteData(freshRoute);
          if (freshRoute.isCompromised && freshRoute.alternativeRoute) {
            setActiveRouteView('BOTH');
          }
        }
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.error('Error injecting simulated disruption:', err);
    }
  };

  // Reset Simulation to default state (Protected with RBAC)
  const handleResetSimulation = async () => {
    if (!isGovOfficial) {
      openAuthModal('gov');
      return;
    }

    try {
      const res = await fetch('/api/disruptions', {
        method: 'DELETE',
        headers: {
          'x-user-role': user?.role || 'public_user',
          'x-user-agency': user?.agency_name || '',
        },
      });
      const data = await res.json();
      if (data.success && data.disruptions) {
        setDisruptions(data.disruptions);

        // Recalculate route if active
        if (originHub && destHub) {
          const freshRoute = await calculateRoute(
            originHub.latitude,
            originHub.longitude,
            destHub.latitude,
            destHub.longitude
          );
          setRouteData(freshRoute);
        }
      }
    } catch (err) {
      console.error('Error resetting simulation:', err);
    }
  };

  // Select alternate origin hub from recommendations
  const handleSelectAlternateOrigin = async (alternateHub: SupplyHub) => {
    setOriginHub(alternateHub);
    setShowAlternateHubs(false);

    if (destHub) {
      const result = await calculateRoute(
        alternateHub.latitude,
        alternateHub.longitude,
        destHub.latitude,
        destHub.longitude
      );
      setRouteData(result);
      if (result.isCompromised && result.alternativeRoute) {
        setActiveRouteView('BOTH');
      } else {
        setActiveRouteView('PRIMARY');
      }
    }
  };

  const handleSelectDisruption = (disruption: RoadDisruption) => {
    setSelectedHub({
      id: disruption.id,
      name: disruption.title,
      state: disruption.highway_reference || 'NER Corridor',
      latitude: disruption.latitude,
      longitude: disruption.longitude,
      capacity_tonnes: 0,
    });
  };

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 lg:overflow-hidden">
      <div className="shrink-0">
        <Header
          isSimulatingHazard={isSimulatingHazard}
          onToggleSimulation={() => {
            if (!isGovOfficial) {
              openAuthModal('gov');
            } else {
              setIsSimulatingHazard(!isSimulatingHazard);
            }
          }}
          onResetSimulation={handleResetSimulation}
          onRefresh={loadData}
          isRefreshing={isRefreshing}
        />
        <BroadcastBanner />
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-3 md:p-4 flex flex-col space-y-3 min-h-0 lg:overflow-hidden">
        {/* Top Key Metrics Row */}
        <div className="shrink-0">
          <StatsOverview
            hubs={hubs}
            disruptions={disruptions}
            shipments={shipments}
          />
        </div>

        {/* Main Content Grid: Map & Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0 lg:overflow-hidden">
          {/* Left Column: Interactive Leaflet Map (8 cols) - Fixed & fills height */}
          <div className="lg:col-span-8 flex flex-col space-y-2 h-[480px] lg:h-full min-h-0">
            {/* Map Top Bar with Layer Controls */}
            <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-[#1c2541]/80 backdrop-blur px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shadow-sm dark:shadow-md transition-colors duration-200">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-300 font-semibold">
                <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Northeast Spatial Intelligence Corridor Layer</span>
                {isSimulatingHazard && isGovOfficial && (
                  <span className="text-[10px] bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200 border border-red-300 dark:border-red-600 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-amber-500 dark:text-amber-300" />
                    Hazard Simulation Active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHubs(!showHubs)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition text-[11px] font-medium ${
                    showHubs
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-300 dark:border-blue-700/60'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {showHubs ? (
                    <Eye className="w-3 h-3" />
                  ) : (
                    <EyeOff className="w-3 h-3" />
                  )}
                  <span>Hubs</span>
                </button>
                <button
                  onClick={() => setShowDisruptions(!showDisruptions)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition text-[11px] font-medium ${
                    showDisruptions
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300 border border-red-300 dark:border-red-700/60'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {showDisruptions ? (
                    <Eye className="w-3 h-3" />
                  ) : (
                    <EyeOff className="w-3 h-3" />
                  )}
                  <span>Hazards</span>
                </button>
                <button
                  onClick={() => setShowBuffers(!showBuffers)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition text-[11px] font-medium ${
                    showBuffers
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <CircleDot className="w-3 h-3" />
                  <span>Buffer Zones</span>
                </button>
              </div>
            </div>

            {/* Map Display Container */}
            <div className="flex-1 w-full min-h-0 h-full rounded-2xl overflow-hidden shadow-sm dark:shadow-md border border-slate-200 dark:border-slate-800">
              <LogisticsMap
                hubs={hubs}
                disruptions={disruptions}
                selectedHub={selectedHub}
                originHub={originHub}
                destHub={destHub}
                routeData={routeData}
                activeRouteView={activeRouteView}
                selectedRouteIndex={selectedRouteIndex}
                showHubs={showHubs}
                showDisruptions={showDisruptions}
                showBuffers={showBuffers}
                isSimulatingHazard={isSimulatingHazard && isGovOfficial}
                onSelectHub={(hub) => setSelectedHub(hub)}
                onSetOrigin={(hub) => setOriginHub(hub)}
                onSetDestination={(hub) => setDestHub(hub)}
                onSelectCandidateRoute={handleSelectCandidateRoute}
                onMapClickSimulate={handleMapClickSimulate}
              />
            </div>
          </div>

          {/* Right Column: Route Planner, Multi-Hub Recommender & Live Feeds (4 cols) - Independently Scrollable */}
          <div className="lg:col-span-4 h-full min-h-0 overflow-y-auto pr-1 md:pr-1.5 space-y-3 custom-scrollbar">
            {/* Alternate Hub Sourcing Drawer (when opened) */}
            {showAlternateHubs && (
              <AlternateHubRecommender
                recommendations={hubRecommendations}
                destination={destHub}
                onSelectAlternateOrigin={handleSelectAlternateOrigin}
                onClose={() => setShowAlternateHubs(false)}
              />
            )}

            <RoutePlanner
              hubs={hubs}
              originHub={originHub}
              destHub={destHub}
              routeData={routeData}
              activeRouteView={activeRouteView}
              cargoTier={cargoTier}
              selectedRouteIndex={selectedRouteIndex}
              onSetOrigin={setOriginHub}
              onSetDestination={setDestHub}
              onSetCargoTier={setCargoTier}
              onRouteCalculated={(data) => {
                setRouteData(data);
                if (data?.selectedRouteIndex !== undefined) {
                  setSelectedRouteIndex(data.selectedRouteIndex);
                }
              }}
              onSelectRouteView={setActiveRouteView}
              onSelectCandidateRoute={handleSelectCandidateRoute}
              onToggleAlternateHubs={() =>
                setShowAlternateHubs(!showAlternateHubs)
              }
              onClear={handleClear}
            />

            <DisruptionAlerts
              disruptions={disruptions}
              onSelectDisruption={handleSelectDisruption}
              onDeleteDisruption={(id) => {
                setDisruptions((prev) => prev.filter((d) => d.id !== id));
              }}
              onOpenReportModal={() => {
                setClickedMapCoords({ latitude: 25.782, longitude: 93.921 });
                setSimulationModalOpen(true);
              }}
            />

            <ShipmentFeed shipments={shipments} />
          </div>
        </div>
      </main>

      {/* Floating Context-Bounded Gemini Road Disruption Assistant */}
      <DisruptionAssistantChat activeHazardsCount={disruptions.length} />

      {/* Interactive Hazard Simulation Modal */}
      <HazardSimulationModal
        isOpen={simulationModalOpen}
        clickedCoords={clickedMapCoords}
        onClose={() => {
          setSimulationModalOpen(false);
          setClickedMapCoords(null);
        }}
        onSubmit={handleSubmitSimulatedHazard}
      />

      {/* Tri-Table Authentication Modal */}
      <AuthModal />

      {/* Footer */}
      <footer className="shrink-0 border-t border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-[#0b132b]/80 py-2 text-center text-xs text-slate-600 dark:text-slate-400 transition-colors duration-200">
        NER Smart Logistics Platform • Disaster-Resilient Corridor Monitoring Infrastructure
      </footer>
    </div>
  );
}
