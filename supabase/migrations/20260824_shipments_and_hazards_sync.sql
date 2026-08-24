-- ============================================================================
-- NER SMART LOGISTICS PLATFORM - MIGRATION 20260824
-- Complete Shipments Table Schema, Universal RLS Policies & Realtime Sync Publication
-- ============================================================================

-- 1. Ensure Table Structure with all columns
CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_code TEXT UNIQUE,
    driver_name TEXT,
    driver_id TEXT,
    origin TEXT,
    destination TEXT,
    origin_name TEXT,
    destination_name TEXT,
    origin_hub_id UUID,
    destination_hub_id UUID,
    cargo_manifest TEXT,
    cargo_tier TEXT,
    cargo_type TEXT,
    priority_level INT DEFAULT 1,
    status TEXT DEFAULT 'IN_TRANSIT',
    current_status TEXT DEFAULT 'IN_TRANSIT',
    weight_tonnes NUMERIC DEFAULT 5.0,
    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,
    heading DOUBLE PRECISION DEFAULT 0,
    speed DOUBLE PRECISION DEFAULT 0,
    threat_score INTEGER DEFAULT 0,
    dispatched_by_hub_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_ping_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist even if the table already existed previously
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS tracking_code TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS driver_name TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS driver_id TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS origin TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS destination TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS origin_name TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS destination_name TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS origin_hub_id UUID;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS destination_hub_id UUID;
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
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS last_ping_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Indexes for high-speed tracking & driver querying
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON public.shipments (tracking_code);
CREATE INDEX IF NOT EXISTS idx_shipments_driver_id ON public.shipments (driver_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments (current_status);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON public.shipments (created_at DESC);

-- 3. Enable Row Level Security (RLS) and grant unrestricted read/write for verified platform operations
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow global select on shipments" ON public.shipments;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.shipments;
DROP POLICY IF EXISTS "Public access for shipments" ON public.shipments;
DROP POLICY IF EXISTS "Authorized authorities can view telemetry" ON public.shipments;

CREATE POLICY "Allow global select on shipments"
ON public.shipments FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow insert on shipments" ON public.shipments;
DROP POLICY IF EXISTS "Enable insert for authenticated users and anon" ON public.shipments;
DROP POLICY IF EXISTS "Supply Hubs can insert shipments" ON public.shipments;

CREATE POLICY "Allow insert on shipments"
ON public.shipments FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update on shipments" ON public.shipments;
DROP POLICY IF EXISTS "Enable update for drivers and hubs" ON public.shipments;
DROP POLICY IF EXISTS "Drivers can update their own telemetry" ON public.shipments;

CREATE POLICY "Allow update on shipments"
ON public.shipments FOR UPDATE
USING (true);

DROP POLICY IF EXISTS "Allow delete on shipments" ON public.shipments;
CREATE POLICY "Allow delete on shipments"
ON public.shipments FOR DELETE
USING (true);

-- 4. Realtime Subscriptions Publication for Shipments & Hazards
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.shipments;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.road_disruptions;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;
