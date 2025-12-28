import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Modal, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/template';
import { AgentDisk, AgentState } from '../../components/feature/AgentDisk';
import { ProposalCard } from '../../components/feature/ProposalCard';
import { CinematicScenes, CinematicScene, SceneType } from '../../components/feature/CinematicScenes';
import { ImmersiveCinematicScenes, ImmersiveSceneType, ImmersiveSceneData } from '../../components/feature/ImmersiveCinematicScenes';
import { SceneTiming } from '../../utils/cinematicAnimations';
import { MiniStepIndicator } from '../../components/feature/MiniStepIndicator';
import { GranularStepModal } from '../../components/feature/GranularStepModal';
import { useLocation } from '../../hooks/useLocation';
import { useCalendar } from '../../hooks/useCalendar';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useGranularSteps } from '../../hooks/useGranularSteps';
import { planBooking, executeBooking, BookingPlanResponse } from '../../services/agentService';
import {
  checkCalendarConflicts,
  getScheduleBriefing,
  detectBriefingRequest,
  ScheduleBriefing,
} from '../../services/calendarAwareService';
import { planGranularBooking, continueGranularBooking } from '../../services/granularAgentService';
import { ProfileCompletionModal, ProfileData } from '../../components/feature/ProfileCompletionModal';
import { checkProfileCompleteness, updateProfileData } from '../../services/profileService';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { CommonStyles } from '../../constants/styles';

type AppState = 'idle' | 'listening' | 'planning' | 'proposing' | 'booking' | 'complete';
type InputMode = 'voice' | 'text';

// Scene sequences for different phases
const PLANNING_SCENES: Omit<CinematicScene, 'data'>[] = [
  { id: 'connect', type: 'connecting', title: 'Connecting to Atlas AI', subtitle: 'Establishing secure connection...' },
  { id: 'locate', type: 'locating', title: 'Detecting Your Location', subtitle: 'Finding the nearest airport...' },
  { id: 'parse', type: 'parsing_intent', title: 'Understanding Your Request', subtitle: 'Processing natural language...' },
  { id: 'route', type: 'map_route', title: 'Plotting Your Journey', subtitle: 'Calculating optimal routes...' },
];

const BOOKING_SCENES: Omit<CinematicScene, 'data'>[] = [
  { id: 'search', type: 'searching_flights', title: 'Searching Flights', subtitle: 'Querying 500+ airlines worldwide...' },
  { id: 'compare', type: 'comparing_prices', title: 'Comparing Options', subtitle: 'Analyzing fares and schedules...' },
  { id: 'select', type: 'selecting_option', title: 'Securing Your Selection', subtitle: 'Reserving your preferred option...' },
  { id: 'payment', type: 'processing_payment', title: 'Processing Payment', subtitle: 'Securing your booking...' },
  { id: 'confirm', type: 'confirmation', title: 'Booking Complete!', subtitle: 'Your trip is confirmed!' },
];

const RIDE_SCENES: Omit<CinematicScene, 'data'>[] = [
  { id: 'search_drivers', type: 'searching_drivers', title: 'Finding Drivers', subtitle: 'Searching for available drivers nearby...' },
  { id: 'driver_arriving', type: 'driver_arriving', title: 'Driver On The Way', subtitle: 'Your driver is coming to pick you up...' },
];

const DOCTOR_SCENES: Omit<CinematicScene, 'data'>[] = [
  { id: 'find_doctors', type: 'finding_doctors', title: 'Finding Specialists', subtitle: 'Searching for qualified doctors...' },
  { id: 'availability', type: 'checking_availability', title: 'Checking Availability', subtitle: 'Finding open appointment slots...' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { location, loading: locationLoading } = useLocation();
  const { getAvailableDates } = useCalendar();
  const { isRecording, transcript, startRecording, stopRecording } = useVoiceInput();
  const { stepState, initializeForBookingType, handleStepChange, reset: resetSteps, complete: completeSteps } = useGranularSteps();

  const [appState, setAppState] = useState<AppState>('idle');
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [proposal, setProposal] = useState<any>(null);
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);
  const [planResponse, setPlanResponse] = useState<BookingPlanResponse | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>('voice');
  const [textInput, setTextInput] = useState('');
  const [bookingType, setBookingType] = useState<'flight' | 'ride' | 'doctor'>('flight');

  // Cinematic scene state
  const [currentScene, setCurrentScene] = useState<CinematicScene | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<any>(null);
  const [sceneReadyResolver, setSceneReadyResolver] = useState<(() => void) | null>(null);

  // Granular step modal state
  const [showStepModal, setShowStepModal] = useState(false);
  const [useGranularFlow, setUseGranularFlow] = useState(false); // Disabled - using immersive cinematic instead
  const [useImmersiveAnimations, setUseImmersiveAnimations] = useState(true); // Use new immersive animations

  // Immersive scene state
  const [immersiveScene, setImmersiveScene] = useState<{ type: ImmersiveSceneType; data?: ImmersiveSceneData } | null>(null);

  // Profile completion modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileMissingFields, setProfileMissingFields] = useState<any>({});
  const [pendingUserInput, setPendingUserInput] = useState<string>('');

  // Briefing state
  const [briefingData, setBriefingData] = useState<ScheduleBriefing | null>(null);
  const [showBriefing, setShowBriefing] = useState(false);

  // Calendar adjustment explanation
  const [calendarAdjustment, setCalendarAdjustment] = useState<string | null>(null);

  useEffect(() => {
    // Sync agent visual state with app state
    if (appState === 'idle') setAgentState('idle');
    else if (appState === 'listening') setAgentState('listening');
    else if (appState === 'planning') setAgentState('thinking');
    else if (appState === 'booking') setAgentState('thinking');
    else if (appState === 'complete') setAgentState('success');
  }, [appState]);

  useEffect(() => {
    if (transcript && appState === 'listening') {
      handleUserInput(transcript);
    }
  }, [transcript]);

  const handleDiskTap = async () => {
    if (appState === 'idle') {
      if (inputMode === 'voice') {
        setAppState('listening');
        await startRecording();
      }
    } else if (appState === 'listening') {
      setAppState('idle');
      await stopRecording();
    }
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      handleUserInput(textInput);
      setTextInput('');
    }
  };

  const toggleInputMode = () => {
    if (appState === 'listening') {
      stopRecording();
      setAppState('idle');
    }
    setInputMode(inputMode === 'voice' ? 'text' : 'voice');
  };

  // Handle schedule briefing requests
  const handleBriefingRequest = async (period: 'day' | 'week' | 'month' | 'year') => {
    if (!user) return;

    setAppState('planning');
    setAgentState('thinking');

    try {
      const briefing = await getScheduleBriefing(user.id, period);
      setBriefingData(briefing);
      setShowBriefing(true);
      setAgentState('success');
    } catch (error) {
      console.error('Briefing error:', error);
      setAgentState('error');
    } finally {
      setAppState('idle');
    }
  };

  // Dismiss briefing
  const dismissBriefing = () => {
    setShowBriefing(false);
    setBriefingData(null);
  };

  // Callback when CinematicScenes signals a scene has met its minimum display time
  const handleSceneReady = useCallback((sceneId: string, sceneType: SceneType) => {
    if (sceneReadyResolver) {
      sceneReadyResolver();
      setSceneReadyResolver(null);
    }
  }, [sceneReadyResolver]);

  // Wait for the current scene to complete its minimum display time
  const waitForSceneReady = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      setSceneReadyResolver(() => resolve);
    });
  }, []);

  // Display a scene and wait for it to complete (using callback from CinematicScenes)
  const showSceneAndWait = useCallback(async (sceneConfig: CinematicScene) => {
    setCurrentScene(sceneConfig);
    await waitForSceneReady();
  }, [waitForSceneReady]);

  // Play a sequence of cinematic scenes (legacy helper - kept for compatibility)
  const playSceneSequence = async (
    scenes: Omit<CinematicScene, 'data'>[],
    sceneData: CinematicScene['data'],
    sceneDuration: number = 2500
  ) => {
    for (const scene of scenes) {
      setCurrentScene({ ...scene, data: sceneData });
      await delay(sceneDuration);
    }
  };

  const handleUserInput = async (input: string) => {
    // First, check if this is a schedule briefing request
    const briefingCheck = detectBriefingRequest(input);
    if (briefingCheck.isBriefing && briefingCheck.period && user) {
      await handleBriefingRequest(briefingCheck.period);
      return;
    }

    // Detect booking type from input with comprehensive keyword matching
    const lowerInput = input.toLowerCase();
    let detectedBookingType: 'flight' | 'ride' | 'doctor' = 'flight';

    // Ride keywords - comprehensive list
    const rideKeywords = [
      'ride', 'uber', 'lyft', 'taxi', 'cab', 'car', 'pickup', 'pick up', 'pick me up',
      'drop off', 'drop me off', 'drive me', 'take me to', 'transportation',
      'driver', 'carpool', 'shuttle', 'get a car', 'book a car', 'need a ride',
      'airport pickup', 'airport drop', 'going to the airport',
    ];

    // Doctor/medical keywords - comprehensive list
    const doctorKeywords = [
      'doctor', 'appointment', 'medical', 'checkup', 'check up', 'check-up',
      'physician', 'specialist', 'clinic', 'hospital', 'health', 'sick',
      'dermatologist', 'cardiologist', 'dentist', 'therapy', 'therapist',
      'psychiatrist', 'psychologist', 'pediatrician', 'surgeon', 'nurse',
      'telehealth', 'telemedicine', 'consultation', 'diagnosis', 'symptoms',
      'prescription', 'refill', 'vaccination', 'vaccine', 'physical', 'annual',
    ];

    // Check for ride keywords
    if (rideKeywords.some(keyword => lowerInput.includes(keyword))) {
      detectedBookingType = 'ride';
    }
    // Check for doctor keywords
    else if (doctorKeywords.some(keyword => lowerInput.includes(keyword))) {
      detectedBookingType = 'doctor';
    }
    // Default to flight for travel-related queries
    // Flight keywords (implicit - if not ride or doctor, assume flight for travel)

    console.log('Detected booking type:', detectedBookingType, 'from input:', input);
    setBookingType(detectedBookingType);

    // Check profile completeness before proceeding
    if (!user) {
      console.error('No user found');
      return;
    }

    // TEMPORARY: Skip profile check for testing
    // TODO: Re-enable profile check after testing
    const SKIP_PROFILE_CHECK = true;

    if (!SKIP_PROFILE_CHECK) {
      const profileCheck = await checkProfileCompleteness(user.id, detectedBookingType);
      if (!profileCheck.isComplete) {
        console.log('Profile incomplete, showing completion modal', profileCheck.missingFields);
        setProfileMissingFields(profileCheck.missingFields);
        setPendingUserInput(input); // Store input to retry after profile completion
        setShowProfileModal(true);
        return;
      }
    }

    console.log('Profile check passed (or skipped), proceeding with booking');

    setAppState('planning');

    // Use immersive cinematic animations
    if (useImmersiveAnimations) {
      // Build scene data from location
      const sceneData: ImmersiveSceneData = {
        origin: {
          city: location?.city || 'Current Location',
          code: location?.nearestAirport || 'LOC',
        },
        destination: {
          city: 'Destination',
          code: 'DEST',
        },
      };

      // Show world map zoom scene
      setImmersiveScene({ type: 'world_map_zoom', data: sceneData });
      await delay(4000);

      // Show searching scene based on booking type
      if (detectedBookingType === 'ride') {
        setImmersiveScene({ type: 'ride_radar', data: sceneData });
      } else if (detectedBookingType === 'doctor') {
        setImmersiveScene({ type: 'doctor_pulse', data: sceneData });
      } else {
        setImmersiveScene({ type: 'searching_globe', data: sceneData });
      }

      // Call the actual API while showing animation
      const response = await planBooking({
        userMessage: input,
        currentLocation: location || undefined,
        onStepChange: () => {},
      });

      if (response.error) {
        setAgentState('error');
        setImmersiveScene(null);
        await delay(2000);
        resetToIdle();
        return;
      }

      // Update scene data with response
      const updatedSceneData: ImmersiveSceneData = {
        origin: {
          city: location?.city || response.intent?.origin || 'Origin',
          code: location?.nearestAirport || 'LOC',
        },
        destination: {
          city: response.intent?.destination || 'Destination',
          code: response.intent?.destination?.substring(0, 3).toUpperCase() || 'DEST',
        },
        carrier: response.flights?.[0]?.carrier || response.rides?.[0]?.name || response.doctors?.[0]?.name,
        price: response.flights?.[0]?.price || response.rides?.[0]?.price || 0,
        flightNumber: response.flights?.[0]?.flightNumber,
        duration: response.flights?.[0]?.details || response.rides?.[0]?.duration,
      };

      // Show route trace
      await delay(2000);
      setImmersiveScene({ type: 'route_trace', data: updatedSceneData });
      await delay(4000);

      // Show price comparison
      setImmersiveScene({ type: 'price_cascade', data: updatedSceneData });
      await delay(4000);

      // Show selection
      setImmersiveScene({ type: 'selection_spotlight', data: updatedSceneData });
      await delay(3000);

      // Clear immersive scene and show proposal
      setImmersiveScene(null);

      // Set plan response and proposal
      setPlanResponse(response);
      setCurrentBookingId(response.bookingId);

      const bookingTypeLabel = detectedBookingType === 'ride' ? 'Ride' : detectedBookingType === 'doctor' ? 'Appointment' : 'Flight';
      const builtProposal = {
        title: response.proposal?.title || `${bookingTypeLabel} Options`,
        details: {
          origin: response.intent?.origin ||
                  response.intent?.pickupLocation?.address ||
                  location?.city ||
                  'Current Location',
          destination: response.intent?.destination ||
                       response.intent?.dropoffLocation?.address ||
                       'Destination',
          dates: response.intent?.scheduledTime ||
                 response.intent?.departDate ||
                 response.intent?.preferredDate ||
                 'Flexible dates',
          budget: response.intent?.budget ? `$${response.intent.budget}` : undefined,
          travelers: response.intent?.travelers || 1,
        },
      };
      setProposal(builtProposal);

      if (response.flights?.[0]) {
        setSelectedFlight(response.flights[0]);
      } else if (response.rides?.[0]) {
        setSelectedFlight(response.rides[0]);
      }

      setAppState('proposing');
      setAgentState('success');
      return;
    }

    // Use granular flow if enabled
    if (useGranularFlow) {
      // Initialize granular steps
      initializeForBookingType(detectedBookingType);
      setShowStepModal(true);

      // Call granular booking service
      const response = await planGranularBooking({
        userMessage: input,
        bookingType: detectedBookingType,
        currentLocation: location || undefined,
        onStepChange: handleStepChange,
      });

      if (response.error) {
        setAgentState('error');
        setShowStepModal(false);
        await delay(2000);
        resetToIdle();
        return;
      }

      // Complete steps
      completeSteps();

      // Check for calendar conflicts and auto-adjust times
      let calendarExplanation: string | null = null;
      if (response.intent) {
        const requestedTime = response.intent.scheduledTime
          ? new Date(response.intent.scheduledTime)
          : response.intent.departDate
          ? new Date(response.intent.departDate)
          : response.intent.preferredDate
          ? new Date(response.intent.preferredDate)
          : new Date();

        const conflictResult = await checkCalendarConflicts(
          user.id,
          detectedBookingType,
          requestedTime,
          response.intent
        );

        if (conflictResult.hasConflict && conflictResult.explanation) {
          calendarExplanation = conflictResult.explanation;
          setCalendarAdjustment(conflictResult.explanation);

          // Update the intent with adjusted time if provided
          if (conflictResult.adjustedTime) {
            if (detectedBookingType === 'ride') {
              response.intent.scheduledTime = conflictResult.adjustedTime.toISOString();
            } else if (detectedBookingType === 'doctor') {
              response.intent.preferredDate = conflictResult.adjustedTime.toISOString();
            } else {
              response.intent.departDate = conflictResult.adjustedTime.toISOString();
            }
          }
        } else {
          setCalendarAdjustment(null);
        }

        // Add warnings to the console
        if (conflictResult.warnings.length > 0) {
          console.log('Calendar warnings:', conflictResult.warnings);
        }
      }

      // Build proposal
      setPlanResponse(response as any);
      setCurrentBookingId(response.bookingId);

      const bookingTypeLabel = detectedBookingType === 'ride' ? 'Ride' : detectedBookingType === 'doctor' ? 'Appointment' : 'Flight';
      const builtProposal = {
        title: response.proposal?.title || `${bookingTypeLabel} Options`,
        details: {
          origin: response.intent?.origin ||
                  response.intent?.pickupLocation?.address ||
                  location?.city ||
                  'Current Location',
          destination: response.intent?.destination ||
                       response.intent?.dropoffLocation?.address ||
                       'Destination',
          dates: response.intent?.scheduledTime ||
                 response.intent?.departDate ||
                 response.intent?.preferredDate ||
                 'Flexible dates',
          budget: response.intent?.budget ? `$${response.intent.budget}` : undefined,
          travelers: response.intent?.travelers || 1,
        },
      };
      setProposal(builtProposal);

      // Select best option
      if (response.options && response.options.length > 0) {
        setSelectedFlight(response.options[0]);
      }

      setShowStepModal(false);
      setAppState('proposing');
      setAgentState('success');
      return;
    }

    // Start with connecting scene - uses SceneTiming for sophisticated minimum display
    await showSceneAndWait({
      id: 'connect',
      type: 'connecting',
      title: 'Connecting to Atlas AI',
      subtitle: 'Establishing secure connection...',
    });

    // Locating scene
    await showSceneAndWait({
      id: 'locate',
      type: 'locating',
      title: 'Detecting Your Location',
      subtitle: 'Finding your current position...',
      data: {
        origin: {
          city: location?.city || 'Current Location',
          code: location?.nearestAirport || 'LOC',
        },
      },
    });

    // Understanding your request scene - show BEFORE API call
    await showSceneAndWait({
      id: 'parse',
      type: 'parsing_intent',
      title: 'Understanding Your Request',
      subtitle: 'Processing natural language...',
      data: {
        origin: { city: location?.city || 'Current Location', code: location?.nearestAirport || 'LOC' },
      },
    });

    // Call the actual planning API
    const response = await planBooking({
      userMessage: input,
      currentLocation: location || undefined,
      onStepChange: () => {}, // No longer needed for scene changes
    });

    if (response.error) {
      setAgentState('error');
      setCurrentScene(null);
      await delay(2000);
      resetToIdle();
      return;
    }

    // Show map route scene with actual data from response
    const originCity = location?.city || response.intent?.origin || 'Current Location';
    const originCode = location?.nearestAirport || 'LOC';
    const destCity = response.intent?.destination || 'Destination';
    const destCode = destCity.substring(0, 3).toUpperCase();

    await showSceneAndWait({
      id: 'route',
      type: 'map_route',
      title: 'Plotting Your Journey',
      subtitle: `${originCity} → ${destCity}`,
      data: {
        origin: {
          city: originCity,
          code: originCode,
        },
        destination: {
          city: destCity,
          code: destCode,
        },
      },
    });

    // Planning complete - show proposal
    setPlanResponse(response);
    setCurrentBookingId(response.bookingId);

    // Build proposal from intent data (more reliable than relying on API proposal)
    const bookingTypeLabel = response.bookingType === 'ride' ? 'Ride' : response.bookingType === 'doctor' ? 'Appointment' : 'Flight';
    const builtProposal = {
      title: response.proposal?.title || `${bookingTypeLabel} Options`,
      details: {
        origin: response.intent?.origin ||
                response.intent?.pickupLocation?.address ||
                location?.city ||
                'Current Location',
        destination: response.intent?.destination ||
                     response.intent?.dropoffLocation?.address ||
                     'Destination',
        dates: response.intent?.scheduledTime ||
               response.intent?.departDate ||
               response.intent?.preferredDate ||
               'Flexible dates',
        budget: response.intent?.budget ? `$${response.intent.budget}` : undefined,
        travelers: response.intent?.travelers || 1,
      },
    };
    setProposal(builtProposal);

    // Select best option by default
    if (response.flights && response.flights.length > 0) {
      setSelectedFlight(response.flights[0]);
    } else if (response.rides && response.rides.length > 0) {
      setSelectedFlight(response.rides[0]);
    }

    setCurrentScene(null);
    setAppState('proposing');
    setAgentState('success');
  };

  const handleProfileComplete = async (data: ProfileData) => {
    if (!user) return;

    console.log('Updating profile with data:', data);
    const result = await updateProfileData(user.id, data);

    if (result.success) {
      console.log('Profile updated successfully');
      setShowProfileModal(false);

      // Retry the booking flow with the pending input
      if (pendingUserInput.trim()) {
        console.log('Retrying booking with input:', pendingUserInput);
        await delay(500); // Small delay to let modal close
        handleUserInput(pendingUserInput);
        setPendingUserInput(''); // Clear pending input
      }
    } else {
      console.error('Profile update failed:', result.error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleApprove = async () => {
    console.log('handleApprove called', { planResponse, currentBookingId, useGranularFlow, useImmersiveAnimations });

    if (!planResponse) {
      console.log('No planResponse, cannot approve');
      return;
    }

    // Use planResponse.bookingId if currentBookingId is not set
    const bookingId = currentBookingId || planResponse.bookingId || 'temp-booking';

    // Start booking phase
    setAppState('booking');
    setProposal(null);
    setAgentState('thinking');

    const immersiveData: ImmersiveSceneData = {
      origin: {
        city: location?.city || planResponse.intent?.origin || 'Origin',
        code: location?.nearestAirport || 'LOC',
      },
      destination: {
        city: planResponse.intent?.destination || 'Destination',
        code: planResponse.intent?.destination?.substring(0, 3).toUpperCase() || 'DEST',
      },
      price: planResponse.flights?.[0]?.price || planResponse.rides?.[0]?.price || planResponse.doctors?.[0]?.price || 310,
      currency: 'USD',
      carrier: planResponse.flights?.[0]?.carrier || planResponse.rides?.[0]?.name || planResponse.doctors?.[0]?.name || 'Best Option',
      flightNumber: planResponse.flights?.[0]?.flightNumber || 'Confirmed',
      duration: planResponse.flights?.[0]?.details,
      driver: planResponse.rides?.[0] ? {
        name: planResponse.rides[0].driverName || 'Marcus',
        rating: planResponse.rides[0].rating || 4.9,
        vehicle: planResponse.rides[0].vehicle || 'Toyota Camry',
        eta: planResponse.rides[0].eta || 3,
      } : undefined,
      doctor: planResponse.doctors?.[0] ? {
        name: planResponse.doctors[0].name || 'Dr. Smith',
        specialty: planResponse.doctors[0].specialty || 'General Practice',
      } : undefined,
    };

    // Use immersive animations for booking flow
    if (useImmersiveAnimations) {
      // Flight journey or car dispatch or appointment calendar
      if (bookingType === 'flight') {
        setImmersiveScene({ type: 'flight_journey', data: immersiveData });
        await delay(5000);
      } else if (bookingType === 'ride') {
        setImmersiveScene({ type: 'car_dispatch', data: immersiveData });
        await delay(4000);
      } else if (bookingType === 'doctor') {
        setImmersiveScene({ type: 'appointment_calendar', data: immersiveData });
        await delay(4000);
      }

      // Payment vault scene
      setImmersiveScene({ type: 'payment_vault', data: immersiveData });
      await delay(4500);

      // Execute the actual booking
      const selectedOption = selectedFlight || planResponse.flights?.[0] || planResponse.rides?.[0] || planResponse.doctors?.[0];
      const result = await executeBooking(
        bookingId,
        selectedOption,
        () => {}
      );

      if (result.success) {
        // Success celebration
        setImmersiveScene({ type: 'success_celebration', data: immersiveData });
        setAppState('complete');
        setAgentState('success');

        await delay(5000);
        setImmersiveScene(null);
        resetToIdle();
      } else {
        setAgentState('error');
        setImmersiveScene(null);
        await delay(2000);
        resetToIdle();
      }
      return;
    }

    const sceneData = {
      origin: {
        city: location?.city || planResponse.intent?.origin || 'Origin',
        code: location?.nearestAirport || 'LOC',
      },
      destination: {
        city: planResponse.intent?.destination || 'Destination',
        code: planResponse.intent?.destination?.substring(0, 3).toUpperCase() || 'DEST',
      },
      price: planResponse.flights?.[0]?.price || planResponse.rides?.[0]?.price || 340,
      currency: '$',
      carrier: planResponse.flights?.[0]?.carrier || 'Best Option',
      flightNumber: planResponse.flights?.[0]?.flightNumber || 'Confirmed',
    };

    // Skip redundant scenes if using granular flow (already showed detailed steps)
    if (!useGranularFlow) {
      // Searching scene - uses SceneTiming minimum display
      await showSceneAndWait({
        id: 'search',
        type: bookingType === 'ride' ? 'searching_drivers' : bookingType === 'doctor' ? 'finding_doctors' : 'searching_flights',
        title: bookingType === 'ride' ? 'Finding Drivers' : bookingType === 'doctor' ? 'Finding Specialists' : 'Searching Flights',
        subtitle: bookingType === 'ride' ? 'Locating available drivers nearby...' : bookingType === 'doctor' ? 'Searching for qualified doctors...' : 'Querying 500+ airlines worldwide...',
        data: sceneData,
      });

      // Comparing scene
      await showSceneAndWait({
        id: 'compare',
        type: bookingType === 'doctor' ? 'checking_availability' : 'comparing_prices',
        title: bookingType === 'doctor' ? 'Checking Availability' : 'Comparing Options',
        subtitle: bookingType === 'doctor' ? 'Finding open appointment slots...' : 'Analyzing fares and schedules...',
        data: sceneData,
      });

      // Selecting scene
      await showSceneAndWait({
        id: 'select',
        type: bookingType === 'ride' ? 'driver_arriving' : 'selecting_option',
        title: bookingType === 'ride' ? 'Driver Matched!' : 'Securing Your Selection',
        subtitle: bookingType === 'ride' ? 'Your driver is on the way...' : 'Reserving your preferred option...',
        data: {
          ...sceneData,
          driver: { name: 'Michael S.', rating: 4.9, vehicle: 'Toyota Camry', eta: 3 },
        },
      });
    }

    // If using granular flow, continue with booking steps
    if (useGranularFlow) {
      console.log('Starting granular booking continuation', { bookingId, bookingType, stepsCount: stepState.steps.length });

      // Show step modal for booking phase
      setShowStepModal(true);

      // Continue granular booking flow (payment, confirmation, etc.)
      const continuationResult = await continueGranularBooking(
        bookingId,
        bookingType,
        stepState.steps,
        handleStepChange
      );

      console.log('Granular booking continuation result:', continuationResult);

      if (continuationResult.success) {
        // Complete all steps
        completeSteps();

        // Close step modal after completion
        await delay(2000);
        setShowStepModal(false);

        // Show final confirmation scene - uses SceneTiming for proper display duration
        setCurrentScene({
          id: 'confirm',
          type: 'confirmation',
          title: 'Booking Complete!',
          subtitle: bookingType === 'ride' ? 'Your ride is on the way!' : bookingType === 'doctor' ? 'Your appointment is confirmed!' : 'Your trip is booked!',
          data: sceneData,
        });
        setAppState('complete');
        setAgentState('success');

        // Show completion using SceneTiming minimum display, then reset
        await delay(SceneTiming.minDisplayTime.confirmation);
        resetToIdle();
      } else {
        setAgentState('error');
        setShowStepModal(false);
        setCurrentScene(null);
        await delay(2000);
        resetToIdle();
      }
    } else {
      // Original flow: Payment scene - uses SceneTiming
      await showSceneAndWait({
        id: 'payment',
        type: 'processing_payment',
        title: 'Processing Payment',
        subtitle: 'Securing your booking...',
        data: sceneData,
      });

      // Execute the actual booking
      const selectedOption = selectedFlight || planResponse.flights?.[0] || planResponse.rides?.[0] || planResponse.doctors?.[0];
      const result = await executeBooking(
        bookingId,
        selectedOption,
        () => {} // No longer using step callbacks for old UI
      );

      if (result.success) {
        // Confirmation scene - uses SceneTiming
        setCurrentScene({
          id: 'confirm',
          type: 'confirmation',
          title: 'Booking Complete!',
          subtitle: bookingType === 'ride' ? 'Your ride is on the way!' : bookingType === 'doctor' ? 'Your appointment is confirmed!' : 'Your trip is booked!',
          data: sceneData,
        });
        setAppState('complete');
        setAgentState('success');

        // Show completion using SceneTiming minimum display, then reset
        await delay(SceneTiming.minDisplayTime.confirmation);
        resetToIdle();
      } else {
        setAgentState('error');
        setCurrentScene(null);
        await delay(2000);
        resetToIdle();
      }
    }
  };

  const handleAdjust = () => {
    setProposal(null);
    setAppState('listening');
    startRecording();
  };

  const resetToIdle = () => {
    setAppState('idle');
    setCurrentScene(null);
    setCurrentBookingId(null);
    setPlanResponse(null);
    setSelectedFlight(null);
    setProposal(null);
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Determine if we should show full-screen cinematic view
  const showCinematicView = (appState === 'planning' || appState === 'booking') && currentScene !== null;
  const showImmersiveView = (appState === 'planning' || appState === 'booking' || appState === 'complete') && immersiveScene !== null;

  return (
    <View style={[CommonStyles.container, { paddingTop: insets.top }]}>
      {/* Full-screen Immersive Cinematic Scenes */}
      {showImmersiveView && immersiveScene && (
        <View style={styles.cinematicContainer}>
          <ImmersiveCinematicScenes
            sceneType={immersiveScene.type}
            data={immersiveScene.data}
            bookingType={bookingType}
          />

          {/* Mini disk in corner during scenes */}
          <View style={styles.miniDiskContainer}>
            <AgentDisk state={agentState} onTap={() => {}} size={50} />
          </View>
        </View>
      )}

      {/* Full-screen Cinematic Scenes (legacy) */}
      {!showImmersiveView && showCinematicView && currentScene && (
        <View style={styles.cinematicContainer}>
          <CinematicScenes
            scene={currentScene}
            bookingType={bookingType}
            onSceneReady={handleSceneReady}
          />

          {/* Mini disk in corner during scenes */}
          <View style={styles.miniDiskContainer}>
            <AgentDisk state={agentState} onTap={() => {}} size={50} />
          </View>
        </View>
      )}

      {/* Regular UI when not in cinematic mode */}
      {!showCinematicView && !showImmersiveView && (
        <>
          {/* Agent Disk - Always visible */}
          <View style={styles.diskContainer}>
            <AgentDisk state={agentState} onTap={handleDiskTap} size={80} />
          </View>

          {/* Input Mode Toggle - Bottom Right */}
          {appState === 'idle' && (
            <TouchableOpacity
              style={styles.inputToggle}
              onPress={toggleInputMode}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.inputToggleButton,
                  inputMode === 'text' && styles.inputToggleButtonActive,
                ]}
              >
                <Ionicons
                  name={inputMode === 'voice' ? 'keypad-outline' : 'mic-outline'}
                  size={24}
                  color={inputMode === 'text' ? Colors.text.primary : Colors.text.secondary}
                />
              </View>
            </TouchableOpacity>
          )}

          {/* Main Content Area */}
          <View style={styles.content}>
            {/* Idle State */}
            {appState === 'idle' && inputMode === 'voice' && (
              <View style={styles.welcomeContainer}>
                <Image
                  source={require('../../assets/images/logo.png')}
                  style={styles.welcomeLogo}
                  resizeMode="contain"
                />
                <Text style={styles.welcomeTitle}>Your AI Travel Concierge</Text>
                <Text style={styles.welcomeText}>
                  Tap to start. Tell me where you want to go, and I'll handle everything—flights, rides, and more.
                </Text>
                {location && (
                  <View style={styles.locationBadge}>
                    <Text style={styles.locationText}>
                      📍 {location.city || 'Unknown'} {location.nearestAirport ? `(${location.nearestAirport})` : ''}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Listening State */}
            {appState === 'listening' && (
              <View style={styles.listeningContainer}>
                <Text style={styles.listeningTitle}>I am listening...</Text>
                <Text style={styles.listeningText}>
                  Tell me your destination and any preferences
                </Text>
                {transcript ? (
                  <Text style={styles.transcript}>{transcript}</Text>
                ) : null}
              </View>
            )}

            {/* Mini Step Indicator (shown during planning with granular flow) */}
            {appState === 'planning' && useGranularFlow && stepState.isActive && (
              <View style={styles.miniStepContainer}>
                <TouchableOpacity
                  onPress={() => setShowStepModal(true)}
                  activeOpacity={0.8}
                >
                  <MiniStepIndicator
                    currentStep={stepState.currentStep}
                    progress={stepState.progress}
                    totalSteps={stepState.totalCount}
                    completedSteps={stepState.completedCount}
                  />
                </TouchableOpacity>
              </View>
            )}

            {/* Text Input Mode */}
            {appState === 'idle' && inputMode === 'text' && (
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.textInputContainer}
              >
                <View style={styles.textInputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Where do you want to go?"
                    placeholderTextColor={Colors.text.tertiary}
                    value={textInput}
                    onChangeText={setTextInput}
                    multiline
                    autoFocus
                    onSubmitEditing={handleTextSubmit}
                  />
                  <TouchableOpacity
                    style={[
                      styles.sendButton,
                      !textInput.trim() && styles.sendButtonDisabled,
                    ]}
                    onPress={handleTextSubmit}
                    disabled={!textInput.trim()}
                  >
                    <Ionicons
                      name="send"
                      size={20}
                      color={textInput.trim() ? Colors.text.primary : Colors.text.tertiary}
                    />
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            )}

            {/* Proposal State */}
            {appState === 'proposing' && proposal && (
              <View style={styles.proposalContainer}>
                {/* Calendar Adjustment Banner */}
                {calendarAdjustment && (
                  <View style={styles.calendarAdjustmentBanner}>
                    <View style={styles.calendarAdjustmentIcon}>
                      <Ionicons name="calendar-outline" size={24} color={Colors.accent.amber} />
                    </View>
                    <View style={styles.calendarAdjustmentContent}>
                      <Text style={styles.calendarAdjustmentTitle}>Schedule Adjusted</Text>
                      <Text style={styles.calendarAdjustmentText}>{calendarAdjustment}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setCalendarAdjustment(null)}
                      style={styles.calendarAdjustmentDismiss}
                    >
                      <Ionicons name="close" size={20} color={Colors.text.secondary} />
                    </TouchableOpacity>
                  </View>
                )}

                <ProposalCard
                  title={proposal.title}
                  details={proposal.details}
                  onApprove={handleApprove}
                  onAdjust={handleAdjust}
                />

                {/* Flight options preview */}
                {planResponse?.flights && planResponse.flights.length > 0 && (
                  <View style={styles.flightsPreview}>
                    <Text style={styles.flightsTitle}>
                      🎫 {planResponse.flights.length} flight options found
                    </Text>
                    <View style={styles.topFlight}>
                      <View style={styles.flightInfo}>
                        <Text style={styles.flightCarrier}>
                          {planResponse.flights[0].carrier}
                        </Text>
                        <Text style={styles.flightDetails}>
                          {planResponse.flights[0].details}
                        </Text>
                      </View>
                      <Text style={styles.flightPrice}>
                        ${planResponse.flights[0].price}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Complete State */}
            {appState === 'complete' && !currentScene && (
              <View style={styles.completeContainer}>
                <View style={styles.completeIcon}>
                  <Ionicons name="checkmark-circle" size={80} color={Colors.accent.emerald} />
                </View>
                <Text style={styles.completeTitle}>Booking Complete!</Text>
                <Text style={styles.completeText}>
                  Your booking has been confirmed successfully. Check your email for details.
                </Text>
                <View style={styles.completeActions}>
                  <TouchableOpacity
                    style={styles.viewBookingButton}
                    onPress={() => router.push('/(tabs)/bookings')}
                  >
                    <Ionicons name="calendar" size={20} color={Colors.text.primary} />
                    <Text style={styles.viewBookingText}>View Booking</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </>
      )}

      {/* Granular Step Modal */}
      <GranularStepModal
        visible={showStepModal}
        steps={stepState.steps}
        currentStep={stepState.currentStep}
        progress={stepState.progress}
        bookingType={bookingType}
        onClose={() => setShowStepModal(false)}
        onStepComplete={(step) => {
          console.log('Step completed:', step.label);
        }}
      />

      {/* Profile Completion Modal */}
      <ProfileCompletionModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onComplete={handleProfileComplete}
        missingFields={profileMissingFields}
      />

      {/* Schedule Briefing Modal */}
      <Modal
        visible={showBriefing}
        transparent
        animationType="slide"
        onRequestClose={dismissBriefing}
      >
        <View style={styles.briefingOverlay}>
          <View style={styles.briefingContainer}>
            <View style={styles.briefingHeader}>
              <View style={styles.briefingHeaderLeft}>
                <Ionicons name="calendar" size={24} color={Colors.primary.main} />
                <Text style={styles.briefingTitle}>
                  {briefingData?.period === 'day' ? "Today's" :
                   briefingData?.period === 'week' ? "This Week's" :
                   briefingData?.period === 'month' ? "This Month's" : "This Year's"} Schedule
                </Text>
              </View>
              <TouchableOpacity onPress={dismissBriefing} style={styles.briefingClose}>
                <Ionicons name="close" size={24} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {briefingData && (
              <View style={styles.briefingContent}>
                {/* Summary */}
                <Text style={styles.briefingSummary}>{briefingData.summary}</Text>

                {/* Items list */}
                {briefingData.items.length > 0 ? (
                  <View style={styles.briefingItemsList}>
                    {briefingData.items.slice(0, 10).map((item, index) => (
                      <View key={item.id || index} style={styles.briefingItem}>
                        <View style={[
                          styles.briefingItemIcon,
                          { backgroundColor: item.type === 'flight' ? Colors.primary.main + '20' :
                                            item.type === 'ride' ? '#000000' + '20' :
                                            item.type === 'doctor' ? Colors.accent.red + '20' :
                                            Colors.text.tertiary + '20' }
                        ]}>
                          <Ionicons
                            name={item.type === 'flight' ? 'airplane' :
                                  item.type === 'ride' ? 'car' :
                                  item.type === 'doctor' ? 'medkit' : 'calendar'}
                            size={16}
                            color={item.type === 'flight' ? Colors.primary.main :
                                   item.type === 'ride' ? '#000000' :
                                   item.type === 'doctor' ? Colors.accent.red :
                                   Colors.text.secondary}
                          />
                        </View>
                        <View style={styles.briefingItemContent}>
                          <Text style={styles.briefingItemTitle}>{item.title}</Text>
                          <Text style={styles.briefingItemTime}>
                            {item.startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            {briefingData.period !== 'day' && ` - ${item.startTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`}
                          </Text>
                          {item.details && (
                            <Text style={styles.briefingItemDetails}>{item.details}</Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.briefingEmpty}>
                    <Ionicons name="calendar-outline" size={48} color={Colors.text.tertiary} />
                    <Text style={styles.briefingEmptyText}>No events scheduled</Text>
                  </View>
                )}

                {/* Free time gaps */}
                {briefingData.gaps.length > 0 && briefingData.period === 'day' && (
                  <View style={styles.briefingGaps}>
                    <Text style={styles.briefingGapsTitle}>Free Time</Text>
                    {briefingData.gaps.slice(0, 3).map((gap, index) => (
                      <Text key={index} style={styles.briefingGapItem}>
                        {gap.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - {gap.end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} ({Math.round(gap.duration / 60)} hours)
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity style={styles.briefingDoneButton} onPress={dismissBriefing}>
              <Text style={styles.briefingDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  cinematicContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },

  miniDiskContainer: {
    position: 'absolute',
    top: 60,
    left: Spacing.lg,
    zIndex: 101,
  },

  miniStepContainer: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    zIndex: 102,
  },

  diskContainer: {
    position: 'absolute',
    top: Spacing['2xl'] + 40,
    left: Spacing.lg,
    zIndex: 1000,
  },

  content: {
    flex: 1,
    marginTop: 140,
  },

  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['2xl'],
  },

  welcomeLogo: {
    width: 120,
    height: 120,
    marginBottom: Spacing.xl,
  },

  welcomeTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },

  welcomeText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: Typography.sizes.base * 1.6,
    maxWidth: 320,
  },

  locationBadge: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface.base,
    borderRadius: 20,
  },

  locationText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },

  listeningContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['2xl'],
  },

  listeningTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '600',
    color: Colors.accent.blue,
    marginBottom: Spacing.md,
  },

  listeningText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },

  transcript: {
    fontSize: Typography.sizes.lg,
    color: Colors.text.primary,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  inputToggle: {
    position: 'absolute',
    bottom: Spacing['2xl'],
    right: Spacing.lg,
    zIndex: 1000,
  },

  inputToggleButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface.base,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
  },

  inputToggleButtonActive: {
    backgroundColor: Colors.primary.main,
  },

  textInputContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing['2xl'],
  },

  textInputWrapper: {
    flexDirection: 'row',
    backgroundColor: Colors.surface.base,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    alignItems: 'flex-end',
    ...Shadows.md,
  },

  textInput: {
    flex: 1,
    fontSize: Typography.sizes.base,
    color: Colors.text.primary,
    maxHeight: 120,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },

  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },

  sendButtonDisabled: {
    backgroundColor: Colors.surface.elevated,
  },

  proposalContainer: {
    flex: 1,
    padding: Spacing.lg,
  },

  flightsPreview: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.surface.base,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },

  flightsTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },

  topFlight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  flightInfo: {
    flex: 1,
  },

  flightCarrier: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  flightDetails: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },

  flightPrice: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    color: Colors.accent.emerald,
  },

  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['2xl'],
  },

  completeIcon: {
    marginBottom: Spacing.xl,
  },

  completeTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },

  completeText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },

  completeActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },

  viewBookingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },

  viewBookingText: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  // Calendar Adjustment Banner Styles
  calendarAdjustmentBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.accent.amber + '15',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.accent.amber + '30',
  },

  calendarAdjustmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent.amber + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },

  calendarAdjustmentContent: {
    flex: 1,
  },

  calendarAdjustmentTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    color: Colors.accent.amber,
    marginBottom: Spacing.xs,
  },

  calendarAdjustmentText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    lineHeight: Typography.sizes.sm * 1.5,
  },

  calendarAdjustmentDismiss: {
    padding: Spacing.xs,
  },

  // Briefing Modal Styles
  briefingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },

  briefingContainer: {
    backgroundColor: Colors.background.secondary,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '80%',
    paddingBottom: Spacing['2xl'],
  },

  briefingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },

  briefingHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  briefingTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.primary,
  },

  briefingClose: {
    padding: Spacing.xs,
  },

  briefingContent: {
    padding: Spacing.lg,
  },

  briefingSummary: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    lineHeight: Typography.sizes.base * 1.6,
    marginBottom: Spacing.lg,
  },

  briefingItemsList: {
    gap: Spacing.md,
  },

  briefingItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },

  briefingItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },

  briefingItemContent: {
    flex: 1,
  },

  briefingItemTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  briefingItemTime: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },

  briefingItemDetails: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.tertiary,
    marginTop: 4,
  },

  briefingEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
  },

  briefingEmptyText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.tertiary,
    marginTop: Spacing.md,
  },

  briefingGaps: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.accent.emerald + '10',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.accent.emerald + '20',
  },

  briefingGapsTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: Colors.accent.emerald,
    marginBottom: Spacing.sm,
  },

  briefingGapItem: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },

  briefingDoneButton: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },

  briefingDoneText: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.primary,
  },
});
