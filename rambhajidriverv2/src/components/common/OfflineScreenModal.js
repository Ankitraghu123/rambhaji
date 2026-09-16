// src/components/common/OfflineScreenModal.js
// Enterprise Offline Screen Modal matching user requested screen layout.
// Features top status banner, animated server SVG illustration, signature 3-color palette, and instant retry check.

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
import { selectIsOnline, setNetworkStatus } from '../../features/sync/state/syncSlice';
import NetworkMonitor from '../../core/network/NetworkMonitor';
import { triggerHaptic, PulsingDot } from './Motion';
import { s, vs, ms } from '../../core/utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Animated SVG Illustration matching the user's server rack & technician connection graphic
 */
function NetworkServerIllustration() {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -6,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.illustrationWrapper, { transform: [{ translateY: floatAnim }] }]}>
      <Svg width={s(260)} height={vs(200)} viewBox="0 0 280 220" fill="none">
        <Defs>
          <SvgGradient id="serverGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#1E293B" />
            <Stop offset="100%" stopColor="#0F172A" />
          </SvgGradient>
          <SvgGradient id="screenGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#00B4D8" />
            <Stop offset="100%" stopColor="#1D4ED8" />
          </SvgGradient>
          <SvgGradient id="cableGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#E024E3" />
            <Stop offset="100%" stopColor="#00B4D8" />
          </SvgGradient>
        </Defs>

        {/* Backdrop Ambient Circle Glow */}
        <Circle cx="140" cy="110" r="95" fill="#FFE4E6" opacity="0.12" />

        {/* Server Tower Rack */}
        <Rect x="135" y="35" width="75" height="135" rx="8" fill="url(#serverGrad)" stroke="#334155" strokeWidth="2" />
        
        {/* Server Rack LED Lines */}
        <Circle cx="148" cy="50" r="3" fill="#E024E3" />
        <Circle cx="158" cy="50" r="3" fill="#00B4D8" />
        <Circle cx="168" cy="50" r="3" fill="#1D4ED8" />

        <Rect x="145" y="60" width="55" height="4" rx="2" fill="#334155" />
        <Rect x="145" y="68" width="35" height="4" rx="2" fill="#334155" />
        <Rect x="145" y="76" width="45" height="4" rx="2" fill="#00B4D8" />

        <Rect x="145" y="90" width="55" height="4" rx="2" fill="#334155" />
        <Rect x="145" y="98" width="40" height="4" rx="2" fill="#E024E3" />
        <Rect x="145" y="106" width="50" height="4" rx="2" fill="#334155" />

        <Rect x="145" y="120" width="55" height="4" rx="2" fill="#334155" />
        <Rect x="145" y="128" width="45" height="4" rx="2" fill="#00B4D8" />
        <Rect x="145" y="136" width="30" height="4" rx="2" fill="#334155" />

        {/* Standing Person / Technician 1 */}
        {/* Head */}
        <Circle cx="95" cy="70" r="10" fill="#E024E3" />
        {/* Body */}
        <Path d="M85 85 Q95 80 105 85 L100 135 L90 135 Z" fill="#38BDF8" />
        {/* Laptop Desk */}
        <Rect x="100" y="102" width="22" height="14" rx="2" fill="url(#screenGrad)" />
        <Line x1="111" y1="116" x2="111" y2="135" stroke="#475569" strokeWidth="3" />

        {/* Sitting Person / Technician 2 */}
        {/* Head */}
        <Circle cx="215" cy="120" r="10" fill="#38BDF8" />
        {/* Body */}
        <Path d="M205 135 Q215 130 225 135 L220 170 L210 170 Z" fill="#E024E3" />

        {/* Connected Cable / Cable Wire */}
        <Path d="M120 115 C135 150, 160 175, 195 155" fill="none" stroke="url(#cableGrad)" strokeWidth="3" strokeDasharray="4 2" />
        
        {/* Disconnected Pulse Beacon Warning */}
        <Circle cx="195" cy="155" r="7" fill="#EF4444" opacity="0.8" />
        <Circle cx="195" cy="155" r="12" stroke="#EF4444" strokeWidth="1.5" fill="none" opacity="0.4" />
      </Svg>
    </Animated.View>
  );
}

export default function OfflineScreenModal({ visible: propVisible, onClose }) {
  const dispatch = useDispatch();
  const reduxIsOnline = useSelector(selectIsOnline);
  const [isChecking, setIsChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Modal visibility is controlled by Redux or explicit prop override
  const isModalVisible = propVisible !== undefined ? propVisible : !reduxIsOnline;

  const handleRefresh = async () => {
    triggerHaptic('medium');
    setIsChecking(true);
    setStatusMessage(null);

    try {
      const onlineState = await NetworkMonitor.isOnline();
      
      // Delay slightly for smooth loader feedback
      await new Promise(res => setTimeout(res, 800));

      if (onlineState) {
        triggerHaptic('success');
        dispatch(setNetworkStatus(true));
        if (onClose) onClose();
      } else {
        triggerHaptic('warning');
        setStatusMessage('Still offline. Please check your Wi-Fi or mobile data.');
        dispatch(setNetworkStatus(false));
      }
    } catch (e) {
      triggerHaptic('warning');
      setStatusMessage('Network check failed. Try again.');
    } finally {
      setIsChecking(false);
    }
  };

  if (!isModalVisible) return null;

  return (
    <Modal
      visible={isModalVisible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      onRequestClose={() => {
        // Prevent accidental closing while offline
      }}
    >
      <View style={styles.container}>
        {/* ── Top Status Pink/Magenta Strip ── */}
        <SafeAreaView style={styles.topBarArea}>
          <View style={styles.topBar}>
            <View style={styles.topBarRow}>
              <View style={styles.iconCircle}>
                <Text style={{ fontSize: 12 }}>⛔</Text>
              </View>
              <Text style={styles.topBarText}>Network offline.</Text>
            </View>
          </View>
        </SafeAreaView>

        {/* ── Main Screen Body ── */}
        <View style={styles.mainBody}>
          {/* Ambient Glow background circles */}
          <View style={styles.glowTop} pointerEvents="none" />
          <View style={styles.glowBottom} pointerEvents="none" />

          {/* Server & Technician Network Graphic */}
          <NetworkServerIllustration />

          {/* Headline & Subtitle */}
          <View style={styles.textContainer}>
            <Text style={styles.titleText}>No internet connection</Text>
            <Text style={styles.subtitleText}>
              Check your connection, then refresh the page.
            </Text>
          </View>

          {/* Warning Message if still offline after refresh */}
          {statusMessage ? (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>⚠️ {statusMessage}</Text>
            </View>
          ) : null}

          {/* Signature 3-Color Refresh Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleRefresh}
            disabled={isChecking}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Refresh network connection"
            accessibilityHint="Re-checks internet connection state"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.refreshBtnWrapper}
          >
            <LinearGradient
              colors={['#1D4ED8', '#00B4D8', '#E024E3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.refreshBtnGradient}
            >
              {isChecking ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.refreshBtnText}>Refresh</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Slate Dark background matching screenshot
  },
  topBarArea: {
    backgroundColor: '#FFE4E6', // Pink/Magenta status strip
  },
  topBar: {
    backgroundColor: '#FFE4E6',
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
    color: '#9F1239', // Dark Rose text
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
    backgroundColor: 'rgba(0, 180, 216, 0.08)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: vs(80),
    right: s(20),
    width: s(240),
    height: s(240),
    borderRadius: s(120),
    backgroundColor: 'rgba(224, 36, 227, 0.08)',
  },
  illustrationWrapper: {
    marginBottom: vs(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: vs(32),
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
    maxWidth: s(280),
    fontWeight: '500',
  },
  warningBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: ms(12),
    paddingHorizontal: s(14),
    paddingVertical: vs(8),
    marginBottom: vs(20),
  },
  warningText: {
    color: '#FCA5A5',
    fontSize: ms(12),
    fontWeight: '600',
    textAlign: 'center',
  },
  refreshBtnWrapper: {
    width: s(180),
    height: vs(48),
    borderRadius: s(24),
    overflow: 'hidden',
    shadowColor: '#00B4D8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  refreshBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: s(20),
  },
  refreshBtnText: {
    color: '#FFFFFF',
    fontSize: ms(16),
    fontWeight: 'bold',
    fontFamily: 'System',
    letterSpacing: 0.5,
  },
});
