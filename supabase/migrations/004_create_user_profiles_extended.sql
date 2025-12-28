-- Extended User Profiles with Travel Data and Payment Methods
-- Created: 2025-12-09

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Info
  full_name TEXT,
  phone TEXT,
  date_of_birth DATE,
  
  -- Travel Preferences
  home_airport TEXT,
  preferred_airlines_json JSONB DEFAULT '[]'::jsonb,
  seat_preference TEXT, -- 'window', 'aisle', 'middle'
  meal_preference TEXT, -- 'regular', 'vegetarian', 'vegan', 'kosher', 'halal', etc.
  
  -- Passenger Info (for flight booking)
  passport_number TEXT,
  passport_country TEXT,
  passport_expiry DATE,
  nationality TEXT,
  known_traveler_number TEXT, -- TSA PreCheck, Global Entry, etc.
  frequent_flyer_programs_json JSONB DEFAULT '[]'::jsonb, -- [{ airline: 'UA', number: '123456' }]
  
  -- Emergency Contact
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  
  -- Payment Methods (encrypted/tokenized in production)
  payment_methods_json JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{ id: 'pm_xxx', type: 'card', last4: '4242', brand: 'visa', exp_month: 12, exp_year: 2025, is_default: true }]
  
  -- Preferences
  auto_book_enabled BOOLEAN DEFAULT FALSE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  
  -- Profile Completeness Tracking
  profile_completed BOOLEAN DEFAULT FALSE,
  travel_data_completed BOOLEAN DEFAULT FALSE,
  payment_data_completed BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- Auto-calculate profile completeness
  NEW.profile_completed = (
    NEW.full_name IS NOT NULL AND
    NEW.phone IS NOT NULL AND
    NEW.date_of_birth IS NOT NULL
  );
  
  NEW.travel_data_completed = (
    NEW.passport_number IS NOT NULL AND
    NEW.passport_country IS NOT NULL AND
    NEW.passport_expiry IS NOT NULL AND
    NEW.nationality IS NOT NULL
  );
  
  NEW.payment_data_completed = (
    NEW.payment_methods_json IS NOT NULL AND
    jsonb_array_length(NEW.payment_methods_json) > 0
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trigger_update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

