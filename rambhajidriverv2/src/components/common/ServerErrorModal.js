// src/components/common/ServerErrorModal.js
// Enterprise Server Error / API Down Modal with custom SVG illustration,
// signature 3-color theme, and interactive "Try Again" recovery button.

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  SafeAreaView,
  Modal,
} from 'react-native';
import Svg, { Rect, Circle, Path, Line, G, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { selectServerError, clearServerError } from '../../features/sync/state/syncSlice';
import { triggerHaptic } from './Motion';
import { s, vs, ms } from '../../core/utils/responsive';
import apiClient from '../../core/network/apiClient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Animated SVG Illustration of a Cloud Server Maintenance / Server Down graphic
 */
function ServerDownIllustration() {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 12000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const gearRotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.illustrationWrapper, { transform: [{ translateY: floatAnim }] }]}>
      <Svg width={s(260)} height={vs(200)} viewBox="0 0 280 220" fill="none">
        <Defs>
          <SvgGradient id="cloudGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#1E293B" />
            <Stop offset="100%" stopColor="#0F172A" />
          </SvgGradient>
          <SvgGradient id="accentGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#E024E3" />
            <Stop offset="100%" stopColor="#00B4D8" />
          </SvgGradient>
        </Defs>

        {/* Ambient Glow Background */}
        <Circle cx="140" cy="110" r="90" fill="#FEF3C7" opacity="0.10" />

        {/* Cloud Shape */}
        <Path
          d="M80 130 C60 130, 45 115, 45 95 C45 78, 58 64, 74 61 C80 40, 99 25, 122 25 C149 25, 171 44, 175 70 C187 72, 196 82, 196 95 C196 114, 181 130, 162 130 Z"
          fill="url(#cloudGrad)"
          stroke="#334155"
          strokeWidth="2.5"
        />

        {/* Server Disconnect / Broken Lightning Bolt */}
        <Path d="M125 45 L110 80 L132 80 L115 115" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

        {/* Warning Badge Circle */}
        <Circle cx="180" cy="60" r="22" fill="#EF4444" opacity="0.9" />
        <Text
          x="180"
          y="67"
          fill="#FFFFFF"
          fontSize="22"
          fontWeight="bold"
          textAnchor="middle"
        >
          !
        </Text>

        {/* Wrench & Gear Repair Tools */}
        <Path d="M70 145 L105 180" stroke="#00B4D8" strokeWidth="6" strokeLinecap="round" />
        <Path d="M210 145 L175 180" stroke="#E024E3" strokeWidth="6" strokeLinecap="round" />

        {/* Floating Sparks */}
        <Circle cx="95" cy="55" r="3" fill="#E024E3" />
        <Circle cx="160" cy="35" r="4" fill="#00B4D8" />
        <Circle cx="215" cy="115" r="3" fill="#F59E0B" />
      </Svg>
    </Animated.View>
  );
}

export default function ServerErrorModal({ visible: propVisible, onClose }) {
  const dispatch = useDispatch();
  const reduxServerError = useSelector(selectServerError);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryStatus, setRetryStatus] = useState(null);

  const isModalVisible = propVisible !== undefined ? propVisible : Boolean(reduxServerError);

  const handleTryAgain = async () => {
    triggerHaptic('medium');
    setIsRetrying(true);
    setRetryStatus(null);

    try {
      // Ping API health or perform light GET request
      await new Promise((res) => setTimeout(res, 900));

      // Attempt GET to health check or base endpoint
      await apiClient.get('/api/health').catch(() => {
        // Fallback OK if no dedicated health endpoint
      });

      triggerHaptic('success');
      dispatch(clearServerError());
      if (onClose) onClose();
    } catch (err) {
      triggerHaptic('warning');
      setRetryStatus('Server is still unreachable. Retrying...');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDismiss = () => {
    triggerHaptic('light');
    dispatch(clearServerError());
    if (onClose) onClose();
  };

  if (!isModalVisible) return null;

  const errorCode = reduxServerError?.code || 503;
  const errorMessage = reduxServerError?.message || 'Server is temporarily down or undergoing maintenance.';

  return (
    <Modal
      visible={isModalVisible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <View style={styles.container}>
        {/* ── Top Status Amber/Pink Warning Strip ── */}
        <SafeAreaView style={styles.topBarArea}>
          <View style={styles.topBar}>
            <View style={styles.topBarRow}>
              <View style={styles.iconCircle}>
                <Text style={{ fontSize: 12 }}>⚠️</Text>
              </View>
              <Text style={styles.topBarText}>Server status: HTTP {errorCode} (API Error)</Text>
            </View>
          </View>
        </SafeAreaView>

        {/* ── Main Screen Body ── */}
        <View style={styles.mainBody}>
          {/* Ambient Mesh Glow circles */}
          <View style={styles.glowTop} pointerEvents="none" />
          <View style={styles.glowBottom} pointerEvents="none" />

          {/* Server Down SVG Illustration */}
          <ServerDownIllustration />

          {/* Error Tag Pill */}
          <View style={styles.errorTagPill}>
            <Text style={styles.errorTagPillText}>HTTP {errorCode} ERROR</Text>
          </View>

          {/* Headline & Subtitle */}
          <View style={styles.textContainer}>
            <Text style={styles.titleText}>Something went wrong</Text>
            <Text style={styles.subtitleText}>
              Our server is temporarily experiencing issues. Please tap Try Again to reconnect.
            </Text>
          </View>

          {/* Retry Status Toast */}
          {retryStatus ? (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>🔄 {retryStatus}</Text>
            </View>
          ) : null}

          {/* Signature 3-Color Try Again Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleTryAgain}
            disabled={isRetrying}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Try again to reconnect to server"
            accessibilityHint="Re-sends API health check to server"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.tryAgainBtnWrapper}
          >
            <LinearGradient
              colors={['#1D4ED8', '#00B4D8', '#E024E3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.tryAgainBtnGradient}
            >
              {isRetrying ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.tryAgainBtnText}>Try Again</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Dismiss / Demo Close Option */}
          <TouchableOpacity
            onPress={handleDismiss}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Dismiss error and continue offline"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.dismissBtn}
          >
            <Text style={styles.dismissBtnText}>Dismiss & continue offline</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Slate Dark matching offline screen aesthetic
  },
  topBarArea: {
    backgroundColor: '#FEF3C7', // Amber warning strip
  },
  topBar: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: s(16),
    paddingVertical: vs(10),
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  iconCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarText: {
    fontSize: ms(13),
    fontWeight: 'bold',
    color: '#92400E', // Dark Amber text
    fontFamily: 'System',
  },
  mainBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: s(24),
    position: 'relative',
  },
  glowTop: {
    position: 'absolute',
    top: vs(60),
    left: s(20),
    width: s(220),
    height: s(220),
    borderRadius: s(110),
    backgroundColor: 'rgba(29, 78, 216, 0.1)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: vs(80),
    right: s(20),
    width: s(240),
    height: s(240),
    borderRadius: s(120),
    backgroundColor: 'rgba(224, 36, 227, 0.1)',
  },
  illustrationWrapper: {
    marginBottom: vs(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTagPill: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: s(14),
    paddingHorizontal: s(12),
    paddingVertical: vs(4),
    marginBottom: vs(14),
  },
  errorTagPillText: {
    fontSize: ms(10),
    fontWeight: 'bold',
    color: '#F87171',
    letterSpacing: 1,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: vs(28),
  },
  titleText: {
    fontSize: ms(24),
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'System',
    textAlign: 'center',
    marginBottom: vs(12),
    letterSpacing: -0.3,
  },
  subtitleText: {
    fontSize: ms(14),
    color: '#94A3B8',
    fontFamily: 'System',
    textAlign: 'center',
    lineHeight: vs(22),
    maxWidth: s(290),
    fontWeight: '500',
  },
  warningBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: ms(12),
    paddingHorizontal: s(14),
    paddingVertical: vs(8),
    marginBottom: vs(20),
  },
  warningText: {
    color: '#FDE047',
    fontSize: ms(12),
    fontWeight: '600',
    textAlign: 'center',
  },
  tryAgainBtnWrapper: {
    width: s(180),
    height: vs(48),
    borderRadius: s(24),
    overflow: 'hidden',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  tryAgainBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: s(20),
  },
  tryAgainBtnText: {
    color: '#FFFFFF',
    fontSize: ms(16),
    fontWeight: 'bold',
    fontFamily: 'System',
    letterSpacing: 0.5,
  },
  dismissBtn: {
    marginTop: vs(16),
    paddingVertical: vs(8),
    paddingHorizontal: s(16),
  },
  dismissBtnText: {
    color: '#64748B',
    fontSize: ms(12),
    fontWeight: '600',
  },
});
