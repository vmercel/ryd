import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { BookingRequest, BookingType, BookingStatus } from '../../types';
import {
  getBookingTypeIcon,
  getBookingTypeColor,
  getStatusColor,
  formatBookingDate,
  getBookingSubtitle,
} from '../../services/bookingService';

interface BookingCardProps {
  booking: BookingRequest;
  onPress: () => void;
  showType?: boolean;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onPress,
  showType = true,
}) => {
  const statusColor = getStatusColor(booking.status || 'planning');
  const typeColor = getBookingTypeColor(booking.booking_type);
  const typeIcon = getBookingTypeIcon(booking.booking_type) as keyof typeof Ionicons.glyphMap;

  const renderBookingContent = () => {
    switch (booking.booking_type) {
      case 'flight':
        return (
          <>
            <View style={styles.route}>
              <Text style={styles.location}>{booking.origin || 'Origin'}</Text>
              <View style={styles.arrow}>
                <View style={styles.arrowLine} />
                <Ionicons name="airplane" size={16} color={typeColor} />
              </View>
              <Text style={styles.location}>{booking.destination || 'Destination'}</Text>
            </View>

            {booking.depart_date && (
              <View style={styles.dates}>
                <Ionicons name="calendar-outline" size={14} color={Colors.text.secondary} />
                <Text style={styles.dateText}>
                  {new Date(booking.depart_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
                {booking.return_date && (
                  <>
                    <Text style={styles.dateSeparator}>-</Text>
                    <Text style={styles.dateText}>
                      {new Date(booking.return_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </>
                )}
              </View>
            )}

            {booking.budget_amount && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Budget:</Text>
                <Text style={styles.metaValue}>
                  {booking.currency || 'USD'} {booking.budget_amount?.toLocaleString()}
                </Text>
              </View>
            )}
          </>
        );

      case 'ride':
        return (
          <>
            <View style={styles.rideRoute}>
              <View style={styles.ridePoint}>
                <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.rideAddress} numberOfLines={1}>
                  {booking.pickup_location_json?.address || 'Pickup location'}
                </Text>
              </View>
              <View style={styles.rideLine} />
              <View style={styles.ridePoint}>
                <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.rideAddress} numberOfLines={1}>
                  {booking.dropoff_location_json?.address || 'Destination'}
                </Text>
              </View>
            </View>

            {booking.scheduled_time && (
              <View style={styles.dates}>
                <Ionicons name="time-outline" size={14} color={Colors.text.secondary} />
                <Text style={styles.dateText}>
                  {new Date(booking.scheduled_time).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            )}

            {booking.driver_info_json?.name && (
              <View style={styles.metaRow}>
                <Ionicons name="person-outline" size={14} color={Colors.text.secondary} />
                <Text style={styles.metaLabel}>Driver:</Text>
                <Text style={styles.metaValue}>{booking.driver_info_json.name}</Text>
                {booking.driver_info_json.rating && (
                  <View style={styles.rating}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={styles.ratingText}>{booking.driver_info_json.rating}</Text>
                  </View>
                )}
              </View>
            )}

            {booking.eta_minutes && booking.status === 'confirmed' && (
              <View style={styles.etaBadge}>
                <Ionicons name="car" size={14} color="#10B981" />
                <Text style={styles.etaText}>{booking.eta_minutes} min away</Text>
              </View>
            )}
          </>
        );

      case 'doctor':
        return (
          <>
            <View style={styles.doctorInfo}>
              <Ionicons name="medkit" size={20} color={typeColor} />
              <View style={styles.doctorDetails}>
                <Text style={styles.doctorName}>
                  {booking.doctor_info_json?.name || 'Doctor'}
                </Text>
                {booking.doctor_info_json?.specialty && (
                  <Text style={styles.doctorSpecialty}>
                    {booking.doctor_info_json.specialty}
                  </Text>
                )}
              </View>
            </View>

            {booking.appointment_time && (
              <View style={styles.dates}>
                <Ionicons name="calendar-outline" size={14} color={Colors.text.secondary} />
                <Text style={styles.dateText}>
                  {new Date(booking.appointment_time).toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            )}

            <View style={styles.appointmentType}>
              <Ionicons
                name={booking.appointment_type === 'telehealth' ? 'videocam' : 'location'}
                size={14}
                color={Colors.text.secondary}
              />
              <Text style={styles.appointmentTypeText}>
                {booking.appointment_type === 'telehealth' ? 'Telehealth' : 'In-person'}
              </Text>
            </View>

            {booking.confirmation_number && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Confirmation:</Text>
                <Text style={styles.confirmationNumber}>
                  {booking.confirmation_number}
                </Text>
              </View>
            )}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {showType && (
            <View style={[styles.typeIcon, { backgroundColor: typeColor + '20' }]}>
              <Ionicons name={typeIcon} size={16} color={typeColor} />
            </View>
          )}
          <Text style={styles.title} numberOfLines={1}>
            {booking.title}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {booking.status?.replace('-', ' ')}
          </Text>
        </View>
      </View>

      {renderBookingContent()}
    </TouchableOpacity>
  );
};

// Legacy export for backwards compatibility
export const TripCard = BookingCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.base,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginRight: Spacing.sm,
  },

  typeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    flex: 1,
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  statusText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  // Flight styles
  route: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },

  location: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    color: Colors.text.primary,
  },

  arrow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.sm,
    gap: Spacing.xs,
  },

  arrowLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border.medium,
  },

  dates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },

  dateText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },

  dateSeparator: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.tertiary,
    marginHorizontal: Spacing.xs,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },

  metaLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.tertiary,
  },

  metaValue: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.accent.emerald,
  },

  // Ride styles
  rideRoute: {
    marginBottom: Spacing.sm,
  },

  ridePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  rideLine: {
    width: 2,
    height: 20,
    backgroundColor: Colors.border.light,
    marginLeft: 4,
    marginVertical: 2,
  },

  rideAddress: {
    flex: 1,
    fontSize: Typography.sizes.base,
    color: Colors.text.primary,
  },

  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  ratingText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.secondary,
  },

  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: '#10B98120',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },

  etaText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: '#10B981',
  },

  // Doctor styles
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },

  doctorDetails: {
    flex: 1,
  },

  doctorName: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  doctorSpecialty: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },

  appointmentType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },

  appointmentTypeText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },

  confirmationNumber: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: Colors.primary.main,
    fontFamily: 'monospace',
  },
});
