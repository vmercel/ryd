import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ExecutionPhase } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';

interface ExecutionStageProps {
  phase: ExecutionPhase;
  title: string;
  description?: string;
  results?: any[];
}

export const ExecutionStage: React.FC<ExecutionStageProps> = ({
  phase,
  title,
  description,
  results = [],
}) => {
  const [displayedResults, setDisplayedResults] = useState<any[]>([]);
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(-20);

  useEffect(() => {
    // Animate title entrance
    titleOpacity.value = withTiming(1, { duration: 500 });
    titleY.value = withSpring(0);

    // Stagger results appearance
    if (results.length > 0) {
      results.forEach((result, index) => {
        setTimeout(() => {
          setDisplayedResults((prev) => [...prev, result]);
        }, index * 200);
      });
    }
  }, [phase, results]);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const getPhaseIcon = () => {
    switch (phase) {
      case 'understand':
        return 'bulb-outline';
      case 'search':
        return 'search-outline';
      case 'compare':
        return 'analytics-outline';
      case 'hold':
        return 'time-outline';
      case 'book':
        return 'checkmark-circle-outline';
      case 'confirm':
        return 'checkmark-done-outline';
      default:
        return 'airplane-outline';
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'understand':
        return Colors.accent.blue;
      case 'search':
        return Colors.accent.purple;
      case 'compare':
        return Colors.accent.amber;
      case 'book':
        return Colors.accent.emerald;
      default:
        return Colors.primary.main;
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, titleStyle]}>
        <View style={[styles.iconContainer, { backgroundColor: getPhaseColor() }]}>
          <Ionicons name={getPhaseIcon()} size={32} color={Colors.text.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.phaseLabel}>{phase.toUpperCase()}</Text>
          <Text style={styles.title}>{title}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
      </Animated.View>

      <ScrollView
        style={styles.resultsContainer}
        contentContainerStyle={styles.resultsContent}
        showsVerticalScrollIndicator={false}
      >
        {displayedResults.map((result, index) => (
          <ResultCard key={index} result={result} index={index} />
        ))}
      </ScrollView>
    </View>
  );
};

interface ResultCardProps {
  result: any;
  index: number;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, index }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
    scale.value = withSpring(1);
    translateY.value = withSpring(0);
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.resultCard, cardStyle]}>
      <View style={styles.resultHeader}>
        <Text style={styles.resultTitle}>{result.title || 'Result'}</Text>
        {result.price ? (
          <Text style={styles.resultPrice}>${result.price}</Text>
        ) : null}
      </View>
      {result.subtitle ? (
        <Text style={styles.resultSubtitle}>{result.subtitle}</Text>
      ) : null}
      {result.details ? (
        <Text style={styles.resultDetails}>{result.details}</Text>
      ) : null}
    </Animated.View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacing['2xl'],
  },

  header: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },

  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.lg,
  },

  headerText: {
    gap: Spacing.xs,
  },

  phaseLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    color: Colors.text.tertiary,
    letterSpacing: 1.2,
  },

  title: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
  },

  description: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },

  resultsContainer: {
    flex: 1,
  },

  resultsContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },

  resultCard: {
    backgroundColor: Colors.surface.base,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },

  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },

  resultTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
  },

  resultPrice: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    color: Colors.accent.emerald,
  },

  resultSubtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },

  resultDetails: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.tertiary,
  },
});
