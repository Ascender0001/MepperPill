-- ============================================================
-- Supabase Migration: Auth + Roles (driver / manager)
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Profiles table – one row per auth.users entry
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'driver' CHECK (role IN ('driver', 'manager')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);



-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can read all profiles (needed for manager to list drivers)
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can update only their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile row (on registration)
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- RLS on orders
-- ============================================================

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Managers can see ALL orders
CREATE POLICY "Managers can view all orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'manager'
    )
  );

-- Drivers can see only their own orders
CREATE POLICY "Drivers can view own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid());

-- Drivers can insert their own orders
CREATE POLICY "Drivers can insert orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = driver_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'driver'
    )
  );

-- Managers can update any order (assign driver, etc.)
CREATE POLICY "Managers can update any order"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'manager'
    )
  );

-- Drivers can update only their own orders (e.g. mark as delivered)
CREATE POLICY "Drivers can update own orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid());

-- Managers can delete any order
CREATE POLICY "Managers can delete orders"
  ON public.orders FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'manager'
    )
  );

-- Drivers can delete their own orders
CREATE POLICY "Drivers can delete own orders"
  ON public.orders FOR DELETE
  TO authenticated
  USING (driver_id = auth.uid());

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

-- Drop existing trigger if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- RLS on addresses (allow all authenticated users to read)
-- ============================================================

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view addresses"
  ON public.addresses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert addresses"
  ON public.addresses FOR INSERT
  TO authenticated
  WITH CHECK (true);
