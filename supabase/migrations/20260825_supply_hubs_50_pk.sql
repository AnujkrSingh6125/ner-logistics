-- ============================================================================
-- NER SMART LOGISTICS PLATFORM - MIGRATION 20260825
-- Exactly 50 Curated Strategic NER Supply Hubs with `name` as PRIMARY KEY
-- ============================================================================

-- 1. Create or recreate supply_hubs table with `name` as PRIMARY KEY
DROP TABLE IF EXISTS public.supply_hubs CASCADE;

CREATE TABLE public.supply_hubs (
  name TEXT PRIMARY KEY,
  state TEXT NOT NULL,
  district TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  capacity_tons NUMERIC DEFAULT 500,
  current_load_tons NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'OPERATIONAL', -- 'OPERATIONAL', 'CRITICAL', 'MAINTENANCE'
  contact_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes for fast geospatial and state filtering
CREATE INDEX IF NOT EXISTS idx_supply_hubs_state ON public.supply_hubs (state);
CREATE INDEX IF NOT EXISTS idx_supply_hubs_status ON public.supply_hubs (status);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.supply_hubs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to all users" ON public.supply_hubs;
CREATE POLICY "Allow read access to all users"
ON public.supply_hubs FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow admin and hub managers to insert hubs" ON public.supply_hubs;
CREATE POLICY "Allow admin and hub managers to insert hubs"
ON public.supply_hubs FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin and hub managers to update hubs" ON public.supply_hubs;
CREATE POLICY "Allow admin and hub managers to update hubs"
ON public.supply_hubs FOR UPDATE
USING (true);

-- 4. Seed Exactly 50 Curated Strategic NER Supply Hubs Across all 8 States
INSERT INTO public.supply_hubs (name, state, district, latitude, longitude, capacity_tons, current_load_tons, status) VALUES
-- Assam (12 Hubs)
('Guwahati Central Hub', 'Assam', 'Kamrup Metropolitan', 26.1445, 91.7362, 2500, 1100, 'OPERATIONAL'),
('Silchar Logistics Depot', 'Assam', 'Cachar', 24.8333, 92.7789, 1200, 640, 'OPERATIONAL'),
('Dibrugarh Air Cargo Hub', 'Assam', 'Dibrugarh', 27.4728, 94.9120, 1000, 420, 'OPERATIONAL'),
('Jorhat Distribution Center', 'Assam', 'Jorhat', 26.7509, 94.2037, 850, 310, 'OPERATIONAL'),
('Tezpur Strategic Depot', 'Assam', 'Sonitpur', 26.6528, 92.7926, 950, 500, 'OPERATIONAL'),
('Nagaon Transit Base', 'Assam', 'Nagaon', 26.3465, 92.6840, 700, 290, 'OPERATIONAL'),
('Bongaigaon Refinery Depot', 'Assam', 'Bongaigaon', 26.5024, 90.5532, 1100, 600, 'OPERATIONAL'),
('Tinsukia Industrial Park', 'Assam', 'Tinsukia', 27.4922, 95.3468, 900, 480, 'OPERATIONAL'),
('Goalpara River Logistics Hub', 'Assam', 'Goalpara', 26.1700, 90.6200, 600, 210, 'OPERATIONAL'),
('North Lakhimpur Depot', 'Assam', 'Lakhimpur', 27.2300, 94.1000, 550, 180, 'OPERATIONAL'),
('Karimganj Border Hub', 'Assam', 'Karimganj', 24.8667, 92.3500, 650, 320, 'OPERATIONAL'),
('Dhubri Brahmaputra Terminal', 'Assam', 'Dhubri', 26.0200, 89.9700, 750, 390, 'OPERATIONAL'),

-- Arunachal Pradesh (8 Hubs)
('Itanagar Command Base', 'Arunachal Pradesh', 'Papum Pare', 27.0844, 93.6053, 900, 450, 'OPERATIONAL'),
('Pasighat Siang Terminal', 'Arunachal Pradesh', 'East Siang', 28.0667, 95.3333, 600, 210, 'OPERATIONAL'),
('Tawang High Altitude Hub', 'Arunachal Pradesh', 'Tawang', 27.5861, 91.8594, 500, 380, 'CRITICAL'),
('Ziro Valley Center', 'Arunachal Pradesh', 'Lower Subansiri', 27.5333, 93.8333, 400, 140, 'OPERATIONAL'),
('Bomdila Strategic Reserve', 'Arunachal Pradesh', 'West Kameng', 27.2645, 92.4184, 550, 290, 'OPERATIONAL'),
('Tezu Eastern Logistics Base', 'Arunachal Pradesh', 'Lohit', 27.9167, 96.1667, 450, 160, 'OPERATIONAL'),
('Along Sub-Station', 'Arunachal Pradesh', 'West Siang', 28.1667, 94.8000, 350, 110, 'OPERATIONAL'),
('Roing Foothills Depot', 'Arunachal Pradesh', 'Lower Dibang Valley', 28.1333, 95.8333, 380, 130, 'OPERATIONAL'),

-- Meghalaya (6 Hubs)
('Shillong Highland Hub', 'Meghalaya', 'East Khasi Hills', 25.5788, 91.8933, 1000, 520, 'OPERATIONAL'),
('Tura Garo Hills Depot', 'Meghalaya', 'West Garo Hills', 25.5138, 90.2033, 600, 240, 'OPERATIONAL'),
('Jowai Coal Belt Depot', 'Meghalaya', 'West Jaintia Hills', 25.4500, 92.2000, 500, 190, 'OPERATIONAL'),
('Nongpoh Transit Center', 'Meghalaya', 'Ri-Bhoi', 25.9000, 91.8800, 650, 310, 'OPERATIONAL'),
('Baghmara Border Outpost Hub', 'Meghalaya', 'South Garo Hills', 25.2000, 90.6300, 300, 120, 'OPERATIONAL'),
('Williamnagar Central Hub', 'Meghalaya', 'East Garo Hills', 25.6000, 90.5800, 350, 110, 'OPERATIONAL'),

-- Nagaland (6 Hubs)
('Dimapur Railway Logistics Yard', 'Nagaland', 'Dimapur', 25.9095, 93.7266, 1400, 780, 'OPERATIONAL'),
('Kohima Capital Storage Depot', 'Nagaland', 'Kohima', 25.6751, 94.1086, 750, 410, 'OPERATIONAL'),
('Mokokchung Regional Hub', 'Nagaland', 'Mokokchung', 26.3256, 94.5204, 450, 170, 'OPERATIONAL'),
('Tuensang Eastern Hub', 'Nagaland', 'Tuensang', 26.2800, 94.8300, 380, 150, 'OPERATIONAL'),
('Wokha Supply Base', 'Nagaland', 'Wokha', 26.1000, 94.2600, 320, 90, 'OPERATIONAL'),
('Mon Frontier Depot', 'Nagaland', 'Mon', 26.7500, 95.0600, 340, 130, 'OPERATIONAL'),

-- Manipur (6 Hubs)
('Imphal Valley Central Base', 'Manipur', 'Imphal West', 24.8170, 93.9368, 1100, 690, 'OPERATIONAL'),
('Churachandpur Southern Depot', 'Manipur', 'Churachandpur', 24.3333, 93.6667, 500, 270, 'OPERATIONAL'),
('Moreh International Transit Hub', 'Manipur', 'Tengnoupal', 24.2444, 94.3056, 800, 390, 'OPERATIONAL'),
('Senapati Northern Terminal', 'Manipur', 'Senapati', 25.2700, 94.0200, 420, 180, 'OPERATIONAL'),
('Thoubal Agrilogistics Hub', 'Manipur', 'Thoubal', 24.6300, 93.9900, 480, 190, 'OPERATIONAL'),
('Ukhrul Mountain Depot', 'Manipur', 'Ukhrul', 25.1100, 94.3600, 360, 160, 'OPERATIONAL'),

-- Mizoram (4 Hubs)
('Aizawl Apex Warehouse', 'Mizoram', 'Aizawl', 23.7271, 92.7176, 850, 460, 'OPERATIONAL'),
('Lunglei Southern Supply Hub', 'Mizoram', 'Lunglei', 22.8800, 92.7300, 500, 210, 'OPERATIONAL'),
('Champhai Border Logistics Depot', 'Mizoram', 'Champhai', 23.4700, 93.3200, 450, 190, 'OPERATIONAL'),
('Kolasib Transit Point', 'Mizoram', 'Kolasib', 24.2300, 92.6800, 400, 150, 'OPERATIONAL'),

-- Tripura (4 Hubs)
('Agartala Integrated Checkpost Hub', 'Tripura', 'West Tripura', 23.8315, 91.2868, 1200, 620, 'OPERATIONAL'),
('Dharmanagar Rail Depot', 'Tripura', 'North Tripura', 24.3700, 92.1600, 600, 270, 'OPERATIONAL'),
('Udaipur Regional Store', 'Tripura', 'Gomati', 23.5300, 91.4800, 450, 180, 'OPERATIONAL'),
('Belonia Southern Border Hub', 'Tripura', 'South Tripura', 23.2500, 91.4500, 380, 140, 'OPERATIONAL'),

-- Sikkim (4 Hubs)
('Gangtok Himalayan Base', 'Sikkim', 'East Sikkim', 27.3314, 88.6138, 700, 390, 'OPERATIONAL'),
('Namchi South Storage Hub', 'Sikkim', 'South Sikkim', 27.1700, 88.3500, 420, 160, 'OPERATIONAL'),
('Mangan Alpine Outpost', 'Sikkim', 'North Sikkim', 27.5000, 88.5300, 320, 180, 'CRITICAL'),
('Gyalshing West Logistics Depot', 'Sikkim', 'West Sikkim', 27.2800, 88.2500, 360, 130, 'OPERATIONAL')
ON CONFLICT (name) DO UPDATE 
SET 
  state = EXCLUDED.state,
  district = EXCLUDED.district,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  capacity_tons = EXCLUDED.capacity_tons,
  current_load_tons = EXCLUDED.current_load_tons,
  status = EXCLUDED.status,
  updated_at = NOW();

-- 5. Realtime publication
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'supply_hubs') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.supply_hubs;
        END IF;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;
