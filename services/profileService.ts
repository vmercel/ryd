import { getSupabaseClient } from '@/template';
import { ProfileData } from '@/components/feature/ProfileCompletionModal';

export interface UserProfile {
  id: string;
  full_name?: string;
  phone?: string;
  date_of_birth?: string;
  home_airport?: string;
  passport_number?: string;
  passport_country?: string;
  passport_expiry?: string;
  nationality?: string;
  known_traveler_number?: string;
  seat_preference?: string;
  meal_preference?: string;
  payment_methods_json?: any[];
  profile_completed?: boolean;
  travel_data_completed?: boolean;
  payment_data_completed?: boolean;
}

export interface ProfileCompleteness {
  isComplete: boolean;
  missingFields: {
    profile?: boolean;
    travelData?: boolean;
    paymentData?: boolean;
  };
  profile?: UserProfile;
}

/**
 * Check if user profile is complete for booking
 */
export async function checkProfileCompleteness(
  userId: string,
  bookingType: 'flight' | 'ride' | 'doctor'
): Promise<ProfileCompleteness> {
  const supabase = getSupabaseClient();

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    // Profile doesn't exist - need everything
    return {
      isComplete: false,
      missingFields: {
        profile: true,
        travelData: bookingType === 'flight',
        paymentData: true,
      },
    };
  }

  const missingFields: ProfileCompleteness['missingFields'] = {};

  // Check basic profile
  if (!profile.profile_completed) {
    missingFields.profile = true;
  }

  // Check travel data (required for flights)
  if (bookingType === 'flight' && !profile.travel_data_completed) {
    missingFields.travelData = true;
  }

  // Check payment data (required for all bookings)
  if (!profile.payment_data_completed) {
    missingFields.paymentData = true;
  }

  const isComplete = Object.keys(missingFields).length === 0;

  return {
    isComplete,
    missingFields,
    profile,
  };
}

/**
 * Update user profile with completion data
 */
export async function updateProfileData(
  userId: string,
  data: ProfileData
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();

  try {
    // Prepare update object
    const updateData: any = {};

    // Basic profile fields
    if (data.full_name) updateData.full_name = data.full_name;
    if (data.phone) updateData.phone = data.phone;
    if (data.date_of_birth) updateData.date_of_birth = data.date_of_birth;

    // Travel data fields
    if (data.passport_number) updateData.passport_number = data.passport_number;
    if (data.passport_country) updateData.passport_country = data.passport_country;
    if (data.passport_expiry) updateData.passport_expiry = data.passport_expiry;
    if (data.nationality) updateData.nationality = data.nationality;
    if (data.known_traveler_number) updateData.known_traveler_number = data.known_traveler_number;
    if (data.seat_preference) updateData.seat_preference = data.seat_preference;
    if (data.meal_preference) updateData.meal_preference = data.meal_preference;

    // Payment data (in production, this would be tokenized via Stripe/etc)
    if (data.payment_card_number) {
      const last4 = data.payment_card_number.slice(-4);
      const paymentMethod = {
        id: `pm_${Date.now()}`,
        type: 'card',
        last4,
        brand: detectCardBrand(data.payment_card_number),
        exp_month: parseInt(data.payment_exp_month || '0'),
        exp_year: parseInt(data.payment_exp_year || '0'),
        is_default: true,
      };

      updateData.payment_methods_json = [paymentMethod];
    }

    const { error } = await supabase
      .from('user_profiles')
      .upsert({ id: userId, ...updateData })
      .eq('id', userId);

    if (error) {
      console.error('Profile update error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Profile update exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Detect card brand from number
 */
function detectCardBrand(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\s/g, '');
  if (cleaned.startsWith('4')) return 'visa';
  if (cleaned.startsWith('5')) return 'mastercard';
  if (cleaned.startsWith('3')) return 'amex';
  return 'unknown';
}

