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
  deleteShipment,
  updateShipmentTelemetry,
  subscribeToAllShipmentsRealtime,
  subscribeToAllHazardsRealtime,
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
import { useGps } from '@/context/LocationContext';
import { ThreatAlertData } from '@/components/Navigation/LiveNavigationHUD';
import * as turf from '@turf/turf';
import {
  Layers,
  Eye,
  EyeOff,
  ShieldAlert,
  CircleDot,
  Sparkles,
  Building2,
  Navigation,
  Compass,
  Truck,
  MapPin,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isGovOfficial, openAuthModal } = useAuth();
  const gps = useGps();

  // Mobile viewport tab state ('map' | 'planner' | 'alerts' | 'fleet')
  const [mobileTab, setMobileTab] = useState<'map' | 'planner' | 'alerts' | 'fleet'>('map');

  // Pre-seed state with baseline data for instant hydration & 100% offline resilience
  const [hubs, setHubs] = useState<SupplyHub[]>(BASELINE_SUPPLY_HUBS);
  const [disruptions, setDisruptions] = useState<RoadDisruption[]>(BASELINE_DISRUPTIONS);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [trackedShipment, setTrackedShipment] = useState<Shipment | null>(null);

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

  // Realtime Threat Interception Alert Data
  const [threatAlert, setThreatAlert] = useState<ThreatAlertData | null>(null);

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
      if (shipmentsData) {
        console.log(`[GLOBAL HYDRATION] Populated ${shipmentsData.length} active convoys from PostgreSQL.`);
        setShipments(shipmentsData);
        setTrackedShipment((prevTracked) => {
          if (!prevTracked && shipmentsData.length > 0) {
            return shipmentsData[0];
          }
          return prevTracked;
        });
      }
    } catch (err) {
      console.warn('Supabase fetch error, fallback active:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime Supabase Subscription on road_disruptions & hazards tables
  useEffect(() => {
    const unsub = subscribeToAllHazardsRealtime(
      (newDisruption) => {
        setDisruptions((prev) => {
          if (prev.some((d) => d.id === newDisruption.id)) return prev;
          return [newDisruption, ...prev];
        });

        // Dynamic Real-time Corridor Re-route Risk Check
        if (routeData && originHub && destHub) {
          const activeCoords =
            routeData.candidateRoutes?.[selectedRouteIndex]?.geometry?.coordinates ||
            routeData.primaryRoute?.geometry?.coordinates;

          if (activeCoords && activeCoords.length >= 2) {
            try {
              const routeLine = turf.lineString(activeCoords);
              const hazardPt = turf.point([newDisruption.longitude, newDisruption.latitude]);
              const distMeters = turf.pointToLineDistance(hazardPt, routeLine, { units: 'meters' });
              const bufferMeters = newDisruption.risk_radius_meters || 1500;

              if (distMeters <= bufferMeters) {
                console.log(
                  `[REALTIME HAZARD INTERCEPTION] New hazard intersects planned route (${Math.round(
                    distMeters
                  )}m away). Recalculating resilient path...`
                );
                calculateRoute(
                  originHub.latitude,
                  originHub.longitude,
                  destHub.latitude,
                  destHub.longitude,
                  'driving',
                  originHub.name,
                  destHub.name,
                  cargoTier
                )
                  .then((recalculated) => setRouteData(recalculated))
                  .catch((e) => console.warn('Hazard-triggered re-routing notice:', e));
              }
            } catch (err) {
              // Ignore turf computation error
            }
          }
        }
      },
      (updatedDisruption) => {
        setDisruptions((prev) =>
          prev.map((d) => (d.id === updatedDisruption.id ? updatedDisruption : d))
        );
      },
      (oldId) => {
        setDisruptions((prev) => prev.filter((d) => d.id !== oldId));
      }
    );

    return () => {
      unsub();
    };
  }, [routeData, originHub, destHub, selectedRouteIndex, cargoTier]);

  // Realtime Supabase Subscription on public.shipments table (Global Fleet Sync)
  useEffect(() => {
    const unsub = subscribeToAllShipmentsRealtime(
      (incomingShipment) => {
        console.log('[REALTIME BROADCAST RECEIVED] Convoy dispatch updated:', incomingShipment.id, incomingShipment.driver_name);
        setShipments((prev) => {
          const exists = prev.some((s) => s.id === incomingShipment.id);
          if (exists) {
            return prev.map((s) => (s.id === incomingShipment.id ? incomingShipment : s));
          }
          return [incomingShipment, ...prev];
        });

        setTrackedShipment((current) =>
          current?.id === incomingShipment.id ? incomingShipment : current
        );
      },
      (deletedId) => {
        console.log('[REALTIME BROADCAST RECEIVED] Convoy shipment deleted:', deletedId);
        setShipments((prev) => prev.filter((s) => s.id !== deletedId));
        setTrackedShipment((current) => (current?.id === deletedId ? null : current));
      }
    );

    return () => {
      unsub();
    };
  }, []);

  // Driver Telemetry Transmission Pipeline: Throttled push to Supabase shipments
  const lastTelemetryPushRef = React.useRef<number>(0);
  useEffect(() => {
    if (!gps.userCoordinates || !gps.isGpsEnabled) return;
    const [lat, lng] = gps.userCoordinates;
    const now = Date.now();

    // Throttled: Push every 3.5 seconds
    if (now - lastTelemetryPushRef.current > 3500) {
      lastTelemetryPushRef.current = now;

      // Find shipment assigned to driver or active
      const activeConvoy = shipments.find(
        (s) =>
          (user?.citizen_uid && s.driver_id === user.citizen_uid) ||
          (user?.full_name && s.driver_name === user.full_name) ||
          s.current_status === 'IN_TRANSIT'
      );

      if (activeConvoy) {
        updateShipmentTelemetry(activeConvoy.id, {
          current_lat: lat,
          current_lng: lng,
          heading: gps.heading,
          speed: gps.speed,
        }).catch((err) => console.warn('Telemetry transmission error:', err));
      }
    }
  }, [gps.userCoordinates, gps.heading, gps.speed, gps.isGpsEnabled, shipments, user]);

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

  // Secure Multi-Tenant Delete Shipment Handler
  const handleDeleteShipment = async (shipmentId: string) => {
    const operatorHub = user?.hub_code || user?.id || user?.agency_name;
    const res = await deleteShipment(shipmentId, operatorHub, user?.role);
    if (!res.success) {
      alert(res.message);
      return;
    }
    setShipments((prev) => prev.filter((s) => s.id !== shipmentId));
    if (trackedShipment?.id === shipmentId) {
      setTrackedShipment(null);
    }
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

      if (!res.ok || data.error) {
        console.error('Supabase Disruption Insert Error:', data.error);
        alert(`Failed to save hazard to database: ${data.error || 'Server error'}`);
        return;
      }

      if (data.success && data.disruption) {
        const updatedList = [
          data.disruption,
          ...disruptions.filter((d) => d.id !== data.disruption.id),
        ];
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
      }
    } catch (err: any) {
      console.error('Error injecting simulated disruption:', err);
      alert(`Network error saving hazard to database: ${err.message}`);
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

  // Dynamic GPS Privacy Toggle Handler
  const handleToggleGps = useCallback(() => {
    if (gps.isGpsEnabled) {
      gps.disableGps();
      if (originHub?.id === 'current-location') {
        setOriginHub(BASELINE_SUPPLY_HUBS[0]);
      }
    } else {
      gps.enableGps();
      if (gps.userCoordinates) {
        const [lat, lng] = gps.userCoordinates;
        setOriginHub({
          id: 'current-location',
          name: `My Live GPS (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`,
          state: 'Live GPS',
          latitude: lat,
          longitude: lng,
          capacity_tonnes: 0,
        });
      }
    }
  }, [gps, originHub]);

  // Use Current Location Handler
  const handleUseCurrentLocation = useCallback(() => {
    if (!gps.isGpsEnabled) {
      gps.enableGps();
    }
    if (gps.userCoordinates) {
      const [lat, lng] = gps.userCoordinates;
      setOriginHub({
        id: 'current-location',
        name: `My Live GPS (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`,
        state: 'Live GPS',
        latitude: lat,
        longitude: lng,
        capacity_tonnes: 0,
      });
    } else {
      setOriginHub({
        id: 'current-location',
        name: 'My Live GPS (Acquiring satellite fix...)',
        state: 'Live GPS',
        latitude: 0,
        longitude: 0,
        capacity_tonnes: 0,
      });
    }
  }, [gps]);

  // Dynamically update Origin Strategic Hub with resolved real GPS coordinates
  useEffect(() => {
    if (gps.userCoordinates && (originHub?.id === 'current-location' || (!originHub && gps.isGpsEnabled))) {
      const [lat, lng] = gps.userCoordinates;
      setOriginHub({
        id: 'current-location',
        name: `My Live GPS (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`,
        state: 'Live GPS',
        latitude: lat,
        longitude: lng,
        capacity_tonnes: 0,
      });
    }
  }, [gps.userCoordinates, originHub?.id, gps.isGpsEnabled]);

  // Real-Time Off-Route Deviation & Forward Threat Detection while En Route
  useEffect(() => {
    if (!gps.userCoordinates || !gps.isGpsEnabled) return;
    const [userLat, userLng] = gps.userCoordinates;

    // 1. Off-Route Deviation Recalculation (> 120m from active path)
    if (gps.isNavigating && destHub && routeData) {
      const activeCoords =
        routeData.candidateRoutes?.[selectedRouteIndex]?.geometry?.coordinates ||
        routeData.primaryRoute?.geometry?.coordinates;

      if (activeCoords && activeCoords.length >= 2) {
        try {
          const routeLine = turf.lineString(activeCoords);
          const userPt = turf.point([userLng, userLat]);
          const deviationMeters = turf.pointToLineDistance(userPt, routeLine, {
            units: 'meters',
          });

          if (deviationMeters > 120) {
            console.log(
              `[DYNAMIC REROUTE] Vehicle deviated by ${Math.round(
                deviationMeters
              )}m from planned corridor. Recalculating route...`
            );
            calculateRoute(
              userLat,
              userLng,
              destHub.latitude,
              destHub.longitude,
              'driving',
              originHub?.name || 'Live GPS Position',
              destHub.name,
              cargoTier
            )
              .then((recalc) => {
                setRouteData(recalc);
              })
              .catch((err) => console.warn('Dynamic reroute error:', err));
          }
        } catch (err) {
          // Safe ignore
        }
      }
    }

    // 2. Real-Time Forward Hazard Interception
    if (gps.isNavigating && disruptions.length > 0) {
      let closestThreat: ThreatAlertData | null = null;
      const userPt = turf.point([userLng, userLat]);

      for (const d of disruptions) {
        if (!d.is_active) continue;
        const hazardPt = turf.point([d.longitude, d.latitude]);
        const distKm = turf.distance(userPt, hazardPt, { units: 'kilometers' });
        const riskRadiusKm = (d.risk_radius_meters || 1500) / 1000.0;

        // Check if hazard is within 10km forward
        if (distKm <= riskRadiusKm + 10.0) {
          if (!closestThreat || distKm < closestThreat.distanceAheadKm) {
            closestThreat = {
              disruption: d,
              distanceAheadKm: distKm,
              isDirectBlockage: distKm <= riskRadiusKm,
            };
          }
        }
      }

      setThreatAlert(closestThreat);
    }
  }, [
    gps.userCoordinates,
    gps.isGpsEnabled,
    gps.isNavigating,
    destHub,
    originHub,
    routeData,
    selectedRouteIndex,
    cargoTier,
    disruptions,
  ]);

  // Start Navigation Handler
  const handleStartNavigation = async () => {
    if (!destHub) {
      alert('Please select a destination hub first.');
      return;
    }

    if (!routeData && originHub) {
      const startLat = gps.userCoordinates ? gps.userCoordinates[0] : originHub.latitude;
      const startLng = gps.userCoordinates ? gps.userCoordinates[1] : originHub.longitude;
      const fresh = await calculateRoute(
        startLat,
        startLng,
        destHub.latitude,
        destHub.longitude,
        'driving',
        originHub.name,
        destHub.name,
        cargoTier
      );
      setRouteData(fresh);
    }

    gps.startNavigation();
  };

  // Toggle Convoy Motion Simulator
  const handleToggleSimulation = () => {
    if (gps.isSimulated) {
      gps.disableGps();
    } else {
      const activeCoords =
        routeData?.candidateRoutes?.[selectedRouteIndex]?.geometry?.coordinates ||
        routeData?.primaryRoute?.geometry?.coordinates;

      if (activeCoords && activeCoords.length >= 2) {
        gps.startSimulation(activeCoords as [number, number][], 65);
      } else {
        alert('Please calculate a corridor route before launching simulated vehicle motion.');
      }
    }
  };

  // Accept Detour Around Threat
  const handleAcceptDetour = async () => {
    if (routeData?.alternativeRoute) {
      setActiveRouteView('DETOUR');
      setThreatAlert(null);
    } else if (originHub && destHub) {
      const startLat = gps.userCoordinates ? gps.userCoordinates[0] : originHub.latitude;
      const startLng = gps.userCoordinates ? gps.userCoordinates[1] : originHub.longitude;
      const fresh = await calculateRoute(
        startLat,
        startLng,
        destHub.latitude,
        destHub.longitude,
        'driving',
        originHub.name,
        destHub.name,
        cargoTier
      );
      setRouteData(fresh);
      setActiveRouteView('DETOUR');
      setThreatAlert(null);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-slate-100 transition-colors duration-200 lg:overflow-hidden relative">
      {/* GPS Status Toast Notice */}
      {gps.statusMessage && (
        <div className="fixed top-16 right-4 z-[9999] bg-white dark:bg-slate-900/95 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 px-3.5 py-2 rounded-xl shadow-2xl backdrop-blur-xl text-xs font-mono font-semibold animate-in fade-in slide-in-from-top-2 duration-300 flex items-center gap-2">
          <span>{gps.statusMessage}</span>
        </div>
      )}

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
          isGpsEnabled={gps.isGpsEnabled}
          onToggleGps={handleToggleGps}
        />
        <BroadcastBanner />
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-2.5 sm:p-3 md:p-4 flex flex-col space-y-2.5 sm:space-y-3 min-h-0 lg:overflow-hidden">
        {/* Top Key Metrics Row */}
        <div className="shrink-0">
          <StatsOverview
            hubs={hubs}
            disruptions={disruptions}
            shipments={shipments}
          />
        </div>

        {/* Mobile Single-Thumb Navigation Tab Switcher (Visible on < lg, Hidden on Desktop) */}
        <div className="lg:hidden shrink-0 grid grid-cols-4 gap-1 p-1 bg-white/95 dark:bg-[#070e1c]/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setMobileTab('map')}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-black transition ${
              mobileTab === 'map'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Map</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('planner')}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-black transition ${
              mobileTab === 'planner'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Navigation className="w-4 h-4" />
            <span>Planner</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('alerts')}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-black transition ${
              mobileTab === 'alerts'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
              {disruptions.length > 0 && (
                <span className="absolute -top-1 -right-2.5 w-3.5 h-3.5 bg-rose-500 text-[9px] text-white rounded-full flex items-center justify-center font-mono font-bold">
                  {disruptions.length}
                </span>
              )}
            </div>
            <span>Hazards</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('fleet')}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-black transition ${
              mobileTab === 'fleet'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Truck className="w-4 h-4" />
              {shipments.length > 0 && (
                <span className="absolute -top-1 -right-2.5 w-3.5 h-3.5 bg-emerald-500 text-[9px] text-white rounded-full flex items-center justify-center font-mono font-bold">
                  {shipments.length}
                </span>
              )}
            </div>
            <span>Fleet</span>
          </button>
        </div>

        {/* Tactical 2-Column Responsive Layout */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 pb-1">
          {/* Left Column: Tactical Geospatial Map (8 cols on lg, conditionally rendered on mobile) */}
          <div
            className={`lg:col-span-8 flex-col h-full min-h-0 space-y-2 ${
              mobileTab === 'map' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Map Layer Toolbar */}
            <div className="flex items-center justify-between px-3 sm:px-3.5 py-1.5 rounded-2xl bg-white/90 dark:bg-[#070e1c]/85 border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-md backdrop-blur-xl transition-colors duration-200">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-600 dark:text-cyan-400" />
                <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200">
                  GIS Layers
                </span>
                {isSimulatingHazard && isGovOfficial && (
                  <span className="text-[9px] sm:text-[10px] bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80 px-1.5 sm:px-2 py-0.5 rounded-full font-mono flex items-center gap-1 font-semibold">
                    <Sparkles className="w-2.5 h-2.5 text-amber-500 dark:text-amber-400" />
                    Hazard Active
                  </span>
                )}
                {gps.isNavigating && (
                  <span className="text-[9px] sm:text-[10px] bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80 px-1.5 sm:px-2 py-0.5 rounded-full font-mono flex items-center gap-1 font-bold animate-pulse">
                    <Navigation className="w-2.5 h-2.5" />
                    Navigating
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setShowHubs(!showHubs)}
                  className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl transition text-[10px] sm:text-[11px] font-medium border ${
                    showHubs
                      ? 'bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-950/80 dark:text-cyan-300 dark:border-cyan-700/60 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {showHubs ? (
                    <Eye className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                  )}
                  <span>Hubs</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDisruptions(!showDisruptions)}
                  className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl transition text-[10px] sm:text-[11px] font-medium border ${
                    showDisruptions
                      ? 'bg-red-100 text-red-900 border-red-300 dark:bg-red-950/80 dark:text-red-300 dark:border-red-700/60 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {showDisruptions ? (
                    <Eye className="w-3 h-3 text-red-600 dark:text-red-400" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                  )}
                  <span>Hazards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowBuffers(!showBuffers)}
                  className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl transition text-[10px] sm:text-[11px] font-medium border ${
                    showBuffers
                      ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700/60 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <CircleDot className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span className="hidden xs:inline">Buffers</span>
                </button>
              </div>
            </div>

            {/* Map Display Canvas Container */}
            <div className="flex-1 w-full min-h-[55vh] sm:min-h-[480px] lg:min-h-0 h-full rounded-2xl overflow-hidden shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] border border-slate-200 dark:border-slate-800/80 relative">
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
                isGpsEnabled={gps.isGpsEnabled}
                userLocation={gps.userCoordinates}
                accuracy={gps.accuracy}
                heading={gps.heading}
                speed={gps.speed}
                isTracking={gps.isGpsEnabled}
                isNavigating={gps.isNavigating}
                followMode={gps.followMode}
                isSimulated={gps.isSimulated}
                threatAlert={threatAlert}
                trackedShipment={trackedShipment}
                fleetShipments={shipments}
                onSelectHub={(hub) => setSelectedHub(hub)}
                onSetOrigin={(hub) => setOriginHub(hub)}
                onSetDestination={(hub) => setDestHub(hub)}
                onSelectCandidateRoute={handleSelectCandidateRoute}
                onMapClickSimulate={handleMapClickSimulate}
                onToggleFollowMode={gps.toggleFollowMode}
                onExitNavigation={gps.stopNavigation}
                onAcceptDetour={handleAcceptDetour}
                onDismissThreatAlert={() => setThreatAlert(null)}
                onToggleSimulation={handleToggleSimulation}
              />

              {/* Mobile Single-Thumb Bottom Action Pill */}
              <div className="lg:hidden absolute bottom-3 inset-x-3 z-[990] flex items-center justify-between gap-2 pointer-events-auto">
                {routeData && (
                  <button
                    type="button"
                    onClick={gps.isNavigating ? gps.stopNavigation : handleStartNavigation}
                    className={`flex-1 min-h-[44px] py-2.5 px-4 rounded-2xl font-black text-xs shadow-2xl flex items-center justify-center gap-2 border transition ${
                      gps.isNavigating
                        ? 'bg-rose-600 hover:bg-rose-500 border-rose-400 text-white animate-pulse'
                        : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 border-emerald-400/40 text-white'
                    }`}
                  >
                    <Navigation className="w-4 h-4 stroke-[2.5]" />
                    <span>{gps.isNavigating ? 'Exit Navigation' : 'Start Driver Navigation'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setMobileTab('planner')}
                  className="min-h-[44px] px-3.5 py-2.5 rounded-2xl bg-slate-950/90 hover:bg-slate-900 border border-slate-700/80 text-cyan-300 font-bold text-xs shadow-2xl backdrop-blur-xl flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Route Info</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Route Planner, Multi-Hub Recommender & Live Feeds (4 cols on lg, conditionally rendered on mobile) */}
          <div
            className={`lg:col-span-4 h-full min-h-0 overflow-y-auto pr-0 lg:pr-1.5 space-y-3 custom-scrollbar ${
              mobileTab !== 'map' ? 'block' : 'hidden lg:block'
            }`}
          >
            {/* Alternate Hub Sourcing Drawer (when opened) */}
            {(mobileTab === 'planner' || mobileTab === 'map') && showAlternateHubs && (
              <AlternateHubRecommender
                recommendations={hubRecommendations}
                destination={destHub}
                onSelectAlternateOrigin={handleSelectAlternateOrigin}
                onClose={() => setShowAlternateHubs(false)}
              />
            )}

            {/* Route Planner: Shown in 'planner' tab on mobile, and always on desktop */}
            <div className={`${mobileTab === 'planner' ? 'block' : 'hidden lg:block'}`}>
              <RoutePlanner
                hubs={hubs}
                originHub={originHub}
                destHub={destHub}
                routeData={routeData}
                activeRouteView={activeRouteView}
                cargoTier={cargoTier}
                selectedRouteIndex={selectedRouteIndex}
                isGpsEnabled={gps.isGpsEnabled}
                userLocation={gps.userCoordinates}
                isTracking={gps.isGpsEnabled}
                isNavigating={gps.isNavigating}
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
                onUseCurrentLocation={handleUseCurrentLocation}
                onStartNavigation={handleStartNavigation}
                onStopNavigation={gps.stopNavigation}
                onToggleGps={handleToggleGps}
                onShipmentRegistered={(newShipment) => {
                  setShipments((prev) => [newShipment, ...prev.filter((s) => s.id !== newShipment.id)]);
                  setTrackedShipment(newShipment);
                }}
              />
            </div>

            {/* Disruption Alerts: Shown in 'alerts' tab on mobile, and always on desktop */}
            <div className={`${mobileTab === 'alerts' ? 'block' : 'hidden lg:block'}`}>
              <DisruptionAlerts
                disruptions={disruptions}
                onSelectDisruption={(d) => {
                  handleSelectDisruption(d);
                  setMobileTab('map');
                }}
                onDeleteDisruption={(id) => {
                  setDisruptions((prev) => prev.filter((d) => d.id !== id));
                }}
                onOpenReportModal={() => {
                  setClickedMapCoords({ latitude: 25.782, longitude: 93.921 });
                  setSimulationModalOpen(true);
                }}
              />
            </div>

            {/* Shipment Feed: Shown in 'fleet' tab on mobile, and always on desktop */}
            <div className={`${mobileTab === 'fleet' ? 'block' : 'hidden lg:block'}`}>
              <ShipmentFeed
                shipments={shipments}
                selectedShipmentId={trackedShipment?.id}
                onSelectShipment={(s) => {
                  setTrackedShipment(s);
                  setMobileTab('map');
                }}
                onDeleteShipment={handleDeleteShipment}
              />
            </div>
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
      <footer className="shrink-0 border-t border-slate-800/80 bg-[#060c18]/90 py-2.5 text-center text-xs text-slate-400 font-mono transition-colors duration-200">
        NER Smart Logistics Platform • Military/Enterprise Disaster-Resilient Corridor Monitoring Infrastructure
      </footer>
    </div>
  );
}
