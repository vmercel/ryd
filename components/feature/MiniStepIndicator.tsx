// Compact Mini Step Indicator
// Shows current step with elegant animations

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { StepMetadata } from '../../types';

interface MiniStepIndicatorProps {
  currentStep: StepMetadata | null;
  progress: number;
  totalSteps: number;
  completedSteps: number;
}

export const MiniStepIndicator: React.FC<MiniStepIndicatorProps> = ({
  currentStep,
  progress,
  totalSteps,
  completedSteps,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    // Rotation animation
    const rotate = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    rotate.start();

    return () => {
      pulse.stop();
      rotate.stop();
    };
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress / 100,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  if (!currentStep) return null;

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const iconName = (currentStep.icon || 'ellipse-outline') as keyof typeof Ionicons.glyphMap;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        {/* Animated Icon */}
        <View style={styles.iconContainer}>
          <Animated.View
            style={[
              styles.iconRing,
              {
                borderColor: currentStep.color,
                transform: [{ rotate: rotation }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.iconCircle,
              {
                backgroundColor: currentStep.color + '20',
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Ionicons name={iconName} size={24} color={currentStep.color} />
          </Animated.View>
        </View>

        {/* Step Info */}
        <View style={styles.info}>
          <Text style={styles.label} numberOfLines={1}>
            {currentStep.label}
          </Text>
          <Text style={styles.description} numberOfLines={1}>
            {currentStep.description}
          </Text>
          
          {/* Progress Bar */}
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressWidth,
                  backgroundColor: currentStep.color,
                },
              ]}
            />
          </View>
        </View>

        {/* Step Counter */}
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {completedSteps}/{totalSteps}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    ...Shadows.md,
  },
  iconContainer: {
    position: 'relative',
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconRing: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: Typography.sizes.md,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  description: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  progressBar: {
    height: 3,
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  counter: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.md,
  },
  counterText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    color: Colors.text.secondary,
  },
});
