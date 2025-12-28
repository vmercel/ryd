import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  RadialGradient,
  Filter,
  FeGaussianBlur,
  FeMerge,
  FeMergeNode,
  Rect,
  Circle,
  Path,
  G,
  Line,
} from 'react-native-svg';

// Brand colors
export const BrandColors = {
  // Primary
  midnightNavy: '#0A0E17',
  deepNavy: '#141821',
  electricBlue: '#3B82F6',
  cosmicPurple: '#8B5CF6',
  // Secondary
  auroraCyan: '#06B6D4',
  emberGold: '#F59E0B',
  jadeGreen: '#10B981',
  roseRed: '#EF4444',
  // Neutrals
  white: '#FFFFFF',
  gray100: '#F9FAFB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
};

interface LogoProps {
  size?: number;
  variant?: 'icon' | 'full' | 'wordmark';
  style?: ViewStyle;
  showBackground?: boolean;
}

/**
 * rydAI Logo Component
 *
 * Renders the brand logo using react-native-svg for crisp vector rendering.
 *
 * @param size - Base size of the logo (default: 64)
 * @param variant - 'icon' for just R symbol, 'full' for icon + text, 'wordmark' for text only
 * @param showBackground - Whether to show the dark background
 */
export function Logo({ size = 64, variant = 'icon', style, showBackground = true }: LogoProps) {
  if (variant === 'wordmark') {
    return <LogoWordmark size={size} style={style} />;
  }

  if (variant === 'full') {
    return <LogoFull size={size} style={style} showBackground={showBackground} />;
  }

  return <LogoIcon size={size} style={style} showBackground={showBackground} />;
}

function LogoIcon({
  size,
  style,
  showBackground,
}: {
  size: number;
  style?: ViewStyle;
  showBackground: boolean;
}) {
  const viewBox = '0 0 512 512';

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox={viewBox}>
        <Defs>
          <LinearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={BrandColors.electricBlue} />
            <Stop offset="100%" stopColor={BrandColors.cosmicPurple} />
          </LinearGradient>
          <LinearGradient id="aiGlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={BrandColors.auroraCyan} />
            <Stop offset="50%" stopColor={BrandColors.electricBlue} />
            <Stop offset="100%" stopColor={BrandColors.cosmicPurple} />
          </LinearGradient>
          <LinearGradient id="bgGradient" x1="50%" y1="0%" x2="50%" y2="100%">
            <Stop offset="0%" stopColor={BrandColors.deepNavy} />
            <Stop offset="100%" stopColor={BrandColors.midnightNavy} />
          </LinearGradient>
        </Defs>

        {/* Background */}
        {showBackground && <Rect width="512" height="512" fill="url(#bgGradient)" />}

        {/* Neural dots */}
        <G opacity={0.15}>
          <Circle cx="80" cy="100" r="3" fill={BrandColors.electricBlue} />
          <Circle cx="120" cy="80" r="2" fill={BrandColors.cosmicPurple} />
          <Circle cx="420" cy="90" r="2.5" fill={BrandColors.electricBlue} />
          <Circle cx="90" cy="400" r="2" fill={BrandColors.electricBlue} />
          <Circle cx="410" cy="410" r="3" fill={BrandColors.electricBlue} />
          <Line
            x1="80"
            y1="100"
            x2="120"
            y2="80"
            stroke={BrandColors.electricBlue}
            strokeWidth="0.5"
            opacity={0.5}
          />
        </G>

        {/* Main R Monogram */}
        <Path
          d="M160 140
             L160 372
             L200 372
             L200 290
             L280 290
             L340 372
             L390 372
             L320 280
             C360 270 380 230 380 190
             C380 140 340 100 280 100
             L160 100
             L160 140
             Z
             M200 140
             L280 140
             C320 140 340 160 340 190
             C340 220 320 250 280 250
             L200 250
             L200 140
             Z"
          fill="url(#primaryGradient)"
        />

        {/* AI Node */}
        <Circle cx="340" cy="180" r="8" fill="url(#aiGlowGradient)" />
        <Circle cx="340" cy="180" r="4" fill={BrandColors.white} opacity={0.8} />

        {/* Motion arc */}
        <Path
          d="M380 300 Q 420 350 380 400"
          stroke="url(#aiGlowGradient)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          opacity={0.6}
        />

        {/* Accent dots */}
        <Circle cx="395" cy="320" r="3" fill={BrandColors.auroraCyan} opacity={0.8} />
        <Circle cx="400" cy="380" r="2" fill={BrandColors.cosmicPurple} opacity={0.6} />
      </Svg>
    </View>
  );
}

function LogoWordmark({ size, style }: { size: number; style?: ViewStyle }) {
  const fontSize = size * 0.5;

  return (
    <View style={[styles.wordmarkContainer, style]}>
      <Text style={[styles.wordmarkRyd, { fontSize }]}>ryd</Text>
      <Text style={[styles.wordmarkAI, { fontSize: fontSize * 0.9 }]}>AI</Text>
    </View>
  );
}

function LogoFull({
  size,
  style,
  showBackground,
}: {
  size: number;
  style?: ViewStyle;
  showBackground: boolean;
}) {
  const iconSize = size;
  const fontSize = size * 0.4;

  return (
    <View style={[styles.fullContainer, style]}>
      <LogoIcon size={iconSize} showBackground={showBackground} />
      <View style={styles.fullTextContainer}>
        <View style={styles.wordmarkContainer}>
          <Text style={[styles.wordmarkRyd, { fontSize }]}>ryd</Text>
          <Text style={[styles.wordmarkAI, { fontSize: fontSize * 0.9 }]}>AI</Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Animated Logo variant with pulsing AI node
 */
export function AnimatedLogo({ size = 64, style }: { size?: number; style?: ViewStyle }) {
  // For a truly animated version, you would use react-native-reanimated
  // This is a static version that can be enhanced with animations
  return <Logo size={size} style={style} variant="icon" />;
}

const styles = StyleSheet.create({
  wordmarkContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  wordmarkRyd: {
    fontWeight: '600',
    color: BrandColors.gray100,
    letterSpacing: -1,
  },
  wordmarkAI: {
    fontWeight: '700',
    color: BrandColors.electricBlue,
    letterSpacing: 0,
  },
  fullContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fullTextContainer: {
    marginLeft: 12,
  },
});

export default Logo;
