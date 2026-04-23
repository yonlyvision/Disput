-- Supabase Schema for Rental Damage Inspection System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users (Staff, Managers, Admins)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('staff', 'manager', 'admin')),
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Vehicles
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plate_number TEXT UNIQUE NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Rentals
CREATE TABLE public.rentals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES public.vehicles(id) NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  staff_id UUID REFERENCES public.users(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  expected_return_date TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_return_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Inspections (Check-Out and Check-In)
CREATE TABLE public.inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rental_id UUID REFERENCES public.rentals(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('checkout', 'checkin')),
  staff_id UUID REFERENCES public.users(id) NOT NULL,
  existing_damage_notes TEXT,
  customer_comments TEXT,
  visible_issue_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Inspection Images
CREATE TABLE public.inspection_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID REFERENCES public.inspections(id) NOT NULL,
  angle TEXT NOT NULL,
  image_url TEXT NOT NULL, -- Will store Supabase Storage URL
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. AI Results
CREATE TABLE public.ai_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rental_id UUID REFERENCES public.rentals(id) NOT NULL,
  checkin_inspection_id UUID REFERENCES public.inspections(id) NOT NULL,
  checkout_inspection_id UUID REFERENCES public.inspections(id) NOT NULL,
  new_damage_detected BOOLEAN NOT NULL,
  overall_confidence INTEGER NOT NULL,
  inspection_result TEXT NOT NULL,
  raw_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. AI Damages
CREATE TABLE public.ai_damages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ai_result_id UUID REFERENCES public.ai_results(id) NOT NULL,
  panel_or_area TEXT NOT NULL,
  side TEXT NOT NULL,
  damage_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  confidence INTEGER NOT NULL,
  status TEXT NOT NULL,
  description TEXT,
  reasoning TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Final Reviews
CREATE TABLE public.final_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rental_id UUID REFERENCES public.rentals(id) NOT NULL,
  ai_result_id UUID REFERENCES public.ai_results(id) NOT NULL,
  staff_id UUID REFERENCES public.users(id) NOT NULL,
  decision TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Optional: Row Level Security (RLS) policies can be added here
