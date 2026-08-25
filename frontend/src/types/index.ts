export type UserRole =
  | 'CITIZEN_DRIVER'
  | 'SUPPLY_HUB'
  | 'GOV_AUTHORITY'
  | 'public_user'
  | 'citizen'
  | 'driver'
  | 'gov_official'
  | 'hub_operator';

export interface Profile {
  email: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  hub_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ClientUser {
  id: string;
  citizen_uid: string;
  full_name: string;
  email: string;
  phone?: string;
  current_lat?: number;
  current_lng?: number;
  is_sharing_location?: boolean;
  last_location_update?: string;
  created_at?: string;
}

export interface GovernmentOfficial {
  id: string;
  official_id: string;
  agency_name: string;
  full_name: string;
  email: string;
  phone?: string;
  created_at?: string;
}

export interface SupplyHubTerminal {
  id: string;
  hub_code: string;
  hub_name: string;
  state: string;
  email: string;
  created_at?: string;
}

export interface LiveJourney {
  id: string;
  client_id?: string;
  citizen_uid: string;
  driver_name: string;
  origin_hub?: string;
  destination_hub?: string;
  current_lat: number;
  current_lng: number;
  heading?: number;
  speed_kmh?: number;
  is_active: boolean;
  shared_with?: 'GOVERNMENT' | 'SUPPLY_HUB' | 'ALL' | string;
  updated_at?: string;
}

export interface TrackedCitizenTelemetry {
  id: string;
  citizen_uid: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  role?: string;
  is_sharing_location: boolean;
  current_lat: number;
  current_lng: number;
  speed_kmh: number;
  heading: number;
  origin_hub?: string | null;
  destination_hub?: string | null;
  is_active_journey?: boolean;
  last_location_update?: string;
}

export type BroadcastSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'EMERGENCY';

export interface SystemBroadcast {
  id: string;
  issued_by_name: string;
  agency: string;
  severity: BroadcastSeverity;
  title: string;
  message: string;
  affected_region?: string;
  is_active: boolean;
  created_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  phone?: string;
  full_name: string;
  role: UserRole;
  citizen_uid?: string;
  official_id?: string;
  hub_code?: string;
  hub_name?: string;
  terminal_id?: string;
  agency_name?: string;
  state?: string;
  state_jurisdiction?: string;
  current_lat?: number;
  current_lng?: number;
  is_verified: boolean;
  is_sharing_location?: boolean;
  created_at?: string;
}

export interface AuthSession {
  user: UserProfile;
  token: string;
  expiresAt: number;
}

export interface SupplyHub {
  id?: string;
  name: string; // PRIMARY KEY
  state: string;
  district?: string;
  latitude: number;
  longitude: number;
  capacity_tons?: number;
  capacity_tonnes?: number;
  current_load_tons?: number;
  status?: 'OPERATIONAL' | 'CRITICAL' | 'MAINTENANCE' | string;
  contact_number?: string;
  contact_person?: string;
  contact_phone?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type DisruptionType = 'LANDSLIDE' | 'FLASH_FLOOD' | 'ROAD_BLOCK' | 'BRIDGE_DAMAGE';
export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RoadDisruption {
  id: string;
  created_by?: string;
  government_body_name?: string;
  title: string;
  disruption_type: DisruptionType | string;
  hazard_type?: string;
  severity: SeverityLevel;
  latitude: number;
  longitude: number;
  risk_radius_meters: number;
  radius_meters?: number;
  message?: string;
  advisory_message?: string;
  highway_reference?: string;
  description?: string;
  is_active: boolean;
  is_simulated?: boolean;
  reported_by_agency?: string;
  verified_by_official?: string;
  created_at?: string;
  resolved_at?: string;
}

export interface DisruptionChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  citations?: string[];
  active_hazards_count?: number;
}

export interface DisruptionChatResponse {
  status: string;
  reply: string;
  citations: string[];
  active_hazards_count: number;
  error?: string;
}

export interface GovDisruptionRecord {
  id?: string;
  government_body: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | string;
  highway?: string;
  message: string;
  coordinates: [number, number];
  distance_to_route_km: number;
}

export interface GovernmentAuthorizedData {
  has_disruptions: boolean;
  records: GovDisruptionRecord[];
  official_summary: string;
}

export interface InternetLiveIntelligence {
  has_weather_warnings: boolean;
  sources: string[];
  weather_advisory: string;
  live_traffic_status: string;
  web_summary: string;
}

export interface DualStreamCorridorResponse {
  status: string;
  origin_name?: string;
  destination_name?: string;
  government_authorized_data: GovernmentAuthorizedData;
  internet_live_intelligence: InternetLiveIntelligence;
  error?: string;
}

export interface CompromisedHazard {
  disruption: RoadDisruption;
  distance_to_route_km: number;
  is_direct_blockage: boolean;
  intersection_points?: [number, number][]; // [lon, lat]
}

export type CargoTier = 'TIER_1_CRITICAL' | 'TIER_2_ESSENTIAL' | 'TIER_3_BULK';

export interface CargoManifest {
  tier: CargoTier;
  label: string;
  description?: string;
  weightTonnes?: number;
  weight_tonnes?: number;
  urgency_score?: number; // 0 to 100
  urgencyScore?: number;
  allowed_delay_buffer_hours?: number;
  allowedDelayBufferHours?: number;
  priority_color?: string;
  priorityColor?: string;
  mountainDelayFactor?: number;
  mountain_delay_factor?: number;
  strictBypass?: boolean;
  strict_bypass?: boolean;
  typical_items?: string[];
  typicalItems?: string[];
}

export interface TransitTelemetry {
  tier: CargoTier;
  tier_label?: string;
  tierLabel?: string;
  urgency_score?: number;
  urgencyScore?: number;
  baseline_eta_hours?: number;
  baselineEtaHours?: number;
  safe_arrival_eta_hours?: number;
  safeArrivalEtaHours?: number;
  mountain_terrain_delay_hours?: number;
  mountainTerrainDelayHours?: number;
  safe_arrival_timestamp?: string;
  safeArrivalTimestamp?: string;
  elevation_gain_est_meters?: number;
  elevationGainEstMeters?: number;
  delay_buffer_status?: 'WITHIN_SAFETY_WINDOW' | 'BUFFER_EXCEEDED';
  delayBufferStatus?: 'WITHIN_SAFETY_WINDOW' | 'BUFFER_EXCEEDED';
}

export interface HubRecommendation {
  hub: SupplyHub;
  distance_to_destination_km?: number;
  straight_line_km?: number;
  straightDistanceKm?: number;
  road_distance_km?: number;
  estimatedRoadDistanceKm?: number;
  estimatedDurationMin?: number;
  terrain_clearance_score?: number; // 0-100%
  stock_capacity_tonnes?: number;
  availableCapacityTonnes?: number;
  is_recommended?: boolean;
  isCorridorClear?: boolean;
  active_hazards_nearby?: number;
  reason?: string;
  rankScore?: number;
}

export interface RouteGeometry {
  coordinates: [number, number][]; // [lon, lat]
  type: 'LineString' | string;
}

export interface RouteStep {
  name: string;
  instruction?: string;
  distance_meters?: number;
  duration_seconds?: number;
  mode?: string;
  distance?: number;
  duration?: number;
  geometry?: RouteGeometry;
}

export interface RouteCalculationResult {
  status?: string;
  distance_km: number;
  duration_minutes: number;
  geometry: RouteGeometry;
  steps?: RouteStep[];
  origin?: { latitude: number; longitude: number };
  destination?: { latitude: number; longitude: number };
  summary?: string;
  is_fallback?: boolean;
  is_detour?: boolean;
  bypass_waypoint?: { latitude: number; longitude: number };
  bypass_waypoints?: [number, number][];
  message?: string;
  error?: string;
}

export interface AIRiskAssessment {
  risk_level?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  summary?: string;
  hazards_detected?: string[];
  gemini_recommendation?: string;
  confidence_score?: number;
  ai_model?: string;
  evaluated_at?: string;
}

export interface AIRouteRiskResponse {
  success?: boolean;
  origin_name?: string;
  destination_name?: string;
  urgency_tier?: string;
  ai_risk_assessment?: AIRiskAssessment | string;
  route_geometry: RouteGeometry;
  distance_km: number;
  duration_hrs: number;
  rerouted: boolean;
  hazard_severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  eta_safe?: string;
  corridor_status?: 'CLEAR' | 'HAZARD_AVOIDED' | 'CRITICAL_BLOCK' | string;
  error?: string;
}

export interface PerRouteAIEvaluation {
  route_id: number;
  route_title: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  risk_score: number;
  hazards_detected: string[];
  recommended: boolean;
  ai_brief: string;
}

export interface CandidateCorridor {
  id: string;
  route_index: number;
  route_id?: number;
  name?: string;
  title: string;
  distance_km: number;
  duration_minutes: number;
  geometry: RouteGeometry;
  steps: RouteStep[];
  waypoints?: [number, number][];
  summary: string;
  is_compromised: boolean;
  is_recommended?: boolean;
  intersected_hazards?: any[];
  ai_evaluation?: PerRouteAIEvaluation | null;
  via_highway?: string;
  color?: string;
}

export interface DisasterResilientRouteResponse {
  isCompromised: boolean;
  primaryRoute: RouteCalculationResult;
  alternativeRoute?: RouteCalculationResult | null;
  candidateRoutes?: CandidateCorridor[];
  routesList?: CandidateCorridor[];
  selectedRouteIndex?: number;
  aiEvaluations?: PerRouteAIEvaluation[];
  compromisedHazards?: CompromisedHazard[];
  intersectedHazards?: any[];
  bypassWaypoint?: { latitude: number; longitude: number } | null;
  bypassWaypoints?: [number, number][]; // [lon, lat]
  hazardBuffersGeoJSON?: any;
  recommendation?: 'ACTIVATE_DETOUR' | 'PROCEED_PRIMARY' | string;
  telemetry?: TransitTelemetry;
  aiRiskData?: AIRouteRiskResponse | null;
  dualStreamIntelligence?: DualStreamCorridorResponse | null;
}

export interface SimulatedHazardInput {
  title: string;
  disruption_type: DisruptionType | string;
  severity: SeverityLevel;
  latitude: number;
  longitude: number;
  risk_radius_meters: number;
  message?: string;
  highway_reference?: string;
  description?: string;
  reported_by_agency?: string;
  verified_by_official?: string;
  government_body_name?: string;
  created_by?: string;
}

export type CargoType = 'MEDICINE' | 'PERISHABLE_FOOD' | 'FUEL' | 'GENERAL';

export type ShipmentStatus = 'QUEUED' | 'IN_TRANSIT' | 'REROUTED' | 'DELIVERED' | 'DISRUPTED' | 'DELAYED';

export interface Shipment {
  id: string;
  tracking_code: string;
  driver_id?: string;
  driver_name?: string;
  cargo_type: CargoType;
  cargo_manifest?: string;
  cargo_tier?: CargoTier;
  priority_level: number;
  origin_hub_id?: string;
  destination_hub_id?: string;
  origin_name?: string;
  destination_name?: string;
  origin?: { name: string; latitude: number; longitude: number } | string;
  destination?: { name: string; latitude: number; longitude: number } | string;
  current_status: ShipmentStatus;
  status?: ShipmentStatus | string;
  current_lat?: number;
  current_lng?: number;
  heading?: number;
  speed?: number;
  speed_kmh?: number;
  weight_tonnes: number;
  threat_score?: number;
  dispatched_by_hub_id?: string;
  hub_id?: string;
  hub_code?: string;
  created_by?: string;
  notes?: string;
  created_at?: string;
  last_ping_at?: string;
  updated_at?: string;
}

export interface RegisterShipmentInput {
  driver_name: string;
  driver_id: string;
  origin_hub_id: string;
  origin_name: string;
  origin_lat?: number;
  origin_lng?: number;
  destination_hub_id: string;
  destination_name: string;
  destination_lat?: number;
  destination_lng?: number;
  cargo_type: CargoType;
  cargo_tier: CargoTier;
  cargo_manifest: string;
  weight_tonnes: number;
  priority_level?: number;
  notes?: string;
}
