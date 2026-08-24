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
  // --- Assam (15 Hubs) ---
  {
    id: 'hub-01',
    name: 'Guwahati Multi-Modal Logistics Park',
    state: 'Assam',
    latitude: 26.1445,
    longitude: 91.7362,
    capacity_tonnes: 50000,
    contact_person: 'Ranjit Baruah',
    contact_phone: '+91 94350 11223',
    is_active: true,
  },
  {
    id: 'hub-02',
    name: 'Silchar Barak Valley Transshipment Hub',
    state: 'Assam',
    latitude: 24.8333,
    longitude: 92.7789,
    capacity_tonnes: 25000,
    contact_person: 'Debashish Nath',
    contact_phone: '+91 94350 22334',
    is_active: true,
  },
  {
    id: 'hub-03',
    name: 'Dibrugarh Upper Brahmaputra Terminal',
    state: 'Assam',
    latitude: 27.4728,
    longitude: 94.912,
    capacity_tonnes: 22000,
    contact_person: 'Pranab Saikia',
    contact_phone: '+91 94350 33445',
    is_active: true,
  },
  {
    id: 'hub-04',
    name: 'Jorhat Agro-Logistics Center',
    state: 'Assam',
    latitude: 26.7509,
    longitude: 94.2037,
    capacity_tonnes: 18000,
    contact_person: 'Manish Gogoi',
    contact_phone: '+91 94350 44556',
    is_active: true,
  },
  {
    id: 'hub-05',
    name: 'Tezpur Northern Bank Command Depot',
    state: 'Assam',
    latitude: 26.6528,
    longitude: 92.7926,
    capacity_tonnes: 20000,
    contact_person: 'Biren Kalita',
    contact_phone: '+91 94350 55667',
    is_active: true,
  },
  {
    id: 'hub-06',
    name: 'Nagaon Central Valley Depot',
    state: 'Assam',
    latitude: 26.3466,
    longitude: 92.684,
    capacity_tonnes: 16000,
    contact_person: 'Tarun Bora',
    contact_phone: '+91 94350 66778',
    is_active: true,
  },
  {
    id: 'hub-07',
    name: 'Tinsukia Industrial Railhead Hub',
    state: 'Assam',
    latitude: 27.5014,
    longitude: 95.3626,
    capacity_tonnes: 24000,
    contact_person: 'Ajit Sonowal',
    contact_phone: '+91 94350 77889',
    is_active: true,
  },
  {
    id: 'hub-08',
    name: 'Bongaigaon Lower Assam Depot',
    state: 'Assam',
    latitude: 26.5029,
    longitude: 90.5539,
    capacity_tonnes: 19000,
    contact_person: 'Hemanta Ray',
    contact_phone: '+91 94350 88990',
    is_active: true,
  },
  {
    id: 'hub-09',
    name: 'Dhubri Riverine Trade Terminal',
    state: 'Assam',
    latitude: 26.0207,
    longitude: 89.9744,
    capacity_tonnes: 14000,
    contact_person: 'Zahid Hussain',
    contact_phone: '+91 94350 99001',
    is_active: true,
  },
  {
    id: 'hub-10',
    name: 'Diphu Karbi Anglong Forward Depot',
    state: 'Assam',
    latitude: 25.8458,
    longitude: 93.4312,
    capacity_tonnes: 12000,
    contact_person: 'Longsing Teron',
    contact_phone: '+91 94351 10112',
    is_active: true,
  },
  {
    id: 'hub-11',
    name: 'North Lakhimpur Foothill Terminal',
    state: 'Assam',
    latitude: 27.2356,
    longitude: 94.1037,
    capacity_tonnes: 13500,
    contact_person: 'Kalyan Chutia',
    contact_phone: '+91 94351 21223',
    is_active: true,
  },
  {
    id: 'hub-12',
    name: 'Golaghat Dhansiri Logistics Center',
    state: 'Assam',
    latitude: 26.5167,
    longitude: 93.9667,
    capacity_tonnes: 11500,
    contact_person: 'Diganta Borah',
    contact_phone: '+91 94351 32334',
    is_active: true,
  },
  {
    id: 'hub-13',
    name: 'Sivasagar Heritage Grain Silo',
    state: 'Assam',
    latitude: 26.9826,
    longitude: 94.6425,
    capacity_tonnes: 15000,
    contact_person: 'Pallab Phukan',
    contact_phone: '+91 94351 43445',
    is_active: true,
  },
  {
    id: 'hub-14',
    name: 'Karimganj Border Customs Depot',
    state: 'Assam',
    latitude: 24.8667,
    longitude: 92.35,
    capacity_tonnes: 12500,
    contact_person: 'Pritam Choudhury',
    contact_phone: '+91 94351 54556',
    is_active: true,
  },
  {
    id: 'hub-15',
    name: 'Barpeta Western Buffer Depot',
    state: 'Assam',
    latitude: 26.3213,
    longitude: 91.0061,
    capacity_tonnes: 14500,
    contact_person: 'Bhaskar Medhi',
    contact_phone: '+91 94351 65667',
    is_active: true,
  },

  // --- Meghalaya (6 Hubs) ---
  {
    id: 'hub-16',
    name: 'Shillong Highland Strategic Terminal',
    state: 'Meghalaya',
    latitude: 25.5788,
    longitude: 91.8933,
    capacity_tonnes: 22000,
    contact_person: 'Banrap Marbaniang',
    contact_phone: '+91 98620 55667',
    is_active: true,
  },
  {
    id: 'hub-17',
    name: 'Tura Garo Hills Command Depot',
    state: 'Meghalaya',
    latitude: 25.5142,
    longitude: 90.2033,
    capacity_tonnes: 15000,
    contact_person: 'Sengbath Sangma',
    contact_phone: '+91 98621 11223',
    is_active: true,
  },
  {
    id: 'hub-18',
    name: 'Jowai Jaintia Hills Transit Depot',
    state: 'Meghalaya',
    latitude: 25.45,
    longitude: 92.2,
    capacity_tonnes: 13000,
    contact_person: 'Daphisha Kharbangar',
    contact_phone: '+91 98622 22334',
    is_active: true,
  },
  {
    id: 'hub-19',
    name: 'Nongpoh Ri-Bhoi Expressway Hub',
    state: 'Meghalaya',
    latitude: 25.9,
    longitude: 91.88,
    capacity_tonnes: 17500,
    contact_person: 'Pynshngain Lyngdoh',
    contact_phone: '+91 98623 33445',
    is_active: true,
  },
  {
    id: 'hub-20',
    name: 'Baghmara South Garo Forward Terminal',
    state: 'Meghalaya',
    latitude: 25.1956,
    longitude: 90.6389,
    capacity_tonnes: 9000,
    contact_person: 'Marcellus Marak',
    contact_phone: '+91 98624 44556',
    is_active: true,
  },
  {
    id: 'hub-21',
    name: 'Dawki International Land Port Hub',
    state: 'Meghalaya',
    latitude: 25.1833,
    longitude: 92.0167,
    capacity_tonnes: 11000,
    contact_person: 'Banteilang Swer',
    contact_phone: '+91 98625 55667',
    is_active: true,
  },

  // --- Arunachal Pradesh (7 Hubs) ---
  {
    id: 'hub-22',
    name: 'Itanagar Capital Complex Buffer Depot',
    state: 'Arunachal Pradesh',
    latitude: 27.0844,
    longitude: 93.6053,
    capacity_tonnes: 18000,
    contact_person: 'Takam Ringu',
    contact_phone: '+91 98680 21223',
    is_active: true,
  },
  {
    id: 'hub-23',
    name: 'Pasighat Siang Valley Transshipment Center',
    state: 'Arunachal Pradesh',
    latitude: 28.0667,
    longitude: 95.3333,
    capacity_tonnes: 14000,
    contact_person: 'Oken Tayeng',
    contact_phone: '+91 98681 32334',
    is_active: true,
  },
  {
    id: 'hub-24',
    name: 'Tawang High-Altitude Defense Depot',
    state: 'Arunachal Pradesh',
    latitude: 27.5861,
    longitude: 91.8594,
    capacity_tonnes: 9500,
    contact_person: 'Dorjee Khandu',
    contact_phone: '+91 98682 43445',
    is_active: true,
  },
  {
    id: 'hub-25',
    name: 'Ziro Lower Subansiri Valley Depot',
    state: 'Arunachal Pradesh',
    latitude: 27.5949,
    longitude: 93.8385,
    capacity_tonnes: 8500,
    contact_person: 'Tage Deka',
    contact_phone: '+91 98683 54556',
    is_active: true,
  },
  {
    id: 'hub-26',
    name: 'Tezu Lohit Forward Transit Hub',
    state: 'Arunachal Pradesh',
    latitude: 27.9167,
    longitude: 96.1667,
    capacity_tonnes: 11000,
    contact_person: 'Chow Mein',
    contact_phone: '+91 98684 65667',
    is_active: true,
  },
  {
    id: 'hub-27',
    name: 'Bomdila Western Pass Command Hub',
    state: 'Arunachal Pradesh',
    latitude: 27.2645,
    longitude: 92.4211,
    capacity_tonnes: 10500,
    contact_person: 'Norbu Thongdok',
    contact_phone: '+91 98685 76778',
    is_active: true,
  },
  {
    id: 'hub-28',
    name: 'Roing Dibang Valley Strategic Base',
    state: 'Arunachal Pradesh',
    latitude: 28.14,
    longitude: 95.83,
    capacity_tonnes: 9000,
    contact_person: 'Moji Riba',
    contact_phone: '+91 98686 87889',
    is_active: true,
  },

  // --- Nagaland (6 Hubs) ---
  {
    id: 'hub-29',
    name: 'Dimapur Strategic Railhead Terminal',
    state: 'Nagaland',
    latitude: 25.9068,
    longitude: 93.7271,
    capacity_tonnes: 35000,
    contact_person: 'Keviletuo Angami',
    contact_phone: '+91 98670 10112',
    is_active: true,
  },
  {
    id: 'hub-30',
    name: 'Kohima Hill Capital Transit Hub',
    state: 'Nagaland',
    latitude: 25.6751,
    longitude: 94.1086,
    capacity_tonnes: 16000,
    contact_person: 'Tepok Ao',
    contact_phone: '+91 98660 99001',
    is_active: true,
  },
  {
    id: 'hub-31',
    name: 'Mokokchung Central Highlands Depot',
    state: 'Nagaland',
    latitude: 26.3256,
    longitude: 94.52,
    capacity_tonnes: 12000,
    contact_person: 'Imti Longchar',
    contact_phone: '+91 98661 11223',
    is_active: true,
  },
  {
    id: 'hub-32',
    name: 'Tuensang Eastern Frontier Buffer Hub',
    state: 'Nagaland',
    latitude: 26.28,
    longitude: 94.83,
    capacity_tonnes: 9500,
    contact_person: 'Chuba Chang',
    contact_phone: '+91 98662 22334',
    is_active: true,
  },
  {
    id: 'hub-33',
    name: 'Wokha Lotha Range Logistics Center',
    state: 'Nagaland',
    latitude: 26.1,
    longitude: 94.26,
    capacity_tonnes: 10000,
    contact_person: 'Yilobemo Lotha',
    contact_phone: '+91 98663 33445',
    is_active: true,
  },
  {
    id: 'hub-34',
    name: 'Mon Konyak Hills Forward Center',
    state: 'Nagaland',
    latitude: 26.74,
    longitude: 95.06,
    capacity_tonnes: 8500,
    contact_person: 'Wangshu Konyak',
    contact_phone: '+91 98664 44556',
    is_active: true,
  },

  // --- Manipur (5 Hubs) ---
  {
    id: 'hub-35',
    name: 'Imphal Kangla Logistics Center',
    state: 'Manipur',
    latitude: 24.817,
    longitude: 93.9368,
    capacity_tonnes: 24000,
    contact_person: 'Ngangbam Singh',
    contact_phone: '+91 98630 66778',
    is_active: true,
  },
  {
    id: 'hub-36',
    name: 'Churachandpur Southern Foothill Depot',
    state: 'Manipur',
    latitude: 24.3333,
    longitude: 93.6833,
    capacity_tonnes: 13000,
    contact_person: 'Thangboi Haokip',
    contact_phone: '+91 98631 12233',
    is_active: true,
  },
  {
    id: 'hub-37',
    name: 'Senapati Northern Highway Transit Hub',
    state: 'Manipur',
    latitude: 25.263,
    longitude: 94.021,
    capacity_tonnes: 14500,
    contact_person: 'Kapuniba Poumai',
    contact_phone: '+91 98632 23344',
    is_active: true,
  },
  {
    id: 'hub-38',
    name: 'Thoubal Agro-Industrial Logistics Base',
    state: 'Manipur',
    latitude: 24.63,
    longitude: 94.01,
    capacity_tonnes: 12500,
    contact_person: 'Biren Meitei',
    contact_phone: '+91 98633 34455',
    is_active: true,
  },
  {
    id: 'hub-39',
    name: 'Moreh Asian Highway 1 Border Hub',
    state: 'Manipur',
    latitude: 24.24,
    longitude: 94.3,
    capacity_tonnes: 16000,
    contact_person: 'Lalminlen Mate',
    contact_phone: '+91 98634 45566',
    is_active: true,
  },

  // --- Mizoram (4 Hubs) ---
  {
    id: 'hub-40',
    name: 'Aizawl Ridge Multi-Tier Logistics Hub',
    state: 'Mizoram',
    latitude: 23.7271,
    longitude: 92.7176,
    capacity_tonnes: 20000,
    contact_person: 'Lalnunmawia Royte',
    contact_phone: '+91 98640 77889',
    is_active: true,
  },
  {
    id: 'hub-41',
    name: 'Lunglei Southern Mountain Terminal',
    state: 'Mizoram',
    latitude: 22.88,
    longitude: 92.73,
    capacity_tonnes: 11000,
    contact_person: 'Zoramthanga Sailo',
    contact_phone: '+91 98641 12345',
    is_active: true,
  },
  {
    id: 'hub-42',
    name: 'Champhai Zokhawthar Border Transit Depot',
    state: 'Mizoram',
    latitude: 23.47,
    longitude: 93.33,
    capacity_tonnes: 13500,
    contact_person: 'Lalthanzuala Chhangte',
    contact_phone: '+91 98642 23456',
    is_active: true,
  },
  {
    id: 'hub-43',
    name: 'Kolasib Northern Gateway Depot',
    state: 'Mizoram',
    latitude: 24.22,
    longitude: 92.68,
    capacity_tonnes: 12000,
    contact_person: 'C. Lalramzauva',
    contact_phone: '+91 98643 34567',
    is_active: true,
  },

  // --- Tripura (4 Hubs) ---
  {
    id: 'hub-44',
    name: 'Agartala Integrated Checkpost Terminal',
    state: 'Tripura',
    latitude: 23.8315,
    longitude: 91.2868,
    capacity_tonnes: 26000,
    contact_person: 'Subir Debbarma',
    contact_phone: '+91 98650 88990',
    is_active: true,
  },
  {
    id: 'hub-45',
    name: 'Dharmanagar Northern Rail Terminal',
    state: 'Tripura',
    latitude: 24.38,
    longitude: 92.17,
    capacity_tonnes: 15000,
    contact_person: 'Pranajit Singha',
    contact_phone: '+91 98651 12345',
    is_active: true,
  },
  {
    id: 'hub-46',
    name: 'Udaipur Gomati Valley Logistics Base',
    state: 'Tripura',
    latitude: 23.53,
    longitude: 91.48,
    capacity_tonnes: 13000,
    contact_person: 'Ashok Tripura',
    contact_phone: '+91 98652 23456',
    is_active: true,
  },
  {
    id: 'hub-47',
    name: 'Sabroom Feni Bridge Transshipment Hub',
    state: 'Tripura',
    latitude: 23.0,
    longitude: 91.7,
    capacity_tonnes: 18000,
    contact_person: 'Biplab Majumder',
    contact_phone: '+91 98653 34567',
    is_active: true,
  },

  // --- Sikkim (3 Hubs) ---
  {
    id: 'hub-48',
    name: 'Gangtok Himalayan Command Warehouse',
    state: 'Sikkim',
    latitude: 27.3389,
    longitude: 88.6065,
    capacity_tonnes: 15000,
    contact_person: 'Karma Bhutia',
    contact_phone: '+91 98690 32334',
    is_active: true,
  },
  {
    id: 'hub-49',
    name: 'Rangpo Teesta Valley Entry Terminal',
    state: 'Sikkim',
    latitude: 27.18,
    longitude: 88.53,
    capacity_tonnes: 12500,
    contact_person: 'Pempa Lepcha',
    contact_phone: '+91 98691 12345',
    is_active: true,
  },
  {
    id: 'hub-50',
    name: 'Namchi South Sikkim Highland Depot',
    state: 'Sikkim',
    latitude: 27.17,
    longitude: 88.35,
    capacity_tonnes: 10000,
    contact_person: 'Tshering Dorjee',
    contact_phone: '+91 98692 23456',
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
