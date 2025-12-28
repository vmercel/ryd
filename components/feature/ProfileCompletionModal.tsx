import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface ProfileCompletionModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (data: ProfileData) => Promise<void>;
  missingFields: {
    profile?: boolean;
    travelData?: boolean;
    paymentData?: boolean;
  };
}

export interface ProfileData {
  // Basic Info
  full_name?: string;
  phone?: string;
  date_of_birth?: string;
  
  // Travel Data
  passport_number?: string;
  passport_country?: string;
  passport_expiry?: string;
  nationality?: string;
  known_traveler_number?: string;
  seat_preference?: string;
  meal_preference?: string;
  
  // Payment Data
  payment_card_number?: string;
  payment_exp_month?: string;
  payment_exp_year?: string;
  payment_cvv?: string;
  payment_zip?: string;
}

export const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({
  visible,
  onClose,
  onComplete,
  missingFields,
}) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({});

  const totalSteps = Object.values(missingFields).filter(Boolean).length;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await onComplete(formData);
      onClose();
    } catch (error) {
      console.error('Profile completion error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof ProfileData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const renderStep = () => {
    let currentStep = 0;
    
    // Step 1: Basic Profile
    if (missingFields.profile) {
      currentStep++;
      if (step === currentStep) {
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Complete Your Profile</Text>
            <Text style={styles.stepDescription}>
              We need some basic information to proceed with your booking.
            </Text>

            <Input
              label="Full Name (as on passport)"
              value={formData.full_name}
              onChangeText={(text) => updateField('full_name', text)}
              placeholder="John Doe"
            />
            <Input
              label="Phone Number"
              value={formData.phone}
              onChangeText={(text) => updateField('phone', text)}
              placeholder="+1 234 567 8900"
              keyboardType="phone-pad"
            />
            <Input
              label="Date of Birth"
              value={formData.date_of_birth}
              onChangeText={(text) => updateField('date_of_birth', text)}
              placeholder="YYYY-MM-DD"
            />
          </View>
        );
      }
    }

    // Step 2: Travel Data
    if (missingFields.travelData) {
      currentStep++;
      if (step === currentStep) {
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Travel Information</Text>
            <Text style={styles.stepDescription}>
              Required for international flight bookings.
            </Text>

            <Input
              label="Passport Number"
              value={formData.passport_number}
              onChangeText={(text) => updateField('passport_number', text)}
              placeholder="123456789"
              autoCapitalize="characters"
            />
            <Input
              label="Passport Country"
              value={formData.passport_country}
              onChangeText={(text) => updateField('passport_country', text)}
              placeholder="USA"
              autoCapitalize="characters"
              maxLength={3}
            />
            <Input
              label="Passport Expiry Date"
              value={formData.passport_expiry}
              onChangeText={(text) => updateField('passport_expiry', text)}
              placeholder="YYYY-MM-DD"
            />
            <Input
              label="Nationality"
              value={formData.nationality}
              onChangeText={(text) => updateField('nationality', text)}
              placeholder="American"
            />
            <Input
              label="Known Traveler Number (Optional)"
              value={formData.known_traveler_number}
              onChangeText={(text) => updateField('known_traveler_number', text)}
              placeholder="TSA PreCheck / Global Entry"
            />
          </View>
        );
      }
    }

    // Step 3: Payment Data
    if (missingFields.paymentData) {
      currentStep++;
      if (step === currentStep) {
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Payment Method</Text>
            <Text style={styles.stepDescription}>
              Add a payment method to complete bookings.
            </Text>

            <Input
              label="Card Number"
              value={formData.payment_card_number}
              onChangeText={(text) => updateField('payment_card_number', text)}
              placeholder="4242 4242 4242 4242"
              keyboardType="number-pad"
              maxLength={19}
            />

            <View style={styles.rowContainer}>
              <View style={styles.rowItem}>
                <Input
                  label="Exp Month"
                  value={formData.payment_exp_month}
                  onChangeText={(text) => updateField('payment_exp_month', text)}
                  placeholder="MM"
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
              <View style={styles.rowItem}>
                <Input
                  label="Exp Year"
                  value={formData.payment_exp_year}
                  onChangeText={(text) => updateField('payment_exp_year', text)}
                  placeholder="YYYY"
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
            </View>

            <View style={styles.rowContainer}>
              <View style={styles.rowItem}>
                <Input
                  label="CVV"
                  value={formData.payment_cvv}
                  onChangeText={(text) => updateField('payment_cvv', text)}
                  placeholder="123"
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
              <View style={styles.rowItem}>
                <Input
                  label="ZIP Code"
                  value={formData.payment_zip}
                  onChangeText={(text) => updateField('payment_zip', text)}
                  placeholder="12345"
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>
            </View>

            <View style={styles.secureNotice}>
              <Ionicons name="shield-checkmark" size={20} color="#10B981" />
              <Text style={styles.secureText}>Your payment info is encrypted and secure</Text>
            </View>
          </View>
        );
      }
    }

    return null;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Complete Profile</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Step {step} of {totalSteps}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(step / totalSteps) * 100}%` }]} />
          </View>
        </View>

        {/* Content */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {renderStep()}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {step > 1 ? (
            <>
              <View style={styles.footerButton}>
                <Button title="Back" onPress={handleBack} variant="secondary" />
              </View>
              <View style={styles.footerButton}>
                {step < totalSteps ? (
                  <Button title="Next" onPress={handleNext} />
                ) : (
                  <Button title="Complete" onPress={handleComplete} loading={loading} />
                )}
              </View>
            </>
          ) : (
            <View style={styles.footerButtonFull}>
              <Button title="Next" onPress={handleNext} />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },

  closeButton: {
    padding: Spacing.xs,
  },

  headerTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    color: Colors.text.primary,
  },

  placeholder: {
    width: 40,
  },

  progressContainer: {
    padding: Spacing.lg,
  },

  progressText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },

  progressBar: {
    height: 4,
    backgroundColor: Colors.border.light,
    borderRadius: 2,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary.main,
    borderRadius: 2,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },

  stepContent: {
    gap: Spacing.md,
  },

  stepTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },

  stepDescription: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },

  rowContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },

  rowItem: {
    flex: 1,
  },

  secureNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
    marginTop: Spacing.md,
  },

  secureText: {
    fontSize: Typography.sizes.sm,
    color: '#10B981',
    flex: 1,
  },

  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
    backgroundColor: Colors.background.primary,
  },

  footerButton: {
    flex: 1,
  },

  footerButtonFull: {
    flex: 1,
  },
});

