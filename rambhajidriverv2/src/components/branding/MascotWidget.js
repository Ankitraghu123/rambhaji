// src/components/branding/MascotWidget.js
// Brand mascot (Veggie Box) Reanimated repeat loop animations.

import React, { useEffect, memo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing
} from 'react-native-reanimated';

const MascotWidget = memo(function MascotWidget({ emoji = '📦', state = 'idle', label = 'Ramji' }) {
  const bounceY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const handRotate = useSharedValue(0);
  const driveX = useSharedValue(0);

  useEffect(() => {
    // Reset values first
    bounceY.value = 0;
    scale.value = 1;
    rotate.value = 0;
    handRotate.value = 0;
    driveX.value = 0;

    if (state === 'idle') {
      // Gentle floating/breathing loop
      bounceY.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 900, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else if (state === 'celebrate') {
      // Bouncing and scaling excitement loop
      scale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 250, easing: Easing.out(Easing.ease) }),
          withTiming(0.95, { duration: 250, easing: Easing.in(Easing.ease) })
        ),
        -1,
        false
      );
      rotate.value = withRepeat(
        withSequence(
          withTiming(10, { duration: 200 }),
          withTiming(-10, { duration: 200 })
        ),
        -1,
        false
      );
    } else if (state === 'wave') {
      // Waving hand/arm loop
      handRotate.value = withRepeat(
        withSequence(
          withTiming(-20, { duration: 220 }),
          withTiming(20, { duration: 220 })
        ),
        -1,
        false
      );
      bounceY.value = withRepeat(
        withSequence(
          withTiming(-2, { duration: 600 }),
          withTiming(0, { duration: 600 })
        ),
        -1,
        false
      );
    } else if (state === 'deliver') {
      // Mascot vibrating like driving a motor scooter
      driveX.value = withRepeat(
        withSequence(
          withTiming(1.5, { duration: 60 }),
          withTiming(-1.5, { duration: 60 })
        ),
        -1,
        false
      );
      bounceY.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 120 }),
          withTiming(0, { duration: 120 })
        ),
        -1,
        false
      );
    }
  }, [state]);

  const animatedMascotStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bounceY.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
      { translateX: driveX.value }
    ]
  }));

  const animatedHandStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${handRotate.value}deg` }
    ]
  }));

  return (
    <View style={styles.container}>
      <View style={styles.mascotArea}>
        {state === 'deliver' && <Text style={styles.wheel}>💨</Text>}
        
        {/* Waving hand overlay for wave state */}
        {state === 'wave' && (
          <Animated.Text style={[styles.hand, animatedHandStyle]}>
            👋
          </Animated.Text>
        )}

        <Animated.View style={[styles.mascotBody, animatedMascotStyle]}>
          <Text style={styles.mascotEmoji}>{emoji}</Text>
          
          {/* Animated cute face overlays for extra premium feel */}
          <View style={styles.faceOverlay}>
            <Text style={styles.eyes}>👁️👁️</Text>
            <Text style={styles.mouth}>{state === 'celebrate' ? '👅' : '👄'}</Text>
          </View>
        </Animated.View>
      </View>
      <View style={styles.badgeContainer}>
        <Text style={styles.mascotLabel}>{label}</Text>
      </View>
    </View>
  );
});

export default MascotWidget;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  mascotArea: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mascotBody: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#FFF3E6',
    borderWidth: 1.5,
    borderColor: '#FF7E36',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF7E36',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  mascotEmoji: {
    fontSize: 26,
    zIndex: 1,
  },
  faceOverlay: {
    position: 'absolute',
    top: 6,
    bottom: 4,
    left: 0,
    right: 0,
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
    pointerEvents: 'none',
  },
  eyes: {
    fontSize: 7,
    letterSpacing: 2,
  },
  mouth: {
    fontSize: 7,
  },
  hand: {
    position: 'absolute',
    right: -8,
    top: -4,
    fontSize: 16,
    zIndex: 10,
  },
  wheel: {
    position: 'absolute',
    left: -12,
    bottom: 2,
    fontSize: 14,
    opacity: 0.8,
  },
  badgeContainer: {
    backgroundColor: '#0E4A35',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginTop: 2,
  },
  mascotLabel: {
    fontSize: 7,
    color: '#FFF',
    fontWeight: 'bold',
    letterSpacing: 0.3,
  }
});
