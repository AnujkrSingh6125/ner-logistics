-- ============================================================================
-- REALTIME REPLICATION & REPLICA IDENTITY CONFIGURATION FOR EXISTING TABLES
-- ============================================================================

-- 1. Enable Full Replica Identity for accurate UPDATE/DELETE WebSocket payloads
ALTER TABLE IF EXISTS public.road_disruptions REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.shipments REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.supply_hubs REPLICA IDENTITY FULL;

CREATE TABLE IF NOT EXISTS public.live_journeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE CASCADE,
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

ALTER TABLE IF EXISTS public.live_journeys REPLICA IDENTITY FULL;

-- 2. Ensure RLS policies allow real-time broadcast reads
ALTER TABLE public.road_disruptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supply_hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_journeys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow realtime read road_disruptions" ON public.road_disruptions;
CREATE POLICY "Allow realtime read road_disruptions" 
ON public.road_disruptions FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow realtime insert road_disruptions" ON public.road_disruptions;
CREATE POLICY "Allow realtime insert road_disruptions" 
ON public.road_disruptions FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow realtime update road_disruptions" ON public.road_disruptions;
CREATE POLICY "Allow realtime update road_disruptions" 
ON public.road_disruptions FOR UPDATE 
USING (true);

DROP POLICY IF EXISTS "Allow realtime delete road_disruptions" ON public.road_disruptions;
CREATE POLICY "Allow realtime delete road_disruptions" 
ON public.road_disruptions FOR DELETE 
USING (true);

DROP POLICY IF EXISTS "Allow realtime read shipments" ON public.shipments;
CREATE POLICY "Allow realtime read shipments" 
ON public.shipments FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow realtime insert shipments" ON public.shipments;
CREATE POLICY "Allow realtime insert shipments" 
ON public.shipments FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow realtime update shipments" ON public.shipments;
CREATE POLICY "Allow realtime update shipments" 
ON public.shipments FOR UPDATE 
USING (true);

DROP POLICY IF EXISTS "Allow realtime delete shipments" ON public.shipments;
CREATE POLICY "Allow realtime delete shipments" 
ON public.shipments FOR DELETE 
USING (true);

DROP POLICY IF EXISTS "Allow realtime read live_journeys" ON public.live_journeys;
CREATE POLICY "Allow realtime read live_journeys" 
ON public.live_journeys FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow realtime insert live_journeys" ON public.live_journeys;
CREATE POLICY "Allow realtime insert live_journeys" 
ON public.live_journeys FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow realtime update live_journeys" ON public.live_journeys;
CREATE POLICY "Allow realtime update live_journeys" 
ON public.live_journeys FOR UPDATE 
USING (true);

-- 3. Add existing tables to Supabase Realtime Publication
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'road_disruptions'
  ) THEN 
    ALTER PUBLICATION supabase_realtime ADD TABLE public.road_disruptions; 
  END IF; 

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'shipments'
  ) THEN 
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shipments; 
  END IF; 

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'supply_hubs'
  ) THEN 
    ALTER PUBLICATION supabase_realtime ADD TABLE public.supply_hubs; 
  END IF; 

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'live_journeys'
  ) THEN 
    ALTER PUBLICATION supabase_realtime ADD TABLE public.live_journeys; 
  END IF; 
END $$;
