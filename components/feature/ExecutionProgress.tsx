import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { TaskPlan, PhaseStep } from '../../types';

interface ExecutionProgressProps {
  taskPlan: TaskPlan;
  currentPhase?: string;
}

export const ExecutionProgress: React.FC<ExecutionProgressProps> = ({
  taskPlan,
  currentPhase,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Execution Plan</Text>
      <Text style={styles.subtitle}>{taskPlan.goal}</Text>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.phasesContainer}
        style={styles.phasesScroll}
      >
        {taskPlan.phases.map((phase, index) => (
          <PhaseCard
            key={phase.phase}
            phase={phase}
            isActive={phase.phase === currentPhase}
            index={index}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const PhaseCard: React.FC<{
  phase: PhaseStep;
  isActive: boolean;
  index: number;
}> = ({ phase, isActive, index }) => {
  const [pulseAnim] = useState(new Animated.Value(1));
  const [progressAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (isActive) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Progress animation
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false,
      }).start();
    }
  }, [isActive, pulseAnim, progressAnim]);

  const phaseColor = Colors.execution[phase.phase] || Colors.primary.main;
  const statusColor =
    phase.status === 'completed'
      ? Colors.success
      : phase.status === 'failed'
      ? Colors.error
      : phase.status === 'running'
      ? phaseColor
      : Colors.text.tertiary;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.phaseCard,
        isActive && styles.phaseCardActive,
        { transform: [{ scale: isActive ? pulseAnim : 1 }] },
      ]}
    >
      <View style={[styles.phaseHeader, { backgroundColor: phaseColor + '20' }]}>
        <View style={[styles.phaseIcon, { backgroundColor: statusColor }]}>
          <Text style={styles.phaseNumber}>{index + 1}</Text>
        </View>
        <Text style={styles.phaseName}>{phase.phase.toUpperCase()}</Text>
      </View>

      <View style={styles.phaseBody}>
        <Text style={styles.phaseDescription} numberOfLines={2}>
          {phase.description}
        </Text>

        <View style={styles.toolsContainer}>
          {phase.tools.slice(0, 2).map((tool, i) => (
            <View key={i} style={styles.toolBadge}>
              <Text style={styles.toolText}>{tool}</Text>
            </View>
          ))}
          {phase.tools.length > 2 ? (
            <Text style={styles.toolMore}>+{phase.tools.length - 2}</Text>
          ) : null}
        </View>

        {isActive ? (
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                { width: progressWidth, backgroundColor: phaseColor },
              ]}
            />
          </View>
        ) : null}

        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={styles.statusText}>{phase.status}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.lg,
  },
  
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  
  phasesScroll: {
    marginHorizontal: -Spacing.lg,
  },
  
  phasesContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  
  phaseCard: {
    width: 220,
    backgroundColor: Colors.surface.base,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.md,
  },
  
  phaseCardActive: {
    ...Shadows.xl,
    borderWidth: 1,
    borderColor: Colors.primary.main + '40',
  },
  
  phaseHeader: {
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  
  phaseIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  phaseNumber: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  
  phaseName: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  
  phaseBody: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  
  phaseDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    lineHeight: Typography.sizes.sm * 1.4,
  },
  
  toolsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  
  toolBadge: {
    backgroundColor: Colors.surface.overlay,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  
  toolText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.tertiary,
  },
  
  toolMore: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.tertiary,
    fontWeight: '600',
  },
  
  progressBar: {
    height: 3,
    backgroundColor: Colors.surface.overlay,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  
  statusText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.tertiary,
    textTransform: 'capitalize',
  },
});
