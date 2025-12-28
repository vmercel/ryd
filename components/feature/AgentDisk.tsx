import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/theme';

export type AgentState = 
  | 'idle' 
  | 'listening' 
  | 'speaking' 
  | 'thinking' 
  | 'success' 
  | 'error';

interface AgentDiskProps {
  state: AgentState;
  onTap: () => void;
  size?: number;
}

export const AgentDisk: React.FC<AgentDiskProps> = ({ 
  state, 
  onTap,
  size = 80,
}) => {
  const pulse = useSharedValue(0);
  const wave1 = useSharedValue(0);
  const wave2 = useSharedValue(0);
  const wave3 = useSharedValue(0);
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    // Reset all animations
    pulse.value = 0;
    wave1.value = 0;
    wave2.value = 0;
    wave3.value = 0;
    dot1.value = 0;
    dot2.value = 0;
    dot3.value = 0;

    if (state === 'idle') {
      // Gentle breathing pulse
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else if (state === 'listening') {
      // Listening pulse - faster
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else if (state === 'speaking') {
      // Ripple waves radiating out
      wave1.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
      wave2.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 500 }),
          withTiming(1, { duration: 1500, easing: Easing.out(Easing.ease) })
        ),
        -1,
        false
      );
      wave3.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 1000 }),
          withTiming(1, { duration: 1500, easing: Easing.out(Easing.ease) })
        ),
        -1,
        false
      );
    } else if (state === 'thinking') {
      // Three dots wave
      dot1.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      dot2.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 200 }),
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      dot3.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 400 }),
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }
  }, [state]);

  const diskStyle = useAnimatedStyle(() => {
    const scale = state === 'idle' || state === 'listening'
      ? 1 + pulse.value * 0.1
      : 1;

    return {
      transform: [{ scale }],
    };
  });

  const wave1Style = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(wave1.value, [0, 1], [1, 2.5]) }],
    opacity: interpolate(wave1.value, [0, 0.5, 1], [0.6, 0.3, 0]),
  }));

  const wave2Style = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(wave2.value, [0, 1], [1, 2.5]) }],
    opacity: interpolate(wave2.value, [0, 0.5, 1], [0.6, 0.3, 0]),
  }));

  const wave3Style = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(wave3.value, [0, 1], [1, 2.5]) }],
    opacity: interpolate(wave3.value, [0, 0.5, 1], [0.6, 0.3, 0]),
  }));

  const dot1Style = useAnimatedStyle(() => ({
    transform: [{ scale: 0.6 + dot1.value * 0.4 }],
    opacity: 0.5 + dot1.value * 0.5,
  }));

  const dot2Style = useAnimatedStyle(() => ({
    transform: [{ scale: 0.6 + dot2.value * 0.4 }],
    opacity: 0.5 + dot2.value * 0.5,
  }));

  const dot3Style = useAnimatedStyle(() => ({
    transform: [{ scale: 0.6 + dot3.value * 0.4 }],
    opacity: 0.5 + dot3.value * 0.5,
  }));

  const getDiskColor = () => {
    switch (state) {
      case 'listening':
        return Colors.accent.blue;
      case 'speaking':
        return Colors.primary.main;
      case 'thinking':
        return Colors.accent.purple;
      case 'success':
        return Colors.accent.emerald;
      case 'error':
        return Colors.accent.ruby;
      default:
        return Colors.primary.main;
    }
  };

  const renderContent = () => {
    if (state === 'success') {
      return <Ionicons name="checkmark" size={size * 0.5} color={Colors.text.primary} />;
    }
    if (state === 'error') {
      return <Ionicons name="close" size={size * 0.5} color={Colors.text.primary} />;
    }
    if (state === 'thinking') {
      return (
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, dot1Style, { backgroundColor: Colors.text.primary }]} />
          <Animated.View style={[styles.dot, dot2Style, { backgroundColor: Colors.text.primary }]} />
          <Animated.View style={[styles.dot, dot3Style, { backgroundColor: Colors.text.primary }]} />
        </View>
      );
    }
    if (state === 'listening') {
      return <Ionicons name="mic" size={size * 0.4} color={Colors.text.primary} />;
    }
    // Default: Show app logo
    return (
      <Image
        source={require('../../assets/images/logo.png')}
        style={{ width: size * 0.6, height: size * 0.6 }}
        resizeMode="contain"
      />
    );
  };

  return (
    <TouchableOpacity onPress={onTap} activeOpacity={0.8}>
      <View style={[styles.container, { width: size, height: size }]}>
        {state === 'speaking' && (
          <>
            <Animated.View
              style={[
                styles.wave,
                wave1Style,
                { width: size, height: size, borderColor: getDiskColor() },
              ]}
            />
            <Animated.View
              style={[
                styles.wave,
                wave2Style,
                { width: size, height: size, borderColor: getDiskColor() },
              ]}
            />
            <Animated.View
              style={[
                styles.wave,
                wave3Style,
                { width: size, height: size, borderColor: getDiskColor() },
              ]}
            />
          </>
        )}

        <Animated.View
          style={[
            styles.disk,
            diskStyle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: getDiskColor(),
            },
          ]}
        >
          {renderContent()}
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  disk: {
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
  },

  wave: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
  },

  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
