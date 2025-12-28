// Atlas Concierge Type Definitions

export interface UserProfile {
  id: string;
  full_name?: string;
  phone?: string;
  home_airport?: string;
  timezone?: string;
  prefs_json?: Record<string, any>;
  loyalty_json?: Record<string, any>;
  passport_json?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

// Booking Types
export type BookingType = 'flight' | 'ride' | 'doctor';

export type BookingStatus =
  | 'planning'
  | 'searching'
  | 'watching'
  | 'holding'
  | 'booked'
  | 'confirmed'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'needs-attention';

// Unified Booking Request Interface
export interface BookingRequest {
  id: string;
  user_id: string;
  booking_type: BookingType;
  title: string;
  status?: BookingStatus;
  provider?: string;
  provider_booking_id?: string;
  confirmation_number?: string;
  notes?: string;

  // Flight-specific fields
  origin?: string;
  destination?: string;
  depart_date?: string;
  return_date?: string;
  travelers_json?: any[];
  budget_amount?: number;
  currency?: string;
  cabin_class?: string;
  nonstop_only?: boolean;
  preferred_airlines_json?: string[];

  // Ride-specific fields
  pickup_location_json?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  dropoff_location_json?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  scheduled_time?: string;
  ride_type?: string;
  eta_minutes?: number;
  driver_info_json?: {
    name?: string;
    rating?: number;
    phone?: string;
    vehicle?: {
      make?: string;
      model?: string;
      color?: string;
      plate?: string;
    };
  };

  // Doctor-specific fields
  doctor_info_json?: {
    id?: string;
    name?: string;
    specialty?: string;
    address?: string;
    phone?: string;
    rating?: number;
  };
  appointment_type?: 'in-person' | 'telehealth';
  appointment_time?: string;
  symptoms_json?: string[];

  // Accommodation preferences (for future use)
  stay_area_prefs_json?: Record<string, any>;
  ride_prefs_json?: Record<string, any>;

  // Auto-booking settings
  auto_book_enabled?: boolean;
  auto_book_rules_json?: Record<string, any>;

  // Timestamps
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
  cancelled_at?: string;
}

// Legacy alias for backwards compatibility
export type TripRequest = BookingRequest;
export type TripStatus = BookingStatus;

export interface AgentRun {
  id: string;
  booking_request_id: string;
  user_id: string;
  user_message: string;
  task_plan_json?: TaskPlan;
  current_phase?: ExecutionPhase;
  status?: 'running' | 'completed' | 'failed';
  result_json?: Record<string, any>;
  error_message?: string;
  created_at?: string;
  completed_at?: string;
}

export interface TaskPlan {
  goal: string;
  constraints: string[];
  phases: PhaseStep[];
  estimatedDuration?: number;
}

export interface PhaseStep {
  phase: ExecutionPhase;
  description: string;
  tools: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
  result?: any;
}

export type ExecutionPhase =
  | 'understand'
  | 'search'
  | 'compare'
  | 'hold'
  | 'book'
  | 'pay'
  | 'confirm'
  | 'calendar'
  | 'monitor';

// Granular sub-step status
export type StepStatus = 'pending' | 'active' | 'completed' | 'failed' | 'skipped';

// Flight booking granular steps
export type FlightBookingStep =
  | 'connect_api'
  | 'authenticate_user'
  | 'detect_location'
  | 'parse_intent'
  | 'extract_origin'
  | 'extract_destination'
  | 'validate_dates'
  | 'analyze_budget'
  | 'determine_cabin_class'
  | 'check_traveler_count'
  | 'query_flight_api'
  | 'fetch_airline_data'
  | 'filter_results'
  | 'apply_preferences'
  | 'calculate_duration'
  | 'compare_prices'
  | 'rank_by_value'
  | 'check_availability'
  | 'verify_seats'
  | 'select_best_option'
  | 'hold_reservation'
  | 'assign_seats'
  | 'verify_passenger_info'
  | 'validate_passport'
  | 'process_payment'
  | 'confirm_booking'
  | 'generate_pnr'
  | 'send_confirmation_email'
  | 'create_calendar_event'
  | 'set_reminders'
  | 'enable_monitoring';

// Ride booking granular steps
export type RideBookingStep =
  | 'detect_current_location'
  | 'parse_destination'
  | 'validate_addresses'
  | 'connect_uber_api'
  | 'connect_lyft_api'
  | 'search_nearby_drivers'
  | 'calculate_route'
  | 'estimate_duration'
  | 'get_price_estimates'
  | 'compare_providers'
  | 'select_vehicle_type'
  | 'check_driver_availability'
  | 'request_ride'
  | 'match_driver'
  | 'confirm_pickup'
  | 'track_driver_location'
  | 'process_payment'
  | 'send_ride_details'
  | 'enable_live_tracking';

// Doctor appointment granular steps
export type DoctorBookingStep =
  | 'parse_symptoms'
  | 'identify_specialty'
  | 'determine_urgency'
  | 'detect_location'
  | 'set_search_radius'
  | 'verify_insurance'
  | 'check_coverage'
  | 'search_providers'
  | 'filter_by_specialty'
  | 'check_ratings'
  | 'verify_credentials'
  | 'check_availability'
  | 'find_appointment_slots'
  | 'compare_doctors'
  | 'rank_by_fit'
  | 'select_doctor'
  | 'choose_appointment_type'
  | 'select_time_slot'
  | 'verify_insurance_again'
  | 'book_appointment'
  | 'send_confirmation'
  | 'create_calendar_event'
  | 'set_reminder'
  | 'send_pre_appointment_info';

// Unified granular step type
export type GranularStep = FlightBookingStep | RideBookingStep | DoctorBookingStep;

// Step metadata for tracking
export interface StepMetadata {
  id: string;
  step: GranularStep;
  phase: ExecutionPhase;
  label: string;
  description: string;
  status: StepStatus;
  icon?: string;
  color?: string;
  accentColor?: string;
  startTime?: number;
  endTime?: number;
  duration?: number;
  progress?: number; // 0-100
  details?: {
    primary?: string;
    secondary?: string;
    items?: Array<{ label: string; value: string; icon?: string }>;
    flights?: Array<{ id: string; carrier: string; price: number; duration?: string; stops?: number; rating?: number; name?: string }>;
    route?: { origin: string; destination: string; distance?: string };
    selected?: { id: string; carrier?: string; name?: string; price: number; duration?: string; stops?: number; rating?: number };
  };
  error?: string;
}

// Enhanced AgentRun with granular step tracking
export interface GranularAgentRun extends AgentRun {
  granular_steps?: StepMetadata[];
  current_step?: GranularStep;
  step_progress?: number; // Overall progress 0-100
}

export interface BookingConfirmation {
  id: string;
  booking_request_id: string;
  user_id: string;
  domain: BookingType;
  provider: string;
  provider_order_id?: string;
  offer_data_json?: Record<string, any>;
  booking_data_json?: Record<string, any>;
  amount?: number;
  currency?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

// Legacy alias
export type Booking = BookingConfirmation;

export interface ChatMessage {
  id: string;
  booking_request_id?: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata_json?: Record<string, any>;
  created_at?: string;
}

export interface Reminder {
  id: string;
  booking_request_id: string;
  user_id: string;
  title: string;
  remind_at: string;
  reminder_type: string;
  metadata_json?: Record<string, any>;
  is_sent?: boolean;
  created_at?: string;
}

export interface CalendarEvent {
  id: string;
  booking_request_id: string;
  user_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  event_type?: string;
  metadata_json?: Record<string, any>;
  created_at?: string;
}

// CRUD operation types
export interface CreateBookingParams {
  booking_type: BookingType;
  title: string;

  // Flight params
  origin?: string;
  destination?: string;
  depart_date?: string;
  return_date?: string;
  travelers?: number;
  cabin_class?: string;
  budget?: number;

  // Ride params
  pickup?: { latitude: number; longitude: number; address?: string };
  dropoff?: { latitude: number; longitude: number; address?: string };
  scheduled_time?: string;
  ride_type?: string;

  // Doctor params
  doctor_id?: string;
  doctor_name?: string;
  specialty?: string;
  appointment_time?: string;
  appointment_type?: 'in-person' | 'telehealth';
  symptoms?: string[];
  reason?: string;
}

export interface UpdateBookingParams {
  id: string;
  status?: BookingStatus;
  confirmation_number?: string;
  provider_booking_id?: string;
  notes?: string;

  // Type-specific updates
  scheduled_time?: string;
  appointment_time?: string;
  driver_info_json?: any;
  doctor_info_json?: any;
}

// ============================================
// SECURITY & COMPLIANCE TYPES
// ============================================

// Data classification levels for SOC2/HIPAA compliance
export enum DataClassification {
  PUBLIC = 'PUBLIC',           // Non-sensitive data
  INTERNAL = 'INTERNAL',       // Internal use only
  CONFIDENTIAL = 'CONFIDENTIAL', // PII, travel preferences
  RESTRICTED = 'RESTRICTED',   // PHI (health data), payment data, passport
}

// Encrypted data wrapper
export interface EncryptedField {
  ciphertext: string;
  iv: string;
  authTag: string;
  version: number;
  classification: DataClassification;
  encryptedAt: string;
}

// ============================================
// TRAVELER & DOCUMENT TYPES
// ============================================

export type DocumentType = 'passport' | 'id_card' | 'drivers_license' | 'visa' | 'global_entry' | 'tsa_precheck';

export interface TravelerDocument {
  id: string;
  type: DocumentType;
  document_number_encrypted: EncryptedField;
  issuing_country: string;
  expiry_date_encrypted: EncryptedField;
  is_valid: boolean;
  added_at: string;
  last_verified?: string;
}

export interface TravelerProfile {
  id: string;
  user_id: string;
  full_name_encrypted?: EncryptedField;
  date_of_birth_encrypted?: EncryptedField;
  nationality_encrypted?: EncryptedField;
  documents: TravelerDocument[];
  known_traveler_number_encrypted?: EncryptedField;
  redress_number_encrypted?: EncryptedField;
  frequent_flyer_programs: FrequentFlyerProgram[];
  emergency_contact_encrypted?: EncryptedField;
  created_at: string;
  updated_at: string;
  profile_complete: boolean;
}

export interface FrequentFlyerProgram {
  id: string;
  airline: string;
  program_name: string;
  member_id_masked: string;
  member_id_encrypted: EncryptedField;
  status_tier?: string;
}

// ============================================
// PAYMENT METHOD TYPES (PCI-DSS Compliant)
// ============================================

export type PaymentMethodType = 'card' | 'bank_account' | 'digital_wallet';
export type WalletType = 'apple_pay' | 'google_pay' | 'paypal';

export interface PaymentMethod {
  id: string;
  user_id: string;
  type: PaymentMethodType;
  // Card info - only tokenized/masked data
  card_brand?: string;
  card_last4?: string;
  card_exp_month?: number;
  card_exp_year?: number;
  // Bank info
  bank_name?: string;
  account_last4?: string;
  // Digital wallet
  wallet_type?: WalletType;
  wallet_email_masked?: string;
  // Encrypted billing
  billing_address_encrypted?: EncryptedField;
  billing_name_encrypted?: EncryptedField;
  billing_zip_encrypted?: EncryptedField;
  // Payment processor token
  stripe_payment_method_id?: string;
  // Metadata
  is_default: boolean;
  is_verified: boolean;
  added_at: string;
  last_used?: string;
}

// ============================================
// HEALTH DATA TYPES (HIPAA Compliant)
// ============================================

export interface HealthProfile {
  id: string;
  user_id: string;
  // All PHI is encrypted
  conditions_encrypted?: EncryptedField;
  medications_encrypted?: EncryptedField;
  allergies_encrypted?: EncryptedField;
  blood_type_encrypted?: EncryptedField;
  emergency_medical_notes_encrypted?: EncryptedField;
  // Insurance
  insurance_provider_encrypted?: EncryptedField;
  insurance_member_id_encrypted?: EncryptedField;
  insurance_group_encrypted?: EncryptedField;
  // Non-sensitive flags
  has_conditions: boolean;
  has_medications: boolean;
  has_allergies: boolean;
  has_insurance: boolean;
  // Metadata
  created_at: string;
  updated_at: string;
  last_consent_date?: string;
}

// ============================================
// AUDIT LOG TYPES (SOC2 Compliance)
// ============================================

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  classification: DataClassification;
  success: boolean;
  error_message?: string;
}

// Extended UserProfile with secure data references
export interface SecureUserProfile extends UserProfile {
  traveler_documents_json?: TravelerDocument[];
  payment_methods_json?: PaymentMethod[];
  health_profile_json?: HealthProfile;
  emergency_contact_json?: {
    name_encrypted: EncryptedField;
    phone_encrypted: EncryptedField;
    relationship?: string;
  };
  // Profile completion flags
  has_passport: boolean;
  has_payment_method: boolean;
  has_emergency_contact: boolean;
  profile_completion_percentage: number;
}
