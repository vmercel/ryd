// Secure Profile Service
// Handles encrypted storage of sensitive traveler data, documents, and payment methods
// SOC2 and HIPAA compliant with field-level encryption

import { getSupabaseClient } from '@/template';
import {
  encryptData,
  decryptData,
  encryptTravelerData,
  decryptTravelerData,
  encryptHealthData,
  logAuditEvent,
  AuditAction,
  DataClassification,
  maskSensitiveData,
  SecureTravelerData,
  SecurePaymentMethod,
  SecureHealthData,
  EncryptedData,
} from './securityService';

// ============================================
// TYPES
// ============================================

export interface TravelerDocument {
  id: string;
  type: 'passport' | 'id_card' | 'drivers_license' | 'visa' | 'global_entry' | 'tsa_precheck';
  document_number_encrypted: EncryptedData;
  issuing_country: string; // ISO code (non-sensitive)
  expiry_date_encrypted: EncryptedData;
  is_valid: boolean;
  added_at: string;
  last_verified?: string;
}

export interface TravelerProfile {
  id: string;
  user_id: string;
  // Encrypted identity data
  full_name_encrypted?: EncryptedData;
  date_of_birth_encrypted?: EncryptedData;
  nationality_encrypted?: EncryptedData;
  // Documents
  documents: TravelerDocument[];
  // Travel credentials (encrypted)
  known_traveler_number_encrypted?: EncryptedData;
  redress_number_encrypted?: EncryptedData;
  // Frequent flyer (less sensitive - can be tokenized)
  frequent_flyer_programs: FrequentFlyerProgram[];
  // Emergency contact (encrypted)
  emergency_contact_encrypted?: EncryptedData;
  // Metadata
  created_at: string;
  updated_at: string;
  profile_complete: boolean;
}

export interface FrequentFlyerProgram {
  id: string;
  airline: string;
  program_name: string;
  member_id_masked: string; // Show last 4 only
  member_id_encrypted: EncryptedData;
  status_tier?: string;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  type: 'card' | 'bank_account' | 'digital_wallet';
  // Card info (tokenized - never store full numbers)
  card_brand?: string;
  card_last4?: string;
  card_exp_month?: number;
  card_exp_year?: number;
  // Bank info (encrypted)
  bank_name?: string;
  account_last4?: string;
  // Digital wallet
  wallet_type?: 'apple_pay' | 'google_pay' | 'paypal';
  wallet_email_masked?: string;
  // Billing (encrypted)
  billing_address_encrypted?: EncryptedData;
  billing_name_encrypted?: EncryptedData;
  billing_zip_encrypted?: EncryptedData;
  // Stripe/payment processor token
  stripe_payment_method_id?: string;
  // Metadata
  is_default: boolean;
  is_verified: boolean;
  added_at: string;
  last_used?: string;
}

export interface HealthProfile {
  id: string;
  user_id: string;
  // All health data is HIPAA PHI - encrypted
  conditions_encrypted?: EncryptedData;
  medications_encrypted?: EncryptedData;
  allergies_encrypted?: EncryptedData;
  blood_type_encrypted?: EncryptedData;
  emergency_medical_notes_encrypted?: EncryptedData;
  // Insurance (encrypted)
  insurance_provider_encrypted?: EncryptedData;
  insurance_member_id_encrypted?: EncryptedData;
  insurance_group_encrypted?: EncryptedData;
  // Non-sensitive flags for UI
  has_conditions: boolean;
  has_medications: boolean;
  has_allergies: boolean;
  has_insurance: boolean;
  // Metadata
  created_at: string;
  updated_at: string;
  last_consent_date?: string; // HIPAA consent tracking
}

// ============================================
// TRAVELER DOCUMENT MANAGEMENT
// ============================================

/**
 * Add a new traveler document with encryption
 */
export async function addTravelerDocument(
  userId: string,
  document: {
    type: TravelerDocument['type'];
    document_number: string;
    issuing_country: string;
    expiry_date: string;
  }
): Promise<{ success: boolean; documentId?: string; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    // Encrypt sensitive data
    const documentNumberEncrypted = await encryptData(
      document.document_number,
      DataClassification.RESTRICTED
    );
    const expiryDateEncrypted = await encryptData(
      document.expiry_date,
      DataClassification.RESTRICTED
    );

    const isValid = new Date(document.expiry_date) > new Date();
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get existing profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('traveler_documents_json')
      .eq('id', userId)
      .single();

    const existingDocs = profile?.traveler_documents_json || [];

    const newDocument: TravelerDocument = {
      id: documentId,
      type: document.type,
      document_number_encrypted: documentNumberEncrypted,
      issuing_country: document.issuing_country,
      expiry_date_encrypted: expiryDateEncrypted,
      is_valid: isValid,
      added_at: new Date().toISOString(),
    };

    // Update profile with new document
    const { error } = await supabase
      .from('user_profiles')
      .update({
        traveler_documents_json: [...existingDocs, newDocument],
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;

    // Audit log
    await logAuditEvent(userId, AuditAction.PASSPORT_UPDATED, 'traveler_document', {
      resourceId: documentId,
      details: { type: document.type, country: document.issuing_country },
      classification: DataClassification.RESTRICTED,
    });

    return { success: true, documentId };
  } catch (error) {
    console.error('Add traveler document error:', error);
    return { success: false, error: 'Failed to add document' };
  }
}

/**
 * Get traveler documents (decrypted for display)
 */
export async function getTravelerDocuments(
  userId: string,
  decryptNumbers: boolean = false
): Promise<{ success: boolean; documents?: any[]; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('traveler_documents_json')
      .eq('id', userId)
      .single();

    if (error) throw error;

    const documents = profile?.traveler_documents_json || [];

    // Process documents for display
    const processedDocs = await Promise.all(
      documents.map(async (doc: TravelerDocument) => {
        let documentNumber = '****';
        let expiryDate = '';

        if (decryptNumbers && doc.document_number_encrypted) {
          const decrypted = await decryptData(doc.document_number_encrypted);
          documentNumber = maskSensitiveData(decrypted, 'passport');
        }

        if (doc.expiry_date_encrypted) {
          expiryDate = await decryptData(doc.expiry_date_encrypted);
        }

        return {
          id: doc.id,
          type: doc.type,
          document_number_masked: documentNumber,
          issuing_country: doc.issuing_country,
          expiry_date: expiryDate,
          is_valid: doc.is_valid,
          added_at: doc.added_at,
        };
      })
    );

    // Audit log for data access
    await logAuditEvent(userId, AuditAction.DATA_READ, 'traveler_documents', {
      details: { count: processedDocs.length, decrypted: decryptNumbers },
      classification: DataClassification.RESTRICTED,
    });

    return { success: true, documents: processedDocs };
  } catch (error) {
    console.error('Get traveler documents error:', error);
    return { success: false, error: 'Failed to retrieve documents' };
  }
}

/**
 * Delete a traveler document
 */
export async function deleteTravelerDocument(
  userId: string,
  documentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('traveler_documents_json')
      .eq('id', userId)
      .single();

    const existingDocs = profile?.traveler_documents_json || [];
    const updatedDocs = existingDocs.filter((doc: TravelerDocument) => doc.id !== documentId);

    const { error } = await supabase
      .from('user_profiles')
      .update({
        traveler_documents_json: updatedDocs,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;

    // Audit log
    await logAuditEvent(userId, AuditAction.DATA_DELETE, 'traveler_document', {
      resourceId: documentId,
      classification: DataClassification.RESTRICTED,
    });

    return { success: true };
  } catch (error) {
    console.error('Delete traveler document error:', error);
    return { success: false, error: 'Failed to delete document' };
  }
}

// ============================================
// PAYMENT METHOD MANAGEMENT
// ============================================

/**
 * Add a payment method (PCI-compliant - only stores tokens)
 * In production, card details should be tokenized via Stripe SDK before calling this
 */
export async function addPaymentMethod(
  userId: string,
  paymentMethod: {
    type: PaymentMethod['type'];
    // For cards - these should come from Stripe tokenization
    stripe_payment_method_id?: string;
    card_brand?: string;
    card_last4?: string;
    card_exp_month?: number;
    card_exp_year?: number;
    // For digital wallets
    wallet_type?: PaymentMethod['wallet_type'];
    wallet_email?: string;
    // Billing address
    billing_name?: string;
    billing_address?: string;
    billing_zip?: string;
    // Default
    is_default?: boolean;
  }
): Promise<{ success: boolean; paymentMethodId?: string; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    const paymentMethodId = `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Encrypt billing info
    let billingAddressEncrypted: EncryptedData | undefined;
    let billingNameEncrypted: EncryptedData | undefined;
    let billingZipEncrypted: EncryptedData | undefined;

    if (paymentMethod.billing_address) {
      billingAddressEncrypted = await encryptData(
        paymentMethod.billing_address,
        DataClassification.RESTRICTED
      );
    }
    if (paymentMethod.billing_name) {
      billingNameEncrypted = await encryptData(
        paymentMethod.billing_name,
        DataClassification.RESTRICTED
      );
    }
    if (paymentMethod.billing_zip) {
      billingZipEncrypted = await encryptData(
        paymentMethod.billing_zip,
        DataClassification.RESTRICTED
      );
    }

    // Get existing payment methods
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('payment_methods_json')
      .eq('id', userId)
      .single();

    const existingMethods = profile?.payment_methods_json || [];

    // If this is the first or marked as default, update others
    const isDefault = paymentMethod.is_default || existingMethods.length === 0;
    let updatedMethods = existingMethods;
    if (isDefault) {
      updatedMethods = existingMethods.map((pm: PaymentMethod) => ({ ...pm, is_default: false }));
    }

    const newPaymentMethod: PaymentMethod = {
      id: paymentMethodId,
      user_id: userId,
      type: paymentMethod.type,
      card_brand: paymentMethod.card_brand,
      card_last4: paymentMethod.card_last4,
      card_exp_month: paymentMethod.card_exp_month,
      card_exp_year: paymentMethod.card_exp_year,
      wallet_type: paymentMethod.wallet_type,
      wallet_email_masked: paymentMethod.wallet_email
        ? maskSensitiveData(paymentMethod.wallet_email, 'email')
        : undefined,
      billing_address_encrypted: billingAddressEncrypted,
      billing_name_encrypted: billingNameEncrypted,
      billing_zip_encrypted: billingZipEncrypted,
      stripe_payment_method_id: paymentMethod.stripe_payment_method_id,
      is_default: isDefault,
      is_verified: !!paymentMethod.stripe_payment_method_id,
      added_at: new Date().toISOString(),
    };

    // Update profile
    const { error } = await supabase
      .from('user_profiles')
      .update({
        payment_methods_json: [...updatedMethods, newPaymentMethod],
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;

    // Audit log
    await logAuditEvent(userId, AuditAction.PAYMENT_METHOD_ADDED, 'payment_method', {
      resourceId: paymentMethodId,
      details: {
        type: paymentMethod.type,
        brand: paymentMethod.card_brand,
        last4: paymentMethod.card_last4,
      },
      classification: DataClassification.RESTRICTED,
    });

    return { success: true, paymentMethodId };
  } catch (error) {
    console.error('Add payment method error:', error);
    return { success: false, error: 'Failed to add payment method' };
  }
}

/**
 * Get payment methods for display
 */
export async function getPaymentMethods(
  userId: string
): Promise<{ success: boolean; paymentMethods?: any[]; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('payment_methods_json')
      .eq('id', userId)
      .single();

    if (error) throw error;

    const methods = profile?.payment_methods_json || [];

    // Process for display (no need to decrypt - sensitive data is tokenized)
    const displayMethods = methods.map((pm: PaymentMethod) => ({
      id: pm.id,
      type: pm.type,
      card_brand: pm.card_brand,
      card_last4: pm.card_last4,
      card_exp_month: pm.card_exp_month,
      card_exp_year: pm.card_exp_year,
      card_display: pm.card_last4 ? `•••• ${pm.card_last4}` : undefined,
      wallet_type: pm.wallet_type,
      wallet_email_masked: pm.wallet_email_masked,
      is_default: pm.is_default,
      is_verified: pm.is_verified,
      added_at: pm.added_at,
      expires_soon: pm.card_exp_year && pm.card_exp_month
        ? isExpiringSoon(pm.card_exp_year, pm.card_exp_month)
        : false,
    }));

    return { success: true, paymentMethods: displayMethods };
  } catch (error) {
    console.error('Get payment methods error:', error);
    return { success: false, error: 'Failed to retrieve payment methods' };
  }
}

/**
 * Delete a payment method
 */
export async function deletePaymentMethod(
  userId: string,
  paymentMethodId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('payment_methods_json')
      .eq('id', userId)
      .single();

    const existingMethods = profile?.payment_methods_json || [];
    const methodToDelete = existingMethods.find((pm: PaymentMethod) => pm.id === paymentMethodId);

    if (!methodToDelete) {
      return { success: false, error: 'Payment method not found' };
    }

    const updatedMethods = existingMethods.filter(
      (pm: PaymentMethod) => pm.id !== paymentMethodId
    );

    // If deleted method was default, make the first remaining one default
    if (methodToDelete.is_default && updatedMethods.length > 0) {
      updatedMethods[0].is_default = true;
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({
        payment_methods_json: updatedMethods,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;

    // Audit log
    await logAuditEvent(userId, AuditAction.PAYMENT_METHOD_REMOVED, 'payment_method', {
      resourceId: paymentMethodId,
      details: { type: methodToDelete.type, last4: methodToDelete.card_last4 },
      classification: DataClassification.RESTRICTED,
    });

    return { success: true };
  } catch (error) {
    console.error('Delete payment method error:', error);
    return { success: false, error: 'Failed to delete payment method' };
  }
}

/**
 * Set a payment method as default
 */
export async function setDefaultPaymentMethod(
  userId: string,
  paymentMethodId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('payment_methods_json')
      .eq('id', userId)
      .single();

    const methods = profile?.payment_methods_json || [];
    const updatedMethods = methods.map((pm: PaymentMethod) => ({
      ...pm,
      is_default: pm.id === paymentMethodId,
    }));

    const { error } = await supabase
      .from('user_profiles')
      .update({
        payment_methods_json: updatedMethods,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Set default payment method error:', error);
    return { success: false, error: 'Failed to update default payment method' };
  }
}

// ============================================
// HEALTH DATA MANAGEMENT (HIPAA)
// ============================================

/**
 * Update health profile (requires explicit consent)
 */
export async function updateHealthProfile(
  userId: string,
  healthData: {
    conditions?: string[];
    medications?: string[];
    allergies?: string[];
    blood_type?: string;
    emergency_notes?: string;
    insurance_provider?: string;
    insurance_member_id?: string;
    insurance_group?: string;
  },
  consentGiven: boolean = false
): Promise<{ success: boolean; error?: string }> {
  if (!consentGiven) {
    return { success: false, error: 'HIPAA consent required before storing health data' };
  }

  try {
    const supabase = getSupabaseClient();

    // Encrypt all health data
    const encryptedHealth: Partial<HealthProfile> = {
      has_conditions: (healthData.conditions?.length || 0) > 0,
      has_medications: (healthData.medications?.length || 0) > 0,
      has_allergies: (healthData.allergies?.length || 0) > 0,
      has_insurance: !!healthData.insurance_provider,
      updated_at: new Date().toISOString(),
      last_consent_date: new Date().toISOString(),
    };

    if (healthData.conditions?.length) {
      encryptedHealth.conditions_encrypted = await encryptData(
        JSON.stringify(healthData.conditions),
        DataClassification.RESTRICTED
      );
    }

    if (healthData.medications?.length) {
      encryptedHealth.medications_encrypted = await encryptData(
        JSON.stringify(healthData.medications),
        DataClassification.RESTRICTED
      );
    }

    if (healthData.allergies?.length) {
      encryptedHealth.allergies_encrypted = await encryptData(
        JSON.stringify(healthData.allergies),
        DataClassification.RESTRICTED
      );
    }

    if (healthData.blood_type) {
      encryptedHealth.blood_type_encrypted = await encryptData(
        healthData.blood_type,
        DataClassification.RESTRICTED
      );
    }

    if (healthData.emergency_notes) {
      encryptedHealth.emergency_medical_notes_encrypted = await encryptData(
        healthData.emergency_notes,
        DataClassification.RESTRICTED
      );
    }

    if (healthData.insurance_provider) {
      encryptedHealth.insurance_provider_encrypted = await encryptData(
        healthData.insurance_provider,
        DataClassification.RESTRICTED
      );
    }

    if (healthData.insurance_member_id) {
      encryptedHealth.insurance_member_id_encrypted = await encryptData(
        healthData.insurance_member_id,
        DataClassification.RESTRICTED
      );
    }

    if (healthData.insurance_group) {
      encryptedHealth.insurance_group_encrypted = await encryptData(
        healthData.insurance_group,
        DataClassification.RESTRICTED
      );
    }

    // Update profile
    const { error } = await supabase
      .from('user_profiles')
      .update({
        health_profile_json: encryptedHealth,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;

    // Audit log for HIPAA compliance
    await logAuditEvent(userId, AuditAction.HEALTH_DATA_MODIFIED, 'health_profile', {
      details: {
        fieldsUpdated: Object.keys(healthData).filter(k => healthData[k as keyof typeof healthData]),
        consentDate: encryptedHealth.last_consent_date,
      },
      classification: DataClassification.RESTRICTED,
    });

    return { success: true };
  } catch (error) {
    console.error('Update health profile error:', error);
    return { success: false, error: 'Failed to update health data' };
  }
}

/**
 * Get health profile (decrypted)
 * Requires audit logging for HIPAA
 */
export async function getHealthProfile(
  userId: string,
  purpose: string
): Promise<{ success: boolean; healthData?: any; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('health_profile_json')
      .eq('id', userId)
      .single();

    if (error) throw error;

    const healthProfile = profile?.health_profile_json as HealthProfile | null;
    if (!healthProfile) {
      return { success: true, healthData: null };
    }

    // Decrypt health data
    const decrypted: any = {
      has_conditions: healthProfile.has_conditions,
      has_medications: healthProfile.has_medications,
      has_allergies: healthProfile.has_allergies,
      has_insurance: healthProfile.has_insurance,
      last_consent_date: healthProfile.last_consent_date,
    };

    if (healthProfile.conditions_encrypted) {
      decrypted.conditions = JSON.parse(
        await decryptData(healthProfile.conditions_encrypted)
      );
    }

    if (healthProfile.medications_encrypted) {
      decrypted.medications = JSON.parse(
        await decryptData(healthProfile.medications_encrypted)
      );
    }

    if (healthProfile.allergies_encrypted) {
      decrypted.allergies = JSON.parse(
        await decryptData(healthProfile.allergies_encrypted)
      );
    }

    if (healthProfile.blood_type_encrypted) {
      decrypted.blood_type = await decryptData(healthProfile.blood_type_encrypted);
    }

    if (healthProfile.insurance_provider_encrypted) {
      decrypted.insurance_provider = await decryptData(
        healthProfile.insurance_provider_encrypted
      );
    }

    // Audit log for HIPAA compliance (every access must be logged)
    await logAuditEvent(userId, AuditAction.HEALTH_DATA_ACCESSED, 'health_profile', {
      details: { purpose, accessedFields: Object.keys(decrypted) },
      classification: DataClassification.RESTRICTED,
    });

    return { success: true, healthData: decrypted };
  } catch (error) {
    console.error('Get health profile error:', error);
    return { success: false, error: 'Failed to retrieve health data' };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function isExpiringSoon(year: number, month: number): boolean {
  const expiryDate = new Date(year, month - 1); // month is 0-indexed
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
  return expiryDate <= threeMonthsFromNow;
}

/**
 * Get card brand icon name
 */
export function getCardBrandIcon(brand?: string): string {
  const brandIcons: Record<string, string> = {
    visa: 'card',
    mastercard: 'card',
    amex: 'card',
    discover: 'card',
    default: 'card-outline',
  };
  return brandIcons[brand?.toLowerCase() || 'default'] || brandIcons.default;
}

/**
 * Format card expiry for display
 */
export function formatCardExpiry(month?: number, year?: number): string {
  if (!month || !year) return '';
  return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
}
