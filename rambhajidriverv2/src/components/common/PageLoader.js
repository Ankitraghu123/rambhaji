// src/components/common/PageLoader.js
// State-of-the-art premium animated page transition loader matching the Swiggy/Blinkit circular aesthetic.
// Incorporates the fresh Green theme, smooth micro-animations, and circular clock progress track.

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';

const { width: W } = Dimensions.get('window');

const LOADER_TAGLINES = [
  "Freshness you 💚, on time.",
  "Sourcing fresh organic harvests...",
  "Veggies you 💚, on time.",
  "Ram Bhaji delivering organic details...",
  "Optimizing your delivery route..."
];

const VEG_EMOJIS = ['🥬', '🍅', '🥦', '🥕', '🥔', '🌽', '🧺'];

export default function PageLoader({ message, duration = 2000, onComplete }) {
  const [tagline, setTagline] = useState(message || LOADER_TAGLINES[0]);
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [vegIndex, setVegIndex] = useState(0);

  // Animation values
  const floatAnim = useRef(new Animated.Value(0)).current;      // Bobbing character
  const rotateAnim = useRef(new Animated.Value(0)).current;     // Orbiting progress arc
  const scaleAnim = useRef(new Animated.Value(0.9)).current;    // Scale in
  const opacityAnim = useRef(new Animated.Value(0)).current;    // Fade in
  const textOpacity = useRef(new Animated.Value(1)).current;     // Tagline transitions

  useEffect(() => {
    // 1. Entrance Fade & Scale
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 6,
        useNativeDriver: true,
      })
    ]).start();

    // 2. Loop bobbing/floating animation for character
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();

    // 3. Loop Progress Arc rotation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // 4. Rotate taglines if no static message is provided
    let interval;
    if (!message) {
      interval = setInterval(() => {
        Animated.timing(textOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          setTaglineIndex((prev) => {
            const next = (prev + 1) % LOADER_TAGLINES.length;
            setTagline(LOADER_TAGLINES[next]);
            return next;
          });
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }).start();
        });
      }, 2500);
    }

    // 5. Cycle vegetable emojis
    const vegInterval = setInterval(() => {
      setVegIndex((prev) => (prev + 1) % VEG_EMOJIS.length);
    }, 500);

    // 6. Complete callback if requested
    let timeout;
    if (onComplete) {
      timeout = setTimeout(() => {
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onComplete();
        });
      }, duration);
    }

    return () => {
      clearInterval(interval);
      clearInterval(vegInterval);
      clearTimeout(timeout);
    };
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
      <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
        
        {/* Swiggy Style Circular Loader */}
        <View style={styles.loaderCircleContainer}>
          {/* Rotating Progress Arc */}
          <Animated.View style={[styles.progressArc, { transform: [{ rotate: spin }] }]} />

          {/* Inner Clock Face / Core Circle */}
          <View style={styles.innerClockFace}>
            {/* Clock ticks / indicators */}
            <View style={[styles.clockTick, { transform: [{ rotate: '0deg' }] }]} />
            <View style={[styles.clockTick, { transform: [{ rotate: '45deg' }] }]} />
            <View style={[styles.clockTick, { transform: [{ rotate: '90deg' }] }]} />
            <View style={[styles.clockTick, { transform: [{ rotate: '135deg' }] }]} />
            <View style={[styles.clockTick, { transform: [{ rotate: '180deg' }] }]} />
            <View style={[styles.clockTick, { transform: [{ rotate: '225deg' }] }]} />
            <View style={[styles.clockTick, { transform: [{ rotate: '270deg' }] }]} />
            <View style={[styles.clockTick, { transform: [{ rotate: '315deg' }] }]} />

            {/* Bobbing Vegetable / Basket Character */}
            <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
              <Text style={styles.characterEmoji}>{VEG_EMOJIS[vegIndex]}</Text>
            </Animated.View>
          </View>
        </View>

        {/* Animated Message Text */}
        <Animated.Text style={[styles.messageText, { opacity: textOpacity }]}>
          {tagline}
        </Animated.Text>

      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FAF6F0', // Sand Cream background
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    width: '100%',
  },
  loaderCircleContainer: {
    width: 170,
    height: 170,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 35,
    position: 'relative',
  },
  progressArc: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: '#2E9D6A', // Swiggy style Green Orbit Arc
    borderRightColor: '#2E9D6A',
  },
  innerClockFace: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#E9F5EF', // Soft green matching clock face
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#C2E5D3',
    position: 'relative',
    shadowColor: '#2E9D6A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  clockTick: {
    position: 'absolute',
    width: 2,
    height: 8,
    backgroundColor: '#B5D9C7',
    top: 6,
    borderRadius: 1,
    transformOrigin: '50% 64px', // keeps ticks aligned radially inside the clock face
  },
  characterEmoji: {
    fontSize: 54,
  },
  messageText: {
    fontSize: 18,
    color: '#2C2B29', // Charcoal Coffee
    fontWeight: 'bold',
    fontFamily: 'System',
    textAlign: 'center',
    letterSpacing: 0.3,
    paddingHorizontal: 20,
    lineHeight: 24,
    marginTop: 10,
  },
});
