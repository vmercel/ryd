// Calendar-Aware Intent Service
// Smart scheduling that detects conflicts and auto-adjusts booking times

import { getSupabaseClient } from '@/template';
import { BookingRequest, CalendarEvent, BookingType } from '../types';
import { getUpcomingBookings, getCalendarEvents } from './bookingService';

// Buffer times in minutes
const BUFFER_TIMES = {
  // Time to get to airport before flight
  airportArrival: {
    domestic: 90,      // 1.5 hours for domestic
    international: 120, // 2 hours for international
  },
  // Average travel time to airport (will be adjusted based on actual location)
  travelToAirport: 60, // 1 hour default
  // Buffer between appointments
  appointmentBuffer: 30,
  // Buffer after ride arrival
  rideBuffer: 15,
};

// International destinations (simplified check)
const INTERNATIONAL_DESTINATIONS = [
  'CDG', 'LHR', 'NRT', 'HND', 'FCO', 'BCN', 'AMS', 'FRA', 'DXB', 'SIN',
  'BKK', 'SYD', 'MEL', 'HKG', 'ICN', 'PEK', 'PVG', 'DEL', 'BOM', 'GRU',
  'Paris', 'London', 'Tokyo', 'Rome', 'Barcelona', 'Amsterdam', 'Frankfurt',
  'Dubai', 'Singapore', 'Bangkok', 'Sydney', 'Melbourne', 'Hong Kong', 'Seoul',
  'Beijing', 'Shanghai', 'Delhi', 'Mumbai', 'Sao Paulo',
];

export interface ScheduleConflict {
  type: 'hard' | 'soft';
  conflictingEvent: BookingRequest | CalendarEvent;
  requestedTime: Date;
  conflictTime: Date;
  description: string;
  suggestedTime?: Date;
  explanation?: string;
}

export interface CalendarAwareResult {
  hasConflict: boolean;
  conflicts: ScheduleConflict[];
  adjustedTime?: Date;
  originalTime: Date;
  explanation?: string;
  warnings: string[];
}

export interface ScheduleItem {
  id: string;
  type: 'flight' | 'ride' | 'doctor' | 'event';
  title: string;
  startTime: Date;
  endTime?: Date;
  location?: string;
  details?: string;
  status?: string;
}

export interface ScheduleBriefing {
  period: 'day' | 'week' | 'month' | 'year';
  startDate: Date;
  endDate: Date;
  items: ScheduleItem[];
  summary: string;
  busyPeriods: { start: Date; end: Date; description: string }[];
  gaps: { start: Date; end: Date; duration: number }[];
}

/**
 * Check for scheduling conflicts and suggest adjustments
 */
export async function checkCalendarConflicts(
  userId: string,
  bookingType: BookingType,
  requestedTime: Date,
  intent: any
): Promise<CalendarAwareResult> {
  const conflicts: ScheduleConflict[] = [];
  const warnings: string[] = [];
  let adjustedTime: Date | undefined;
  let explanation: string | undefined;

  try {
    // Get existing bookings and calendar events
    const [bookingsResult, eventsResult] = await Promise.all([
      getUpcomingBookings(userId, 20),
      getCalendarEvents(
        userId,
        new Date(requestedTime.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        new Date(requestedTime.getTime() + 24 * 60 * 60 * 1000).toISOString()
      ),
    ]);

    const bookings = bookingsResult.data || [];
    const events = eventsResult.data || [];

    // Combine all scheduled items
    const scheduledItems: Array<{
      id: string;
      type: string;
      startTime: Date;
      endTime: Date;
      title: string;
      destination?: string;
    }> = [];

    // Process bookings
    for (const booking of bookings) {
      const bookingTime = booking.depart_date || booking.scheduled_time || booking.appointment_time;
      if (bookingTime) {
        const startTime = new Date(bookingTime);
        let endTime = new Date(startTime);

        // Estimate end times based on booking type
        if (booking.booking_type === 'flight') {
          // Flight duration estimate: 2-12 hours depending on destination
          endTime = new Date(startTime.getTime() + 6 * 60 * 60 * 1000);
        } else if (booking.booking_type === 'ride') {
          // Ride duration: 30 min - 2 hours
          endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
        } else if (booking.booking_type === 'doctor') {
          // Appointment duration: 30 min - 1 hour
          endTime = new Date(startTime.getTime() + 45 * 60 * 1000);
        }

        scheduledItems.push({
          id: booking.id || '',
          type: booking.booking_type || 'unknown',
          startTime,
          endTime,
          title: booking.title || `${booking.booking_type} booking`,
          destination: booking.destination,
        });
      }
    }

    // Process calendar events
    for (const event of events) {
      if (event.start_time) {
        scheduledItems.push({
          id: event.id || '',
          type: 'event',
          startTime: new Date(event.start_time),
          endTime: event.end_time ? new Date(event.end_time) : new Date(new Date(event.start_time).getTime() + 60 * 60 * 1000),
          title: event.title || 'Calendar event',
        });
      }
    }

    // Check for conflicts based on booking type
    if (bookingType === 'ride') {
      // For rides: Check if there's a flight soon that this ride should be scheduled for
      const flightConflict = checkRideAgainstFlights(requestedTime, scheduledItems, intent);
      if (flightConflict) {
        conflicts.push(flightConflict);
        adjustedTime = flightConflict.suggestedTime;
        explanation = flightConflict.explanation;
      }

      // Check if ride overlaps with appointments
      const appointmentConflict = checkOverlapWithAppointments(requestedTime, scheduledItems, 'ride');
      if (appointmentConflict) {
        conflicts.push(appointmentConflict);
      }
    } else if (bookingType === 'doctor') {
      // For doctor appointments: Check against flights and other appointments
      const overlapConflict = checkOverlapWithAll(requestedTime, scheduledItems, 'doctor');
      if (overlapConflict) {
        conflicts.push(overlapConflict);
        // Try to find next available slot
        adjustedTime = findNextAvailableSlot(requestedTime, scheduledItems, 45);
        if (adjustedTime) {
          explanation = `Rescheduled from ${formatTime(requestedTime)} to ${formatTime(adjustedTime)} to avoid conflict with your ${overlapConflict.conflictingEvent.type || 'scheduled event'}.`;
        }
      }
    } else if (bookingType === 'flight') {
      // For flights: Check if there's enough time after previous commitments
      const priorConflict = checkPriorCommitments(requestedTime, scheduledItems, intent);
      if (priorConflict) {
        conflicts.push(priorConflict);
        warnings.push(priorConflict.description);
      }
    }

    // Add general warnings
    if (scheduledItems.length > 3) {
      warnings.push(`You have ${scheduledItems.length} other events scheduled around this time.`);
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
      adjustedTime,
      originalTime: requestedTime,
      explanation,
      warnings,
    };
  } catch (error) {
    console.error('Calendar conflict check error:', error);
    return {
      hasConflict: false,
      conflicts: [],
      originalTime: requestedTime,
      warnings: ['Could not check calendar for conflicts.'],
    };
  }
}

/**
 * Check if a ride request conflicts with an upcoming flight
 */
function checkRideAgainstFlights(
  requestedTime: Date,
  scheduledItems: Array<{ id: string; type: string; startTime: Date; endTime: Date; title: string; destination?: string }>,
  intent: any
): ScheduleConflict | null {
  // Find flights within the next 6 hours of the requested ride time
  const flights = scheduledItems.filter(
    item => item.type === 'flight' &&
    item.startTime.getTime() > requestedTime.getTime() &&
    item.startTime.getTime() <= requestedTime.getTime() + 6 * 60 * 60 * 1000
  );

  if (flights.length === 0) return null;

  // Find the closest flight
  const closestFlight = flights.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0];
  const flightTime = closestFlight.startTime;

  // Check if destination mentions airport
  const isAirportRide = intent?.dropoffAddress?.toLowerCase().includes('airport') ||
    intent?.destination?.toLowerCase().includes('airport');

  // Determine if it's international
  const isInternational = closestFlight.destination
    ? INTERNATIONAL_DESTINATIONS.some(d =>
        closestFlight.destination?.toLowerCase().includes(d.toLowerCase()) ||
        closestFlight.title?.toLowerCase().includes(d.toLowerCase())
      )
    : false;

  const checkInBuffer = isInternational
    ? BUFFER_TIMES.airportArrival.international
    : BUFFER_TIMES.airportArrival.domestic;

  // Calculate ideal departure time for the ride
  const idealRideTime = new Date(
    flightTime.getTime() - (BUFFER_TIMES.travelToAirport + checkInBuffer) * 60 * 1000
  );

  // If requested time is the same as flight time (conflict!)
  if (Math.abs(requestedTime.getTime() - flightTime.getTime()) < 30 * 60 * 1000) {
    return {
      type: 'hard',
      conflictingEvent: { type: 'flight', startTime: flightTime, title: closestFlight.title } as any,
      requestedTime,
      conflictTime: flightTime,
      description: `You have a flight at ${formatTime(flightTime)}. You cannot schedule a ride at the same time.`,
      suggestedTime: idealRideTime,
      explanation: `I've scheduled your ride to the airport for ${formatTime(idealRideTime)} instead of ${formatTime(requestedTime)}. This allows ${BUFFER_TIMES.travelToAirport / 60} hour for the trip to the airport and ${checkInBuffer / 60} ${isInternational ? 'hours' : 'hour'} for check-in formalities before your ${formatTime(flightTime)} flight.`,
    };
  }

  // If ride is after flight time (probably not for airport)
  if (requestedTime.getTime() > flightTime.getTime()) {
    return null;
  }

  // If ride time doesn't leave enough buffer for the flight
  const timeToFlight = (flightTime.getTime() - requestedTime.getTime()) / (60 * 1000);
  const requiredBuffer = BUFFER_TIMES.travelToAirport + checkInBuffer;

  if (isAirportRide && timeToFlight < requiredBuffer) {
    return {
      type: 'soft',
      conflictingEvent: { type: 'flight', startTime: flightTime, title: closestFlight.title } as any,
      requestedTime,
      conflictTime: flightTime,
      description: `Your ride at ${formatTime(requestedTime)} may not leave enough time for your ${formatTime(flightTime)} flight.`,
      suggestedTime: idealRideTime,
      explanation: `I've adjusted your ride to ${formatTime(idealRideTime)} to ensure you have ${BUFFER_TIMES.travelToAirport} minutes travel time plus ${checkInBuffer} minutes for ${isInternational ? 'international' : 'domestic'} check-in before your ${formatTime(flightTime)} flight.`,
    };
  }

  return null;
}

/**
 * Check for overlaps with appointments
 */
function checkOverlapWithAppointments(
  requestedTime: Date,
  scheduledItems: Array<{ id: string; type: string; startTime: Date; endTime: Date; title: string }>,
  bookingType: string
): ScheduleConflict | null {
  const estimatedDuration = bookingType === 'ride' ? 60 : bookingType === 'doctor' ? 45 : 60;
  const requestedEnd = new Date(requestedTime.getTime() + estimatedDuration * 60 * 1000);

  for (const item of scheduledItems) {
    // Check if times overlap
    if (
      (requestedTime >= item.startTime && requestedTime < item.endTime) ||
      (requestedEnd > item.startTime && requestedEnd <= item.endTime) ||
      (requestedTime <= item.startTime && requestedEnd >= item.endTime)
    ) {
      return {
        type: 'hard',
        conflictingEvent: item as any,
        requestedTime,
        conflictTime: item.startTime,
        description: `This time conflicts with your ${item.title} at ${formatTime(item.startTime)}.`,
      };
    }
  }

  return null;
}

/**
 * Check for overlaps with all scheduled items
 */
function checkOverlapWithAll(
  requestedTime: Date,
  scheduledItems: Array<{ id: string; type: string; startTime: Date; endTime: Date; title: string }>,
  bookingType: string
): ScheduleConflict | null {
  return checkOverlapWithAppointments(requestedTime, scheduledItems, bookingType);
}

/**
 * Check prior commitments before a flight
 */
function checkPriorCommitments(
  flightTime: Date,
  scheduledItems: Array<{ id: string; type: string; startTime: Date; endTime: Date; title: string }>,
  intent: any
): ScheduleConflict | null {
  // Find any events that end within 3 hours before the flight
  const minBufferBeforeFlight = 3 * 60 * 60 * 1000; // 3 hours

  for (const item of scheduledItems) {
    if (item.type === 'flight') continue; // Skip other flights

    const timeBetween = flightTime.getTime() - item.endTime.getTime();

    if (timeBetween > 0 && timeBetween < minBufferBeforeFlight) {
      return {
        type: 'soft',
        conflictingEvent: item as any,
        requestedTime: flightTime,
        conflictTime: item.endTime,
        description: `Warning: Your ${item.title} ends at ${formatTime(item.endTime)}, which is only ${Math.round(timeBetween / (60 * 1000))} minutes before your flight.`,
      };
    }
  }

  return null;
}

/**
 * Find the next available time slot
 */
function findNextAvailableSlot(
  preferredTime: Date,
  scheduledItems: Array<{ id: string; type: string; startTime: Date; endTime: Date; title: string }>,
  durationMinutes: number
): Date | null {
  // Sort items by start time
  const sorted = [...scheduledItems].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  // Try slots starting from preferred time
  let candidateTime = new Date(preferredTime);
  const maxAttempts = 24; // Try up to 24 slots (covering several hours)

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidateEnd = new Date(candidateTime.getTime() + durationMinutes * 60 * 1000);
    let hasConflict = false;

    for (const item of sorted) {
      if (
        (candidateTime >= item.startTime && candidateTime < item.endTime) ||
        (candidateEnd > item.startTime && candidateEnd <= item.endTime)
      ) {
        hasConflict = true;
        // Move candidate to after this event
        candidateTime = new Date(item.endTime.getTime() + BUFFER_TIMES.appointmentBuffer * 60 * 1000);
        break;
      }
    }

    if (!hasConflict) {
      return candidateTime;
    }
  }

  return null;
}

/**
 * Get a schedule briefing for a time period
 */
export async function getScheduleBriefing(
  userId: string,
  period: 'day' | 'week' | 'month' | 'year'
): Promise<ScheduleBriefing> {
  const now = new Date();
  let startDate = new Date(now);
  let endDate = new Date(now);

  // Set date range based on period
  startDate.setHours(0, 0, 0, 0);

  switch (period) {
    case 'day':
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'week':
      endDate.setDate(endDate.getDate() + 7);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'month':
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'year':
      endDate.setFullYear(endDate.getFullYear() + 1);
      endDate.setHours(23, 59, 59, 999);
      break;
  }

  const items: ScheduleItem[] = [];
  const busyPeriods: { start: Date; end: Date; description: string }[] = [];
  const gaps: { start: Date; end: Date; duration: number }[] = [];

  try {
    // Get bookings
    const bookingsResult = await getUpcomingBookings(userId, 50);
    const bookings = (bookingsResult.data || []).filter(booking => {
      const bookingTime = booking.depart_date || booking.scheduled_time || booking.appointment_time;
      if (!bookingTime) return false;
      const time = new Date(bookingTime);
      return time >= startDate && time <= endDate;
    });

    // Get calendar events
    const eventsResult = await getCalendarEvents(
      userId,
      startDate.toISOString(),
      endDate.toISOString()
    );
    const events = eventsResult.data || [];

    // Convert bookings to schedule items
    for (const booking of bookings) {
      const bookingTime = booking.depart_date || booking.scheduled_time || booking.appointment_time;
      if (!bookingTime) continue;

      const startTime = new Date(bookingTime);
      let endTime = new Date(startTime);
      let details = '';

      if (booking.booking_type === 'flight') {
        endTime = new Date(startTime.getTime() + 6 * 60 * 60 * 1000);
        details = `${booking.origin || 'Origin'} to ${booking.destination || 'Destination'}`;
      } else if (booking.booking_type === 'ride') {
        endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
        details = booking.dropoff_location_json?.address || 'Ride';
      } else if (booking.booking_type === 'doctor') {
        endTime = new Date(startTime.getTime() + 45 * 60 * 1000);
        details = booking.doctor_info_json?.name || booking.doctor_info_json?.specialty || 'Doctor appointment';
      }

      items.push({
        id: booking.id || '',
        type: booking.booking_type || 'flight',
        title: booking.title || `${booking.booking_type} booking`,
        startTime,
        endTime,
        details,
        status: booking.status,
      });
    }

    // Convert calendar events to schedule items
    for (const event of events) {
      if (!event.start_time) continue;

      items.push({
        id: event.id || '',
        type: 'event',
        title: event.title || 'Event',
        startTime: new Date(event.start_time),
        endTime: event.end_time ? new Date(event.end_time) : undefined,
        details: event.description,
      });
    }

    // Sort items by start time
    items.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    // Find busy periods (consecutive events)
    for (let i = 0; i < items.length; i++) {
      const current = items[i];
      const busyStart = current.startTime;
      let busyEnd = current.endTime || new Date(current.startTime.getTime() + 60 * 60 * 1000);
      let description = current.title;

      // Check for consecutive events
      while (i + 1 < items.length) {
        const next = items[i + 1];
        const gapMinutes = (next.startTime.getTime() - busyEnd.getTime()) / (60 * 1000);

        if (gapMinutes <= 30) {
          // Events are close together, extend busy period
          busyEnd = next.endTime || new Date(next.startTime.getTime() + 60 * 60 * 1000);
          description += `, ${next.title}`;
          i++;
        } else {
          break;
        }
      }

      busyPeriods.push({ start: busyStart, end: busyEnd, description });
    }

    // Find gaps between events (only for day/week view)
    if (period === 'day' || period === 'week') {
      for (let i = 0; i < items.length - 1; i++) {
        const current = items[i];
        const next = items[i + 1];
        const currentEnd = current.endTime || new Date(current.startTime.getTime() + 60 * 60 * 1000);

        const gapMs = next.startTime.getTime() - currentEnd.getTime();
        const gapMinutes = gapMs / (60 * 1000);

        if (gapMinutes >= 60) {
          gaps.push({
            start: currentEnd,
            end: next.startTime,
            duration: gapMinutes,
          });
        }
      }
    }

    // Generate natural language summary
    const summary = generateBriefingSummary(period, items, busyPeriods, gaps);

    return {
      period,
      startDate,
      endDate,
      items,
      summary,
      busyPeriods,
      gaps,
    };
  } catch (error) {
    console.error('Schedule briefing error:', error);
    return {
      period,
      startDate,
      endDate,
      items: [],
      summary: 'Unable to retrieve your schedule at this time.',
      busyPeriods: [],
      gaps: [],
    };
  }
}

/**
 * Generate a natural language summary of the schedule
 */
function generateBriefingSummary(
  period: 'day' | 'week' | 'month' | 'year',
  items: ScheduleItem[],
  busyPeriods: { start: Date; end: Date; description: string }[],
  gaps: { start: Date; end: Date; duration: number }[]
): string {
  if (items.length === 0) {
    return `You have no scheduled events for ${period === 'day' ? 'today' : `the ${period}`}.`;
  }

  const parts: string[] = [];

  // Period intro
  const periodLabel = period === 'day' ? 'Today' : period === 'week' ? 'This week' : period === 'month' ? 'This month' : 'This year';
  parts.push(`${periodLabel}, you have ${items.length} scheduled ${items.length === 1 ? 'item' : 'items'}.`);

  // Group by type
  const flights = items.filter(i => i.type === 'flight');
  const rides = items.filter(i => i.type === 'ride');
  const doctors = items.filter(i => i.type === 'doctor');
  const events = items.filter(i => i.type === 'event');

  // List items in natural language
  const itemDescriptions: string[] = [];

  for (const item of items.slice(0, 5)) { // Limit to first 5 for brevity
    const timeStr = formatTime(item.startTime);
    const dateStr = formatDate(item.startTime);

    if (period === 'day') {
      if (item.type === 'flight') {
        itemDescriptions.push(`a ${timeStr} flight ${item.details ? `(${item.details})` : ''}`);
      } else if (item.type === 'ride') {
        itemDescriptions.push(`a ${timeStr} ride ${item.details ? `to ${item.details}` : ''}`);
      } else if (item.type === 'doctor') {
        itemDescriptions.push(`a ${timeStr} doctor's appointment ${item.details ? `with ${item.details}` : ''}`);
      } else {
        itemDescriptions.push(`${item.title} at ${timeStr}`);
      }
    } else {
      if (item.type === 'flight') {
        itemDescriptions.push(`${dateStr}: ${timeStr} flight ${item.details ? `(${item.details})` : ''}`);
      } else if (item.type === 'ride') {
        itemDescriptions.push(`${dateStr}: ${timeStr} ride`);
      } else if (item.type === 'doctor') {
        itemDescriptions.push(`${dateStr}: ${timeStr} doctor's appointment`);
      } else {
        itemDescriptions.push(`${dateStr}: ${item.title}`);
      }
    }
  }

  if (itemDescriptions.length > 0) {
    if (period === 'day') {
      parts.push(`You have ${itemDescriptions.join(', then ')}.`);
    } else {
      parts.push(itemDescriptions.join('. ') + '.');
    }
  }

  if (items.length > 5) {
    parts.push(`And ${items.length - 5} more events.`);
  }

  // Mention gaps for day view
  if (period === 'day' && gaps.length > 0) {
    const significantGaps = gaps.filter(g => g.duration >= 120);
    if (significantGaps.length > 0) {
      const gapStr = significantGaps
        .map(g => `${formatTime(g.start)} to ${formatTime(g.end)}`)
        .join(' and ');
      parts.push(`You have free time ${gapStr}.`);
    }
  }

  return parts.join(' ');
}

/**
 * Detect if user is requesting a schedule briefing
 */
export function detectBriefingRequest(message: string): { isBriefing: boolean; period: 'day' | 'week' | 'month' | 'year' | null } {
  const lower = message.toLowerCase();

  const briefingKeywords = [
    'briefing', 'brief me', 'schedule', 'what do i have', 'what\'s on', 'what is on',
    'my day', 'my week', 'my month', 'my calendar', 'upcoming', 'planned',
    'what\'s happening', 'what is happening', 'agenda', 'itinerary',
  ];

  const hasBriefingKeyword = briefingKeywords.some(k => lower.includes(k));

  if (!hasBriefingKeyword) {
    return { isBriefing: false, period: null };
  }

  // Detect period
  if (lower.includes('today') || lower.includes('the day') || lower.includes('my day')) {
    return { isBriefing: true, period: 'day' };
  }
  if (lower.includes('week') || lower.includes('next 7 days')) {
    return { isBriefing: true, period: 'week' };
  }
  if (lower.includes('month') || lower.includes('next 30 days')) {
    return { isBriefing: true, period: 'month' };
  }
  if (lower.includes('year') || lower.includes('next 12 months')) {
    return { isBriefing: true, period: 'year' };
  }

  // Default to day if no specific period mentioned
  return { isBriefing: true, period: 'day' };
}

// Helper functions
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
