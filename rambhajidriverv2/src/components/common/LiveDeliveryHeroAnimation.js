// src/components/common/LiveDeliveryHeroAnimation.js
// Optimized 60 FPS Cinematic Live Delivery World Animation
// Tailored for butter-smooth execution on low-end budget Android and iPhone devices.

import React, { useEffect, useState, memo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  Easing
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTAINER_WIDTH = SCREEN_WIDTH - 32;

const LiveDeliveryHeroAnimation = memo(function LiveDeliveryHeroAnimation() {
  const [phase, setPhase] = useState('riding'); // 'riding', 'arriving', 'handover', 'success', 'reset'

  // Lightweight parallax shared values
  const cloudsX = useSharedValue(CONTAINER_WIDTH);
  const cityX = useSharedValue(CONTAINER_WIDTH);

  // Rider and destination coordinates
  const riderX = useSharedValue(-80);
  const riderBounce = useSharedValue(0);
  const boxY = useSharedValue(0);
  const destinationX = useSharedValue(CONTAINER_WIDTH + 100);
  const parcelX = useSharedValue(0);
  const parcelY = useSharedValue(0);
  const parcelOpacity = useSharedValue(1);

  // Overlays
  const successScale = useSharedValue(0);
  const successOpacity = useSharedValue(0);

  useEffect(() => {
    let active = true;

    const startParallax = () => {
      cloudsX.value = withRepeat(withTiming(-80, { duration: 18000, easing: Easing.linear }), -1, false);
      cityX.value = withRepeat(withTiming(-160, { duration: 7000, easing: Easing.linear }), -1, false);
    };

    const stopParallax = () => {
      cloudsX.value = cloudsX.value;
      cityX.value = cityX.value;
    };

    const runSequence = async () => {
      if (!active) return;

      // ── PHASE 1: RIDING (Duration: 4.5s) ──
      setPhase('riding');
      startParallax();
      riderX.value = withTiming(35, { duration: 1000 });
      riderBounce.value = withRepeat(withTiming(-3, { duration: 150 }), -1, true);
      boxY.value = withRepeat(withTiming(-1.5, { duration: 180 }), -1, true);

      destinationX.value = CONTAINER_WIDTH + 100;
      parcelX.value = 0;
      parcelY.value = 0;
      parcelOpacity.value = 1;
      successScale.value = 0;
      successOpacity.value = 0;

      await new Promise(r => setTimeout(r, 4500));
      if (!active) return;

      // ── PHASE 2: ARRIVING (Duration: 1.5s) ──
      setPhase('arriving');
      stopParallax();
      riderBounce.value = 0;
      boxY.value = 0;

      destinationX.value = withTiming(CONTAINER_WIDTH - 90, { duration: 1400 });
      riderX.value = withTiming(CONTAINER_WIDTH - 150, { duration: 1400 });

      await new Promise(r => setTimeout(r, 1500));
      if (!active) return;

      // ── PHASE 3: HANDOVER (Duration: 1.2s) ──
      setPhase('handover');
      parcelX.value = withTiming(42, { duration: 800 });
      parcelY.value = withTiming(-3, { duration: 800 });

      await new Promise(r => setTimeout(r, 1200));
      if (!active) return;

      // ── PHASE 4: SUCCESS (Duration: 2.2s) ──
      setPhase('success');
      parcelOpacity.value = withTiming(0, { duration: 200 });
      successOpacity.value = 1;
      successScale.value = withSpring(1, { damping: 12 });

      await new Promise(r => setTimeout(r, 2200));
      if (!active) return;

      // ── PHASE 5: RESET / DRIVE OFF (Duration: 1.0s) ──
      setPhase('reset');
      successOpacity.value = withTiming(0, { duration: 400 });
      riderX.value = withTiming(CONTAINER_WIDTH + 90, { duration: 900 });
      destinationX.value = withTiming(-120, { duration: 900 });

      await new Promise(r => setTimeout(r, 1000));
      if (!active) return;

      riderX.value = -80;
      runSequence();
    };

    runSequence();

    return () => {
      active = false;
    };
  }, []);

  // Parallax styles
  const animClouds = useAnimatedStyle(() => ({ transform: [{ translateX: cloudsX.value }] }));
  const animCity = useAnimatedStyle(() => ({ transform: [{ translateX: cityX.value }] }));

  // Rider & Destination styles
  const animRider = useAnimatedStyle(() => ({
    transform: [{ translateX: riderX.value }, { translateY: riderBounce.value }]
  }));

  const animBox = useAnimatedStyle(() => ({
    transform: [{ translateY: boxY.value }]
  }));

  const animDestination = useAnimatedStyle(() => ({
    transform: [{ translateX: destinationX.value }]
  }));

  const animParcel = useAnimatedStyle(() => ({
    opacity: parcelOpacity.value,
    transform: [{ translateX: parcelX.value }, { translateY: parcelY.value }]
  }));

  // GPS line logic
  const animRouteLine = useAnimatedStyle(() => {
    const start = Math.max(0, riderX.value + 40);
    const end = Math.max(0, destinationX.value + 35);
    const width = Math.max(0, end - start);
    return {
      left: start,
      width: width,
      opacity: (phase === 'riding' || phase === 'arriving') ? 0.75 : 0,
    };
  });

  // Success screen style
  const animSuccess = useAnimatedStyle(() => ({
    opacity: successOpacity.value,
    transform: [{ scale: successScale.value }]
  }));

  return (
    <View style={styles.cardContainer}>
      <LinearGradient
        colors={['#E0F2FE', '#EFF6FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.container}
      >
        <View style={styles.metaRow}>
          <Text style={styles.title}>🏙️ Live Delivery World</Text>
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>● LIVE</Text>
          </View>
        </View>

        {/* Sky Elements */}
        <Text style={styles.sunMoon}>☀️</Text>
        <Animated.Text style={[styles.cloud, animClouds]}>☁️  ☁️</Animated.Text>

        {/* Parallax Buildings */}
        <Animated.View style={[styles.parallaxLayer, animCity]}>
          <Text style={styles.cityscapeText}>
            🏙️ 🏢 🏬 🏪 🏡 🏢 🏬
          </Text>
        </Animated.View>

        {/* Road track */}
        <View style={styles.roadTrack}>
          {/* Lane Markings */}
          <View style={styles.laneMarkingsRow}>
            <View style={styles.laneStripe} />
            <View style={styles.laneStripe} />
            <View style={styles.laneStripe} />
            <View style={styles.laneStripe} />
          </View>
          {/* Glowing GPS active navigation line */}
          <Animated.View style={[styles.gpsRouteLine, animRouteLine]} />
        </View>

        {/* Destination Target */}
        <Animated.View style={[styles.destinationContainer, animDestination]}>
          <Text style={styles.locationPin}>📍</Text>
          <Text style={styles.customer}>👤</Text>
          <Text style={styles.house}>🏡</Text>
        </Animated.View>

        {/* Rider (Bike + Box + Parcel) */}
        <Animated.View style={[styles.riderContainer, animRider]}>
          <Animated.Text style={[styles.parcel, animParcel]}>📦</Animated.Text>
          <Animated.Text style={[styles.riderBox, animBox]}>📦</Animated.Text>
          <Text style={styles.scooter}>🛵</Text>
          {phase === 'riding' && <Text style={styles.dustTrail}>💨</Text>}
        </Animated.View>

        {/* Success Overlay (+₹120 Earnings & ⭐⭐⭐⭐⭐ Rating built-in) */}
        <Animated.View style={[styles.successOverlay, animSuccess]} pointerEvents="none">
          <LinearGradient
            colors={['rgba(16, 185, 129, 0.96)', 'rgba(5, 150, 105, 0.96)']}
            style={styles.successGradient}
          >
            <Text style={styles.successCheck}>✅</Text>
            <Text style={styles.successText}>Delivered Successfully!</Text>
            <Text style={styles.earningsAmount}>+₹120</Text>
            <Text style={styles.ratingStars}>⭐⭐⭐⭐⭐</Text>
          </LinearGradient>
        </Animated.View>
      </LinearGradient>
    </View>
  );
});

export default LiveDeliveryHeroAnimation;

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 12,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFEBE4',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  container: {
    height: 240,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    padding: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  liveBadge: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  liveBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  sunMoon: {
    position: 'absolute',
    right: 24,
    top: 28,
    fontSize: 24,
    opacity: 0.8,
  },
  cloud: {
    position: 'absolute',
    top: 40,
    fontSize: 22,
    color: '#FFFFFF',
    opacity: 0.75,
  },

  // Parallax
  parallaxLayer: {
    position: 'absolute',
    bottom: 30,
    height: 30,
    zIndex: 1,
  },
  cityscapeText: {
    fontSize: 24,
    opacity: 0.85,
  },

  // Road Track
  roadTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 32,
    backgroundColor: '#475569',
    borderTopWidth: 2,
    borderTopColor: '#64748B',
    justifyContent: 'center',
  },
  laneMarkingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  laneStripe: {
    width: 24,
    height: 2,
    backgroundColor: '#FFFFFF',
    opacity: 0.5,
  },
  gpsRouteLine: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
    zIndex: 10,
    top: 14,
    shadowColor: '#3B82F6',
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },

  // Destination customer container
  destinationContainer: {
    position: 'absolute',
    bottom: 12,
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 4,
  },
  house: {
    fontSize: 28,
  },
  customer: {
    fontSize: 20,
    position: 'absolute',
    left: -12,
    bottom: 0,
    zIndex: 4,
  },
  locationPin: {
    fontSize: 18,
    position: 'absolute',
    top: -2,
    zIndex: 10,
  },

  // Rider Scooter
  riderContainer: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: 60,
    height: 40,
    zIndex: 5,
  },
  scooter: {
    fontSize: 28,
  },
  riderBox: {
    fontSize: 14,
    position: 'absolute',
    left: 0,
    bottom: 10,
  },
  parcel: {
    fontSize: 13,
    position: 'absolute',
    left: 0,
    bottom: 16,
    zIndex: 6,
  },
  dustTrail: {
    fontSize: 14,
    position: 'absolute',
    left: -16,
    bottom: 4,
    opacity: 0.7,
  },

  // Overlay success screen
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  successGradient: {
    paddingHorizontal: 28,
    paddingVertical: 18,
    borderRadius: 22,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    shadowColor: '#10B981',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  successCheck: {
    fontSize: 32,
    marginBottom: 4,
  },
  successText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  earningsAmount: {
    color: '#34D399',
    fontSize: 24,
    fontWeight: '900',
    marginVertical: 4,
  },
  ratingStars: {
    fontSize: 14,
  },
});
