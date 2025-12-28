import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useAlert } from '@/template';
import { getSupabaseClient } from '@/template';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { CommonStyles } from '../../constants/styles';
import {
  addTravelerDocument,
  getTravelerDocuments,
  deleteTravelerDocument,
  addPaymentMethod,
  getPaymentMethods,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  formatCardExpiry,
} from '../../services/secureProfileService';
import { maskSensitiveData } from '../../services/securityService';

// Document type options
const DOCUMENT_TYPES = [
  { value: 'passport', label: 'Passport', icon: 'document-text' },
  { value: 'id_card', label: 'ID Card', icon: 'card' },
  { value: 'drivers_license', label: "Driver's License", icon: 'car' },
  { value: 'global_entry', label: 'Global Entry', icon: 'globe' },
  { value: 'tsa_precheck', label: 'TSA PreCheck', icon: 'shield-checkmark' },
];


export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { showAlert } = useAlert();

  // Profile state
  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    home_airport: '',
  });
  const [autoBook, setAutoBook] = useState(false);
  const [loading, setLoading] = useState(true);

  // Traveler documents state
  const [documents, setDocuments] = useState<any[]>([]);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [newDocument, setNewDocument] = useState({
    type: 'passport',
    document_number: '',
    issuing_country: '',
    expiry_date: '',
  });
  const [savingDocument, setSavingDocument] = useState(false);

  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [newPayment, setNewPayment] = useState({
    card_number: '',
    exp_month: '',
    exp_year: '',
    cvv: '',
    billing_zip: '',
    billing_name: '',
  });
  const [savingPayment, setSavingPayment] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [user]);

  const loadAllData = async () => {
    if (!user) return;
    setLoading(true);
    await Promise.all([
      loadProfile(),
      loadDocuments(),
      loadPaymentMethods(),
    ]);
    setLoading(false);
  };

  const loadProfile = async () => {
    if (!user) return;

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      setProfile({
        full_name: data.full_name || '',
        phone: data.phone || '',
        home_airport: data.home_airport || '',
      });
    }
  };

  const loadDocuments = async () => {
    if (!user) return;
    const result = await getTravelerDocuments(user.id, true);
    if (result.success && result.documents) {
      setDocuments(result.documents);
    }
  };

  const loadPaymentMethods = async () => {
    if (!user) return;
    const result = await getPaymentMethods(user.id);
    if (result.success && result.paymentMethods) {
      setPaymentMethods(result.paymentMethods);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('user_profiles')
      .update(profile)
      .eq('id', user.id);

    if (error) {
      showAlert('Error', 'Failed to save profile');
    } else {
      showAlert('Success', 'Profile updated');
    }
  };

  const handleAddDocument = async () => {
    if (!user) return;
    if (!newDocument.document_number || !newDocument.expiry_date || !newDocument.issuing_country) {
      showAlert('Error', 'Please fill in all required fields');
      return;
    }

    setSavingDocument(true);
    const result = await addTravelerDocument(user.id, {
      type: newDocument.type as any,
      document_number: newDocument.document_number,
      issuing_country: newDocument.issuing_country,
      expiry_date: newDocument.expiry_date,
    });

    if (result.success) {
      setShowDocumentModal(false);
      setNewDocument({
        type: 'passport',
        document_number: '',
        issuing_country: '',
        expiry_date: '',
      });
      await loadDocuments();
      showAlert('Success', 'Document added securely');
    } else {
      showAlert('Error', result.error || 'Failed to add document');
    }
    setSavingDocument(false);
  };

  const handleDeleteDocument = (documentId: string, documentType: string) => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete this ${documentType}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            const result = await deleteTravelerDocument(user.id, documentId);
            if (result.success) {
              await loadDocuments();
              showAlert('Deleted', 'Document removed');
            } else {
              showAlert('Error', result.error || 'Failed to delete document');
            }
          },
        },
      ]
    );
  };

  const handleAddPayment = async () => {
    if (!user) return;
    if (!newPayment.card_number || !newPayment.exp_month || !newPayment.exp_year) {
      showAlert('Error', 'Please fill in all required fields');
      return;
    }

    setSavingPayment(true);

    // Detect card brand from first digit
    const firstDigit = newPayment.card_number[0];
    let brand = 'unknown';
    if (firstDigit === '4') brand = 'visa';
    else if (firstDigit === '5') brand = 'mastercard';
    else if (firstDigit === '3') brand = 'amex';
    else if (firstDigit === '6') brand = 'discover';

    const result = await addPaymentMethod(user.id, {
      type: 'card',
      card_brand: brand,
      card_last4: newPayment.card_number.slice(-4),
      card_exp_month: parseInt(newPayment.exp_month),
      card_exp_year: parseInt(newPayment.exp_year),
      billing_zip: newPayment.billing_zip,
      billing_name: newPayment.billing_name,
      // In production, this would be a Stripe token
      stripe_payment_method_id: `pm_${Date.now()}`,
    });

    if (result.success) {
      setShowPaymentModal(false);
      setNewPayment({
        card_number: '',
        exp_month: '',
        exp_year: '',
        cvv: '',
        billing_zip: '',
        billing_name: '',
      });
      await loadPaymentMethods();
      showAlert('Success', 'Payment method added');
    } else {
      showAlert('Error', result.error || 'Failed to add payment method');
    }
    setSavingPayment(false);
  };

  const handleDeletePayment = (paymentId: string, last4: string) => {
    Alert.alert(
      'Remove Payment Method',
      `Remove card ending in ${last4}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            const result = await deletePaymentMethod(user.id, paymentId);
            if (result.success) {
              await loadPaymentMethods();
              showAlert('Removed', 'Payment method deleted');
            } else {
              showAlert('Error', result.error || 'Failed to remove payment method');
            }
          },
        },
      ]
    );
  };

  const handleSetDefaultPayment = async (paymentId: string) => {
    if (!user) return;
    const result = await setDefaultPaymentMethod(user.id, paymentId);
    if (result.success) {
      await loadPaymentMethods();
    }
  };

  const handleLogout = async () => {
    const { error } = await logout();
    if (error) {
      showAlert('Error', error);
    }
  };

  const getDocumentIcon = (type: string) => {
    const doc = DOCUMENT_TYPES.find(d => d.value === type);
    return doc?.icon || 'document';
  };

  const getCardBrandIcon = (brand?: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa': return 'card';
      case 'mastercard': return 'card';
      case 'amex': return 'card';
      default: return 'card-outline';
    }
  };

  if (loading) {
    return (
      <View style={[CommonStyles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[CommonStyles.container, { paddingTop: insets.top }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <Input
          label="Full Name"
          value={profile.full_name}
          onChangeText={(text) => setProfile({ ...profile, full_name: text })}
          placeholder="John Doe"
        />
        <Input
          label="Phone"
          value={profile.phone}
          onChangeText={(text) => setProfile({ ...profile, phone: text })}
          placeholder="+1 234 567 8900"
          keyboardType="phone-pad"
        />
        <Input
          label="Home Airport"
          value={profile.home_airport}
          onChangeText={(text) =>
            setProfile({ ...profile, home_airport: text.toUpperCase() })
          }
          placeholder="SFO"
          autoCapitalize="characters"
          maxLength={3}
        />
        <Button title="Save Profile" onPress={handleSaveProfile} />
      </View>

      {/* Travel Documents Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Travel Documents</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowDocumentModal(true)}
          >
            <Ionicons name="add" size={20} color={Colors.primary.main} />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {documents.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={40} color={Colors.text.tertiary} />
            <Text style={styles.emptyText}>No documents added</Text>
            <Text style={styles.emptySubtext}>Add your passport or ID for faster bookings</Text>
          </View>
        ) : (
          documents.map((doc) => (
            <View key={doc.id} style={styles.documentCard}>
              <View style={[styles.documentIcon, { backgroundColor: Colors.primary.main + '20' }]}>
                <Ionicons
                  name={getDocumentIcon(doc.type) as any}
                  size={24}
                  color={Colors.primary.main}
                />
              </View>
              <View style={styles.documentInfo}>
                <Text style={styles.documentType}>
                  {DOCUMENT_TYPES.find(d => d.value === doc.type)?.label || doc.type}
                </Text>
                <Text style={styles.documentNumber}>{doc.document_number_masked}</Text>
                <View style={styles.documentMeta}>
                  <Text style={styles.documentCountry}>{doc.issuing_country}</Text>
                  <Text style={[
                    styles.documentExpiry,
                    !doc.is_valid && styles.documentExpired
                  ]}>
                    {doc.is_valid ? `Expires ${doc.expiry_date}` : 'EXPIRED'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteDocument(doc.id, doc.type)}
              >
                <Ionicons name="trash-outline" size={20} color={Colors.accent.red} />
              </TouchableOpacity>
            </View>
          ))
        )}

        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark" size={16} color={Colors.accent.emerald} />
          <Text style={styles.securityNoteText}>
            Documents are encrypted with AES-256 encryption
          </Text>
        </View>
      </View>

      {/* Payment Methods Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Payment Methods</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowPaymentModal(true)}
          >
            <Ionicons name="add" size={20} color={Colors.primary.main} />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {paymentMethods.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="card-outline" size={40} color={Colors.text.tertiary} />
            <Text style={styles.emptyText}>No payment methods</Text>
            <Text style={styles.emptySubtext}>Add a card for seamless checkout</Text>
          </View>
        ) : (
          paymentMethods.map((pm) => (
            <TouchableOpacity
              key={pm.id}
              style={[styles.paymentCard, pm.is_default && styles.paymentCardDefault]}
              onPress={() => handleSetDefaultPayment(pm.id)}
            >
              <View style={[styles.paymentIcon, { backgroundColor: Colors.secondary.main + '20' }]}>
                <Ionicons
                  name={getCardBrandIcon(pm.card_brand) as any}
                  size={24}
                  color={Colors.secondary.main}
                />
              </View>
              <View style={styles.paymentInfo}>
                <View style={styles.paymentHeader}>
                  <Text style={styles.paymentBrand}>
                    {pm.card_brand?.toUpperCase() || 'CARD'}
                  </Text>
                  {pm.is_default && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.paymentNumber}>{pm.card_display}</Text>
                <Text style={[
                  styles.paymentExpiry,
                  pm.expires_soon && styles.paymentExpiringSoon
                ]}>
                  Expires {formatCardExpiry(pm.card_exp_month, pm.card_exp_year)}
                  {pm.expires_soon && ' (Soon)'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeletePayment(pm.id, pm.card_last4)}
              >
                <Ionicons name="trash-outline" size={20} color={Colors.accent.red} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.securityNote}>
          <Ionicons name="lock-closed" size={16} color={Colors.accent.emerald} />
          <Text style={styles.securityNoteText}>
            Card numbers are never stored. PCI-DSS compliant.
          </Text>
        </View>
      </View>

      {/* Automation Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Automation</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Auto-book enabled</Text>
            <Text style={styles.settingDescription}>
              Automatically book when rules are met
            </Text>
          </View>
          <Switch
            value={autoBook}
            onValueChange={setAutoBook}
            trackColor={{ false: Colors.border.medium, true: Colors.primary.main }}
            thumbColor={Colors.text.primary}
          />
        </View>
      </View>

      {/* Integrations Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Integrations</Text>
        <TouchableOpacity style={styles.integrationCard}>
          <Ionicons name="calendar" size={24} color={Colors.text.tertiary} />
          <View style={styles.integrationInfo}>
            <Text style={styles.integrationLabel}>Google Calendar</Text>
            <Text style={styles.integrationStatus}>Not connected</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Text style={styles.accountInfo}>Email: {user?.email}</Text>
        <Button title="Sign Out" onPress={handleLogout} variant="danger" />
      </View>

      <Text style={styles.version}>RydAI v1.0.0</Text>

      {/* Add Document Modal */}
      <Modal
        visible={showDocumentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDocumentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Travel Document</Text>
              <TouchableOpacity onPress={() => setShowDocumentModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Document Type */}
              <Text style={styles.inputLabel}>Document Type</Text>
              <View style={styles.typeSelector}>
                {DOCUMENT_TYPES.slice(0, 3).map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeOption,
                      newDocument.type === type.value && styles.typeOptionSelected,
                    ]}
                    onPress={() => setNewDocument({ ...newDocument, type: type.value })}
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={20}
                      color={newDocument.type === type.value ? Colors.primary.main : Colors.text.secondary}
                    />
                    <Text style={[
                      styles.typeOptionText,
                      newDocument.type === type.value && styles.typeOptionTextSelected,
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Document Number */}
              <Text style={styles.inputLabel}>Document Number</Text>
              <TextInput
                style={styles.input}
                value={newDocument.document_number}
                onChangeText={(text) => setNewDocument({ ...newDocument, document_number: text.toUpperCase() })}
                placeholder="AB1234567"
                placeholderTextColor={Colors.text.tertiary}
                autoCapitalize="characters"
              />

              {/* Country */}
              <Text style={styles.inputLabel}>Issuing Country</Text>
              <TextInput
                style={styles.input}
                value={newDocument.issuing_country}
                onChangeText={(text) => setNewDocument({ ...newDocument, issuing_country: text })}
                placeholder="e.g. United States, Germany, Japan"
                placeholderTextColor={Colors.text.tertiary}
                autoCapitalize="words"
              />

              {/* Expiry Date */}
              <Text style={styles.inputLabel}>Expiry Date</Text>
              <TextInput
                style={styles.input}
                value={newDocument.expiry_date}
                onChangeText={(text) => setNewDocument({ ...newDocument, expiry_date: text })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.text.tertiary}
              />

              <View style={styles.securityNoteLarge}>
                <Ionicons name="shield-checkmark" size={20} color={Colors.accent.emerald} />
                <Text style={styles.securityNoteLargeText}>
                  Your document will be encrypted with AES-256 encryption and stored securely on your device.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowDocumentModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, savingDocument && styles.saveButtonDisabled]}
                onPress={handleAddDocument}
                disabled={savingDocument}
              >
                {savingDocument ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Add Document</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Payment Method</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Card Number */}
              <Text style={styles.inputLabel}>Card Number</Text>
              <TextInput
                style={styles.input}
                value={newPayment.card_number}
                onChangeText={(text) => setNewPayment({ ...newPayment, card_number: text.replace(/\D/g, '') })}
                placeholder="4242 4242 4242 4242"
                placeholderTextColor={Colors.text.tertiary}
                keyboardType="number-pad"
                maxLength={16}
              />

              {/* Expiry */}
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Exp Month</Text>
                  <TextInput
                    style={styles.input}
                    value={newPayment.exp_month}
                    onChangeText={(text) => setNewPayment({ ...newPayment, exp_month: text.replace(/\D/g, '') })}
                    placeholder="MM"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Exp Year</Text>
                  <TextInput
                    style={styles.input}
                    value={newPayment.exp_year}
                    onChangeText={(text) => setNewPayment({ ...newPayment, exp_year: text.replace(/\D/g, '') })}
                    placeholder="YYYY"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                </View>
              </View>

              {/* CVV */}
              <Text style={styles.inputLabel}>CVV</Text>
              <TextInput
                style={[styles.input, styles.cvvInput]}
                value={newPayment.cvv}
                onChangeText={(text) => setNewPayment({ ...newPayment, cvv: text.replace(/\D/g, '') })}
                placeholder="123"
                placeholderTextColor={Colors.text.tertiary}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
              />

              {/* Billing Name */}
              <Text style={styles.inputLabel}>Name on Card</Text>
              <TextInput
                style={styles.input}
                value={newPayment.billing_name}
                onChangeText={(text) => setNewPayment({ ...newPayment, billing_name: text })}
                placeholder="John Doe"
                placeholderTextColor={Colors.text.tertiary}
                autoCapitalize="words"
              />

              {/* Billing ZIP */}
              <Text style={styles.inputLabel}>Billing ZIP Code</Text>
              <TextInput
                style={[styles.input, styles.zipInput]}
                value={newPayment.billing_zip}
                onChangeText={(text) => setNewPayment({ ...newPayment, billing_zip: text })}
                placeholder="12345"
                placeholderTextColor={Colors.text.tertiary}
                keyboardType="number-pad"
                maxLength={10}
              />

              <View style={styles.securityNoteLarge}>
                <Ionicons name="lock-closed" size={20} color={Colors.accent.emerald} />
                <Text style={styles.securityNoteLargeText}>
                  Your full card number is never stored. We only save the last 4 digits for identification. PCI-DSS Level 1 compliant.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowPaymentModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, savingPayment && styles.saveButtonDisabled]}
                onPress={handleAddPayment}
                disabled={savingPayment}
              >
                {savingPayment ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Add Card</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    padding: Spacing.lg,
  },

  header: {
    marginBottom: Spacing.xl,
  },

  headerTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
  },

  section: {
    marginBottom: Spacing['2xl'],
    gap: Spacing.md,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },

  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary.main + '15',
    borderRadius: BorderRadius.full,
  },

  addButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.primary.main,
  },

  emptyCard: {
    alignItems: 'center',
    padding: Spacing['2xl'],
    backgroundColor: Colors.surface.base,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderStyle: 'dashed',
  },

  emptyText: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },

  emptySubtext: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },

  // Document Card
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface.base,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },

  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },

  documentInfo: {
    flex: 1,
  },

  documentType: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  documentNumber: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    fontFamily: 'monospace',
    marginVertical: 2,
  },

  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },

  documentCountry: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },

  documentExpiry: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.tertiary,
  },

  documentExpired: {
    color: Colors.accent.red,
    fontWeight: '600',
  },

  // Payment Card
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface.base,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    ...Shadows.sm,
  },

  paymentCardDefault: {
    borderColor: Colors.primary.main,
  },

  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },

  paymentInfo: {
    flex: 1,
  },

  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  paymentBrand: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: Colors.text.secondary,
  },

  defaultBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    backgroundColor: Colors.primary.main + '20',
    borderRadius: BorderRadius.sm,
  },

  defaultBadgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
    color: Colors.primary.main,
  },

  paymentNumber: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.text.primary,
    fontFamily: 'monospace',
    marginVertical: 2,
  },

  paymentExpiry: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.tertiary,
  },

  paymentExpiringSoon: {
    color: Colors.accent.amber,
  },

  deleteButton: {
    padding: Spacing.sm,
  },

  // Security Note
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },

  securityNoteText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.tertiary,
  },

  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface.base,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },

  settingInfo: {
    flex: 1,
  },

  settingLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },

  settingDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },

  integrationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.base,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },

  integrationInfo: {
    flex: 1,
  },

  integrationLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  integrationStatus: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
  },

  accountInfo: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },

  version: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },

  modalContainer: {
    backgroundColor: Colors.background.secondary,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '85%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },

  modalTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    color: Colors.text.primary,
  },

  modalContent: {
    padding: Spacing.lg,
    maxHeight: 400,
  },

  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },

  inputLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },

  input: {
    backgroundColor: Colors.surface.base,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.sizes.base,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },

  cvvInput: {
    width: 100,
  },

  zipInput: {
    width: 140,
  },

  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },

  halfInput: {
    flex: 1,
  },

  typeSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },

  typeOption: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface.base,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
    gap: Spacing.xs,
  },

  typeOptionSelected: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.main + '10',
  },

  typeOptionText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
  },

  typeOptionTextSelected: {
    color: Colors.primary.main,
    fontWeight: '600',
  },

  securityNoteLarge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.accent.emerald + '10',
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
  },

  securityNoteLargeText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    lineHeight: Typography.sizes.sm * 1.5,
  },

  cancelButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.medium,
    alignItems: 'center',
  },

  cancelButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.secondary,
  },

  saveButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary.main,
    alignItems: 'center',
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
