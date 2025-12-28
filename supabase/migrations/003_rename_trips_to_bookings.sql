-- Migration: Rename trips to bookings and add booking_type support
-- Created: 2025-12-09

-- Step 1: Rename trip_requests table to booking_requests
ALTER TABLE IF EXISTS trip_requests RENAME TO booking_requests;

-- Step 2: Add booking_type column to support different booking types
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS booking_type TEXT DEFAULT 'flight';

-- Step 3: Update status column to use unified booking statuses
-- (keeping existing values compatible)

-- Step 4: Rename foreign key columns in related tables
ALTER TABLE agent_runs RENAME COLUMN trip_request_id TO booking_request_id;
ALTER TABLE calendar_events RENAME COLUMN trip_request_id TO booking_request_id;
ALTER TABLE bookings RENAME COLUMN trip_request_id TO booking_request_id;

-- Step 5: Drop old indexes and create new ones
DROP INDEX IF EXISTS idx_trip_requests_user_id;
DROP INDEX IF EXISTS idx_trip_requests_status;
DROP INDEX IF EXISTS idx_agent_runs_trip_request_id;
DROP INDEX IF EXISTS idx_calendar_events_trip_request_id;
DROP INDEX IF EXISTS idx_bookings_trip_request_id;

CREATE INDEX IF NOT EXISTS idx_booking_requests_user_id ON booking_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_status ON booking_requests(status);
CREATE INDEX IF NOT EXISTS idx_booking_requests_type ON booking_requests(booking_type);
CREATE INDEX IF NOT EXISTS idx_agent_runs_booking_request_id ON agent_runs(booking_request_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_booking_request_id ON calendar_events(booking_request_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_request_id ON bookings(booking_request_id);

-- Step 6: Drop old RLS policies and recreate with new names
DROP POLICY IF EXISTS "Users can view own trip_requests" ON booking_requests;
DROP POLICY IF EXISTS "Users can insert own trip_requests" ON booking_requests;
DROP POLICY IF EXISTS "Users can update own trip_requests" ON booking_requests;
DROP POLICY IF EXISTS "Users can delete own trip_requests" ON booking_requests;

CREATE POLICY "Users can view own booking_requests" ON booking_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own booking_requests" ON booking_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own booking_requests" ON booking_requests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own booking_requests" ON booking_requests FOR DELETE USING (auth.uid() = user_id);

-- Step 7: Add additional columns for ride and doctor bookings
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS pickup_location_json JSONB DEFAULT '{}'::jsonb;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS dropoff_location_json JSONB DEFAULT '{}'::jsonb;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS doctor_info_json JSONB DEFAULT '{}'::jsonb;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS appointment_type TEXT;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS provider_booking_id TEXT;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS confirmation_number TEXT;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Step 8: Update bookings table domain to include 'doctor'
-- The domain column already exists, just ensure it can store doctor type

-- Step 9: Create a view for backwards compatibility (optional)
CREATE OR REPLACE VIEW trip_requests AS SELECT * FROM booking_requests WHERE booking_type = 'flight';
