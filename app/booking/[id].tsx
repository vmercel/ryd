import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  getBookingById,
  cancelBooking,
  deleteBooking,
  getBookingTypeIcon,
  getBookingTypeColor,
  getStatusColor,
} from '../../services/bookingService';
import { logAuditEvent, AuditAction } from '../../services/securityService';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { CommonStyles } from '../../constants/styles';
import { BookingRequest, CalendarEvent } from '../../types';
import { useAuth } from '@/template';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingRequest | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadBookingData();
  }, [id]);

  const loadBookingData = async () => {
    if (!id) return;

    setLoading(true);
    const { data, error } = await getBookingById(id);
    if (!error && data) {
      setBooking(data.booking);
      setEvents(data.events);
    }
    setLoading(false);
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            const { success, error } = await cancelBooking(id!);
            if (success) {
              // Log audit event
              if (user?.id) {
                await logAuditEvent(user.id, AuditAction.BOOKING_CANCELLED, 'booking', {
                  resourceId: id,
                  details: { bookingType: booking?.booking_type, title: booking?.title },
                });
              }
              loadBookingData();
            } else {
              Alert.alert('Error', error || 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Booking',
      'This will permanently remove this booking and all associated data. This action cannot be undone.\n\nAre you sure you want to proceed?',
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            const { success, error } = await deleteBooking(id!);
            if (success) {
              // Log audit event for compliance
              if (user?.id) {
                await logAuditEvent(user.id, AuditAction.BOOKING_DELETED, 'booking', {
                  resourceId: id,
                  details: {
                    bookingType: booking?.booking_type,
                    title: booking?.title,
                    deletedAt: new Date().toISOString(),
                  },
                });
              }
              Alert.alert('Deleted', 'Booking has been permanently deleted.', [
                { text: 'OK', onPress: () => router.push('/(tabs)/bookings') },
              ]);
            } else {
              Alert.alert(
                'Cannot Delete',
                error || 'Only draft or cancelled bookings can be deleted. Please cancel the booking first if you want to remove it.'
              );
            }
            setIsDeleting(false);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[CommonStyles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={[CommonStyles.container, styles.errorContainer]}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.text.tertiary} />
        <Text style={styles.errorText}>Booking not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const typeColor = getBookingTypeColor(booking.booking_type);
  const statusColor = getStatusColor(booking.status || 'planning');
  const typeIcon = getBookingTypeIcon(booking.booking_type) as keyof typeof Ionicons.glyphMap;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const renderFlightDetails = () => (
    <>
      <View style={styles.routeContainer}>
        <View style={styles.routePoint}>
          <View style={[styles.routeDot, { backgroundColor: '#10B981' }]} />
          <View>
            <Text style={styles.routeCode}>{booking.origin || '---'}</Text>
            <Text style={styles.routeLabel}>Origin</Text>
          </View>
        </View>
        <View style={styles.routeLine}>
          <Ionicons name="airplane" size={20} color={typeColor} />
        </View>
        <View style={styles.routePoint}>
          <View style={[styles.routeDot, { backgroundColor: '#EF4444' }]} />
          <View>
            <Text style={styles.routeCode}>{booking.destination || '---'}</Text>
            <Text style={styles.routeLabel}>Destination</Text>
          </View>
        </View>
      </View>

      <View style={styles.detailsGrid}>
        <DetailCard
          icon="calendar-outline"
          label="Departure"
          value={booking.depart_date ? formatDate(booking.depart_date) : 'Not set'}
        />
        <DetailCard
          icon="calendar-outline"
          label="Return"
          value={booking.return_date ? formatDate(booking.return_date) : 'Not set'}
        />
        <DetailCard
          icon="people-outline"
          label="Travelers"
          value={booking.travelers_json?.[0]?.count?.toString() || '1'}
        />
        <DetailCard
          icon="airplane-outline"
          label="Cabin"
          value={booking.cabin_class || 'Economy'}
        />
      </View>

      {booking.budget_amount && (
        <View style={styles.budgetContainer}>
          <Ionicons name="wallet-outline" size={20} color={Colors.accent.emerald} />
          <Text style={styles.budgetLabel}>Budget:</Text>
          <Text style={styles.budgetValue}>
            {booking.currency || 'USD'} {booking.budget_amount.toLocaleString()}
          </Text>
        </View>
      )}
    </>
  );

  const renderRideDetails = () => (
    <>
      <View style={styles.rideRouteContainer}>
        <View style={styles.ridePoint}>
          <View style={[styles.rideMarker, { backgroundColor: '#10B981' }]}>
            <Ionicons name="radio-button-on" size={12} color="#FFFFFF" />
          </View>
          <View style={styles.rideAddressContainer}>
            <Text style={styles.rideLabel}>Pickup</Text>
            <Text style={styles.rideAddress}>
              {booking.pickup_location_json?.address || 'Pickup location'}
            </Text>
          </View>
        </View>
        <View style={styles.rideConnector} />
        <View style={styles.ridePoint}>
          <View style={[styles.rideMarker, { backgroundColor: '#EF4444' }]}>
            <Ionicons name="location" size={12} color="#FFFFFF" />
          </View>
          <View style={styles.rideAddressContainer}>
            <Text style={styles.rideLabel}>Dropoff</Text>
            <Text style={styles.rideAddress}>
              {booking.dropoff_location_json?.address || 'Destination'}
            </Text>
          </View>
        </View>
      </View>

      {booking.scheduled_time && (
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={20} color={Colors.text.secondary} />
          <Text style={styles.detailRowLabel}>Scheduled:</Text>
          <Text style={styles.detailRowValue}>{formatDateTime(booking.scheduled_time)}</Text>
        </View>
      )}

      {booking.driver_info_json?.name && (
        <View style={styles.driverCard}>
          <View style={styles.driverAvatar}>
            <Ionicons name="person" size={24} color={Colors.text.secondary} />
          </View>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{booking.driver_info_json.name}</Text>
            {booking.driver_info_json.rating && (
              <View style={styles.driverRating}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={styles.driverRatingText}>{booking.driver_info_json.rating}</Text>
              </View>
            )}
          </View>
          {booking.driver_info_json.vehicle && (
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleText}>
                {booking.driver_info_json.vehicle.color} {booking.driver_info_json.vehicle.make}{' '}
                {booking.driver_info_json.vehicle.model}
              </Text>
              <Text style={styles.vehiclePlate}>{booking.driver_info_json.vehicle.plate}</Text>
            </View>
          )}
        </View>
      )}
    </>
  );

  const renderDoctorDetails = () => (
    <>
      {booking.doctor_info_json && (
        <View style={styles.doctorCard}>
          <View style={[styles.doctorIcon, { backgroundColor: typeColor + '20' }]}>
            <Ionicons name="medkit" size={28} color={typeColor} />
          </View>
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>
              {booking.doctor_info_json.name || 'Doctor'}
            </Text>
            {booking.doctor_info_json.specialty && (
              <Text style={styles.doctorSpecialty}>{booking.doctor_info_json.specialty}</Text>
            )}
            {booking.doctor_info_json.rating && (
              <View style={styles.doctorRating}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={styles.doctorRatingText}>{booking.doctor_info_json.rating}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {booking.appointment_time && (
        <View style={styles.appointmentTime}>
          <Ionicons name="calendar" size={20} color={typeColor} />
          <Text style={styles.appointmentTimeText}>
            {formatDateTime(booking.appointment_time)}
          </Text>
        </View>
      )}

      <View style={styles.detailsGrid}>
        <DetailCard
          icon={booking.appointment_type === 'telehealth' ? 'videocam-outline' : 'location-outline'}
          label="Type"
          value={booking.appointment_type === 'telehealth' ? 'Telehealth' : 'In-person'}
        />
        {booking.doctor_info_json?.address && (
          <DetailCard
            icon="business-outline"
            label="Location"
            value={booking.doctor_info_json.address}
          />
        )}
      </View>

      {booking.symptoms_json && booking.symptoms_json.length > 0 && (
        <View style={styles.symptomsContainer}>
          <Text style={styles.symptomsLabel}>Symptoms:</Text>
          <View style={styles.symptomTags}>
            {booking.symptoms_json.map((symptom, index) => (
              <View key={index} style={styles.symptomTag}>
                <Text style={styles.symptomTagText}>{symptom}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </>
  );

  const canCancel = ['planning', 'searching', 'watching', 'holding', 'booked', 'confirmed'].includes(
    booking.status || ''
  );

  // Only allow deletion of draft or cancelled bookings (for data protection compliance)
  const canDelete = ['planning', 'cancelled'].includes(booking.status || '');

  return (
    <>
      <Stack.Screen
        options={{
          title: booking.title,
          headerShown: true,
        }}
      />
      <ScrollView
        style={[CommonStyles.container]}
        contentContainerStyle={styles.content}
      >
        {/* Type Badge */}
        <View style={styles.typeHeader}>
          <View style={[styles.typeIconLarge, { backgroundColor: typeColor + '20' }]}>
            <Ionicons name={typeIcon} size={32} color={typeColor} />
          </View>
          <View style={styles.typeInfo}>
            <Text style={[styles.typeLabel, { color: typeColor }]}>
              {booking.booking_type.toUpperCase()}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {booking.status?.replace('-', ' ')}
              </Text>
            </View>
          </View>
        </View>

        {/* Confirmation Number */}
        {booking.confirmation_number && (
          <View style={styles.confirmationContainer}>
            <Text style={styles.confirmationLabel}>Confirmation #</Text>
            <Text style={styles.confirmationNumber}>{booking.confirmation_number}</Text>
          </View>
        )}

        {/* Type-specific content */}
        <View style={styles.section}>
          {booking.booking_type === 'flight' && renderFlightDetails()}
          {booking.booking_type === 'ride' && renderRideDetails()}
          {booking.booking_type === 'doctor' && renderDoctorDetails()}
        </View>

        {/* Notes */}
        {booking.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{booking.notes}</Text>
          </View>
        )}

        {/* Calendar Events */}
        {events.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Calendar Events</Text>
            {events.map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.eventIcon}>
                  <Ionicons name="calendar-outline" size={20} color={Colors.primary.main} />
                </View>
                <View style={styles.eventDetails}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  {event.description && (
                    <Text style={styles.eventDescription}>{event.description}</Text>
                  )}
                  <Text style={styles.eventTime}>
                    {formatDateTime(event.start_time)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        {(canCancel || canDelete) && (
          <View style={styles.actions}>
            {canCancel && (
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                <Text style={styles.cancelButtonText}>Cancel Booking</Text>
              </TouchableOpacity>
            )}
            {canDelete && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={20} color="#DC2626" />
                    <Text style={styles.deleteButtonText}>Delete Permanently</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Timestamps */}
        <View style={styles.timestamps}>
          <Text style={styles.timestampText}>
            Created: {formatDateTime(booking.created_at || '')}
          </Text>
          {booking.updated_at && booking.updated_at !== booking.created_at && (
            <Text style={styles.timestampText}>
              Updated: {formatDateTime(booking.updated_at)}
            </Text>
          )}
        </View>
      </ScrollView>
    </>
  );
}

interface DetailCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

const DetailCard: React.FC<DetailCardProps> = ({ icon, label, value }) => (
  <View style={styles.detailCard}>
    <Ionicons name={icon} size={18} color={Colors.text.secondary} />
    <Text style={styles.detailCardLabel}>{label}</Text>
    <Text style={styles.detailCardValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },

  errorText: {
    fontSize: Typography.sizes.lg,
    color: Colors.text.secondary,
  },

  backButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.full,
  },

  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },

  typeIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  typeInfo: {
    flex: 1,
  },

  typeLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
    alignSelf: 'flex-start',
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  statusText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  confirmationContainer: {
    backgroundColor: Colors.surface.elevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },

  confirmationLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },

  confirmationNumber: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '700',
    color: Colors.primary.main,
    fontFamily: 'monospace',
    letterSpacing: 2,
  },

  section: {
    marginBottom: Spacing.xl,
  },

  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },

  // Flight styles
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface.base,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },

  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  routeCode: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
  },

  routeLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.tertiary,
  },

  routeLine: {
    flex: 1,
    alignItems: 'center',
  },

  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },

  detailCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface.base,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
    ...Shadows.sm,
  },

  detailCardLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.tertiary,
  },

  detailCardValue: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.primary,
    textTransform: 'capitalize',
  },

  budgetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent.emerald + '10',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },

  budgetLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },

  budgetValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.accent.emerald,
  },

  // Ride styles
  rideRouteContainer: {
    backgroundColor: Colors.surface.base,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },

  ridePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },

  rideMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  rideAddressContainer: {
    flex: 1,
  },

  rideLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.tertiary,
    marginBottom: 2,
  },

  rideAddress: {
    fontSize: Typography.sizes.base,
    color: Colors.text.primary,
    fontWeight: '500',
  },

  rideConnector: {
    width: 2,
    height: 30,
    backgroundColor: Colors.border.light,
    marginLeft: 11,
    marginVertical: Spacing.xs,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },

  detailRowLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },

  detailRowValue: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  driverCard: {
    backgroundColor: Colors.surface.base,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.md,
  },

  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },

  driverInfo: {
    marginBottom: Spacing.sm,
  },

  driverName: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  driverRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  driverRatingText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.secondary,
  },

  vehicleInfo: {
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },

  vehicleText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.primary,
  },

  vehiclePlate: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: Colors.text.secondary,
    marginTop: 2,
  },

  // Doctor styles
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.base,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.md,
  },

  doctorIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  doctorInfo: {
    flex: 1,
  },

  doctorName: {
    fontSize: Typography.sizes.xl,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  doctorSpecialty: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },

  doctorRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs,
  },

  doctorRatingText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.secondary,
  },

  appointmentTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface.elevated,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },

  appointmentTimeText: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  symptomsContainer: {
    marginTop: Spacing.md,
  },

  symptomsLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },

  symptomTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },

  symptomTag: {
    backgroundColor: Colors.surface.elevated,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },

  symptomTagText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },

  // Notes
  notesContainer: {
    backgroundColor: Colors.surface.base,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.sm,
  },

  notesLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },

  notesText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.primary,
    lineHeight: 22,
  },

  // Events
  eventCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface.base,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },

  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary.main + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },

  eventDetails: {
    flex: 1,
  },

  eventTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },

  eventDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },

  eventTime: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.tertiary,
  },

  // Actions
  actions: {
    marginBottom: Spacing.xl,
  },

  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#EF4444',
    marginBottom: Spacing.sm,
  },

  cancelButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: '#EF4444',
  },

  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#DC262610',
    borderWidth: 1,
    borderColor: '#DC2626',
  },

  deleteButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: '#DC2626',
  },

  // Timestamps
  timestamps: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingTop: Spacing.md,
  },

  timestampText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.tertiary,
    marginBottom: Spacing.xs,
  },
});
