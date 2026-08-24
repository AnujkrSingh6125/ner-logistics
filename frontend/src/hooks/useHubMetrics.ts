'use client';

import { useState, useEffect } from 'react';
import { supabase, BASELINE_SUPPLY_HUBS } from '@/lib/supabaseClient';
import { SupplyHub } from '@/types';

export function useHubMetrics() {
  const [hubs, setHubs] = useState<SupplyHub[]>(BASELINE_SUPPLY_HUBS);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchHubs() {
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('supply_hubs')
            .select('*')
            .order('state', { ascending: true });

          if (!error && data && data.length > 0 && isMounted) {
            setHubs(data as SupplyHub[]);
          }
        } catch (err) {
          console.warn('[useHubMetrics] Error fetching supply hubs:', err);
        }
      }
      if (isMounted) setLoading(false);
    }

    fetchHubs();

    // Enable Supabase Realtime subscription for live updates
    let channel: any = null;
    if (supabase) {
      channel = supabase
        .channel('supply_hubs_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'supply_hubs' },
          () => {
            fetchHubs();
          }
        )
        .subscribe();
    }

    return () => {
      isMounted = false;
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const totalCount = hubs.length;
  const totalCapacityTons = hubs.reduce(
    (sum, hub) => sum + (Number(hub.capacity_tons) || Number(hub.capacity_tonnes) || 0),
    0
  );

  return { hubs, totalCount, totalCapacityTons, loading };
}

export default useHubMetrics;
