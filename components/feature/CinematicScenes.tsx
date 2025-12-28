// Ultra-Sophisticated Cinematic Scenes
// Premium visual experience with scenery-like animations

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
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
import {
  SceneTiming,
  SceneColorPalettes,
  createAmbientParticles,
  animateParticles,
  createAuroraWaves,
  animateAurora,
  createGlowEffect,
  animateGlow,
  createMorphState,
  morphIn,
  type Particle,
  type AuroraWave,
  type GlowEffect,
  type MorphState,
} from '../../utils/cinematicAnimations';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Scene types for different booking flows
export type SceneType =
  | 'connecting'
  | 'locating'
  | 'parsing_intent'
  | 'map_route'
  | 'searching_flights'
  | 'comparing_prices'
  | 'selecting_option'
  | 'processing_payment'
  | 'confirmation'
  | 'searching_drivers'
  | 'driver_arriving'
  | 'finding_doctors'
  | 'checking_availability';

export interface CinematicScene {
  id: string;
  type: SceneType;
  title: string;
  subtitle?: string;
  data?: {
    origin?: { city: string; code: string; lat?: number; lng?: number };
    destination?: { city: string; code: string; lat?: number; lng?: number };
    price?: number;
    currency?: string;
    carrier?: string;
    flightNumber?: string;
    driver?: { name: string; rating: number; vehicle: string; eta: number };
    doctor?: { name: string; specialty: string };
    options?: Array<{ name: string; price: number }>;
  };
}

interface CinematicScenesProps {
  scene: CinematicScene | null;
  bookingType?: 'flight' | 'ride' | 'doctor';
  onSceneReady?: (sceneId: string, sceneType: SceneType) => void;
}

export const CinematicScenes: React.FC<CinematicScenesProps> = ({
  scene,
  bookingType = 'flight',
  onSceneReady,
}) => {
  // Master animation states
  const masterFade = useRef(new Animated.Value(0)).current;
  const masterScale = useRef(new Animated.Value(0.95)).current;
  const contentMorph = useRef(createMorphState()).current;

  // Ambient effects
  const [particles] = useState(() =>
    createAmbientParticles(25, SceneColorPalettes[bookingType]?.particles || SceneColorPalettes.flight.particles)
  );
  const [auroraWaves] = useState(() =>
    createAuroraWaves(4, SceneColorPalettes[bookingType]?.aurora || SceneColorPalettes.flight.aurora)
  );
  const [primaryGlow] = useState(createGlowEffect);
  const [secondaryGlow] = useState(createGlowEffect);

  // Scene transition state
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const sceneStartTime = useRef(Date.now());

  // Initialize ambient animations once
  useEffect(() => {
    animateParticles(particles, 25000);
    animateAurora(auroraWaves);
    animateGlow(primaryGlow).start();
    animateGlow(secondaryGlow).start();
  }, []);

  // Handle scene transitions with minimum display times
  useEffect(() => {
    if (!scene) {
      // Fade out
      Animated.parallel([
        Animated.timing(masterFade, {
          toValue: 0,
          duration: SceneTiming.transitions.fadeOut,
          easing: SceneTiming.easing.elegant,
          useNativeDriver: true,
        }),
        Animated.timing(masterScale, {
          toValue: 0.95,
          duration: SceneTiming.transitions.fadeOut,
          easing: SceneTiming.easing.gentle,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    // New scene incoming
    if (scene.id !== currentSceneId) {
      const transitionToNewScene = () => {
        setCurrentSceneId(scene.id);
        sceneStartTime.current = Date.now();

        // Reset morph state
        contentMorph.translateY.setValue(40);
        contentMorph.opacity.setValue(0);
        contentMorph.scale.setValue(0.92);

        // Elegant entrance animation
        Animated.parallel([
          // Master container
          Animated.timing(masterFade, {
            toValue: 1,
            duration: SceneTiming.transitions.fadeIn,
            easing: SceneTiming.easing.elegant,
            useNativeDriver: true,
          }),
          Animated.spring(masterScale, {
            toValue: 1,
            tension: 35,
            friction: 9,
            useNativeDriver: true,
          }),
          // Content morph
          morphIn(contentMorph, { duration: SceneTiming.transitions.morphDuration }),
        ]).start(() => {
          setIsReady(true);

          // Schedule the onSceneReady callback after minimum display time
          const minTime = SceneTiming.minDisplayTime[scene.type] || SceneTiming.minDisplayTime.default;
          setTimeout(() => {
            if (onSceneReady && scene) {
              onSceneReady(scene.id, scene.type);
            }
          }, minTime);
        });
      };

      // If there's a current scene, ensure minimum display time
      if (currentSceneId) {
        const minTime = SceneTiming.minDisplayTime[scene.type] || SceneTiming.minDisplayTime.default;
        const elapsed = Date.now() - sceneStartTime.current;
        const remaining = Math.max(0, minTime - elapsed);

        if (remaining > 0) {
          // Wait for remaining time before transitioning
          setTimeout(transitionToNewScene, remaining);
        } else {
          transitionToNewScene();
        }
      } else {
        transitionToNewScene();
      }
    }
  }, [scene?.id, currentSceneId]);

  // Get color palette based on booking type
  const colorPalette = useMemo(() => {
    return SceneColorPalettes[bookingType] || SceneColorPalettes.flight;
  }, [bookingType]);

  if (!scene) return null;

  const renderScene = () => {
    const safeData = scene?.data || {};

    switch (scene.type) {
      case 'connecting':
        return <ConnectingScene palette={colorPalette} />;
      case 'locating':
        return <LocatingScene palette={colorPalette} />;
      case 'parsing_intent':
        return <ParsingIntentScene data={safeData} palette={colorPalette} />;
      case 'map_route':
        return <MapRouteScene data={safeData} bookingType={bookingType} palette={colorPalette} />;
      case 'searching_flights':
        return <SearchingFlightsScene palette={colorPalette} />;
      case 'comparing_prices':
        return <ComparingPricesScene data={safeData} palette={colorPalette} />;
      case 'selecting_option':
        return <SelectingOptionScene data={safeData} bookingType={bookingType} palette={colorPalette} />;
      case 'processing_payment':
        return <ProcessingPaymentScene data={safeData} palette={colorPalette} />;
      case 'confirmation':
        return <ConfirmationScene data={safeData} bookingType={bookingType} palette={colorPalette} />;
      case 'searching_drivers':
        return <SearchingDriversScene palette={colorPalette} />;
      case 'driver_arriving':
        return <DriverArrivingScene data={safeData} palette={colorPalette} />;
      case 'finding_doctors':
        return <FindingDoctorsScene palette={colorPalette} />;
      case 'checking_availability':
        return <CheckingAvailabilityScene data={safeData} palette={colorPalette} />;
      default:
        return <DefaultScene title={scene.title || 'Processing...'} subtitle={scene.subtitle} palette={colorPalette} />;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: masterFade,
          transform: [{ scale: masterScale }],
        },
      ]}
    >
      {/* Deep background gradient */}
      <LinearGradient
        colors={['#050810', '#0A0E17', '#0F1520', '#0A0E17', '#050810']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Aurora/Nebula background layers */}
      <View style={styles.auroraContainer} pointerEvents="none">
        {auroraWaves.map((wave, index) => (
          <Animated.View
            key={wave.id}
            style={[
              styles.auroraWave,
              {
                backgroundColor: wave.color,
                opacity: wave.opacity,
                transform: [
                  { translateX: wave.translateX },
                  { translateY: wave.translateY },
                  { scale: wave.scale },
                  { rotate: wave.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  })},
                ],
              },
            ]}
          />
        ))}
      </View>

      {/* Ambient particles */}
      <View style={styles.particlesContainer} pointerEvents="none">
        {particles.map((particle) => (
          <Animated.View
            key={particle.id}
            style={[
              styles.particle,
              {
                width: particle.size,
                height: particle.size,
                borderRadius: particle.size / 2,
                backgroundColor: particle.color,
                opacity: particle.opacity,
                transform: [
                  { translateX: particle.x },
                  { translateY: particle.y },
                  { scale: particle.scale },
                  { rotate: particle.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  })},
                ],
              },
            ]}
          />
        ))}
      </View>

      {/* Primary glow effect */}
      <Animated.View
        style={[
          styles.primaryGlow,
          {
            backgroundColor: colorPalette.primary,
            opacity: primaryGlow.opacity,
            transform: [{ scale: primaryGlow.scale }],
          },
        ]}
        pointerEvents="none"
      />

      {/* Secondary glow effect */}
      <Animated.View
        style={[
          styles.secondaryGlow,
          {
            backgroundColor: colorPalette.secondary,
            opacity: secondaryGlow.opacity,
            transform: [{ scale: secondaryGlow.scale }],
          },
        ]}
        pointerEvents="none"
      />

      {/* Scene content with morph animation */}
      <Animated.View
        style={[
          styles.sceneContent,
          {
            opacity: contentMorph.opacity,
            transform: [
              { translateY: contentMorph.translateY },
              { scale: contentMorph.scale },
            ],
          },
        ]}
      >
        {renderScene()}
      </Animated.View>

      {/* Title overlay with blur */}
      <View style={styles.titleOverlay}>
        <BlurView intensity={40} style={styles.titleBlur}>
          <Text style={styles.sceneTitle}>{scene.title}</Text>
          {scene.subtitle && (
            <Text style={styles.sceneSubtitle}>{scene.subtitle}</Text>
          )}
        </BlurView>
      </View>

      {/* Progress indicator */}
      <SceneProgressIndicator sceneType={scene.type} startTime={sceneStartTime.current} />
    </Animated.View>
  );
};

// ============================================
// SCENE PROGRESS INDICATOR
// ============================================

const SceneProgressIndicator: React.FC<{ sceneType: SceneType; startTime: number }> = ({
  sceneType,
  startTime,
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const minTime = SceneTiming.minDisplayTime[sceneType] || SceneTiming.minDisplayTime.default;

  useEffect(() => {
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: minTime,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [sceneType, startTime]);

  return (
    <View style={styles.progressIndicator}>
      <Animated.View
        style={[
          styles.progressFill,
          {
            width: progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
};

// ============================================
// SCENE COMPONENTS
// ============================================

interface SceneProps {
  palette: typeof SceneColorPalettes.flight;
  data?: CinematicScene['data'];
}

const ConnectingScene: React.FC<{ palette: SceneProps['palette'] }> = ({ palette }) => {
  const orbitalAnims = useRef(
    Array(4).fill(0).map((_, i) => ({
      rotation: new Animated.Value(i * 90),
      pulse: new Animated.Value(1),
    }))
  ).current;
  const centralPulse = useRef(new Animated.Value(1)).current;
  const dataStreamAnims = useRef(
    Array(5).fill(0).map(() => ({
      progress: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    // Central pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(centralPulse, {
          toValue: 1.15,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(centralPulse, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Orbital rotations
    orbitalAnims.forEach((anim, index) => {
      Animated.loop(
        Animated.timing(anim.rotation, {
          toValue: anim.rotation._value + 360,
          duration: 6000 + (index * 1500),
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(anim.pulse, {
            toValue: 1.2,
            duration: 1000 + (index * 200),
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim.pulse, {
            toValue: 0.8,
            duration: 1000 + (index * 200),
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    // Data streams
    dataStreamAnims.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 400),
          Animated.parallel([
            Animated.timing(anim.progress, {
              toValue: 1,
              duration: 2500,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(anim.opacity, {
                toValue: 0.8,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.delay(1900),
              Animated.timing(anim.opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }),
            ]),
          ]),
          Animated.timing(anim.progress, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={styles.sceneInner}>
      {/* Orbital rings */}
      <View style={styles.orbitalContainer}>
        {orbitalAnims.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.orbitalRing,
              {
                width: 160 + (index * 50),
                height: 160 + (index * 50),
                borderRadius: (160 + (index * 50)) / 2,
                borderColor: palette.particles[index % palette.particles.length] + '40',
                transform: [
                  { rotate: anim.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  })},
                ],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.orbitalDot,
                {
                  backgroundColor: palette.particles[index % palette.particles.length],
                  transform: [{ scale: anim.pulse }],
                },
              ]}
            />
          </Animated.View>
        ))}

        {/* Central orb */}
        <Animated.View
          style={[
            styles.centralOrb,
            { transform: [{ scale: centralPulse }] },
          ]}
        >
          <LinearGradient
            colors={[palette.primary, palette.secondary, palette.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.centralOrbGradient}
          >
            <Ionicons name="radio" size={48} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>
      </View>

      {/* Data streams */}
      <View style={styles.dataStreamsContainer}>
        {dataStreamAnims.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.dataStream,
              {
                left: 50 + (index * (SCREEN_WIDTH - 100) / 5),
                opacity: anim.opacity,
                transform: [
                  { translateY: anim.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, SCREEN_HEIGHT],
                  })},
                ],
              },
            ]}
          >
            <LinearGradient
              colors={['transparent', palette.particles[index % palette.particles.length], 'transparent']}
              style={styles.dataStreamGradient}
            />
          </Animated.View>
        ))}
      </View>

      {/* Status text */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>Establishing secure connection</Text>
        <AnimatedEllipsis color={palette.primary} />
      </View>
    </View>
  );
};

const LocatingScene: React.FC<{ palette: SceneProps['palette'] }> = ({ palette }) => {
  const scanAnim = useRef(new Animated.Value(0)).current;
  const pinAnim = useRef(new Animated.Value(0)).current;
  const pulseRings = useRef(
    Array(3).fill(0).map(() => ({
      scale: new Animated.Value(0.5),
      opacity: new Animated.Value(0.8),
    }))
  ).current;

  useEffect(() => {
    // Radar scan
    Animated.loop(
      Animated.timing(scanAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pin bounce
    Animated.loop(
      Animated.sequence([
        Animated.timing(pinAnim, {
          toValue: -25,
          duration: 800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pinAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
      ])
    ).start();

    // Pulse rings
    pulseRings.forEach((ring, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 600),
          Animated.parallel([
            Animated.timing(ring.scale, {
              toValue: 2.5,
              duration: 2000,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(ring.opacity, {
              toValue: 0,
              duration: 2000,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(ring.scale, { toValue: 0.5, duration: 0, useNativeDriver: true }),
            Animated.timing(ring.opacity, { toValue: 0.8, duration: 0, useNativeDriver: true }),
          ]),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={styles.sceneInner}>
      {/* Grid background */}
      <View style={styles.gridContainer}>
        {Array(30).fill(0).map((_, i) => (
          <View
            key={`h-${i}`}
            style={[
              styles.gridLine,
              { top: i * 25, backgroundColor: palette.primary + '10' },
            ]}
          />
        ))}
        {Array(20).fill(0).map((_, i) => (
          <View
            key={`v-${i}`}
            style={[
              styles.gridLineVertical,
              { left: i * 25, backgroundColor: palette.primary + '10' },
            ]}
          />
        ))}
      </View>

      {/* Radar container */}
      <View style={styles.radarContainer}>
        {/* Radar circles */}
        {[100, 160, 220].map((size, index) => (
          <View
            key={index}
            style={[
              styles.radarCircle,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderColor: palette.primary + '30',
              },
            ]}
          />
        ))}

        {/* Pulse rings */}
        {pulseRings.map((ring, index) => (
          <Animated.View
            key={index}
            style={[
              styles.pulseRing,
              {
                borderColor: palette.primary,
                opacity: ring.opacity,
                transform: [{ scale: ring.scale }],
              },
            ]}
          />
        ))}

        {/* Radar sweep */}
        <Animated.View
          style={[
            styles.radarSweep,
            {
              transform: [
                { rotate: scanAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                })},
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['transparent', palette.primary + '60', palette.primary]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.radarSweepGradient}
          />
        </Animated.View>

        {/* Location pin */}
        <Animated.View
          style={[
            styles.locationPin,
            { transform: [{ translateY: pinAnim }] },
          ]}
        >
          <View style={[styles.pinHead, { backgroundColor: palette.primary }]}>
            <Ionicons name="location" size={36} color="#FFFFFF" />
          </View>
          <View style={[styles.pinShadow, { backgroundColor: palette.primary + '40' }]} />
        </Animated.View>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>Detecting your location</Text>
        <AnimatedEllipsis color={palette.primary} />
      </View>
    </View>
  );
};

const ParsingIntentScene: React.FC<SceneProps> = ({ data, palette }) => {
  const wordAnims = useRef<Animated.Value[]>([]).current;
  const sparkleAnims = useRef(
    Array(8).fill(0).map(() => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
      x: new Animated.Value(0),
      y: new Animated.Value(0),
    }))
  ).current;
  const brainPulse = useRef(new Animated.Value(1)).current;

  const words = useMemo(() => {
    const originCity = data?.origin?.city;
    const destCity = data?.destination?.city;

    if (originCity && destCity) {
      return [
        { text: 'Flying from', highlight: false },
        { text: originCity, highlight: true },
        { text: 'to', highlight: false },
        { text: destCity, highlight: true },
      ];
    }
    return [
      { text: 'Analyzing', highlight: false },
      { text: 'your', highlight: false },
      { text: 'travel', highlight: true },
      { text: 'request', highlight: true },
    ];
  }, [data?.origin?.city, data?.destination?.city]);

  // Initialize word animations
  if (wordAnims.length !== words.length) {
    wordAnims.length = 0;
    words.forEach(() => wordAnims.push(new Animated.Value(0)));
  }

  useEffect(() => {
    // Brain pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(brainPulse, {
          toValue: 1.2,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(brainPulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Staggered word reveal
    Animated.stagger(
      250,
      wordAnims.map((anim) =>
        Animated.spring(anim, {
          toValue: 1,
          tension: 50,
          friction: 10,
          useNativeDriver: true,
        })
      )
    ).start();

    // Sparkles
    sparkleAnims.forEach((anim, index) => {
      const angle = (index / sparkleAnims.length) * Math.PI * 2;
      const radius = 80 + Math.random() * 40;

      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 300),
          Animated.parallel([
            Animated.sequence([
              Animated.timing(anim.scale, {
                toValue: 1,
                duration: 400,
                easing: Easing.out(Easing.back(2)),
                useNativeDriver: true,
              }),
              Animated.timing(anim.scale, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(anim.opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
              Animated.delay(400),
              Animated.timing(anim.opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]),
            Animated.timing(anim.x, {
              toValue: Math.cos(angle) * radius,
              duration: 800,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(anim.y, {
              toValue: Math.sin(angle) * radius,
              duration: 800,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(anim.x, { toValue: 0, duration: 0, useNativeDriver: true }),
            Animated.timing(anim.y, { toValue: 0, duration: 0, useNativeDriver: true }),
          ]),
          Animated.delay(1500),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={styles.sceneInner}>
      {/* Brain/AI icon with sparkles */}
      <View style={styles.brainContainer}>
        <Animated.View
          style={[
            styles.brainCircle,
            {
              backgroundColor: palette.primary + '20',
              transform: [{ scale: brainPulse }],
            },
          ]}
        >
          <Ionicons name="sparkles" size={64} color={palette.primary} />
        </Animated.View>

        {/* Sparkles */}
        {sparkleAnims.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.sparkle,
              {
                backgroundColor: palette.particles[index % palette.particles.length],
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

      {/* Animated text reveal */}
      <View style={styles.parsingTextContainer}>
        {words.map((word, index) => (
          <Animated.Text
            key={index}
            style={[
              styles.parsingWord,
              word.highlight && [styles.parsingWordHighlight, { color: palette.primary }],
              {
                opacity: wordAnims[index],
                transform: [
                  {
                    translateY: wordAnims[index]?.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }) || 0,
                  },
                  {
                    scale: wordAnims[index]?.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }) || 1,
                  },
                ],
              },
            ]}
          >
            {word.text}{' '}
          </Animated.Text>
        ))}
      </View>
    </View>
  );
};

const MapRouteScene: React.FC<SceneProps & { bookingType: string }> = ({
  data,
  bookingType,
  palette,
}) => {
  const routeProgress = useRef(new Animated.Value(0)).current;
  const vehicleProgress = useRef(new Animated.Value(0)).current;
  const zoomAnim = useRef(new Animated.Value(0.85)).current;
  const originPulse = useRef(new Animated.Value(1)).current;
  const destPulse = useRef(new Animated.Value(1)).current;

  const originCity = data?.origin?.city || 'Current Location';
  const originCode = data?.origin?.code || 'HERE';
  const destCity = data?.destination?.city || 'Destination';
  const destCode = data?.destination?.code || 'DEST';

  useEffect(() => {
    // Zoom in
    Animated.spring(zoomAnim, {
      toValue: 1,
      tension: 30,
      friction: 10,
      useNativeDriver: true,
    }).start();

    // Route draw
    Animated.timing(routeProgress, {
      toValue: 1,
      duration: 2500,
      delay: 500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();

    // Vehicle movement
    Animated.loop(
      Animated.timing(vehicleProgress, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Location pulses
    Animated.loop(
      Animated.sequence([
        Animated.timing(originPulse, { toValue: 1.2, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(originPulse, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(500),
        Animated.timing(destPulse, { toValue: 1.2, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(destPulse, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const vehicleX = vehicleProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [40, SCREEN_WIDTH - 100],
  });

  const vehicleY = vehicleProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -60, 0],
  });

  return (
    <Animated.View style={[styles.sceneInner, { transform: [{ scale: zoomAnim }] }]}>
      {/* Map grid */}
      <View style={styles.mapGrid}>
        {Array(40).fill(0).map((_, i) => (
          <View key={i} style={[styles.mapGridLine, { top: i * 20, backgroundColor: '#FFFFFF08' }]} />
        ))}
      </View>

      {/* Route visualization */}
      <View style={styles.routeVisualization}>
        {/* Origin marker */}
        <Animated.View style={[styles.mapMarker, { transform: [{ scale: originPulse }] }]}>
          <View style={[styles.markerGlow, { backgroundColor: '#10B981' + '40' }]} />
          <View style={[styles.markerPin, { backgroundColor: '#10B981' }]}>
            <Ionicons name="location" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.markerCode}>{originCode}</Text>
          <Text style={styles.markerCity}>{originCity}</Text>
        </Animated.View>

        {/* Route line */}
        <View style={styles.routeLineContainer}>
          <View style={styles.routeLineBackground} />
          <Animated.View
            style={[
              styles.routeLineFill,
              {
                backgroundColor: palette.primary,
                width: routeProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />

          {/* Route dashes */}
          {Array(12).fill(0).map((_, i) => (
            <View key={i} style={[styles.routeDash, { left: `${(i / 12) * 100}%` }]} />
          ))}
        </View>

        {/* Moving vehicle */}
        <Animated.View
          style={[
            styles.movingVehicle,
            {
              transform: [
                { translateX: vehicleX },
                { translateY: vehicleY },
              ],
            },
          ]}
        >
          <View style={[styles.vehicleContainer, { backgroundColor: palette.primary }]}>
            <Ionicons
              name={bookingType === 'ride' ? 'car' : 'airplane'}
              size={22}
              color="#FFFFFF"
            />
          </View>
          <View style={[styles.vehicleTrail, { backgroundColor: palette.primary + '40' }]} />
        </Animated.View>

        {/* Destination marker */}
        <Animated.View style={[styles.mapMarker, styles.destMarker, { transform: [{ scale: destPulse }] }]}>
          <View style={[styles.markerGlow, { backgroundColor: '#EF4444' + '40' }]} />
          <View style={[styles.markerPin, { backgroundColor: '#EF4444' }]}>
            <Ionicons name="flag" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.markerCode}>{destCode}</Text>
          <Text style={styles.markerCity}>{destCity}</Text>
        </Animated.View>
      </View>

      {/* Route info card */}
      <View style={styles.routeInfoCard}>
        <LinearGradient
          colors={['#1E253020', '#1E253080']}
          style={styles.routeInfoGradient}
        >
          <View style={styles.routeInfoRow}>
            <View style={styles.routeInfoItem}>
              <Text style={styles.routeInfoLabel}>From</Text>
              <Text style={styles.routeInfoValue}>{originCity}</Text>
            </View>
            <View style={styles.routeInfoArrow}>
              <Ionicons name="arrow-forward" size={24} color={palette.primary} />
            </View>
            <View style={styles.routeInfoItem}>
              <Text style={styles.routeInfoLabel}>To</Text>
              <Text style={styles.routeInfoValue}>{destCity}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    </Animated.View>
  );
};

const SearchingFlightsScene: React.FC<{ palette: SceneProps['palette'] }> = ({ palette }) => {
  const planeAnims = useRef(
    Array(6).fill(0).map((_, i) => ({
      x: new Animated.Value(-100),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.8 + Math.random() * 0.4),
    }))
  ).current;
  const radarSpin = useRef(new Animated.Value(0)).current;
  const countAnim = useRef(new Animated.Value(0)).current;
  const [displayCount, setDisplayCount] = useState(0);

  useEffect(() => {
    // Radar spin
    Animated.loop(
      Animated.timing(radarSpin, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Flying planes
    planeAnims.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 500),
          Animated.parallel([
            Animated.timing(anim.x, {
              toValue: SCREEN_WIDTH + 100,
              duration: 3000 + Math.random() * 1500,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(anim.opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
              Animated.delay(2200),
              Animated.timing(anim.opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
            ]),
          ]),
          Animated.timing(anim.x, { toValue: -100, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    });

    // Count animation
    const countInterval = setInterval(() => {
      setDisplayCount(prev => {
        const next = prev + Math.floor(Math.random() * 30) + 10;
        return next > 500 ? Math.floor(Math.random() * 50) + 450 : next;
      });
    }, 200);

    return () => clearInterval(countInterval);
  }, []);

  return (
    <View style={styles.sceneInner}>
      {/* Sky gradient */}
      <LinearGradient
        colors={['#0A0E17', '#1E3A5F20', '#0A0E17']}
        style={StyleSheet.absoluteFill}
      />

      {/* Flying planes */}
      {planeAnims.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.flyingPlane,
            {
              top: 80 + (index * 70),
              opacity: anim.opacity,
              transform: [
                { translateX: anim.x },
                { scale: anim.scale },
              ],
            },
          ]}
        >
          <Ionicons name="airplane" size={28} color={palette.particles[index % palette.particles.length]} />
          <View style={[styles.planeTrail, { backgroundColor: palette.particles[index % palette.particles.length] + '40' }]} />
        </Animated.View>
      ))}

      {/* Radar */}
      <View style={styles.searchRadar}>
        <View style={[styles.radarRing, { borderColor: palette.primary + '20' }]} />
        <View style={[styles.radarRing, styles.radarRingMd, { borderColor: palette.primary + '15' }]} />
        <View style={[styles.radarRing, styles.radarRingLg, { borderColor: palette.primary + '10' }]} />

        <Animated.View
          style={[
            styles.radarBeam,
            {
              transform: [
                { rotate: radarSpin.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                })},
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['transparent', palette.primary + '60']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.radarBeamGradient}
          />
        </Animated.View>

        <View style={[styles.radarCenter, { backgroundColor: palette.primary }]}>
          <Ionicons name="search" size={24} color="#FFFFFF" />
        </View>
      </View>

      {/* Search count */}
      <View style={styles.searchCountContainer}>
        <Text style={[styles.searchCount, { color: palette.primary }]}>{displayCount}+</Text>
        <Text style={styles.searchCountLabel}>flights found</Text>
      </View>
    </View>
  );
};

const ComparingPricesScene: React.FC<SceneProps> = ({ data, palette }) => {
  const barAnims = useRef(
    Array(5).fill(0).map(() => new Animated.Value(0))
  ).current;
  const highlightAnim = useRef(new Animated.Value(0)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  const prices = useMemo(() => [
    { name: 'United', price: 450, color: '#3B82F6' },
    { name: 'Delta', price: 380, color: '#10B981' },
    { name: 'American', price: 520, color: '#EF4444' },
    { name: 'JetBlue', price: 410, color: '#06B6D4' },
    { name: 'Southwest', price: 340, color: '#F59E0B' },
  ], []);

  const maxPrice = Math.max(...prices.map(p => p.price));
  const bestIndex = prices.findIndex(p => p.price === Math.min(...prices.map(p => p.price)));

  useEffect(() => {
    // Staggered bar growth
    Animated.stagger(
      150,
      barAnims.map((anim, index) =>
        Animated.spring(anim, {
          toValue: prices[index].price / maxPrice,
          tension: 40,
          friction: 8,
          useNativeDriver: false,
        })
      )
    ).start();

    // Highlight best price
    Animated.sequence([
      Animated.delay(1500),
      Animated.parallel([
        Animated.loop(
          Animated.sequence([
            Animated.timing(highlightAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(highlightAnim, { toValue: 0.6, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          ])
        ),
        Animated.spring(checkAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.sceneInner}>
      {/* Price chart */}
      <View style={styles.priceChart}>
        {prices.map((item, index) => (
          <View key={index} style={styles.priceBarWrapper}>
            <Text style={styles.priceAmount}>${item.price}</Text>
            <View style={styles.priceBarTrack}>
              <Animated.View
                style={[
                  styles.priceBarFill,
                  {
                    backgroundColor: item.color,
                    height: barAnims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
              {index === bestIndex && (
                <Animated.View
                  style={[
                    styles.bestIndicator,
                    {
                      opacity: highlightAnim,
                      transform: [{ scale: checkAnim }],
                    },
                  ]}
                >
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                </Animated.View>
              )}
            </View>
            <Text style={styles.priceAirline}>{item.name}</Text>
          </View>
        ))}
      </View>

      {/* Best value badge */}
      <Animated.View
        style={[
          styles.bestValueBadge,
          {
            opacity: checkAnim,
            transform: [
              {
                translateY: checkAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Ionicons name="trophy" size={24} color="#F59E0B" />
        <Text style={styles.bestValueText}>Best Value: Southwest $340</Text>
      </Animated.View>
    </View>
  );
};

const SelectingOptionScene: React.FC<SceneProps & { bookingType: string }> = ({
  data,
  bookingType,
  palette,
}) => {
  const cardAnim = useRef(new Animated.Value(0)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(
    Array(15).fill(0).map(() => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      rotation: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    // Card entrance
    Animated.sequence([
      Animated.spring(cardAnim, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.delay(400),
      Animated.parallel([
        Animated.spring(checkAnim, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(glowAnim, { toValue: 0.5, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          ])
        ),
      ]),
    ]).start();

    // Confetti burst after check
    setTimeout(() => {
      confettiAnims.forEach((anim, index) => {
        const angle = (index / confettiAnims.length) * Math.PI * 2;
        const distance = 100 + Math.random() * 100;

        Animated.parallel([
          Animated.timing(anim.x, {
            toValue: Math.cos(angle) * distance,
            duration: 800,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim.y, {
            toValue: Math.sin(angle) * distance + 50,
            duration: 800,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(anim.opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
            Animated.delay(500),
            Animated.timing(anim.opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          ]),
          Animated.timing(anim.rotation, {
            toValue: Math.random() * 720,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 800);
  }, []);

  return (
    <View style={styles.sceneInner}>
      {/* Confetti */}
      {confettiAnims.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.confetti,
            {
              backgroundColor: palette.particles[index % palette.particles.length],
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
            opacity: cardAnim,
            transform: [
              {
                scale: cardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.85, 1],
                }),
              },
            ],
          },
        ]}
      >
        {/* Glow effect */}
        <Animated.View
          style={[
            styles.cardGlow,
            {
              backgroundColor: '#10B981',
              opacity: glowAnim.interpolate({
                inputRange: [0.5, 1],
                outputRange: [0.2, 0.5],
              }),
            },
          ]}
        />

        <LinearGradient
          colors={['#1E2530', '#252D3A']}
          style={styles.selectedCardInner}
        >
          <View style={styles.selectedCardHeader}>
            <Ionicons
              name={bookingType === 'ride' ? 'car' : bookingType === 'doctor' ? 'medkit' : 'airplane'}
              size={36}
              color={palette.primary}
            />
            <View>
              <Text style={styles.selectedCardTitle}>{data?.carrier || 'Best Option'}</Text>
              <Text style={styles.selectedCardSub}>{data?.flightNumber || 'Premium Selection'}</Text>
            </View>
          </View>

          <View style={styles.selectedCardBody}>
            <Text style={styles.selectedCardPrice}>
              {data?.currency || '$'}{data?.price || '340'}
            </Text>
            <Text style={styles.selectedCardLabel}>Total Price</Text>
          </View>

          {/* Check mark */}
          <Animated.View
            style={[
              styles.selectedCheck,
              {
                transform: [{ scale: checkAnim }],
                opacity: checkAnim,
              },
            ]}
          >
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={32} color="#FFFFFF" />
            </View>
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      <Text style={styles.selectedText}>Option Selected!</Text>
    </View>
  );
};

const ProcessingPaymentScene: React.FC<SceneProps> = ({ data, palette }) => {
  const cardAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const lockAnim = useRef(new Animated.Value(0)).current;
  const [statusText, setStatusText] = useState('Initializing...');

  useEffect(() => {
    // Card flip in
    Animated.spring(cardAnim, {
      toValue: 1,
      tension: 40,
      friction: 10,
      useNativeDriver: true,
    }).start();

    // Shimmer
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Progress
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 4000,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();

    // Lock animation
    Animated.sequence([
      Animated.delay(1500),
      Animated.spring(lockAnim, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }),
    ]).start();

    // Status updates
    const statuses = [
      { text: 'Validating card...', delay: 500 },
      { text: 'Encrypting data...', delay: 1500 },
      { text: 'Processing payment...', delay: 2500 },
      { text: 'Confirming transaction...', delay: 3500 },
    ];

    statuses.forEach(({ text, delay }) => {
      setTimeout(() => setStatusText(text), delay);
    });
  }, []);

  return (
    <View style={styles.sceneInner}>
      {/* Payment card */}
      <Animated.View
        style={[
          styles.paymentCard,
          {
            transform: [
              {
                rotateY: cardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['90deg', '0deg'],
                }),
              },
              { perspective: 1000 },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['#1E3A5F', '#2D5A87', '#1E3A5F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.paymentCardGradient}
        >
          <View style={styles.cardChipArea}>
            <View style={styles.cardChip} />
            <Ionicons name="wifi" size={20} color="#FFFFFF60" style={{ transform: [{ rotate: '90deg' }] }} />
          </View>

          <Text style={styles.cardNumber}>{'\u2022\u2022\u2022\u2022  \u2022\u2022\u2022\u2022  \u2022\u2022\u2022\u2022  4242'}</Text>

          <View style={styles.cardBottom}>
            <View>
              <Text style={styles.cardLabel}>CARDHOLDER</Text>
              <Text style={styles.cardValue}>ATLAS USER</Text>
            </View>
            <View>
              <Text style={styles.cardLabel}>EXPIRES</Text>
              <Text style={styles.cardValue}>12/26</Text>
            </View>
          </View>

          {/* Shimmer */}
          <Animated.View
            style={[
              styles.cardShimmer,
              {
                transform: [
                  {
                    translateX: shimmerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-300, 300],
                    }),
                  },
                ],
              },
            ]}
          />
        </LinearGradient>
      </Animated.View>

      {/* Progress bar */}
      <View style={styles.paymentProgress}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFillAnimated,
              {
                backgroundColor: '#10B981',
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.paymentStatus}>{statusText}</Text>
      </View>

      {/* Secure indicator */}
      <Animated.View
        style={[
          styles.secureIndicator,
          {
            opacity: lockAnim,
            transform: [{ scale: lockAnim }],
          },
        ]}
      >
        <Ionicons name="shield-checkmark" size={24} color="#10B981" />
        <Text style={styles.secureText}>256-bit SSL Encrypted</Text>
      </Animated.View>

      {/* Amount */}
      <Text style={styles.paymentAmount}>${data?.price || '340'}.00</Text>
    </View>
  );
};

const ConfirmationScene: React.FC<SceneProps & { bookingType: string }> = ({
  data,
  bookingType,
  palette,
}) => {
  const checkScale = useRef(new Animated.Value(0)).current;
  const ringAnims = useRef(
    Array(3).fill(0).map(() => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;
  const confettiAnims = useRef(
    Array(30).fill(0).map(() => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(1),
      scale: new Animated.Value(1),
    }))
  ).current;
  const textAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Check mark spring
    Animated.spring(checkScale, {
      toValue: 1,
      tension: 50,
      friction: 5,
      useNativeDriver: true,
    }).start();

    // Expanding rings
    ringAnims.forEach((ring, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 400),
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
            Animated.timing(ring.scale, { toValue: 0, duration: 0, useNativeDriver: true }),
            Animated.timing(ring.opacity, { toValue: 1, duration: 0, useNativeDriver: true }),
          ]),
        ])
      ).start();
    });

    // Confetti explosion
    confettiAnims.forEach((anim, index) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 150 + Math.random() * 150;
      const duration = 1200 + Math.random() * 400;

      Animated.parallel([
        Animated.timing(anim.x, {
          toValue: Math.cos(angle) * distance,
          duration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(anim.y, {
          toValue: Math.sin(angle) * distance + 100,
          duration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(anim.rotation, {
          toValue: Math.random() * 1080,
          duration,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(duration * 0.6),
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: duration * 0.4,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(duration * 0.3),
          Animated.timing(anim.scale, {
            toValue: 0,
            duration: duration * 0.7,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });

    // Text fade in
    Animated.sequence([
      Animated.delay(500),
      Animated.spring(textAnim, { toValue: 1, tension: 40, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const confettiColors = ['#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4'];

  return (
    <View style={styles.sceneInner}>
      {/* Confetti */}
      {confettiAnims.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.confirmConfetti,
            {
              backgroundColor: confettiColors[index % confettiColors.length],
              width: 8 + Math.random() * 8,
              height: 8 + Math.random() * 8,
              borderRadius: Math.random() > 0.5 ? 100 : 2,
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
      {ringAnims.map((ring, index) => (
        <Animated.View
          key={index}
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

      {/* Success check */}
      <Animated.View
        style={[
          styles.successCheck,
          { transform: [{ scale: checkScale }] },
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
            opacity: textAnim,
            transform: [
              {
                translateY: textAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.successTitle}>Booking Confirmed!</Text>
        <Text style={styles.successSubtitle}>
          {bookingType === 'ride'
            ? 'Your ride is on the way'
            : bookingType === 'doctor'
            ? 'Your appointment is scheduled'
            : 'Your trip has been booked'}
        </Text>
      </Animated.View>
    </View>
  );
};

// Stub implementations for remaining scenes
const SearchingDriversScene: React.FC<{ palette: SceneProps['palette'] }> = ({ palette }) => (
  <DefaultScene title="Finding Drivers" subtitle="Searching nearby..." palette={palette} />
);

const DriverArrivingScene: React.FC<SceneProps> = ({ data, palette }) => (
  <DefaultScene title="Driver On The Way" subtitle={`ETA: ${data?.driver?.eta || 3} min`} palette={palette} />
);

const FindingDoctorsScene: React.FC<{ palette: SceneProps['palette'] }> = ({ palette }) => (
  <DefaultScene title="Finding Specialists" subtitle="Searching qualified doctors..." palette={palette} />
);

const CheckingAvailabilityScene: React.FC<SceneProps> = ({ data, palette }) => (
  <DefaultScene title="Checking Availability" subtitle="Finding open slots..." palette={palette} />
);

const DefaultScene: React.FC<{ title: string; subtitle?: string; palette: SceneProps['palette'] }> = ({
  title,
  subtitle,
  palette,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  return (
    <View style={styles.sceneInner}>
      <View style={styles.defaultIconContainer}>
        <Animated.View
          style={[
            styles.defaultIconRing,
            {
              borderColor: palette.primary + '40',
              transform: [
                { rotate: rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.defaultIconCircle,
            {
              backgroundColor: palette.primary + '20',
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Ionicons name="sparkles" size={48} color={palette.primary} />
        </Animated.View>
      </View>
      <Text style={styles.defaultTitle}>{title}</Text>
      {subtitle && <Text style={styles.defaultSubtitle}>{subtitle}</Text>}
    </View>
  );
};

// ============================================
// ANIMATED ELLIPSIS
// ============================================

const AnimatedEllipsis: React.FC<{ color: string }> = ({ color }) => {
  const dots = useRef([
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3),
  ]).current;

  useEffect(() => {
    Animated.loop(
      Animated.stagger(200, [
        Animated.sequence([
          Animated.timing(dots[0], { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dots[0], { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(dots[1], { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dots[1], { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(dots[2], { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dots[2], { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.ellipsisContainer}>
      {dots.map((dot, index) => (
        <Animated.View
          key={index}
          style={[
            styles.ellipsisDot,
            { backgroundColor: color, opacity: dot },
          ]}
        />
      ))}
    </View>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E17',
    overflow: 'hidden',
  },

  // Ambient effects
  auroraContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  auroraWave: {
    position: 'absolute',
    width: SCREEN_WIDTH * 2,
    height: SCREEN_HEIGHT * 0.8,
    borderRadius: SCREEN_WIDTH,
    top: -SCREEN_HEIGHT * 0.2,
    left: -SCREEN_WIDTH * 0.5,
  },
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  particle: {
    position: 'absolute',
  },
  primaryGlow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    top: SCREEN_HEIGHT * 0.2,
    left: SCREEN_WIDTH * 0.5 - 150,
    opacity: 0.3,
  },
  secondaryGlow: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    bottom: SCREEN_HEIGHT * 0.25,
    right: -50,
    opacity: 0.25,
  },

  // Scene content
  sceneContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sceneInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: Spacing.lg,
  },

  // Title overlay
  titleOverlay: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  titleBlur: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    alignItems: 'center',
  },
  sceneTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  sceneSubtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },

  // Progress indicator
  progressIndicator: {
    position: 'absolute',
    bottom: 40,
    left: Spacing.xl,
    right: Spacing.xl,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 2,
  },

  // Connecting scene
  orbitalContainer: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbitalRing: {
    position: 'absolute',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 4,
  },
  orbitalDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  centralOrb: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  centralOrbGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dataStreamsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dataStream: {
    position: 'absolute',
    width: 2,
    height: 80,
  },
  dataStreamGradient: {
    flex: 1,
    width: '100%',
  },
  statusContainer: {
    position: 'absolute',
    bottom: 180,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
  },
  ellipsisContainer: {
    flexDirection: 'row',
    marginLeft: 4,
  },
  ellipsisDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },

  // Locating scene
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
  },
  radarContainer: {
    width: 260,
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarCircle: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  pulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
  },
  radarSweep: {
    position: 'absolute',
    width: 130,
    height: 130,
  },
  radarSweepGradient: {
    width: 130,
    height: 4,
    position: 'absolute',
    top: 63,
    left: 0,
  },
  locationPin: {
    alignItems: 'center',
  },
  pinHead: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinShadow: {
    width: 30,
    height: 10,
    borderRadius: 15,
    marginTop: -5,
  },

  // Parsing intent scene
  brainContainer: {
    marginBottom: Spacing.xl,
  },
  brainCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  parsingTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    maxWidth: 350,
  },
  parsingWord: {
    fontSize: Typography.sizes.xl,
    color: Colors.text.secondary,
    lineHeight: Typography.sizes.xl * 1.5,
  },
  parsingWordHighlight: {
    fontWeight: '700',
  },

  // Map route scene
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
  },
  mapGridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  routeVisualization: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  mapMarker: {
    alignItems: 'center',
  },
  destMarker: {},
  markerGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  markerPin: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  markerCode: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  markerCity: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  routeLineContainer: {
    flex: 1,
    height: 6,
    marginHorizontal: Spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  routeLineBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  routeLineFill: {
    height: '100%',
    borderRadius: 3,
  },
  routeDash: {
    position: 'absolute',
    width: 12,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1,
    top: 2,
  },
  movingVehicle: {
    position: 'absolute',
    top: -50,
    left: 0,
  },
  vehicleContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleTrail: {
    position: 'absolute',
    width: 60,
    height: 3,
    borderRadius: 2,
    left: -55,
    top: 20,
  },
  routeInfoCard: {
    position: 'absolute',
    bottom: 200,
    left: Spacing.lg,
    right: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  routeInfoGradient: {
    padding: Spacing.lg,
  },
  routeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routeInfoItem: {
    flex: 1,
  },
  routeInfoArrow: {
    paddingHorizontal: Spacing.md,
  },
  routeInfoLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.tertiary,
    marginBottom: 2,
  },
  routeInfoValue: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  // Searching flights scene
  flyingPlane: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  planeTrail: {
    width: 60,
    height: 3,
    marginLeft: -25,
    borderRadius: 2,
  },
  searchRadar: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  radarRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
  },
  radarRingMd: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  radarRingLg: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  radarBeam: {
    position: 'absolute',
    width: 100,
    height: 100,
  },
  radarBeamGradient: {
    width: 100,
    height: 3,
    position: 'absolute',
    top: 48.5,
    left: 0,
  },
  radarCenter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchCountContainer: {
    alignItems: 'center',
  },
  searchCount: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: '800',
  },
  searchCountLabel: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },

  // Comparing prices scene
  priceChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.md,
    height: 220,
    marginBottom: Spacing.xl,
  },
  priceBarWrapper: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  priceAmount: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  priceBarTrack: {
    width: '100%',
    height: 160,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  priceBarFill: {
    width: '100%',
    borderTopLeftRadius: BorderRadius.sm,
    borderTopRightRadius: BorderRadius.sm,
  },
  bestIndicator: {
    position: 'absolute',
    top: -30,
    alignSelf: 'center',
  },
  priceAirline: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.tertiary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  bestValueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  bestValueText: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: '#F59E0B',
  },

  // Selecting option scene
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
  },
  selectedCard: {
    width: '90%',
    maxWidth: 320,
    marginBottom: Spacing.xl,
  },
  cardGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: BorderRadius.xl + 20,
  },
  selectedCardInner: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  selectedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  selectedCardTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  selectedCardSub: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.tertiary,
  },
  selectedCardBody: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  selectedCardPrice: {
    fontSize: Typography.sizes['4xl'],
    fontWeight: '800',
    color: '#10B981',
  },
  selectedCardLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
  },
  selectedCheck: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
  },
  checkCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    fontSize: Typography.sizes.xl,
    fontWeight: '600',
    color: '#10B981',
  },

  // Payment scene
  paymentCard: {
    width: 300,
    height: 180,
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  paymentCardGradient: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'space-between',
  },
  cardChipArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardChip: {
    width: 45,
    height: 32,
    backgroundColor: '#D4AF37',
    borderRadius: 4,
  },
  cardNumber: {
    fontSize: Typography.sizes.lg,
    color: Colors.text.primary,
    letterSpacing: 3,
    fontFamily: 'monospace',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: Typography.sizes.xs,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 2,
  },
  cardValue: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  cardShimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 150,
    backgroundColor: 'rgba(255,255,255,0.1)',
    transform: [{ skewX: '-20deg' }],
  },
  paymentProgress: {
    width: '80%',
    marginBottom: Spacing.lg,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFillAnimated: {
    height: '100%',
    borderRadius: 3,
  },
  paymentStatus: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  secureIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  secureText: {
    fontSize: Typography.sizes.sm,
    color: '#10B981',
  },
  paymentAmount: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: '800',
    color: Colors.text.primary,
  },

  // Confirmation scene
  confirmConfetti: {
    position: 'absolute',
  },
  successRing: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
  },
  successCheck: {
    width: 160,
    height: 160,
    borderRadius: 80,
    marginBottom: Spacing.xl,
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
    fontSize: Typography.sizes['2xl'],
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  successSubtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    textAlign: 'center',
  },

  // Default scene
  defaultIconContainer: {
    marginBottom: Spacing.xl,
  },
  defaultIconRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderStyle: 'dashed',
    top: -20,
    left: -20,
  },
  defaultIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  defaultSubtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});

export default CinematicScenes;
