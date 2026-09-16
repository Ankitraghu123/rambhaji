import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { themeTokens, radius } from '../constants/theme';
import { useAppStore } from '../store/UseAppStore';

export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  style,
  textStyle,
  iconLeft,
  iconRight,
  disabled = false,
  loading = false
}) {
  const mode = useAppStore((s) => s.themeMode);
  const colors = themeTokens[mode];
  const press = useRef(new Animated.Value(0)).current;
  const ripple = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  const bg = variant === 'secondary' ? colors.surfaceAlt : 'transparent';

  const borderColor =
    variant === 'primary'
      ? 'rgba(255,255,255,0.28)'
      : variant === 'secondary'
        ? colors.border
        : 'transparent';

  const textColor =
    variant === 'primary'
      ? '#fff'
      : variant === 'secondary'
        ? colors.text
        : colors.primary;

  useEffect(() => {
    if (!loading) {
      spin.setValue(0);
      return undefined;
    }

    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 760,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [loading, spin]);

  const animatePress = (toValue) => {
    Animated.spring(press, {
      toValue,
      speed: 28,
      bounciness: 8,
      useNativeDriver: true,
    }).start();
  };

  const handlePressIn = () => {
    if (disabled || loading) return;
    animatePress(1);
    ripple.setValue(0);
    Animated.timing(ripple, {
      toValue: 1,
      duration: 520,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    animatePress(0);
  };

  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.selectionAsync().catch(() => {});
    onPress?.();
  };

  const spinRotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.motionWrap,
        {
          opacity: disabled ? 0.5 : 1,
          transform: [
            {
              scale: press.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.965],
              }),
            },
            {
              translateY: press.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
            },
          ],
        },
      ]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          styles.button,
          { backgroundColor: bg, borderColor },
          variant === 'ghost' && styles.ghost,
          style,
        ]}
      >
        {variant === 'primary' && (
          <LinearGradient
            pointerEvents="none"
            colors={[colors.primary, colors.accent || '#F43F8F', colors.aqua || '#31E7D8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        {variant === 'secondary' && (
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255,255,255,0.94)', 'rgba(231,241,255,0.9)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ripple,
            {
              backgroundColor: variant === 'primary' ? '#FFFFFF' : colors.primary,
              opacity: ripple.interpolate({
                inputRange: [0, 0.25, 1],
                outputRange: [0, 0.2, 0],
              }),
              transform: [
                {
                  scale: ripple.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.2, 2.4],
                  }),
                },
              ],
            },
          ]}
        />
        <View style={styles.row}>
          {loading ? (
            <Animated.View style={{ transform: [{ rotate: spinRotate }] }}>
              <MaterialCommunityIcons name="loading" size={18} color={textColor} />
            </Animated.View>
          ) : (
            typeof iconLeft === 'string' ? <MaterialCommunityIcons name={iconLeft} size={20} color={textColor} /> : iconLeft
          )}
          <Text style={[styles.text, { color: textColor }, textStyle]}>{title}</Text>
          {!loading && (
            typeof iconRight === 'string' ? <MaterialCommunityIcons name={iconRight} size={20} color={textColor} /> : iconRight
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  motionWrap: {
    borderRadius: radius.lg,
    shadowColor: '#177CFF',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 3,
  },
  button: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 17,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden'
  },
  ghost: {
    borderWidth: 0
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 1
  },
  text: {
    fontSize: 14,
    fontWeight: '900'
  },
  ripple: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43
  }
});
