import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface CinematicStep {
  id: string;
  phase: 'planning' | 'searching' | 'booking' | 'confirmation';
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  details?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
    highlight?: string;
    items?: Array<{ label: string; value: string; icon?: keyof typeof Ionicons.glyphMap }>;
  };
  color: string;
  accentColor: string;
}

export const CINEMATIC_PLANNING_STEPS: CinematicStep[] = [
  {
    id: 'connect',
    phase: 'planning',
    icon: 'radio-outline',
    label: 'Connecting',
    description: 'Establishing secure connection to Atlas AI...',
    status: 'pending',
    color: '#6366F1',
    accentColor: '#818CF8',
  },
  {
    id: 'authenticate',
    phase: 'planning',
    icon: 'shield-checkmark-outline',
    label: 'Authenticating',
    description: 'Verifying your identity...',
    status: 'pending',
    color: '#8B5CF6',
    accentColor: '#A78BFA',
  },
  {
    id: 'location',
    phase: 'planning',
    icon: 'location-outline',
    label: 'Locating',
    description: 'Detecting your current location...',
    status: 'pending',
    color: '#EC4899',
    accentColor: '#F472B6',
  },
  {
    id: 'understand',
    phase: 'planning',
    icon: 'bulb-outline',
    label: 'Understanding',
    description: 'Analyzing your travel request with AI...',
    status: 'pending',
    color: '#F59E0B',
    accentColor: '#FBBF24',
  },
  {
    id: 'dates',
    phase: 'planning',
    icon: 'calendar-outline',
    label: 'Processing Dates',
    description: 'Calculating optimal travel dates...',
    status: 'pending',
    color: '#10B981',
    accentColor: '#34D399',
  },
  {
    id: 'preferences',
    phase: 'planning',
    icon: 'options-outline',
    label: 'Preferences',
    description: 'Applying your travel preferences...',
    status: 'pending',
    color: '#06B6D4',
    accentColor: '#22D3EE',
  },
  {
    id: 'create_trip',
    phase: 'planning',
    icon: 'create-outline',
    label: 'Creating Trip',
    description: 'Saving trip to your account...',
    status: 'pending',
    color: '#6366F1',
    accentColor: '#818CF8',
  },
  {
    id: 'proposal',
    phase: 'planning',
    icon: 'document-text-outline',
    label: 'Proposal Ready',
    description: 'Your trip proposal is ready for review!',
    status: 'pending',
    color: '#10B981',
    accentColor: '#34D399',
  },
];

export const CINEMATIC_BOOKING_STEPS: CinematicStep[] = [
  {
    id: 'search_flights',
    phase: 'searching',
    icon: 'airplane-outline',
    label: 'Searching Flights',
    description: 'Querying 500+ airlines worldwide...',
    status: 'pending',
    color: '#3B82F6',
    accentColor: '#60A5FA',
  },
  {
    id: 'compare_prices',
    phase: 'searching',
    icon: 'stats-chart-outline',
    label: 'Comparing Prices',
    description: 'Analyzing fare classes and prices...',
    status: 'pending',
    color: '#8B5CF6',
    accentColor: '#A78BFA',
  },
  {
    id: 'rank_options',
    phase: 'searching',
    icon: 'trophy-outline',
    label: 'Ranking Options',
    description: 'Finding the best value flights...',
    status: 'pending',
    color: '#F59E0B',
    accentColor: '#FBBF24',
  },
  {
    id: 'select_flight',
    phase: 'booking',
    icon: 'checkmark-circle-outline',
    label: 'Selecting Flight',
    description: 'Reserving your preferred option...',
    status: 'pending',
    color: '#10B981',
    accentColor: '#34D399',
  },
  {
    id: 'seat_selection',
    phase: 'booking',
    icon: 'grid-outline',
    label: 'Seat Selection',
    description: 'Assigning your preferred seats...',
    status: 'pending',
    color: '#EC4899',
    accentColor: '#F472B6',
  },
  {
    id: 'passenger_info',
    phase: 'booking',
    icon: 'person-outline',
    label: 'Passenger Details',
    description: 'Verifying traveler information...',
    status: 'pending',
    color: '#6366F1',
    accentColor: '#818CF8',
  },
  {
    id: 'payment',
    phase: 'booking',
    icon: 'card-outline',
    label: 'Processing Payment',
    description: 'Securing your booking...',
    status: 'pending',
    color: '#059669',
    accentColor: '#10B981',
  },
  {
    id: 'confirmation',
    phase: 'confirmation',
    icon: 'checkmark-done-outline',
    label: 'Booking Confirmed',
    description: 'Your trip is booked!',
    status: 'pending',
    color: '#10B981',
    accentColor: '#34D399',
  },
  {
    id: 'calendar_sync',
    phase: 'confirmation',
    icon: 'calendar-number-outline',
    label: 'Calendar Sync',
    description: 'Adding events to your calendar...',
    status: 'pending',
    color: '#3B82F6',
    accentColor: '#60A5FA',
  },
  {
    id: 'itinerary',
    phase: 'confirmation',
    icon: 'document-attach-outline',
    label: 'Itinerary Ready',
    description: 'Your complete itinerary is ready!',
    status: 'pending',
    color: '#8B5CF6',
    accentColor: '#A78BFA',
  },
];

// Ride booking steps
export const CINEMATIC_RIDE_STEPS: CinematicStep[] = [
  {
    id: 'detect_location',
    phase: 'planning',
    icon: 'location-outline',
    label: 'Detecting Location',
    description: 'Pinpointing your exact position...',
    status: 'pending',
    color: '#3B82F6',
    accentColor: '#60A5FA',
  },
  {
    id: 'connect_uber',
    phase: 'planning',
    icon: 'car-sport-outline',
    label: 'Connecting to Uber',
    description: 'Establishing secure connection...',
    status: 'pending',
    color: '#000000',
    accentColor: '#333333',
  },
  {
    id: 'search_drivers',
    phase: 'searching',
    icon: 'search-outline',
    label: 'Searching Drivers',
    description: 'Finding available drivers nearby...',
    status: 'pending',
    color: '#8B5CF6',
    accentColor: '#A78BFA',
  },
  {
    id: 'calculate_route',
    phase: 'searching',
    icon: 'git-branch-outline',
    label: 'Calculating Route',
    description: 'Optimizing your journey...',
    status: 'pending',
    color: '#10B981',
    accentColor: '#34D399',
  },
  {
    id: 'get_estimates',
    phase: 'searching',
    icon: 'pricetag-outline',
    label: 'Getting Estimates',
    description: 'Comparing ride options and prices...',
    status: 'pending',
    color: '#F59E0B',
    accentColor: '#FBBF24',
  },
  {
    id: 'select_ride',
    phase: 'booking',
    icon: 'checkmark-circle-outline',
    label: 'Selecting Ride',
    description: 'Choosing the best option for you...',
    status: 'pending',
    color: '#06B6D4',
    accentColor: '#22D3EE',
  },
  {
    id: 'request_ride',
    phase: 'booking',
    icon: 'send-outline',
    label: 'Requesting Ride',
    description: 'Sending request to driver...',
    status: 'pending',
    color: '#EC4899',
    accentColor: '#F472B6',
  },
  {
    id: 'driver_matched',
    phase: 'confirmation',
    icon: 'person-outline',
    label: 'Driver Matched',
    description: 'Your driver is on the way!',
    status: 'pending',
    color: '#22C55E',
    accentColor: '#4ADE80',
  },
];

// Doctor appointment steps
export const CINEMATIC_DOCTOR_STEPS: CinematicStep[] = [
  {
    id: 'understand_symptoms',
    phase: 'planning',
    icon: 'medkit-outline',
    label: 'Understanding Symptoms',
    description: 'Analyzing your health concerns...',
    status: 'pending',
    color: '#EF4444',
    accentColor: '#F87171',
  },
  {
    id: 'find_specialists',
    phase: 'searching',
    icon: 'search-outline',
    label: 'Finding Specialists',
    description: 'Searching for qualified doctors...',
    status: 'pending',
    color: '#3B82F6',
    accentColor: '#60A5FA',
  },
  {
    id: 'check_availability',
    phase: 'searching',
    icon: 'calendar-outline',
    label: 'Checking Availability',
    description: 'Finding open appointment slots...',
    status: 'pending',
    color: '#8B5CF6',
    accentColor: '#A78BFA',
  },
  {
    id: 'verify_insurance',
    phase: 'searching',
    icon: 'shield-checkmark-outline',
    label: 'Verifying Insurance',
    description: 'Confirming coverage details...',
    status: 'pending',
    color: '#10B981',
    accentColor: '#34D399',
  },
  {
    id: 'compare_options',
    phase: 'searching',
    icon: 'git-compare-outline',
    label: 'Comparing Options',
    description: 'Ranking doctors by fit...',
    status: 'pending',
    color: '#F59E0B',
    accentColor: '#FBBF24',
  },
  {
    id: 'select_doctor',
    phase: 'booking',
    icon: 'person-outline',
    label: 'Selecting Doctor',
    description: 'Choosing the best match...',
    status: 'pending',
    color: '#06B6D4',
    accentColor: '#22D3EE',
  },
  {
    id: 'book_appointment',
    phase: 'booking',
    icon: 'checkmark-done-outline',
    label: 'Booking Appointment',
    description: 'Reserving your time slot...',
    status: 'pending',
    color: '#EC4899',
    accentColor: '#F472B6',
  },
  {
    id: 'send_confirmation',
    phase: 'confirmation',
    icon: 'mail-outline',
    label: 'Sending Confirmation',
    description: 'Preparing your appointment details...',
    status: 'pending',
    color: '#22C55E',
    accentColor: '#4ADE80',
  },
];

interface CinematicStepsProps {
  steps: CinematicStep[];
  currentStep: CinematicStep | null;
  phase: 'planning' | 'booking';
  type?: 'flight' | 'ride' | 'doctor';
}

export const CinematicSteps: React.FC<CinematicStepsProps> = ({
  steps,
  currentStep,
  phase,
  type = 'flight',
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const particleAnims = useRef(
    Array(12).fill(0).map(() => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;

  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous pulse for active step
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
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

    // Glow animation
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    glow.start();

    return () => {
      pulse.stop();
      glow.stop();
    };
  }, []);

  useEffect(() => {
    const completed = steps.filter(s => s.status === 'completed').length;
    setCompletedCount(completed);

    Animated.timing(progressAnim, {
      toValue: completed / steps.length,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();

    // Trigger particle explosion on step completion
    if (completed > completedCount) {
      triggerParticles();
    }
  }, [steps]);

  const triggerParticles = () => {
    particleAnims.forEach((anim, index) => {
      const angle = (index / 12) * Math.PI * 2;
      const distance = 80 + Math.random() * 40;

      anim.x.setValue(0);
      anim.y.setValue(0);
      anim.opacity.setValue(1);
      anim.scale.setValue(1);

      Animated.parallel([
        Animated.timing(anim.x, {
          toValue: Math.cos(angle) * distance,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim.y, {
          toValue: Math.sin(angle) * distance,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim.opacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(anim.scale, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const getStepIcon = (step: CinematicStep) => {
    if (step.status === 'completed') {
      return (
        <View style={[styles.stepIconComplete, { backgroundColor: step.color }]}>
          <Ionicons name="checkmark" size={24} color="#FFFFFF" />
        </View>
      );
    }
    if (step.status === 'active') {
      return (
        <Animated.View
          style={[
            styles.stepIconActive,
            {
              backgroundColor: step.color + '20',
              borderColor: step.color,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Ionicons name={step.icon} size={28} color={step.color} />
        </Animated.View>
      );
    }
    return (
      <View style={styles.stepIconPending}>
        <Ionicons name={step.icon} size={24} color={Colors.text.tertiary} />
      </View>
    );
  };

  const renderActiveStepDetails = () => {
    if (!currentStep || currentStep.status !== 'active') return null;

    const glowOpacity = glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    });

    return (
      <Animated.View
        style={[
          styles.activeStepContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Glow effect */}
        <Animated.View
          style={[
            styles.glowEffect,
            {
              backgroundColor: currentStep.color,
              opacity: glowOpacity,
            },
          ]}
        />

        {/* Main card */}
        <LinearGradient
          colors={[currentStep.color + '30', currentStep.color + '10', 'transparent']}
          style={styles.activeStepGradient}
        >
          <View style={styles.activeStepHeader}>
            <Animated.View
              style={[
                styles.activeIconContainer,
                {
                  backgroundColor: currentStep.color,
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Ionicons name={currentStep.icon} size={40} color="#FFFFFF" />
            </Animated.View>

            {/* Particles */}
            <View style={styles.particlesContainer}>
              {particleAnims.map((anim, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.particle,
                    {
                      backgroundColor: currentStep.accentColor,
                      opacity: anim.opacity,
                      transform: [
                        { translateX: anim.x },
                        { translateY: anim.y },
                        { scale: anim.scale },
                      ],
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          <Text style={[styles.activeStepLabel, { color: currentStep.color }]}>
            {currentStep.label}
          </Text>
          <Text style={styles.activeStepDescription}>
            {currentStep.description}
          </Text>

          {/* Animated dots */}
          <View style={styles.dotsContainer}>
            <AnimatedDots color={currentStep.color} />
          </View>

          {/* Details section */}
          {currentStep.details && (
            <View style={styles.detailsContainer}>
              {currentStep.details.primary && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Detected:</Text>
                  <Text style={[styles.detailValue, { color: currentStep.color }]}>
                    {currentStep.details.primary}
                  </Text>
                </View>
              )}
              {currentStep.details.items?.map((item, index) => (
                <View key={index} style={styles.detailRow}>
                  {item.icon && (
                    <Ionicons name={item.icon} size={16} color={currentStep.color} />
                  )}
                  <Text style={styles.detailLabel}>{item.label}:</Text>
                  <Text style={styles.detailValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.phaseLabel}>
          {phase === 'planning'
            ? type === 'ride'
              ? '🚗 Finding Your Ride'
              : type === 'doctor'
              ? '🏥 Finding Your Doctor'
              : '✨ Planning Your Trip'
            : type === 'ride'
            ? '🚗 Booking Ride'
            : type === 'doctor'
            ? '🏥 Booking Appointment'
            : '🚀 Booking In Progress'}
        </Text>
        <Text style={styles.progressText}>
          {completedCount} of {steps.length} steps
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBg}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressWidth,
                backgroundColor: currentStep?.color || Colors.primary.main,
              },
            ]}
          />
        </View>
      </View>

      {/* Active step display */}
      {renderActiveStepDetails()}

      {/* Steps timeline */}
      <View style={styles.timelineContainer}>
        {steps.map((step, index) => (
          <View key={step.id} style={styles.timelineStep}>
            {/* Connector */}
            {index > 0 && (
              <View
                style={[
                  styles.connector,
                  step.status === 'completed' || step.status === 'active'
                    ? { backgroundColor: steps[index - 1].color }
                    : { backgroundColor: Colors.border.light },
                ]}
              />
            )}

            {/* Step indicator */}
            <View style={styles.stepIndicator}>
              {getStepIcon(step)}
              <View style={styles.stepTextContainer}>
                <Text
                  style={[
                    styles.stepLabel,
                    step.status === 'active' && { color: step.color, fontWeight: '700' },
                    step.status === 'completed' && { color: step.color },
                    step.status === 'pending' && { color: Colors.text.tertiary },
                  ]}
                  numberOfLines={1}
                >
                  {step.label}
                </Text>
                {step.status === 'active' && (
                  <Text style={styles.stepMiniDesc} numberOfLines={1}>
                    {step.description}
                  </Text>
                )}
              </View>
            </View>
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

const AnimatedDots: React.FC<{ color: string }> = ({ color }) => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.stagger(200, [
          Animated.sequence([
            Animated.timing(dot1, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(dot1, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(dot2, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(dot2, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(dot3, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(dot3, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          ]),
        ])
      ).start();
    };
    animate();
  }, []);

  return (
    <View style={styles.animatedDotsRow}>
      <Animated.View style={[styles.animatedDot, { backgroundColor: color, opacity: dot1 }]} />
      <Animated.View style={[styles.animatedDot, { backgroundColor: color, opacity: dot2 }]} />
      <Animated.View style={[styles.animatedDot, { backgroundColor: color, opacity: dot3 }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  phaseLabel: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    color: Colors.text.primary,
  },

  progressText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: '500',
  },

  progressBarContainer: {
    marginBottom: Spacing.xl,
  },

  progressBarBg: {
    height: 6,
    backgroundColor: Colors.surface.elevated,
    borderRadius: 3,
    overflow: 'hidden',
  },

  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  activeStepContainer: {
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.surface.base,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },

  glowEffect: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    height: 150,
    borderRadius: 100,
    transform: [{ scaleX: 2 }],
  },

  activeStepGradient: {
    padding: Spacing.xl,
    alignItems: 'center',
  },

  activeStepHeader: {
    position: 'relative',
    marginBottom: Spacing.lg,
  },

  activeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },

  particlesContainer: {
    position: 'absolute',
    top: 40,
    left: 40,
    width: 0,
    height: 0,
  },

  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  activeStepLabel: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '800',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },

  activeStepDescription: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },

  dotsContainer: {
    marginBottom: Spacing.lg,
  },

  animatedDotsRow: {
    flexDirection: 'row',
    gap: 8,
  },

  animatedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  detailsContainer: {
    width: '100%',
    backgroundColor: Colors.surface.elevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  detailLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },

  detailValue: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.primary,
    fontWeight: '600',
  },

  timelineContainer: {
    flex: 1,
  },

  timelineStep: {
    position: 'relative',
    marginBottom: Spacing.sm,
  },

  connector: {
    position: 'absolute',
    left: 20,
    top: -8,
    width: 2,
    height: 8,
  },

  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },

  stepIconComplete: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  stepIconActive: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },

  stepIconPending: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },

  stepTextContainer: {
    flex: 1,
  },

  stepLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: '500',
  },

  stepMiniDesc: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
});
