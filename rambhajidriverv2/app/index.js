// app/index.js
// App entry gate & premium animated splash screen with Reanimated 60fps vortex & logo reveal

import { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { router, useRootNavigationState } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { secureStorage } from '../src/core/storage/mmkvInstances';
import { STORAGE_KEYS } from '../src/config/constants';
import { store } from '../src/store';
import { setDriver } from '../src/features/auth/state/authSlice';
import { hydrateRoute } from '../src/features/routes/state/routeSlice';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Radial distance off-screen for vegetables to fly in from
const VORTEX_RADIUS = Math.max(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.65;

const VEGETABLES = ['🥦', '🥕', '🍅', '🫑', '🥬', '🍆', '🥑', '🍋'];

// Radial bursts of leaves and particles upon morph collision
const PARTICLES = [
  { emoji: '🍃', angle: 0.1 * Math.PI, dist: 130 },
  { emoji: '🌿', angle: 0.3 * Math.PI, dist: 155 },
  { emoji: '✨', angle: 0.5 * Math.PI, dist: 110 },
  { emoji: '🟢', angle: 0.7 * Math.PI, dist: 145 },
  { emoji: '🍃', angle: 0.9 * Math.PI, dist: 160 },
  { emoji: '🌿', angle: 1.1 * Math.PI, dist: 125 },
  { emoji: '✨', angle: 1.3 * Math.PI, dist: 150 },
  { emoji: '🟢', angle: 1.5 * Math.PI, dist: 115 },
  { emoji: '🍃', angle: 1.7 * Math.PI, dist: 140 },
  { emoji: '🌿', angle: 1.9 * Math.PI, dist: 165 },
  { emoji: '✨', angle: 0.05 * Math.PI, dist: 135 },
  { emoji: '🟢', angle: 0.85 * Math.PI, dist: 150 },
];

export default function Index() {
  const rootNavigationState = useRootNavigationState();
  const [animationFinished, setAnimationFinished] = useState(false);

  // Reanimated Shared Values
  const vegProgress = useSharedValue(0);
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const particleProgress = useSharedValue(0);
  const logoTranslateY = useSharedValue(0);
  const logoScaleFinal = useSharedValue(1);
  const textRevealProgress = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const screenFadeOut = useSharedValue(1);

  useEffect(() => {
    // 1. Vegetables Fly-In (0 -> 1 over 1000ms)
    vegProgress.value = withTiming(1, { duration: 1000 });

    // 2. Logo Springs Up (Spring triggers at 1000ms)
    logoScale.value = withDelay(
      1000,
      withSpring(1, { damping: 11, stiffness: 85 })
    );
    logoOpacity.value = withDelay(
      1000,
      withTiming(1, { duration: 250 })
    );

    // 3. Motion particles burst outwards (Timing triggers at 1000ms)
    particleProgress.value = withDelay(
      1000,
      withTiming(1, { duration: 900 })
    );

    // 4. Logo elevates upward to make space for name (triggers at 1750ms)
    logoTranslateY.value = withDelay(
      1750,
      withSpring(-80, { damping: 14, stiffness: 70 })
    );
    logoScaleFinal.value = withDelay(
      1750,
      withTiming(0.8, { duration: 600 })
    );

    // 5. Smooth staggered letter-by-letter reveal of the app name (triggers at 2200ms)
    textRevealProgress.value = withDelay(
      2200,
      withTiming(1, { duration: 1200 })
    );

    // 6. Subheading/Tagline fade-in (triggers at 3200ms)
    taglineOpacity.value = withDelay(
      3200,
      withTiming(1, { duration: 600 })
    );

    // 7. Full screen fade out & complete animation check (triggers at 3900ms)
    screenFadeOut.value = withDelay(
      3900,
      withTiming(0, { duration: 400 }, (finished) => {
        if (finished) {
          runOnJS(setAnimationFinished)(true);
        }
      })
    );
  }, []);

  // Redirection checks triggered upon animation layout completion
  useEffect(() => {
    if (!rootNavigationState?.key || !animationFinished) return;

    const checkSessionAndRedirect = async () => {
      // Wait for AsyncStorage hydration in MMKV fallback storage (for Expo Go/Web)
      try {
        const { waitForStorageHydration } = require('../src/core/storage/mmkvInstances');
        await waitForStorageHydration();
        store.dispatch(hydrateRoute());
      } catch (e) {
        console.warn('[Index] Error waiting for storage hydration:', e);
      }

      const token = secureStorage.getString(STORAGE_KEYS.ACCESS_TOKEN);
      const profileRaw = secureStorage.getString(STORAGE_KEYS.DRIVER_PROFILE);

      if (token && profileRaw) {
        try {
          const driver = JSON.parse(profileRaw);
          store.dispatch(setDriver(driver));
          router.replace('/(tabs)/');
        } catch {
          router.replace('/(auth)/login');
        }
      } else {
        router.replace('/(auth)/login');
      }
    };

    checkSessionAndRedirect();
  }, [rootNavigationState?.key, animationFinished]);

  // Animated style mappings
  const containerStyle = useAnimatedStyle(() => ({
    opacity: screenFadeOut.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { scale: logoScale.value * logoScaleFinal.value },
      { translateY: logoTranslateY.value },
    ],
  }));

  const getVegStyle = (index) => {
    const angle = (index * 2 * Math.PI) / VEGETABLES.length;
    return useAnimatedStyle(() => {
      const p = vegProgress.value;
      // Vortex path: spiral angular drift + radius shrinking
      const currentAngle = angle + p * Math.PI * 1.5;
      const currentRadius = VORTEX_RADIUS * (1 - p);

      const tx = Math.cos(currentAngle) * currentRadius;
      const ty = Math.sin(currentAngle) * currentRadius;

      // Shrink veggies completely into the merge center
      const scale = p === 1 ? 0 : 1.4 * (1 - p);
      const rotate = `${p * 720}deg`;

      return {
        transform: [
          { translateX: tx },
          { translateY: ty },
          { scale },
          { rotate },
        ],
        opacity: p === 1 ? 0 : 1 - p * 0.3,
      };
    });
  };

  const getParticleStyle = (index, angle, dist) => {
    return useAnimatedStyle(() => {
      const p = particleProgress.value;
      if (p === 0 || p === 1) return { opacity: 0 };

      const tx = Math.cos(angle) * dist * p;
      const ty = Math.sin(angle) * dist * p;
      const scale = 1.3 * (1 - p);
      const rotate = `${p * 360}deg`;

      return {
        transform: [
          { translateX: tx },
          { translateY: ty },
          { scale },
          { rotate },
        ],
        opacity: 1 - p,
      };
    });
  };

  const letters = 'Ram Bhaji'.split('');

  const getLetterStyle = (index) => {
    const N = letters.length;
    const start = (index / N) * 0.55; // Spread starts over the first 55% of timeline
    return useAnimatedStyle(() => {
      const gp = textRevealProgress.value;
      // Map global progress to a localized segment for staggered feel
      const lp = Math.min(Math.max((gp - start) / 0.45, 0), 1);

      return {
        opacity: lp,
        transform: [{ translateY: (1 - lp) * 15 }],
      };
    });
  };

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const textWrapperStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: 75 }],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* 1. Flying fresh vegetables */}
      {VEGETABLES.map((veg, idx) => (
        <Animated.Text key={`veg-${idx}`} style={[styles.vegText, getVegStyle(idx)]}>
          {veg}
        </Animated.Text>
      ))}

      {/* 2. Bursting leaf & graphics particles */}
      {PARTICLES.map((part, idx) => (
        <Animated.Text
          key={`part-${idx}`}
          style={[styles.particleText, getParticleStyle(idx, part.angle, part.dist)]}
        >
          {part.emoji}
        </Animated.Text>
      ))}

      {/* 3. Bouncy Morphing Logo */}
      <Animated.View style={[styles.logoWrapper, logoStyle]}>
        <Animated.Image
          source={require('../assets/images/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </Animated.View>

      {/* 4. Staggered Text Reveal & Tagline */}
      <Animated.View style={[styles.textWrapper, textWrapperStyle]}>
        <View style={styles.textRow}>
          {letters.map((char, idx) => (
            <Animated.Text
              key={`letter-${idx}`}
              style={[
                styles.letterText,
                getLetterStyle(idx),
                char === ' ' ? { width: 8 } : null,
              ]}
            >
              {char}
            </Animated.Text>
          ))}
        </View>

        <Animated.Text style={[styles.tagline, taglineStyle]}>
          Fresh Veggies & Fruits, Instantly.
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vegText: {
    position: 'absolute',
    fontSize: 48,
    zIndex: 10,
  },
  particleText: {
    position: 'absolute',
    fontSize: 24,
    zIndex: 5,
  },
  logoWrapper: {
    position: 'absolute',
    width: 280,
    height: 190,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  textWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    zIndex: 20,
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
  },
  letterText: {
    fontSize: 28,
    color: '#1D4ED8', // Royal Electric Blue from signature theme
    fontWeight: 'bold',
    fontFamily: 'System',
    textAlign: 'center',
  },
  tagline: {
    fontSize: 13,
    color: '#00B4D8', // Sky Blue sub-label
    fontWeight: '600',
    fontFamily: 'System',
    letterSpacing: 1.2,
    marginTop: 10,
    textAlign: 'center',
  },
});
