

import React, { useMemo, useRef, useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../store/UseAppStore';
import { themeTokens, radius } from '../constants/theme';
import Screen from '../components/Screen';
import Card from '../components/Card';
import AppButton from '../components/AppButton';
import SectionHeader from '../components/SectionHeader';
import Badge from '../components/Badge';
import { deliveries } from '../data/mockData';
import { formatINR } from '../utils/format';

// ─── Status config ─────────────────────────────────────────────────────────
const STATUS_TONE = {
  Pending: 'primary',
  'Out For Delivery': 'info',
  Delivered: 'success',
  Failed: 'danger',
  Skipped: 'warning',
  'Partial Delivered': 'warning',
};

const STATUS_ICON = {
  Pending: 'clipboard-clock-outline',
  'Out For Delivery': 'truck-fast-outline',
  Delivered: 'check-circle-outline',
  Failed: 'close-circle-outline',
  Skipped: 'skip-next-outline',
  'Partial Delivered': 'alert-circle-outline',
};

const TIMELINE_STEPS = [
  { key: 'Pending', label: 'Order Placed', icon: 'clipboard-check-outline' },
  { key: 'Out For Delivery', label: 'Out for Delivery', icon: 'truck-fast-outline' },
  { key: 'Delivered', label: 'Delivered', icon: 'home-import-outline' },
];

const TONE_COLORS = {
  primary: { bg: '#EEF2FF', border: '#A5B4FC', text: '#3730A3' },
  info: { bg: '#EFF6FF', border: '#93C5FD', text: '#1D4ED8' },
  success: { bg: '#ECFDF5', border: '#6EE7B7', text: '#047857' },
  danger: { bg: '#FEF2F2', border: '#FCA5A5', text: '#B91C1C' },
  warning: { bg: '#FFFBEB', border: '#F5C518', text: '#92650A' },
};

function getStepIndex(status) {
  const idx = TIMELINE_STEPS.findIndex((st) => st.key === status);
  return idx === -1 ? -1 : idx;
}

// ─── Animated entrance wrapper ──────────────────────────────────────────────
function FadeIn({ children, index = 0 }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 340,
      delay: index * 90,
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

// ─── Star rating control ────────────────────────────────────────────────────
function StarRating({ value, onChange, colors }) {
  return (
    <View style={s.starRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange(n)} hitSlop={6}>
          <MaterialCommunityIcons
            name={n <= value ? 'star' : 'star-outline'}
            size={28}
            color={n <= value ? '#F5B82E' : colors.textMuted}
            style={{ marginRight: 4 }}
          />
        </Pressable>
      ))}
    </View>
  );
}

function TrackingPreview({ colors, status }) {
  const progress = useRef(new Animated.Value(status === 'Delivered' ? 1 : 0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const isMoving = status === 'Out For Delivery';

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    let routeLoop;
    if (isMoving) {
      routeLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(progress, {
            toValue: 1,
            duration: 2600,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(progress, {
            toValue: 0.18,
            duration: 2600,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        ])
      );
      routeLoop.start();
    } else {
      Animated.timing(progress, {
        toValue: status === 'Delivered' ? 1 : 0.14,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }

    return () => {
      pulseLoop.stop();
      routeLoop?.stop();
    };
  }, [isMoving, progress, pulse, status]);

  return (
    <Card style={s.trackingCard}>
      <View style={s.trackingHeader}>
        <View>
          <Text style={[s.trackingTitle, { color: colors.text }]}>Live route</Text>
          <Text style={[s.trackingSub, { color: colors.textSoft }]}>
            {isMoving ? 'Rider is moving towards your address' : 'Route is prepared for this delivery'}
          </Text>
        </View>
        <View style={[s.liveBadge, { backgroundColor: colors.primarySoft }]}>
          <Animated.View
            style={[
              s.liveDot,
              {
                backgroundColor: colors.primary,
                opacity: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.42, 1],
                }),
                transform: [
                  {
                    scale: pulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.82, 1.28],
                    }),
                  },
                ],
              },
            ]}
          />
          <Text style={[s.liveText, { color: colors.primary }]}>Live</Text>
        </View>
      </View>

      <View style={s.routeStage}>
        <View style={[s.routeLine, { backgroundColor: colors.border }]} />
        <Animated.View
          style={[
            s.routeFill,
            {
              backgroundColor: colors.primary,
              transform: [
                {
                  scaleX: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.08, 1],
                  }),
                },
              ],
            },
          ]}
        />
        <View style={[s.routePin, s.routePinStart, { backgroundColor: colors.primarySoft }]}>
          <MaterialCommunityIcons name="storefront-outline" size={17} color={colors.primary} />
        </View>
        <Animated.View
          style={[
            s.riderMarker,
            {
              backgroundColor: colors.primary,
              transform: [
                {
                  translateX: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 214],
                  }),
                },
                {
                  translateY: pulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -5],
                  }),
                },
              ],
            },
          ]}
        >
          <MaterialCommunityIcons name="bike-fast" size={18} color="#FFFFFF" />
        </Animated.View>
        <Animated.View
          style={[
            s.routePin,
            s.routePinEnd,
            {
              backgroundColor: '#FFF3CD',
              transform: [
                {
                  scale: pulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.08],
                  }),
                },
              ],
            },
          ]}
        >
          <MaterialCommunityIcons name="map-marker" size={18} color="#B87922" />
        </Animated.View>
      </View>
    </Card>
  );
}

function ConfettiBurst({ active }) {
  const burst = useRef(new Animated.Value(0)).current;
  const pieces = useMemo(
    () => [
      { x: -74, y: -34, color: '#267447', rotate: '24deg' },
      { x: -42, y: -62, color: '#F5B82E', rotate: '-18deg' },
      { x: -8, y: -46, color: '#C85A3B', rotate: '45deg' },
      { x: 34, y: -58, color: '#137C78', rotate: '-32deg' },
      { x: 70, y: -30, color: '#B87922', rotate: '18deg' },
    ],
    []
  );

  useEffect(() => {
    if (!active) return;
    Animated.sequence([
      Animated.delay(180),
      Animated.spring(burst, {
        toValue: 1,
        speed: 12,
        bounciness: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, [active, burst]);

  if (!active) return null;

  return (
    <View pointerEvents="none" style={s.confettiLayer}>
      {pieces.map((piece, index) => (
        <Animated.View
          key={`${piece.color}-${index}`}
          style={[
            s.confettiPiece,
            {
              backgroundColor: piece.color,
              opacity: burst.interpolate({
                inputRange: [0, 0.85, 1],
                outputRange: [0, 1, 0.45],
              }),
              transform: [
                {
                  translateX: burst.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, piece.x],
                  }),
                },
                {
                  translateY: burst.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, piece.y],
                  }),
                },
                {
                  rotate: burst.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', piece.rotate],
                  }),
                },
                {
                  scale: burst.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.2, 1],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

export default function DeliveryDetailScreen({ route, navigation }) {
  const mode = useAppStore((s) => s.themeMode);
  const colors = themeTokens[mode];
  const delivery =
    deliveries.find((d) => d.id === (route.params?.deliveryId || 'd1')) || deliveries[0];

  const [rating, setRating] = useState(0);
  const [retryRequested, setRetryRequested] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const border = colors.border ?? 'rgba(0,0,0,0.08)';
  const tone = STATUS_TONE[delivery.status] ?? 'primary';
  const toneColors = TONE_COLORS[tone] ?? TONE_COLORS.primary;
  const statusIcon = STATUS_ICON[delivery.status] ?? 'package-variant-closed';
  const stepIndex = getStepIndex(delivery.status);
  const isLinear = stepIndex !== -1;

  const safeNavigate = (name, params) => {
    try {
      navigation?.navigate(name, params);
    } catch (_e) {}
  };

  function handleCallPartner() {
    if (delivery.driverPhone) {
      import('react-native').then(rn => rn.Linking.openURL(`tel:${delivery.driverPhone}`).catch(() => {}));
    }
  }

  async function handleResume() {
    setIsProcessing(true);
    try {
      const { subscriptionsApi } = require('../services/api/subscriptions');
      const subId = delivery.subscription_id || delivery.subscriptionId;
      if (!subId) {
        import('react-native').then(rn => rn.Alert.alert('Error', 'No subscription ID found for this delivery.'));
        setIsProcessing(false);
        return;
      }
      await subscriptionsApi.restartSubscription(subId, { restart_date: new Date().toISOString().split('T')[0] });
      import('react-native').then(rn => rn.Alert.alert('Success', 'Subscription restarted.'));
      navigation.goBack();
    } catch (e) {
      import('react-native').then(rn => rn.Alert.alert('Error', e.response?.data?.message || 'Failed to restart.'));
    }
    setIsProcessing(false);
  }

  async function handlePause() {
    setIsProcessing(true);
    try {
      const { subscriptionsApi } = require('../services/api/subscriptions');
      const subId = delivery.subscription_id || delivery.subscriptionId;
      if (!subId) {
        import('react-native').then(rn => rn.Alert.alert('Error', 'No subscription ID found for this delivery.'));
        setIsProcessing(false);
        return;
      }
      await subscriptionsApi.pauseSubscription(subId, {
        pause_days: 7,
        pause_type: 'monthly',
        pause_scope: 'single'
      });
      import('react-native').then(rn => rn.Alert.alert('Success', 'Subscription paused.'));
      navigation.goBack();
    } catch (e) {
      import('react-native').then(rn => rn.Alert.alert('Error', e.response?.data?.message || 'Failed to pause.'));
    }
    setIsProcessing(false);
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* ── Header ──────────────────────────────────────────────────── */}
        <FadeIn index={0}>
          <Card>
            <ConfettiBurst active={delivery.status === 'Delivered'} />
            <View style={s.headerRow}>
              <View style={[s.heroIcon, { backgroundColor: toneColors.bg, borderColor: toneColors.border }]}>
                <MaterialCommunityIcons name={statusIcon} size={26} color={toneColors.text} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[s.title, { color: colors.text }]}>{delivery.title}</Text>
                <View style={s.areaRow}>
                  <MaterialCommunityIcons name="map-marker-outline" size={13} color={colors.textSoft} />
                  <Text style={[s.areaText, { color: colors.textSoft }]}>{delivery.area}</Text>
                </View>
              </View>
              <Badge label={delivery.status} tone={tone} />
            </View>

            {!!delivery.note && (
              <View style={[s.noteBox, { backgroundColor: colors.surfaceSoft ?? 'rgba(0,0,0,0.03)', borderColor: border }]}>
                <MaterialCommunityIcons name="note-text-outline" size={15} color={colors.textSoft} />
                <Text style={[s.noteText, { color: colors.textSoft }]}>{delivery.note}</Text>
              </View>
            )}

            {/* Added Pause Delivery button for pending/upcoming deliveries */}
            {(delivery.status === 'Pending' || delivery.status === 'Upcoming' || delivery.status === 'Arriving') && (
              <AppButton 
                title="Pause Delivery" 
                onPress={handlePause} 
                loading={isProcessing}
                disabled={isProcessing}
                style={{ marginTop: 16 }} 
                variant="secondary"
              />
            )}
          </Card>
        </FadeIn>

        {/* ── Linear status timeline ─────────────────────────────────── */}
        {isLinear && (
          <FadeIn index={1}>
            <TrackingPreview colors={colors} status={delivery.status} />
          </FadeIn>
        )}

        {/* {isLinear && (
          <FadeIn index={2}>
            <Card>
              <SectionHeader title="Order details" />

            <InfoRow icon="map-marker-outline" label="Delivery area" value={delivery.area} colors={colors} border={border} />
            {!!delivery.date && (
              <InfoRow icon="calendar-outline" label="Date" value={delivery.date} colors={colors} border={border} />
            )}
            {!!(delivery.time || delivery.slot) && (
              <InfoRow icon="clock-outline" label="Time slot" value={delivery.time || delivery.slot} colors={colors} border={border} />
            )}
            {!!(delivery.quantity || delivery.qty) && (
              <InfoRow icon="package-variant" label="Quantity" value={String(delivery.quantity || delivery.qty)} colors={colors} border={border} />
            )}
            {(delivery.amount != null || delivery.price != null) && (
              <InfoRow
                icon="cash"
                label="Amount"
                value={formatINR(delivery.amount ?? delivery.price)}
                colors={colors}
                border={border}
                last
              />
            )}
          </Card>
        </FadeIn>
        )} */}

        {/* ── De livery partner ────────────────────────────────────────── */}
        {!!delivery.driverName && (
          <FadeIn index={3}>
            <Card>
              <SectionHeader title="Delivery partner" />
              <View style={s.driverRow}>
                <View style={[s.driverAvatar, { backgroundColor: colors.primarySoft }]}>
                  <MaterialCommunityIcons name="account-outline" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[s.driverName, { color: colors.text }]}>{delivery.driverName}</Text>
                  {!!delivery.driverPhone && (
                    <Text style={[s.driverPhone, { color: colors.textSoft }]}>{delivery.driverPhone}</Text>
                  )}
                </View>
                {!!delivery.driverPhone && (
                  <Pressable
                    onPress={handleCallPartner}
                    style={[s.callBtn, { backgroundColor: colors.primary }]}
                  >
                    <MaterialCommunityIcons name="phone" size={16} color="#fff" />
                  </Pressable>
                )}
              </View>
            </Card>
          </FadeIn>
        )}

        {/* ── Rate this delivery ────────────────────────────────────── */}
        {/* {delivery.status === 'Delivered' && (
          <FadeIn index={4}>
            <Card>
              <SectionHeader title="Rate this delivery" subtitle="Your feedback helps us improve" />
              <StarRating value={rating} onChange={setRating} colors={colors} />
              {rating > 0 && (
                <View style={s.thanksRow}>
                  <MaterialCommunityIcons name="check-circle" size={15} color={TONE_COLORS.success.text} />
                  <Text style={[s.thanksText, { color: TONE_COLORS.success.text }]}>
                    Thanks for rating this delivery {rating} star{rating > 1 ? 's' : ''}!
                  </Text>
                </View>
              )}
            </Card>
          </FadeIn>
        )} */}

        {/* ── Support action ──────────────────────────────────────────── */}
        {/* <FadeIn index={5}>
          <Pressable
            onPress={() => safeNavigate('Support')}
            style={({ pressed }) => [s.supportRow, { borderColor: border, opacity: pressed ? 0.8 : 1 }]}
          >
            <MaterialCommunityIcons name="lifebuoy" size={17} color={colors.textSoft} />
            <Text style={[s.supportText, { color: colors.textSoft }]}>Report an issue with this delivery</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textMuted} />
          </Pressable>
        </FadeIn> */}
      </ScrollView>
    </Screen>
  );
}

// ─── Reusable info row ───────────────────────────────────────────────────────
function InfoRow({ icon, label, value, colors, border, last }) {
  return (
    <View style={[s.infoRow, !last && { borderBottomColor: border, borderBottomWidth: 1 }]}>
      <MaterialCommunityIcons name={icon} size={16} color={colors.textSoft} />
      <Text style={[s.infoLabel, { color: colors.textSoft }]}>{label}</Text>
      <Text style={[s.infoValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  confettiLayer: {
    position: 'absolute',
    top: 34,
    right: 58,
    width: 2,
    height: 2,
    zIndex: 4,
  },
  confettiPiece: {
    position: 'absolute',
    width: 7,
    height: 12,
    borderRadius: 3,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: radius?.lg ?? 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 19, fontWeight: '900' },
  areaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  areaText: { fontSize: 12, fontWeight: '600' },

  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderRadius: radius?.md ?? 12,
    padding: 10,
    marginTop: 14,}
  })