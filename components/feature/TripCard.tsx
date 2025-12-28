import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { TripRequest } from '../../types';

interface TripCardProps {
  trip: TripRequest;
  onPress: () => void;
}

export const TripCard: React.FC<TripCardProps> = ({ trip, onPress }) => {
  const statusColor = Colors.tripStatus[trip.status || 'planning'];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {trip.title}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {trip.status?.replace('-', ' ')}
          </Text>
        </View>
      </View>

      <View style={styles.route}>
        <Text style={styles.location}>{trip.origin || 'Origin'}</Text>
        <View style={styles.arrow}>
          <View style={styles.arrowLine} />
          <Text style={styles.arrowIcon}>→</Text>
        </View>
        <Text style={styles.location}>{trip.destination || 'Destination'}</Text>
      </View>

      {trip.depart_date ? (
        <View style={styles.dates}>
          <Text style={styles.dateText}>
            {new Date(trip.depart_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
          {trip.return_date ? (
            <>
              <Text style={styles.dateSeparator}>-</Text>
              <Text style={styles.dateText}>
                {new Date(trip.return_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </>
          ) : null}
        </View>
      ) : null}

      {trip.budget_amount ? (
        <View style={styles.budget}>
          <Text style={styles.budgetLabel}>Budget:</Text>
          <Text style={styles.budgetAmount}>
            {trip.currency} {trip.budget_amount?.toLocaleString()}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

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
  
  title: {
    flex: 1,
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.text.primary,
    marginRight: Spacing.sm,
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
  },
  
  arrowLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border.medium,
  },
  
  arrowIcon: {
    fontSize: Typography.sizes.lg,
    color: Colors.text.tertiary,
    marginLeft: Spacing.xs,
  },
  
  dates: {
    flexDirection: 'row',
    alignItems: 'center',
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
  
  budget: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  
  budgetLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.tertiary,
  },
  
  budgetAmount: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.accent.emerald,
  },
});
