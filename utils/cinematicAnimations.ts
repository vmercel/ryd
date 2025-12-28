// Sophisticated Cinematic Animation Utilities
// Ultra-premium visual effects system

import { Animated, Easing, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================
// TIMING CONFIGURATION
// ============================================

export const SceneTiming = {
  // Minimum display times per scene type (in ms)
  // Ensures users can read and absorb the content
  minDisplayTime: {
    connecting: 3000,
    locating: 3500,
    parsing_intent: 4000,
    map_route: 5000,
    searching_flights: 4500,
    comparing_prices: 5000,
    selecting_option: 4000,
    processing_payment: 4500,
    confirmation: 5000,
    searching_drivers: 4000,
    driver_arriving: 4000,
    finding_doctors: 4000,
    checking_availability: 4500,
    default: 3500,
  } as Record<string, number>,

  // Transition durations
  transitions: {
    fadeIn: 800,
    fadeOut: 600,
    crossfade: 1000,
    morphDuration: 1200,
    staggerDelay: 100,
  },

  // Animation curves
  easing: {
    smooth: Easing.bezier(0.25, 0.1, 0.25, 1),
    dramatic: Easing.bezier(0.68, -0.55, 0.265, 1.55),
    elegant: Easing.bezier(0.4, 0, 0.2, 1),
    bounce: Easing.bezier(0.68, -0.6, 0.32, 1.6),
    gentle: Easing.bezier(0.25, 0.46, 0.45, 0.94),
  },
};

// ============================================
// PARALLAX LAYER SYSTEM
// ============================================

export interface ParallaxLayer {
  id: string;
  depth: number; // 0 = closest, 1 = furthest
  opacity: number;
  scale: number;
  blur?: number;
}

export const createParallaxLayers = (count: number = 5): ParallaxLayer[] => {
  return Array(count).fill(0).map((_, i) => ({
    id: `layer-${i}`,
    depth: i / (count - 1),
    opacity: 1 - (i * 0.15),
    scale: 1 + (i * 0.1),
    blur: i * 2,
  }));
};

// ============================================
// PARTICLE SYSTEM
// ============================================

export interface Particle {
  id: string;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  rotation: Animated.Value;
  color: string;
  size: number;
  type: 'circle' | 'star' | 'sparkle' | 'glow';
}

export const createAmbientParticles = (count: number, colors: string[]): Particle[] => {
  return Array(count).fill(0).map((_, i) => ({
    id: `particle-${i}`,
    x: new Animated.Value(Math.random() * SCREEN_WIDTH),
    y: new Animated.Value(Math.random() * SCREEN_HEIGHT),
    opacity: new Animated.Value(Math.random() * 0.6 + 0.2),
    scale: new Animated.Value(Math.random() * 0.5 + 0.5),
    rotation: new Animated.Value(0),
    color: colors[i % colors.length],
    size: Math.random() * 8 + 4,
    type: ['circle', 'star', 'sparkle', 'glow'][i % 4] as Particle['type'],
  }));
};

export const animateParticles = (particles: Particle[], duration: number = 20000) => {
  particles.forEach((particle, index) => {
    // Floating animation
    Animated.loop(
      Animated.parallel([
        // Gentle drift X
        Animated.sequence([
          Animated.timing(particle.x, {
            toValue: Math.random() * SCREEN_WIDTH,
            duration: duration + (index * 500),
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(particle.x, {
            toValue: Math.random() * SCREEN_WIDTH,
            duration: duration + (index * 500),
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        // Gentle drift Y
        Animated.sequence([
          Animated.timing(particle.y, {
            toValue: Math.random() * SCREEN_HEIGHT,
            duration: duration + (index * 300),
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(particle.y, {
            toValue: Math.random() * SCREEN_HEIGHT,
            duration: duration + (index * 300),
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        // Opacity pulse
        Animated.sequence([
          Animated.timing(particle.opacity, {
            toValue: Math.random() * 0.4 + 0.1,
            duration: 3000 + (index * 200),
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(particle.opacity, {
            toValue: Math.random() * 0.6 + 0.2,
            duration: 3000 + (index * 200),
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        // Gentle rotation
        Animated.timing(particle.rotation, {
          toValue: 360,
          duration: 30000 + (index * 1000),
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  });
};

// ============================================
// AURORA / NEBULA BACKGROUND
// ============================================

export interface AuroraWave {
  id: string;
  translateX: Animated.Value;
  translateY: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  rotation: Animated.Value;
  color: string;
}

export const createAuroraWaves = (count: number = 3, baseColor: string): AuroraWave[] => {
  const colors = generateColorVariations(baseColor, count);
  return colors.map((color, i) => ({
    id: `aurora-${i}`,
    translateX: new Animated.Value(0),
    translateY: new Animated.Value(0),
    scale: new Animated.Value(1),
    opacity: new Animated.Value(0.3 - (i * 0.05)),
    rotation: new Animated.Value(0),
    color,
  }));
};

export const animateAurora = (waves: AuroraWave[]) => {
  waves.forEach((wave, index) => {
    const baseDuration = 15000 + (index * 3000);

    Animated.loop(
      Animated.parallel([
        // Slow drift
        Animated.sequence([
          Animated.timing(wave.translateX, {
            toValue: 50 + (index * 20),
            duration: baseDuration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(wave.translateX, {
            toValue: -50 - (index * 20),
            duration: baseDuration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        // Vertical drift
        Animated.sequence([
          Animated.timing(wave.translateY, {
            toValue: 30 + (index * 15),
            duration: baseDuration * 0.8,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(wave.translateY, {
            toValue: -30 - (index * 15),
            duration: baseDuration * 0.8,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        // Scale breathing
        Animated.sequence([
          Animated.timing(wave.scale, {
            toValue: 1.1 + (index * 0.05),
            duration: baseDuration * 0.6,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(wave.scale, {
            toValue: 0.95 - (index * 0.03),
            duration: baseDuration * 0.6,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        // Opacity pulse
        Animated.sequence([
          Animated.timing(wave.opacity, {
            toValue: 0.4 - (index * 0.08),
            duration: baseDuration * 0.5,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(wave.opacity, {
            toValue: 0.2 - (index * 0.04),
            duration: baseDuration * 0.5,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        // Slow rotation
        Animated.timing(wave.rotation, {
          toValue: 360,
          duration: baseDuration * 3,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  });
};

// ============================================
// DEPTH-AWARE MORPHING
// ============================================

export interface MorphState {
  translateX: Animated.Value;
  translateY: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  rotation: Animated.Value;
}

export const createMorphState = (): MorphState => ({
  translateX: new Animated.Value(0),
  translateY: new Animated.Value(50),
  scale: new Animated.Value(0.9),
  opacity: new Animated.Value(0),
  rotation: new Animated.Value(0),
});

export const morphIn = (state: MorphState, config?: { duration?: number; delay?: number }) => {
  const duration = config?.duration || SceneTiming.transitions.morphDuration;
  const delay = config?.delay || 0;

  return Animated.parallel([
    Animated.timing(state.opacity, {
      toValue: 1,
      duration: duration * 0.6,
      delay,
      easing: SceneTiming.easing.elegant,
      useNativeDriver: true,
    }),
    Animated.timing(state.translateY, {
      toValue: 0,
      duration,
      delay,
      easing: SceneTiming.easing.smooth,
      useNativeDriver: true,
    }),
    Animated.spring(state.scale, {
      toValue: 1,
      tension: 40,
      friction: 8,
      delay,
      useNativeDriver: true,
    }),
  ]);
};

export const morphOut = (state: MorphState, config?: { duration?: number }) => {
  const duration = config?.duration || SceneTiming.transitions.fadeOut;

  return Animated.parallel([
    Animated.timing(state.opacity, {
      toValue: 0,
      duration,
      easing: SceneTiming.easing.elegant,
      useNativeDriver: true,
    }),
    Animated.timing(state.translateY, {
      toValue: -30,
      duration,
      easing: SceneTiming.easing.gentle,
      useNativeDriver: true,
    }),
    Animated.timing(state.scale, {
      toValue: 0.95,
      duration,
      easing: SceneTiming.easing.gentle,
      useNativeDriver: true,
    }),
  ]);
};

// ============================================
// STAGGERED REVEAL ANIMATIONS
// ============================================

export const staggeredReveal = (
  items: Animated.Value[],
  config?: { staggerDelay?: number; duration?: number }
) => {
  const staggerDelay = config?.staggerDelay || SceneTiming.transitions.staggerDelay;
  const duration = config?.duration || 500;

  return Animated.stagger(
    staggerDelay,
    items.map(item =>
      Animated.spring(item, {
        toValue: 1,
        tension: 50,
        friction: 10,
        useNativeDriver: true,
      })
    )
  );
};

// ============================================
// GLOW & PULSE EFFECTS
// ============================================

export interface GlowEffect {
  scale: Animated.Value;
  opacity: Animated.Value;
}

export const createGlowEffect = (): GlowEffect => ({
  scale: new Animated.Value(1),
  opacity: new Animated.Value(0.5),
});

export const animateGlow = (glow: GlowEffect, color?: string) => {
  return Animated.loop(
    Animated.parallel([
      Animated.sequence([
        Animated.timing(glow.scale, {
          toValue: 1.3,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glow.scale, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(glow.opacity, {
          toValue: 0.8,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glow.opacity, {
          toValue: 0.4,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ])
  );
};

// ============================================
// ORBITAL ANIMATION
// ============================================

export interface OrbitalElement {
  rotation: Animated.Value;
  scale: Animated.Value;
  radius: number;
  speed: number;
}

export const createOrbitalElements = (count: number): OrbitalElement[] => {
  return Array(count).fill(0).map((_, i) => ({
    rotation: new Animated.Value(i * (360 / count)),
    scale: new Animated.Value(0.8 + (i * 0.1)),
    radius: 80 + (i * 40),
    speed: 8000 + (i * 2000),
  }));
};

export const animateOrbits = (elements: OrbitalElement[]) => {
  elements.forEach((element) => {
    Animated.loop(
      Animated.timing(element.rotation, {
        toValue: element.rotation._value + 360,
        duration: element.speed,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  });
};

// ============================================
// WAVE ANIMATION
// ============================================

export const createWaveAnimation = (
  value: Animated.Value,
  config?: { amplitude?: number; duration?: number }
) => {
  const amplitude = config?.amplitude || 20;
  const duration = config?.duration || 3000;

  return Animated.loop(
    Animated.sequence([
      Animated.timing(value, {
        toValue: amplitude,
        duration: duration / 2,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: -amplitude,
        duration: duration / 2,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    ])
  );
};

// ============================================
// COLOR UTILITIES
// ============================================

export const generateColorVariations = (baseColor: string, count: number): string[] => {
  // Parse hex color
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  return Array(count).fill(0).map((_, i) => {
    const factor = 1 - (i * 0.15);
    const nr = Math.round(r * factor);
    const ng = Math.round(g * factor);
    const nb = Math.round(b * factor);
    return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
  });
};

// Scene-specific color palettes
export const SceneColorPalettes = {
  flight: {
    primary: '#3B82F6',
    secondary: '#6366F1',
    accent: '#8B5CF6',
    particles: ['#3B82F6', '#6366F1', '#8B5CF6', '#60A5FA', '#818CF8'],
    aurora: '#3B82F6',
  },
  ride: {
    primary: '#10B981',
    secondary: '#06B6D4',
    accent: '#14B8A6',
    particles: ['#10B981', '#06B6D4', '#14B8A6', '#34D399', '#22D3EE'],
    aurora: '#10B981',
  },
  doctor: {
    primary: '#EF4444',
    secondary: '#F43F5E',
    accent: '#EC4899',
    particles: ['#EF4444', '#F43F5E', '#EC4899', '#F87171', '#FB7185'],
    aurora: '#EF4444',
  },
  success: {
    primary: '#10B981',
    secondary: '#059669',
    accent: '#34D399',
    particles: ['#10B981', '#059669', '#34D399', '#6EE7B7', '#A7F3D0'],
    aurora: '#10B981',
  },
  payment: {
    primary: '#8B5CF6',
    secondary: '#6366F1',
    accent: '#A78BFA',
    particles: ['#8B5CF6', '#6366F1', '#A78BFA', '#818CF8', '#C4B5FD'],
    aurora: '#8B5CF6',
  },
};

// ============================================
// SCENE CONTROLLER
// ============================================

export class SceneController {
  private currentSceneStartTime: number = 0;
  private isTransitioning: boolean = false;

  startScene() {
    this.currentSceneStartTime = Date.now();
    this.isTransitioning = false;
  }

  getElapsedTime(): number {
    return Date.now() - this.currentSceneStartTime;
  }

  canTransition(sceneType: string): boolean {
    if (this.isTransitioning) return false;
    const minTime = SceneTiming.minDisplayTime[sceneType] || SceneTiming.minDisplayTime.default;
    return this.getElapsedTime() >= minTime;
  }

  getRemainingTime(sceneType: string): number {
    const minTime = SceneTiming.minDisplayTime[sceneType] || SceneTiming.minDisplayTime.default;
    const remaining = minTime - this.getElapsedTime();
    return Math.max(0, remaining);
  }

  beginTransition() {
    this.isTransitioning = true;
  }

  endTransition() {
    this.isTransitioning = false;
  }
}

export default {
  SceneTiming,
  createParallaxLayers,
  createAmbientParticles,
  animateParticles,
  createAuroraWaves,
  animateAurora,
  createMorphState,
  morphIn,
  morphOut,
  staggeredReveal,
  createGlowEffect,
  animateGlow,
  createOrbitalElements,
  animateOrbits,
  createWaveAnimation,
  generateColorVariations,
  SceneColorPalettes,
  SceneController,
};
