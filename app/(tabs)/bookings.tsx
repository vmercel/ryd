import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BookingCard } from '../../components/feature/BookingCard';
import { getUserBookings } from '../../services/bookingService';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { CommonStyles } from '../../constants/styles';
import { BookingRequest, BookingType } from '../../types';

type FilterType = 'all' | 'flight' | 'ride' | 'doctor';

const FILTERS: { key: FilterType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all', label: 'All', icon: 'grid-outline' },
  { key: 'flight', label: 'Flights', icon: 'airplane-outline' },
  { key: 'ride', label: 'Rides', icon: 'car-outline' },
  { key: 'doctor', label: 'Doctor', icon: 'medkit-outline' },
];

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBookings = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);

    const { data, error } = await getUserBookings(undefined, {
      type: filter === 'all' ? undefined : filter as BookingType,
      limit: 50,
    });

    if (!error && data) {
      setBookings(data);
    }

    setLoading(false);
    setRefreshing(false);
  }, [filter]);

  useEffect(() => {
    loadBookings();
  }, [filter, loadBookings]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadBookings(false);
    }, [loadBookings])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings(false);
  };

  const getEmptyMessage = () => {
    switch (filter) {
      case 'flight':
        return { emoji: '✈️', title: 'No flights yet', text: 'Ask Atlas to book your next flight' };
      case 'ride':
        return { emoji: '🚗', title: 'No rides yet', text: 'Ask Atlas to book a ride for you' };
      case 'doctor':
        return { emoji: '🏥', title: 'No appointments yet', text: 'Ask Atlas to schedule a doctor appointment' };
      default:
        return { emoji: '📋', title: 'No bookings yet', text: 'Ask Atlas to help you book flights, rides, or doctor appointments' };
    }
  };

  const renderFilterChip = (item: typeof FILTERS[0]) => {
    const isActive = filter === item.key;
    return (
      <TouchableOpacity
        key={item.key}
        style={[styles.filterChip, isActive && styles.filterChipActive]}
        onPress={() => setFilter(item.key)}
      >
        <Ionicons
          name={item.icon}
          size={16}
          color={isActive ? '#FFFFFF' : Colors.text.secondary}
        />
        <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const emptyMessage = getEmptyMessage();

  return (
    <View style={[CommonStyles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
        <Text style={styles.subtitle}>
          {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'}
        </Text>
      </View>

      {/* Filter chips */}
      <View style={styles.filterContainer}>
        {FILTERS.map(renderFilterChip)}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.main} />
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>{emptyMessage.emoji}</Text>
          <Text style={styles.emptyTitle}>{emptyMessage.title}</Text>
          <Text style={styles.emptyText}>{emptyMessage.text}</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" />
            <Text style={styles.emptyButtonText}>Talk to Atlas</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onPress={() => router.push(`/booking/${item.id}`)}
              showType={filter === 'all'}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary.main}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
  },

  title: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: '700',
    color: Colors.text.primary,
  },

  subtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },

  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },

  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface.elevated,
  },

  filterChipActive: {
    backgroundColor: Colors.primary.main,
  },

  filterChipText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '500',
    color: Colors.text.secondary,
  },

  filterChipTextActive: {
    color: '#FFFFFF',
  },

  list: {
    padding: Spacing.lg,
    paddingTop: Spacing.sm,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['2xl'],
  },

  emptyEmoji: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },

  emptyTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },

  emptyText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },

  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },

  emptyButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
