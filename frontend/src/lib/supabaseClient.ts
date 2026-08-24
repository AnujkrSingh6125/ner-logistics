import { createClient } from '@supabase/supabase-js';
import { SupplyHub, RoadDisruption, Shipment, SimulatedHazardInput, RegisterShipmentInput, SystemBroadcast, Profile } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Baseline Regional Fallback Data (Exactly 50 Unique Strategic Logistics Hubs across NER)
export const BASELINE_SUPPLY_HUBS: SupplyHub[] = [
  // --- Assam (12 Hubs) ---
  {
    id: 'Guwahati Central Hub',
    name: 'Guwahati Central Hub',
    state: 'Assam',
    district: 'Kamrup Metropolitan',
    latitude: 26.1445,
    longitude: 91.7362,
    capacity_tons: 2500,
    capacity_tonnes: 2500,
    current_load_tons: 1100,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Silchar Logistics Depot',
    name: 'Silchar Logistics Depot',
    state: 'Assam',
    district: 'Cachar',
    latitude: 24.8333,
    longitude: 92.7789,
    capacity_tons: 1200,
    capacity_tonnes: 1200,
    current_load_tons: 640,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Dibrugarh Air Cargo Hub',
    name: 'Dibrugarh Air Cargo Hub',
    state: 'Assam',
    district: 'Dibrugarh',
    latitude: 27.4728,
    longitude: 94.912,
    capacity_tons: 1000,
    capacity_tonnes: 1000,
    current_load_tons: 420,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Jorhat Distribution Center',
    name: 'Jorhat Distribution Center',
    state: 'Assam',
    district: 'Jorhat',
    latitude: 26.7509,
    longitude: 94.2037,
    capacity_tons: 850,
    capacity_tonnes: 850,
    current_load_tons: 310,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Tezpur Strategic Depot',
    name: 'Tezpur Strategic Depot',
    state: 'Assam',
    district: 'Sonitpur',
    latitude: 26.6528,
    longitude: 92.7926,
    capacity_tons: 950,
    capacity_tonnes: 950,
    current_load_tons: 500,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Nagaon Transit Base',
    name: 'Nagaon Transit Base',
    state: 'Assam',
    district: 'Nagaon',
    latitude: 26.3465,
    longitude: 92.684,
    capacity_tons: 700,
    capacity_tonnes: 700,
    current_load_tons: 290,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Bongaigaon Refinery Depot',
    name: 'Bongaigaon Refinery Depot',
    state: 'Assam',
    district: 'Bongaigaon',
    latitude: 26.5024,
    longitude: 90.5532,
    capacity_tons: 1100,
    capacity_tonnes: 1100,
    current_load_tons: 600,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Tinsukia Industrial Park',
    name: 'Tinsukia Industrial Park',
    state: 'Assam',
    district: 'Tinsukia',
    latitude: 27.4922,
    longitude: 95.3468,
    capacity_tons: 900,
    capacity_tonnes: 900,
    current_load_tons: 480,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Goalpara River Logistics Hub',
    name: 'Goalpara River Logistics Hub',
    state: 'Assam',
    district: 'Goalpara',
    latitude: 26.17,
    longitude: 90.62,
    capacity_tons: 600,
    capacity_tonnes: 600,
    current_load_tons: 210,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'North Lakhimpur Depot',
    name: 'North Lakhimpur Depot',
    state: 'Assam',
    district: 'Lakhimpur',
    latitude: 27.23,
    longitude: 94.1,
    capacity_tons: 550,
    capacity_tonnes: 550,
    current_load_tons: 180,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Karimganj Border Hub',
    name: 'Karimganj Border Hub',
    state: 'Assam',
    district: 'Karimganj',
    latitude: 24.8667,
    longitude: 92.35,
    capacity_tons: 650,
    capacity_tonnes: 650,
    current_load_tons: 320,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Dhubri Brahmaputra Terminal',
    name: 'Dhubri Brahmaputra Terminal',
    state: 'Assam',
    district: 'Dhubri',
    latitude: 26.02,
    longitude: 89.97,
    capacity_tons: 750,
    capacity_tonnes: 750,
    current_load_tons: 390,
    status: 'OPERATIONAL',
    is_active: true,
  },

  // --- Arunachal Pradesh (8 Hubs) ---
  {
    id: 'Itanagar Command Base',
    name: 'Itanagar Command Base',
    state: 'Arunachal Pradesh',
    district: 'Papum Pare',
    latitude: 27.0844,
    longitude: 93.6053,
    capacity_tons: 900,
    capacity_tonnes: 900,
    current_load_tons: 450,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Pasighat Siang Terminal',
    name: 'Pasighat Siang Terminal',
    state: 'Arunachal Pradesh',
    district: 'East Siang',
    latitude: 28.0667,
    longitude: 95.3333,
    capacity_tons: 600,
    capacity_tonnes: 600,
    current_load_tons: 210,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Tawang High Altitude Hub',
    name: 'Tawang High Altitude Hub',
    state: 'Arunachal Pradesh',
    district: 'Tawang',
    latitude: 27.5861,
    longitude: 91.8594,
    capacity_tons: 500,
    capacity_tonnes: 500,
    current_load_tons: 380,
    status: 'CRITICAL',
    is_active: true,
  },
  {
    id: 'Ziro Valley Center',
    name: 'Ziro Valley Center',
    state: 'Arunachal Pradesh',
    district: 'Lower Subansiri',
    latitude: 27.5333,
    longitude: 93.8333,
    capacity_tons: 400,
    capacity_tonnes: 400,
    current_load_tons: 140,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Bomdila Strategic Reserve',
    name: 'Bomdila Strategic Reserve',
    state: 'Arunachal Pradesh',
    district: 'West Kameng',
    latitude: 27.2645,
    longitude: 92.4184,
    capacity_tons: 550,
    capacity_tonnes: 550,
    current_load_tons: 290,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Tezu Eastern Logistics Base',
    name: 'Tezu Eastern Logistics Base',
    state: 'Arunachal Pradesh',
    district: 'Lohit',
    latitude: 27.9167,
    longitude: 96.1667,
    capacity_tons: 450,
    capacity_tonnes: 450,
    current_load_tons: 160,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Along Sub-Station',
    name: 'Along Sub-Station',
    state: 'Arunachal Pradesh',
    district: 'West Siang',
    latitude: 28.1667,
    longitude: 94.8,
    capacity_tons: 350,
    capacity_tonnes: 350,
    current_load_tons: 110,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Roing Foothills Depot',
    name: 'Roing Foothills Depot',
    state: 'Arunachal Pradesh',
    district: 'Lower Dibang Valley',
    latitude: 28.1333,
    longitude: 95.8333,
    capacity_tons: 380,
    capacity_tonnes: 380,
    current_load_tons: 130,
    status: 'OPERATIONAL',
    is_active: true,
  },

  // --- Meghalaya (6 Hubs) ---
  {
    id: 'Shillong Highland Hub',
    name: 'Shillong Highland Hub',
    state: 'Meghalaya',
    district: 'East Khasi Hills',
    latitude: 25.5788,
    longitude: 91.8933,
    capacity_tons: 1000,
    capacity_tonnes: 1000,
    current_load_tons: 520,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Tura Garo Hills Depot',
    name: 'Tura Garo Hills Depot',
    state: 'Meghalaya',
    district: 'West Garo Hills',
    latitude: 25.5138,
    longitude: 90.2033,
    capacity_tons: 600,
    capacity_tonnes: 600,
    current_load_tons: 240,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Jowai Coal Belt Depot',
    name: 'Jowai Coal Belt Depot',
    state: 'Meghalaya',
    district: 'West Jaintia Hills',
    latitude: 25.45,
    longitude: 92.2,
    capacity_tons: 500,
    capacity_tonnes: 500,
    current_load_tons: 190,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Nongpoh Transit Center',
    name: 'Nongpoh Transit Center',
    state: 'Meghalaya',
    district: 'Ri-Bhoi',
    latitude: 25.9,
    longitude: 91.88,
    capacity_tons: 650,
    capacity_tonnes: 650,
    current_load_tons: 310,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Baghmara Border Outpost Hub',
    name: 'Baghmara Border Outpost Hub',
    state: 'Meghalaya',
    district: 'South Garo Hills',
    latitude: 25.2,
    longitude: 90.63,
    capacity_tons: 300,
    capacity_tonnes: 300,
    current_load_tons: 120,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Williamnagar Central Hub',
    name: 'Williamnagar Central Hub',
    state: 'Meghalaya',
    district: 'East Garo Hills',
    latitude: 25.6,
    longitude: 90.58,
    capacity_tons: 350,
    capacity_tonnes: 350,
    current_load_tons: 110,
    status: 'OPERATIONAL',
    is_active: true,
  },

  // --- Nagaland (6 Hubs) ---
  {
    id: 'Dimapur Railway Logistics Yard',
    name: 'Dimapur Railway Logistics Yard',
    state: 'Nagaland',
    district: 'Dimapur',
    latitude: 25.9095,
    longitude: 93.7266,
    capacity_tons: 1400,
    capacity_tonnes: 1400,
    current_load_tons: 780,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Kohima Capital Storage Depot',
    name: 'Kohima Capital Storage Depot',
    state: 'Nagaland',
    district: 'Kohima',
    latitude: 25.6751,
    longitude: 94.1086,
    capacity_tons: 750,
    capacity_tonnes: 750,
    current_load_tons: 410,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Mokokchung Regional Hub',
    name: 'Mokokchung Regional Hub',
    state: 'Nagaland',
    district: 'Mokokchung',
    latitude: 26.3256,
    longitude: 94.5204,
    capacity_tons: 450,
    capacity_tonnes: 450,
    current_load_tons: 170,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Tuensang Eastern Hub',
    name: 'Tuensang Eastern Hub',
    state: 'Nagaland',
    district: 'Tuensang',
    latitude: 26.28,
    longitude: 94.83,
    capacity_tons: 380,
    capacity_tonnes: 380,
    current_load_tons: 150,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Wokha Supply Base',
    name: 'Wokha Supply Base',
    state: 'Nagaland',
    district: 'Wokha',
    latitude: 26.1,
    longitude: 94.26,
    capacity_tons: 320,
    capacity_tonnes: 320,
    current_load_tons: 90,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Mon Frontier Depot',
    name: 'Mon Frontier Depot',
    state: 'Nagaland',
    district: 'Mon',
    latitude: 26.75,
    longitude: 95.06,
    capacity_tons: 340,
    capacity_tonnes: 340,
    current_load_tons: 130,
    status: 'OPERATIONAL',
    is_active: true,
  },

  // --- Manipur (6 Hubs) ---
  {
    id: 'Imphal Valley Central Base',
    name: 'Imphal Valley Central Base',
    state: 'Manipur',
    district: 'Imphal West',
    latitude: 24.817,
    longitude: 93.9368,
    capacity_tons: 1100,
    capacity_tonnes: 1100,
    current_load_tons: 690,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Churachandpur Southern Depot',
    name: 'Churachandpur Southern Depot',
    state: 'Manipur',
    district: 'Churachandpur',
    latitude: 24.3333,
    longitude: 93.6667,
    capacity_tons: 500,
    capacity_tonnes: 500,
    current_load_tons: 270,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Moreh International Transit Hub',
    name: 'Moreh International Transit Hub',
    state: 'Manipur',
    district: 'Tengnoupal',
    latitude: 24.2444,
    longitude: 94.3056,
    capacity_tons: 800,
    capacity_tonnes: 800,
    current_load_tons: 390,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Senapati Northern Terminal',
    name: 'Senapati Northern Terminal',
    state: 'Manipur',
    district: 'Senapati',
    latitude: 25.27,
    longitude: 94.02,
    capacity_tons: 420,
    capacity_tonnes: 420,
    current_load_tons: 180,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Thoubal Agrilogistics Hub',
    name: 'Thoubal Agrilogistics Hub',
    state: 'Manipur',
    district: 'Thoubal',
    latitude: 24.63,
    longitude: 93.99,
    capacity_tons: 480,
    capacity_tonnes: 480,
    current_load_tons: 190,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Ukhrul Mountain Depot',
    name: 'Ukhrul Mountain Depot',
    state: 'Manipur',
    district: 'Ukhrul',
    latitude: 25.11,
    longitude: 94.36,
    capacity_tons: 360,
    capacity_tonnes: 360,
    current_load_tons: 160,
    status: 'OPERATIONAL',
    is_active: true,
  },

  // --- Mizoram (4 Hubs) ---
  {
    id: 'Aizawl Apex Warehouse',
    name: 'Aizawl Apex Warehouse',
    state: 'Mizoram',
    district: 'Aizawl',
    latitude: 23.7271,
    longitude: 92.7176,
    capacity_tons: 850,
    capacity_tonnes: 850,
    current_load_tons: 460,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Lunglei Southern Supply Hub',
    name: 'Lunglei Southern Supply Hub',
    state: 'Mizoram',
    district: 'Lunglei',
    latitude: 22.88,
    longitude: 92.73,
    capacity_tons: 500,
    capacity_tonnes: 500,
    current_load_tons: 210,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Champhai Border Logistics Depot',
    name: 'Champhai Border Logistics Depot',
    state: 'Mizoram',
    district: 'Champhai',
    latitude: 23.47,
    longitude: 93.32,
    capacity_tons: 450,
    capacity_tonnes: 450,
    current_load_tons: 190,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Kolasib Transit Point',
    name: 'Kolasib Transit Point',
    state: 'Mizoram',
    district: 'Kolasib',
    latitude: 24.23,
    longitude: 92.68,
    capacity_tons: 400,
    capacity_tonnes: 400,
    current_load_tons: 150,
    status: 'OPERATIONAL',
    is_active: true,
  },

  // --- Tripura (4 Hubs) ---
  {
    id: 'Agartala Integrated Checkpost Hub',
    name: 'Agartala Integrated Checkpost Hub',
    state: 'Tripura',
    district: 'West Tripura',
    latitude: 23.8315,
    longitude: 91.2868,
    capacity_tons: 1200,
    capacity_tonnes: 1200,
    current_load_tons: 620,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Dharmanagar Rail Depot',
    name: 'Dharmanagar Rail Depot',
    state: 'Tripura',
    district: 'North Tripura',
    latitude: 24.37,
    longitude: 92.16,
    capacity_tons: 600,
    capacity_tonnes: 600,
    current_load_tons: 270,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Udaipur Regional Store',
    name: 'Udaipur Regional Store',
    state: 'Tripura',
    district: 'Gomati',
    latitude: 23.53,
    longitude: 91.48,
    capacity_tons: 450,
    capacity_tonnes: 450,
    current_load_tons: 180,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Belonia Southern Border Hub',
    name: 'Belonia Southern Border Hub',
    state: 'Tripura',
    district: 'South Tripura',
    latitude: 23.25,
    longitude: 91.45,
    capacity_tons: 380,
    capacity_tonnes: 380,
    current_load_tons: 140,
    status: 'OPERATIONAL',
    is_active: true,
  },

  // --- Sikkim (4 Hubs) ---
  {
    id: 'Gangtok Himalayan Base',
    name: 'Gangtok Himalayan Base',
    state: 'Sikkim',
    district: 'East Sikkim',
    latitude: 27.3314,
    longitude: 88.6138,
    capacity_tons: 700,
    capacity_tonnes: 700,
    current_load_tons: 390,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Namchi South Storage Hub',
    name: 'Namchi South Storage Hub',
    state: 'Sikkim',
    district: 'South Sikkim',
    latitude: 27.17,
    longitude: 88.35,
    capacity_tons: 420,
    capacity_tonnes: 420,
    current_load_tons: 160,
    status: 'OPERATIONAL',
    is_active: true,
  },
  {
    id: 'Mangan Alpine Outpost',
    name: 'Mangan Alpine Outpost',
    state: 'Sikkim',
    district: 'North Sikkim',
    latitude: 27.5,
    longitude: 88.53,
    capacity_tons: 320,
    capacity_tonnes: 320,
    current_load_tons: 180,
    status: 'CRITICAL',
    is_active: true,
  },
  {
    id: 'Gyalshing West Logistics Depot',
    name: 'Gyalshing West Logistics Depot',
    state: 'Sikkim',
    district: 'West Sikkim',
    latitude: 27.28,
    longitude: 88.25,
    capacity_tons: 360,
    capacity_tonnes: 360,
    current_load_tons: 130,
    status: 'OPERATIONAL',
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
  broadcastCrossSessionEvent({ type: 'hazard_insert', payload: createdDisruption });
  return createdDisruption;
}

// Delete Road Disruption from Supabase & Memory Store
export async function deleteRoadDisruption(id: string): Promise<boolean> {
  // Remove from local memory
  simulatedDisruptionsMemory = simulatedDisruptionsMemory.filter((d) => d.id !== id);
  broadcastCrossSessionEvent({ type: 'hazard_delete', payload: id });

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
    hub_id: item.hub_id || item.dispatched_by_hub_id || item.origin_hub_id,
    hub_code: item.hub_code || item.dispatched_by_hub_id,
    created_by: item.created_by,
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
        hub_id: newShipment.hub_id || newShipment.dispatched_by_hub_id || null,
        hub_code: newShipment.hub_code || newShipment.dispatched_by_hub_id || null,
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
  broadcastCrossSessionEvent({ type: 'shipment_insert', payload: newShipment });
  return newShipment;
}

// Delete / Decommission Shipment (Protected with multi-tenant Hub ownership checks)
export async function deleteShipment(
  shipmentId: string,
  operatorHubIdentifier?: string,
  userRole?: string
): Promise<{ success: boolean; message: string }> {
  const existing = activeShipmentsMemory.find((s) => s.id === shipmentId);
  const isGovOrAdmin =
    userRole === 'gov_official' ||
    userRole === 'GOV_AUTHORITY' ||
    userRole === 'admin';

  // Strict multi-tenant authorization barrier
  if (existing && !isGovOrAdmin && operatorHubIdentifier) {
    const shipmentHub =
      existing.hub_id || existing.hub_code || existing.dispatched_by_hub_id;
    const cleanOpHub = operatorHubIdentifier.trim().toLowerCase();
    const isOwner =
      (shipmentHub && shipmentHub.toLowerCase() === cleanOpHub) ||
      (existing.origin_name && existing.origin_name.toLowerCase().includes(cleanOpHub)) ||
      (cleanOpHub.length > 3 && (existing.origin_name || '').toLowerCase().includes(cleanOpHub));

    if (!isOwner) {
      console.warn(
        `[SECURITY RLS GUARD] Supply Hub ${operatorHubIdentifier} attempted to delete foreign shipment ${existing.tracking_code} owned by ${shipmentHub || existing.origin_name}`
      );
      return {
        success: false,
        message: `Security Access Denied (403): You are only authorized to delete shipments dispatched from your own Supply Hub terminal.`,
      };
    }
  }

  // Optimistically remove from local memory store
  activeShipmentsMemory = activeShipmentsMemory.filter((s) => s.id !== shipmentId);
  broadcastCrossSessionEvent({ type: 'shipment_delete', payload: shipmentId });

  // Execute database deletion
  if (supabase) {
    try {
      const { error } = await supabase
        .from('shipments')
        .delete()
        .eq('id', shipmentId);

      if (error) {
        console.error('[SUPABASE DELETE SHIPMENT ERROR]:', error.message);
        return {
          success: false,
          message: `Database deletion failed: ${error.message}`,
        };
      }
      console.log('[SUPABASE DELETE SHIPMENT SUCCESS]:', shipmentId);
    } catch (err: any) {
      console.error('[SUPABASE DELETE SHIPMENT EXCEPTION]:', err);
      return {
        success: false,
        message: err?.message || 'Network error deleting shipment',
      };
    }
  }

  return {
    success: true,
    message: 'Convoy shipment decommissioned and removed successfully.',
  };
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

  broadcastCrossSessionEvent({
    type: 'shipment_telemetry',
    payload: { id: shipmentId, telemetry },
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

// ============================================================================
// Supabase Passwordless 6-Digit Email OTP Authentication Handlers
// ============================================================================

// Step 1: Send 6-Digit OTP
export async function sendUserOtp(email: string, userMetadata: Record<string, any> = {}) {
  const cleanEmail = email.trim().toLowerCase();

  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  const { data, error } = await supabase.auth.signInWithOtp({
    email: cleanEmail,
    options: {
      shouldCreateUser: true,
      data: userMetadata, // Pass role, full_name, hub_id, phone, etc.
      emailRedirectTo: undefined, // Disables confirmation URL mode
    },
  });

  if (error) {
    console.error('OTP Send Error:', error.message);
    throw error;
  }
  return data;
}

// Step 2: Verify 6-Digit Token
export async function verifyUserOtp(email: string, token: string) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanToken = token.trim();

  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email: cleanEmail,
    token: cleanToken,
    type: 'email',
  });

  if (error) {
    console.error('OTP Verification Error:', error.message);
    throw error;
  }
  return data; // contains session and user
}

// Query user profile by Primary Key (email)
export async function fetchProfileByEmail(email: string): Promise<Profile | null> {
  const cleanEmail = email.trim().toLowerCase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (!error && data) {
      return data as Profile;
    }
  } catch (err) {
    console.warn('fetchProfileByEmail notice:', err);
  }
  return null;
}

// Upsert user profile record into public.profiles
export async function upsertProfile(
  profile: Partial<Profile> & { email: string; user_id: string }
): Promise<Profile | null> {
  const cleanEmail = profile.email.trim().toLowerCase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          email: cleanEmail,
          user_id: profile.user_id,
          full_name: profile.full_name || null,
          phone: profile.phone || null,
          role: profile.role || 'CITIZEN_DRIVER',
          hub_id: profile.hub_id || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      )
      .select()
      .single();

    if (!error && data) {
      return data as Profile;
    }
  } catch (err) {
    console.warn('upsertProfile notice:', err);
  }
  return null;
}

// ============================================================================
// Realtime Universal Cross-Session & Cross-Tab Synchronization Engine
// ============================================================================
export type RealtimeSyncEvent =
  | { type: 'shipment_insert'; payload: Shipment }
  | { type: 'shipment_update'; payload: Shipment }
  | { type: 'shipment_delete'; payload: string }
  | { type: 'shipment_telemetry'; payload: { id: string; telemetry: any } }
  | { type: 'hazard_insert'; payload: RoadDisruption }
  | { type: 'hazard_update'; payload: RoadDisruption }
  | { type: 'hazard_delete'; payload: string }
  | { type: 'broadcast_insert'; payload: SystemBroadcast }
  | { type: 'broadcast_update'; payload: SystemBroadcast }
  | { type: 'broadcast_delete'; payload: string };

let crossTabChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    crossTabChannel = new BroadcastChannel('ner_logistics_realtime_sync');
  } catch (e) {
    crossTabChannel = null;
  }
}

export function broadcastCrossSessionEvent(event: RealtimeSyncEvent) {
  // 1. Cross-tab instant propagation (0ms)
  if (crossTabChannel) {
    try {
      crossTabChannel.postMessage(event);
    } catch (e) {}
  }

  // 2. Storage event fallback for cross-tab sync
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(
        'ner_logistics_sync_pulse',
        JSON.stringify({ event, timestamp: Date.now() })
      );
    } catch (e) {}
  }

  // 3. Supabase Realtime broadcast message over active websocket channel
  if (supabase) {
    try {
      const channel = supabase.channel('realtime-fleet-broadcast');
      channel.send({
        type: 'broadcast',
        event: event.type,
        payload: event.payload,
      });
    } catch (e) {}
  }
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
  const cleanupFns: Array<() => void> = [];

  // 1. Native Cross-Tab BroadcastChannel Listener
  if (crossTabChannel) {
    const handleBroadcastMsg = (ev: MessageEvent) => {
      const data = ev.data as RealtimeSyncEvent;
      if (!data) return;

      if (data.type === 'shipment_insert' || data.type === 'shipment_update') {
        onUpdate(data.payload);
      } else if (data.type === 'shipment_delete' && onDelete) {
        onDelete(data.payload);
      } else if (data.type === 'shipment_telemetry') {
        const existing = activeShipmentsMemory.find((s) => s.id === data.payload.id);
        if (existing) {
          onUpdate({
            ...existing,
            current_lat: data.payload.telemetry.current_lat,
            current_lng: data.payload.telemetry.current_lng,
            heading: data.payload.telemetry.heading ?? existing.heading,
            speed: data.payload.telemetry.speed ?? existing.speed,
          });
        }
      }
    };

    crossTabChannel.addEventListener('message', handleBroadcastMsg);
    cleanupFns.push(() => crossTabChannel?.removeEventListener('message', handleBroadcastMsg));
  }

  // 2. Storage event fallback listener
  if (typeof window !== 'undefined') {
    const handleStorageEvent = (ev: StorageEvent) => {
      if (ev.key === 'ner_logistics_sync_pulse' && ev.newValue) {
        try {
          const parsed = JSON.parse(ev.newValue);
          const data = parsed.event as RealtimeSyncEvent;
          if (data.type === 'shipment_insert' || data.type === 'shipment_update') {
            onUpdate(data.payload);
          } else if (data.type === 'shipment_delete' && onDelete) {
            onDelete(data.payload);
          }
        } catch (e) {}
      }
    };
    window.addEventListener('storage', handleStorageEvent);
    cleanupFns.push(() => window.removeEventListener('storage', handleStorageEvent));
  }

  // 3. Supabase Realtime postgres_changes + WebSocket Broadcast
  if (supabase) {
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
        .on('broadcast', { event: 'shipment_insert' }, (msg: any) => {
          if (msg.payload) onUpdate(normalizeShipment(msg.payload));
        })
        .on('broadcast', { event: 'shipment_update' }, (msg: any) => {
          if (msg.payload) onUpdate(normalizeShipment(msg.payload));
        })
        .on('broadcast', { event: 'shipment_delete' }, (msg: any) => {
          if (msg.payload && onDelete) onDelete(String(msg.payload));
        })
        .subscribe((status) => {
          console.log('[SUPABASE REALTIME SHIPMENTS CHANNEL SUBSCRIPTION STATUS]:', status);
        });

      cleanupFns.push(() => {
        supabase.removeChannel(channel);
      });
    } catch (err) {
      console.warn('Realtime all shipments subscription error:', err);
    }
  }

  return () => {
    cleanupFns.forEach((fn) => fn());
  };
}

// Supabase Realtime WebSocket subscription for hazards/disruptions
export function subscribeToAllHazardsRealtime(
  onInsert: (hazard: RoadDisruption) => void,
  onUpdate: (hazard: RoadDisruption) => void,
  onDelete: (id: string) => void
) {
  const cleanupFns: Array<() => void> = [];

  // 1. Native Cross-Tab BroadcastChannel Listener
  if (crossTabChannel) {
    const handleBroadcastMsg = (ev: MessageEvent) => {
      const data = ev.data as RealtimeSyncEvent;
      if (!data) return;

      if (data.type === 'hazard_insert') {
        onInsert(data.payload);
      } else if (data.type === 'hazard_update') {
        onUpdate(data.payload);
      } else if (data.type === 'hazard_delete') {
        onDelete(data.payload);
      }
    };

    crossTabChannel.addEventListener('message', handleBroadcastMsg);
    cleanupFns.push(() => crossTabChannel?.removeEventListener('message', handleBroadcastMsg));
  }

  // 2. Storage event fallback listener
  if (typeof window !== 'undefined') {
    const handleStorageEvent = (ev: StorageEvent) => {
      if (ev.key === 'ner_logistics_sync_pulse' && ev.newValue) {
        try {
          const parsed = JSON.parse(ev.newValue);
          const data = parsed.event as RealtimeSyncEvent;
          if (data.type === 'hazard_insert') {
            onInsert(data.payload);
          } else if (data.type === 'hazard_update') {
            onUpdate(data.payload);
          } else if (data.type === 'hazard_delete') {
            onDelete(data.payload);
          }
        } catch (e) {}
      }
    };
    window.addEventListener('storage', handleStorageEvent);
    cleanupFns.push(() => window.removeEventListener('storage', handleStorageEvent));
  }

  // 3. Supabase Realtime postgres_changes + WebSocket Broadcast
  if (supabase) {
    try {
      console.log('[SUPABASE REALTIME] Subscribing to public:road_disruptions & hazards broadcast channels...');
      const channel = supabase
        .channel('realtime-hazards-corridor')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'road_disruptions' },
          (payload: any) => {
            console.log('[SUPABASE REALTIME ROAD_DISRUPTIONS EVENT]:', payload.eventType, payload);
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
            console.log('[SUPABASE REALTIME HAZARDS EVENT]:', payload.eventType, payload);
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
        .on('broadcast', { event: 'hazard_insert' }, (msg: any) => {
          if (msg.payload) onInsert(msg.payload);
        })
        .on('broadcast', { event: 'hazard_update' }, (msg: any) => {
          if (msg.payload) onUpdate(msg.payload);
        })
        .on('broadcast', { event: 'hazard_delete' }, (msg: any) => {
          if (msg.payload) onDelete(String(msg.payload));
        })
        .subscribe((status) => {
          console.log('[SUPABASE REALTIME HAZARDS CHANNEL SUBSCRIPTION STATUS]:', status);
        });

      cleanupFns.push(() => {
        supabase.removeChannel(channel);
      });
    } catch (err) {
      console.warn('Realtime hazards subscription error:', err);
    }
  }

  return () => {
    cleanupFns.forEach((fn) => fn());
  };
}

// Supabase Realtime WebSocket subscription for emergency system broadcasts
export function subscribeToAllBroadcastsRealtime(
  onInsert: (broadcast: SystemBroadcast) => void,
  onUpdate: (broadcast: SystemBroadcast) => void,
  onDelete: (id: string) => void
) {
  const cleanupFns: Array<() => void> = [];

  // 1. Native Cross-Tab BroadcastChannel Listener (0ms instant cross-window sync)
  if (crossTabChannel) {
    const handleBroadcastMsg = (ev: MessageEvent) => {
      const data = ev.data as RealtimeSyncEvent;
      if (!data) return;

      if (data.type === 'broadcast_insert') {
        onInsert(data.payload);
      } else if (data.type === 'broadcast_update') {
        onUpdate(data.payload);
      } else if (data.type === 'broadcast_delete') {
        onDelete(data.payload);
      }
    };

    crossTabChannel.addEventListener('message', handleBroadcastMsg);
    cleanupFns.push(() => crossTabChannel?.removeEventListener('message', handleBroadcastMsg));
  }

  // 2. Storage event fallback listener
  if (typeof window !== 'undefined') {
    const handleStorageEvent = (ev: StorageEvent) => {
      if (ev.key === 'ner_logistics_sync_pulse' && ev.newValue) {
        try {
          const parsed = JSON.parse(ev.newValue);
          const data = parsed.event as RealtimeSyncEvent;
          if (data.type === 'broadcast_insert') {
            onInsert(data.payload);
          } else if (data.type === 'broadcast_update') {
            onUpdate(data.payload);
          } else if (data.type === 'broadcast_delete') {
            onDelete(data.payload);
          }
        } catch (e) {}
      }
    };
    window.addEventListener('storage', handleStorageEvent);
    cleanupFns.push(() => window.removeEventListener('storage', handleStorageEvent));
  }

  // 3. Supabase Realtime WebSocket postgres_changes + Broadcast channel
  if (supabase) {
    try {
      console.log('[SUPABASE REALTIME] Subscribing to public:system_broadcasts...');
      const channel = supabase
        .channel('realtime-system-broadcasts-channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'system_broadcasts' },
          (payload: any) => {
            console.log('[SUPABASE REALTIME SYSTEM_BROADCASTS EVENT]:', payload.eventType, payload);
            if (payload.eventType === 'INSERT' && payload.new) {
              onInsert(payload.new as SystemBroadcast);
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              if (payload.new.is_active === false) {
                onDelete(payload.new.id);
              } else {
                onUpdate(payload.new as SystemBroadcast);
              }
            } else if (payload.eventType === 'DELETE' && payload.old) {
              onDelete(payload.old.id);
            }
          }
        )
        .on('broadcast', { event: 'broadcast_insert' }, (msg: any) => {
          if (msg.payload) onInsert(msg.payload);
        })
        .on('broadcast', { event: 'broadcast_update' }, (msg: any) => {
          if (msg.payload) onUpdate(msg.payload);
        })
        .on('broadcast', { event: 'broadcast_delete' }, (msg: any) => {
          if (msg.payload && onDelete) onDelete(String(msg.payload));
        })
        .subscribe((status) => {
          console.log('[SUPABASE REALTIME SYSTEM_BROADCASTS CHANNEL STATUS]:', status);
        });

      cleanupFns.push(() => {
        supabase.removeChannel(channel);
      });
    } catch (err) {
      console.warn('Realtime system broadcasts subscription error:', err);
    }
  }

  return () => {
    cleanupFns.forEach((fn) => fn());
  };
}
