// src/components/branding/DynamicHeader.js
// Modern, enterprise-grade themed header component matching Blinkit/Zepto standards.

import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useDynamicBranding } from '../../core/branding/useDynamicBranding';
import { AnimatedPressable } from '../common/Motion';
import LogoOverlay from './LogoOverlay';

const DynamicHeader = memo(function DynamicHeader({ driverName = 'Driver', initialLetter = 'D', notificationCount = 0 }) {
  const { themeColors, overlayConfig } = useDynamicBranding();

  // Dynamic time greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <View style={styles.headerContainer}>
      {/* Dynamic Ambient Overlay */}
      <LogoOverlay type={overlayConfig.type} />

      <View style={styles.headerLeft}>
        {/* Profile Avatar Button with 3-Color Gradient & Active Status Indicator */}
        <AnimatedPressable onPress={() => router.push('/(tabs)/profile')} style={styles.avatarWrapper}>
          <LinearGradient
            colors={['#1D4ED8', '#00B4D8', '#E024E3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarInitial}>
              {initialLetter}
            </Text>
          </LinearGradient>
          {/* Active Online Status Badge Dot */}
          <View style={styles.activeStatusDot} />
        </AnimatedPressable>

        {/* Dynamic Driver Greeting & Name */}
        <View style={styles.welcomeColumn}>
          <View style={styles.greetingRow}>
            <Text numberOfLines={1} style={styles.greetingText}>
              {greeting.toUpperCase()}
            </Text>
            <Text style={styles.waveEmoji}>👋</Text>
          </View>
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.driverName}>
            {driverName}
          </Text>
        </View>
      </View>

      <View style={styles.headerRight}>
        {/* Enterprise Live Shift Pill Badge */}
        <View style={styles.shiftBadge}>
          <View style={styles.shiftPulseDot} />
          <Text style={styles.shiftBadgeText}>ON SHIFT</Text>
        </View>
      </View>
    </View>
  );
});

export default DynamicHeader;

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    position: 'relative',
    overflow: 'hidden',
    height: 74,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 5,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 5,
  },
  avatarWrapper: {
    position: 'relative',
    width: 44,
    height: 44,
  },
  avatarGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00B4D8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  activeStatusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#00B4D8',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  welcomeColumn: {
    justifyContent: 'center',
    flexShrink: 1,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  greetingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  waveEmoji: {
    fontSize: 12,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  shiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  shiftPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#00B4D8',
  },
  shiftBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  notifIcon: {
    fontSize: 17,
  },
  notifBadge: {
    position: 'absolute',
    right: -2,
    top: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 5,
    height: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
});
