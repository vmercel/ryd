-- Migration: Add rides and doctor appointments tables
-- Created: 2025-12-09

-- Ride requests table
CREATE TABLE IF NOT EXISTS ride_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pickup_lat DECIMAL(10, 7) NOT NULL,
  pickup_lng DECIMAL(10, 7) NOT NULL,
  pickup_address TEXT,
  dropoff_lat DECIMAL(10, 7) NOT NULL,
  dropoff_lng DECIMAL(10, 7) NOT NULL,
  dropoff_address TEXT,
  product_type TEXT NOT NULL DEFAULT 'uber-x',
  provider TEXT NOT NULL DEFAULT 'uber',
  scheduled_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'requested',
  driver_name TEXT,
  driver_rating DECIMAL(3, 2),
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_color TEXT,
  vehicle_plate TEXT,
  price_estimate DECIMAL(10, 2),
  actual_price DECIMAL(10, 2),
  eta_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Doctor appointments table
CREATE TABLE IF NOT EXISTS doctor_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  specialty TEXT,
  appointment_time TIMESTAMPTZ NOT NULL,
  appointment_type TEXT NOT NULL DEFAULT 'in-person', -- 'in-person' or 'telehealth'
  reason TEXT,
  notes TEXT,
  confirmation_number TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, completed, cancelled, rescheduled
  address TEXT,
  phone TEXT,
  video_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ
);

-- Enable RLS on ride_requests
ALTER TABLE ride_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for ride_requests
CREATE POLICY "Users can view their own rides" ON ride_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own rides" ON ride_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rides" ON ride_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- Enable RLS on doctor_appointments
ALTER TABLE doctor_appointments ENABLE ROW LEVEL SECURITY;

-- RLS policies for doctor_appointments
CREATE POLICY "Users can view their own appointments" ON doctor_appointments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own appointments" ON doctor_appointments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments" ON doctor_appointments
  FOR UPDATE USING (auth.uid() = user_id);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ride_requests_user_id ON ride_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_ride_requests_status ON ride_requests(status);
CREATE INDEX IF NOT EXISTS idx_ride_requests_created_at ON ride_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_doctor_appointments_user_id ON doctor_appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_doctor_appointments_status ON doctor_appointments(status);
CREATE INDEX IF NOT EXISTS idx_doctor_appointments_time ON doctor_appointments(appointment_time);
