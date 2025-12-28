import { getSupabaseClient } from '@/template';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';

// Uber API configuration
const UBER_CLIENT_ID = process.env.UBER_CLIENT_ID ||
  Constants.expoConfig?.extra?.uberClientId ||
  'yLRrwHx94NiiZLOQQlyNWmdg68bbM26V';

export interface RideEstimate {
  id: string;
  provider: 'uber' | 'lyft';
  productName: string;
  price: {
    min: number;
    max: number;
    currency: string;
    display: string;
  };
  duration: number; // minutes
  distance: number; // miles
  eta: number; // minutes until pickup
  surgeMultiplier?: number;
}

export interface RideRequest {
  pickup: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  dropoff: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  scheduledTime?: string; // ISO date for scheduled rides
}

export interface RideBookingResult {
  success: boolean;
  rideId?: string;
  provider: string;
  status: 'requested' | 'accepted' | 'arriving' | 'in_progress' | 'completed' | 'cancelled';
  driver?: {
    name: string;
    rating: number;
    phone?: string;
    vehicle: {
      make: string;
      model: string;
      color: string;
      licensePlate: string;
    };
  };
  eta?: number;
  error?: string;
}

// Cinematic steps for ride booking
export const CINEMATIC_RIDE_STEPS = [
  {
    id: 'detect_location',
    title: 'Detecting Location',
    description: 'Pinpointing your exact position',
    icon: 'location',
    color: '#3B82F6',
    status: 'pending' as const,
  },
  {
    id: 'connect_uber',
    title: 'Connecting to Uber',
    description: 'Establishing secure connection',
    icon: 'car-sport',
    color: '#000000',
    status: 'pending' as const,
  },
  {
    id: 'search_drivers',
    title: 'Searching Drivers',
    description: 'Finding available drivers nearby',
    icon: 'search',
    color: '#8B5CF6',
    status: 'pending' as const,
  },
  {
    id: 'calculate_route',
    title: 'Calculating Route',
    description: 'Optimizing your journey',
    icon: 'git-branch',
    color: '#10B981',
    status: 'pending' as const,
  },
  {
    id: 'get_estimates',
    title: 'Getting Estimates',
    description: 'Comparing ride options and prices',
    icon: 'pricetag',
    color: '#F59E0B',
    status: 'pending' as const,
  },
  {
    id: 'select_ride',
    title: 'Selecting Ride',
    description: 'Choosing the best option for you',
    icon: 'checkmark-circle',
    color: '#06B6D4',
    status: 'pending' as const,
  },
  {
    id: 'request_ride',
    title: 'Requesting Ride',
    description: 'Sending request to driver',
    icon: 'send',
    color: '#EC4899',
    status: 'pending' as const,
  },
  {
    id: 'driver_matched',
    title: 'Driver Matched',
    description: 'Your driver is on the way',
    icon: 'person',
    color: '#22C55E',
    status: 'pending' as const,
  },
];

// Get ride estimates from Uber
export const getRideEstimates = async (request: RideRequest): Promise<RideEstimate[]> => {
  // In production, this would call Uber's Price Estimates API
  // For now, generate realistic mock estimates
  const distance = calculateDistance(
    request.pickup.latitude,
    request.pickup.longitude,
    request.dropoff.latitude,
    request.dropoff.longitude
  );

  const basePrice = distance * 2.5; // ~$2.50 per mile base

  return [
    {
      id: 'uber-x',
      provider: 'uber',
      productName: 'UberX',
      price: {
        min: Math.round(basePrice * 0.9),
        max: Math.round(basePrice * 1.1),
        currency: 'USD',
        display: `$${Math.round(basePrice * 0.9)}-${Math.round(basePrice * 1.1)}`,
      },
      duration: Math.round(distance * 2.5), // ~2.5 min per mile
      distance: distance,
      eta: Math.floor(Math.random() * 5) + 3, // 3-8 min
    },
    {
      id: 'uber-comfort',
      provider: 'uber',
      productName: 'Uber Comfort',
      price: {
        min: Math.round(basePrice * 1.2),
        max: Math.round(basePrice * 1.4),
        currency: 'USD',
        display: `$${Math.round(basePrice * 1.2)}-${Math.round(basePrice * 1.4)}`,
      },
      duration: Math.round(distance * 2.5),
      distance: distance,
      eta: Math.floor(Math.random() * 5) + 4,
    },
    {
      id: 'uber-xl',
      provider: 'uber',
      productName: 'UberXL',
      price: {
        min: Math.round(basePrice * 1.5),
        max: Math.round(basePrice * 1.8),
        currency: 'USD',
        display: `$${Math.round(basePrice * 1.5)}-${Math.round(basePrice * 1.8)}`,
      },
      duration: Math.round(distance * 2.5),
      distance: distance,
      eta: Math.floor(Math.random() * 7) + 5,
    },
    {
      id: 'uber-black',
      provider: 'uber',
      productName: 'Uber Black',
      price: {
        min: Math.round(basePrice * 2.5),
        max: Math.round(basePrice * 3),
        currency: 'USD',
        display: `$${Math.round(basePrice * 2.5)}-${Math.round(basePrice * 3)}`,
      },
      duration: Math.round(distance * 2.3),
      distance: distance,
      eta: Math.floor(Math.random() * 8) + 6,
    },
  ];
};

// Open Uber app with deep link
export const openUberApp = async (request: RideRequest): Promise<boolean> => {
  const { pickup, dropoff } = request;

  // Uber deep link format
  const uberUrl = `uber://?action=setPickup` +
    `&client_id=${UBER_CLIENT_ID}` +
    `&pickup[latitude]=${pickup.latitude}` +
    `&pickup[longitude]=${pickup.longitude}` +
    `&pickup[formatted_address]=${encodeURIComponent(pickup.address || 'Current Location')}` +
    `&dropoff[latitude]=${dropoff.latitude}` +
    `&dropoff[longitude]=${dropoff.longitude}` +
    `&dropoff[formatted_address]=${encodeURIComponent(dropoff.address || 'Destination')}`;

  const webUrl = `https://m.uber.com/ul/?` +
    `client_id=${UBER_CLIENT_ID}` +
    `&action=setPickup` +
    `&pickup[latitude]=${pickup.latitude}` +
    `&pickup[longitude]=${pickup.longitude}` +
    `&dropoff[latitude]=${dropoff.latitude}` +
    `&dropoff[longitude]=${dropoff.longitude}`;

  try {
    const canOpen = await Linking.canOpenURL(uberUrl);
    if (canOpen) {
      await Linking.openURL(uberUrl);
      return true;
    } else {
      // Fall back to web
      await Linking.openURL(webUrl);
      return true;
    }
  } catch (error) {
    console.error('Error opening Uber:', error);
    return false;
  }
};

// Book a ride (stores in database and can trigger Uber API)
export const bookRide = async (
  request: RideRequest,
  selectedProduct: string,
  userId: string
): Promise<RideBookingResult> => {
  const supabase = getSupabaseClient();

  try {
    // Store ride request in database
    const { data: rideRecord, error: dbError } = await supabase
      .from('ride_requests')
      .insert({
        user_id: userId,
        pickup_lat: request.pickup.latitude,
        pickup_lng: request.pickup.longitude,
        pickup_address: request.pickup.address,
        dropoff_lat: request.dropoff.latitude,
        dropoff_lng: request.dropoff.longitude,
        dropoff_address: request.dropoff.address,
        product_type: selectedProduct,
        scheduled_time: request.scheduledTime,
        status: 'requested',
        provider: 'uber',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
    }

    // In production, this would call Uber's Request API
    // For now, simulate a successful booking
    const mockDriver = {
      name: 'Michael S.',
      rating: 4.92,
      vehicle: {
        make: 'Toyota',
        model: 'Camry',
        color: 'Silver',
        licensePlate: 'ABC 1234',
      },
    };

    return {
      success: true,
      rideId: rideRecord?.id || `ride-${Date.now()}`,
      provider: 'uber',
      status: 'accepted',
      driver: mockDriver,
      eta: Math.floor(Math.random() * 5) + 3,
    };
  } catch (error) {
    console.error('Ride booking error:', error);
    return {
      success: false,
      provider: 'uber',
      status: 'cancelled',
      error: error instanceof Error ? error.message : 'Booking failed',
    };
  }
};

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Get user's ride history
export const getRideHistory = async (userId: string) => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('ride_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching ride history:', error);
    return { data: [], error: error.message };
  }

  return { data: data || [], error: null };
};
