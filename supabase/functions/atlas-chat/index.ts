import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type RequestType = 'flight' | 'ride' | 'doctor' | 'unknown';

interface AtlasRequest {
  userMessage: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
    city?: string;
    address?: string;
    nearestAirport?: string;
  };
  userId: string;
}

interface RideIntent {
  type: 'ride';
  pickupAddress: string;
  dropoffAddress: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  scheduledTime?: string;
  rideType: 'standard' | 'premium' | 'xl';
}

interface DoctorIntent {
  type: 'doctor';
  specialty: string;
  symptoms?: string[];
  urgency: 'routine' | 'soon' | 'urgent';
  preferredDate?: string;
  preferredTime?: string;
  appointmentType: 'in-person' | 'telehealth';
  insurance?: string;
}

interface FlightIntent {
  type: 'flight';
  destination: string;
  origin: string;
  departDate: string;
  returnDate: string;
  budget: number;
  cabinClass: string;
  nonstopOnly: boolean;
  travelers: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Create client with user's JWT token for RLS to work correctly
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { userMessage, currentLocation }: AtlasRequest = await req.json();

    console.log('Processing Atlas request:', { userId: user.id, userMessage });

    // Step 1: Detect request type
    const requestType = await detectRequestType(userMessage);
    console.log('Detected request type:', requestType);

    // Route to appropriate handler
    switch (requestType) {
      case 'ride':
        return await handleRideRequest(userMessage, currentLocation, user.id, supabase);
      case 'doctor':
        return await handleDoctorRequest(userMessage, currentLocation, user.id, supabase);
      case 'flight':
      default:
        return await handleFlightRequest(userMessage, currentLocation, user.id, supabase);
    }
  } catch (error) {
    console.error('Atlas chat error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Detect what type of request this is
async function detectRequestType(userMessage: string): Promise<RequestType> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) {
    // Fallback to keyword detection
    return detectRequestTypeByKeywords(userMessage);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Classify the user's request into exactly one category. Return only the category name, nothing else.

Categories:
- "ride": User wants to book a ride, taxi, Uber, Lyft, or needs transportation somewhere locally
- "doctor": User wants to book a doctor appointment, see a specialist, has health concerns, or needs medical care
- "flight": User wants to book a flight, travel to another city/country, or plan a trip involving air travel
- "unknown": Cannot determine the category

Examples:
- "I need a ride to the airport" → ride
- "Book me an Uber to downtown" → ride
- "Take me to 123 Main Street" → ride
- "I have a headache and need to see a doctor" → doctor
- "Book a dermatologist appointment" → doctor
- "I need to see my physician next week" → doctor
- "Fly me to Tokyo next month" → flight
- "I want to visit Paris" → flight
- "Book a round trip to New York" → flight`,
          },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.1,
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      return detectRequestTypeByKeywords(userMessage);
    }

    const data = await response.json();
    const category = data.choices[0].message.content.toLowerCase().trim();

    if (['ride', 'doctor', 'flight'].includes(category)) {
      return category as RequestType;
    }
    return 'unknown';
  } catch (error) {
    console.error('Request type detection error:', error);
    return detectRequestTypeByKeywords(userMessage);
  }
}

function detectRequestTypeByKeywords(message: string): RequestType {
  const lower = message.toLowerCase();

  const rideKeywords = ['ride', 'uber', 'lyft', 'taxi', 'cab', 'drive me', 'take me to', 'pick me up', 'drop me off', 'transportation'];
  const doctorKeywords = ['doctor', 'appointment', 'physician', 'specialist', 'medical', 'health', 'sick', 'checkup', 'dermatologist', 'cardiologist', 'dentist', 'therapy', 'telehealth'];
  const flightKeywords = ['flight', 'fly', 'airplane', 'airport', 'travel to', 'visit', 'trip to', 'round trip', 'one way'];

  if (rideKeywords.some(k => lower.includes(k))) return 'ride';
  if (doctorKeywords.some(k => lower.includes(k))) return 'doctor';
  if (flightKeywords.some(k => lower.includes(k))) return 'flight';

  return 'unknown';
}

// Handle ride booking requests
async function handleRideRequest(userMessage: string, location: any, userId: string, supabase: any) {
  console.log('Handling ride request');

  const intent = await parseRideIntent(userMessage, location);
  console.log('Ride intent:', intent);

  // Calculate mock estimates
  const distance = calculateDistance(
    intent.pickupLat || location?.latitude || 37.7749,
    intent.pickupLng || location?.longitude || -122.4194,
    intent.dropoffLat || 37.7849,
    intent.dropoffLng || -122.4094
  );

  const basePrice = Math.max(distance * 2.5, 8);

  const rideOptions = [
    {
      id: 'uber-x',
      name: 'UberX',
      price: { min: Math.round(basePrice * 0.9), max: Math.round(basePrice * 1.1) },
      eta: Math.floor(Math.random() * 5) + 3,
      duration: Math.round(distance * 2.5),
    },
    {
      id: 'uber-comfort',
      name: 'Uber Comfort',
      price: { min: Math.round(basePrice * 1.2), max: Math.round(basePrice * 1.4) },
      eta: Math.floor(Math.random() * 5) + 4,
      duration: Math.round(distance * 2.5),
    },
    {
      id: 'uber-xl',
      name: 'UberXL',
      price: { min: Math.round(basePrice * 1.5), max: Math.round(basePrice * 1.8) },
      eta: Math.floor(Math.random() * 7) + 5,
      duration: Math.round(distance * 2.5),
    },
    {
      id: 'uber-black',
      name: 'Uber Black',
      price: { min: Math.round(basePrice * 2.5), max: Math.round(basePrice * 3) },
      eta: Math.floor(Math.random() * 8) + 6,
      duration: Math.round(distance * 2.3),
    },
  ];

  // Store ride request in unified booking_requests table
  const { data: rideRecord, error: dbError } = await supabase
    .from('booking_requests')
    .insert({
      user_id: userId,
      booking_type: 'ride',
      title: `Ride to ${intent.dropoffAddress}`,
      status: 'searching',
      pickup_location_json: {
        latitude: intent.pickupLat || location?.latitude,
        longitude: intent.pickupLng || location?.longitude,
        address: intent.pickupAddress || location?.address || 'Current Location',
      },
      dropoff_location_json: {
        latitude: intent.dropoffLat,
        longitude: intent.dropoffLng,
        address: intent.dropoffAddress,
      },
      scheduled_time: intent.scheduledTime,
      ride_type: intent.rideType,
      provider: 'uber',
    })
    .select()
    .single();

  if (dbError) {
    console.error('Ride DB error:', dbError);
  } else {
    console.log('Created ride booking:', rideRecord?.id);
  }

  return new Response(
    JSON.stringify({
      success: true,
      type: 'ride',
      bookingId: rideRecord?.id,
      rideId: rideRecord?.id, // Keep for backwards compatibility
      intent,
      rideOptions,
      proposal: {
        title: 'Ride Options',
        pickup: intent.pickupAddress || 'Current Location',
        dropoff: intent.dropoffAddress,
        distance: `${distance.toFixed(1)} miles`,
        estimatedDuration: `${Math.round(distance * 2.5)} min`,
      },
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Handle doctor appointment requests
async function handleDoctorRequest(userMessage: string, location: any, userId: string, supabase: any) {
  console.log('Handling doctor request');

  const intent = await parseDoctorIntent(userMessage);
  console.log('Doctor intent:', intent);

  // Mock doctor search results
  const doctors = [
    {
      id: 'doc-1',
      name: 'Dr. Sarah Chen',
      specialty: intent.specialty || 'General Practice',
      rating: 4.9,
      reviewCount: 234,
      distance: 1.2,
      address: '123 Medical Center Dr, Suite 200',
      phone: '(555) 123-4567',
      acceptingNewPatients: true,
      nextAvailable: 'Tomorrow 10:00 AM',
      insurance: ['Blue Cross', 'Aetna', 'United Healthcare'],
    },
    {
      id: 'doc-2',
      name: 'Dr. Michael Rodriguez',
      specialty: intent.specialty || 'General Practice',
      rating: 4.8,
      reviewCount: 189,
      distance: 2.5,
      address: '456 Health Plaza, Floor 3',
      phone: '(555) 234-5678',
      acceptingNewPatients: true,
      nextAvailable: 'Today 3:30 PM',
      insurance: ['Blue Cross', 'Kaiser', 'Medicare'],
    },
    {
      id: 'doc-3',
      name: 'Dr. Emily Thompson',
      specialty: intent.specialty || 'General Practice',
      rating: 4.7,
      reviewCount: 156,
      distance: 3.1,
      address: '789 Wellness Blvd',
      phone: '(555) 345-6789',
      acceptingNewPatients: true,
      nextAvailable: 'Wed 9:00 AM',
      insurance: ['Aetna', 'United Healthcare', 'Humana'],
    },
  ];

  // Generate time slots
  const today = new Date();
  const slots = [];
  for (let day = 0; day < 5; day++) {
    const date = new Date(today);
    date.setDate(date.getDate() + day);
    for (let hour = 9; hour < 17; hour++) {
      if (Math.random() > 0.3) {
        slots.push({
          id: `slot-${day}-${hour}`,
          date: date.toISOString().split('T')[0],
          time: `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`,
          datetime: new Date(date.setHours(hour, 0, 0, 0)).toISOString(),
          available: true,
          type: Math.random() > 0.3 ? 'in-person' : 'telehealth',
        });
      }
    }
  }

  // Get the best doctor and first available slot
  const recommendedDoctor = doctors[0];
  const firstSlot = slots[0];

  // Create booking request in database for doctor appointment
  const { data: bookingRecord, error: dbError } = await supabase
    .from('booking_requests')
    .insert({
      user_id: userId,
      booking_type: 'doctor',
      title: `${intent.specialty || 'Doctor'} Appointment`,
      status: 'searching',
      doctor_info_json: recommendedDoctor,
      appointment_type: intent.appointmentType,
      appointment_time: firstSlot?.datetime || new Date(Date.now() + 86400000).toISOString(),
      symptoms_json: intent.symptoms,
      notes: intent.urgency ? `Urgency: ${intent.urgency}` : undefined,
    })
    .select()
    .single();

  if (dbError) {
    console.error('Doctor booking DB error:', dbError);
  } else {
    console.log('Created doctor booking:', bookingRecord?.id);
  }

  return new Response(
    JSON.stringify({
      success: true,
      type: 'doctor',
      bookingId: bookingRecord?.id,
      intent,
      doctors,
      availableSlots: slots.slice(0, 10),
      proposal: {
        title: `${intent.specialty || 'Doctor'} Appointment`,
        specialty: intent.specialty,
        urgency: intent.urgency,
        appointmentType: intent.appointmentType,
        symptoms: intent.symptoms,
      },
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Handle flight booking requests
async function handleFlightRequest(userMessage: string, location: any, userId: string, supabase: any) {
  console.log('Handling flight request');

  // Step 1: Use OpenAI to parse intent
  const intent = await parseFlightIntent(userMessage, location);
  console.log('Parsed intent:', intent);

  // Step 2: Create booking request in unified booking_requests table
  const { data: bookingRequest, error: bookingError } = await supabase
    .from('booking_requests')
    .insert({
      user_id: userId,
      booking_type: 'flight',
      title: `Trip to ${intent.destination}`,
      origin: intent.origin,
      destination: intent.destination,
      depart_date: intent.departDate,
      return_date: intent.returnDate,
      budget_amount: intent.budget,
      currency: 'USD',
      cabin_class: intent.cabinClass,
      nonstop_only: intent.nonstopOnly,
      travelers_json: [{ type: 'adult', count: intent.travelers }],
      status: 'searching',
    })
    .select()
    .single();

  if (bookingError) {
    console.error('Flight booking creation error:', bookingError);
    return new Response(JSON.stringify({ error: 'Failed to create booking' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  console.log('Created flight booking:', bookingRequest?.id);

  // Step 3: Create agent run record
  const { data: agentRun, error: runError } = await supabase
    .from('agent_runs')
    .insert({
      booking_request_id: bookingRequest.id,
      user_id: userId,
      user_message: userMessage,
      task_plan_json: {
        phases: ['understand', 'search', 'compare', 'propose'],
      },
      current_phase: 'search',
      status: 'running',
    })
    .select()
    .single();

  if (runError) {
    console.error('Agent run error:', runError);
  }

  // Step 4: Search for flights using Duffel
  const flights = await searchFlights({
    origin: intent.origin,
    destination: intent.destination,
    departDate: intent.departDate,
    returnDate: intent.returnDate,
    passengers: intent.travelers,
    cabinClass: intent.cabinClass,
  });

  console.log(`Found ${flights.length} flight options`);

  // Step 5: Update agent run with results
  if (agentRun) {
    await supabase
      .from('agent_runs')
      .update({
        current_phase: 'compare',
        result_json: {
          flights: flights.slice(0, 5), // Top 5 options
          searchComplete: true,
        },
      })
      .eq('id', agentRun.id);
  }

  // Step 6: Update booking status
  await supabase
    .from('booking_requests')
    .update({ status: 'planning' })
    .eq('id', bookingRequest.id);

  // Step 7: Create placeholder calendar events
  const calendarEvents = [];
  if (flights.length > 0) {
    const topFlight = flights[0];

    // Outbound flight event
    calendarEvents.push({
      booking_request_id: bookingRequest.id,
      user_id: userId,
      title: `Flight to ${intent.destination}`,
      description: `${topFlight.carrier} - ${topFlight.flightNumber}`,
      start_time: new Date(intent.departDate).toISOString(),
      end_time: new Date(new Date(intent.departDate).getTime() + topFlight.duration * 60000).toISOString(),
      event_type: 'flight_outbound',
      metadata_json: { offer: topFlight },
    });

    // Return flight event
    calendarEvents.push({
      booking_request_id: bookingRequest.id,
      user_id: userId,
      title: `Return flight from ${intent.destination}`,
      description: `${topFlight.carrier} - Return`,
      start_time: new Date(intent.returnDate).toISOString(),
      end_time: new Date(new Date(intent.returnDate).getTime() + topFlight.duration * 60000).toISOString(),
      event_type: 'flight_return',
      metadata_json: { offer: topFlight },
    });

    await supabase.from('calendar_events').insert(calendarEvents);
  }

  return new Response(
    JSON.stringify({
      success: true,
      type: 'flight',
      bookingId: bookingRequest.id,
      tripId: bookingRequest.id, // Keep for backwards compatibility
      agentRunId: agentRun?.id,
      intent,
      flights: flights.slice(0, 5),
      proposal: {
        title: `Trip to ${intent.destination}`,
        details: {
          origin: intent.origin,
          destination: intent.destination,
          dates: `${formatDate(intent.departDate)} - ${formatDate(intent.returnDate)}`,
          budget: `$${intent.budget.toLocaleString()} total budget`,
          travelers: intent.travelers,
        },
      },
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// Parse ride booking intent
async function parseRideIntent(userMessage: string, location?: any): Promise<RideIntent> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');

  if (openaiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Extract ride booking details from user request. Return JSON with:
- pickupAddress: string (where to pick up, default "Current Location")
- dropoffAddress: string (destination address)
- scheduledTime: ISO string or null (if they want to schedule for later)
- rideType: "standard" | "premium" | "xl" (default "standard")

If user says "here" or doesn't specify pickup, use "Current Location".`,
            },
            { role: 'user', content: userMessage },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const parsed = JSON.parse(data.choices[0].message.content);
        return {
          type: 'ride',
          pickupAddress: parsed.pickupAddress || location?.address || 'Current Location',
          dropoffAddress: parsed.dropoffAddress || 'Destination',
          pickupLat: location?.latitude,
          pickupLng: location?.longitude,
          scheduledTime: parsed.scheduledTime,
          rideType: parsed.rideType || 'standard',
        };
      }
    } catch (error) {
      console.error('Ride intent parsing error:', error);
    }
  }

  // Fallback parsing
  return {
    type: 'ride',
    pickupAddress: location?.address || 'Current Location',
    dropoffAddress: extractDestinationFromMessage(userMessage),
    pickupLat: location?.latitude,
    pickupLng: location?.longitude,
    rideType: 'standard',
  };
}

function extractDestinationFromMessage(message: string): string {
  const patterns = [/to\s+(.+?)(?:\s*$|\s+(?:please|now|asap))/i, /(?:take|drive|bring)\s+me\s+to\s+(.+)/i];
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) return match[1].trim();
  }
  return 'Destination';
}

// Parse doctor appointment intent
async function parseDoctorIntent(userMessage: string): Promise<DoctorIntent> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');

  if (openaiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Extract doctor appointment details from user request. Return JSON with:
- specialty: string (type of doctor needed - General Practice, Dermatology, Cardiology, etc.)
- symptoms: string[] (list of symptoms mentioned)
- urgency: "routine" | "soon" | "urgent"
- preferredDate: ISO date string or null
- preferredTime: string or null (e.g., "morning", "afternoon", "3:00 PM")
- appointmentType: "in-person" | "telehealth"
- insurance: string or null

Infer specialty from symptoms if not explicitly stated:
- skin issues → Dermatology
- heart/chest pain → Cardiology
- general checkup → General Practice
- mental health → Psychiatry`,
            },
            { role: 'user', content: userMessage },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const parsed = JSON.parse(data.choices[0].message.content);
        return {
          type: 'doctor',
          specialty: parsed.specialty || 'General Practice',
          symptoms: parsed.symptoms || [],
          urgency: parsed.urgency || 'routine',
          preferredDate: parsed.preferredDate,
          preferredTime: parsed.preferredTime,
          appointmentType: parsed.appointmentType || 'in-person',
          insurance: parsed.insurance,
        };
      }
    } catch (error) {
      console.error('Doctor intent parsing error:', error);
    }
  }

  // Fallback parsing
  return {
    type: 'doctor',
    specialty: 'General Practice',
    symptoms: [],
    urgency: 'routine',
    appointmentType: 'in-person',
  };
}

// Parse flight booking intent
async function parseFlightIntent(userMessage: string, location?: any) {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const today = new Date();
  const currentDateStr = today.toISOString().split('T')[0];
  const currentYear = today.getFullYear();
  const currentMonth = today.toLocaleString('en-US', { month: 'long' });

  const systemPrompt = `You are a travel planning assistant. Extract trip parameters from user requests.

IMPORTANT: Today's date is ${currentDateStr} (${currentMonth} ${today.getDate()}, ${currentYear}).
When user says "next week", "next month", "this weekend", etc., calculate dates relative to TODAY (${currentDateStr}).

Current user location: ${location?.city || 'Unknown'}, nearest airport: ${location?.nearestAirport || 'Unknown'}

Return JSON with:
- destination: string (city or IATA code)
- origin: string (IATA code, default to user's nearest airport if not specified)
- departDate: ISO date string (MUST be in ${currentYear} or later, calculate from today ${currentDateStr})
- returnDate: ISO date string (default 7 days after depart)
- budget: number (total budget in USD, default 2000)
- cabinClass: "economy" | "premium_economy" | "business" | "first" (default economy)
- nonstopOnly: boolean (default false)
- travelers: number (default 1)

Examples based on today being ${currentDateStr}:
- "next week" → departDate should be ~7 days from ${currentDateStr}
- "next month" → departDate should be in ${new Date(today.getFullYear(), today.getMonth() + 1, 15).toISOString().split('T')[0]}
- "in March" → if March ${currentYear} has passed, use March ${currentYear + 1}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const intent = JSON.parse(data.choices[0].message.content);

    return {
      destination: intent.destination || 'DEST',
      origin: intent.origin || location?.nearestAirport || 'ORIG',
      departDate: intent.departDate || getDefaultDepartDate(),
      returnDate: intent.returnDate || getDefaultReturnDate(),
      budget: intent.budget || 2000,
      cabinClass: intent.cabinClass || 'economy',
      nonstopOnly: intent.nonstopOnly || false,
      travelers: intent.travelers || 1,
    };
  } catch (error) {
    console.error('OpenAI parsing error:', error);
    // Fallback to basic parsing
    return {
      destination: extractDestinationFallback(userMessage),
      origin: location?.nearestAirport || 'SFO',
      departDate: getDefaultDepartDate(),
      returnDate: getDefaultReturnDate(),
      budget: 2000,
      cabinClass: 'economy',
      nonstopOnly: false,
      travelers: 1,
    };
  }
}

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
  return Math.round(R * c * 10) / 10;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

async function searchFlights(params: {
  origin: string;
  destination: string;
  departDate: string;
  returnDate: string;
  passengers: number;
  cabinClass: string;
}) {
  const duffelKey = Deno.env.get('DUFFEL_API_KEY');
  if (!duffelKey) {
    console.warn('Duffel API key not configured, using mock data');
    return getMockFlights(params);
  }

  // Map cabin class to Duffel format
  const cabinClassMap: Record<string, string> = {
    'economy': 'economy',
    'premium_economy': 'premium_economy',
    'business': 'business',
    'first': 'first',
  };

  try {
    console.log('Searching flights with Duffel:', {
      origin: params.origin,
      destination: params.destination,
      departDate: params.departDate.split('T')[0],
      returnDate: params.returnDate.split('T')[0],
    });

    // Create Duffel offer request with return_offers: true to get offers immediately
    const requestBody = {
      data: {
        slices: [
          {
            origin: params.origin,
            destination: params.destination,
            departure_date: params.departDate.split('T')[0],
          },
          {
            origin: params.destination,
            destination: params.origin,
            departure_date: params.returnDate.split('T')[0],
          },
        ],
        passengers: Array(params.passengers).fill({ type: 'adult' }),
        cabin_class: cabinClassMap[params.cabinClass] || 'economy',
        return_offers: true,
        max_connections: 1,
      },
    };

    console.log('Duffel request body:', JSON.stringify(requestBody));

    const response = await fetch('https://api.duffel.com/air/offer_requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${duffelKey}`,
        'Duffel-Version': 'v2',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log('Duffel response status:', response.status);

    if (!response.ok) {
      console.error('Duffel API error:', response.status, responseText);
      return getMockFlights(params);
    }

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse Duffel response:', e);
      return getMockFlights(params);
    }

    const offers = responseData.data?.offers || [];
    console.log(`Duffel returned ${offers.length} offers`);

    if (offers.length === 0) {
      console.log('No offers found, using mock data');
      return getMockFlights(params);
    }

    // Transform Duffel offers to our format
    return offers.slice(0, 10).map((offer: any) => {
      const outboundSlice = offer.slices?.[0];
      const firstSegment = outboundSlice?.segments?.[0];

      // Calculate duration in minutes from ISO 8601 duration (e.g., "PT11H30M")
      let durationMinutes = 0;
      if (outboundSlice?.duration) {
        const durationMatch = outboundSlice.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
        if (durationMatch) {
          durationMinutes = (parseInt(durationMatch[1] || '0') * 60) + parseInt(durationMatch[2] || '0');
        }
      }

      return {
        id: offer.id,
        carrier: offer.owner?.name || 'Unknown Airline',
        flightNumber: firstSegment?.marketing_carrier_flight_number || 'N/A',
        price: parseFloat(offer.total_amount || '0'),
        currency: offer.total_currency || 'USD',
        duration: durationMinutes,
        stops: (outboundSlice?.segments?.length || 1) - 1,
        departureTime: firstSegment?.departing_at || params.departDate,
        arrivalTime: outboundSlice?.segments?.[outboundSlice.segments.length - 1]?.arriving_at || params.departDate,
        cabinClass: params.cabinClass,
        details: outboundSlice?.segments?.length === 1
          ? `Nonstop • ${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
          : `${(outboundSlice?.segments?.length || 1) - 1} stop(s) • ${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`,
      };
    });
  } catch (error) {
    console.error('Duffel search error:', error);
    return getMockFlights(params);
  }
}

function getMockFlights(params: any) {
  return [
    {
      id: 'mock-1',
      carrier: 'United Airlines',
      flightNumber: 'UA 837',
      price: 850,
      currency: 'USD',
      duration: 690,
      stops: 0,
      departureTime: params.departDate,
      arrivalTime: new Date(new Date(params.departDate).getTime() + 690 * 60000).toISOString(),
      cabinClass: params.cabinClass,
      details: 'Nonstop • 11h 30m',
    },
    {
      id: 'mock-2',
      carrier: 'ANA',
      flightNumber: 'NH 7',
      price: 920,
      currency: 'USD',
      duration: 705,
      stops: 0,
      departureTime: params.departDate,
      arrivalTime: new Date(new Date(params.departDate).getTime() + 705 * 60000).toISOString(),
      cabinClass: params.cabinClass,
      details: 'Nonstop • 11h 45m',
    },
    {
      id: 'mock-3',
      carrier: 'Delta',
      flightNumber: 'DL 166',
      price: 720,
      currency: 'USD',
      duration: 860,
      stops: 1,
      departureTime: params.departDate,
      arrivalTime: new Date(new Date(params.departDate).getTime() + 860 * 60000).toISOString(),
      cabinClass: params.cabinClass,
      details: '1 stop • 14h 20m',
    },
  ];
}

function extractDestinationFallback(input: string): string {
  const destinations = ['NRT', 'CDG', 'LHR', 'JFK', 'FCO', 'BCN', 'DXB', 'SIN', 'BKK', 'SYD'];
  const cities = ['Tokyo', 'Paris', 'London', 'New York', 'Rome', 'Barcelona', 'Dubai', 'Singapore', 'Bangkok', 'Sydney'];
  
  for (let i = 0; i < cities.length; i++) {
    if (input.toLowerCase().includes(cities[i].toLowerCase())) {
      return destinations[i];
    }
  }
  
  return 'DEST';
}

function getDefaultDepartDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date.toISOString();
}

function getDefaultReturnDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 21);
  return date.toISOString();
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
