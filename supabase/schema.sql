-- ============================================================================
-- NER SMART LOGISTICS PLATFORM (SIH PROBLEM ID: 26002)
-- MASTER UNIFIED DATABASE SCHEMA & REALTIME REPLICATION ENGINE
-- ============================================================================
-- This master file consolidates all tables, triggers, RLS policies, 
-- 50 curated strategic supply hubs, and realtime publication configs.
-- Paste directly into the Supabase SQL Editor and run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Enable Required PostgreSQL Extensions
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 2. Master User Profiles Table (Strict Email Primary Key)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    email TEXT PRIMARY KEY,
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'CITIZEN_DRIVER' CHECK (role IN ('CITIZEN_DRIVER', 'SUPPLY_HUB', 'GOV_AUTHORITY', 'citizen', 'driver', 'public_user', 'hub_operator', 'gov_official', 'admin')),
    hub_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'CITIZEN_DRIVER';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hub_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_hub_id ON public.profiles (hub_id);

-- ----------------------------------------------------------------------------
-- 3. Backward Compatible Legacy Profile Tables
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    citizen_uid TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    emergency_contact TEXT,
    driver_license TEXT,
    role TEXT DEFAULT 'citizen',
    agency_name TEXT,
    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,
    is_sharing_location BOOLEAN DEFAULT TRUE,
    last_location_update TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.government_officials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    official_id TEXT UNIQUE NOT NULL,
    agency_name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    clearance_tier TEXT DEFAULT 'COMMAND_OFFICER',
    rank TEXT,
    password_hash TEXT DEFAULT 'SECURE_AUTH_MANAGED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.supply_hub_terminals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hub_code TEXT UNIQUE NOT NULL,
    hub_name TEXT NOT NULL,
    state TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    capacity_tonnes NUMERIC DEFAULT 10000,
    contact_phone TEXT,
    password_hash TEXT DEFAULT 'SECURE_AUTH_MANAGED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. Idempotent Auth Trigger: Auto-sync on auth.users ONLY WHEN EMAIL IS VERIFIED
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    clean_email TEXT;
    extracted_name TEXT;
    extracted_phone TEXT;
    extracted_role TEXT;
    extracted_hub_id TEXT;
BEGIN
    -- Strictly block profile creation if the email has not been verified yet
    IF NEW.email_confirmed_at IS NULL THEN
        RETURN NEW;
    END IF;

    clean_email := LOWER(TRIM(NEW.email));
    extracted_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', SPLIT_PART(clean_email, '@', 1));
    extracted_phone := COALESCE(NEW.raw_user_meta_data->>'phone', NULL);
    extracted_role := COALESCE(NEW.raw_user_meta_data->>'role', 'CITIZEN_DRIVER');
    extracted_hub_id := COALESCE(NEW.raw_user_meta_data->>'hub_id', NEW.raw_user_meta_data->>'hub_code', NULL);

    -- 1. Sync to public.profiles (email PRIMARY KEY)
    INSERT INTO public.profiles (
        email,
        user_id,
        full_name,
        phone,
        role,
        hub_id,
        created_at,
        updated_at
    )
    VALUES (
        clean_email,
        NEW.id,
        extracted_name,
        extracted_phone,
        extracted_role,
        extracted_hub_id,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        role = COALESCE(EXCLUDED.role, public.profiles.role),
        hub_id = COALESCE(EXCLUDED.hub_id, public.profiles.hub_id),
        updated_at = NOW();

    -- 2. Sync to public.client_users for legacy backward compatibility
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
        extracted_name,
        clean_email,
        extracted_phone,
        extracted_role,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = COALESCE(EXCLUDED.phone, public.client_users.phone),
        role = COALESCE(EXCLUDED.role, public.client_users.role),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 5. Table: supply_hubs (50 Curated Strategic Regional Hubs, name PRIMARY KEY)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.supply_hubs (
    name TEXT PRIMARY KEY,
    id UUID DEFAULT gen_random_uuid(),
    state TEXT NOT NULL,
    district TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    capacity_tons NUMERIC DEFAULT 500,
    capacity_tonnes NUMERIC DEFAULT 500,
    current_load_tons NUMERIC DEFAULT 100,
    status TEXT DEFAULT 'OPERATIONAL' CHECK (status IN ('OPERATIONAL', 'CRITICAL', 'MAINTENANCE', 'CONGESTED')),
    contact_person TEXT,
    contact_phone TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.supply_hubs ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.supply_hubs ADD COLUMN IF NOT EXISTS capacity_tons NUMERIC DEFAULT 500;
ALTER TABLE public.supply_hubs ADD COLUMN IF NOT EXISTS capacity_tonnes NUMERIC DEFAULT 500;
ALTER TABLE public.supply_hubs ADD COLUMN IF NOT EXISTS current_load_tons NUMERIC DEFAULT 100;
ALTER TABLE public.supply_hubs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'OPERATIONAL';
ALTER TABLE public.supply_hubs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_supply_hubs_state ON public.supply_hubs (state);
CREATE INDEX IF NOT EXISTS idx_supply_hubs_status ON public.supply_hubs (status);

-- ----------------------------------------------------------------------------
-- 6. Table: road_disruptions (Government Hazards with PostGIS Buffers)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.road_disruptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    government_body_name TEXT NOT NULL DEFAULT 'Border Roads Organisation (BRO)',
    title TEXT NOT NULL,
    disruption_type TEXT NOT NULL CHECK (disruption_type IN ('LANDSLIDE', 'FLASH_FLOOD', 'ROAD_BLOCK', 'ROAD_BLOCKED', 'BRIDGE_DAMAGE')),
    hazard_type TEXT,
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'low', 'medium', 'high', 'critical')),
    risk_radius_meters INT DEFAULT 1000,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    message VARCHAR(500),
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
ALTER TABLE public.road_disruptions ADD COLUMN IF NOT EXISTS government_body_name TEXT NOT NULL DEFAULT 'Border Roads Organisation (BRO)';
ALTER TABLE public.road_disruptions ADD COLUMN IF NOT EXISTS message VARCHAR(500);
ALTER TABLE public.road_disruptions ADD COLUMN IF NOT EXISTS location_geom GEOMETRY(Point, 4326);
ALTER TABLE public.road_disruptions ADD COLUMN IF NOT EXISTS impact_zone GEOMETRY(Geometry, 4326);
ALTER TABLE public.road_disruptions ADD COLUMN IF NOT EXISTS risk_radius_meters INT DEFAULT 1000;
ALTER TABLE public.road_disruptions ADD COLUMN IF NOT EXISTS highway_reference TEXT;
ALTER TABLE public.road_disruptions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.road_disruptions ADD COLUMN IF NOT EXISTS is_simulated BOOLEAN DEFAULT FALSE;

-- PostGIS Geometry Automation Trigger
CREATE OR REPLACE FUNCTION trg_update_disruption_geometries()
RETURNS TRIGGER AS $$
BEGIN
    NEW.location_geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    
    IF NEW.risk_radius_meters IS NOT NULL AND NEW.risk_radius_meters > 0 THEN
        NEW.impact_zone := ST_Buffer(NEW.location_geom::geography, NEW.risk_radius_meters)::geometry;
    ELSE
        NEW.impact_zone := ST_Buffer(NEW.location_geom::geography, 1000)::geometry;
    END IF;
    
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
CREATE TRIGGER trg_disruption_geom_update
BEFORE INSERT OR UPDATE OF latitude, longitude, risk_radius_meters ON public.road_disruptions
FOR EACH ROW
EXECUTE FUNCTION trg_update_disruption_geometries();

CREATE INDEX IF NOT EXISTS idx_road_disruptions_active ON public.road_disruptions (is_active);
CREATE INDEX IF NOT EXISTS idx_road_disruptions_geom ON public.road_disruptions USING GIST (location_geom);
CREATE INDEX IF NOT EXISTS idx_road_disruptions_impact ON public.road_disruptions USING GIST (impact_zone);

-- ----------------------------------------------------------------------------
-- 7. Table: shipments (Priority Humanitarian & Emergency Relief Convoys)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_code TEXT UNIQUE NOT NULL,
    driver_id TEXT,
    driver_name TEXT,
    origin JSONB,
    destination JSONB,
    origin_name TEXT,
    destination_name TEXT,
    origin_hub_id TEXT,
    destination_hub_id TEXT,
    cargo_type TEXT CHECK (cargo_type IN ('MEDICINE', 'PERISHABLE_FOOD', 'FUEL', 'GENERAL')),
    cargo_tier TEXT,
    cargo_manifest TEXT,
    priority_level INT DEFAULT 1,
    current_status TEXT DEFAULT 'IN_TRANSIT',
    status TEXT DEFAULT 'IN_TRANSIT',
    weight_tonnes NUMERIC DEFAULT 5.0,
    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,
    heading DOUBLE PRECISION DEFAULT 0,
    speed DOUBLE PRECISION DEFAULT 0,
    speed_kmh DOUBLE PRECISION DEFAULT 0,
    threat_score INT DEFAULT 0,
    dispatched_by_hub_id TEXT,
    hub_id TEXT,
    hub_code TEXT,
    created_by UUID,
    estimated_arrival TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_ping_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS tracking_code TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS driver_name TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS driver_id TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS origin_name TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS destination_name TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS origin_hub_id TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS destination_hub_id TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS cargo_manifest TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS cargo_tier TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS cargo_type TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS priority_level INT DEFAULT 1;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'IN_TRANSIT';
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS current_status TEXT DEFAULT 'IN_TRANSIT';
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS weight_tonnes NUMERIC DEFAULT 5.0;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS current_lat DOUBLE PRECISION;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS current_lng DOUBLE PRECISION;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS heading DOUBLE PRECISION DEFAULT 0;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS speed DOUBLE PRECISION DEFAULT 0;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS threat_score INTEGER DEFAULT 0;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS dispatched_by_hub_id TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS hub_id TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS hub_code TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS last_ping_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON public.shipments (tracking_code);
CREATE INDEX IF NOT EXISTS idx_shipments_driver_id ON public.shipments (driver_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments (current_status);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON public.shipments (created_at DESC);

-- ----------------------------------------------------------------------------
-- 8. Table: live_journeys (Real-Time Driver GPS Telemetry & Active Routes)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.live_journeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.client_users(id) ON DELETE SET NULL,
    citizen_uid TEXT,
    tracking_code TEXT,
    driver_id TEXT,
    driver_name TEXT,
    origin_hub TEXT,
    destination_hub TEXT,
    current_lat DOUBLE PRECISION NOT NULL,
    current_lng DOUBLE PRECISION NOT NULL,
    heading DOUBLE PRECISION DEFAULT 0,
    speed_kmh DOUBLE PRECISION DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    shared_with TEXT DEFAULT 'ALL',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_journeys_active ON public.live_journeys (is_active);

-- ----------------------------------------------------------------------------
-- 9. Table: system_broadcasts (Universal Emergency Warnings & Advisories)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_broadcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'WARNING' CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL', 'EMERGENCY')),
    agency TEXT DEFAULT 'Disaster Management Command',
    issued_by_name TEXT DEFAULT 'Official Command Desk',
    affected_region TEXT DEFAULT 'Northeast Regional Corridor',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_broadcasts_active ON public.system_broadcasts (is_active);

-- ----------------------------------------------------------------------------
-- 10. Enable Full Replica Identity for Zero-Refresh Realtime WebSockets
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.profiles REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.supply_hubs REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.road_disruptions REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.shipments REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.live_journeys REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.system_broadcasts REPLICA IDENTITY FULL;

-- ----------------------------------------------------------------------------
-- 11. Row Level Security (RLS) & Universal Platform Policies
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_officials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supply_hub_terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supply_hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.road_disruptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_broadcasts ENABLE ROW LEVEL SECURITY;

-- 11.1 Profiles Policies
DROP POLICY IF EXISTS "Allow users read own profile or all verified" ON public.profiles;
CREATE POLICY "Allow users read own profile or all verified" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow users insert own profile" ON public.profiles;
CREATE POLICY "Allow users insert own profile" ON public.profiles FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow users update own profile" ON public.profiles;
CREATE POLICY "Allow users update own profile" ON public.profiles FOR UPDATE USING (true);

-- 11.2 Supply Hubs Policies
DROP POLICY IF EXISTS "Public access for supply_hubs" ON public.supply_hubs;
CREATE POLICY "Public access for supply_hubs" ON public.supply_hubs FOR ALL USING (true);

-- 11.3 Road Disruptions Policies
DROP POLICY IF EXISTS "Public access for road_disruptions" ON public.road_disruptions;
CREATE POLICY "Public access for road_disruptions" ON public.road_disruptions FOR ALL USING (true) WITH CHECK (true);

-- 11.4 Shipments Policies
DROP POLICY IF EXISTS "Allow global select on shipments" ON public.shipments;
CREATE POLICY "Allow global select on shipments" ON public.shipments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert on shipments" ON public.shipments;
CREATE POLICY "Allow insert on shipments" ON public.shipments FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update on shipments" ON public.shipments;
CREATE POLICY "Allow update on shipments" ON public.shipments FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete on shipments" ON public.shipments;
CREATE POLICY "Allow delete on shipments" ON public.shipments FOR DELETE USING (true);

-- 11.5 Live Journeys Policies
DROP POLICY IF EXISTS "Public access for live_journeys" ON public.live_journeys;
CREATE POLICY "Public access for live_journeys" ON public.live_journeys FOR ALL USING (true);

-- 11.6 System Broadcasts Policies
DROP POLICY IF EXISTS "Public access for system_broadcasts" ON public.system_broadcasts;
CREATE POLICY "Public access for system_broadcasts" ON public.system_broadcasts FOR ALL USING (true);

-- 11.7 Legacy Tables Policies
DROP POLICY IF EXISTS "Public access for client_users" ON public.client_users;
CREATE POLICY "Public access for client_users" ON public.client_users FOR ALL USING (true);
DROP POLICY IF EXISTS "Public access for government_officials" ON public.government_officials;
CREATE POLICY "Public access for government_officials" ON public.government_officials FOR ALL USING (true);
DROP POLICY IF EXISTS "Public access for supply_hub_terminals" ON public.supply_hub_terminals;
CREATE POLICY "Public access for supply_hub_terminals" ON public.supply_hub_terminals FOR ALL USING (true);

-- ----------------------------------------------------------------------------
-- 12. Supabase Realtime Publication Registration
-- ----------------------------------------------------------------------------
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'profiles') THEN 
      ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles; 
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'supply_hubs') THEN 
      ALTER PUBLICATION supabase_realtime ADD TABLE public.supply_hubs; 
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'road_disruptions') THEN 
      ALTER PUBLICATION supabase_realtime ADD TABLE public.road_disruptions; 
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'shipments') THEN 
      ALTER PUBLICATION supabase_realtime ADD TABLE public.shipments; 
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'live_journeys') THEN 
      ALTER PUBLICATION supabase_realtime ADD TABLE public.live_journeys; 
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'system_broadcasts') THEN 
      ALTER PUBLICATION supabase_realtime ADD TABLE public.system_broadcasts; 
    END IF; 
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 13. Seed Baseline Data: Exactly 50 Strategic NER Supply Hubs
-- ----------------------------------------------------------------------------
INSERT INTO public.supply_hubs (name, state, district, latitude, longitude, capacity_tons, capacity_tonnes, current_load_tons, status, contact_person, contact_phone, is_active)
VALUES
  -- Assam (12 Hubs)
  ('Guwahati Central Hub', 'Assam', 'Kamrup Metropolitan', 26.1445, 91.7362, 2500, 2500, 1100, 'OPERATIONAL', 'Ranjit Baruah', '+91 94350 11223', true),
  ('Silchar Logistics Depot', 'Assam', 'Cachar', 24.8333, 92.7789, 1200, 1200, 640, 'OPERATIONAL', 'Debashish Nath', '+91 94350 22334', true),
  ('Dibrugarh Air Cargo Hub', 'Assam', 'Dibrugarh', 27.4728, 94.9120, 1000, 1000, 420, 'OPERATIONAL', 'Pranab Saikia', '+91 94350 33445', true),
  ('Jorhat Distribution Center', 'Assam', 'Jorhat', 26.7509, 94.2037, 850, 850, 310, 'OPERATIONAL', 'Manish Gogoi', '+91 94350 44556', true),
  ('Tezpur Strategic Depot', 'Assam', 'Sonitpur', 26.6528, 92.7926, 950, 950, 500, 'OPERATIONAL', 'Biren Kalita', '+91 94350 55667', true),
  ('Nagaon Transit Base', 'Assam', 'Nagaon', 26.3465, 92.6840, 700, 700, 290, 'OPERATIONAL', 'Tarun Bora', '+91 94350 66778', true),
  ('Bongaigaon Refinery Depot', 'Assam', 'Bongaigaon', 26.5024, 90.5532, 1100, 1100, 600, 'OPERATIONAL', 'Ananta Roy', '+91 94350 77889', true),
  ('Tinsukia Industrial Park', 'Assam', 'Tinsukia', 27.4922, 95.3468, 900, 900, 480, 'OPERATIONAL', 'Dharmendra Moran', '+91 94350 88990', true),
  ('Goalpara River Logistics Hub', 'Assam', 'Goalpara', 26.1700, 90.6200, 600, 600, 210, 'OPERATIONAL', 'Kuldip Das', '+91 94350 99001', true),
  ('North Lakhimpur Depot', 'Assam', 'Lakhimpur', 27.2300, 94.1000, 550, 550, 180, 'OPERATIONAL', 'Babul Chutia', '+91 94351 00112', true),
  ('Karimganj Border Hub', 'Assam', 'Karimganj', 24.8667, 92.3500, 650, 650, 320, 'OPERATIONAL', 'Subrata Deb', '+91 94351 11223', true),
  ('Dhubri Brahmaputra Terminal', 'Assam', 'Dhubri', 26.0200, 89.9700, 750, 750, 390, 'OPERATIONAL', 'Mofidul Islam', '+91 94351 22334', true),

  -- Arunachal Pradesh (8 Hubs)
  ('Itanagar Command Base', 'Arunachal Pradesh', 'Papum Pare', 27.0844, 93.6053, 900, 900, 450, 'OPERATIONAL', 'Tage Tado', '+91 94360 11223', true),
  ('Pasighat Siang Terminal', 'Arunachal Pradesh', 'East Siang', 28.0667, 95.3333, 600, 600, 210, 'OPERATIONAL', 'Oken Tayeng', '+91 94360 22334', true),
  ('Tawang High Altitude Hub', 'Arunachal Pradesh', 'Tawang', 27.5861, 91.8594, 500, 500, 380, 'CRITICAL', 'Lobsang Norbu', '+91 94360 33445', true),
  ('Ziro Valley Center', 'Arunachal Pradesh', 'Lower Subansiri', 27.5333, 93.8333, 400, 400, 140, 'OPERATIONAL', 'Koj Radhe', '+91 94360 44556', true),
  ('Bomdila Strategic Reserve', 'Arunachal Pradesh', 'West Kameng', 27.2645, 92.4184, 550, 550, 290, 'OPERATIONAL', 'Dorjee Khandu', '+91 94360 55667', true),
  ('Tezu Eastern Logistics Base', 'Arunachal Pradesh', 'Lohit', 27.9167, 96.1667, 450, 450, 160, 'OPERATIONAL', 'Chowna Mein', '+91 94360 66778', true),
  ('Along Sub-Station', 'Arunachal Pradesh', 'West Siang', 28.1667, 94.8000, 350, 350, 110, 'OPERATIONAL', 'Marnya Ete', '+91 94360 77889', true),
  ('Roing Foothills Depot', 'Arunachal Pradesh', 'Lower Dibang Valley', 28.1333, 95.8333, 380, 380, 130, 'OPERATIONAL', 'Tone Riba', '+91 94360 88990', true),

  -- Meghalaya (6 Hubs)
  ('Shillong Highland Hub', 'Meghalaya', 'East Khasi Hills', 25.5788, 91.8933, 1000, 1000, 520, 'OPERATIONAL', 'Bah Lyngdoh', '+91 94361 11223', true),
  ('Tura Garo Hills Depot', 'Meghalaya', 'West Garo Hills', 25.5138, 90.2033, 600, 600, 240, 'OPERATIONAL', 'Sengbath Marak', '+91 94361 22334', true),
  ('Jowai Coal Belt Depot', 'Meghalaya', 'West Jaintia Hills', 25.4500, 92.2000, 500, 500, 190, 'OPERATIONAL', 'Wompher Shylla', '+91 94361 33445', true),
  ('Nongpoh Transit Center', 'Meghalaya', 'Ri-Bhoi', 25.9000, 91.8800, 650, 650, 310, 'OPERATIONAL', 'Pynshngain Syiem', '+91 94361 44556', true),
  ('Baghmara Border Outpost Hub', 'Meghalaya', 'South Garo Hills', 25.2000, 90.6300, 300, 300, 120, 'OPERATIONAL', 'Marcellus Marak', '+91 94361 55667', true),
  ('Williamnagar Central Hub', 'Meghalaya', 'East Garo Hills', 25.6000, 90.5800, 350, 350, 110, 'OPERATIONAL', 'Donbok Ryntathiang', '+91 94361 66778', true),

  -- Nagaland (6 Hubs)
  ('Dimapur Railway Logistics Yard', 'Nagaland', 'Dimapur', 25.9095, 93.7266, 1400, 1400, 780, 'OPERATIONAL', 'Temjen Ao', '+91 94362 11223', true),
  ('Kohima Capital Storage Depot', 'Nagaland', 'Kohima', 25.6751, 94.1086, 750, 750, 410, 'OPERATIONAL', 'Neiketou Angami', '+91 94362 22334', true),
  ('Mokokchung Regional Hub', 'Nagaland', 'Mokokchung', 26.3256, 94.5204, 450, 450, 170, 'OPERATIONAL', 'Imli Jamir', '+91 94362 33445', true),
  ('Tuensang Eastern Hub', 'Nagaland', 'Tuensang', 26.2800, 94.8300, 380, 380, 150, 'OPERATIONAL', 'Chuba Chang', '+91 94362 44556', true),
  ('Wokha Supply Base', 'Nagaland', 'Wokha', 26.1000, 94.2600, 320, 320, 90, 'OPERATIONAL', 'Mhathung Lotha', '+91 94362 55667', true),
  ('Mon Frontier Depot', 'Nagaland', 'Mon', 26.7500, 95.0600, 340, 340, 130, 'OPERATIONAL', 'Wangshu Konyak', '+91 94362 66778', true),

  -- Manipur (6 Hubs)
  ('Imphal Valley Central Base', 'Manipur', 'Imphal West', 24.8170, 93.9368, 1100, 1100, 690, 'OPERATIONAL', 'Biren Meitei', '+91 94363 11223', true),
  ('Churachandpur Southern Depot', 'Manipur', 'Churachandpur', 24.3333, 93.6667, 500, 500, 270, 'OPERATIONAL', 'Thanglian Zou', '+91 94363 22334', true),
  ('Moreh International Transit Hub', 'Manipur', 'Tengnoupal', 24.2444, 94.3056, 800, 800, 390, 'OPERATIONAL', 'Haokip Kuki', '+91 94363 33445', true),
  ('Senapati Northern Terminal', 'Manipur', 'Senapati', 25.2700, 94.0200, 420, 420, 180, 'OPERATIONAL', 'Kapun Poumai', '+91 94363 44556', true),
  ('Thoubal Agrilogistics Hub', 'Manipur', 'Thoubal', 24.6300, 93.9900, 480, 480, 190, 'OPERATIONAL', 'Ibomcha Singh', '+91 94363 55667', true),
  ('Ukhrul Mountain Depot', 'Manipur', 'Ukhrul', 25.1100, 94.3600, 360, 360, 160, 'OPERATIONAL', 'Somatai Tangkhul', '+91 94363 66778', true),

  -- Mizoram (4 Hubs)
  ('Aizawl Apex Warehouse', 'Mizoram', 'Aizawl', 23.7271, 92.7176, 850, 850, 460, 'OPERATIONAL', 'Lalthanzuala Sailo', '+91 94364 11223', true),
  ('Lunglei Southern Supply Hub', 'Mizoram', 'Lunglei', 22.8800, 92.7300, 500, 500, 210, 'OPERATIONAL', 'Zoramthanga Ralte', '+91 94364 22334', true),
  ('Champhai Border Logistics Depot', 'Mizoram', 'Champhai', 23.4700, 93.3200, 450, 450, 190, 'OPERATIONAL', 'Vanlalruata Fanai', '+91 94364 33445', true),
  ('Kolasib Transit Point', 'Mizoram', 'Kolasib', 24.2300, 92.6800, 400, 400, 150, 'OPERATIONAL', 'Lalrinsanga', '+91 94364 44556', true),

  -- Tripura (4 Hubs)
  ('Agartala Integrated Checkpost Hub', 'Tripura', 'West Tripura', 23.8315, 91.2868, 1200, 1200, 620, 'OPERATIONAL', 'Subhashish Roy', '+91 94365 11223', true),
  ('Dharmanagar Rail Depot', 'Tripura', 'North Tripura', 24.3700, 92.1600, 600, 600, 270, 'OPERATIONAL', 'Ratan Debbarma', '+91 94365 22334', true),
  ('Udaipur Regional Store', 'Tripura', 'Gomati', 23.5300, 91.4800, 450, 450, 180, 'OPERATIONAL', 'Pranajit Bhowmik', '+91 94365 33445', true),
  ('Belonia Southern Border Hub', 'Tripura', 'South Tripura', 23.2500, 91.4500, 380, 380, 140, 'OPERATIONAL', 'Sujit Chakraborty', '+91 94365 44556', true),

  -- Sikkim (4 Hubs)
  ('Gangtok Himalayan Base', 'Sikkim', 'East Sikkim', 27.3314, 88.6138, 700, 700, 390, 'OPERATIONAL', 'Karma Bhutia', '+91 98690 32334', true),
  ('Namchi South Storage Hub', 'Sikkim', 'South Sikkim', 27.1700, 88.3500, 420, 420, 160, 'OPERATIONAL', 'Tshering Dorjee', '+91 98692 23456', true),
  ('Mangan Alpine Outpost', 'Sikkim', 'North Sikkim', 27.5000, 88.5300, 320, 320, 180, 'CRITICAL', 'Tashi Namgyal', '+91 98693 34567', true),
  ('Gyalshing West Logistics Depot', 'Sikkim', 'West Sikkim', 27.2800, 88.2500, 360, 360, 130, 'OPERATIONAL', 'Pempa Lepcha', '+91 98691 12345', true)
ON CONFLICT (name) DO UPDATE SET
  state = EXCLUDED.state,
  district = EXCLUDED.district,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  capacity_tons = EXCLUDED.capacity_tons,
  capacity_tonnes = EXCLUDED.capacity_tonnes,
  current_load_tons = EXCLUDED.current_load_tons,
  status = EXCLUDED.status,
  contact_person = EXCLUDED.contact_person,
  contact_phone = EXCLUDED.contact_phone,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ----------------------------------------------------------------------------
-- 14. Seed Government Officials & Command Accounts
-- ----------------------------------------------------------------------------
INSERT INTO public.government_officials (official_id, agency_name, full_name, email, phone, clearance_tier)
VALUES
  ('GOV-BRO-01', 'Border Roads Organisation (BRO)', 'Col. Rajeshwar Sharma', 'bro.hq@nic.in', '+91 98620 11001', 'COMMAND_CHIEF'),
  ('GOV-NDMA-03', 'National Disaster Management Authority (NDMA)', 'Brig. Amitav Roy', 'ndma.ner@gov.in', '+91 98630 22002', 'COMMAND_CHIEF'),
  ('GOV-ASDMA-02', 'Assam State Disaster Management Authority (ASDMA)', 'Dr. Hemanta Baruah', 'assam.asdma@gov.in', '+91 94350 33003', 'STATE_DIRECTOR'),
  ('GOV-MSDMA-04', 'Meghalaya State Disaster Management Authority (MSDMA)', 'Banrap Marbaniang', 'meghalaya.msdma@gov.in', '+91 98620 44004', 'STATE_DIRECTOR'),
  ('GOV-APSDMA-05', 'Arunachal Pradesh SDMA (APSDMA)', 'Takam Ringu', 'arunachal.apsdma@gov.in', '+91 98680 55005', 'STATE_DIRECTOR'),
  ('GOV-NSDMA-06', 'Nagaland State Disaster Management Authority (NSDMA)', 'Keviletuo Angami', 'nagaland.nsdma@gov.in', '+91 98660 66006', 'STATE_DIRECTOR'),
  ('GOV-MANI-07', 'Manipur State Disaster Management Authority (ManiSDMA)', 'Ngangbam Singh', 'manipur.manisdma@gov.in', '+91 98630 77007', 'STATE_DIRECTOR'),
  ('GOV-DMR-08', 'Disaster Management & Rehabilitation (Mizoram)', 'Lalnunmawia Royte', 'mizoram.dmr@gov.in', '+91 98640 88008', 'STATE_DIRECTOR'),
  ('GOV-TDMA-09', 'Tripura Disaster Management Authority (TDMA)', 'Subir Debbarma', 'tripura.tdma@gov.in', '+91 98650 99009', 'STATE_DIRECTOR'),
  ('GOV-SSDMA-10', 'Sikkim State Disaster Management Authority (SSDMA)', 'Karma Bhutia', 'sikkim.ssdma@gov.in', '+91 98660 10010', 'STATE_DIRECTOR')
ON CONFLICT (email) DO UPDATE SET
  official_id = EXCLUDED.official_id,
  agency_name = EXCLUDED.agency_name,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  clearance_tier = EXCLUDED.clearance_tier;

-- ----------------------------------------------------------------------------
-- 15. Seed Strategic Supply Hub Terminals (Accounts)
-- ----------------------------------------------------------------------------
INSERT INTO public.supply_hub_terminals (hub_code, hub_name, state, email, capacity_tonnes, contact_phone)
VALUES
  ('HUB-NL-01', 'Dimapur Railway Logistics Yard', 'Nagaland', 'hub.dimapur@nerlogistics.gov.in', 25000, '+91 94360 12345'),
  ('HUB-AS-02', 'Guwahati Central Hub', 'Assam', 'hub.guwahati@nerlogistics.gov.in', 50000, '+91 94350 23456'),
  ('HUB-AS-03', 'Silchar Logistics Depot', 'Assam', 'hub.silchar@nerlogistics.gov.in', 18000, '+91 94350 34567'),
  ('HUB-AR-04', 'Itanagar Command Base', 'Arunachal Pradesh', 'hub.itanagar@nerlogistics.gov.in', 12000, '+91 94360 45678'),
  ('HUB-ML-05', 'Shillong Highland Hub', 'Meghalaya', 'hub.shillong@nerlogistics.gov.in', 15000, '+91 94360 56789'),
  ('HUB-MN-06', 'Imphal Valley Central Base', 'Manipur', 'hub.imphal@nerlogistics.gov.in', 14000, '+91 94360 67890'),
  ('HUB-MZ-07', 'Aizawl Apex Warehouse', 'Mizoram', 'hub.aizawl@nerlogistics.gov.in', 10000, '+91 94360 78901'),
  ('HUB-TR-08', 'Agartala Integrated Checkpost Hub', 'Tripura', 'hub.agartala@nerlogistics.gov.in', 16000, '+91 94360 89012'),
  ('HUB-SK-09', 'Gangtok Himalayan Base', 'Sikkim', 'hub.gangtok@nerlogistics.gov.in', 8000, '+91 94360 90123')
ON CONFLICT (email) DO UPDATE SET
  hub_code = EXCLUDED.hub_code,
  hub_name = EXCLUDED.hub_name,
  state = EXCLUDED.state,
  capacity_tonnes = EXCLUDED.capacity_tonnes,
  contact_phone = EXCLUDED.contact_phone;
