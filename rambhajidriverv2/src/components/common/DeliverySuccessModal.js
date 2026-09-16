// src/components/common/DeliverySuccessModal.js
// World-class premium animated full-screen delivery success viewport for Ram Bhaji
// Inspired by Uber Driver, Amazon Flex, and Blinkit partner dashboards,
// featuring SVG self-drawing checkmarks, scrollable timelines, quick action CTAs,
// customer ratings review sections, and real-time sync telemetry information.

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions, Easing, Modal, ScrollView, TouchableOpacity, Linking, Platform
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { triggerHaptic, AnimatedSVGDraw } from './Motion';
import { truncate } from '../../core/utils/formatUtils';

const { width: W, height: H } = Dimensions.get('window');

// ─── Confetti Piece ───────────────────────────────────────────────────────────
function ConfettiPiece({ color, startX, size, duration, delay, shape }) {
  const y = useRef(new Animated.Value(-20)).current;
  const x = useRef(new Animated.Value(0)).current;
  const rot = useRef(new Animated.Value(0)).current;
  const op = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(y, { toValue: H + 40, duration, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(op, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.loop(Animated.sequence([
          Animated.timing(x, { toValue: 20, duration: duration / 4, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(x, { toValue: -20, duration: duration / 4, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])),
        Animated.loop(Animated.timing(rot, { toValue: 1, duration: 800, easing: Easing.linear, useNativeDriver: true })),
      ]),
    ]).start();
  }, []);

  const rotate = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: startX,
        top: 0,
        width: size,
        height: size * (shape === 'rect' ? 2 : 1),
        borderRadius: shape === 'circle' ? size / 2 : 3,
        backgroundColor: color,
        opacity: op,
        transform: [{ translateY: y }, { translateX: x }, { rotate }],
      }}
    />
  );
}

// ─── Floating Sparkles ───
function Sparkle({ x, y, delay, size = 16 }) {
  const scale = useRef(new Animated.Value(0)).current;
  const op = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.spring(scale, { toValue: 1.2, tension: 180, friction: 5, useNativeDriver: true }),
          Animated.timing(op, { toValue: 1, duration: 250, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.spring(scale, { toValue: 0, tension: 180, friction: 5, useNativeDriver: true }),
          Animated.timing(op, { toValue: 0, duration: 350, useNativeDriver: true }),
        ]),
        Animated.delay(1000),
      ])
    ).start();
  }, []);

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left: x,
        top: y,
        fontSize: size,
        opacity: op,
        transform: [{ scale }],
      }}
    >
      ✨
    </Animated.Text>
  );
}

export default function DeliverySuccessModal({ visible, order, onClose }) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [rating, setRating] = useState(5);
  const [redirectSeconds, setRedirectSeconds] = useState(5);

  // Entrance slide translations
  const slideAnim = useRef(new Animated.Value(H)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    setShowConfetti(false);
    setRedirectSeconds(5);
    triggerHaptic('notificationSuccess');

    // Reset animations
    slideAnim.setValue(H);
    fadeAnim.setValue(0);
    checkScale.setValue(0);

    // Sequence trigger
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 45, friction: 8, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      Animated.spring(checkScale, { toValue: 1, tension: 100, friction: 5, useNativeDriver: true }).start();
      setShowConfetti(true);
    }, 600);

  }, [visible]);

  // Automatic redirect timer
  useEffect(() => {
    if (!visible) return;
    if (redirectSeconds <= 0) {
      onClose();
      return;
    }
    const timer = setTimeout(() => {
      setRedirectSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [visible, redirectSeconds]);

  if (!visible || !order) return null;

  const CONFETTI_COLORS = ['#16A34A', '#22C55E', '#15803D', '#2563EB', '#3B82F6', '#F59E0B', '#EF4444'];
  const confettiPieces = Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    startX: Math.random() * W,
    size: 6 + Math.random() * 8,
    duration: 2500 + Math.random() * 1500,
    delay: Math.random() * 500,
    shape: Math.random() > 0.5 ? 'rect' : 'circle',
  }));

  const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={styles.root}>
        {/* Confetti Rain */}
        {showConfetti && confettiPieces.map(p => (
          <ConfettiPiece key={p.id} {...p} />
        ))}

        {/* Floating Sparkles */}
        <Sparkle x={W * 0.1} y={H * 0.12} delay={500} size={20} />
        <Sparkle x={W * 0.85} y={H * 0.16} delay={900} size={15} />
        <Sparkle x={W * 0.15} y={H * 0.35} delay={1400} size={16} />

        <Animated.View style={[styles.contentContainer, { transform: [{ translateY: slideAnim }], opacity: fadeAnim }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* ─── 1. Header Section ─── */}
            <View style={styles.headerBlock}>
              <Animated.View style={[styles.successBadgeCircle, { transform: [{ scale: checkScale }] }]}>
                {visible && (
                  <AnimatedSVGDraw size={32} color="#FFFFFF" strokeWidth={5} duration={400} />
                )}
              </Animated.View>
              <Text style={styles.title}>Delivery Completed Successfully</Text>
              <Text style={styles.subtitle}>
                The order has been successfully delivered and synced with the server database.
              </Text>
            </View>

            {/* ─── 2. Delivery Summary Card ─── */}
            <View style={styles.elevatedCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardHeaderTitle}>Delivery Invoice Details</Text>
                <View style={styles.syncedPill}>
                  <Text style={{ fontSize: 10, marginRight: 4 }}>☁️</Text>
                  <Text style={styles.syncedPillText}>Synced</Text>
                </View>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLbl}>Order ID</Text>
                <Text style={styles.summaryVal}>#{order.id}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLbl}>Customer Name</Text>
                <Text style={styles.summaryVal}>{order.customerName}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLbl}>Delivery Time</Text>
                <Text style={styles.summaryVal}>{now}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLbl}>Completion Date</Text>
                <Text style={styles.summaryVal}>{dateStr}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLbl}>Payment Mode</Text>
                <Text style={styles.summaryVal}>{order.paymentMode}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLbl}>Payment Status</Text>
                <Text style={[styles.summaryVal, { color: '#16A34A', fontWeight: 'bold' }]}>
                  {order.paymentMode === 'PREPAID' ? 'PAID' : 'COLLECTED CASH'}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLbl}>Delivered By</Text>
                <Text style={styles.summaryVal}>Rohan Sharma (ID: #DRV-882)</Text>
              </View>
              <View style={[styles.summaryItem, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                <Text style={styles.summaryLbl}>Location</Text>
                <Text style={styles.summaryVal}>{truncate(order.address || '', 40)}</Text>
              </View>
            </View>

            {/* ─── 3. Delivery Step Timeline ─── */}
            <View style={styles.timelineCard}>
              <Text style={styles.cardHeaderTitle}>Order Journey Completed</Text>
              
              <View style={styles.timelineRow}>
                <View style={styles.timelineLine} />
                <View style={styles.timelineNodesColumn}>
                  <View style={styles.timelineStep}>
                    <Text style={styles.timelineCheck}>✓</Text>
                    <Text style={styles.timelineText}>Order Assigned</Text>
                  </View>
                  <View style={styles.timelineStep}>
                    <Text style={styles.timelineCheck}>✓</Text>
                    <Text style={styles.timelineText}>Items Picked Up</Text>
                  </View>
                  <View style={styles.timelineStep}>
                    <Text style={styles.timelineCheck}>✓</Text>
                    <Text style={styles.timelineText}>On Route to Destination</Text>
                  </View>
                  <View style={styles.timelineStep}>
                    <Text style={styles.timelineCheck}>✓</Text>
                    <Text style={styles.timelineText}>Reached Customer Location</Text>
                  </View>
                  <View style={[styles.timelineStep, { marginBottom: 0 }]}>
                    <Text style={[styles.timelineCheck, styles.timelineCheckActive]}>✓</Text>
                    <Text style={[styles.timelineText, { color: '#166534', fontWeight: 'bold' }]}>Delivered & Handed Over</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ─── 4. Rate Experience Option Section ─── */}
            <View style={styles.elevatedCard}>
              <Text style={[styles.cardHeaderTitle, { textAlign: 'center', marginBottom: 12 }]}>Rate Customer Experience</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity key={s} onPress={() => { triggerHaptic('light'); setRating(s); }}>
                    <Text style={[styles.starChar, rating >= s && styles.starCharSelected]}>★</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Earnings info breakdown */}
              <View style={styles.earningsBreakdownRow}>
                <View style={styles.earningCol}>
                  <Text style={styles.earningLbl}>Reward Points</Text>
                  <Text style={styles.earningVal}>+20 PTS</Text>
                </View>
                <View style={styles.earningCol}>
                  <Text style={styles.earningLbl}>Today's Earnings</Text>
                  <Text style={styles.earningVal}>₹1,240.00</Text>
                </View>
                <View style={styles.earningCol}>
                  <Text style={styles.earningLbl}>Completed</Text>
                  <Text style={styles.earningVal}>12 Gigs</Text>
                </View>
              </View>
            </View>

            {/* ─── 5. Bottom Verification Badges Checklist ─── */}
            <View style={styles.infoRowChecklist}>
              <View style={styles.checkInfoItem}>
                <Text style={styles.checkInfoIcon}>✓</Text>
                <Text style={styles.checkInfoLabel}>Delivery synced successfully</Text>
              </View>
              <View style={styles.checkInfoItem}>
                <Text style={styles.checkInfoIcon}>✓</Text>
                <Text style={styles.checkInfoLabel}>Inventory updated</Text>
              </View>
              <View style={styles.checkInfoItem}>
                <Text style={styles.checkInfoIcon}>✓</Text>
                <Text style={styles.checkInfoLabel}>Customer notified</Text>
              </View>
              <View style={styles.checkInfoItem}>
                <Text style={styles.checkInfoIcon}>✓</Text>
                <Text style={styles.checkInfoLabel}>Earnings added to wallet</Text>
              </View>
            </View>

            {/* Redirect Timer message */}
            <Text style={styles.redirectText}>
              Redirecting to Dashboard in <Text style={{ fontWeight: 'bold' }}>{redirectSeconds}s</Text>...
            </Text>

            {/* ─── 6. Action CTAs ─── */}
            <View style={styles.actionsBlock}>
              <TouchableOpacity activeOpacity={0.9} style={styles.primaryGradientContainer} onPress={onClose}>
                <LinearGradient
                  colors={['#15803D', '#166534']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryGradient}
                >
                  <Text style={styles.primaryBtnTxt}>Return to Dashboard</Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  activeOpacity={0.88}
                  style={styles.secondaryBtn}
                  onPress={() => { onClose(); router.push('/(tabs)/deliveries'); }}
                >
                  <Text style={styles.secondaryBtnText}>View Deliveries List</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.88}
                  style={styles.secondaryBtn}
                  onPress={() => Linking.openURL('tel:9876543210')}
                >
                  <Text style={styles.secondaryBtnText}>Call Support</Text>
                </TouchableOpacity>
              </View>
            </View>

          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    gap: 20,
  },

  // 1. header circle check styling
  headerBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  successBadgeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#16A34A',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
    fontFamily: 'System',
  },

  // 2. elevated summary card
  elevatedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#1F2937',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
    marginBottom: 12,
  },
  cardHeaderTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  syncedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E9F5EF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  syncedPillText: {
    fontSize: 10,
    color: '#16A34A',
    fontWeight: 'bold',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  summaryLbl: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  summaryVal: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
    textAlign: 'right',
  },

  // 3. timeline track styles
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#1F2937',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 3,
  },
  timelineRow: {
    flexDirection: 'row',
    marginTop: 14,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 8,
    top: 10,
    bottom: 10,
    width: 2,
    backgroundColor: '#16A34A',
  },
  timelineNodesColumn: {
    flex: 1,
    paddingLeft: 24,
    gap: 16,
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 2,
  },
  timelineCheck: {
    position: 'absolute',
    left: -24,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E9F5EF',
    textAlign: 'center',
    lineHeight: Platform.OS === 'ios' ? 18 : 16,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#16A34A',
    borderWidth: 1,
    borderColor: '#16A34A',
    overflow: 'hidden',
  },
  timelineCheckActive: {
    backgroundColor: '#16A34A',
    color: '#FFFFFF',
  },
  timelineText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },

  // 4. rating systems
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 10,
  },
  starChar: {
    fontSize: 28,
    color: '#E5E7EB',
  },
  starCharSelected: {
    color: '#F59E0B',
  },
  earningsBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
    marginTop: 12,
  },
  earningCol: {
    flex: 1,
    alignItems: 'center',
  },
  earningLbl: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: 'bold',
  },
  earningVal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 4,
  },

  // 5. bottom checklist item
  infoRowChecklist: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  checkInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkInfoIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E9F5EF',
    color: '#16A34A',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: Platform.OS === 'ios' ? 16 : 14,
    overflow: 'hidden',
  },
  checkInfoLabel: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '500',
  },

  redirectText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },

  // 6. actions Block
  actionsBlock: {
    gap: 12,
    marginTop: 10,
  },
  primaryGradientContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  primaryGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnTxt: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  secondaryBtnText: {
    color: '#1F2937',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
