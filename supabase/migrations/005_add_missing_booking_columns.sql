-- Migration: Add missing columns for ride and doctor bookings
-- Created: 2025-12-09

-- Add missing columns for ride bookings
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS scheduled_time TIMESTAMPTZ;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS ride_type TEXT;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS eta_minutes INTEGER;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS driver_info_json JSONB DEFAULT '{}'::jsonb;

-- Add missing columns for doctor bookings
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS appointment_time TIMESTAMPTZ;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS symptoms_json JSONB DEFAULT '[]'::jsonb;

-- Create index for faster queries on booking_type
CREATE INDEX IF NOT EXISTS idx_booking_requests_booking_type ON booking_requests(booking_type);

-- Create index for scheduled_time queries
CREATE INDEX IF NOT EXISTS idx_booking_requests_scheduled_time ON booking_requests(scheduled_time);

-- Create index for appointment_time queries
CREATE INDEX IF NOT EXISTS idx_booking_requests_appointment_time ON booking_requests(appointment_time);
