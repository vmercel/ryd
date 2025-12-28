import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getTripById } from '../../services/agentService';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { CommonStyles } from '../../constants/styles';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [tripData, setTripData] = useState<any>(null);

  useEffect(() => {
    loadTripData();
  }, [id]);

  const loadTripData = async () => {
    if (!id) return;
    
    setLoading(true);
    const { data, error } = await getTripById(id);
    if (!error && data) {
      setTripData(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={[CommonStyles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
      </View>
    );
  }

  if (!tripData) {
    return (
      <View style={[CommonStyles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>Trip not found</Text>
      </View>
    );
  }

  const { trip, events, bookings } = tripData;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: trip.title,
          headerShown: true,
        }}
      />
      <ScrollView
        style={[CommonStyles.container, { paddingTop: insets.top }]}
        contentContainerStyle={styles.content}
      >
        {/* Trip Header */}
        <View style={styles.header}>
          <View style={styles.route}>
            <View style={styles.location}>
              <Ionicons name="location" size={20} color={Colors.text.secondary} />
              <Text style={styles.locationText}>{trip.origin}</Text>
            </View>
            <Ionicons name="arrow-forward" size={24} color={Colors.primary.main} />
            <View style={styles.location}>
              <Ionicons name="location" size={20} color={Colors.text.secondary} />
              <Text style={styles.locationText}>{trip.destination}</Text>
            </View>
          </View>

          <View style={styles.dates}>
            <Text style={styles.dateLabel}>Departure</Text>
            <Text style={styles.dateValue}>{formatDate(trip.depart_date)}</Text>
          </View>

          <View style={styles.dates}>
            <Text style={styles.dateLabel}>Return</Text>
            <Text style={styles.dateValue}>{formatDate(trip.return_date)}</Text>
          </View>

          {trip.budget_amount ? (
            <View style={styles.budgetBadge}>
              <Text style={styles.budgetText}>
                Budget: ${trip.budget_amount.toLocaleString()} {trip.currency}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Calendar Events */}
        {events.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Calendar Events</Text>
            {events.map((event: any) => (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.eventIcon}>
                  <Ionicons
                    name={event.event_type.includes('flight') ? 'airplane' : 'calendar'}
                    size={20}
                    color={Colors.primary.main}
                  />
                </View>
                <View style={styles.eventDetails}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  {event.description ? (
                    <Text style={styles.eventDescription}>{event.description}</Text>
                  ) : null}
                  <Text style={styles.eventTime}>
                    {new Date(event.start_time).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Bookings */}
        {bookings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bookings</Text>
            {bookings.map((booking: any) => (
              <View key={booking.id} style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <Text style={styles.bookingDomain}>{booking.domain.toUpperCase()}</Text>
                  <Text style={styles.bookingStatus}>{booking.status}</Text>
                </View>
                <Text style={styles.bookingProvider}>{booking.provider}</Text>
                {booking.amount ? (
                  <Text style={styles.bookingAmount}>
                    ${booking.amount} {booking.currency}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        )}

        {/* Trip Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsCard}>
            <DetailRow label="Status" value={trip.status} />
            <DetailRow label="Cabin Class" value={trip.cabin_class || 'Not specified'} />
            <DetailRow
              label="Nonstop Only"
              value={trip.nonstop_only ? 'Yes' : 'No'}
            />
            {trip.travelers_json && trip.travelers_json.length > 0 && (
              <DetailRow
                label="Travelers"
                value={`${trip.travelers_json[0].count || 1} ${trip.travelers_json[0].type || 'adult'}(s)`}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
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
  },

  errorText: {
    fontSize: Typography.sizes.lg,
    color: Colors.text.secondary,
  },

  header: {
    backgroundColor: Colors.surface.base,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },

  route: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },

  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  locationText: {
    fontSize: Typography.sizes.xl,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  dates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },

  dateLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.tertiary,
  },

  dateValue: {
    fontSize: Typography.sizes.base,
    fontWeight: '500',
    color: Colors.text.primary,
  },

  budgetBadge: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.accent.emerald + '20',
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
  },

  budgetText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.accent.emerald,
  },

  section: {
    marginBottom: Spacing.xl,
  },

  sectionTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },

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

  bookingCard: {
    backgroundColor: Colors.surface.base,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },

  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },

  bookingDomain: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: Colors.primary.main,
    letterSpacing: 1,
  },

  bookingStatus: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.accent.amber,
    textTransform: 'capitalize',
  },

  bookingProvider: {
    fontSize: Typography.sizes.base,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },

  bookingAmount: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.accent.emerald,
  },

  detailsCard: {
    backgroundColor: Colors.surface.base,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },

  detailLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.tertiary,
  },

  detailValue: {
    fontSize: Typography.sizes.base,
    fontWeight: '500',
    color: Colors.text.primary,
    textTransform: 'capitalize',
  },
});
