// Full-Screen Cinematic Granular Step Progress
// Each step takes over the entire screen with sophisticated animations

import React, { useEffect, useRef } from 'react';
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
import { Colors, Typography, Spacing } from '../../constants/theme';
import type { StepMetadata } from '../../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GranularStepProgressProps {
  steps: StepMetadata[];
  currentStep: StepMetadata | null;
  progress: number;
  bookingType: 'flight' | 'ride' | 'doctor';
  onStepComplete?: (step: StepMetadata) => void;
}

export const GranularStepProgress: React.FC<GranularStepProgressProps> = ({
  steps,
  currentStep,
  progress,
  bookingType,
  onStepComplete,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (currentStep) {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      slideAnim.setValue(50);

      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentStep?.id]);

  if (!currentStep) return null;

  return (
    <View style={styles.container}>
      {/* Background gradient based on booking type */}
      <LinearGradient
        colors={getGradientColors(bookingType)}
        style={styles.backgroundGradient}
      />

      {/* Animated step content */}
      <Animated.View
        style={[
          styles.stepContent,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim },
            ],
          },
        ]}
      >
        {/* Render step scene based on step type */}
        <StepScene step={currentStep} bookingType={bookingType} steps={steps} />
      </Animated.View>

      {/* Step title overlay at top */}
      <View style={styles.titleOverlay}>
        <Text style={styles.stepTitle}>{currentStep.label}</Text>
        {currentStep.description && (
          <Text style={styles.stepSubtitle}>{currentStep.description}</Text>
        )}
      </View>
    </View>
  );
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const getGradientColors = (bookingType: string): string[] => {
  switch (bookingType) {
    case 'flight':
      return ['#0A0E17', '#1E3A5F', '#0A0E17'];
    case 'ride':
      return ['#0A0E17', '#1A1A1A', '#0A0E17'];
    case 'doctor':
      return ['#0A0E17', '#2D1B1E', '#0A0E17'];
    default:
      return ['#0A0E17', '#141B2D', '#0A0E17'];
  }
};

const getAccentColor = (bookingType: string): string => {
  switch (bookingType) {
    case 'flight':
      return '#3B82F6';
    case 'ride':
      return '#FF00BF';
    case 'doctor':
      return '#EF4444';
    default:
      return '#8B5CF6';
  }
};

const generateMockFlights = () => [
  { id: '1', carrier: 'United Airlines', price: 450, duration: '11h 30m', stops: 0, rating: 4.5 },
  { id: '2', carrier: 'Air France', price: 520, duration: '10h 45m', stops: 0, rating: 4.7 },
  { id: '3', carrier: 'Delta', price: 480, duration: '12h 15m', stops: 1, rating: 4.3 },
  { id: '4', carrier: 'British Airways', price: 550, duration: '11h 00m', stops: 0, rating: 4.6 },
  { id: '5', carrier: 'Lufthansa', price: 495, duration: '11h 45m', stops: 1, rating: 4.4 },
];

// ============================================
// VISUAL COMPONENTS FOR EACH STEP TYPE
// ============================================

// Default step view with icon and details
const DefaultStepView: React.FC<{ step: StepMetadata; bookingType: string }> = ({ step, bookingType }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (step.status === 'active') {
      Animated.loop(
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
      ).start();
    }
  }, [step.status]);

  return (
    <View style={styles.defaultView}>
      <Animated.View
        style={[
          styles.iconCircle,
          {
            backgroundColor: step.color || getAccentColor(bookingType),
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <Ionicons name={step.icon as any} size={64} color="#FFFFFF" />
      </Animated.View>

      {step.details && (
        <View style={styles.detailsContainer}>
          {step.details.primary && (
            <Text style={styles.detailPrimary}>{step.details.primary}</Text>
          )}
          {step.details.secondary && (
            <Text style={styles.detailSecondary}>{step.details.secondary}</Text>
          )}
        </View>
      )}
    </View>
  );
};

// Route map visualization
const RouteMapView: React.FC<{ route: any; step: StepMetadata }> = ({ route, step }) => {
  return (
    <View style={styles.routeMapView}>
      {/* Simplified route visualization */}
      <View style={styles.routeContainer}>
        <View style={styles.cityPoint}>
          <Ionicons name="location" size={32} color="#3B82F6" />
          <Text style={styles.cityCode}>{route.origin || 'SFO'}</Text>
          <Text style={styles.cityLabel}>Origin</Text>
        </View>

        <View style={styles.routeLine}>
          <View style={styles.dashedLine} />
          <Ionicons name="airplane" size={24} color="#60A5FA" style={styles.planeIcon} />
        </View>

        <View style={styles.cityPoint}>
          <Ionicons name="location" size={32} color="#EF4444" />
          <Text style={styles.cityCode}>{route.destination || 'CDG'}</Text>
          <Text style={styles.cityLabel}>Destination</Text>
        </View>
      </View>

      {route.distance && (
        <Text style={styles.routeDistance}>{route.distance}</Text>
      )}
    </View>
  );
};

// Search results view
const SearchResultsView: React.FC<{ results: any[]; step: StepMetadata; bookingType: string }> = ({ results, step, bookingType }) => {
  return (
    <View style={styles.searchResultsView}>
      <Text style={styles.resultsHeader}>Found {results.length} Options</Text>

      {results.slice(0, 3).map((result, index) => (
        <View key={result.id} style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Ionicons
              name={bookingType === 'flight' ? 'airplane' : bookingType === 'ride' ? 'car' : 'medical'}
              size={24}
              color={getAccentColor(bookingType)}
            />
            <Text style={styles.resultTitle}>{result.carrier || result.name}</Text>
          </View>

          <View style={styles.resultDetails}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Price:</Text>
              <Text style={styles.resultValue}>${result.price}</Text>
            </View>
            {result.duration && (
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Duration:</Text>
                <Text style={styles.resultValue}>{result.duration}</Text>
              </View>
            )}
            {result.stops !== undefined && (
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Stops:</Text>
                <Text style={styles.resultValue}>{result.stops === 0 ? 'Nonstop' : `${result.stops} stop(s)`}</Text>
              </View>
            )}
          </View>

          {index === 0 && (
            <View style={styles.bestBadge}>
              <Ionicons name="trophy" size={16} color="#FCD34D" />
              <Text style={styles.bestText}>Best Value</Text>
            </View>
          )}
        </View>
      ))}

      {results.length > 3 && (
        <Text style={styles.moreResults}>+{results.length - 3} more options</Text>
      )}
    </View>
  );
};

// Comparison view
const ComparisonView: React.FC<{ options: any[]; step: StepMetadata; bookingType: string }> = ({ options, step, bookingType }) => {
  const topOptions = options.slice(0, 3);

  return (
    <View style={styles.comparisonView}>
      <Text style={styles.comparisonHeader}>Top 3 Options</Text>

      <View style={styles.comparisonTable}>
        {topOptions.map((option, index) => (
          <View key={option.id} style={[styles.comparisonRow, index === 0 && styles.topChoice]}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>#{index + 1}</Text>
            </View>

            <View style={styles.comparisonContent}>
              <Text style={styles.comparisonTitle}>{option.carrier || option.name}</Text>
              <View style={styles.comparisonStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Price</Text>
                  <Text style={styles.statValue}>${option.price}</Text>
                </View>
                {option.rating && (
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Rating</Text>
                    <Text style={styles.statValue}>⭐ {option.rating}</Text>
                  </View>
                )}
                {option.duration && (
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Time</Text>
                    <Text style={styles.statValue}>{option.duration}</Text>
                  </View>
                )}
              </View>
            </View>

            {index === 0 && (
              <Ionicons name="checkmark-circle" size={32} color="#10B981" />
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

// Selection view
const SelectionView: React.FC<{ selected: any; step: StepMetadata; bookingType: string }> = ({ selected, step, bookingType }) => {
  return (
    <View style={styles.selectionView}>
      <Ionicons name="checkmark-circle" size={80} color="#10B981" />
      <Text style={styles.selectionTitle}>Selected!</Text>

      <View style={styles.selectedCard}>
        <Text style={styles.selectedName}>{selected.carrier || selected.name}</Text>
        <Text style={styles.selectedPrice}>${selected.price}</Text>
        {selected.duration && (
          <Text style={styles.selectedDetail}>{selected.duration}</Text>
        )}
      </View>
    </View>
  );
};

// Seat selection view
const SeatSelectionView: React.FC<{ step: StepMetadata }> = ({ step }) => {
  const seats = ['12A', '12B', '12C', '13A', '13B', '13C'];
  const selectedSeats = ['12A', '12B'];

  return (
    <View style={styles.seatSelectionView}>
      <Text style={styles.seatHeader}>Select Your Seats</Text>

      <View style={styles.seatMap}>
        {seats.map((seat) => {
          const isSelected = selectedSeats.includes(seat);
          return (
            <View
              key={seat}
              style={[
                styles.seatBox,
                isSelected && styles.seatSelected,
              ]}
            >
              <Ionicons
                name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={isSelected ? '#10B981' : '#6B7280'}
              />
              <Text style={[styles.seatLabel, isSelected && styles.seatLabelSelected]}>
                {seat}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.seatLegend}>
        <View style={styles.legendItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.legendText}>Selected</Text>
        </View>
        <View style={styles.legendItem}>
          <Ionicons name="ellipse-outline" size={20} color="#6B7280" />
          <Text style={styles.legendText}>Available</Text>
        </View>
      </View>
    </View>
  );
};

// Payment view
const PaymentView: React.FC<{ step: StepMetadata; amount: number }> = ({ step, amount }) => {
  return (
    <View style={styles.paymentView}>
      <Ionicons name="card" size={80} color="#059669" />
      <Text style={styles.paymentTitle}>Processing Payment</Text>

      <View style={styles.paymentCard}>
        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>Amount:</Text>
          <Text style={styles.paymentAmount}>${amount}</Text>
        </View>

        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>Method:</Text>
          <View style={styles.paymentMethod}>
            <Ionicons name="card" size={20} color="#3B82F6" />
            <Text style={styles.paymentMethodText}>•••• 4242</Text>
          </View>
        </View>

        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>Status:</Text>
          <View style={styles.paymentStatus}>
            <View style={styles.loadingDot} />
            <Text style={styles.paymentStatusText}>Processing...</Text>
          </View>
        </View>
      </View>

      <View style={styles.secureNotice}>
        <Ionicons name="shield-checkmark" size={20} color="#10B981" />
        <Text style={styles.secureText}>Secure Payment</Text>
      </View>
    </View>
  );
};

// Baggage selection view
const BaggageSelectionView: React.FC<{ step: StepMetadata }> = ({ step }) => {
  const baggageOptions = [
    { type: 'Carry-on', count: 1, weight: '10 kg', included: true },
    { type: 'Checked', count: 2, weight: '23 kg each', price: 60 },
    { type: 'Extra', count: 0, weight: '23 kg', price: 100 },
  ];

  return (
    <View style={styles.baggageView}>
      <Ionicons name="briefcase" size={64} color="#F59E0B" />
      <Text style={styles.baggageTitle}>Baggage Selection</Text>

      {baggageOptions.map((option, index) => (
        <View key={index} style={[styles.baggageOption, option.count > 0 && styles.baggageSelected]}>
          <View style={styles.baggageHeader}>
            <Ionicons
              name={option.included || option.count > 0 ? "checkmark-circle" : "ellipse-outline"}
              size={24}
              color={option.included || option.count > 0 ? "#10B981" : "#6B7280"}
            />
            <Text style={styles.baggageType}>{option.type}</Text>
          </View>
          <View style={styles.baggageDetails}>
            <Text style={styles.baggageInfo}>{option.count} bag(s) × {option.weight}</Text>
            {option.included ? (
              <Text style={styles.baggageIncluded}>Included</Text>
            ) : option.count > 0 ? (
              <Text style={styles.baggagePrice}>${option.price}</Text>
            ) : (
              <Text style={styles.baggageAvailable}>Available</Text>
            )}
          </View>
        </View>
      ))}

      <View style={styles.baggageTotal}>
        <Text style={styles.baggageTotalLabel}>Baggage Total:</Text>
        <Text style={styles.baggageTotalAmount}>$60</Text>
      </View>
    </View>
  );
};

// Meal selection view
const MealSelectionView: React.FC<{ step: StepMetadata }> = ({ step }) => {
  const mealOptions = [
    { name: 'Vegetarian', icon: 'leaf', selected: true },
    { name: 'Gluten-Free', icon: 'nutrition', selected: false },
    { name: 'Kosher', icon: 'star', selected: false },
    { name: 'Vegan', icon: 'flower', selected: false },
  ];

  return (
    <View style={styles.mealView}>
      <Ionicons name="restaurant" size={64} color="#10B981" />
      <Text style={styles.mealTitle}>Meal Preferences</Text>

      <View style={styles.mealGrid}>
        {mealOptions.map((meal, index) => (
          <View key={index} style={[styles.mealOption, meal.selected && styles.mealSelected]}>
            <Ionicons
              name={meal.icon as any}
              size={32}
              color={meal.selected ? "#10B981" : "#6B7280"}
            />
            <Text style={[styles.mealName, meal.selected && styles.mealNameSelected]}>
              {meal.name}
            </Text>
            {meal.selected && (
              <View style={styles.mealCheckmark}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

// TSA PreCheck view
const TSACheckView: React.FC<{ step: StepMetadata }> = ({ step }) => {
  return (
    <View style={styles.tsaView}>
      <Ionicons name="shield-checkmark" size={80} color="#3B82F6" />
      <Text style={styles.tsaTitle}>TSA PreCheck Verified</Text>

      <View style={styles.tsaCard}>
        <View style={styles.tsaRow}>
          <Text style={styles.tsaLabel}>Known Traveler Number:</Text>
          <Text style={styles.tsaValue}>•••• 1234</Text>
        </View>
        <View style={styles.tsaRow}>
          <Text style={styles.tsaLabel}>Status:</Text>
          <View style={styles.tsaStatus}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.tsaStatusText}>Active</Text>
          </View>
        </View>
        <View style={styles.tsaRow}>
          <Text style={styles.tsaLabel}>Expires:</Text>
          <Text style={styles.tsaValue}>Dec 2028</Text>
        </View>
      </View>

      <View style={styles.tsaBenefit}>
        <Ionicons name="flash" size={20} color="#F59E0B" />
        <Text style={styles.tsaBenefitText}>Expedited security screening enabled</Text>
      </View>
    </View>
  );
};

// Travel insurance view
const InsuranceView: React.FC<{ step: StepMetadata }> = ({ step }) => {
  const insuranceOptions = [
    { name: 'Basic', coverage: '$50,000', price: 25, features: ['Trip cancellation', 'Medical emergency'] },
    { name: 'Premium', coverage: '$100,000', price: 45, features: ['All Basic +', 'Baggage loss', '24/7 support'], recommended: true },
    { name: 'Platinum', coverage: '$250,000', price: 75, features: ['All Premium +', 'Adventure sports', 'Rental car'] },
  ];

  return (
    <View style={styles.insuranceView}>
      <Ionicons name="shield" size={64} color="#8B5CF6" />
      <Text style={styles.insuranceTitle}>Travel Insurance</Text>

      {insuranceOptions.map((option, index) => (
        <View key={index} style={[styles.insuranceOption, option.recommended && styles.insuranceRecommended]}>
          {option.recommended && (
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedText}>Recommended</Text>
            </View>
          )}
          <View style={styles.insuranceHeader}>
            <Text style={styles.insuranceName}>{option.name}</Text>
            <Text style={styles.insurancePrice}>${option.price}</Text>
          </View>
          <Text style={styles.insuranceCoverage}>Coverage: {option.coverage}</Text>
          <View style={styles.insuranceFeatures}>
            {option.features.map((feature, idx) => (
              <View key={idx} style={styles.insuranceFeature}>
                <Ionicons name="checkmark" size={16} color="#10B981" />
                <Text style={styles.insuranceFeatureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
};

// ============================================
// STEP SCENE COMPONENT
// ============================================

interface StepSceneProps {
  step: StepMetadata;
  bookingType: string;
  steps: StepMetadata[];
}

const StepScene: React.FC<StepSceneProps> = ({ step, bookingType, steps }) => {
  // Render rich visual content based on step ID
  const renderStepContent = () => {
    // Get mock data from step details or generate
    const mockFlights = step.details?.flights || generateMockFlights();
    const mockRoute = step.details?.route || { origin: 'SFO', destination: 'CDG', distance: '5,600 mi' };

    switch (step.id) {
      // ============================================
      // ROUTE & MAP VISUALIZATION
      // ============================================
      case 'extract_origin':
      case 'extract_destination':
      case 'calculate_route':
        return <RouteMapView route={mockRoute} step={step} />;

      // ============================================
      // SEARCH RESULTS
      // ============================================
      case 'fetch_airline_data':
      case 'search_nearby_drivers':
      case 'search_providers':
        return <SearchResultsView results={mockFlights} step={step} bookingType={bookingType} />;

      // ============================================
      // COMPARISON & RANKING
      // ============================================
      case 'compare_prices':
      case 'rank_by_value':
      case 'compare_providers':
      case 'compare_doctors':
        return <ComparisonView options={mockFlights} step={step} bookingType={bookingType} />;

      // ============================================
      // SELECTION & CONFIRMATION
      // ============================================
      case 'select_best_option':
      case 'select_vehicle_type':
      case 'select_doctor':
        return <SelectionView selected={mockFlights[0]} step={step} bookingType={bookingType} />;

      // ============================================
      // SEAT SELECTION
      // ============================================
      case 'assign_seats':
        return <SeatSelectionView step={step} />;

      // ============================================
      // BAGGAGE SELECTION
      // ============================================
      case 'select_baggage':
        return <BaggageSelectionView step={step} />;

      // ============================================
      // MEAL PREFERENCES
      // ============================================
      case 'add_meal_preferences':
        return <MealSelectionView step={step} />;

      // ============================================
      // TSA PRECHECK
      // ============================================
      case 'check_tsa_precheck':
        return <TSACheckView step={step} />;

      // ============================================
      // TRAVEL INSURANCE
      // ============================================
      case 'offer_travel_insurance':
        return <InsuranceView step={step} />;

      // ============================================
      // PAYMENT
      // ============================================
      case 'process_payment':
        return <PaymentView step={step} amount={mockFlights[0]?.price || 450} />;

      // ============================================
      // DEFAULT: Icon + Details
      // ============================================
      default:
        return <DefaultStepView step={step} bookingType={bookingType} />;
    }
  };

  return (
    <View style={styles.sceneContainer}>
      {renderStepContent()}
    </View>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    overflow: 'hidden',
  },

  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  stepContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },

  sceneContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },

  iconContainer: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },

  rotatingRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    borderStyle: 'dashed',
  },

  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },

  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ skewX: '-20deg' }],
  },

  detailsContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },

  detailPrimary: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },

  detailSecondary: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },

  detailItems: {
    width: '100%',
    marginTop: Spacing.md,
  },

  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },

  detailItemLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.tertiary,
  },

  detailItemValue: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  stepProgressContainer: {
    width: '100%',
    maxWidth: 300,
    marginTop: Spacing.xl,
  },

  stepProgressBar: {
    height: 8,
    backgroundColor: Colors.border.light,
    borderRadius: 4,
    overflow: 'hidden',
  },

  stepProgressFill: {
    height: '100%',
    borderRadius: 4,
  },

  stepProgressText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },

  titleOverlay: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    padding: Spacing.lg,
    zIndex: 10,
  },

  stepTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },

  stepSubtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    textAlign: 'center',
  },

  // Default view styles
  defaultView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },

  // Route map styles
  routeMapView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },

  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 400,
  },

  cityPoint: {
    alignItems: 'center',
    gap: Spacing.xs,
  },

  cityCode: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
  },

  cityLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.tertiary,
  },

  routeLine: {
    flex: 1,
    height: 2,
    marginHorizontal: Spacing.md,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },

  dashedLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: Colors.border.secondary,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: Colors.border.secondary,
  },

  planeIcon: {
    backgroundColor: Colors.background.primary,
    padding: Spacing.xs,
  },

  routeDistance: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    marginTop: Spacing.lg,
  },

  // Search results styles
  searchResultsView: {
    flex: 1,
    padding: Spacing.xl,
    paddingTop: 120,
  },

  resultsHeader: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },

  resultCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },

  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },

  resultTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  resultDetails: {
    gap: Spacing.xs,
  },

  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  resultLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.tertiary,
  },

  resultValue: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  bestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: 'rgba(252, 211, 77, 0.1)',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },

  bestText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
    color: '#FCD34D',
  },

  moreResults: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },

  // Comparison view styles
  comparisonView: {
    flex: 1,
    padding: Spacing.xl,
    paddingTop: 120,
  },

  comparisonHeader: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },

  comparisonTable: {
    gap: Spacing.md,
  },

  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },

  topChoice: {
    borderColor: '#10B981',
    borderWidth: 2,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },

  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  rankText: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.primary,
  },

  comparisonContent: {
    flex: 1,
  },

  comparisonTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },

  comparisonStats: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },

  statItem: {
    gap: Spacing.xs,
  },

  statLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.tertiary,
  },

  statValue: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  // Selection view styles
  selectionView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.lg,
  },

  selectionTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '700',
    color: '#10B981',
  },

  selectedCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 2,
    borderColor: '#10B981',
    minWidth: 280,
  },

  selectedName: {
    fontSize: Typography.sizes.xl,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  selectedPrice: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: '700',
    color: '#10B981',
  },

  selectedDetail: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
  },

  // Seat selection styles
  seatSelectionView: {
    flex: 1,
    padding: Spacing.xl,
    paddingTop: 120,
    alignItems: 'center',
  },

  seatHeader: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.xl,
  },

  seatMap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'center',
    maxWidth: 400,
  },

  seatBox: {
    width: 100,
    height: 100,
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border.primary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
  },

  seatSelected: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },

  seatLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.secondary,
  },

  seatLabelSelected: {
    color: '#10B981',
  },

  seatLegend: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginTop: Spacing.xl,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },

  legendText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },

  // Payment view styles
  paymentView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.lg,
  },

  paymentTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
  },

  paymentCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: Spacing.xl,
    gap: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    minWidth: 320,
  },

  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  paymentLabel: {
    fontSize: Typography.sizes.base,
    color: Colors.text.tertiary,
  },

  paymentAmount: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '700',
    color: '#10B981',
  },

  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },

  paymentMethodText: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },

  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },

  paymentStatusText: {
    fontSize: Typography.sizes.base,
    color: '#3B82F6',
  },

  secureNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
  },

  secureText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: '#10B981',
  },

  // Baggage selection styles
  baggageView: {
    flex: 1,
    padding: Spacing.xl,
    paddingTop: 120,
    alignItems: 'center',
    gap: Spacing.lg,
  },

  baggageTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },

  baggageOption: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 320,
    borderWidth: 2,
    borderColor: 'transparent',
  },

  baggageSelected: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },

  baggageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },

  baggageType: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  baggageDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  baggageInfo: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },

  baggageIncluded: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: '#10B981',
  },

  baggagePrice: {
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    color: '#F59E0B',
  },

  baggageAvailable: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.tertiary,
  },

  baggageTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.medium,
    marginTop: Spacing.md,
  },

  baggageTotalLabel: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  baggageTotalAmount: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    color: '#F59E0B',
  },

  // Meal selection styles
  mealView: {
    flex: 1,
    padding: Spacing.xl,
    paddingTop: 120,
    alignItems: 'center',
    gap: Spacing.lg,
  },

  mealTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },

  mealGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'center',
  },

  mealOption: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: Spacing.lg,
    width: 140,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },

  mealSelected: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },

  mealName: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.text.secondary,
    textAlign: 'center',
  },

  mealNameSelected: {
    color: Colors.text.primary,
  },

  mealCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },

  // TSA PreCheck styles
  tsaView: {
    flex: 1,
    padding: Spacing.xl,
    paddingTop: 120,
    alignItems: 'center',
    gap: Spacing.lg,
  },

  tsaTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },

  tsaCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 320,
    gap: Spacing.md,
  },

  tsaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  tsaLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },

  tsaValue: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  tsaStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },

  tsaStatusText: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: '#10B981',
  },

  tsaBenefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: Spacing.md,
    borderRadius: 8,
  },

  tsaBenefitText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: '#F59E0B',
  },

  // Insurance styles
  insuranceView: {
    flex: 1,
    padding: Spacing.xl,
    paddingTop: 120,
    alignItems: 'center',
    gap: Spacing.md,
  },

  insuranceTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },

  insuranceOption: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 320,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },

  insuranceRecommended: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },

  recommendedBadge: {
    position: 'absolute',
    top: -10,
    right: 12,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },

  recommendedText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },

  insuranceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },

  insuranceName: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.primary,
  },

  insurancePrice: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    color: '#8B5CF6',
  },

  insuranceCoverage: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },

  insuranceFeatures: {
    gap: Spacing.xs,
  },

  insuranceFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },

  insuranceFeatureText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },
});

