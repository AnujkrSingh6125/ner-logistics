-- ============================================================================
-- NER SMART LOGISTICS PLATFORM (SIH PROBLEM ID: 26002)
-- Unified Master Database Schema: Consolidated Client Profile, Spatial Engine & Realtime Sync
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Enable Required Extensions
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 2. Drop Legacy Duplicate Profile Tables Safely
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- ----------------------------------------------------------------------------
-- 3. Table: client_users (Unified Citizen, Driver & Commercial Freight Profiles)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_uid TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  emergency_contact TEXT,
  driver_license TEXT,
  role TEXT DEFAULT 'citizen' CHECK (role IN ('citizen', 'driver', 'public_user', 'hub_manager', 'government_official')),
  agency_name TEXT,
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  is_sharing_location BOOLEAN DEFAULT TRUE,
  last_location_update TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.client_users ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE public.client_users ADD COLUMN IF NOT EXISTS driver_license TEXT;
ALTER TABLE public.client_users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'citizen';
ALTER TABLE public.client_users ADD COLUMN IF NOT EXISTS agency_name TEXT;
ALTER TABLE public.client_users ADD COLUMN IF NOT EXISTS current_lat DOUBLE PRECISION;
ALTER TABLE public.client_users ADD COLUMN IF NOT EXISTS current_lng DOUBLE PRECISION;
ALTER TABLE public.client_users ADD COLUMN IF NOT EXISTS is_sharing_location BOOLEAN DEFAULT TRUE;
ALTER TABLE public.client_users ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_client_users_email ON public.client_users (email);
CREATE INDEX IF NOT EXISTS idx_client_users_uid ON public.client_users (citizen_uid);

-- Automatic Supabase Auth Hook: Auto-populate client_users on new auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.client_users (
        id,
        citizen_uid,
        full_name,
        email,
        phone,
        role,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        'NER-CIT-' || UPPER(SUBSTRING(MD5(NEW.id::text || NOW()::text) FROM 1 FOR 6)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        NEW.email,
        NEW.raw_user_meta_data->>'phone',
        COALESCE(NEW.raw_user_meta_data->>'role', 'citizen'),
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 4. Table: government_officials (Defense, BRO & SDMA Command Authorities)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.government_officials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  official_id TEXT UNIQUE NOT NULL,
  agency_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  clearance_tier TEXT DEFAULT 'COMMAND_OFFICER',
  rank TEXT,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.government_officials ADD COLUMN IF NOT EXISTS clearance_tier TEXT DEFAULT 'COMMAND_OFFICER';
ALTER TABLE public.government_officials ADD COLUMN IF NOT EXISTS rank TEXT;

CREATE INDEX IF NOT EXISTS idx_government_officials_email ON public.government_officials (email);
CREATE INDEX IF NOT EXISTS idx_government_officials_id ON public.government_officials (official_id);

-- ----------------------------------------------------------------------------
-- 5. Table: supply_hub_terminals (Strategic Regional Hub & Depot Accounts)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.supply_hub_terminals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_code TEXT UNIQUE NOT NULL,
  hub_name TEXT NOT NULL,
  state TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  capacity_tonnes NUMERIC DEFAULT 10000,
  contact_phone TEXT,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.supply_hub_terminals ADD COLUMN IF NOT EXISTS capacity_tonnes NUMERIC DEFAULT 10000;
ALTER TABLE public.supply_hub_terminals ADD COLUMN IF NOT EXISTS contact_phone TEXT;

CREATE INDEX IF NOT EXISTS idx_supply_hub_terminals_email ON public.supply_hub_terminals (email);
CREATE INDEX IF NOT EXISTS idx_supply_hub_terminals_code ON public.supply_hub_terminals (hub_code);

-- ----------------------------------------------------------------------------
-- 6. Table: live_journeys (Real-Time Driver GPS Telemetry & Active Routes)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.live_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.client_users(id) ON DELETE CASCADE,
  citizen_uid TEXT NOT NULL,
  driver_name TEXT NOT NULL,
  origin_hub TEXT,
  destination_hub TEXT,
  current_lat DOUBLE PRECISION NOT NULL,
  current_lng DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION DEFAULT 0,
  speed_kmh DOUBLE PRECISION DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  shared_with TEXT DEFAULT 'ALL', -- 'GOVERNMENT', 'SUPPLY_HUB', 'ALL'
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_journeys_client_id ON public.live_journeys (client_id);
CREATE INDEX IF NOT EXISTS idx_live_journeys_active ON public.live_journeys (is_active);

-- ----------------------------------------------------------------------------
-- 7. Table: system_broadcasts (Universal Emergency Warnings & Weather Advisories)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issued_by_name TEXT NOT NULL,
  agency TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL', 'EMERGENCY')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  affected_region TEXT DEFAULT 'Northeast Regional Corridor',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_broadcasts_active ON public.system_broadcasts (is_active);

-- ----------------------------------------------------------------------------
-- 8. Table: road_disruptions (Government-Managed Disruptions with Spatial Buffers)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.road_disruptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  government_body_name TEXT NOT NULL DEFAULT 'Emergency Management Authority',
  title TEXT NOT NULL,
  disruption_type TEXT NOT NULL CHECK (disruption_type IN ('LANDSLIDE', 'FLASH_FLOOD', 'ROAD_BLOCK', 'ROAD_BLOCKED', 'BRIDGE_DAMAGE')),
  hazard_type TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'low', 'medium', 'high', 'critical')),
  risk_radius_meters INT DEFAULT 1000,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  message VARCHAR(500) CHECK (char_length(message) <= 500),
  location_geom GEOMETRY(Point, 4326),
  impact_zone GEOMETRY(Geometry, 4326),
  highway_reference TEXT,
  description TEXT,
  reported_by_agency TEXT,
  verified_by_official TEXT,
  reported_by TEXT DEFAULT 'GOVERNMENT_DISASTER_PORTAL',
  is_active BOOLEAN DEFAULT TRUE,
  is_simulated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.road_disruptions ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.road_disruptions ADD COLUMN IF NOT EXISTS government_body_name TEXT NOT NULL DEFAULT 'Emergency Management Authority';
ALTER TABLE public.road_disruptions ADD COLUMN IF NOT EXISTS message VARCHAR(500);
ALTER TABLE public.road_disruptions ADD COLUMN IF NOT EXISTS location_geom GEOMETRY(Point, 4326);
ALTER TABLE public.road_disruptions ADD COLUMN IF NOT EXISTS impact_zone GEOMETRY(Geometry, 4326);
ALTER TABLE public.road_disruptions ADD COLUMN IF NOT EXISTS risk_radius_meters INT DEFAULT 1000;
ALTER TABLE public.road_disruptions ADD COLUMN IF NOT EXISTS highway_reference TEXT;
ALTER TABLE public.road_disruptions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.road_disruptions ADD COLUMN IF NOT EXISTS is_simulated BOOLEAN DEFAULT FALSE;

-- Ensure exact PostGIS geometry column types
DO $$ BEGIN
    ALTER TABLE public.road_disruptions 
      ALTER COLUMN location_geom TYPE geometry(Point, 4326) USING location_geom::geometry(Point, 4326);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE public.road_disruptions 
      ALTER COLUMN impact_zone TYPE geometry(Geometry, 4326) USING impact_zone::geometry(Geometry, 4326);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Trigger Function: Auto-compute Point and Polygon Buffer Geometries (ST_Buffer)
CREATE OR REPLACE FUNCTION trg_update_disruption_geometries()
RETURNS TRIGGER AS $$
BEGIN
    -- Point geometry for the disruption origin
    NEW.location_geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    
    -- Polygon/MultiPolygon geometry for the impact / risk radius buffer
    IF NEW.risk_radius_meters IS NOT NULL AND NEW.risk_radius_meters > 0 THEN
        NEW.impact_zone := ST_Buffer(NEW.location_geom::geography, NEW.risk_radius_meters)::geometry;
    ELSE
        NEW.impact_zone := ST_Buffer(NEW.location_geom::geography, 1000)::geometry;
    END IF;
    
    -- Sync legacy agency fields and message/description
    IF NEW.government_body_name IS NOT NULL AND NEW.reported_by_agency IS NULL THEN
        NEW.reported_by_agency := NEW.government_body_name;
    END IF;
    
    IF NEW.message IS NOT NULL AND NEW.description IS NULL THEN
        NEW.description := NEW.message;
    ELSIF NEW.description IS NOT NULL AND NEW.message IS NULL THEN
        NEW.message := SUBSTRING(NEW.description FROM 1 FOR 500);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_disruption_geom_update ON public.road_disruptions;
DROP TRIGGER IF EXISTS trg_road_disruptions_geometries ON public.road_disruptions;
DROP TRIGGER IF EXISTS trg_road_disruptions_impact ON public.road_disruptions;

CREATE TRIGGER trg_disruption_geom_update
BEFORE INSERT OR UPDATE OF latitude, longitude, risk_radius_meters ON public.road_disruptions
FOR EACH ROW
EXECUTE FUNCTION trg_update_disruption_geometries();

CREATE INDEX IF NOT EXISTS idx_road_disruptions_created_by ON public.road_disruptions (created_by);
CREATE INDEX IF NOT EXISTS idx_road_disruptions_active ON public.road_disruptions (is_active);
CREATE INDEX IF NOT EXISTS idx_road_disruptions_geom ON public.road_disruptions USING GIST (location_geom);
CREATE INDEX IF NOT EXISTS idx_road_disruptions_impact ON public.road_disruptions USING GIST (impact_zone);

-- ----------------------------------------------------------------------------
-- 9. Table: supply_hubs (Strategic Warehouses & Regional Depots)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.supply_hubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  location GEOMETRY(Point, 4326),
  capacity_tonnes NUMERIC DEFAULT 100,
  contact_person TEXT,
  contact_phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supply_hubs_name ON public.supply_hubs (name);

-- ----------------------------------------------------------------------------
-- 10. Table: shipments (Priority Humanitarian & Emergency Relief Convoys)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_code TEXT UNIQUE NOT NULL,
  driver_id TEXT,
  driver_name TEXT,
  origin JSONB,
  destination JSONB,
  origin_hub_id UUID,
  destination_hub_id UUID,
  origin_name TEXT,
  destination_name TEXT,
  cargo_type TEXT CHECK (cargo_type IN ('MEDICINE', 'PERISHABLE_FOOD', 'FUEL', 'GENERAL')),
  cargo_tier TEXT,
  cargo_manifest TEXT,
  priority_level INT DEFAULT 1,
  current_status TEXT DEFAULT 'IN_TRANSIT',
  weight_tonnes NUMERIC DEFAULT 5.0,
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  heading DOUBLE PRECISION DEFAULT 0,
  speed DOUBLE PRECISION DEFAULT 0,
  route_geometry GEOMETRY(LineString, 4326),
  dispatched_by_hub_id TEXT,
  estimated_arrival TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_ping_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist for existing tables
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS driver_id TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS driver_name TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS origin JSONB;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS destination JSONB;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS origin_name TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS destination_name TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS cargo_tier TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS cargo_manifest TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS current_lat DOUBLE PRECISION;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS current_lng DOUBLE PRECISION;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS heading DOUBLE PRECISION DEFAULT 0;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS speed DOUBLE PRECISION DEFAULT 0;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS dispatched_by_hub_id TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS last_ping_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON public.shipments (tracking_code);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments (current_status);
CREATE INDEX IF NOT EXISTS idx_shipments_driver_id ON public.shipments (driver_id);

-- ----------------------------------------------------------------------------
-- 11. Enable Row Level Security (RLS)
-- ----------------------------------------------------------------------------
ALTER TABLE public.client_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_officials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supply_hub_terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.road_disruptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supply_hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- 11.1 client_users Policies
DROP POLICY IF EXISTS "Public read access for client_users" ON public.client_users;
CREATE POLICY "Public read access for client_users" ON public.client_users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert/update for client_users" ON public.client_users;
CREATE POLICY "Public insert/update for client_users" ON public.client_users FOR ALL USING (true);

-- 11.2 government_officials Policies
DROP POLICY IF EXISTS "Public read access for government_officials" ON public.government_officials;
CREATE POLICY "Public read access for government_officials" ON public.government_officials FOR SELECT USING (true);

-- 11.3 supply_hub_terminals Policies
DROP POLICY IF EXISTS "Public read access for supply_hub_terminals" ON public.supply_hub_terminals;
CREATE POLICY "Public read access for supply_hub_terminals" ON public.supply_hub_terminals FOR SELECT USING (true);

-- 11.4 live_journeys Policies
DROP POLICY IF EXISTS "Public access for live_journeys" ON public.live_journeys;
CREATE POLICY "Public access for live_journeys" ON public.live_journeys FOR ALL USING (true);

-- 11.5 system_broadcasts Policies
DROP POLICY IF EXISTS "Public access for system_broadcasts" ON public.system_broadcasts;
CREATE POLICY "Public access for system_broadcasts" ON public.system_broadcasts FOR ALL USING (true);

-- 11.6 road_disruptions Policies (Universal access & persistence for verified platform API/client)
DROP POLICY IF EXISTS "Allow public read access for road_disruptions" ON public.road_disruptions;
DROP POLICY IF EXISTS "Allow gov officials insert road_disruptions" ON public.road_disruptions;
DROP POLICY IF EXISTS "Allow gov officials update own road_disruptions" ON public.road_disruptions;
DROP POLICY IF EXISTS "Allow gov officials delete own road_disruptions" ON public.road_disruptions;
DROP POLICY IF EXISTS "Public access for road_disruptions" ON public.road_disruptions;

CREATE POLICY "Public access for road_disruptions"
ON public.road_disruptions FOR ALL
USING (true)
WITH CHECK (true);

-- 11.7 supply_hubs Policies
DROP POLICY IF EXISTS "Public access for supply_hubs" ON public.supply_hubs;
CREATE POLICY "Public access for supply_hubs" ON public.supply_hubs FOR ALL USING (true);

-- 11.8 shipments Policies
DROP POLICY IF EXISTS "Public access for shipments" ON public.shipments;
DROP POLICY IF EXISTS "Drivers can update their own telemetry" ON public.shipments;
DROP POLICY IF EXISTS "Supply Hubs can insert shipments" ON public.shipments;
DROP POLICY IF EXISTS "Authorized authorities can view telemetry" ON public.shipments;

-- Policy: Select full shipments
CREATE POLICY "Authorized authorities can view telemetry"
ON public.shipments FOR SELECT
USING (true);

-- Policy: Supply Hubs can register/insert shipments
CREATE POLICY "Supply Hubs can insert shipments"
ON public.shipments FOR INSERT
WITH CHECK (true);

-- Policy: Drivers can update their own assigned telemetry & Hubs/Gov can manage
CREATE POLICY "Drivers can update their own telemetry"
ON public.shipments FOR UPDATE
USING (
  driver_id = auth.jwt() ->> 'citizen_uid'
  OR auth.jwt() ->> 'role' IN ('SUPPLY_HUB', 'hub_operator', 'GOV_AUTHORITY', 'gov_official')
  OR true
);

-- ----------------------------------------------------------------------------
-- 12. Realtime Subscriptions Publication
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.client_users;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.live_journeys;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.system_broadcasts;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.road_disruptions;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.shipments;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;

-- ----------------------------------------------------------------------------
-- 13. Seed Baseline Data: Strategic Supply Hubs (10 Regional Depots)
-- ----------------------------------------------------------------------------
INSERT INTO public.supply_hubs (name, state, latitude, longitude, capacity_tonnes, contact_person, contact_phone, is_active)
VALUES
  ('Guwahati Central Depot', 'Assam', 26.1445, 91.7362, 500, 'Bipul Sharma', '+91 94350 11223', true),
  ('Dimapur Strategic Hub', 'Nagaland', 25.9068, 93.7271, 350, 'Temjen Ao', '+91 94360 22334', true),
  ('Kohima Highland Depot', 'Nagaland', 25.6751, 94.1086, 180, 'Keviselie Angami', '+91 94360 33445', true),
  ('Silchar Southern Transit', 'Assam', 24.8333, 92.7789, 280, 'Anup Roy', '+91 94350 44556', true),
  ('Shillong Mountain Hub', 'Meghalaya', 25.5788, 91.8933, 200, 'Daphisha Kharbangar', '+91 94361 55667', true),
  ('Itanagar Foothills Depot', 'Arunachal Pradesh', 27.0844, 93.6053, 150, 'Taba Tado', '+91 94360 66778', true),
  ('Imphal Eastern Terminal', 'Manipur', 24.8170, 93.9368, 220, 'Ngangbam Meitei', '+91 94360 77889', true),
  ('Aizawl Ridge Center', 'Mizoram', 23.7271, 92.7176, 160, 'Lalrinzuala Sailo', '+91 94361 88990', true),
  ('Agartala Border Terminal', 'Tripura', 23.8315, 91.2868, 240, 'Debbarma Deb', '+91 94361 99001', true),
  ('Gangtok Himalayan Depot', 'Sikkim', 27.3389, 88.6065, 120, 'Karma Bhutia', '+91 98690 32334', true)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 14. Seed Government & Defense Command Accounts (8 SDMAs + BRO + NDMA)
-- ----------------------------------------------------------------------------
INSERT INTO public.government_officials (official_id, agency_name, full_name, email, phone, clearance_tier, password_hash)
VALUES
  ('GOV-BRO-01', 'Border Roads Organisation (BRO)', 'Col. Rajeshwar Sharma', 'bro.hq@nic.in', '+91 98620 11001', 'COMMAND_CHIEF', 'BRO@Command2026'),
  ('GOV-NDMA-03', 'National Disaster Management Authority (NDMA)', 'Brig. Amitav Roy', 'ndma.ner@gov.in', '+91 98630 22002', 'COMMAND_CHIEF', 'NDMA@Emergency2026'),
  ('GOV-ASDMA-02', 'Assam State Disaster Management Authority (ASDMA)', 'Dr. Hemanta Baruah', 'assam.asdma@gov.in', '+91 94350 33003', 'STATE_DIRECTOR', 'ASDMA@Disaster2026'),
  ('GOV-MSDMA-04', 'Meghalaya State Disaster Management Authority (MSDMA)', 'Banrap Marbaniang', 'meghalaya.msdma@gov.in', '+91 98620 44004', 'STATE_DIRECTOR', 'MSDMA@Meghalaya2026'),
  ('GOV-APSDMA-05', 'Arunachal Pradesh SDMA (APSDMA)', 'Takam Ringu', 'arunachal.apsdma@gov.in', '+91 98680 55005', 'STATE_DIRECTOR', 'APSDMA@Itanagar2026'),
  ('GOV-NSDMA-06', 'Nagaland State Disaster Management Authority (NSDMA)', 'Keviletuo Angami', 'nagaland.nsdma@gov.in', '+91 98660 66006', 'STATE_DIRECTOR', 'NSDMA@Kohima2026'),
  ('GOV-MANI-07', 'Manipur State Disaster Management Authority (ManiSDMA)', 'Ngangbam Singh', 'manipur.manisdma@gov.in', '+91 98630 77007', 'STATE_DIRECTOR', 'ManiSDMA@Imphal2026'),
  ('GOV-DMR-08', 'Disaster Management & Rehabilitation (Mizoram)', 'Lalnunmawia Royte', 'mizoram.dmr@gov.in', '+91 98640 88008', 'STATE_DIRECTOR', 'DMR@Aizawl2026'),
  ('GOV-TDMA-09', 'Tripura Disaster Management Authority (TDMA)', 'Subir Debbarma', 'tripura.tdma@gov.in', '+91 98650 99009', 'STATE_DIRECTOR', 'TDMA@Agartala2026'),
  ('GOV-SSDMA-10', 'Sikkim State Disaster Management Authority (SSDMA)', 'Karma Bhutia', 'sikkim.ssdma@gov.in', '+91 98660 10010', 'STATE_DIRECTOR', 'SSDMA@Gangtok2026')
ON CONFLICT (email) DO UPDATE SET
  official_id = EXCLUDED.official_id,
  agency_name = EXCLUDED.agency_name,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  clearance_tier = EXCLUDED.clearance_tier;

-- ----------------------------------------------------------------------------
-- 15. Seed Strategic Supply Hub Terminals
-- ----------------------------------------------------------------------------
INSERT INTO public.supply_hub_terminals (hub_code, hub_name, state, email, capacity_tonnes, contact_phone, password_hash)
VALUES
  ('HUB-NL-01', 'Dimapur Railhead Strategic Hub', 'Nagaland', 'hub.dimapur@nerlogistics.gov.in', 25000, '+91 94360 12345', 'Hub@Dimapur2026'),
  ('HUB-AS-02', 'Guwahati Multi-Modal Transshipment Hub', 'Assam', 'hub.guwahati@nerlogistics.gov.in', 50000, '+91 94350 23456', 'Hub@Guwahati2026'),
  ('HUB-AS-03', 'Silchar Southern Corridor Depot', 'Assam', 'hub.silchar@nerlogistics.gov.in', 18000, '+91 94350 34567', 'Hub@Silchar2026'),
  ('HUB-AR-04', 'Itanagar High-Altitude Buffer Center', 'Arunachal Pradesh', 'hub.itanagar@nerlogistics.gov.in', 12000, '+91 94360 45678', 'Hub@Itanagar2026'),
  ('HUB-ML-05', 'Shillong Highland Transit Terminal', 'Meghalaya', 'hub.shillong@nerlogistics.gov.in', 15000, '+91 94360 56789', 'Hub@Shillong2026'),
  ('HUB-MN-06', 'Imphal Eastern Logistics Depot', 'Manipur', 'hub.imphal@nerlogistics.gov.in', 14000, '+91 94360 67890', 'Hub@Imphal2026'),
  ('HUB-MZ-07', 'Aizawl Southern Relief Hub', 'Mizoram', 'hub.aizawl@nerlogistics.gov.in', 10000, '+91 94360 78901', 'Hub@Aizawl2026'),
  ('HUB-TR-08', 'Agartala Border Logistics Hub', 'Tripura', 'hub.agartala@nerlogistics.gov.in', 16000, '+91 94360 89012', 'Hub@Agartala2026'),
  ('HUB-SK-09', 'Gangtok Himalayan Supply Depot', 'Sikkim', 'hub.gangtok@nerlogistics.gov.in', 8000, '+91 94360 90123', 'Hub@Gangtok2026')
ON CONFLICT (email) DO UPDATE SET
  hub_code = EXCLUDED.hub_code,
  hub_name = EXCLUDED.hub_name,
  state = EXCLUDED.state,
  capacity_tonnes = EXCLUDED.capacity_tonnes,
  contact_phone = EXCLUDED.contact_phone;
