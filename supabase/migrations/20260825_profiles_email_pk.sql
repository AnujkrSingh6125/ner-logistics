-- ============================================================================
-- NER SMART LOGISTICS PLATFORM - MIGRATION 20260825
-- Strict Email Primary Key Profiles Table, Cascading Auth FK, Trigger Sync & RLS
-- ============================================================================

-- 1. Create or migrate profiles table with email as strict PRIMARY KEY
CREATE TABLE IF NOT EXISTS public.profiles (
  email TEXT PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'CITIZEN_DRIVER',
  hub_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'CITIZEN_DRIVER';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hub_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Indexes for fast lookup by user_id or role
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_hub_id ON public.profiles (hub_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Configure RLS Policies
DROP POLICY IF EXISTS "Public profiles are readable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are readable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
CREATE POLICY "Users can delete their own profile" 
ON public.profiles FOR DELETE 
USING (auth.uid() = user_id OR auth.jwt() ->> 'role' IN ('GOV_AUTHORITY', 'gov_official', 'admin'));

-- 5. Trigger Function: Automatically Sync auth.users to public.profiles on OTP verification/signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    email,
    user_id,
    full_name,
    phone,
    role,
    hub_id
  )
  VALUES (
    LOWER(NEW.email),
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'role', 'CITIZEN_DRIVER'),
    NEW.raw_user_meta_data->>'hub_id'
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

-- 6. Attach Trigger to auth.users (on INSERT and raw_user_meta_data UPDATE)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Add profiles to Realtime Publication
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
        END IF;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;
