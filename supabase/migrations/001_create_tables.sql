-- Trip Requests table
CREATE TABLE IF NOT EXISTS trip_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  origin TEXT,
  destination TEXT,
  depart_date TIMESTAMPTZ,
  return_date TIMESTAMPTZ,
  travelers_json JSONB DEFAULT '[]'::jsonb,
  budget_amount NUMERIC,
  currency TEXT DEFAULT 'USD',
  cabin_class TEXT DEFAULT 'economy',
  nonstop_only BOOLEAN DEFAULT FALSE,
  preferred_airlines_json JSONB DEFAULT '[]'::jsonb,
  stay_area_prefs_json JSONB DEFAULT '{}'::jsonb,
  ride_prefs_json JSONB DEFAULT '{}'::jsonb,
  auto_book_enabled BOOLEAN DEFAULT FALSE,
  auto_book_rules_json JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'planning',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Runs table
CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_request_id UUID REFERENCES trip_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_message TEXT,
  task_plan_json JSONB DEFAULT '{}'::jsonb,
  current_phase TEXT,
  status TEXT DEFAULT 'running',
  result_json JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Calendar Events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_request_id UUID REFERENCES trip_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  event_type TEXT,
  metadata_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_request_id UUID REFERENCES trip_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL, -- 'flight', 'stay', 'ride'
  provider TEXT,
  provider_order_id TEXT,
  offer_data_json JSONB DEFAULT '{}'::jsonb,
  booking_data_json JSONB DEFAULT '{}'::jsonb,
  amount NUMERIC,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE trip_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users can view own trip_requests" ON trip_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trip_requests" ON trip_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trip_requests" ON trip_requests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trip_requests" ON trip_requests FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own agent_runs" ON agent_runs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own agent_runs" ON agent_runs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own agent_runs" ON agent_runs FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own calendar_events" ON calendar_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own calendar_events" ON calendar_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own calendar_events" ON calendar_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own calendar_events" ON calendar_events FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookings" ON bookings FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_trip_requests_user_id ON trip_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_requests_status ON trip_requests(status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_trip_request_id ON agent_runs(trip_request_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_trip_request_id ON calendar_events(trip_request_id);
CREATE INDEX IF NOT EXISTS idx_bookings_trip_request_id ON bookings(trip_request_id);
