// src/components/common/SwipeToConfirmButton.js
// Clean, standard and modern Action Button for Navigation / Delivery.

import React from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { triggerHaptic } from './Motion';

/**
 * Normal, clean and responsive Action Button
 *
 * @param {Object} props
 * @param {Function} props.onConfirm - Callback triggered on press
 * @param {Function} [props.onPress] - Alias for onConfirm
 * @param {string} [props.title] - Button text
 * @param {string} [props.icon] - Icon emoji (default: '🚀')
 * @param {boolean} [props.disabled] - Disabled state
 * @param {number} [props.height] - Button height (default: 50)
 * @param {Object} [props.style] - Custom wrapper style
 */
export default function SwipeToConfirmButton({
  onConfirm,
  onPress,
  title = "Start Navigation & Delivery",
  icon = "🚀",
  disabled = false,
  height = 50,
  style,
}) {
  const handlePress = () => {
    if (disabled) return;
    triggerHaptic('medium');
    const action = onConfirm || onPress;
    if (action) {
      action();
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={handlePress}
      disabled={disabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint="Double tap to execute action"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={[
        styles.buttonWrapper,
        { minHeight: 48, height: Math.max(height, 48) },
        disabled && styles.disabled,
        style,
      ]}
    >
      <LinearGradient
        colors={['#1D4ED8', '#00B4D8', '#E024E3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <View style={styles.contentRow}>
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
          <Text style={styles.titleText} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.arrow}>➜</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonWrapper: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#00B4D8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 3,
  },
  disabled: {
    opacity: 0.6,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 18,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  arrow: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 2,
  },
});
