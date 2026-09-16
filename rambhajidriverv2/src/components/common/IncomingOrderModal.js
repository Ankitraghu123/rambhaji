// src/components/common/IncomingOrderModal.js
// 🛵 New Incoming Order Modal — Zomato/Swiggy-style animated accept/reject popup
// Slides up from bottom, 30-second countdown, auto-rejects if no action

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing, Dimensions,
  TouchableOpacity, Modal, Vibration,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectIncomingOrder,
  acceptIncomingOrder,
  rejectIncomingOrder,
} from '../../features/routes/state/routeSlice';

const { width: W, height: H } = Dimensions.get('window');
const COUNTDOWN_SECONDS = 30;

// ─── Circular Countdown Ring ───────────────────────────────────────────────────
function CountdownRing({ seconds, total }) {
  const RADIUS = 30;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const progress = seconds / total;
  // Simulate stroke-dashoffset with a simple arc overlay using Animated
  const urgency = seconds <= 10;

  return (
    <View style={ringStyles.container}>
      {/* Background ring */}
      <View style={[ringStyles.bgRing, { borderColor: urgency ? '#FEE2E2' : '#E9F5EF' }]} />
      {/* Countdown number */}
      <Text style={[ringStyles.number, { color: urgency ? '#DC2626' : '#2E9D6A' }]}>
        {seconds}
      </Text>
      {/* Unit label */}
      <Text style={[ringStyles.unit, { color: urgency ? '#DC2626' : '#7E7A74' }]}>sec</Text>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  container: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  bgRing: {
    position: 'absolute',
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 5,
  },
  number: { fontSize: 22, fontWeight: 'bold', lineHeight: 26 },
  unit: { fontSize: 9, fontWeight: '600', marginTop: -2 },
});

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function IncomingOrderModal() {
  const dispatch = useDispatch();
  const order = useSelector(selectIncomingOrder);

  const slideY = useRef(new Animated.Value(H)).current;
  const backdropOp = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const bellRotate = useRef(new Animated.Value(0)).current;
  const urgencyFlash = useRef(new Animated.Value(1)).current;

  const [seconds, setSeconds] = useState(COUNTDOWN_SECONDS);
  const timerRef = useRef(null);
  const isVisible = !!order;

  // ── Open animation
  const openModal = useCallback(() => {
    setSeconds(COUNTDOWN_SECONDS);
    // Slide up
    Animated.spring(slideY, {
      toValue: 0, tension: 65, friction: 11, useNativeDriver: true,
    }).start();
    // Backdrop fade in
    Animated.timing(backdropOp, {
      toValue: 1, duration: 300, useNativeDriver: true,
    }).start();
    // Bell ring on open
    Animated.sequence([
      Animated.timing(bellRotate, { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.timing(bellRotate, { toValue: -1, duration: 80, useNativeDriver: true }),
      Animated.timing(bellRotate, { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.timing(bellRotate, { toValue: -1, duration: 80, useNativeDriver: true }),
      Animated.timing(bellRotate, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
    // Pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, { toValue: 1.06, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseScale, { toValue: 1.0, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
    // Vibrate on new order
    try { Vibration.vibrate([0, 300, 150, 300]); } catch (_) {}
  }, []);

  // ── Close animation
  const closeModal = useCallback((cb) => {
    Animated.parallel([
      Animated.timing(slideY, { toValue: H, duration: 320, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(backdropOp, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start(() => { if (cb) cb(); });
    pulseScale.stopAnimation();
  }, []);

  // ── Urgency flash when <= 10 seconds
  useEffect(() => {
    if (seconds <= 10 && isVisible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(urgencyFlash, { toValue: 0.85, duration: 400, useNativeDriver: true }),
          Animated.timing(urgencyFlash, { toValue: 1, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    } else {
      urgencyFlash.stopAnimation();
      urgencyFlash.setValue(1);
    }
  }, [seconds <= 10, isVisible]);

  // ── Modal visibility effect
  useEffect(() => {
    if (isVisible) {
      openModal();
      // Start countdown
      timerRef.current = setInterval(() => {
        setSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            closeModal(() => dispatch(rejectIncomingOrder()));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      slideY.setValue(H);
      backdropOp.setValue(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isVisible]);

  const handleAccept = () => {
    clearInterval(timerRef.current);
    try { Vibration.vibrate(100); } catch (_) {}
    closeModal(() => dispatch(acceptIncomingOrder()));
  };

  const handleReject = () => {
    clearInterval(timerRef.current);
    closeModal(() => dispatch(rejectIncomingOrder()));
  };

  if (!isVisible) return null;

  const bellSpin = bellRotate.interpolate({ inputRange: [-1, 1], outputRange: ['-20deg', '20deg'] });
  const isUrgent = seconds <= 10;

  // Parse item names for display
  const displayItems = (order?.items || []).slice(0, 3);

  return (
    <Modal transparent visible={isVisible} animationType="none" statusBarTranslucent>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOp }]} />

      {/* Slide-up card */}
      <Animated.View style={[styles.container, { transform: [{ translateY: slideY }] }]}>

        {/* Top Handle */}
        <View style={styles.handle} />

        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Animated.Text style={[styles.bellIcon, { transform: [{ rotate: bellSpin }] }]}>🔔</Animated.Text>
            <View>
              <Text style={styles.newOrderLabel}>NEW ORDER INCOMING</Text>
              <Text style={styles.urgencyText}>
                {isUrgent ? '⚠️ Respond quickly!' : 'Accept to start delivery'}
              </Text>
            </View>
          </View>

          {/* Countdown ring */}
          <Animated.View style={{ opacity: isUrgent ? urgencyFlash : 1 }}>
            <CountdownRing seconds={seconds} total={COUNTDOWN_SECONDS} />
          </Animated.View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Order Details */}
        <Animated.View style={[styles.orderCard, { transform: [{ scale: pulseScale }] }]}>

          {/* Customer */}
          <View style={styles.customerRow}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerAvatarText}>{order?.customerName?.[0]?.toUpperCase() || 'C'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName}>{order?.customerName || 'Customer'}</Text>
              <Text style={styles.addressText} numberOfLines={2}>📍 {order?.address || 'Loading address...'}</Text>
            </View>
          </View>

          {/* Items */}
          {displayItems.length > 0 && (
            <View style={styles.itemsRow}>
              {displayItems.map((item, i) => (
                <View key={i} style={styles.itemChip}>
                  <Text style={styles.itemChipText} numberOfLines={1}>
                    {item.name || item.productName || item.category || 'Item'}
                  </Text>
                </View>
              ))}
              {(order?.items?.length || 0) > 3 && (
                <View style={[styles.itemChip, styles.moreChip]}>
                  <Text style={styles.itemChipText}>+{order.items.length - 3} more</Text>
                </View>
              )}
            </View>
          )}

          {/* Payment badge */}
          <View style={styles.paymentRow}>
            <View style={[styles.payBadge, order?.paymentMode === 'COD' ? styles.codBadge : styles.prepaidBadge]}>
              <Text style={[styles.payBadgeText, { color: order?.paymentMode === 'COD' ? '#D97706' : '#2E9D6A' }]}>
                {order?.paymentMode === 'COD'
                  ? `💵 COD — Collect ₹${order?.codAmount || 0}`
                  : '✅ Online Prepaid'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          {/* Reject */}
          <TouchableOpacity
            style={styles.rejectBtn}
            onPress={handleReject}
            activeOpacity={0.8}
          >
            <Text style={styles.rejectIcon}>✕</Text>
            <Text style={styles.rejectLabel}>Reject</Text>
          </TouchableOpacity>

          {/* Accept */}
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={handleAccept}
            activeOpacity={0.85}
          >
            <Text style={styles.acceptIcon}>✓</Text>
            <Text style={styles.acceptLabel}>Accept Order</Text>
          </TouchableOpacity>
        </View>

        {/* Timer bar at bottom */}
        <View style={styles.timerBarBg}>
          <Animated.View
            style={[
              styles.timerBarFill,
              {
                width: `${(seconds / COUNTDOWN_SECONDS) * 100}%`,
                backgroundColor: isUrgent ? '#DC2626' : '#2E9D6A',
              },
            ]}
          />
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  container: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },

  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center', marginBottom: 16,
  },

  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  bellIcon: { fontSize: 28 },
  newOrderLabel: {
    fontSize: 13, fontWeight: 'bold', color: '#2E9D6A', letterSpacing: 0.8,
  },
  urgencyText: { fontSize: 11, color: '#7E7A74', marginTop: 2 },

  divider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 16 },

  orderCard: {
    backgroundColor: '#FAF6F0',
    borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: '#EFEBE4',
    marginBottom: 20,
  },

  customerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  customerAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#2E9D6A',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#FFFFFF',
    shadowColor: '#2E9D6A', shadowOpacity: 0.2, shadowRadius: 6, elevation: 3,
  },
  customerAvatarText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  customerName: { fontSize: 17, fontWeight: 'bold', color: '#2C2B29', marginBottom: 4 },
  addressText: { fontSize: 12, color: '#7E7A74', lineHeight: 17 },

  itemsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  itemChip: {
    backgroundColor: '#FFFFFF', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: '#EFEBE4',
    maxWidth: W * 0.4,
  },
  moreChip: { backgroundColor: '#E9F5EF', borderColor: '#2E9D6A' },
  itemChipText: { fontSize: 11, color: '#4B5563', fontWeight: '500' },

  paymentRow: { flexDirection: 'row' },
  payBadge: {
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1,
  },
  codBadge: { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' },
  prepaidBadge: { backgroundColor: '#E9F5EF', borderColor: '#6EE7B7' },
  payBadgeText: { fontSize: 12, fontWeight: 'bold' },

  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },

  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 54, borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2, borderColor: '#DC2626',
  },
  rejectIcon: { fontSize: 18, color: '#DC2626', fontWeight: 'bold' },
  rejectLabel: { fontSize: 15, color: '#DC2626', fontWeight: 'bold' },

  acceptBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 54, borderRadius: 16,
    backgroundColor: '#2E9D6A',
    shadowColor: '#2E9D6A', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  acceptIcon: { fontSize: 18, color: '#FFFFFF', fontWeight: 'bold' },
  acceptLabel: { fontSize: 15, color: '#FFFFFF', fontWeight: 'bold', letterSpacing: 0.4 },

  timerBarBg: {
    height: 5, borderRadius: 3,
    backgroundColor: '#F3F4F6', overflow: 'hidden',
  },
  timerBarFill: { height: '100%', borderRadius: 3 },
});
