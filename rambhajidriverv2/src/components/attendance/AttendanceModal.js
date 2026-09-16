// src/components/attendance/AttendanceModal.js
// Ultra-Premium 3-Color Signature Attendance Punch Modal
// Hits live API POST https://rambhaji.backend.shreenari.com/api/attendance/mark

import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import AttendanceService from '../../features/attendance/services/AttendanceService';
import { triggerHaptic, GlowingPulse } from '../common/Motion';
import { s, vs, ms } from '../../core/utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AttendanceModal({ visible, onClose, onSuccessNavigate }) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [alreadyMarked, setAlreadyMarked] = useState(false);

  // Pulse & scale animations
  const pulseScale = useRef(new Animated.Value(1)).current;
  const stampScale = useRef(new Animated.Value(0.7)).current;
  const stampOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Loop pulse on icon emblem
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, {
            toValue: 1.08,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Check if attendance is already marked for today
      const isMarked = AttendanceService.isAttendanceMarkedToday();
      if (isMarked) {
        setAlreadyMarked(true);
        setSuccessMsg('Attendance is already marked & active for today!');
        stampOpacity.setValue(1);
        stampScale.setValue(1);
      } else {
        setAlreadyMarked(false);
        setSuccessMsg(null);
      }
    }
  }, [visible]);

  const formattedDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const currentTimeStr = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const handleMarkAttendance = async () => {
    triggerHaptic('medium');
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const result = await AttendanceService.markAttendance();
    setLoading(false);

    if (result.success) {
      triggerHaptic('success');
      setAlreadyMarked(true);
      setSuccessMsg(result.message || 'Attendance marked successfully!');

      // Run success stamp animation
      Animated.parallel([
        Animated.spring(stampScale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(stampOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        if (onSuccessNavigate) {
          onSuccessNavigate();
        } else if (onClose) {
          onClose();
        }
      }, 1400);
    } else {
      const msg = result.message || '';
      if (msg.toLowerCase().includes('token') || msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('unauthorized')) {
        try {
          const { performForceLogout } = require('../../core/network/refreshInterceptor');
          performForceLogout('Session expired. Please login again.');
        } catch (e) {}
        return;
      }
      triggerHaptic('error');
      setErrorMsg(msg || 'Failed to mark attendance. Please try again.');
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={() => {
        if (alreadyMarked) {
          onSuccessNavigate ? onSuccessNavigate() : onClose && onClose();
        }
      }}
    >
      <View style={styles.overlay}>
        {/* Outer Glow Ring Card Wrapper */}
        <LinearGradient
          colors={alreadyMarked ? ['#10B981', '#059669', '#00B4D8'] : ['#1D4ED8', '#00B4D8', '#E024E3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBorderCard}
        >
          <View style={styles.cardInner}>
            {/* 🌟 Dynamic Hero Badge Emblem */}
            <View style={styles.heroBadgeContainer}>
              <Animated.View style={[styles.pulseOuterRing, { transform: [{ scale: pulseScale }], borderColor: alreadyMarked ? '#10B981' : '#00B4D8' }]} />
              <LinearGradient
                colors={alreadyMarked ? ['#10B981', '#059669'] : ['#1D4ED8', '#00B4D8', '#E024E3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroBadgeGradient}
              >
                <MaterialCommunityIcons name={alreadyMarked ? 'check-decagram' : 'fingerprint'} size={ms(38)} color="#FFFFFF" />
              </LinearGradient>
            </View>

            {/* Title & Subtitle */}
            <Text style={[styles.title, alreadyMarked && { color: '#065F46' }]}>
              {alreadyMarked ? "Attendance Verified" : "Daily Attendance Punch"}
            </Text>
            <Text style={styles.subtitle}>
              {alreadyMarked ? "Your shift & attendance are active for today." : "Punch attendance to unlock today's shift & dashboard"}
            </Text>

            {/* Live Shift Status Pill */}
            <View style={[styles.shiftStatusPill, alreadyMarked && { backgroundColor: '#ECFDF5', borderColor: '#10B981' }]}>
              <GlowingPulse color={alreadyMarked ? '#10B981' : '#22C55E'} borderWidth={2} duration={1800} style={{ marginRight: s(6) }}>
                <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: alreadyMarked ? '#10B981' : '#22C55E' }} />
              </GlowingPulse>
              <Text style={[styles.shiftStatusText, alreadyMarked && { color: '#065F46' }]}>
                {alreadyMarked ? "RAM BHAJI LOGISTICS • SHIFT VERIFIED" : "RAM BHAJI LOGISTICS • SHIFT MANDATORY"}
              </Text>
            </View>

            {/* Dual Glassmorphism Date & Time Chips */}
            <View style={styles.chipsRow}>
              <View style={styles.chipItem}>
                <View style={styles.chipIconBox}>
                  <Feather name="calendar" size={ms(15)} color="#00B4D8" />
                </View>
                <View>
                  <Text style={styles.chipLabel}>DATE</Text>
                  <Text style={styles.chipValueText}>{formattedDate}</Text>
                </View>
              </View>

              <View style={styles.chipItem}>
                <View style={[styles.chipIconBox, { backgroundColor: '#FDF4FF' }]}>
                  <Feather name="clock" size={ms(15)} color="#E024E3" />
                </View>
                <View>
                  <Text style={styles.chipLabel}>TIME</Text>
                  <Text style={[styles.chipValueText, { color: '#E024E3' }]}>{currentTimeStr}</Text>
                </View>
              </View>
            </View>

            {/* Error Banner */}
            {errorMsg && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={ms(18)} color="#EF4444" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Success Celebration Stamp */}
            {successMsg && (
              <Animated.View
                style={[
                  styles.successStampBox,
                  {
                    opacity: stampOpacity,
                    transform: [{ scale: stampScale }],
                  },
                ]}
              >
                <LinearGradient
                  colors={['#ECFDF5', '#D1FAE5']}
                  style={styles.stampGradient}
                >
                  <Ionicons name="shield-checkmark" size={ms(34)} color="#10B981" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stampTitle}>ATTENDANCE ALREADY MARKED!</Text>
                    <Text style={styles.stampSub}>{successMsg}</Text>
                  </View>
                </LinearGradient>
              </Animated.View>
            )}

            {/* Main Action Button */}
            {!alreadyMarked && !successMsg && (
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={loading}
                onPress={handleMarkAttendance}
                style={styles.btnShadowContainer}
              >
                <LinearGradient
                  colors={['#1D4ED8', '#00B4D8', '#E024E3']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.mainPunchBtn}
                >
                  {loading ? (
                    <View style={styles.btnRow}>
                      <ActivityIndicator color="#FFFFFF" size="small" />
                      <Text style={[styles.btnText, { marginLeft: s(10) }]}>VERIFYING PUNCH...</Text>
                    </View>
                  ) : (
                    <View style={styles.btnRow}>
                      <MaterialCommunityIcons name="hand-pointing-up" size={ms(22)} color="#FFFFFF" style={{ marginRight: s(8) }} />
                      <Text style={styles.btnText}>PUNCH ATTENDANCE NOW</Text>
                      <Feather name="arrow-right" size={ms(18)} color="#FFFFFF" style={{ marginLeft: s(6) }} />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Go to Dashboard CTA if Already Marked */}
            {alreadyMarked && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  triggerHaptic('medium');
                  if (onSuccessNavigate) {
                    onSuccessNavigate();
                  } else if (onClose) {
                    onClose();
                  }
                }}
                style={styles.btnShadowContainer}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.mainPunchBtn}
                >
                  <View style={styles.btnRow}>
                    <Ionicons name="checkmark-circle" size={ms(22)} color="#FFFFFF" style={{ marginRight: s(8) }} />
                    <Text style={styles.btnText}>GO TO DASHBOARD ➔</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 19, 43, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: s(20),
  },
  gradientBorderCard: {
    width: '100%',
    maxWidth: s(360),
    borderRadius: s(28),
    padding: 2.5, // 2.5px Multi-color gradient border stroke!
    elevation: 16,
    shadowColor: '#E024E3',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: s(24),
  },
  cardInner: {
    backgroundColor: '#F0F7FF',
    borderRadius: s(25.5),
    padding: s(22),
    alignItems: 'center',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: vs(14),
    right: s(14),
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  heroBadgeContainer: {
    width: ms(76),
    height: ms(76),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(12),
    marginTop: vs(6),
    position: 'relative',
  },
  pulseOuterRing: {
    position: 'absolute',
    width: ms(76),
    height: ms(76),
    borderRadius: ms(38),
    backgroundColor: 'rgba(0, 180, 216, 0.25)',
    borderWidth: 1.5,
    borderColor: '#00B4D8',
  },
  heroBadgeGradient: {
    width: ms(62),
    height: ms(62),
    borderRadius: ms(31),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: ms(8),
  },
  title: {
    fontSize: ms(21),
    fontWeight: '900',
    color: '#1D4ED8',
    textAlign: 'center',
    marginBottom: vs(4),
  },
  subtitle: {
    fontSize: ms(12),
    color: '#64748B',
    textAlign: 'center',
    marginBottom: vs(12),
    fontWeight: '600',
    paddingHorizontal: s(10),
  },
  shiftStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E9F5EF',
    borderRadius: s(20),
    paddingHorizontal: s(12),
    paddingVertical: vs(5),
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: vs(16),
  },
  shiftStatusText: {
    fontSize: ms(10),
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 0.6,
  },
  chipsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: s(10),
    marginBottom: vs(18),
  },
  chipItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    backgroundColor: '#FFFFFF',
    borderRadius: s(16),
    padding: s(10),
    borderWidth: 1.5,
    borderColor: '#00B4D8',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: s(6),
    elevation: 2,
  },
  chipIconBox: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(10),
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipLabel: {
    fontSize: ms(9),
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  chipValueText: {
    fontSize: ms(11),
    fontWeight: 'bold',
    color: '#1D4ED8',
    marginTop: vs(1),
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: s(14),
    padding: s(12),
    marginBottom: vs(14),
    width: '100%',
  },
  errorText: {
    fontSize: ms(12),
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
  },
  successStampBox: {
    width: '100%',
    borderRadius: s(16),
    overflow: 'hidden',
    marginBottom: vs(14),
    borderWidth: 1.5,
    borderColor: '#10B981',
    elevation: 4,
  },
  stampGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
    padding: s(14),
  },
  stampTitle: {
    fontSize: ms(13),
    fontWeight: '900',
    color: '#065F46',
    letterSpacing: 0.5,
  },
  stampSub: {
    fontSize: ms(11),
    fontWeight: '600',
    color: '#047857',
    marginTop: vs(2),
  },
  btnShadowContainer: {
    width: '100%',
    borderRadius: s(18),
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#E024E3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: s(12),
    marginBottom: vs(12),
  },
  mainPunchBtn: {
    height: vs(52),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: s(20),
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: ms(14),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  dashboardLinkBtn: {
    paddingVertical: vs(8),
    paddingHorizontal: s(14),
  },
  dashboardLinkText: {
    fontSize: ms(13),
    fontWeight: 'bold',
    color: '#00B4D8',
  },
});
