import { createClient } from '@supabase/supabase-js';
import { SupplyHub, RoadDisruption, Shipment, SimulatedHazardInput, RegisterShipmentInput } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Baseline Regional Fallback Data
export const BASELINE_SUPPLY_HUBS: SupplyHub[] = [
  {
    id: 'hub-01',
    name: 'Guwahati Central Strategic Warehouse',
    state: 'Assam',
    latitude: 26.1445,
    longitude: 91.7362,
    capacity_tonnes: 500,
    contact_person: 'Ranjit Baruah',
    contact_phone: '+91 94350 11223',
    is_active: true,
  },
  {
    id: 'hub-02',
    name: 'Silchar Barak Valley Hub',
    state: 'Assam',
    latitude: 24.8333,
    longitude: 92.7789,
    capacity_tonnes: 250,
    contact_person: 'Debashish Nath',
    contact_phone: '+91 94350 22334',
    is_active: true,
  },
  {
    id: 'hub-03',
    name: 'Tezpur Northern Gateway',
    state: 'Assam',
    latitude: 26.6528,
    longitude: 92.7926,
    capacity_tonnes: 200,
    contact_person: 'Pranab Saikia',
    contact_phone: '+91 94350 33445',
    is_active: true,
  },
  {
    id: 'hub-04',
    name: 'Jorhat Upper Assam Depot',
    state: 'Assam',
    latitude: 26.7509,
    longitude: 94.2037,
    capacity_tonnes: 220,
    contact_person: 'Manish Gogoi',
    contact_phone: '+91 94350 44556',
    is_active: true,
  },
  {
    id: 'hub-05',
    name: 'Shillong Highland Transit Hub',
    state: 'Meghalaya',
    latitude: 25.5788,
    longitude: 91.8933,
    capacity_tonnes: 180,
    contact_person: 'Banrap Marbaniang',
    contact_phone: '+91 98620 55667',
    is_active: true,
  },
  {
    id: 'hub-06',
    name: 'Imphal Eastern Logistics Terminal',
    state: 'Manipur',
    latitude: 24.8170,
    longitude: 93.9368,
    capacity_tonnes: 210,
    contact_person: 'Ngangbam Singh',
    contact_phone: '+91 98630 66778',
    is_active: true,
  },
  {
    id: 'hub-07',
    name: 'Aizawl Southern Corridor Hub',
    state: 'Mizoram',
    latitude: 23.7271,
    longitude: 92.7176,
    capacity_tonnes: 160,
    contact_person: 'Lalnunmawia Royte',
    contact_phone: '+91 98640 77889',
    is_active: true,
  },
  {
    id: 'hub-08',
    name: 'Agartala Border Trade Logistics Center',
    state: 'Tripura',
    latitude: 23.8315,
    longitude: 91.2868,
    capacity_tonnes: 230,
    contact_person: 'Subir Debbarma',
    contact_phone: '+91 98650 88990',
    is_active: true,
  },
  {
    id: 'hub-09',
    name: 'Kohima Hill Logistics Center',
    state: 'Nagaland',
    latitude: 25.6751,
    longitude: 94.1086,
    capacity_tonnes: 140,
    contact_person: 'Tepok Ao',
    contact_phone: '+91 98660 99001',
    is_active: true,
  },
  {
    id: 'hub-10',
    name: 'Dimapur Railhead Hub',
    state: 'Nagaland',
    latitude: 25.9068,
    longitude: 93.7273,
    capacity_tonnes: 350,
    contact_person: 'Keviletuo Angami',
    contact_phone: '+91 98670 10112',
    is_active: true,
  },
  {
    id: 'hub-11',
    name: 'Itanagar Foothill Hub',
    state: 'Arunachal Pradesh',
    latitude: 27.0844,
    longitude: 93.6053,
    capacity_tonnes: 150,
    contact_person: 'Takam Ringu',
    contact_phone: '+91 98680 21223',
    is_active: true,
  },
  {
    id: 'hub-12',
    name: 'Gangtok Himalayan Depot',
    state: 'Sikkim',
    latitude: 27.3389,
    longitude: 88.6065,
    capacity_tonnes: 120,
    contact_person: 'Karma Bhutia',
    contact_phone: '+91 98690 32334',
    is_active: true,
  },
];

export const BASELINE_DISRUPTIONS: RoadDisruption[] = [];

// Active memory store for simulated disruptions
let simulatedDisruptionsMemory: RoadDisruption[] = [];

export const FALLBACK_SUPPLY_HUBS = BASELINE_SUPPLY_HUBS;
export const FALLBACK_DISRUPTIONS: RoadDisruption[] = [];

export const FALLBACK_SHIPMENTS: Shipment[] = [];

let activeShipmentsMemory: Shipment[] = [];

// Fetch Supply Hubs (Supabase with Fallback)
export async function fetchSupplyHubs(): Promise<SupplyHub[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('supply_hubs')
        .select('*')
        .order('state', { ascending: true });
      if (!error && data && data.length > 0) {
        return data as SupplyHub[];
      }
    } catch (err) {
      console.warn('Supabase fetch error, using regional defaults:', err);
    }
  }
  return BASELINE_SUPPLY_HUBS;
}

// Fetch Road Disruptions (Combines Supabase / Baseline + Injected Simulated Hazards)
export async function fetchRoadDisruptions(): Promise<RoadDisruption[]> {
  let baseList: RoadDisruption[] = BASELINE_DISRUPTIONS;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('road_disruptions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        baseList = data as RoadDisruption[];
      }
    } catch (err) {
      console.warn('Supabase fetch error, using regional defaults:', err);
    }
  }

  // Merge in any active simulated disruptions from memory
  const allDisruptions = [...simulatedDisruptionsMemory, ...baseList];
  const unique = Array.from(new Map(allDisruptions.map((d) => [d.id, d])).values());
  return unique;
}

// Insert Road Disruption strictly to Supabase with memory reactivity
export async function insertSimulatedDisruption(
  hazard: SimulatedHazardInput
): Promise<RoadDisruption> {
  const agency =
    hazard.government_body_name ||
    hazard.reported_by_agency ||
    'Border Roads Organisation (BRO)';

  const officialMessage = hazard.message || hazard.description || 'Road disruption advisory active.';

  const insertPayload: any = {
    title: hazard.title,
    disruption_type: hazard.disruption_type,
    hazard_type: hazard.disruption_type,
    severity: hazard.severity,
    risk_radius_meters: Number(hazard.risk_radius_meters) || 1000,
    latitude: parseFloat(String(hazard.latitude)),
    longitude: parseFloat(String(hazard.longitude)),
    message: officialMessage.slice(0, 500),
    highway_reference: hazard.highway_reference || 'Regional Highway',
    description: hazard.description || officialMessage,
    government_body_name: agency,
    reported_by_agency: agency,
    verified_by_official: hazard.verified_by_official || 'Verified Command Official',
    is_active: true,
    is_simulated: false,
  };

  if (hazard.created_by) {
    insertPayload.created_by = hazard.created_by;
  }

  let createdDisruption: RoadDisruption = {
    id: `disrupt-${Date.now()}`,
    ...insertPayload,
    created_at: new Date().toISOString(),
  };

  // Strictly save to Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('road_disruptions')
        .insert([insertPayload])
        .select()
        .single();

      if (error) {
        console.error('Supabase Disruption Insert Error:', error);
        throw new Error(`Failed to save hazard to database: ${error.message}`);
      }

      if (data) {
        createdDisruption = data as RoadDisruption;
      }
    } catch (err: any) {
      console.error('Supabase Disruption Insert Exception:', err);
      throw err;
    }
  }

  // Also add to memory store for immediate reactivity
  simulatedDisruptionsMemory = [createdDisruption, ...simulatedDisruptionsMemory];
  return createdDisruption;
}

// Delete Road Disruption from Supabase & Memory Store
export async function deleteRoadDisruption(id: string): Promise<boolean> {
  // Remove from local memory
  simulatedDisruptionsMemory = simulatedDisruptionsMemory.filter((d) => d.id !== id);

  if (supabase) {
    try {
      const { error } = await supabase
        .from('road_disruptions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase delete disruption error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Failed to delete road disruption in Supabase:', err);
      return false;
    }
  }

  return true;
}

// Reset Simulated Disruptions
export async function resetSimulatedDisruptions(): Promise<RoadDisruption[]> {
  simulatedDisruptionsMemory = [];
  return BASELINE_DISRUPTIONS;
}

// Helper to check valid UUID
export const isValidUUID = (val?: string) =>
  Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val));

// Universal Shipment Normalizer
export const normalizeShipment = (item: any): Shipment => {
  const originLat = Number(item.origin_lat) || (typeof item.origin === 'object' && Number(item.origin?.latitude)) || Number(item.current_lat) || 26.1445;
  const originLng = Number(item.origin_lng) || (typeof item.origin === 'object' && Number(item.origin?.longitude)) || Number(item.current_lng) || 91.7362;
  const destLat = Number(item.destination_lat) || (typeof item.destination === 'object' && Number(item.destination?.latitude)) || 25.5788;
  const destLng = Number(item.destination_lng) || (typeof item.destination === 'object' && Number(item.destination?.longitude)) || 91.8933;

  const originName = item.origin_name || (typeof item.origin === 'string' ? item.origin : item.origin?.name) || 'Guwahati Regional Hub';
  const destName = item.destination_name || (typeof item.destination === 'string' ? item.destination : item.destination?.name) || 'Shillong Forward Terminal';

  return {
    id: item.id ? String(item.id) : `shp-${Date.now()}`,
    tracking_code: item.tracking_code || `NER-SHP-${item.id ? String(item.id).slice(0, 4).toUpperCase() : Math.floor(1000 + Math.random() * 9000)}`,
    driver_id: item.driver_id || 'NER-CIT-UNASSIGNED',
    driver_name: item.driver_name || 'Driver In Transit',
    origin_hub_id: isValidUUID(item.origin_hub_id) ? item.origin_hub_id : undefined,
    origin_name: originName,
    origin: {
      name: originName,
      latitude: originLat,
      longitude: originLng,
    },
    destination_hub_id: isValidUUID(item.destination_hub_id) ? item.destination_hub_id : undefined,
    destination_name: destName,
    destination: {
      name: destName,
      latitude: destLat,
      longitude: destLng,
    },
    cargo_type: item.cargo_type || 'GENERAL',
    cargo_tier: item.cargo_tier || 'TIER_1_CRITICAL',
    cargo_manifest: item.cargo_manifest || 'Essential Logistics Consignment',
    priority_level: Number(item.priority_level) || 4,
    weight_tonnes: Number(item.weight_tonnes) || 5,
    current_status: item.current_status || item.status || 'IN_TRANSIT',
    current_lat: Number(item.current_lat) || originLat,
    current_lng: Number(item.current_lng) || originLng,
    heading: Number(item.heading) || 0,
    speed: Number(item.speed) || Number(item.speed_kmh) || 45,
    speed_kmh: Number(item.speed_kmh) || Number(item.speed) || 45,
    dispatched_by_hub_id: item.dispatched_by_hub_id,
    threat_score: Number(item.threat_score) || 0,
    notes: item.notes,
    created_at: item.created_at || new Date().toISOString(),
    last_ping_at: item.last_ping_at || new Date().toISOString(),
  };
};

// Fetch Shipments strictly from database (or local memory if offline)
export async function fetchShipments(): Promise<Shipment[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[SUPABASE FETCH SHIPMENTS ERROR]:', error.message);
      } else if (data) {
        console.log(`[SUPABASE HYDRATION] Hydrated ${data.length} active shipments from PostgreSQL.`);
        const dbList = data.map(normalizeShipment);
        activeShipmentsMemory = dbList;
        return dbList;
      }
    } catch (err) {
      console.warn('Supabase fetch error, using local memory:', err);
    }
  }

  return activeShipmentsMemory;
}

// Insert Shipment strictly for Authorized Supply Hub Accounts
export async function insertShipment(
  input: RegisterShipmentInput,
  creatorHubId?: string
): Promise<Shipment> {
  const trackingCode = `NER-SHP-${Math.floor(1000 + Math.random() * 9000)}`;
  const originLat = Number(input.origin_lat) || 26.1445;
  const originLng = Number(input.origin_lng) || 91.7362;
  const destLat = Number(input.destination_lat) || 25.5788;
  const destLng = Number(input.destination_lng) || 91.8933;

  let newShipment: Shipment = {
    id: `shp-${Date.now()}`,
    tracking_code: trackingCode,
    driver_id: input.driver_id || `NER-CIT-${Math.floor(10000 + Math.random() * 90000)}`,
    driver_name: input.driver_name || 'Assigned Driver',
    origin_hub_id: isValidUUID(input.origin_hub_id) ? input.origin_hub_id : undefined,
    origin_name: input.origin_name || 'Origin Supply Hub',
    origin: {
      name: input.origin_name || 'Origin Supply Hub',
      latitude: originLat,
      longitude: originLng,
    },
    destination_hub_id: isValidUUID(input.destination_hub_id) ? input.destination_hub_id : undefined,
    destination_name: input.destination_name || 'Destination Hub',
    destination: {
      name: input.destination_name || 'Destination Hub',
      latitude: destLat,
      longitude: destLng,
    },
    cargo_type: input.cargo_type || 'GENERAL',
    cargo_tier: input.cargo_tier || 'TIER_1_CRITICAL',
    cargo_manifest: input.cargo_manifest || 'Essential Logistics Consignment',
    priority_level:
      input.priority_level ||
      (input.cargo_tier === 'TIER_1_CRITICAL' ? 5 : input.cargo_tier === 'TIER_2_ESSENTIAL' ? 4 : 3),
    weight_tonnes: Number(input.weight_tonnes) || 5,
    current_status: 'IN_TRANSIT',
    current_lat: originLat,
    current_lng: originLng,
    heading: 0,
    speed: 45,
    speed_kmh: 45,
    dispatched_by_hub_id: creatorHubId || input.origin_hub_id,
    notes: input.notes,
    created_at: new Date().toISOString(),
    last_ping_at: new Date().toISOString(),
  };

  if (supabase) {
    try {
      const payload: Record<string, any> = {
        tracking_code: newShipment.tracking_code,
        driver_id: newShipment.driver_id,
        driver_name: newShipment.driver_name,
        origin_name: newShipment.origin_name,
        destination_name: newShipment.destination_name,
        origin: newShipment.origin_name,
        destination: newShipment.destination_name,
        cargo_type: newShipment.cargo_type,
        cargo_tier: newShipment.cargo_tier,
        cargo_manifest: newShipment.cargo_manifest,
        priority_level: newShipment.priority_level,
        weight_tonnes: newShipment.weight_tonnes,
        current_status: 'IN_TRANSIT',
        status: 'IN_TRANSIT',
        current_lat: originLat,
        current_lng: originLng,
        heading: 0,
        speed: 45,
        threat_score: 0,
        dispatched_by_hub_id: newShipment.dispatched_by_hub_id || null,
        notes: newShipment.notes || null,
        created_at: newShipment.created_at,
        last_ping_at: newShipment.last_ping_at,
      };

      if (isValidUUID(newShipment.origin_hub_id)) {
        payload.origin_hub_id = newShipment.origin_hub_id;
      }
      if (isValidUUID(newShipment.destination_hub_id)) {
        payload.destination_hub_id = newShipment.destination_hub_id;
      }

      console.log('[SUPABASE DISPATCH INSERT PAYLOAD]:', payload);
      const { data, error } = await supabase
        .from('shipments')
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        console.log('[SUPABASE DISPATCH PERSISTED TO POSTGRESQL]:', data.id, data.tracking_code);
        newShipment = normalizeShipment(data);
      } else if (error) {
        console.error('[SUPABASE DISPATCH PERSISTENCE ERROR]:', error.message, error.details || error);
      }
    } catch (err) {
      console.error('[SUPABASE SHIPMENT INSERT EXCEPTION]:', err);
    }
  }

  activeShipmentsMemory = [newShipment, ...activeShipmentsMemory.filter((s) => s.id !== newShipment.id)];
  return newShipment;
}

// Update Real-Time Driver Telemetry for Active Shipment
export async function updateShipmentTelemetry(
  shipmentId: string,
  telemetry: {
    current_lat: number;
    current_lng: number;
    heading?: number | null;
    speed?: number | null;
  }
): Promise<boolean> {
  activeShipmentsMemory = activeShipmentsMemory.map((s) => {
    if (s.id === shipmentId) {
      return {
        ...s,
        current_lat: telemetry.current_lat,
        current_lng: telemetry.current_lng,
        heading: telemetry.heading ?? s.heading,
        speed: telemetry.speed ?? s.speed,
        speed_kmh: telemetry.speed ?? s.speed,
        last_ping_at: new Date().toISOString(),
      };
    }
    return s;
  });

  if (supabase) {
    try {
      const { error } = await supabase
        .from('shipments')
        .update({
          current_lat: telemetry.current_lat,
          current_lng: telemetry.current_lng,
          heading: telemetry.heading ?? 0,
          speed: telemetry.speed ?? 0,
          last_ping_at: new Date().toISOString(),
        })
        .eq('id', shipmentId);

      if (!error) return true;
    } catch (err) {
      console.warn('Supabase telemetry update exception:', err);
    }
  }
  return false;
}

// Supabase Realtime WebSocket subscription for a single shipment
export function subscribeToShipmentRealtime(
  shipmentId: string,
  onUpdate: (updatedShipment: Shipment) => void
) {
  if (!supabase) return () => {};

  try {
    const channel = supabase
      .channel(`shipment-${shipmentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shipments',
          filter: `id=eq.${shipmentId}`,
        },
        (payload: any) => {
          if (payload.new) {
            onUpdate(normalizeShipment(payload.new));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Realtime subscription error:', err);
    return () => {};
  }
}

// Supabase Realtime WebSocket subscription for all fleet shipments
export function subscribeToAllShipmentsRealtime(
  onUpdate: (shipment: Shipment) => void,
  onDelete?: (deletedId: string) => void
) {
  if (!supabase) return () => {};

  try {
    console.log('[SUPABASE REALTIME] Subscribing to public:shipments broadcast channel...');
    const channel = supabase
      .channel('realtime-all-shipments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shipments',
        },
        (payload: any) => {
          console.log('[SUPABASE REALTIME SHIPMENTS POSTGRES_CHANGE]', payload.eventType, payload);
          if (payload.eventType === 'DELETE' && payload.old?.id && onDelete) {
            onDelete(String(payload.old.id));
          } else if (payload.new) {
            const normalized = normalizeShipment(payload.new);
            onUpdate(normalized);
          }
        }
      )
      .subscribe((status) => {
        console.log('[SUPABASE REALTIME SHIPMENTS CHANNEL SUBSCRIPTION STATUS]:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Realtime all shipments subscription error:', err);
    return () => {};
  }
}

// Supabase Realtime WebSocket subscription for hazards/disruptions
export function subscribeToAllHazardsRealtime(
  onInsert: (hazard: RoadDisruption) => void,
  onUpdate: (hazard: RoadDisruption) => void,
  onDelete: (id: string) => void
) {
  if (!supabase) return () => {};

  try {
    const channel = supabase
      .channel('realtime-hazards-corridor')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'road_disruptions' },
        (payload: any) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            onInsert(payload.new as RoadDisruption);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            onUpdate(payload.new as RoadDisruption);
          } else if (payload.eventType === 'DELETE' && payload.old) {
            onDelete(payload.old.id);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hazards' },
        (payload: any) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const h = payload.new;
            onInsert({
              id: h.id,
              title: h.title || h.name || 'Hazard Alert',
              disruption_type: h.disruption_type || h.hazard_type || 'LANDSLIDE',
              severity: h.severity || 'HIGH',
              risk_radius_meters: h.risk_radius_meters || h.radius_meters || 1000,
              latitude: Number(h.latitude || h.lat),
              longitude: Number(h.longitude || h.lng),
              message: h.message || h.description || '',
              description: h.description || h.message || '',
              is_active: h.is_active ?? true,
              is_simulated: h.is_simulated ?? false,
              created_at: h.created_at || new Date().toISOString(),
            } as RoadDisruption);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const h = payload.new;
            onUpdate({
              id: h.id,
              title: h.title || h.name || 'Hazard Alert',
              disruption_type: h.disruption_type || h.hazard_type || 'LANDSLIDE',
              severity: h.severity || 'HIGH',
              risk_radius_meters: h.risk_radius_meters || h.radius_meters || 1000,
              latitude: Number(h.latitude || h.lat),
              longitude: Number(h.longitude || h.lng),
              message: h.message || h.description || '',
              description: h.description || h.message || '',
              is_active: h.is_active ?? true,
              is_simulated: h.is_simulated ?? false,
              created_at: h.created_at || new Date().toISOString(),
            } as RoadDisruption);
          } else if (payload.eventType === 'DELETE' && payload.old) {
            onDelete(payload.old.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Realtime hazards subscription error:', err);
    return () => {};
  }
}
