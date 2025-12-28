import { getSupabaseClient } from '@/template';

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  distance: number; // miles
  address: string;
  phone: string;
  acceptingNewPatients: boolean;
  nextAvailable: string;
  photoUrl?: string;
  insurance: string[];
  languages: string[];
}

export interface TimeSlot {
  id: string;
  time: string;
  datetime: string; // ISO format
  available: boolean;
  type: 'in-person' | 'telehealth';
}

export interface AppointmentRequest {
  doctorId: string;
  dateTime: string;
  type: 'in-person' | 'telehealth';
  reason: string;
  notes?: string;
  patientInfo?: {
    name: string;
    phone: string;
    email: string;
    dateOfBirth?: string;
    insurance?: string;
  };
}

export interface AppointmentResult {
  success: boolean;
  appointmentId?: string;
  confirmationNumber?: string;
  doctor?: Doctor;
  dateTime?: string;
  type?: string;
  instructions?: string;
  error?: string;
}

// Cinematic steps for doctor booking
export const CINEMATIC_DOCTOR_STEPS = [
  {
    id: 'understand_symptoms',
    title: 'Understanding Symptoms',
    description: 'Analyzing your health concerns',
    icon: 'medkit',
    color: '#EF4444',
    status: 'pending' as const,
  },
  {
    id: 'find_specialists',
    title: 'Finding Specialists',
    description: 'Searching for qualified doctors',
    icon: 'search',
    color: '#3B82F6',
    status: 'pending' as const,
  },
  {
    id: 'check_availability',
    title: 'Checking Availability',
    description: 'Finding open appointment slots',
    icon: 'calendar',
    color: '#8B5CF6',
    status: 'pending' as const,
  },
  {
    id: 'verify_insurance',
    title: 'Verifying Insurance',
    description: 'Confirming coverage details',
    icon: 'shield-checkmark',
    color: '#10B981',
    status: 'pending' as const,
  },
  {
    id: 'compare_options',
    title: 'Comparing Options',
    description: 'Ranking doctors by fit',
    icon: 'git-compare',
    color: '#F59E0B',
    status: 'pending' as const,
  },
  {
    id: 'select_doctor',
    title: 'Selecting Doctor',
    description: 'Choosing the best match',
    icon: 'person',
    color: '#06B6D4',
    status: 'pending' as const,
  },
  {
    id: 'book_appointment',
    title: 'Booking Appointment',
    description: 'Reserving your time slot',
    icon: 'checkmark-done',
    color: '#EC4899',
    status: 'pending' as const,
  },
  {
    id: 'send_confirmation',
    title: 'Sending Confirmation',
    description: 'Preparing your appointment details',
    icon: 'mail',
    color: '#22C55E',
    status: 'pending' as const,
  },
];

// Search for doctors based on specialty and location
export const searchDoctors = async (params: {
  specialty?: string;
  location?: { latitude: number; longitude: number };
  insurance?: string;
  maxDistance?: number;
}): Promise<Doctor[]> => {
  // In production, this would call a healthcare API (Zocdoc, Healthgrades, etc.)
  // For now, generate realistic mock data

  const specialties = [
    'General Practice',
    'Internal Medicine',
    'Dermatology',
    'Cardiology',
    'Orthopedics',
    'Pediatrics',
    'Psychiatry',
    'OB/GYN',
    'Ophthalmology',
    'ENT',
  ];

  const targetSpecialty = params.specialty || specialties[Math.floor(Math.random() * specialties.length)];

  const mockDoctors: Doctor[] = [
    {
      id: 'doc-1',
      name: 'Dr. Sarah Chen',
      specialty: targetSpecialty,
      rating: 4.9,
      reviewCount: 234,
      distance: 1.2,
      address: '123 Medical Center Dr, Suite 200',
      phone: '(555) 123-4567',
      acceptingNewPatients: true,
      nextAvailable: 'Tomorrow 10:00 AM',
      insurance: ['Blue Cross', 'Aetna', 'United Healthcare', 'Cigna'],
      languages: ['English', 'Mandarin'],
    },
    {
      id: 'doc-2',
      name: 'Dr. Michael Rodriguez',
      specialty: targetSpecialty,
      rating: 4.8,
      reviewCount: 189,
      distance: 2.5,
      address: '456 Health Plaza, Floor 3',
      phone: '(555) 234-5678',
      acceptingNewPatients: true,
      nextAvailable: 'Today 3:30 PM',
      insurance: ['Blue Cross', 'Kaiser', 'Medicare'],
      languages: ['English', 'Spanish'],
    },
    {
      id: 'doc-3',
      name: 'Dr. Emily Thompson',
      specialty: targetSpecialty,
      rating: 4.7,
      reviewCount: 156,
      distance: 3.1,
      address: '789 Wellness Blvd',
      phone: '(555) 345-6789',
      acceptingNewPatients: true,
      nextAvailable: 'Wed 9:00 AM',
      insurance: ['Aetna', 'United Healthcare', 'Humana'],
      languages: ['English'],
    },
    {
      id: 'doc-4',
      name: 'Dr. James Park',
      specialty: targetSpecialty,
      rating: 4.95,
      reviewCount: 312,
      distance: 4.2,
      address: '321 Care Center Way',
      phone: '(555) 456-7890',
      acceptingNewPatients: false,
      nextAvailable: 'Next Week',
      insurance: ['Blue Cross', 'Cigna', 'United Healthcare'],
      languages: ['English', 'Korean'],
    },
  ];

  return mockDoctors;
};

// Get available time slots for a doctor
export const getAvailableSlots = async (
  doctorId: string,
  date: string
): Promise<TimeSlot[]> => {
  // In production, this would query the doctor's calendar system

  const baseDate = new Date(date);
  const slots: TimeSlot[] = [];

  // Generate slots from 9 AM to 5 PM
  for (let hour = 9; hour < 17; hour++) {
    for (let minute of [0, 30]) {
      const slotDate = new Date(baseDate);
      slotDate.setHours(hour, minute, 0, 0);

      // Randomly mark some slots as unavailable
      const available = Math.random() > 0.3;

      const timeStr = slotDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      slots.push({
        id: `slot-${hour}-${minute}`,
        time: timeStr,
        datetime: slotDate.toISOString(),
        available,
        type: Math.random() > 0.3 ? 'in-person' : 'telehealth',
      });
    }
  }

  return slots;
};

// Book a doctor appointment
export const bookDoctorAppointment = async (
  request: AppointmentRequest,
  userId: string
): Promise<AppointmentResult> => {
  const supabase = getSupabaseClient();

  try {
    // Find the doctor info
    const doctors = await searchDoctors({ specialty: undefined });
    const doctor = doctors.find(d => d.id === request.doctorId) || doctors[0];

    // Generate confirmation number
    const confirmationNumber = `APT-${Date.now().toString(36).toUpperCase()}`;

    // Store appointment in database
    const { data: appointment, error: dbError } = await supabase
      .from('doctor_appointments')
      .insert({
        user_id: userId,
        doctor_id: request.doctorId,
        doctor_name: doctor.name,
        specialty: doctor.specialty,
        appointment_time: request.dateTime,
        appointment_type: request.type,
        reason: request.reason,
        notes: request.notes,
        confirmation_number: confirmationNumber,
        status: 'confirmed',
        address: doctor.address,
        phone: doctor.phone,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
    }

    // Generate instructions based on appointment type
    const instructions = request.type === 'telehealth'
      ? 'You will receive a video call link 15 minutes before your appointment. Please ensure you have a stable internet connection and are in a quiet location.'
      : `Please arrive 15 minutes early to complete paperwork. Bring your insurance card and a valid ID. The office is located at ${doctor.address}.`;

    return {
      success: true,
      appointmentId: appointment?.id || `apt-${Date.now()}`,
      confirmationNumber,
      doctor,
      dateTime: request.dateTime,
      type: request.type,
      instructions,
    };
  } catch (error) {
    console.error('Appointment booking error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Booking failed',
    };
  }
};

// Get user's appointment history
export const getAppointmentHistory = async (userId: string) => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('doctor_appointments')
    .select('*')
    .eq('user_id', userId)
    .order('appointment_time', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching appointments:', error);
    return { data: [], error: error.message };
  }

  return { data: data || [], error: null };
};

// Cancel an appointment
export const cancelAppointment = async (appointmentId: string) => {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('doctor_appointments')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', appointmentId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
};

// Reschedule an appointment
export const rescheduleAppointment = async (
  appointmentId: string,
  newDateTime: string
) => {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('doctor_appointments')
    .update({
      appointment_time: newDateTime,
      status: 'rescheduled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', appointmentId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
};
