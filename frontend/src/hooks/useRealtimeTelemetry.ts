import { useState, useEffect, useCallback } from 'react';
import { supabase, BASELINE_SUPPLY_HUBS, BASELINE_DISRUPTIONS, normalizeShipment, normalizeSupplyHub } from '@/lib/supabaseClient';
import { SupplyHub, RoadDisruption, Shipment } from '@/types';

export function useRealtimeTelemetry() {
  const [disruptions, setDisruptions] = useState<RoadDisruption[]>(BASELINE_DISRUPTIONS);
  const [hubs, setHubs] = useState<SupplyHub[]>(BASELINE_SUPPLY_HUBS.map(normalizeSupplyHub));
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Initial Fetch for Hubs, Disruptions & Shipments
  const loadInitialData = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const [hubsRes, disruptionsRes, shipmentsRes] = await Promise.all([
        supabase.from('supply_hubs').select('*').order('state', { ascending: true }),
        supabase.from('road_disruptions').select('*').eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('shipments').select('*').order('created_at', { ascending: false }),
      ]);

      if (hubsRes.data && hubsRes.data.length > 0) {
        setHubs(hubsRes.data.map(normalizeSupplyHub));
      }
      if (disruptionsRes.data && disruptionsRes.data.length > 0) {
        setDisruptions(disruptionsRes.data as RoadDisruption[]);
      }
      if (shipmentsRes.data && shipmentsRes.data.length > 0) {
        setShipments(shipmentsRes.data.map(normalizeShipment));
      }
    } catch (err) {
      console.warn('[useRealtimeTelemetry] Initial fetch fallback active:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    loadInitialData();

    // 1. Cross-Tab Instant BroadcastChannel
    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel('ner_global_live_stream');
        bc.onmessage = (ev) => {
          if (!isMounted || !ev.data) return;
          const { type, payload } = ev.data;
          if (type === 'hazard_insert') {
            setDisruptions((prev) => [payload, ...prev.filter((d) => d.id !== payload.id)]);
          } else if (type === 'hazard_update') {
            setDisruptions((prev) => prev.map((d) => (d.id === payload.id ? payload : d)));
          } else if (type === 'hazard_delete') {
            setDisruptions((prev) => prev.filter((d) => d.id !== payload && d.id !== payload.id));
          } else if (type === 'hub_insert') {
            const norm = normalizeSupplyHub(payload);
            setHubs((prev) => [norm, ...prev.filter((h) => h.name !== norm.name && h.id !== norm.id)]);
          } else if (type === 'hub_update') {
            const norm = normalizeSupplyHub(payload);
            setHubs((prev) => prev.map((h) => (h.name === norm.name || h.id === norm.id ? norm : h)));
          } else if (type === 'hub_delete') {
            setHubs((prev) => prev.filter((h) => h.name !== payload && h.id !== payload));
          } else if (type === 'shipment_insert') {
            setShipments((prev) => [payload, ...prev.filter((s) => s.id !== payload.id)]);
          } else if (type === 'shipment_update') {
            setShipments((prev) => prev.map((s) => (s.id === payload.id ? payload : s)));
          } else if (type === 'shipment_delete') {
            setShipments((prev) => prev.filter((s) => s.id !== payload));
          }
        };
      } catch (e) {
        bc = null;
      }
    }

    // 2. Storage event fallback for cross-tab sync
    const handleStorage = (ev: StorageEvent) => {
      if (!isMounted || ev.key !== 'ner_logistics_sync_pulse' || !ev.newValue) return;
      try {
        const { event } = JSON.parse(ev.newValue);
        if (!event) return;
        if (event.type === 'hazard_insert') {
          setDisruptions((prev) => [event.payload, ...prev.filter((d) => d.id !== event.payload.id)]);
        } else if (event.type === 'hazard_update') {
          setDisruptions((prev) => prev.map((d) => (d.id === event.payload.id ? event.payload : d)));
        } else if (event.type === 'hazard_delete') {
          setDisruptions((prev) => prev.filter((d) => d.id !== event.payload));
        } else if (event.type === 'hub_insert') {
          setHubs((prev) => [event.payload, ...prev.filter((h) => h.name !== event.payload.name && h.id !== event.payload.id)]);
        } else if (event.type === 'shipment_insert') {
          setShipments((prev) => [event.payload, ...prev.filter((s) => s.id !== event.payload.id)]);
        }
      } catch (e) {}
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage);
    }

    // 3. Universal Supabase WebSocket Channel for Instant Sync
    let channel: any = null;
    if (supabase) {
      channel = supabase
        .channel('ner_global_live_stream')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'road_disruptions' },
          (payload: any) => {
            if (!isMounted) return;
            if (payload.eventType === 'INSERT' && payload.new) {
              setDisruptions((prev) => [payload.new as RoadDisruption, ...prev.filter((d) => d.id !== payload.new.id)]);
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              if (payload.new.is_active === false) {
                setDisruptions((prev) => prev.filter((d) => d.id !== payload.new.id));
              } else {
                setDisruptions((prev) => prev.map((d) => (d.id === payload.new.id ? (payload.new as RoadDisruption) : d)));
              }
            } else if (payload.eventType === 'DELETE' && payload.old) {
              setDisruptions((prev) => prev.filter((d) => d.id !== payload.old.id));
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'supply_hubs' },
          (payload: any) => {
            if (!isMounted) return;
            if (payload.eventType === 'INSERT' && payload.new) {
              setHubs((prev) => [payload.new as SupplyHub, ...prev.filter((h) => h.name !== payload.new.name && h.id !== payload.new.id)]);
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              setHubs((prev) => prev.map((h) => (h.name === payload.new.name || h.id === payload.new.id ? (payload.new as SupplyHub) : h)));
            } else if (payload.eventType === 'DELETE' && payload.old) {
              setHubs((prev) => prev.filter((h) => h.name !== payload.old.name && h.id !== payload.old.id));
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'shipments' },
          (payload: any) => {
            if (!isMounted) return;
            if (payload.eventType === 'INSERT' && payload.new) {
              const norm = normalizeShipment(payload.new);
              setShipments((prev) => [norm, ...prev.filter((s) => s.id !== norm.id)]);
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              const norm = normalizeShipment(payload.new);
              setShipments((prev) => prev.map((s) => (s.id === norm.id ? norm : s)));
            } else if (payload.eventType === 'DELETE' && payload.old) {
              setShipments((prev) => prev.filter((s) => s.id !== payload.old.id));
            }
          }
        )
        .on('broadcast', { event: 'hazard_insert' }, (msg: any) => {
          if (isMounted && msg.payload) {
            setDisruptions((prev) => [msg.payload, ...prev.filter((d) => d.id !== msg.payload.id)]);
          }
        })
        .on('broadcast', { event: 'hazard_update' }, (msg: any) => {
          if (isMounted && msg.payload) {
            setDisruptions((prev) => prev.map((d) => (d.id === msg.payload.id ? msg.payload : d)));
          }
        })
        .on('broadcast', { event: 'hazard_delete' }, (msg: any) => {
          if (isMounted && msg.payload) {
            setDisruptions((prev) => prev.filter((d) => d.id !== msg.payload && d.id !== msg.payload.id));
          }
        })
        .on('broadcast', { event: 'shipment_insert' }, (msg: any) => {
          if (isMounted && msg.payload) {
            setShipments((prev) => [msg.payload, ...prev.filter((s) => s.id !== msg.payload.id)]);
          }
        })
        .on('broadcast', { event: 'shipment_update' }, (msg: any) => {
          if (isMounted && msg.payload) {
            setShipments((prev) => prev.map((s) => (s.id === msg.payload.id ? msg.payload : s)));
          }
        })
        .on('broadcast', { event: 'shipment_delete' }, (msg: any) => {
          if (isMounted && msg.payload) {
            setShipments((prev) => prev.filter((s) => s.id !== msg.payload));
          }
        })
        .subscribe();
    }

    return () => {
      isMounted = false;
      if (bc) bc.close();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorage);
      }
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [loadInitialData]);

  const totalHubsCount = hubs.length;
  const totalCapacityTons = hubs.reduce(
    (acc, h) => acc + (Number(h.capacity_tons) || Number(h.capacity_tonnes) || 0),
    0
  );
  const activeDisruptionsCount = disruptions.filter((d) => d.is_active !== false && (d as any).status !== 'RESOLVED').length;
  const inTransitShipmentsCount = shipments.filter(
    (s) => s.current_status === 'IN_TRANSIT' || s.status === 'IN_TRANSIT' || !s.current_status
  ).length;

  return {
    hubs,
    setHubs,
    disruptions,
    setDisruptions,
    shipments,
    setShipments,
    totalHubsCount,
    totalCapacityTons,
    activeDisruptionsCount,
    inTransitShipmentsCount,
    loading,
    refresh: loadInitialData,
  };
}

export default useRealtimeTelemetry;
