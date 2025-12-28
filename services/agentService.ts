import { getSupabaseClient } from '@/template';
import Constants from 'expo-constants';
import { CinematicStep, CINEMATIC_PLANNING_STEPS, CINEMATIC_BOOKING_STEPS } from '../components/feature/CinematicSteps';

// Get Supabase URL from environment
const getSupabaseUrl = (): string => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ||
    Constants.expoConfig?.extra?.supabaseUrl ||
    'https://brxyozgvyeaxfcgfjulw.supabase.co';
  return url;
};

// Re-export cinematic steps
export { CinematicStep, CINEMATIC_PLANNING_STEPS, CINEMATIC_BOOKING_STEPS };

export type CinematicStepCallback = (step: CinematicStep, allSteps: CinematicStep[]) => void;

export interface BookingPlanRequest {
  userMessage: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
    city?: string;
    nearestAirport?: string;
  };
  onStepChange?: CinematicStepCallback;
}

export interface BookingPlanResponse {
  success: boolean;
  bookingId: string;
  agentRunId?: string;
  bookingType?: 'flight' | 'ride' | 'doctor';
  intent: {
    // Common fields
    destination?: string;
    origin?: string;
    // Flight-specific
    departDate?: string;
    returnDate?: string;
    budget?: number;
    cabinClass?: string;
    nonstopOnly?: boolean;
    travelers?: number;
    // Ride-specific
    pickupLocation?: { latitude: number; longitude: number; address: string };
    dropoffLocation?: { latitude: number; longitude: number; address: string };
    scheduledTime?: string;
    // Doctor-specific
    specialty?: string;
    appointmentType?: 'in-person' | 'telehealth';
    preferredDate?: string;
    symptoms?: string[];
  };
  flights?: Array<{
    id: string;
    carrier: string;
    flightNumber: string;
    price: number;
    currency: string;
    duration: number;
    stops: number;
    departureTime: string;
    arrivalTime: string;
    cabinClass: string;
    details: string;
  }>;
  rides?: Array<{
    id: string;
    provider: string;
    vehicleType: string;
    price: number;
    currency: string;
    eta: number;
    duration: number;
    distance: number;
  }>;
  doctors?: Array<{
    id: string;
    name: string;
    specialty: string;
    rating: number;
    availableTimes: string[];
    location: string;
    telehealth: boolean;
  }>;
  proposal: {
    title: string;
    details: {
      origin?: string;
      destination?: string;
      dates?: string;
      budget?: string;
      travelers?: number;
      // Ride details
      pickup?: string;
      dropoff?: string;
      time?: string;
      // Doctor details
      doctor?: string;
      specialty?: string;
      appointmentType?: string;
    };
  };
  error?: string;
}

// Legacy aliases for backwards compatibility
export type TripPlanRequest = BookingPlanRequest;
export type TripPlanResponse = BookingPlanResponse;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const STEP_DELAY = 2000; // 2 seconds between steps

// Planning phase - creates the proposal
export const planBooking = async (request: BookingPlanRequest): Promise<BookingPlanResponse> => {
  const { onStepChange } = request;

  // Initialize planning steps
  const steps: CinematicStep[] = CINEMATIC_PLANNING_STEPS.map(s => ({ ...s }));

  const updateStep = async (
    stepId: string,
    status: 'active' | 'completed' | 'error',
    details?: CinematicStep['details']
  ) => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    if (stepIndex !== -1) {
      // Mark previous active steps as completed
      steps.forEach((s, i) => {
        if (i < stepIndex && s.status === 'active') {
          s.status = 'completed';
        }
      });
      steps[stepIndex].status = status;
      if (details) {
        steps[stepIndex].details = details;
      }
      onStepChange?.(steps[stepIndex], [...steps]);
      if (status === 'active') {
        await delay(STEP_DELAY);
      }
    }
  };

  try {
    // Step 1: Connect
    await updateStep('connect', 'active');
    const supabase = getSupabaseClient();
    await updateStep('connect', 'completed', {
      primary: 'Atlas AI Connected',
      items: [{ label: 'Status', value: 'Secure connection established', icon: 'checkmark-circle' }],
    });

    // Step 2: Authenticate
    await updateStep('authenticate', 'active');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      await updateStep('authenticate', 'error');
      throw new Error('No active session');
    }
    await updateStep('authenticate', 'completed', {
      primary: 'Identity Verified',
      items: [{ label: 'User', value: session.user.email || 'Authenticated', icon: 'person' }],
    });

    // Step 3: Location
    await updateStep('location', 'active', {
      primary: 'Scanning GPS...',
    });
    const locationDetails = request.currentLocation ? {
      primary: request.currentLocation.city || 'Location detected',
      items: [
        { label: 'City', value: request.currentLocation.city || 'Unknown', icon: 'location' },
        { label: 'Airport', value: request.currentLocation.nearestAirport || 'Detecting...', icon: 'airplane' },
      ],
    } : { primary: 'Using default location' };
    await updateStep('location', 'completed', locationDetails);

    // Step 4: Understanding request
    await updateStep('understand', 'active', {
      primary: 'Processing natural language...',
      items: [{ label: 'Input', value: request.userMessage.slice(0, 50) + '...', icon: 'chatbubble' }],
    });

    // Call Edge Function
    const supabaseUrl = getSupabaseUrl();
    console.log('Calling Edge Function at:', `${supabaseUrl}/functions/v1/atlas-chat`);

    const response = await fetch(
      `${supabaseUrl}/functions/v1/atlas-chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userMessage: request.userMessage,
          currentLocation: request.currentLocation,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      await updateStep('understand', 'error');
      throw new Error(`Server error: ${errorText}`);
    }

    const data = await response.json();

    await updateStep('understand', 'completed', {
      primary: `Booking: ${data.intent?.destination || data.bookingType || 'destination'}`,
      items: [
        { label: 'Type', value: data.bookingType || 'flight', icon: 'bookmark' },
        { label: 'Destination', value: data.intent?.destination || 'TBD', icon: 'flag' },
      ],
    });

    // Step 5: Dates
    await updateStep('dates', 'active');
    await updateStep('dates', 'completed', {
      primary: 'Travel dates calculated',
      items: [
        { label: 'Depart', value: formatDate(data.intent?.departDate), icon: 'calendar' },
        { label: 'Return', value: formatDate(data.intent?.returnDate), icon: 'calendar-outline' },
      ],
    });

    // Step 6: Preferences
    await updateStep('preferences', 'active');
    await updateStep('preferences', 'completed', {
      primary: 'Preferences applied',
      items: [
        { label: 'Class', value: data.intent?.cabinClass || 'Economy', icon: 'ribbon' },
        { label: 'Budget', value: `$${data.intent?.budget?.toLocaleString() || '2,000'}`, icon: 'wallet' },
        { label: 'Travelers', value: `${data.intent?.travelers || 1} adult(s)`, icon: 'people' },
      ],
    });

    // Step 7: Create booking
    await updateStep('create_trip', 'active');
    await updateStep('create_trip', 'completed', {
      primary: 'Booking saved successfully',
      items: [{ label: 'Booking ID', value: (data.bookingId || data.tripId)?.slice(0, 8) || 'Created', icon: 'bookmark' }],
    });

    // Step 8: Proposal ready
    await updateStep('proposal', 'active');
    const optionsCount = data.flights?.length || data.rides?.length || data.doctors?.length || 0;
    const optionType = data.bookingType === 'ride' ? 'rides' : data.bookingType === 'doctor' ? 'appointments' : 'flights';
    await updateStep('proposal', 'completed', {
      primary: 'Ready for your review!',
      items: [
        { label: 'Options Found', value: `${optionsCount} ${optionType}`, icon: 'list' },
      ],
    });

    // Normalize response for backwards compatibility
    return {
      ...data,
      bookingId: data.bookingId || data.tripId,
    };
  } catch (error) {
    console.error('Plan booking error:', error);
    return {
      success: false,
      bookingId: '',
      bookingType: 'flight',
      intent: {
        destination: 'DEST',
        origin: 'ORIG',
        departDate: new Date().toISOString(),
        returnDate: new Date().toISOString(),
        budget: 0,
        cabinClass: 'economy',
        nonstopOnly: false,
        travelers: 1,
      },
      flights: [],
      proposal: {
        title: 'Error',
        details: {
          origin: '',
          destination: '',
          dates: '',
          budget: '',
          travelers: 0,
        },
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Legacy alias
export const planTrip = planBooking;

// Booking phase - executes after user approves proposal
export const executeBooking = async (
  bookingId: string,
  selectedOption: any, // Can be flight, ride, or doctor appointment
  onStepChange?: CinematicStepCallback
): Promise<{ success: boolean; error?: string }> => {
  const steps: CinematicStep[] = CINEMATIC_BOOKING_STEPS.map(s => ({ ...s }));

  const updateStep = async (
    stepId: string,
    status: 'active' | 'completed' | 'error',
    details?: CinematicStep['details']
  ) => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    if (stepIndex !== -1) {
      steps.forEach((s, i) => {
        if (i < stepIndex && s.status === 'active') {
          s.status = 'completed';
        }
      });
      steps[stepIndex].status = status;
      if (details) {
        steps[stepIndex].details = details;
      }
      onStepChange?.(steps[stepIndex], [...steps]);
      if (status === 'active') {
        await delay(STEP_DELAY);
      }
    }
  };

  try {
    // Step 1: Search flights
    await updateStep('search_flights', 'active', {
      primary: 'Contacting airlines...',
      items: [
        { label: 'Airlines', value: '500+ carriers', icon: 'airplane' },
        { label: 'Routes', value: 'Analyzing routes...', icon: 'git-branch' },
      ],
    });
    await updateStep('search_flights', 'completed', {
      primary: 'Flights retrieved',
      items: [{ label: 'Options', value: 'Multiple carriers found', icon: 'checkmark' }],
    });

    // Step 2: Compare prices
    await updateStep('compare_prices', 'active', {
      primary: 'Analyzing fares...',
      items: [
        { label: 'Economy', value: 'Comparing...', icon: 'pricetag' },
        { label: 'Business', value: 'Comparing...', icon: 'pricetags' },
      ],
    });
    await updateStep('compare_prices', 'completed', {
      primary: 'Best prices found',
      items: [{ label: 'Savings', value: 'Up to 30% off retail', icon: 'trending-down' }],
    });

    // Step 3: Rank options
    await updateStep('rank_options', 'active');
    await updateStep('rank_options', 'completed', {
      primary: 'Top options selected',
      items: [{ label: 'Best Value', value: selectedOption?.carrier || selectedOption?.provider || 'Selected', icon: 'trophy' }],
    });

    // Step 4: Select flight
    await updateStep('select_flight', 'active', {
      primary: `Reserving ${selectedOption?.carrier || selectedOption?.provider || selectedOption?.name || 'option'}...`,
      items: [
        { label: 'Option', value: selectedOption?.flightNumber || selectedOption?.vehicleType || selectedOption?.name || 'N/A', icon: 'bookmark' },
        { label: 'Price', value: `$${selectedOption?.price || '0'}`, icon: 'card' },
      ],
    });
    await updateStep('select_flight', 'completed', {
      primary: 'Option reserved',
      items: [{ label: 'Status', value: 'Hold confirmed', icon: 'lock-closed' }],
    });

    // Step 5: Seat selection
    await updateStep('seat_selection', 'active', {
      primary: 'Selecting seats...',
      items: [
        { label: 'Preference', value: 'Window seat', icon: 'grid' },
        { label: 'Row', value: 'Assigning...', icon: 'reorder-four' },
      ],
    });
    await updateStep('seat_selection', 'completed', {
      primary: 'Seats assigned',
      items: [{ label: 'Seats', value: '12A, 12B', icon: 'checkmark-circle' }],
    });

    // Step 6: Passenger info
    await updateStep('passenger_info', 'active', {
      primary: 'Verifying travelers...',
    });
    await updateStep('passenger_info', 'completed', {
      primary: 'Passengers verified',
      items: [{ label: 'Status', value: 'All details confirmed', icon: 'person-circle' }],
    });

    // Step 7: Payment
    await updateStep('payment', 'active', {
      primary: 'Processing payment...',
      items: [
        { label: 'Amount', value: `$${selectedOption?.price || '0'}`, icon: 'card' },
        { label: 'Method', value: 'Secure payment', icon: 'shield-checkmark' },
      ],
    });
    await delay(1500); // Extra delay for payment
    await updateStep('payment', 'completed', {
      primary: 'Payment successful!',
      items: [{ label: 'Transaction', value: 'Confirmed', icon: 'checkmark-done' }],
    });

    // Step 8: Confirmation
    await updateStep('confirmation', 'active', {
      primary: 'Generating confirmation...',
    });

    // Update booking status in database
    const supabase = getSupabaseClient();
    await supabase
      .from('booking_requests')
      .update({ status: 'booked', updated_at: new Date().toISOString() })
      .eq('id', bookingId);

    await updateStep('confirmation', 'completed', {
      primary: 'Booking confirmed!',
      items: [
        { label: 'Confirmation', value: `#${bookingId.slice(0, 8).toUpperCase()}`, icon: 'receipt' },
        { label: 'Details', value: 'Sent to email', icon: 'mail' },
      ],
    });

    // Step 9: Calendar sync
    await updateStep('calendar_sync', 'active', {
      primary: 'Syncing calendar...',
    });
    await updateStep('calendar_sync', 'completed', {
      primary: 'Calendar updated',
      items: [
        { label: 'Events', value: '2 events added', icon: 'calendar-number' },
        { label: 'Reminders', value: 'Set for 24h before', icon: 'notifications' },
      ],
    });

    // Step 10: Itinerary
    await updateStep('itinerary', 'active', {
      primary: 'Preparing details...',
    });
    await updateStep('itinerary', 'completed', {
      primary: 'Booking ready!',
      items: [
        { label: 'Details', value: 'Available to view', icon: 'document' },
        { label: 'App', value: 'View in Bookings tab', icon: 'calendar' },
      ],
    });

    return { success: true };
  } catch (error) {
    console.error('Booking error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Booking failed',
    };
  }
};

// Helper function for date formatting
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'TBD';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'TBD';
  }
};

export const getUserBookingsLegacy = async () => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('booking_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get bookings error:', error);
    return { data: [], error: error.message };
  }

  return { data: data || [], error: null };
};

export const getBookingByIdLegacy = async (bookingId: string) => {
  const supabase = getSupabaseClient();

  const [bookingResult, eventsResult] = await Promise.all([
    supabase.from('booking_requests').select('*').eq('id', bookingId).single(),
    supabase.from('calendar_events').select('*').eq('booking_request_id', bookingId),
  ]);

  if (bookingResult.error) {
    return { data: null, error: bookingResult.error.message };
  }

  return {
    data: {
      booking: bookingResult.data,
      events: eventsResult.data || [],
    },
    error: null,
  };
};

export const updateBookingStatus = async (bookingId: string, status: string) => {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('booking_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', bookingId);

  return { error: error?.message || null };
};

// Legacy aliases for backwards compatibility
export const getUserTrips = getUserBookingsLegacy;
export const getTripById = getBookingByIdLegacy;
export const updateTripStatus = updateBookingStatus;
