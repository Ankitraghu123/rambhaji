// src/components/branding/LogoOverlay.js
// GPU-accelerated Reanimated overlays for festival and seasonal decorations.

import React, { useEffect, useRef, useState, memo } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  Easing
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LogoOverlay = memo(function LogoOverlay({ type = 'none' }) {
  if (type === 'none') return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {type === 'snow' && <SnowOverlay />}
      {type === 'hearts' && <HeartsOverlay />}
      {type === 'fireworks' && <FireworksOverlay />}
      {type === 'color-splash' && <ColorSplashOverlay />}
      {type === 'flags' && <FlagsOverlay />}
      {type === 'stars' && <StarsOverlay />}
    </View>
  );
});

export default LogoOverlay;

// ❄️ CHRISTMAS SNOW OVERLAY
const SnowOverlay = memo(function SnowOverlay() {
  const snowflakes = Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    left: Math.random() * SCREEN_WIDTH,
    size: Math.random() * 6 + 4,
    delay: Math.random() * 2000,
    duration: Math.random() * 3000 + 3000,
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      {snowflakes.map((snowflake) => (
        <SnowflakeItem key={snowflake.id} {...snowflake} />
      ))}
    </View>
  );
});

const SnowflakeItem = memo(function SnowflakeItem({ left, size, delay, duration }) {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(100, { duration, easing: Easing.linear }),
        -1,
        false
      )
    );

    translateX.value = withRepeat(
      withSequence(
        withTiming(15, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(-15, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value }
    ]
  }));

  return (
    <Animated.View
      style={[
        styles.snowflake,
        animatedStyle,
        { left, width: size, height: size, borderRadius: size / 2 }
      ]}
    />
  );
});

// ❤️ VALENTINE HEARTS OVERLAY
const HeartsOverlay = memo(function HeartsOverlay() {
  const hearts = Array.from({ length: 8 }).map((_, i) => ({
    id: i,
    left: Math.random() * (SCREEN_WIDTH - 40) + 20,
    delay: Math.random() * 1500,
    duration: Math.random() * 2500 + 2000,
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      {hearts.map((heart) => (
        <HeartItem key={heart.id} {...heart} />
      ))}
    </View>
  );
});

const HeartItem = memo(function HeartItem({ left, delay, duration }) {
  const translateY = useSharedValue(90);
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-30, { duration, easing: Easing.out(Easing.ease) }),
        -1,
        false
      )
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: duration * 0.3 }),
          withTiming(0.8, { duration: duration * 0.4 }),
          withTiming(0, { duration: duration * 0.3 })
        ),
        -1,
        false
      )
    );

    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.3, { duration: duration * 0.5 }),
          withTiming(0.8, { duration: duration * 0.5 })
        ),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value }
    ]
  }));

  return (
    <Animated.Text style={[styles.heartEmoji, animatedStyle, { left }]}>
      ❤️
    </Animated.Text>
  );
});

// 🎆 DIWALI FIREWORKS OVERLAY
const FireworksOverlay = memo(function FireworksOverlay() {
  const bursts = Array.from({ length: 5 }).map((_, i) => ({
    id: i,
    left: (SCREEN_WIDTH / 6) * (i + 1) + (Math.random() * 20 - 10),
    top: Math.random() * 40 + 10,
    delay: Math.random() * 2500,
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      {bursts.map((burst) => (
        <FireworkBurst key={burst.id} {...burst} />
      ))}
    </View>
  );
});

const FireworkBurst = memo(function FireworkBurst({ left, top, delay }) {
  const scale = useSharedValue(0.1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const loopAnim = () => {
      scale.value = 0.1;
      opacity.value = 0;

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.5, duration: 800, easing: Easing.out(Easing.quad) }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 1, duration: 200 }),
            Animated.timing(opacity, { toValue: 0, duration: 600, easing: Easing.linear })
          ])
        ])
      ]).start(() => {
        loopAnim();
      });
    };
    loopAnim();
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }]
  }));

  return (
    <Animated.View style={[styles.firework, animatedStyle, { left, top }]}>
      {Array.from({ length: 8 }).map((_, idx) => {
        const angle = (idx * Math.PI) / 4;
        const x = Math.cos(angle) * 20;
        const y = Math.sin(angle) * 20;
        return (
          <View
            key={idx}
            style={[
              styles.spark,
              {
                transform: [{ translateX: x }, { translateY: y }],
                backgroundColor: idx % 2 === 0 ? '#F59E0B' : '#FF7E36',
              }
            ]}
          />
        );
      })}
    </Animated.View>
  );
});

// 🎨 HOLI COLOR SPLASH OVERLAY
const ColorSplashOverlay = memo(function ColorSplashOverlay() {
  const splashes = Array.from({ length: 6 }).map((_, i) => ({
    id: i,
    left: Math.random() * SCREEN_WIDTH,
    top: Math.random() * 50,
    color: ['#EC4899', '#3B82F6', '#8B5CF6', '#10B981'][i % 4],
    delay: Math.random() * 2000,
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      {splashes.map((splash) => (
        <ColorSplashItem key={splash.id} {...splash} />
      ))}
    </View>
  );
});

const ColorSplashItem = memo(function ColorSplashItem({ left, top, color, delay }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 600, easing: Easing.out(Easing.back()) }),
          withDelay(1200, withTiming(0, { duration: 400 }))
        ),
        -1,
        false
      )
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: 300 }),
          withDelay(1500, withTiming(0, { duration: 400 }))
        ),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
    backgroundColor: color
  }));

  return (
    <Animated.View
      style={[
        styles.splashBlob,
        animatedStyle,
        { left, top }
      ]}
    />
  );
});

// 🇮🇳 INDEPENDENCE DAY FLAGS OVERLAY
const FlagsOverlay = memo(function FlagsOverlay() {
  const flags = Array.from({ length: 6 }).map((_, i) => ({
    id: i,
    left: Math.random() * (SCREEN_WIDTH - 30) + 15,
    delay: Math.random() * 2000,
    duration: Math.random() * 3000 + 2500,
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      {flags.map((flag) => (
        <FlagItem key={flag.id} {...flag} />
      ))}
    </View>
  );
});

const FlagItem = memo(function FlagItem({ left, delay, duration }) {
  const translateY = useSharedValue(90);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-20, { duration, easing: Easing.linear }),
        -1,
        false
      )
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.7, { duration: 300 }),
          withDelay(duration - 600, withTiming(0, { duration: 300 }))
        ),
        -1,
        false
      )
    );

    rotate.value = withRepeat(
      withSequence(
        withTiming(15, { duration: 1000 }),
        withTiming(-15, { duration: 1000 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` }
    ]
  }));

  return (
    <Animated.Text style={[styles.flagEmoji, animatedStyle, { left }]}>
      🇮🇳
    </Animated.Text>
  );
});

// 🏏 IPL STARS OVERLAY
const StarsOverlay = memo(function StarsOverlay() {
  const stars = Array.from({ length: 8 }).map((_, i) => ({
    id: i,
    left: Math.random() * SCREEN_WIDTH,
    top: Math.random() * 60,
    delay: Math.random() * 1500,
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      {stars.map((star) => (
        <StarItem key={star.id} {...star} />
      ))}
    </View>
  );
});

const StarItem = memo(function StarItem({ left, top, delay }) {
  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: 600, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 600 })
        ),
        -1,
        false
      )
    );

    rotate.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` }
    ]
  }));

  return (
    <Animated.Text style={[styles.starEmoji, animatedStyle, { left, top }]}>
      ✨
    </Animated.Text>
  );
});

const styles = StyleSheet.create({
  snowflake: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    opacity: 0.85,
  },
  heartEmoji: {
    position: 'absolute',
    fontSize: 16,
  },
  firework: {
    position: 'absolute',
    width: 10,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spark: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  splashBlob: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  flagEmoji: {
    position: 'absolute',
    fontSize: 16,
  },
  starEmoji: {
    position: 'absolute',
    fontSize: 14,
  }
});
