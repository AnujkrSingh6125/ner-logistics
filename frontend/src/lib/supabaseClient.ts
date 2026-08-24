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

export const FALLBACK_SHIPMENTS: Shipment[] = [
  {
    id: 'shp-convoy-01',
    tracking_code: 'NER-CVY-8841',
    driver_id: 'NER-CIT-10492',
    driver_name: 'Rajesh Borah',
    cargo_type: 'MEDICINE',
    cargo_tier: 'TIER_1_CRITICAL',
    cargo_manifest: 'Emergency Pediatric Vaccines & Antivenom Serum',
    priority_level: 5,
    origin_name: 'Guwahati Central Strategic Warehouse',
    destination_name: 'Shillong Highland Transit Terminal',
    origin: {
      name: 'Guwahati Central Strategic Warehouse',
      latitude: 26.1445,
      longitude: 91.7362,
    },
    destination: {
      name: 'Shillong Highland Transit Terminal',
      latitude: 25.5788,
      longitude: 91.8933,
    },
    current_status: 'IN_TRANSIT',
    current_lat: 25.9124,
    current_lng: 91.8214,
    heading: 145,
    speed: 48,
    speed_kmh: 48,
    weight_tonnes: 4.2,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    last_ping_at: new Date().toISOString(),
  },
  {
    id: 'shp-convoy-02',
    tracking_code: 'NER-CVY-9923',
    driver_id: 'NER-CIT-44821',
    driver_name: 'Tsering Dorjee',
    cargo_type: 'PERISHABLE_FOOD',
    cargo_tier: 'TIER_2_ESSENTIAL',
    cargo_manifest: 'High-Altitude Ration Packs & Potable Water',
    priority_level: 4,
    origin_name: 'Dimapur Transshipment Depot',
    destination_name: 'Kohima Buffer Depot',
    origin: {
      name: 'Dimapur Transshipment Depot',
      latitude: 25.9064,
      longitude: 93.7279,
    },
    destination: {
      name: 'Kohima Buffer Depot',
      latitude: 25.6751,
      longitude: 94.1086,
    },
    current_status: 'IN_TRANSIT',
    current_lat: 25.7821,
    current_lng: 93.9142,
    heading: 98,
    speed: 42,
    speed_kmh: 42,
    weight_tonnes: 8.5,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    last_ping_at: new Date().toISOString(),
  },
  {
    id: 'shp-convoy-03',
    tracking_code: 'NER-CVY-3310',
    driver_id: 'NER-CIT-77192',
    driver_name: 'Vikram Sangma',
    cargo_type: 'FUEL',
    cargo_tier: 'TIER_3_BULK',
    cargo_manifest: 'Aviation & Diesel Fuel Reserves for Backup Generators',
    priority_level: 3,
    origin_name: 'Silchar Barak Valley Hub',
    destination_name: 'Aizawl Southern Relief Hub',
    origin: {
      name: 'Silchar Barak Valley Hub',
      latitude: 24.8333,
      longitude: 92.7789,
    },
    destination: {
      name: 'Aizawl Southern Relief Hub',
      latitude: 23.7271,
      longitude: 92.7176,
    },
    current_status: 'REROUTED',
    current_lat: 24.3129,
    current_lng: 92.7418,
    heading: 190,
    speed: 36,
    speed_kmh: 36,
    weight_tonnes: 12.0,
    created_at: new Date(Date.now() - 10800000).toISOString(),
    last_ping_at: new Date().toISOString(),
  },
];

let activeShipmentsMemory: Shipment[] = [...FALLBACK_SHIPMENTS];

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

// Fetch Shipments (Combines Supabase with local memory reactive fleet)
export async function fetchShipments(): Promise<Shipment[]> {
  let dbList: Shipment[] = [];
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        dbList = data.map((item: any) => ({
          ...item,
          origin_name: item.origin_name || (typeof item.origin === 'object' ? item.origin?.name : item.origin) || 'Origin Hub',
          destination_name: item.destination_name || (typeof item.destination === 'object' ? item.destination?.name : item.destination) || 'Destination Hub',
        })) as Shipment[];
      }
    } catch (err) {
      console.warn('Supabase fetch error, using regional defaults:', err);
    }
  }

  const merged = [...activeShipmentsMemory, ...dbList];
  const unique = Array.from(new Map(merged.map((s) => [s.id, s])).values());
  return unique;
}

// Insert Shipment strictly for Authorized Supply Hub Accounts
export async function insertShipment(
  input: RegisterShipmentInput,
  creatorHubId?: string
): Promise<Shipment> {
  const trackingCode = `NER-SHP-${Math.floor(1000 + Math.random() * 9000)}`;
  const newShipment: Shipment = {
    id: `shp-${Date.now()}`,
    tracking_code: trackingCode,
    driver_id: input.driver_id || `NER-CIT-${Math.floor(10000 + Math.random() * 90000)}`,
    driver_name: input.driver_name,
    origin_hub_id: input.origin_hub_id,
    origin_name: input.origin_name,
    origin: {
      name: input.origin_name,
      latitude: input.origin_lat || 26.1445,
      longitude: input.origin_lng || 91.7362,
    },
    destination_hub_id: input.destination_hub_id,
    destination_name: input.destination_name,
    destination: {
      name: input.destination_name,
      latitude: input.destination_lat || 25.5788,
      longitude: input.destination_lng || 91.8933,
    },
    cargo_type: input.cargo_type,
    cargo_tier: input.cargo_tier,
    cargo_manifest: input.cargo_manifest,
    priority_level:
      input.priority_level ||
      (input.cargo_tier === 'TIER_1_CRITICAL' ? 5 : input.cargo_tier === 'TIER_2_ESSENTIAL' ? 4 : 3),
    weight_tonnes: Number(input.weight_tonnes) || 5,
    current_status: 'IN_TRANSIT',
    current_lat: input.origin_lat || 26.1445,
    current_lng: input.origin_lng || 91.7362,
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
      const { data, error } = await supabase
        .from('shipments')
        .insert([
          {
            tracking_code: newShipment.tracking_code,
            driver_id: newShipment.driver_id,
            driver_name: newShipment.driver_name,
            origin_hub_id: newShipment.origin_hub_id,
            destination_hub_id: newShipment.destination_hub_id,
            origin_name: newShipment.origin_name,
            destination_name: newShipment.destination_name,
            origin: newShipment.origin,
            destination: newShipment.destination,
            cargo_type: newShipment.cargo_type,
            cargo_tier: newShipment.cargo_tier,
            cargo_manifest: newShipment.cargo_manifest,
            priority_level: newShipment.priority_level,
            weight_tonnes: newShipment.weight_tonnes,
            current_status: newShipment.current_status,
            current_lat: newShipment.current_lat,
            current_lng: newShipment.current_lng,
            heading: newShipment.heading,
            speed: newShipment.speed,
            dispatched_by_hub_id: newShipment.dispatched_by_hub_id,
            notes: newShipment.notes,
            created_at: newShipment.created_at,
            last_ping_at: newShipment.last_ping_at,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        newShipment.id = data.id;
      } else if (error) {
        console.warn('[SUPABASE SHIPMENT INSERT WARN]:', error.message);
      }
    } catch (err) {
      console.warn('Supabase shipment insert exception:', err);
    }
  }

  activeShipmentsMemory = [newShipment, ...activeShipmentsMemory];
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
      await supabase
        .from('shipments')
        .update({
          current_lat: telemetry.current_lat,
          current_lng: telemetry.current_lng,
          heading: telemetry.heading,
          speed: telemetry.speed,
          last_ping_at: new Date().toISOString(),
        })
        .eq('id', shipmentId);
      return true;
    } catch (err) {
      console.warn('Supabase update shipment telemetry error:', err);
    }
  }
  return true;
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
            onUpdate(payload.new as Shipment);
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
  onUpdate: (shipment: Shipment) => void
) {
  if (!supabase) return () => {};

  try {
    const channel = supabase
      .channel('all-shipments-telemetry')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shipments',
        },
        (payload: any) => {
          if (payload.new) {
            onUpdate(payload.new as Shipment);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Realtime all shipments subscription error:', err);
    return () => {};
  }
}
