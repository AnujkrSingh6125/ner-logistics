'use client';

import { useState, useEffect, useCallback } from 'react';
import { SupplyHub, RoadDisruption, Shipment, SystemBroadcast } from '@/types';
import {
  fetchSupplyHubs,
  fetchRoadDisruptions,
  fetchShipments,
  subscribeToAllShipmentsRealtime,
  subscribeToAllHazardsRealtime,
  subscribeToAllBroadcastsRealtime,
  BASELINE_SUPPLY_HUBS,
  BASELINE_DISRUPTIONS,
} from '@/lib/supabaseClient';

export interface UseLiveLogisticsFeedResult {
  hubs: SupplyHub[];
  setHubs: React.Dispatch<React.SetStateAction<SupplyHub[]>>;
  disruptions: RoadDisruption[];
  setDisruptions: React.Dispatch<React.SetStateAction<RoadDisruption[]>>;
  shipments: Shipment[];
  setShipments: React.Dispatch<React.SetStateAction<Shipment[]>>;
  broadcasts: SystemBroadcast[];
  setBroadcasts: React.Dispatch<React.SetStateAction<SystemBroadcast[]>>;
  trackedShipment: Shipment | null;
  setTrackedShipment: React.Dispatch<React.SetStateAction<Shipment | null>>;
  isLoading: boolean;
  activeConvoyCount: number;
  activeHazardsCount: number;
  activeBroadcastsCount: number;
  refreshAll: () => Promise<void>;
}

/**
 * useLiveLogisticsFeed: Full-Platform Realtime Telemetry & State Hook
 *
 * Hydrates active records for shipments (status = 'IN_TRANSIT'), hazards, and broadcasts,
 * and maintains continuous real-time multi-tenant WebSocket subscriptions without full-page reloads.
 */
export function useLiveLogisticsFeed(): UseLiveLogisticsFeedResult {
  const [hubs, setHubs] = useState<SupplyHub[]>(BASELINE_SUPPLY_HUBS);
  const [disruptions, setDisruptions] = useState<RoadDisruption[]>(BASELINE_DISRUPTIONS);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [broadcasts, setBroadcasts] = useState<SystemBroadcast[]>([]);
  const [trackedShipment, setTrackedShipment] = useState<Shipment | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initial Data Hydration
  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [hubsData, disruptionsData, shipmentsData, broadcastsRes] = await Promise.all([
        fetchSupplyHubs().catch(() => BASELINE_SUPPLY_HUBS),
        fetchRoadDisruptions().catch(() => BASELINE_DISRUPTIONS),
        fetchShipments().catch(() => []),
        fetch('/api/broadcasts')
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => []),
      ]);

      if (hubsData && hubsData.length > 0) setHubs(hubsData);
      if (disruptionsData && disruptionsData.length > 0) setDisruptions(disruptionsData);
      if (shipmentsData) {
        setShipments(shipmentsData);
        setTrackedShipment((prev) => prev || (shipmentsData.length > 0 ? shipmentsData[0] : null));
      }
      if (Array.isArray(broadcastsRes)) {
        setBroadcasts(broadcastsRes);
      }
    } catch (err) {
      console.warn('[useLiveLogisticsFeed] Hydration warning:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Hydrate on mount
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Persistent Realtime Shipments Subscription
  useEffect(() => {
    const unsubShipments = subscribeToAllShipmentsRealtime(
      (incomingShipment) => {
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
        setShipments((prev) => prev.filter((s) => s.id !== deletedId));
        setTrackedShipment((current) => (current?.id === deletedId ? null : current));
      }
    );

    return () => {
      unsubShipments();
    };
  }, []);

  // Persistent Realtime Hazards Subscription
  useEffect(() => {
    const unsubHazards = subscribeToAllHazardsRealtime(
      (newDisruption) => {
        setDisruptions((prev) => {
          const exists = prev.some((d) => d.id === newDisruption.id);
          if (exists) {
            return prev.map((d) => (d.id === newDisruption.id ? newDisruption : d));
          }
          return [newDisruption, ...prev];
        });
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
      unsubHazards();
    };
  }, []);

  // Persistent Realtime Broadcasts Subscription
  useEffect(() => {
    const unsubBroadcasts = subscribeToAllBroadcastsRealtime(
      (incoming) => {
        setBroadcasts((prev) => [incoming, ...prev.filter((b) => b.id !== incoming.id)]);
      },
      (updated) => {
        setBroadcasts((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      },
      (deletedId) => {
        setBroadcasts((prev) => prev.filter((b) => b.id !== deletedId));
      }
    );

    return () => {
      unsubBroadcasts();
    };
  }, []);

  const activeConvoyCount = shipments.filter(
    (s) => s.current_status === 'IN_TRANSIT' || s.status === 'IN_TRANSIT' || !s.current_status
  ).length;

  const activeHazardsCount = disruptions.filter((d) => d.is_active !== false).length;
  const activeBroadcastsCount = broadcasts.filter((b) => b.is_active !== false).length;

  return {
    hubs,
    setHubs,
    disruptions,
    setDisruptions,
    shipments,
    setShipments,
    broadcasts,
    setBroadcasts,
    trackedShipment,
    setTrackedShipment,
    isLoading,
    activeConvoyCount,
    activeHazardsCount,
    activeBroadcastsCount,
    refreshAll,
  };
}
