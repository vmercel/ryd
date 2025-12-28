import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TripCard } from '../../components/feature/TripCard';
import { getUserTrips } from '../../services/agentService';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { CommonStyles } from '../../constants/styles';

export default function TripsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    setLoading(true);
    const { data, error } = await getUserTrips();
    if (!error && data) {
      setTrips(data);
    }
    setLoading(false);
  };

  const formatTripDates = (depart: string, returnDate: string) => {
    const departDate = new Date(depart);
    const returnD = new Date(returnDate);
    const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
    return `${formatter.format(departDate)} - ${formatter.format(returnD)}, ${departDate.getFullYear()}`;
  };

  return (
    <View style={[CommonStyles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Trips</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.main} />
        </View>
      ) : trips.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>✈️</Text>
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.emptyText}>Tap Atlas on the Home tab to plan your first trip</Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TripCard
              trip={item}
              onPress={() => router.push(`/trip/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: Spacing.lg,
  },

  title: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: '700',
    color: Colors.text.primary,
  },

  list: {
    padding: Spacing.lg,
    gap: Spacing.md,
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
  },
});
