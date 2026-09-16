import React, { useEffect, useRef, useState } from 'react';
import { Animated, TextInput, StyleSheet, View } from 'react-native';
import { themeTokens, radius } from '../constants/theme';
import { useAppStore } from '../store/UseAppStore';

export default function Input({ label, style, onFocus, onBlur, value, defaultValue, placeholder, ...props }) {
  const mode = useAppStore((s) => s.themeMode);
  const colors = themeTokens[mode];
  const [focused, setFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(value || defaultValue ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: focused || !!value || !!defaultValue ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [defaultValue, focusAnim, focused, value]);

  const labelStyle = {
    color: focusAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [colors.textMuted, colors.primary],
    }),
    top: focusAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [17, 7],
    }),
    fontSize: focusAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [14, 11],
    }),
  };

  return (
    <View style={[styles.wrap, style]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          {
            borderColor: colors.primary,
            opacity: focusAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.16],
            }),
            transform: [
              {
                scale: focusAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.98, 1.02],
                }),
              },
            ],
          },
        ]}
      />
      {!!label && <Animated.Text style={[styles.label, labelStyle]}>{label}</Animated.Text>}
      <TextInput
        placeholder={focused || !label ? placeholder : ''}
        placeholderTextColor={colors.textMuted}
        value={value}
        defaultValue={defaultValue}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          styles.input,
          {
            color: colors.text,
            borderColor: focused ? colors.primary : colors.border,
            backgroundColor: mode === 'dark' ? colors.surfaceAlt : '#fff',
            paddingTop: label ? 18 : 0,
          }
        ]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: {
    position: 'absolute',
    left: 15,
    zIndex: 2,
    fontWeight: '800',
    backgroundColor: 'transparent'
  },
  input: {
    minHeight: 56,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14
  },
  glow: {
    position: 'absolute',
    left: -3,
    right: -3,
    top: -3,
    bottom: -3,
    borderRadius: radius.lg + 4,
    borderWidth: 6
  }
});
