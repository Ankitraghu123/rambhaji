import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { homePalette, themeTokens, radius } from '../constants/theme';
import { useAppStore } from '../store/UseAppStore';

export default function Card({ children, style }) {
  const mode = useAppStore((s) => s.themeMode);
  const colors = themeTokens[mode];
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1,
      speed: 14,
      bounciness: 5,
      useNativeDriver: true,
    }).start();
  }, [enter]);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: mode === 'dark' ? '#000' : homePalette.blue,
          opacity: enter,
          transform: [
            {
              translateY: enter.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
          ],
        },
        style
      ]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(49,231,216,0.13)', 'rgba(244,63,143,0.07)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.glassWash}
      />
      <View pointerEvents="none" style={styles.cornerGlow} />
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 4,
    overflow: 'hidden',
  },
  glassWash: {
    ...StyleSheet.absoluteFillObject,
  },
  cornerGlow: {
    position: 'absolute',
    width: 78,
    height: 78,
    borderRadius: 39,
    right: -34,
    top: -36,
    backgroundColor: 'rgba(23,124,255,0.12)',
  }
});
