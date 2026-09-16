// src/components/common/LocationSuccessModal.js
// Premium location tagging success dialog inspired by Uber Driver and Blinkit Rider apps

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { s, vs, ms } from '../../core/utils/responsive';
import { triggerHaptic, AnimatedSVGDraw } from './Motion';

export default function LocationSuccessModal({ visible, onClose }) {
  // Modal layout animations
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(300)).current;
  const sheetScale = useRef(new Animated.Value(0.95)).current;

  // Concentric GPS pulsing rings
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;

  // Auto-dismiss timeout ref
  const autoCloseTimeout = useRef(null);

  useEffect(() => {
    if (visible) {
      // Trigger haptic feedback
      triggerHaptic('notificationSuccess');

      // Entrance animation sequence
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(sheetScale, {
          toValue: 1,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // GPS pulse loops
      Animated.loop(
        Animated.timing(ring1, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(1000),
          Animated.timing(ring2, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Set auto-dismiss after 2.8 seconds
      autoCloseTimeout.current = setTimeout(() => {
        handleDismiss();
      }, 2800);
    } else {
      // Reset values
      backdropOpacity.setValue(0);
      sheetTranslateY.setValue(300);
      sheetScale.setValue(0.95);
      ring1.setValue(0);
      ring2.setValue(0);
      if (autoCloseTimeout.current) {
        clearTimeout(autoCloseTimeout.current);
      }
    }

    return () => {
      if (autoCloseTimeout.current) {
        clearTimeout(autoCloseTimeout.current);
      }
    };
  }, [visible]);

  const handleDismiss = () => {
    triggerHaptic('light');
    if (autoCloseTimeout.current) {
      clearTimeout(autoCloseTimeout.current);
    }

    // Exit animation sequence
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 350,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(sheetScale, {
        toValue: 0.95,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  // Interpolated scaling/opacities for pulsing rings
  const ringScale1 = ring1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.2],
  });
  const ringOpacity1 = ring1.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0.6, 0.3, 0],
  });

  const ringScale2 = ring2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.2],
  });
  const ringOpacity2 = ring2.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0.6, 0.3, 0],
  });

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        {/* Backdrop Tap dismiss */}
        <Animated.View
          style={[styles.backdrop, { opacity: backdropOpacity }]}
        >
          <TouchableOpacity
            style={styles.backdropTap}
            activeOpacity={1}
            onPress={handleDismiss}
          />
        </Animated.View>

        {/* Success Modal Container */}
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY: sheetTranslateY }, { scale: sheetScale }],
            },
          ]}
        >
          {/* Header pulsing GPS */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              {/* Outer pulsing ring 1 */}
              <Animated.View
                style={[
                  styles.pulseRing,
                  { transform: [{ scale: ringScale1 }], opacity: ringOpacity1 },
                ]}
              />
              {/* Outer pulsing ring 2 */}
              <Animated.View
                style={[
                  styles.pulseRing,
                  { transform: [{ scale: ringScale2 }], opacity: ringOpacity2 },
                ]}
              />
              {/* Central Pin Circle */}
              <View style={styles.pinCircle}>
                <Text style={styles.pinIcon}>📍</Text>
              </View>

              {/* Corner Success checkmark indicator */}
              <View style={styles.checkmarkBadge}>
                {visible && (
                  <AnimatedSVGDraw
                    size={ms(12)}
                    color="#FFFFFF"
                    strokeWidth={3}
                    duration={350}
                  />
                )}
              </View>
            </View>
          </View>

          {/* Titles */}
          <Text style={styles.title}>Location Updated Successfully</Text>
          <Text style={styles.subtitle}>
            Customer delivery location has been saved and synced successfully.
          </Text>

          {/* Information Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>• GPS Status</Text>
              <View style={[styles.badge, styles.successBadge]}>
                <Text style={styles.badgeText}>Verified</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>• Sync Status</Text>
              <View style={[styles.badge, styles.successBadge]}>
                <Text style={styles.badgeText}>Synced</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>• Updated Time</Text>
              <View style={[styles.badge, styles.timeBadge]}>
                <Text style={[styles.badgeText, styles.timeBadgeText]}>Just Now</Text>
              </View>
            </View>
          </View>

          {/* Continue Action Button */}
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={handleDismiss}
            activeOpacity={0.8}
          >
            <Text style={styles.continueBtnText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(31, 41, 55, 0.45)',
  },
  backdropTap: {
    flex: 1,
  },
  container: {
    width: s(350),
    backgroundColor: '#FFFFFF',
    borderRadius: s(24),
    paddingHorizontal: s(24),
    paddingVertical: vs(24),
    marginBottom: vs(36),
    alignItems: 'center',
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: s(20),
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    height: vs(80),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(16),
  },
  iconContainer: {
    width: s(64),
    height: vs(64),
    borderRadius: s(32),
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: s(64),
    height: vs(64),
    borderRadius: s(32),
    backgroundColor: 'rgba(34, 197, 94, 0.35)',
    borderWidth: 1.5,
    borderColor: '#22C55E',
  },
  pinCircle: {
    width: s(48),
    height: vs(48),
    borderRadius: s(24),
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: s(6),
    elevation: 2,
    zIndex: 2,
  },
  pinIcon: {
    fontSize: ms(20),
  },
  checkmarkBadge: {
    position: 'absolute',
    bottom: -vs(2),
    right: -s(2),
    width: s(20),
    height: vs(20),
    borderRadius: s(10),
    backgroundColor: '#166534',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 3,
  },
  title: {
    fontSize: ms(18),
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: vs(6),
  },
  subtitle: {
    fontSize: ms(12),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: vs(16),
    marginBottom: vs(20),
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: s(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: s(16),
    paddingVertical: vs(10),
    marginBottom: vs(20),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: vs(8),
  },
  infoLabel: {
    fontSize: ms(12),
    fontWeight: '600',
    color: '#1F2937',
  },
  badge: {
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: s(12),
    borderWidth: 1,
  },
  successBadge: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  badgeText: {
    fontSize: ms(10),
    fontWeight: 'bold',
    color: '#16A34A',
  },
  timeBadge: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E5E7EB',
  },
  timeBadgeText: {
    color: '#64748B',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  continueBtn: {
    width: '100%',
    backgroundColor: '#166534',
    borderRadius: s(14),
    paddingVertical: vs(14),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: s(8),
    elevation: 3,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: ms(14),
    fontWeight: 'bold',
  },
});
