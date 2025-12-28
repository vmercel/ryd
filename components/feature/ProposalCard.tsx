import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';

interface ProposalCardProps {
  title: string;
  details: {
    origin: string;
    destination: string;
    dates: string;
    budget?: string;
    travelers?: number;
  };
  onApprove: () => void;
  onAdjust: () => void;
}

export const ProposalCard: React.FC<ProposalCardProps> = ({
  title,
  details,
  onApprove,
  onAdjust,
}) => {
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 15 });
    opacity.value = withDelay(200, withSpring(1));
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  // Safe access to details with defaults
  const safeDetails = details || { origin: 'Origin', destination: 'Destination', dates: 'Dates TBD' };

  return (
    <Animated.View style={[styles.container, cardStyle]}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={24} color={Colors.accent.amber} />
        <Text style={styles.title}>{title || 'Your Trip'}</Text>
      </View>

      <View style={styles.route}>
        <View style={styles.location}>
          <Ionicons name="location" size={20} color={Colors.text.secondary} />
          <Text style={styles.locationText}>{safeDetails.origin || 'Origin'}</Text>
        </View>
        <Ionicons name="arrow-forward" size={24} color={Colors.primary.main} />
        <View style={styles.location}>
          <Ionicons name="location" size={20} color={Colors.text.secondary} />
          <Text style={styles.locationText}>{safeDetails.destination || 'Destination'}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <DetailRow icon="calendar" text={safeDetails.dates || 'Dates TBD'} />
        {safeDetails.budget ? <DetailRow icon="cash" text={safeDetails.budget} /> : null}
        {safeDetails.travelers ? (
          <DetailRow icon="people" text={`${safeDetails.travelers} traveler${safeDetails.travelers > 1 ? 's' : ''}`} />
        ) : null}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.adjustButton} onPress={onAdjust}>
          <Ionicons name="options" size={20} color={Colors.text.primary} />
          <Text style={styles.adjustText}>Adjust</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.approveButton} onPress={onApprove}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.text.primary} />
          <Text style={styles.approveText}>Approve</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

interface DetailRowProps {
  icon: string;
  text: string;
}

const DetailRow: React.FC<DetailRowProps> = ({ icon, text }) => (
  <View style={styles.detailRow}>
    <Ionicons name={icon as any} size={16} color={Colors.text.tertiary} />
    <Text style={styles.detailText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface.base,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    margin: Spacing.lg,
    ...Shadows.xl,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },

  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    color: Colors.text.primary,
  },

  route: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border.light,
  },

  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  locationText: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  details: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  detailText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
  },

  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },

  adjustButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface.overlay,
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },

  adjustText: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  approveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary.main,
  },

  approveText: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.primary,
  },
});
