-- ============================================================================
-- 1. EXTENSIONS & INITIAL CLEANUP
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS public.shipments CASCADE;
DROP TABLE IF EXISTS public.road_disruptions CASCADE;
DROP TABLE IF EXISTS public.supply_hub_terminals CASCADE;
DROP TABLE IF EXISTS public.supply_hubs CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============================================================================
-- 2. TABLE: SUPPLY HUBS (Exactly 50 Strategic NER Hubs)
-- ============================================================================
CREATE TABLE public.supply_hubs (
  name TEXT PRIMARY KEY,
  state TEXT NOT NULL,
  district TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  capacity_tons NUMERIC DEFAULT 500,
  current_load_tons NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'OPERATIONAL',
  contact_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Constraint Trigger: Max 50 Hubs Enforcement
CREATE OR REPLACE FUNCTION public.check_max_50_hubs()
RETURNS TRIGGER AS $$ 
BEGIN 
  IF (SELECT COUNT(*) FROM public.supply_hubs) >= 50 AND TG_OP = 'INSERT' THEN 
    RAISE EXCEPTION 'Database limit reached: Maximum 50 supply hubs allowed.'; 
  END IF; 
  RETURN NEW; 
END; 
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_max_50_hubs
  BEFORE INSERT ON public.supply_hubs
  FOR EACH ROW EXECUTE FUNCTION public.check_max_50_hubs();

-- ============================================================================
-- 3. TABLE: SUPPLY HUB TERMINALS (Explicit PRIMARY KEY & UNIQUE Constraints)
-- ============================================================================
CREATE TABLE public.supply_hub_terminals (
  hub_code TEXT PRIMARY KEY,
  hub_name TEXT NOT NULL REFERENCES public.supply_hubs(name) ON UPDATE CASCADE ON DELETE CASCADE,
  state TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  capacity_tonnes NUMERIC DEFAULT 10000,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. TABLE: PROFILES (Strict OTP-Confirmed Email Key)
-- ============================================================================
CREATE TABLE public.profiles (
  email TEXT PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'CITIZEN_DRIVER',
  hub_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. TABLE: ROAD DISRUPTIONS & SHIPMENTS
-- ============================================================================
CREATE TABLE public.road_disruptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  disruption_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'HIGH',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius_meters NUMERIC DEFAULT 500,
  description TEXT,
  status TEXT DEFAULT 'ACTIVE',
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number TEXT UNIQUE NOT NULL,
  origin_hub TEXT NOT NULL REFERENCES public.supply_hubs(name) ON UPDATE CASCADE,
  destination_hub TEXT NOT NULL REFERENCES public.supply_hubs(name) ON UPDATE CASCADE,
  cargo_type TEXT NOT NULL,
  weight_tons NUMERIC NOT NULL,
  status TEXT DEFAULT 'DISPATCHED',
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. REALTIME REPLICATION & RLS
-- ============================================================================
ALTER TABLE public.supply_hubs REPLICA IDENTITY FULL;
ALTER TABLE public.supply_hub_terminals REPLICA IDENTITY FULL;
ALTER TABLE public.road_disruptions REPLICA IDENTITY FULL;
ALTER TABLE public.shipments REPLICA IDENTITY FULL;

DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'road_disruptions') THEN 
    ALTER PUBLICATION supabase_realtime ADD TABLE public.road_disruptions; 
  END IF; 
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'shipments') THEN 
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shipments; 
  END IF; 
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'supply_hubs') THEN 
    ALTER PUBLICATION supabase_realtime ADD TABLE public.supply_hubs; 
  END IF; 
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'supply_hub_terminals') THEN 
    ALTER PUBLICATION supabase_realtime ADD TABLE public.supply_hub_terminals; 
  END IF; 
END $$;

ALTER TABLE public.supply_hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supply_hub_terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.road_disruptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read supply_hubs" ON public.supply_hubs FOR SELECT USING (true);
CREATE POLICY "Public read terminals" ON public.supply_hub_terminals FOR SELECT USING (true);
CREATE POLICY "Operational road_disruptions" ON public.road_disruptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Operational shipments" ON public.shipments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Profiles read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profiles update" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- 7. STRICT OTP-CONFIRMED USER TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$ 
BEGIN 
  IF NEW.email_confirmed_at IS NULL THEN 
    RETURN NEW; 
  END IF; 

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
    LOWER(NEW.email),
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'NER Operator'),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'role', 'CITIZEN_DRIVER'),
    NEW.raw_user_meta_data->>'hub_id',
    NOW(),
    NOW()
  ) 
  ON CONFLICT (email) DO UPDATE 
  SET 
    user_id = EXCLUDED.user_id,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    role = COALESCE(EXCLUDED.role, public.profiles.role),
    hub_id = COALESCE(EXCLUDED.hub_id, public.profiles.hub_id),
    updated_at = NOW(); 

  RETURN NEW; 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 8. SEED: EXACTLY 50 SUPPLY HUBS
-- ============================================================================
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
  status = EXCLUDED.status;

-- ============================================================================
-- 9. SEED: EXACTLY 50 SUPPLY HUB TERMINALS (Unique hub_code & email)
-- ============================================================================
INSERT INTO public.supply_hub_terminals (hub_code, hub_name, state, email, capacity_tonnes, contact_phone) VALUES
-- Assam (12)
('HUB-AS-01', 'Guwahati Central Hub', 'Assam', 'hub.guwahati@nerlogistics.gov.in', 25000, '+91 94360 11001'),
('HUB-AS-02', 'Silchar Logistics Depot', 'Assam', 'hub.silchar@nerlogistics.gov.in', 12000, '+91 94360 11002'),
('HUB-AS-03', 'Dibrugarh Air Cargo Hub', 'Assam', 'hub.dibrugarh@nerlogistics.gov.in', 10000, '+91 94360 11003'),
('HUB-AS-04', 'Jorhat Distribution Center', 'Assam', 'hub.jorhat@nerlogistics.gov.in', 8500, '+91 94360 11004'),
('HUB-AS-05', 'Tezpur Strategic Depot', 'Assam', 'hub.tezpur@nerlogistics.gov.in', 9500, '+91 94360 11005'),
('HUB-AS-06', 'Nagaon Transit Base', 'Assam', 'hub.nagaon@nerlogistics.gov.in', 7000, '+91 94360 11006'),
('HUB-AS-07', 'Bongaigaon Refinery Depot', 'Assam', 'hub.bongaigaon@nerlogistics.gov.in', 11000, '+91 94360 11007'),
('HUB-AS-08', 'Tinsukia Industrial Park', 'Assam', 'hub.tinsukia@nerlogistics.gov.in', 9000, '+91 94360 11008'),
('HUB-AS-09', 'Goalpara River Logistics Hub', 'Assam', 'hub.goalpara@nerlogistics.gov.in', 6000, '+91 94360 11009'),
('HUB-AS-10', 'North Lakhimpur Depot', 'Assam', 'hub.lakhimpur@nerlogistics.gov.in', 5500, '+91 94360 11010'),
('HUB-AS-11', 'Karimganj Border Hub', 'Assam', 'hub.karimganj@nerlogistics.gov.in', 6500, '+91 94360 11011'),
('HUB-AS-12', 'Dhubri Brahmaputra Terminal', 'Assam', 'hub.dhubri@nerlogistics.gov.in', 7500, '+91 94360 11012'),
-- Arunachal Pradesh (8)
('HUB-AR-01', 'Itanagar Command Base', 'Arunachal Pradesh', 'hub.itanagar@nerlogistics.gov.in', 9000, '+91 94360 22001'),
('HUB-AR-02', 'Pasighat Siang Terminal', 'Arunachal Pradesh', 'hub.pasighat@nerlogistics.gov.in', 6000, '+91 94360 22002'),
('HUB-AR-03', 'Tawang High Altitude Hub', 'Arunachal Pradesh', 'hub.tawang@nerlogistics.gov.in', 5000, '+91 94360 22003'),
('HUB-AR-04', 'Ziro Valley Center', 'Arunachal Pradesh', 'hub.ziro@nerlogistics.gov.in', 4000, '+91 94360 22004'),
('HUB-AR-05', 'Bomdila Strategic Reserve', 'Arunachal Pradesh', 'hub.bomdila@nerlogistics.gov.in', 5500, '+91 94360 22005'),
('HUB-AR-06', 'Tezu Eastern Logistics Base', 'Arunachal Pradesh', 'hub.tezu@nerlogistics.gov.in', 4500, '+91 94360 22006'),
('HUB-AR-07', 'Along Sub-Station', 'Arunachal Pradesh', 'hub.along@nerlogistics.gov.in', 3500, '+91 94360 22007'),
('HUB-AR-08', 'Roing Foothills Depot', 'Arunachal Pradesh', 'hub.roing@nerlogistics.gov.in', 3800, '+91 94360 22008'),
-- Meghalaya (6)
('HUB-ML-01', 'Shillong Highland Hub', 'Meghalaya', 'hub.shillong@nerlogistics.gov.in', 10000, '+91 94360 33001'),
('HUB-ML-02', 'Tura Garo Hills Depot', 'Meghalaya', 'hub.tura@nerlogistics.gov.in', 6000, '+91 94360 33002'),
('HUB-ML-03', 'Jowai Coal Belt Depot', 'Meghalaya', 'hub.jowai@nerlogistics.gov.in', 5000, '+91 94360 33003'),
('HUB-ML-04', 'Nongpoh Transit Center', 'Meghalaya', 'hub.nongpoh@nerlogistics.gov.in', 6500, '+91 94360 33004'),
('HUB-ML-05', 'Baghmara Border Outpost Hub', 'Meghalaya', 'hub.baghmara@nerlogistics.gov.in', 3000, '+91 94360 33005'),
('HUB-ML-06', 'Williamnagar Central Hub', 'Meghalaya', 'hub.williamnagar@nerlogistics.gov.in', 3500, '+91 94360 33006'),
-- Nagaland (6)
('HUB-NL-01', 'Dimapur Railway Logistics Yard', 'Nagaland', 'hub.dimapur@nerlogistics.gov.in', 14000, '+91 94360 44001'),
('HUB-NL-02', 'Kohima Capital Storage Depot', 'Nagaland', 'hub.kohima@nerlogistics.gov.in', 7500, '+91 94360 44002'),
('HUB-NL-03', 'Mokokchung Regional Hub', 'Nagaland', 'hub.mokokchung@nerlogistics.gov.in', 4500, '+91 94360 44003'),
('HUB-NL-04', 'Tuensang Eastern Hub', 'Nagaland', 'hub.tuensang@nerlogistics.gov.in', 3800, '+91 94360 44004'),
('HUB-NL-05', 'Wokha Supply Base', 'Nagaland', 'hub.wokha@nerlogistics.gov.in', 3200, '+91 94360 44005'),
('HUB-NL-06', 'Mon Frontier Depot', 'Nagaland', 'hub.mon@nerlogistics.gov.in', 3400, '+91 94360 44006'),
-- Manipur (6)
('HUB-MN-01', 'Imphal Valley Central Base', 'Manipur', 'hub.imphal@nerlogistics.gov.in', 11000, '+91 94360 55001'),
('HUB-MN-02', 'Churachandpur Southern Depot', 'Manipur', 'hub.churachandpur@nerlogistics.gov.in', 5000, '+91 94360 55002'),
('HUB-MN-03', 'Moreh International Transit Hub', 'Manipur', 'hub.moreh@nerlogistics.gov.in', 8000, '+91 94360 55003'),
('HUB-MN-04', 'Senapati Northern Terminal', 'Manipur', 'hub.senapati@nerlogistics.gov.in', 4200, '+91 94360 55004'),
('HUB-MN-05', 'Thoubal Agrilogistics Hub', 'Manipur', 'hub.thoubal@nerlogistics.gov.in', 4800, '+91 94360 55005'),
('HUB-MN-06', 'Ukhrul Mountain Depot', 'Manipur', 'hub.ukhrul@nerlogistics.gov.in', 3600, '+91 94360 55006'),
-- Mizoram (4)
('HUB-MZ-01', 'Aizawl Apex Warehouse', 'Mizoram', 'hub.aizawl@nerlogistics.gov.in', 8500, '+91 94360 66001'),
('HUB-MZ-02', 'Lunglei Southern Supply Hub', 'Mizoram', 'hub.lunglei@nerlogistics.gov.in', 5000, '+91 94360 66002'),
('HUB-MZ-03', 'Champhai Border Logistics Depot', 'Mizoram', 'hub.champhai@nerlogistics.gov.in', 4500, '+91 94360 66003'),
('HUB-MZ-04', 'Kolasib Transit Point', 'Mizoram', 'hub.kolasib@nerlogistics.gov.in', 4000, '+91 94360 66004'),
-- Tripura (4)
('HUB-TR-01', 'Agartala Integrated Checkpost Hub', 'Tripura', 'hub.agartala@nerlogistics.gov.in', 12000, '+91 94360 77001'),
('HUB-TR-02', 'Dharmanagar Rail Depot', 'Tripura', 'hub.dharmanagar@nerlogistics.gov.in', 6000, '+91 94360 77002'),
('HUB-TR-03', 'Udaipur Regional Store', 'Tripura', 'hub.udaipur@nerlogistics.gov.in', 4500, '+91 94360 77003'),
('HUB-TR-04', 'Belonia Southern Border Hub', 'Tripura', 'hub.belonia@nerlogistics.gov.in', 3800, '+91 94360 77004'),
-- Sikkim (4)
('HUB-SK-01', 'Gangtok Himalayan Base', 'Sikkim', 'hub.gangtok@nerlogistics.gov.in', 7000, '+91 94360 88001'),
('HUB-SK-02', 'Namchi South Storage Hub', 'Sikkim', 'hub.namchi@nerlogistics.gov.in', 4200, '+91 94360 88002'),
('HUB-SK-03', 'Mangan Alpine Outpost', 'Sikkim', 'hub.mangan@nerlogistics.gov.in', 3200, '+91 94360 88003'),
('HUB-SK-04', 'Gyalshing West Logistics Depot', 'Sikkim', 'hub.gyalshing@nerlogistics.gov.in', 3600, '+91 94360 88004')
ON CONFLICT (hub_code) DO UPDATE SET
  hub_name = EXCLUDED.hub_name,
  state = EXCLUDED.state,
  email = EXCLUDED.email,
  capacity_tonnes = EXCLUDED.capacity_tonnes,
  contact_phone = EXCLUDED.contact_phone;
