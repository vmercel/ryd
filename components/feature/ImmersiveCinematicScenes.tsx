// Immersive Cinematic Scenes with Real Map Routes & 3D Effects
// Ultra-premium visual experience with scenery-like animations

import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Path, Circle, Defs, RadialGradient, Stop, G, Line, Ellipse } from 'react-native-svg';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

// Scene types
export type ImmersiveSceneType =
  | 'world_map_zoom'
  | 'route_trace'
  | 'flight_journey'
  | 'city_arrival'
  | 'searching_globe'
  | 'price_cascade'
  | 'selection_spotlight'
  | 'payment_vault'
  | 'success_celebration'
  | 'ride_radar'
  | 'car_dispatch'
  | 'doctor_pulse'
  | 'appointment_calendar';

export interface ImmersiveSceneData {
  origin?: { city: string; code: string; country?: string };
  destination?: { city: string; code: string; country?: string };
  carrier?: string;
  price?: number;
  currency?: string;
  flightNumber?: string;
  duration?: string;
  driver?: { name: string; rating: number; vehicle: string; eta: number };
  doctor?: { name: string; specialty: string };
}

interface ImmersiveCinematicScenesProps {
  sceneType: ImmersiveSceneType;
  data?: ImmersiveSceneData;
  bookingType?: 'flight' | 'ride' | 'doctor';
  onSceneComplete?: () => void;
}

// ============================================
// MAIN COMPONENT
// ============================================

export const ImmersiveCinematicScenes: React.FC<ImmersiveCinematicScenesProps> = ({
  sceneType,
  data,
  bookingType = 'flight',
  onSceneComplete,
}) => {
  const masterFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in on mount
    Animated.timing(masterFade, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  const renderScene = () => {
    switch (sceneType) {
      case 'world_map_zoom':
        return <WorldMapZoomScene data={data} onComplete={onSceneComplete} />;
      case 'route_trace':
        return <RouteTraceScene data={data} bookingType={bookingType} onComplete={onSceneComplete} />;
      case 'flight_journey':
        return <FlightJourneyScene data={data} onComplete={onSceneComplete} />;
      case 'city_arrival':
        return <CityArrivalScene data={data} onComplete={onSceneComplete} />;
      case 'searching_globe':
        return <SearchingGlobeScene bookingType={bookingType} onComplete={onSceneComplete} />;
      case 'price_cascade':
        return <PriceCascadeScene data={data} onComplete={onSceneComplete} />;
      case 'selection_spotlight':
        return <SelectionSpotlightScene data={data} bookingType={bookingType} onComplete={onSceneComplete} />;
      case 'payment_vault':
        return <PaymentVaultScene data={data} onComplete={onSceneComplete} />;
      case 'success_celebration':
        return <SuccessCelebrationScene data={data} bookingType={bookingType} onComplete={onSceneComplete} />;
      case 'ride_radar':
        return <RideRadarScene data={data} onComplete={onSceneComplete} />;
      case 'car_dispatch':
        return <CarDispatchScene data={data} onComplete={onSceneComplete} />;
      case 'doctor_pulse':
        return <DoctorPulseScene data={data} onComplete={onSceneComplete} />;
      case 'appointment_calendar':
        return <AppointmentCalendarScene data={data} onComplete={onSceneComplete} />;
      default:
        return <SearchingGlobeScene bookingType={bookingType} onComplete={onSceneComplete} />;
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: masterFade }]}>
      {/* Deep space background */}
      <LinearGradient
        colors={['#020408', '#0A1628', '#0F1D32', '#0A1628', '#020408']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient stars */}
      <StarField />

      {/* Scene content */}
      {renderScene()}
    </Animated.View>
  );
};

// ============================================
// STAR FIELD BACKGROUND
// ============================================

const StarField: React.FC = () => {
  const stars = useMemo(() =>
    Array(60).fill(0).map((_, i) => ({
      x: Math.random() * SCREEN_WIDTH,
      y: Math.random() * SCREEN_HEIGHT,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.6 + 0.2,
      twinkleSpeed: 1500 + Math.random() * 2000,
    })), []
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map((star, i) => (
        <TwinklingStar key={i} {...star} />
      ))}
    </View>
  );
};

const TwinklingStar: React.FC<{
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
}> = ({ x, y, size, opacity, twinkleSpeed }) => {
  const twinkle = useRef(new Animated.Value(opacity)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(twinkle, {
          toValue: opacity * 0.3,
          duration: twinkleSpeed,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(twinkle, {
          toValue: opacity,
          duration: twinkleSpeed,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.star,
        {
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity: twinkle,
        },
      ]}
    />
  );
};

// ============================================
// WORLD MAP ZOOM SCENE
// ============================================

const WorldMapZoomScene: React.FC<{
  data?: ImmersiveSceneData;
  onComplete?: () => void;
}> = ({ data, onComplete }) => {
  const mapScale = useRef(new Animated.Value(0.6)).current;
  const mapOpacity = useRef(new Animated.Value(0)).current;
  const cameraX = useRef(new Animated.Value(0)).current;
  const cameraY = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.5)).current;
  const gridOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Epic zoom sequence
    Animated.sequence([
      // Fade in map
      Animated.timing(mapOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Zoom in with camera movement
      Animated.parallel([
        Animated.spring(mapScale, {
          toValue: 1.8,
          tension: 20,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(cameraX, {
          toValue: -50,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(cameraY, {
          toValue: -30,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(gridOpacity, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => onComplete?.());

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.5, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.sceneContainer}>
      {/* Animated grid overlay */}
      <Animated.View style={[styles.gridOverlay, { opacity: gridOpacity }]}>
        <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
          {/* Horizontal grid lines */}
          {Array(20).fill(0).map((_, i) => (
            <Line
              key={`h-${i}`}
              x1={0}
              y1={i * (SCREEN_HEIGHT / 20)}
              x2={SCREEN_WIDTH}
              y2={i * (SCREEN_HEIGHT / 20)}
              stroke="#3B82F640"
              strokeWidth={0.5}
            />
          ))}
          {/* Vertical grid lines */}
          {Array(15).fill(0).map((_, i) => (
            <Line
              key={`v-${i}`}
              x1={i * (SCREEN_WIDTH / 15)}
              y1={0}
              x2={i * (SCREEN_WIDTH / 15)}
              y2={SCREEN_HEIGHT}
              stroke="#3B82F640"
              strokeWidth={0.5}
            />
          ))}
        </Svg>
      </Animated.View>

      {/* World map visualization */}
      <Animated.View
        style={[
          styles.mapContainer,
          {
            opacity: mapOpacity,
            transform: [
              { scale: mapScale },
              { translateX: cameraX },
              { translateY: cameraY },
            ],
          },
        ]}
      >
        <WorldMapSVG glowPulse={glowPulse} />
      </Animated.View>

      {/* Location markers */}
      <View style={styles.locationMarkersOverlay}>
        <Animated.View style={[styles.originMarker, { opacity: mapOpacity }]}>
          <View style={styles.markerPulse} />
          <View style={styles.markerDot} />
          <Text style={styles.markerLabel}>{data?.origin?.code || 'SFO'}</Text>
        </Animated.View>

        <Animated.View style={[styles.destMarker, { opacity: mapOpacity }]}>
          <View style={[styles.markerPulse, styles.destPulse]} />
          <View style={[styles.markerDot, styles.destDot]} />
          <Text style={styles.markerLabel}>{data?.destination?.code || 'TYO'}</Text>
        </Animated.View>
      </View>

      {/* Title overlay */}
      <View style={styles.titleContainer}>
        <Text style={styles.sceneTitle}>Plotting Your Journey</Text>
        <Text style={styles.sceneSubtitle}>
          {data?.origin?.city || 'San Francisco'} → {data?.destination?.city || 'Tokyo'}
        </Text>
      </View>
    </View>
  );
};

// ============================================
// ROUTE TRACE SCENE
// ============================================

const RouteTraceScene: React.FC<{
  data?: ImmersiveSceneData;
  bookingType: string;
  onComplete?: () => void;
}> = ({ data, bookingType, onComplete }) => {
  const pathProgress = useRef(new Animated.Value(0)).current;
  const vehicleProgress = useRef(new Animated.Value(0)).current;
  const trailOpacity = useRef(new Animated.Value(0)).current;
  const [pathLength, setPathLength] = useState(500);

  // Calculate bezier control points for curved path
  const startX = 60;
  const startY = SCREEN_HEIGHT * 0.5;
  const endX = SCREEN_WIDTH - 60;
  const endY = SCREEN_HEIGHT * 0.5;
  const controlX = SCREEN_WIDTH / 2;
  const controlY = SCREEN_HEIGHT * 0.2; // Arc up for flight

  const pathD = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;

  useEffect(() => {
    // Route drawing animation
    Animated.sequence([
      // Draw the path
      Animated.timing(pathProgress, {
        toValue: 1,
        duration: 2000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      // Show trail
      Animated.timing(trailOpacity, {
        toValue: 0.6,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Vehicle movement (loop)
    Animated.loop(
      Animated.timing(vehicleProgress, {
        toValue: 1,
        duration: 4000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    ).start();

    const timer = setTimeout(() => onComplete?.(), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Calculate vehicle position along bezier
  const vehicleX = vehicleProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [startX, endX],
  });

  const vehicleY = vehicleProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [startY, controlY + 40, endY],
  });

  const vehicleRotation = vehicleProgress.interpolate({
    inputRange: [0, 0.3, 0.5, 0.7, 1],
    outputRange: ['-20deg', '-10deg', '0deg', '10deg', '20deg'],
  });

  return (
    <View style={styles.sceneContainer}>
      {/* Atmospheric glow */}
      <View style={styles.atmosphereGlow} />

      {/* Route visualization */}
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="originGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
            <Stop offset="100%" stopColor="#10B981" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="destGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#EF4444" stopOpacity={0.8} />
            <Stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* Route path background */}
        <Path
          d={pathD}
          stroke="#FFFFFF10"
          strokeWidth={40}
          fill="none"
          strokeLinecap="round"
        />

        {/* Animated route path */}
        <AnimatedRouteTrail
          d={pathD}
          progress={pathProgress}
          pathLength={pathLength}
          color={bookingType === 'ride' ? '#10B981' : '#3B82F6'}
        />

        {/* Origin point */}
        <Circle cx={startX} cy={startY} r={40} fill="url(#originGlow)" />
        <Circle cx={startX} cy={startY} r={12} fill="#10B981" />
        <Circle cx={startX} cy={startY} r={6} fill="#FFFFFF" />

        {/* Destination point */}
        <Circle cx={endX} cy={endY} r={40} fill="url(#destGlow)" />
        <Circle cx={endX} cy={endY} r={12} fill="#EF4444" />
        <Circle cx={endX} cy={endY} r={6} fill="#FFFFFF" />
      </Svg>

      {/* Moving vehicle */}
      <Animated.View
        style={[
          styles.movingVehicle,
          {
            transform: [
              { translateX: vehicleX },
              { translateY: Animated.subtract(vehicleY, new Animated.Value(25)) },
              { rotate: vehicleRotation },
            ],
          },
        ]}
      >
        <View style={[styles.vehicleGlow, { backgroundColor: bookingType === 'ride' ? '#10B981' : '#3B82F6' }]} />
        <View style={[styles.vehicleIcon, { backgroundColor: bookingType === 'ride' ? '#10B981' : '#3B82F6' }]}>
          <Ionicons
            name={bookingType === 'ride' ? 'car' : 'airplane'}
            size={24}
            color="#FFFFFF"
          />
        </View>
      </Animated.View>

      {/* Location labels */}
      <View style={styles.routeLabels}>
        <View style={styles.routeLabelLeft}>
          <Text style={styles.routeCode}>{data?.origin?.code || 'SFO'}</Text>
          <Text style={styles.routeCity}>{data?.origin?.city || 'San Francisco'}</Text>
        </View>
        <View style={styles.routeLabelRight}>
          <Text style={styles.routeCode}>{data?.destination?.code || 'TYO'}</Text>
          <Text style={styles.routeCity}>{data?.destination?.city || 'Tokyo'}</Text>
        </View>
      </View>

      {/* Route info card */}
      <View style={styles.routeInfoCard}>
        <LinearGradient
          colors={['#1E293B90', '#0F172A90']}
          style={styles.routeInfoGradient}
        >
          <View style={styles.routeInfoRow}>
            <Ionicons name="time-outline" size={20} color="#60A5FA" />
            <Text style={styles.routeInfoText}>{data?.duration || '11h 30m'}</Text>
          </View>
          <View style={styles.routeInfoDivider} />
          <View style={styles.routeInfoRow}>
            <Ionicons name="airplane-outline" size={20} color="#60A5FA" />
            <Text style={styles.routeInfoText}>{data?.carrier || 'Direct Flight'}</Text>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
};

// Animated route trail component
const AnimatedRouteTrail: React.FC<{
  d: string;
  progress: Animated.Value;
  pathLength: number;
  color: string;
}> = ({ d, progress, pathLength, color }) => {
  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [pathLength, 0],
  });

  return (
    <>
      {/* Glow layer */}
      <Path
        d={d}
        stroke={color}
        strokeWidth={8}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${pathLength}`}
        strokeDashoffset={pathLength * (1 - (progress as any)._value)}
        opacity={0.3}
      />
      {/* Main path */}
      <Path
        d={d}
        stroke={color}
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${pathLength}`}
        strokeDashoffset={pathLength * (1 - (progress as any)._value)}
      />
    </>
  );
};

// ============================================
// FLIGHT JOURNEY SCENE
// ============================================

const FlightJourneyScene: React.FC<{
  data?: ImmersiveSceneData;
  onComplete?: () => void;
}> = ({ data, onComplete }) => {
  const planeX = useRef(new Animated.Value(-100)).current;
  const planeY = useRef(new Animated.Value(SCREEN_HEIGHT * 0.4)).current;
  const planeRotation = useRef(new Animated.Value(-15)).current;
  const cloudOffsets = useRef(
    Array(8).fill(0).map(() => new Animated.Value(SCREEN_WIDTH + 200))
  ).current;
  const sunGlow = useRef(new Animated.Value(0.5)).current;
  const horizonGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Plane journey animation
    Animated.parallel([
      Animated.timing(planeX, {
        toValue: SCREEN_WIDTH + 100,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(planeY, {
          toValue: SCREEN_HEIGHT * 0.25,
          duration: 2000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(planeY, {
          toValue: SCREEN_HEIGHT * 0.35,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(planeRotation, {
          toValue: -5,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(planeRotation, {
          toValue: 5,
          duration: 4000,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => onComplete?.());

    // Clouds moving
    cloudOffsets.forEach((cloud, i) => {
      Animated.loop(
        Animated.timing(cloud, {
          toValue: -300,
          duration: 4000 + (i * 500),
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    });

    // Sun glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(sunGlow, { toValue: 0.8, duration: 2000, useNativeDriver: true }),
        Animated.timing(sunGlow, { toValue: 0.5, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    // Horizon glow
    Animated.timing(horizonGlow, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.sceneContainer}>
      {/* Sky gradient */}
      <LinearGradient
        colors={['#0A1628', '#1E3A5F', '#3B6BA5', '#F59E0B40', '#EF444420']}
        locations={[0, 0.3, 0.5, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Sun */}
      <Animated.View style={[styles.sun, { opacity: sunGlow }]}>
        <View style={styles.sunCore} />
        <View style={styles.sunRays} />
      </Animated.View>

      {/* Horizon glow */}
      <Animated.View style={[styles.horizonGlow, { opacity: horizonGlow }]} />

      {/* Clouds */}
      {cloudOffsets.map((offset, i) => (
        <Animated.View
          key={i}
          style={[
            styles.cloud,
            {
              top: 100 + (i * 60),
              transform: [{ translateX: offset }],
              opacity: 0.6 - (i * 0.05),
            },
          ]}
        >
          <CloudShape size={80 + (i * 20)} />
        </Animated.View>
      ))}

      {/* Airplane with trail */}
      <Animated.View
        style={[
          styles.airplane,
          {
            transform: [
              { translateX: planeX },
              { translateY: planeY },
              { rotate: planeRotation.interpolate({
                inputRange: [-15, 15],
                outputRange: ['-15deg', '15deg'],
              })},
            ],
          },
        ]}
      >
        {/* Contrail */}
        <View style={styles.contrail}>
          <LinearGradient
            colors={['#FFFFFF60', '#FFFFFF00']}
            start={{ x: 1, y: 0.5 }}
            end={{ x: 0, y: 0.5 }}
            style={styles.contrailGradient}
          />
        </View>
        {/* Plane icon */}
        <View style={styles.planeIcon}>
          <Ionicons name="airplane" size={48} color="#FFFFFF" />
        </View>
      </Animated.View>

      {/* Flight info */}
      <View style={styles.flightInfo}>
        <BlurView intensity={30} style={styles.flightInfoBlur}>
          <Text style={styles.flightCarrier}>{data?.carrier || 'United Airlines'}</Text>
          <Text style={styles.flightNumber}>{data?.flightNumber || 'UA 837'}</Text>
          <View style={styles.flightRoute}>
            <Text style={styles.flightCode}>{data?.origin?.code || 'SFO'}</Text>
            <Ionicons name="arrow-forward" size={16} color="#60A5FA" />
            <Text style={styles.flightCode}>{data?.destination?.code || 'NRT'}</Text>
          </View>
        </BlurView>
      </View>
    </View>
  );
};

// Cloud shape component
const CloudShape: React.FC<{ size: number }> = ({ size }) => (
  <Svg width={size * 2} height={size}>
    <Ellipse cx={size * 0.3} cy={size * 0.6} rx={size * 0.25} ry={size * 0.2} fill="#FFFFFF" />
    <Ellipse cx={size * 0.5} cy={size * 0.4} rx={size * 0.35} ry={size * 0.25} fill="#FFFFFF" />
    <Ellipse cx={size * 0.7} cy={size * 0.5} rx={size * 0.3} ry={size * 0.22} fill="#FFFFFF" />
    <Ellipse cx={size} cy={size * 0.55} rx={size * 0.35} ry={size * 0.25} fill="#FFFFFF" />
    <Ellipse cx={size * 1.3} cy={size * 0.6} rx={size * 0.25} ry={size * 0.2} fill="#FFFFFF" />
  </Svg>
);

// ============================================
// CITY ARRIVAL SCENE
// ============================================

const CityArrivalScene: React.FC<{
  data?: ImmersiveSceneData;
  onComplete?: () => void;
}> = ({ data, onComplete }) => {
  const cityScale = useRef(new Animated.Value(0.5)).current;
  const cityOpacity = useRef(new Animated.Value(0)).current;
  const lightsFlicker = useRef(
    Array(20).fill(0).map(() => new Animated.Value(Math.random()))
  ).current;
  const welcomeOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // City zoom in
    Animated.parallel([
      Animated.spring(cityScale, {
        toValue: 1,
        tension: 20,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(cityOpacity, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start();

    // Welcome text
    Animated.sequence([
      Animated.delay(1500),
      Animated.timing(welcomeOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => onComplete?.(), 2000);
    });

    // City lights flickering
    lightsFlicker.forEach((light) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(light, {
            toValue: Math.random() * 0.5 + 0.5,
            duration: 500 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(light, {
            toValue: Math.random() * 0.3 + 0.7,
            duration: 500 + Math.random() * 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={styles.sceneContainer}>
      {/* Night sky */}
      <LinearGradient
        colors={['#020408', '#0A1628', '#1E3A5F20']}
        style={StyleSheet.absoluteFill}
      />

      {/* City skyline */}
      <Animated.View
        style={[
          styles.cityContainer,
          {
            opacity: cityOpacity,
            transform: [{ scale: cityScale }],
          },
        ]}
      >
        <CitySkylineSVG lights={lightsFlicker} />
      </Animated.View>

      {/* Welcome message */}
      <Animated.View style={[styles.welcomeContainer, { opacity: welcomeOpacity }]}>
        <Text style={styles.welcomeText}>Welcome to</Text>
        <Text style={styles.welcomeCity}>{data?.destination?.city || 'Tokyo'}</Text>
        <Text style={styles.welcomeCountry}>{data?.destination?.country || 'Japan'}</Text>
      </Animated.View>
    </View>
  );
};

// ============================================
// SEARCHING GLOBE SCENE
// ============================================

const SearchingGlobeScene: React.FC<{
  bookingType: string;
  onComplete?: () => void;
}> = ({ bookingType, onComplete }) => {
  const globeRotation = useRef(new Animated.Value(0)).current;
  const searchBeamRotation = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const resultsCount = useRef(new Animated.Value(0)).current;
  const [displayCount, setDisplayCount] = useState(0);

  useEffect(() => {
    // Globe rotation
    Animated.loop(
      Animated.timing(globeRotation, {
        toValue: 360,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Search beam
    Animated.loop(
      Animated.timing(searchBeamRotation, {
        toValue: 360,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseScale, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    // Results counter
    const interval = setInterval(() => {
      setDisplayCount(prev => {
        const next = prev + Math.floor(Math.random() * 50) + 20;
        return next > 1000 ? Math.floor(Math.random() * 100) + 900 : next;
      });
    }, 150);

    const timer = setTimeout(() => onComplete?.(), 4500);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const themeColor = bookingType === 'ride' ? '#10B981' : bookingType === 'doctor' ? '#EF4444' : '#3B82F6';

  return (
    <View style={styles.sceneContainer}>
      {/* Globe */}
      <Animated.View
        style={[
          styles.globe,
          {
            transform: [{ rotate: globeRotation.interpolate({
              inputRange: [0, 360],
              outputRange: ['0deg', '360deg'],
            })}],
          },
        ]}
      >
        <GlobeSVG color={themeColor} />
      </Animated.View>

      {/* Search beam */}
      <Animated.View
        style={[
          styles.searchBeam,
          {
            transform: [{ rotate: searchBeamRotation.interpolate({
              inputRange: [0, 360],
              outputRange: ['0deg', '360deg'],
            })}],
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', themeColor + '80']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.searchBeamGradient}
        />
      </Animated.View>

      {/* Pulse rings */}
      <Animated.View style={[styles.pulseRing, { borderColor: themeColor, transform: [{ scale: pulseScale }] }]} />
      <Animated.View style={[styles.pulseRing, styles.pulseRing2, { borderColor: themeColor }]} />
      <Animated.View style={[styles.pulseRing, styles.pulseRing3, { borderColor: themeColor }]} />

      {/* Results counter */}
      <View style={styles.resultsContainer}>
        <Text style={[styles.resultsCount, { color: themeColor }]}>{displayCount}+</Text>
        <Text style={styles.resultsLabel}>
          {bookingType === 'ride' ? 'drivers nearby' : bookingType === 'doctor' ? 'specialists available' : 'flights found'}
        </Text>
      </View>

      {/* Scanning text */}
      <View style={styles.scanningContainer}>
        <Text style={styles.scanningText}>Scanning global network</Text>
        <LoadingDots color={themeColor} />
      </View>
    </View>
  );
};

// ============================================
// PRICE CASCADE SCENE
// ============================================

const PriceCascadeScene: React.FC<{
  data?: ImmersiveSceneData;
  onComplete?: () => void;
}> = ({ data, onComplete }) => {
  const priceCards = useMemo(() => [
    { carrier: 'United', price: 450, color: '#3B82F6' },
    { carrier: 'Delta', price: 380, color: '#10B981' },
    { carrier: 'American', price: 520, color: '#EF4444' },
    { carrier: 'JetBlue', price: 340, color: '#06B6D4' },
    { carrier: 'Southwest', price: 310, color: '#F59E0B' },
  ], []);

  const cardAnims = useRef(
    priceCards.map(() => ({
      translateY: new Animated.Value(-200),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.8),
    }))
  ).current;

  const bestPriceGlow = useRef(new Animated.Value(0)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Cascade cards down
    Animated.stagger(150, cardAnims.map((anim, index) =>
      Animated.parallel([
        Animated.spring(anim.translateY, {
          toValue: index * 75,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(anim.scale, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ])
    )).start();

    // Highlight best price
    Animated.sequence([
      Animated.delay(1200),
      Animated.parallel([
        Animated.loop(
          Animated.sequence([
            Animated.timing(bestPriceGlow, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(bestPriceGlow, { toValue: 0.5, duration: 800, useNativeDriver: true }),
          ])
        ),
        Animated.spring(checkmarkScale, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }),
      ]),
    ]).start();

    const timer = setTimeout(() => onComplete?.(), 5000);
    return () => clearTimeout(timer);
  }, []);

  const bestPriceIndex = priceCards.findIndex(p => p.price === Math.min(...priceCards.map(c => c.price)));

  return (
    <View style={styles.sceneContainer}>
      <View style={styles.cascadeContainer}>
        {priceCards.map((card, index) => (
          <Animated.View
            key={index}
            style={[
              styles.priceCard,
              {
                borderColor: card.color + (index === bestPriceIndex ? 'FF' : '40'),
                backgroundColor: index === bestPriceIndex ? card.color + '20' : '#1E293B80',
                transform: [
                  { translateY: cardAnims[index].translateY },
                  { scale: cardAnims[index].scale },
                ],
                opacity: cardAnims[index].opacity,
              },
            ]}
          >
            {index === bestPriceIndex && (
              <Animated.View style={[styles.bestPriceBadge, { opacity: bestPriceGlow }]}>
                <Text style={styles.bestPriceText}>BEST VALUE</Text>
              </Animated.View>
            )}
            <View style={styles.priceCardContent}>
              <View style={styles.priceCardLeft}>
                <View style={[styles.carrierDot, { backgroundColor: card.color }]} />
                <Text style={styles.carrierName}>{card.carrier}</Text>
              </View>
              <View style={styles.priceCardRight}>
                <Text style={[styles.priceAmount, { color: card.color }]}>${card.price}</Text>
                {index === bestPriceIndex && (
                  <Animated.View style={[styles.checkmark, { transform: [{ scale: checkmarkScale }] }]}>
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  </Animated.View>
                )}
              </View>
            </View>
          </Animated.View>
        ))}
      </View>

      <View style={styles.cascadeTitle}>
        <Text style={styles.cascadeTitleText}>Comparing Options</Text>
        <Text style={styles.cascadeSubtitle}>Finding the best value for you</Text>
      </View>
    </View>
  );
};

// ============================================
// SELECTION SPOTLIGHT SCENE
// ============================================

const SelectionSpotlightScene: React.FC<{
  data?: ImmersiveSceneData;
  bookingType: string;
  onComplete?: () => void;
}> = ({ data, bookingType, onComplete }) => {
  const spotlightScale = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.5)).current;
  const cardRotation = useRef(new Animated.Value(30)).current;
  const confettiAnims = useRef(
    Array(25).fill(0).map(() => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;
  const glowPulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Spotlight reveal
    Animated.sequence([
      Animated.spring(spotlightScale, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(cardScale, {
          toValue: 1,
          tension: 50,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(cardRotation, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Confetti burst
    setTimeout(() => {
      confettiAnims.forEach((anim, i) => {
        const angle = (i / confettiAnims.length) * Math.PI * 2;
        const distance = 150 + Math.random() * 100;

        Animated.parallel([
          Animated.timing(anim.x, {
            toValue: Math.cos(angle) * distance,
            duration: 1000,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim.y, {
            toValue: Math.sin(angle) * distance + 100,
            duration: 1000,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim.rotation, {
            toValue: Math.random() * 720,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(600),
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      });
    }, 800);

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    const timer = setTimeout(() => onComplete?.(), 4000);
    return () => clearTimeout(timer);
  }, []);

  const themeColor = bookingType === 'ride' ? '#10B981' : bookingType === 'doctor' ? '#EF4444' : '#3B82F6';
  const confettiColors = ['#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6'];

  return (
    <View style={styles.sceneContainer}>
      {/* Spotlight effect */}
      <Animated.View
        style={[
          styles.spotlight,
          { transform: [{ scale: spotlightScale }] },
        ]}
      >
        <LinearGradient
          colors={['#FFFFFF10', 'transparent']}
          style={styles.spotlightGradient}
        />
      </Animated.View>

      {/* Confetti */}
      {confettiAnims.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.confetti,
            {
              backgroundColor: confettiColors[i % confettiColors.length],
              opacity: anim.opacity,
              transform: [
                { translateX: anim.x },
                { translateY: anim.y },
                { rotate: anim.rotation.interpolate({
                  inputRange: [0, 720],
                  outputRange: ['0deg', '720deg'],
                })},
              ],
            },
          ]}
        />
      ))}

      {/* Selected card */}
      <Animated.View
        style={[
          styles.selectedCard,
          {
            transform: [
              { scale: cardScale },
              { rotate: cardRotation.interpolate({
                inputRange: [0, 30],
                outputRange: ['0deg', '30deg'],
              })},
            ],
          },
        ]}
      >
        <Animated.View style={[styles.selectedCardGlow, { backgroundColor: themeColor, opacity: glowPulse }]} />
        <LinearGradient
          colors={['#1E293B', '#0F172A']}
          style={styles.selectedCardInner}
        >
          <View style={styles.selectedCardHeader}>
            <Ionicons
              name={bookingType === 'ride' ? 'car' : bookingType === 'doctor' ? 'medkit' : 'airplane'}
              size={40}
              color={themeColor}
            />
            <View style={styles.selectedCardTitles}>
              <Text style={styles.selectedCardTitle}>{data?.carrier || 'Best Option'}</Text>
              <Text style={styles.selectedCardSub}>{data?.flightNumber || 'Premium Selection'}</Text>
            </View>
          </View>
          <View style={styles.selectedCardBody}>
            <Text style={[styles.selectedPrice, { color: themeColor }]}>
              ${data?.price || '310'}
            </Text>
            <View style={[styles.selectedBadge, { backgroundColor: themeColor + '20' }]}>
              <Ionicons name="checkmark" size={20} color={themeColor} />
              <Text style={[styles.selectedBadgeText, { color: themeColor }]}>Selected</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

// ============================================
// PAYMENT VAULT SCENE
// ============================================

const PaymentVaultScene: React.FC<{
  data?: ImmersiveSceneData;
  onComplete?: () => void;
}> = ({ data, onComplete }) => {
  const vaultDoorRotation = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(-200)).current;
  const shimmer = useRef(new Animated.Value(-1)).current;
  const lockScale = useRef(new Animated.Value(1)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const [statusText, setStatusText] = useState('Initializing secure connection...');

  useEffect(() => {
    // Vault door opening
    Animated.sequence([
      Animated.timing(vaultDoorRotation, {
        toValue: 1,
        duration: 1500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      // Card slides in
      Animated.spring(cardSlide, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Card shimmer
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 2500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Lock pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(lockScale, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(lockScale, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    // Progress bar
    Animated.timing(progressWidth, {
      toValue: 1,
      duration: 4000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    // Status updates
    const statuses = [
      { text: 'Validating payment method...', delay: 1000 },
      { text: 'Encrypting transaction data...', delay: 2000 },
      { text: 'Processing secure payment...', delay: 3000 },
    ];
    statuses.forEach(({ text, delay }) => {
      setTimeout(() => setStatusText(text), delay);
    });

    const timer = setTimeout(() => onComplete?.(), 4500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.sceneContainer}>
      {/* Vault background */}
      <View style={styles.vaultBackground}>
        <Animated.View
          style={[
            styles.vaultDoor,
            {
              transform: [
                { perspective: 1000 },
                { rotateY: vaultDoorRotation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '-90deg'],
                })},
              ],
            },
          ]}
        >
          <View style={styles.vaultDoorInner}>
            <View style={styles.vaultCircle}>
              <Animated.View style={{ transform: [{ scale: lockScale }] }}>
                <Ionicons name="lock-closed" size={48} color="#F59E0B" />
              </Animated.View>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Payment card */}
      <Animated.View
        style={[
          styles.paymentCardContainer,
          { transform: [{ translateX: cardSlide }] },
        ]}
      >
        <LinearGradient
          colors={['#1E3A5F', '#2D5A87', '#1E3A5F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.paymentCard}
        >
          <View style={styles.cardChip}>
            <View style={styles.chipLines} />
          </View>
          <Text style={styles.cardNumber}>•••• •••• •••• 4242</Text>
          <View style={styles.cardDetails}>
            <View>
              <Text style={styles.cardLabel}>CARDHOLDER</Text>
              <Text style={styles.cardValue}>ATLAS USER</Text>
            </View>
            <View>
              <Text style={styles.cardLabel}>EXPIRES</Text>
              <Text style={styles.cardValue}>12/26</Text>
            </View>
          </View>

          {/* Shimmer effect */}
          <Animated.View
            style={[
              styles.shimmerOverlay,
              {
                transform: [
                  { translateX: shimmer.interpolate({
                    inputRange: [-1, 1],
                    outputRange: [-300, 400],
                  })},
                ],
              },
            ]}
          />
        </LinearGradient>
      </Animated.View>

      {/* Progress */}
      <View style={styles.paymentProgress}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.statusText}>{statusText}</Text>
      </View>

      {/* Amount */}
      <View style={styles.paymentAmountContainer}>
        <Text style={styles.paymentAmountLabel}>Processing</Text>
        <Text style={styles.paymentAmount}>${data?.price || '310'}.00</Text>
      </View>

      {/* Security badge */}
      <View style={styles.securityBadge}>
        <Ionicons name="shield-checkmark" size={20} color="#10B981" />
        <Text style={styles.securityText}>256-bit SSL Encrypted</Text>
      </View>
    </View>
  );
};

// ============================================
// SUCCESS CELEBRATION SCENE
// ============================================

const SuccessCelebrationScene: React.FC<{
  data?: ImmersiveSceneData;
  bookingType: string;
  onComplete?: () => void;
}> = ({ data, bookingType, onComplete }) => {
  const checkScale = useRef(new Animated.Value(0)).current;
  const checkRotation = useRef(new Animated.Value(-180)).current;
  const ringsAnims = useRef(
    Array(4).fill(0).map(() => ({
      scale: new Animated.Value(0.5),
      opacity: new Animated.Value(1),
    }))
  ).current;
  const confettiAnims = useRef(
    Array(40).fill(0).map(() => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(1),
      scale: new Animated.Value(1),
    }))
  ).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Checkmark spring in with rotation
    Animated.parallel([
      Animated.spring(checkScale, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(checkRotation, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(2)),
        useNativeDriver: true,
      }),
    ]).start();

    // Expanding rings
    ringsAnims.forEach((ring, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 300),
          Animated.parallel([
            Animated.timing(ring.scale, {
              toValue: 3,
              duration: 1500,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(ring.opacity, {
              toValue: 0,
              duration: 1500,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(ring.scale, { toValue: 0.5, duration: 0, useNativeDriver: true }),
            Animated.timing(ring.opacity, { toValue: 1, duration: 0, useNativeDriver: true }),
          ]),
        ])
      ).start();
    });

    // Confetti explosion
    confettiAnims.forEach((anim, i) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 200 + Math.random() * 150;

      Animated.parallel([
        Animated.timing(anim.x, {
          toValue: Math.cos(angle) * distance,
          duration: 1500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(anim.y, {
          toValue: Math.sin(angle) * distance + 150,
          duration: 1500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(anim.rotation, {
          toValue: Math.random() * 1080,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(1000),
          Animated.timing(anim.opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.delay(800),
          Animated.timing(anim.scale, { toValue: 0, duration: 700, useNativeDriver: true }),
        ]),
      ]).start();
    });

    // Text reveal
    Animated.sequence([
      Animated.delay(600),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(textScale, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      ]),
    ]).start();

    const timer = setTimeout(() => onComplete?.(), 5000);
    return () => clearTimeout(timer);
  }, []);

  const confettiColors = ['#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4'];

  return (
    <View style={styles.sceneContainer}>
      {/* Confetti */}
      {confettiAnims.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.celebrationConfetti,
            {
              backgroundColor: confettiColors[i % confettiColors.length],
              width: 8 + Math.random() * 10,
              height: 8 + Math.random() * 10,
              borderRadius: Math.random() > 0.5 ? 100 : 3,
              opacity: anim.opacity,
              transform: [
                { translateX: anim.x },
                { translateY: anim.y },
                { rotate: anim.rotation.interpolate({
                  inputRange: [0, 1080],
                  outputRange: ['0deg', '1080deg'],
                })},
                { scale: anim.scale },
              ],
            },
          ]}
        />
      ))}

      {/* Success rings */}
      {ringsAnims.map((ring, i) => (
        <Animated.View
          key={i}
          style={[
            styles.successRing,
            {
              borderColor: '#10B981',
              opacity: ring.opacity,
              transform: [{ scale: ring.scale }],
            },
          ]}
        />
      ))}

      {/* Success checkmark */}
      <Animated.View
        style={[
          styles.successCheck,
          {
            transform: [
              { scale: checkScale },
              { rotate: checkRotation.interpolate({
                inputRange: [-180, 0],
                outputRange: ['-180deg', '0deg'],
              })},
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['#10B981', '#059669']}
          style={styles.successCheckInner}
        >
          <Ionicons name="checkmark" size={80} color="#FFFFFF" />
        </LinearGradient>
      </Animated.View>

      {/* Success text */}
      <Animated.View
        style={[
          styles.successTextContainer,
          {
            opacity: textOpacity,
            transform: [{ scale: textScale }],
          },
        ]}
      >
        <Text style={styles.successTitle}>Booking Confirmed!</Text>
        <Text style={styles.successSubtitle}>
          {bookingType === 'ride'
            ? 'Your ride is being arranged'
            : bookingType === 'doctor'
            ? 'Your appointment is scheduled'
            : 'Your trip is booked'}
        </Text>
        {data?.carrier && (
          <View style={styles.successDetails}>
            <Text style={styles.successCarrier}>{data.carrier}</Text>
            {data.flightNumber && <Text style={styles.successFlight}>{data.flightNumber}</Text>}
          </View>
        )}
      </Animated.View>
    </View>
  );
};

// ============================================
// RIDE RADAR SCENE
// ============================================

const RideRadarScene: React.FC<{
  data?: ImmersiveSceneData;
  onComplete?: () => void;
}> = ({ data, onComplete }) => {
  const radarSweep = useRef(new Animated.Value(0)).current;
  const carPings = useRef(
    Array(5).fill(0).map(() => ({
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;
  const [nearbyCount, setNearbyCount] = useState(0);

  useEffect(() => {
    // Radar sweep
    Animated.loop(
      Animated.timing(radarSweep, {
        toValue: 360,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Car pings appearing
    carPings.forEach((ping, i) => {
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(ping.opacity, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
          Animated.spring(ping.scale, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
        ]).start();
        setNearbyCount(prev => prev + 1);
      }, 500 + i * 400);
    });

    const timer = setTimeout(() => onComplete?.(), 4500);
    return () => clearTimeout(timer);
  }, []);

  const carPositions = [
    { x: -60, y: -40 },
    { x: 70, y: -30 },
    { x: -40, y: 60 },
    { x: 50, y: 70 },
    { x: 0, y: -70 },
  ];

  return (
    <View style={styles.sceneContainer}>
      {/* Radar rings */}
      <View style={styles.radarContainer}>
        {[80, 130, 180].map((size, i) => (
          <View
            key={i}
            style={[
              styles.radarRing,
              {
                width: size * 2,
                height: size * 2,
                borderRadius: size,
                borderColor: '#10B98130',
              },
            ]}
          />
        ))}

        {/* Radar sweep */}
        <Animated.View
          style={[
            styles.radarSweepContainer,
            {
              transform: [{ rotate: radarSweep.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
              })}],
            },
          ]}
        >
          <LinearGradient
            colors={['transparent', '#10B98180']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.radarSweepGradient}
          />
        </Animated.View>

        {/* Center point (user) */}
        <View style={styles.radarCenter}>
          <Ionicons name="person" size={24} color="#FFFFFF" />
        </View>

        {/* Car pings */}
        {carPings.map((ping, i) => (
          <Animated.View
            key={i}
            style={[
              styles.carPing,
              {
                left: SCREEN_WIDTH / 2 + carPositions[i].x - 20,
                top: SCREEN_HEIGHT / 2 + carPositions[i].y - 60,
                opacity: ping.opacity,
                transform: [{ scale: ping.scale }],
              },
            ]}
          >
            <View style={styles.carPingDot}>
              <Ionicons name="car" size={16} color="#10B981" />
            </View>
          </Animated.View>
        ))}
      </View>

      {/* Info */}
      <View style={styles.radarInfo}>
        <Text style={styles.radarCount}>{nearbyCount}</Text>
        <Text style={styles.radarLabel}>drivers nearby</Text>
      </View>

      <View style={styles.scanningContainer}>
        <Text style={styles.scanningText}>Scanning for available drivers</Text>
        <LoadingDots color="#10B981" />
      </View>
    </View>
  );
};

// ============================================
// CAR DISPATCH SCENE
// ============================================

const CarDispatchScene: React.FC<{
  data?: ImmersiveSceneData;
  onComplete?: () => void;
}> = ({ data, onComplete }) => {
  const carX = useRef(new Animated.Value(SCREEN_WIDTH + 100)).current;
  const etaScale = useRef(new Animated.Value(0)).current;
  const pulseRing = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Car driving in
    Animated.spring(carX, {
      toValue: SCREEN_WIDTH / 2 - 40,
      tension: 30,
      friction: 10,
      useNativeDriver: true,
    }).start();

    // ETA pop in
    Animated.sequence([
      Animated.delay(800),
      Animated.spring(etaScale, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }),
    ]).start();

    // Pulse ring
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseRing, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseRing, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();

    const timer = setTimeout(() => onComplete?.(), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.sceneContainer}>
      {/* Road */}
      <View style={styles.road}>
        <View style={styles.roadLine} />
      </View>

      {/* Destination pulse */}
      <View style={styles.destinationPoint}>
        <Animated.View
          style={[
            styles.destinationPulse,
            {
              opacity: pulseRing.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 0],
              }),
              transform: [{ scale: pulseRing.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 3],
              })}],
            },
          ]}
        />
        <View style={styles.destinationDot}>
          <Ionicons name="location" size={24} color="#FFFFFF" />
        </View>
      </View>

      {/* Car */}
      <Animated.View
        style={[
          styles.dispatchCar,
          { transform: [{ translateX: carX }] },
        ]}
      >
        <View style={styles.carBody}>
          <Ionicons name="car-sport" size={60} color="#10B981" />
        </View>
      </Animated.View>

      {/* ETA card */}
      <Animated.View style={[styles.etaCard, { transform: [{ scale: etaScale }] }]}>
        <View style={styles.etaContent}>
          <Text style={styles.etaLabel}>ARRIVING IN</Text>
          <Text style={styles.etaTime}>{data?.driver?.eta || 3} min</Text>
          <View style={styles.driverInfo}>
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text style={styles.driverRating}>{data?.driver?.rating || 4.9}</Text>
            <Text style={styles.driverName}>{data?.driver?.name || 'Marcus'}</Text>
          </View>
          <Text style={styles.vehicleInfo}>{data?.driver?.vehicle || 'Toyota Camry • White'}</Text>
        </View>
      </Animated.View>
    </View>
  );
};

// ============================================
// DOCTOR PULSE SCENE
// ============================================

const DoctorPulseScene: React.FC<{
  data?: ImmersiveSceneData;
  onComplete?: () => void;
}> = ({ data, onComplete }) => {
  const heartbeatLine = useRef(new Animated.Value(0)).current;
  const pulseGlow = useRef(new Animated.Value(0.5)).current;
  const doctorCards = useRef(
    Array(3).fill(0).map(() => ({
      opacity: new Animated.Value(0),
      translateX: new Animated.Value(-50),
    }))
  ).current;

  useEffect(() => {
    // Heartbeat animation
    Animated.loop(
      Animated.timing(heartbeatLine, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulse glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseGlow, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseGlow, { toValue: 0.3, duration: 500, useNativeDriver: true }),
      ])
    ).start();

    // Doctor cards sliding in
    Animated.stagger(200, doctorCards.map(card =>
      Animated.parallel([
        Animated.timing(card.opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(card.translateX, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      ])
    )).start();

    const timer = setTimeout(() => onComplete?.(), 4500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.sceneContainer}>
      {/* Heartbeat line */}
      <View style={styles.heartbeatContainer}>
        <Animated.View
          style={[
            styles.heartbeatLine,
            {
              transform: [{ translateX: heartbeatLine.interpolate({
                inputRange: [0, 1],
                outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
              })}],
            },
          ]}
        >
          <HeartbeatSVG />
        </Animated.View>
      </View>

      {/* Pulse center */}
      <Animated.View style={[styles.pulseCenter, { opacity: pulseGlow }]}>
        <View style={styles.pulseCenterInner}>
          <Ionicons name="heart" size={48} color="#EF4444" />
        </View>
      </Animated.View>

      {/* Doctor cards */}
      <View style={styles.doctorCardsContainer}>
        {doctorCards.map((card, i) => (
          <Animated.View
            key={i}
            style={[
              styles.doctorCard,
              {
                opacity: card.opacity,
                transform: [{ translateX: card.translateX }],
              },
            ]}
          >
            <View style={styles.doctorAvatar}>
              <Ionicons name="person" size={24} color="#EF4444" />
            </View>
            <View style={styles.doctorDetails}>
              <Text style={styles.doctorName}>Dr. {['Smith', 'Johnson', 'Williams'][i]}</Text>
              <Text style={styles.doctorSpecialty}>{['Cardiologist', 'General', 'Specialist'][i]}</Text>
            </View>
            <View style={styles.doctorRating}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.doctorRatingText}>{(4.5 + i * 0.2).toFixed(1)}</Text>
            </View>
          </Animated.View>
        ))}
      </View>

      <View style={styles.scanningContainer}>
        <Text style={styles.scanningText}>Finding qualified specialists</Text>
        <LoadingDots color="#EF4444" />
      </View>
    </View>
  );
};

// ============================================
// APPOINTMENT CALENDAR SCENE
// ============================================

const AppointmentCalendarScene: React.FC<{
  data?: ImmersiveSceneData;
  onComplete?: () => void;
}> = ({ data, onComplete }) => {
  const calendarScale = useRef(new Animated.Value(0.8)).current;
  const calendarOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const selectedDayGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Calendar entrance
    Animated.parallel([
      Animated.spring(calendarScale, { toValue: 1, tension: 40, friction: 8, useNativeDriver: true }),
      Animated.timing(calendarOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    // Day selection
    Animated.sequence([
      Animated.delay(1000),
      Animated.loop(
        Animated.sequence([
          Animated.timing(selectedDayGlow, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(selectedDayGlow, { toValue: 0.5, duration: 800, useNativeDriver: true }),
        ])
      ),
      Animated.spring(checkScale, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => onComplete?.(), 4000);
    return () => clearTimeout(timer);
  }, []);

  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const dates = Array(7).fill(0).map((_, i) => 14 + i);

  return (
    <View style={styles.sceneContainer}>
      <Animated.View
        style={[
          styles.calendarContainer,
          {
            opacity: calendarOpacity,
            transform: [{ scale: calendarScale }],
          },
        ]}
      >
        <LinearGradient
          colors={['#1E293B', '#0F172A']}
          style={styles.calendarInner}
        >
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarMonth}>December 2024</Text>
          </View>
          <View style={styles.calendarDays}>
            {days.map((day, i) => (
              <Text key={i} style={styles.calendarDayLabel}>{day}</Text>
            ))}
          </View>
          <View style={styles.calendarDates}>
            {dates.map((date, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.calendarDate,
                  date === 18 && styles.calendarDateSelected,
                  date === 18 && { opacity: selectedDayGlow },
                ]}
              >
                <Text style={[
                  styles.calendarDateText,
                  date === 18 && styles.calendarDateTextSelected,
                ]}>
                  {date}
                </Text>
              </Animated.View>
            ))}
          </View>
          <View style={styles.appointmentTime}>
            <Ionicons name="time-outline" size={20} color="#EF4444" />
            <Text style={styles.appointmentTimeText}>10:30 AM</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      <Animated.View style={[styles.appointmentCheck, { transform: [{ scale: checkScale }] }]}>
        <Ionicons name="checkmark-circle" size={32} color="#10B981" />
        <Text style={styles.appointmentConfirmed}>Appointment Scheduled</Text>
      </Animated.View>
    </View>
  );
};

// ============================================
// HELPER COMPONENTS
// ============================================

// Loading dots animation
const LoadingDots: React.FC<{ color: string }> = ({ color }) => {
  const dots = useRef([
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3),
  ]).current;

  useEffect(() => {
    Animated.loop(
      Animated.stagger(200, dots.map(dot =>
        Animated.sequence([
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      ))
    ).start();
  }, []);

  return (
    <View style={styles.loadingDots}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={[
            styles.loadingDot,
            { backgroundColor: color, opacity: dot },
          ]}
        />
      ))}
    </View>
  );
};

// World map SVG (simplified)
const WorldMapSVG: React.FC<{ glowPulse: Animated.Value }> = ({ glowPulse }) => (
  <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT * 0.6} viewBox="0 0 800 400">
    <Defs>
      <RadialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
        <Stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
      </RadialGradient>
    </Defs>
    {/* Simplified world continents */}
    <G fill="#3B82F640" stroke="#3B82F680" strokeWidth={1}>
      {/* North America */}
      <Path d="M100,80 L200,60 L250,100 L220,180 L150,200 L80,150 Z" />
      {/* South America */}
      <Path d="M180,220 L220,200 L250,250 L230,350 L180,350 L160,280 Z" />
      {/* Europe */}
      <Path d="M380,60 L450,50 L480,80 L460,130 L400,140 L370,100 Z" />
      {/* Africa */}
      <Path d="M400,150 L480,140 L520,200 L500,300 L420,320 L380,250 Z" />
      {/* Asia */}
      <Path d="M500,40 L700,30 L750,100 L720,180 L600,200 L520,150 L480,80 Z" />
      {/* Australia */}
      <Path d="M650,280 L720,270 L750,320 L720,360 L660,350 Z" />
    </G>
    {/* Grid overlay */}
    {Array(9).fill(0).map((_, i) => (
      <Line key={`lat-${i}`} x1={0} y1={i * 50} x2={800} y2={i * 50} stroke="#3B82F620" strokeWidth={0.5} />
    ))}
    {Array(17).fill(0).map((_, i) => (
      <Line key={`lng-${i}`} x1={i * 50} y1={0} x2={i * 50} y2={400} stroke="#3B82F620" strokeWidth={0.5} />
    ))}
  </Svg>
);

// City skyline SVG
const CitySkylineSVG: React.FC<{ lights: Animated.Value[] }> = ({ lights }) => (
  <Svg width={SCREEN_WIDTH} height={300} viewBox="0 0 400 150">
    {/* Buildings */}
    <G fill="#1E293B">
      <Path d="M0,150 L0,100 L20,100 L20,150 Z" />
      <Path d="M30,150 L30,70 L50,70 L50,150 Z" />
      <Path d="M60,150 L60,50 L80,50 L80,150 Z" />
      <Path d="M90,150 L90,80 L110,80 L110,150 Z" />
      <Path d="M120,150 L120,30 L150,30 L150,150 Z" />
      <Path d="M160,150 L160,60 L180,60 L180,150 Z" />
      <Path d="M190,150 L190,40 L210,30 L230,40 L230,150 Z" />
      <Path d="M240,150 L240,70 L260,70 L260,150 Z" />
      <Path d="M270,150 L270,55 L290,55 L290,150 Z" />
      <Path d="M300,150 L300,85 L320,85 L320,150 Z" />
      <Path d="M330,150 L330,65 L350,65 L350,150 Z" />
      <Path d="M360,150 L360,90 L380,90 L380,150 Z" />
      <Path d="M390,150 L390,110 L400,110 L400,150 Z" />
    </G>
    {/* Windows (lights) */}
    <G>
      {Array(20).fill(0).map((_, i) => {
        const x = 25 + (i % 10) * 38;
        const y = 60 + Math.floor(i / 10) * 30;
        return (
          <Circle
            key={i}
            cx={x}
            cy={y}
            r={2}
            fill="#F59E0B"
            opacity={0.6}
          />
        );
      })}
    </G>
  </Svg>
);

// Globe SVG
const GlobeSVG: React.FC<{ color: string }> = ({ color }) => (
  <Svg width={200} height={200} viewBox="0 0 100 100">
    <Defs>
      <RadialGradient id="globeGrad" cx="30%" cy="30%" r="70%">
        <Stop offset="0%" stopColor={color} stopOpacity={0.8} />
        <Stop offset="100%" stopColor={color} stopOpacity={0.2} />
      </RadialGradient>
    </Defs>
    <Circle cx={50} cy={50} r={45} fill="url(#globeGrad)" />
    {/* Longitude lines */}
    {[0, 30, 60, 90, 120, 150].map((angle, i) => (
      <Ellipse
        key={i}
        cx={50}
        cy={50}
        rx={45 * Math.cos((angle * Math.PI) / 180)}
        ry={45}
        fill="none"
        stroke={color}
        strokeWidth={0.5}
        opacity={0.4}
      />
    ))}
    {/* Latitude lines */}
    {[-30, 0, 30].map((lat, i) => (
      <Ellipse
        key={i}
        cx={50}
        cy={50 + lat}
        rx={45 * Math.cos((lat * Math.PI) / 180)}
        ry={10}
        fill="none"
        stroke={color}
        strokeWidth={0.5}
        opacity={0.4}
      />
    ))}
  </Svg>
);

// Heartbeat SVG
const HeartbeatSVG: React.FC = () => (
  <Svg width={SCREEN_WIDTH * 2} height={100} viewBox="0 0 800 100">
    <Path
      d="M0,50 L100,50 L120,50 L140,20 L160,80 L180,30 L200,70 L220,50 L400,50 L420,50 L440,20 L460,80 L480,30 L500,70 L520,50 L700,50 L720,50 L740,20 L760,80 L780,30 L800,70"
      fill="none"
      stroke="#EF4444"
      strokeWidth={2}
    />
  </Svg>
);

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020408',
  },
  sceneContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  star: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
  },

  // World Map Scene
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  mapContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationMarkersOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  originMarker: {
    position: 'absolute',
    left: SCREEN_WIDTH * 0.25,
    top: SCREEN_HEIGHT * 0.4,
    alignItems: 'center',
  },
  destMarker: {
    position: 'absolute',
    right: SCREEN_WIDTH * 0.25,
    top: SCREEN_HEIGHT * 0.35,
    alignItems: 'center',
  },
  markerPulse: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10B98140',
    position: 'absolute',
  },
  destPulse: {
    backgroundColor: '#EF444440',
  },
  markerDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
  },
  destDot: {
    backgroundColor: '#EF4444',
  },
  markerLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  titleContainer: {
    position: 'absolute',
    bottom: 100,
    alignItems: 'center',
  },
  sceneTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  sceneSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 8,
  },

  // Route Trace Scene
  atmosphereGlow: {
    position: 'absolute',
    width: SCREEN_WIDTH * 2,
    height: SCREEN_HEIGHT,
    backgroundColor: '#3B82F608',
    borderRadius: SCREEN_WIDTH,
    top: -SCREEN_HEIGHT * 0.3,
    left: -SCREEN_WIDTH * 0.5,
  },
  movingVehicle: {
    position: 'absolute',
  },
  vehicleGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.3,
    top: -15,
    left: -15,
  },
  vehicleIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeLabels: {
    position: 'absolute',
    bottom: 250,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
  },
  routeLabelLeft: {
    alignItems: 'flex-start',
  },
  routeLabelRight: {
    alignItems: 'flex-end',
  },
  routeCode: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  routeCity: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  routeInfoCard: {
    position: 'absolute',
    bottom: 120,
    left: 30,
    right: 30,
    borderRadius: 16,
    overflow: 'hidden',
  },
  routeInfoGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 20,
  },
  routeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeInfoDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#FFFFFF20',
  },
  routeInfoText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Flight Journey Scene
  sun: {
    position: 'absolute',
    top: 60,
    right: 60,
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  sunCore: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F59E0B',
    position: 'absolute',
    top: 10,
    left: 10,
  },
  sunRays: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F59E0B40',
    borderRadius: 40,
  },
  horizonGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: '#F59E0B10',
  },
  cloud: {
    position: 'absolute',
    left: 0,
  },
  airplane: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  contrail: {
    position: 'absolute',
    right: 40,
    width: 200,
    height: 8,
    overflow: 'hidden',
  },
  contrailGradient: {
    flex: 1,
  },
  planeIcon: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flightInfo: {
    position: 'absolute',
    bottom: 100,
    left: 30,
    right: 30,
  },
  flightInfoBlur: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  flightCarrier: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  flightNumber: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  flightRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  flightCode: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // City Arrival Scene
  cityContainer: {
    position: 'absolute',
    bottom: 0,
    width: SCREEN_WIDTH,
  },
  welcomeContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.2,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 20,
    color: '#94A3B8',
  },
  welcomeCity: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
  },
  welcomeCountry: {
    fontSize: 18,
    color: '#60A5FA',
    marginTop: 4,
  },

  // Searching Globe Scene
  globe: {
    marginBottom: 40,
  },
  searchBeam: {
    position: 'absolute',
    width: 200,
    height: 200,
  },
  searchBeamGradient: {
    width: 100,
    height: 4,
    position: 'absolute',
    top: 98,
    left: 0,
  },
  pulseRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
  },
  pulseRing2: {
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.5,
  },
  pulseRing3: {
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.3,
  },
  resultsContainer: {
    position: 'absolute',
    bottom: 180,
    alignItems: 'center',
  },
  resultsCount: {
    fontSize: 48,
    fontWeight: '800',
  },
  resultsLabel: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 4,
  },
  scanningContainer: {
    position: 'absolute',
    bottom: 100,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanningText: {
    fontSize: 16,
    color: '#94A3B8',
  },
  loadingDots: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },

  // Price Cascade Scene
  cascadeContainer: {
    width: SCREEN_WIDTH - 60,
    alignItems: 'center',
  },
  priceCard: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  bestPriceBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  bestPriceText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  priceCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  carrierDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  carrierName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  priceCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceAmount: {
    fontSize: 24,
    fontWeight: '800',
  },
  checkmark: {
    marginLeft: 12,
  },
  cascadeTitle: {
    position: 'absolute',
    top: 80,
    alignItems: 'center',
  },
  cascadeTitleText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cascadeSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
  },

  // Selection Spotlight Scene
  spotlight: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  spotlightGradient: {
    flex: 1,
    borderRadius: 200,
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
  },
  selectedCard: {
    width: SCREEN_WIDTH - 80,
    marginBottom: 40,
  },
  selectedCardGlow: {
    position: 'absolute',
    top: -30,
    left: -30,
    right: -30,
    bottom: -30,
    borderRadius: 40,
  },
  selectedCardInner: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  selectedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  selectedCardTitles: {
    marginLeft: 16,
  },
  selectedCardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  selectedCardSub: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
  },
  selectedCardBody: {
    alignItems: 'center',
  },
  selectedPrice: {
    fontSize: 48,
    fontWeight: '800',
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
  },
  selectedBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },

  // Payment Vault Scene
  vaultBackground: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.15,
    width: SCREEN_WIDTH,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaultDoor: {
    width: 200,
    height: 200,
  },
  vaultDoorInner: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: '#374151',
  },
  vaultCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#F59E0B40',
  },
  paymentCardContainer: {
    marginTop: 40,
  },
  paymentCard: {
    width: 300,
    height: 180,
    borderRadius: 16,
    padding: 20,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  cardChip: {
    width: 45,
    height: 32,
    backgroundColor: '#D4AF37',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipLines: {
    width: 30,
    height: 20,
    borderWidth: 1,
    borderColor: '#B8960C',
    borderRadius: 2,
  },
  cardNumber: {
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: 10,
    color: '#FFFFFF60',
  },
  cardValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 2,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: '#FFFFFF20',
    transform: [{ skewX: '-20deg' }],
  },
  paymentProgress: {
    width: SCREEN_WIDTH - 80,
    marginTop: 40,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  statusText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 12,
  },
  paymentAmountContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  paymentAmountLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  paymentAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  securityBadge: {
    position: 'absolute',
    bottom: 80,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B98120',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  securityText: {
    fontSize: 12,
    color: '#10B981',
    marginLeft: 8,
    fontWeight: '600',
  },

  // Success Celebration Scene
  celebrationConfetti: {
    position: 'absolute',
  },
  successRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
  },
  successCheck: {
    width: 160,
    height: 160,
    borderRadius: 80,
    marginBottom: 40,
    overflow: 'hidden',
  },
  successCheckInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTextContainer: {
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  successSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },
  successDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
  },
  successCarrier: {
    fontSize: 18,
    fontWeight: '700',
    color: '#60A5FA',
  },
  successFlight: {
    fontSize: 16,
    color: '#94A3B8',
  },

  // Ride Radar Scene
  radarContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarRing: {
    position: 'absolute',
    borderWidth: 1,
  },
  radarSweepContainer: {
    position: 'absolute',
    width: 180,
    height: 180,
  },
  radarSweepGradient: {
    width: 90,
    height: 4,
    position: 'absolute',
    top: 88,
    left: 0,
  },
  radarCenter: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carPing: {
    position: 'absolute',
  },
  carPingDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B98120',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  radarInfo: {
    position: 'absolute',
    bottom: 200,
    alignItems: 'center',
  },
  radarCount: {
    fontSize: 48,
    fontWeight: '800',
    color: '#10B981',
  },
  radarLabel: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 4,
  },

  // Car Dispatch Scene
  road: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.35,
    width: SCREEN_WIDTH,
    height: 60,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
  },
  roadLine: {
    height: 4,
    backgroundColor: '#F59E0B40',
    marginHorizontal: 20,
  },
  destinationPoint: {
    position: 'absolute',
    left: SCREEN_WIDTH * 0.25,
    bottom: SCREEN_HEIGHT * 0.35 + 50,
    alignItems: 'center',
  },
  destinationPulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EF4444',
  },
  destinationDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dispatchCar: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.35 + 25,
  },
  carBody: {
    width: 80,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  etaCard: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.15,
    width: SCREEN_WIDTH - 60,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: '#10B98140',
  },
  etaContent: {
    alignItems: 'center',
  },
  etaLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    letterSpacing: 2,
  },
  etaTime: {
    fontSize: 48,
    fontWeight: '800',
    color: '#10B981',
    marginTop: 8,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  driverRating: {
    fontSize: 16,
    color: '#F59E0B',
    fontWeight: '700',
  },
  driverName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
  },

  // Doctor Pulse Scene
  heartbeatContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.3,
    width: SCREEN_WIDTH,
    height: 100,
    overflow: 'hidden',
  },
  heartbeatLine: {
    position: 'absolute',
    left: 0,
  },
  pulseCenter: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.25,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EF444440',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseCenterInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EF444420',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorCardsContainer: {
    position: 'absolute',
    bottom: 180,
    width: SCREEN_WIDTH - 40,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EF444440',
  },
  doctorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EF444420',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorDetails: {
    flex: 1,
    marginLeft: 12,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
  },
  doctorRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  doctorRatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },

  // Appointment Calendar Scene
  calendarContainer: {
    width: SCREEN_WIDTH - 60,
  },
  calendarInner: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: '#EF444440',
  },
  calendarHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarMonth: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  calendarDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  calendarDayLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    width: 36,
    textAlign: 'center',
  },
  calendarDates: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  calendarDate: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDateSelected: {
    backgroundColor: '#EF4444',
  },
  calendarDateText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  calendarDateTextSelected: {
    fontWeight: '700',
  },
  appointmentTime: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF10',
  },
  appointmentTimeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  appointmentCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  appointmentConfirmed: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
});

export default ImmersiveCinematicScenes;
