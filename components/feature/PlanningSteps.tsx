import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlanningStep } from '../../services/agentService';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

interface PlanningStepsProps {
  steps: PlanningStep[];
  currentStep: PlanningStep | null;
}

export const PlanningSteps: React.FC<PlanningStepsProps> = ({ steps, currentStep }) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for active step
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  useEffect(() => {
    // Auto-scroll to show active step
    if (currentStep) {
      const activeIndex = steps.findIndex(s => s.id === currentStep.id);
      if (activeIndex > 3) {
        scrollViewRef.current?.scrollTo({ y: (activeIndex - 2) * 60, animated: true });
      }
    }
  }, [currentStep, steps]);

  const getStepIcon = (step: PlanningStep) => {
    switch (step.status) {
      case 'completed':
        return <Ionicons name="checkmark-circle" size={24} color={Colors.accent.green} />;
      case 'active':
        return (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <View style={styles.activeIndicator}>
              <View style={styles.activeIndicatorInner} />
            </View>
          </Animated.View>
        );
      case 'error':
        return <Ionicons name="close-circle" size={24} color={Colors.accent.red} />;
      default:
        return <View style={styles.pendingIndicator} />;
    }
  };

  const getStepStyles = (step: PlanningStep) => {
    switch (step.status) {
      case 'active':
        return styles.stepActive;
      case 'completed':
        return styles.stepCompleted;
      case 'error':
        return styles.stepError;
      default:
        return styles.stepPending;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Planning Your Trip</Text>

      {currentStep && (
        <View style={styles.currentStepBanner}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Ionicons name="airplane" size={20} color={Colors.primary.main} />
          </Animated.View>
          <Text style={styles.currentStepText}>{currentStep.description}</Text>
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.stepsContainer}
        showsVerticalScrollIndicator={false}
      >
        {steps.map((step, index) => (
          <View key={step.id} style={styles.stepRow}>
            {/* Connector Line */}
            {index > 0 && (
              <View style={[
                styles.connector,
                steps[index - 1].status === 'completed' && styles.connectorCompleted,
              ]} />
            )}

            {/* Step Item */}
            <View style={[styles.step, getStepStyles(step)]}>
              <View style={styles.stepIconContainer}>
                {getStepIcon(step)}
              </View>
              <View style={styles.stepContent}>
                <Text style={[
                  styles.stepLabel,
                  step.status === 'active' && styles.stepLabelActive,
                  step.status === 'completed' && styles.stepLabelCompleted,
                  step.status === 'pending' && styles.stepLabelPending,
                ]}>
                  {step.label}
                </Text>
                {step.status === 'active' && (
                  <Text style={styles.stepDescription}>{step.description}</Text>
                )}
              </View>
              {step.status === 'active' && (
                <View style={styles.progressDots}>
                  <ProgressDots />
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const ProgressDots: React.FC = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.stagger(200, [
        Animated.sequence([
          Animated.timing(dot1, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot1, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(dot2, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot2, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(dot3, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot3, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      ]).start(() => animate());
    };
    animate();
  }, []);

  return (
    <View style={styles.dotsContainer}>
      <Animated.View style={[styles.dot, { opacity: dot1 }]} />
      <Animated.View style={[styles.dot, { opacity: dot2 }]} />
      <Animated.View style={[styles.dot, { opacity: dot3 }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },

  title: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },

  currentStepBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary.main + '20',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },

  currentStepText: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.primary.main,
  },

  stepsContainer: {
    flex: 1,
  },

  stepRow: {
    position: 'relative',
  },

  connector: {
    position: 'absolute',
    left: 20,
    top: -20,
    width: 2,
    height: 20,
    backgroundColor: Colors.border.light,
  },

  connectorCompleted: {
    backgroundColor: Colors.accent.green,
  },

  step: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },

  stepActive: {
    backgroundColor: Colors.primary.main + '15',
    borderWidth: 1,
    borderColor: Colors.primary.main + '40',
  },

  stepCompleted: {
    backgroundColor: Colors.accent.green + '10',
  },

  stepError: {
    backgroundColor: Colors.accent.red + '10',
  },

  stepPending: {
    backgroundColor: 'transparent',
    opacity: 0.5,
  },

  stepIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  activeIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary.main + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },

  activeIndicatorInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary.main,
  },

  pendingIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.border.light,
  },

  stepContent: {
    flex: 1,
    marginLeft: Spacing.sm,
  },

  stepLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
  },

  stepLabelActive: {
    color: Colors.primary.main,
  },

  stepLabelCompleted: {
    color: Colors.accent.green,
  },

  stepLabelPending: {
    color: Colors.text.tertiary,
  },

  stepDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },

  progressDots: {
    marginLeft: Spacing.sm,
  },

  dotsContainer: {
    flexDirection: 'row',
    gap: 4,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary.main,
  },
});
