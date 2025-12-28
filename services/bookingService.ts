import { getSupabaseClient } from '@/template';
import {
  BookingRequest,
  BookingType,
  BookingStatus,
  CreateBookingParams,
  UpdateBookingParams,
  CalendarEvent,
} from '../types';

// ==================== CREATE OPERATIONS ====================

export const createBooking = async (
  params: CreateBookingParams,
  userId: string
): Promise<{ data: BookingRequest | null; error: string | null }> => {
  const supabase = getSupabaseClient();

  try {
    const bookingData: Partial<BookingRequest> = {
      user_id: userId,
      booking_type: params.booking_type,
      title: params.title,
      status: 'planning',
    };

    // Add type-specific fields
    switch (params.booking_type) {
      case 'flight':
        Object.assign(bookingData, {
          origin: params.origin,
          destination: params.destination,
          depart_date: params.depart_date,
          return_date: params.return_date,
          travelers_json: params.travelers ? [{ type: 'adult', count: params.travelers }] : [],
          cabin_class: params.cabin_class || 'economy',
          budget_amount: params.budget,
          currency: 'USD',
        });
        break;

      case 'ride':
        Object.assign(bookingData, {
          pickup_location_json: params.pickup,
          dropoff_location_json: params.dropoff,
          scheduled_time: params.scheduled_time,
          ride_type: params.ride_type || 'standard',
          provider: 'uber',
        });
        break;

      case 'doctor':
        Object.assign(bookingData, {
          doctor_info_json: {
            id: params.doctor_id,
            name: params.doctor_name,
            specialty: params.specialty,
          },
          appointment_time: params.appointment_time,
          appointment_type: params.appointment_type || 'in-person',
          symptoms_json: params.symptoms,
          notes: params.reason,
        });
        break;
    }

    const { data, error } = await supabase
      .from('booking_requests')
      .insert(bookingData)
      .select()
      .single();

    if (error) {
      console.error('Create booking error:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Create booking exception:', err);
    return { data: null, error: err instanceof Error ? err.message : 'Failed to create booking' };
  }
};

// ==================== READ OPERATIONS ====================

export const getUserBookings = async (
  userId?: string,
  options?: {
    type?: BookingType;
    status?: BookingStatus | BookingStatus[];
    limit?: number;
    offset?: number;
  }
): Promise<{ data: BookingRequest[]; error: string | null }> => {
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('booking_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (options?.type) {
      query = query.eq('booking_type', options.type);
    }

    if (options?.status) {
      if (Array.isArray(options.status)) {
        query = query.in('status', options.status);
      } else {
        query = query.eq('status', options.status);
      }
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get bookings error:', error);
      return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error('Get bookings exception:', err);
    return { data: [], error: err instanceof Error ? err.message : 'Failed to fetch bookings' };
  }
};

export const getBookingById = async (
  bookingId: string
): Promise<{
  data: { booking: BookingRequest; events: CalendarEvent[] } | null;
  error: string | null;
}> => {
  const supabase = getSupabaseClient();

  try {
    // Fetch booking and related calendar events in parallel
    const [bookingResult, eventsResult] = await Promise.all([
      supabase
        .from('booking_requests')
        .select('*')
        .eq('id', bookingId)
        .single(),
      supabase
        .from('calendar_events')
        .select('*')
        .eq('booking_request_id', bookingId)
        .order('start_time', { ascending: true }),
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
  } catch (err) {
    console.error('Get booking by ID exception:', err);
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch booking' };
  }
};

export const getUpcomingBookings = async (
  userId: string,
  limit: number = 5
): Promise<{ data: BookingRequest[]; error: string | null }> => {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  try {
    // Get upcoming bookings based on their type-specific date fields
    const { data, error } = await supabase
      .from('booking_requests')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['planning', 'searching', 'watching', 'holding', 'booked', 'confirmed'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { data: [], error: error.message };
    }

    // Filter and sort by upcoming date
    const upcoming = (data || [])
      .filter(booking => {
        const bookingDate = booking.depart_date || booking.scheduled_time || booking.appointment_time;
        return !bookingDate || new Date(bookingDate) >= new Date(now);
      })
      .sort((a, b) => {
        const dateA = a.depart_date || a.scheduled_time || a.appointment_time || a.created_at;
        const dateB = b.depart_date || b.scheduled_time || b.appointment_time || b.created_at;
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      });

    return { data: upcoming, error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Failed to fetch upcoming bookings' };
  }
};

export const getBookingHistory = async (
  userId: string,
  type?: BookingType
): Promise<{ data: BookingRequest[]; error: string | null }> => {
  return getUserBookings(userId, {
    type,
    status: ['completed', 'cancelled'],
    limit: 50,
  });
};

// ==================== UPDATE OPERATIONS ====================

export const updateBooking = async (
  params: UpdateBookingParams
): Promise<{ data: BookingRequest | null; error: string | null }> => {
  const supabase = getSupabaseClient();

  try {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // Add provided fields
    if (params.status) updateData.status = params.status;
    if (params.confirmation_number) updateData.confirmation_number = params.confirmation_number;
    if (params.provider_booking_id) updateData.provider_booking_id = params.provider_booking_id;
    if (params.notes !== undefined) updateData.notes = params.notes;
    if (params.scheduled_time) updateData.scheduled_time = params.scheduled_time;
    if (params.appointment_time) updateData.appointment_time = params.appointment_time;
    if (params.driver_info_json) updateData.driver_info_json = params.driver_info_json;
    if (params.doctor_info_json) updateData.doctor_info_json = params.doctor_info_json;

    // Set timestamp for terminal statuses
    if (params.status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    } else if (params.status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('booking_requests')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to update booking' };
  }
};

export const updateBookingStatus = async (
  bookingId: string,
  status: BookingStatus
): Promise<{ success: boolean; error: string | null }> => {
  const result = await updateBooking({ id: bookingId, status });
  return { success: result.data !== null, error: result.error };
};

export const confirmBooking = async (
  bookingId: string,
  confirmationNumber: string,
  providerBookingId?: string
): Promise<{ success: boolean; error: string | null }> => {
  const result = await updateBooking({
    id: bookingId,
    status: 'confirmed',
    confirmation_number: confirmationNumber,
    provider_booking_id: providerBookingId,
  });
  return { success: result.data !== null, error: result.error };
};

// ==================== DELETE OPERATIONS ====================

export const cancelBooking = async (
  bookingId: string,
  reason?: string
): Promise<{ success: boolean; error: string | null }> => {
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('booking_requests')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        notes: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to cancel booking' };
  }
};

export const deleteBooking = async (
  bookingId: string
): Promise<{ success: boolean; error: string | null }> => {
  const supabase = getSupabaseClient();

  try {
    // Only allow deletion of planning/cancelled bookings
    const { data: booking } = await supabase
      .from('booking_requests')
      .select('status')
      .eq('id', bookingId)
      .single();

    if (booking && !['planning', 'cancelled'].includes(booking.status)) {
      return {
        success: false,
        error: 'Can only delete bookings in planning or cancelled status',
      };
    }

    const { error } = await supabase
      .from('booking_requests')
      .delete()
      .eq('id', bookingId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete booking' };
  }
};

// ==================== CALENDAR EVENT OPERATIONS ====================

export const addCalendarEvent = async (
  bookingId: string,
  userId: string,
  event: Omit<CalendarEvent, 'id' | 'booking_request_id' | 'user_id' | 'created_at'>
): Promise<{ data: CalendarEvent | null; error: string | null }> => {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        booking_request_id: bookingId,
        user_id: userId,
        ...event,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to add calendar event' };
  }
};

export const getCalendarEvents = async (
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<{ data: CalendarEvent[]; error: string | null }> => {
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: true });

    if (startDate) {
      query = query.gte('start_time', startDate);
    }

    if (endDate) {
      query = query.lte('end_time', endDate);
    }

    const { data, error } = await query;

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Failed to fetch calendar events' };
  }
};

// ==================== HELPER FUNCTIONS ====================

export const getBookingTypeIcon = (type: BookingType): string => {
  switch (type) {
    case 'flight':
      return 'airplane';
    case 'ride':
      return 'car';
    case 'doctor':
      return 'medkit';
    default:
      return 'calendar';
  }
};

export const getBookingTypeColor = (type: BookingType): string => {
  switch (type) {
    case 'flight':
      return '#3B82F6'; // Blue
    case 'ride':
      return '#000000'; // Black (Uber)
    case 'doctor':
      return '#EF4444'; // Red
    default:
      return '#6B7280'; // Gray
  }
};

export const getStatusColor = (status: BookingStatus): string => {
  const colors: Record<BookingStatus, string> = {
    planning: '#9CA3AF',
    searching: '#3B82F6',
    watching: '#3B82F6',
    holding: '#F59E0B',
    booked: '#10B981',
    confirmed: '#10B981',
    'in-progress': '#8B5CF6',
    completed: '#6B7280',
    cancelled: '#EF4444',
    'needs-attention': '#EF4444',
  };
  return colors[status] || '#6B7280';
};

export const formatBookingDate = (booking: BookingRequest): string => {
  const date = booking.depart_date || booking.scheduled_time || booking.appointment_time;
  if (!date) return 'No date set';

  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const getBookingSubtitle = (booking: BookingRequest): string => {
  switch (booking.booking_type) {
    case 'flight':
      return `${booking.origin || '?'} → ${booking.destination || '?'}`;
    case 'ride':
      const pickup = booking.pickup_location_json?.address || 'Pickup';
      const dropoff = booking.dropoff_location_json?.address || 'Destination';
      return `${pickup} → ${dropoff}`;
    case 'doctor':
      return booking.doctor_info_json?.name || booking.doctor_info_json?.specialty || 'Doctor appointment';
    default:
      return '';
  }
};

// Legacy function aliases for backwards compatibility
export const getUserTrips = getUserBookings;
export const getTripById = getBookingById;
export const updateTripStatus = updateBookingStatus;
