-- ============================================================
-- Supabase Migration: Auth + Roles (driver / manager)
-- Safe to re-run (all statements are idempotent)
-- ============================================================

-- 1. Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'driver' CHECK (role IN ('driver', 'manager')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_num TEXT;

-- 2. Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id BIGINT PRIMARY KEY,
  addressid BIGINT NOT NULL,
  addressname TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('black', 'white')),
  details TEXT,
  price DOUBLE PRECISION NOT NULL DEFAULT 0,
  timestamp TEXT NOT NULL,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Addresses table
CREATE TABLE IF NOT EXISTS public.addresses (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone_num TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

-- Enable RLS (safe to re-run)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating them
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Managers can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Drivers can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Drivers can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Managers can update any order" ON public.orders;
DROP POLICY IF EXISTS "Drivers can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Managers can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Drivers can delete own orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can view addresses" ON public.addresses;
DROP POLICY IF EXISTS "Authenticated users can insert addresses" ON public.addresses;

-- Profiles: everyone can read
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Profiles: users update own
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Profiles: users insert own
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Orders: managers see all
CREATE POLICY "Managers can view all orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'manager')
  );

-- Orders: drivers see their own
CREATE POLICY "Drivers can view own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid());

-- Orders: drivers insert their own
CREATE POLICY "Drivers can insert orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = driver_id
    AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'driver')
  );

-- Orders: managers update any
CREATE POLICY "Managers can update any order"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'manager')
  );

-- Orders: drivers update own
CREATE POLICY "Drivers can update own orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid());

-- Orders: managers delete any
CREATE POLICY "Managers can delete orders"
  ON public.orders FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'manager')
  );

-- Orders: drivers delete own
CREATE POLICY "Drivers can delete own orders"
  ON public.orders FOR DELETE
  TO authenticated
  USING (driver_id = auth.uid());

-- Addresses: all authenticated can view
CREATE POLICY "Authenticated users can view addresses"
  ON public.addresses FOR SELECT
  TO authenticated
  USING (true);

-- Addresses: all authenticated can insert
CREATE POLICY "Authenticated users can insert addresses"
  ON public.addresses FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================
-- Auto-create profile on signup via trigger
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'driver')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
