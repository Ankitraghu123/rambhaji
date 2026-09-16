// import React, { useMemo, useState, useEffect } from 'react';
// import { View, Text, StyleSheet, Pressable, FlatList, Image, ScrollView, Switch, TextInput, Alert } from 'react-native';
// import { MaterialCommunityIcons } from '@expo/vector-icons';
// import { useRoute } from '@react-navigation/native';
// import { useAppStore } from '../store/UseAppStore';
// import { themeTokens, radius } from '../constants/theme';
// import Screen from '../components/Screen';
// import Card from '../components/Card';
// import AppButton from '../components/AppButton';
// import SectionHeader from '../components/SectionHeader';
// import Badge from '../components/Badge';
// import Input from '../components/Input';
// import QuantityStepper from '../components/QuantityStepper';
// import PlanCard from '../components/PlanCard';
// import ProductCard from '../components/ProductCard';
// import DeliveryCard from '../components/DeliveryCard';
// import TransactionRow from '../components/TransactionRow';
// import MenuRow from '../components/MenuRow';
// import {
//   subscriptionPlans, basketPlans, freshVeggies, waterProducts, retailProducts,
//   deliveries, walletTransactions, notifications, supportTickets, userProfile, menuItems,
//   addressBook, fixedVeggies, pickupRules
// } from '../data/mockData';
// import { formatINR } from '../utils/format';

// export default function DeliveryDetailScreen({ route }) {
//   const mode = useAppStore((s) => s.themeMode);
//   const colors = themeTokens[mode];
//   const delivery = deliveries.find((d) => d.id === (route.params?.deliveryId || 'd1')) || deliveries[0];

//   return (
//     <Screen>
//       <Text style={[s.title, { color: colors.text }]}>Delivery Detail</Text>
//       <Card>
//         <Text style={[s.line, { color: colors.text }]}>Title: {delivery.title}</Text>
//         <Text style={[s.line, { color: colors.text }]}>Status: {delivery.status}</Text>
//         <Text style={[s.line, { color: colors.text }]}>Area: {delivery.area}</Text>
//         <Text style={[s.line, { color: colors.text }]}>Note: {delivery.note}</Text>
//       </Card>
//     </Screen>
//   );
// }

// const s = StyleSheet.create({
//   title: { fontSize: 26, fontWeight: '900', marginBottom: 18 },
//   line: { fontSize: 14, fontWeight: '700', marginBottom: 10 }
// });



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
  Modal,
  Image,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../store/UseAppStore';
import { themeTokens, radius } from '../constants/theme';
import Screen from '../components/Screen';
import Card from '../components/Card';
import AppButton from '../components/AppButton';
import SectionHeader from '../components/SectionHeader';
import Badge from '../components/Badge';
import Input from '../components/Input';
import QuantityStepper from '../components/QuantityStepper';
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
  const insets = useSafeAreaInsets();
  const deliveryId = route.params?.deliveryId || 'd1';
  const mockDelivery = deliveries.find((d) => d.id === deliveryId) || deliveries[0];

  const [serverDelivery, setServerDelivery] = useState(null);
  const delivery = serverDelivery || mockDelivery;

  const [rating, setRating] = useState(0);
  const [retryRequested, setRetryRequested] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Return request states
  const [returnSheetVisible, setReturnSheetVisible] = useState(false);
  const [returnItems, setReturnItems] = useState({});
  const [returnReason, setReturnReason] = useState('');
  const [returnPhoto, setReturnPhoto] = useState(null);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  useEffect(() => {
    const fetchDelivery = async () => {
      try {
        const { deliveryApi } = require('../services/api/delivery');
        const res = await deliveryApi.getDeliveryHistory();
        if (res.success) {
          const history = res.history || res.deliveries || res.data || [];
          const matched = history.find(d => String(d.id) === String(deliveryId));
          if (matched) {
            setServerDelivery({
              ...matched,
              title: mockDelivery.title, 
              status: matched.status === 'pending' ? 'Upcoming' : matched.status === 'paused' ? 'Skipped' : 'Delivered'
            });
            if (matched.DeliveryItems) {
              const initItems = {};
              matched.DeliveryItems.forEach(item => {
                if (!item.return_status || item.return_status === 'none') {
                  initItems[item.id] = {
                    id: item.id,
                    qty: item.qty_gm,
                    max_qty: item.qty_gm,
                    selected: false,
                    name: item.Product?.name || 'Item',
                    hindi_name: item.Product?.hindi_name || '',
                    unit: item.Product?.unit || 'gm'
                  };
                }
              });
              setReturnItems(initItems);
            }
          }
        }
      } catch (e) { console.warn('Failed to fetch delivery detail', e); }
    };
    fetchDelivery();
  }, [deliveryId]);

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

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      import('react-native').then(rn => rn.Alert.alert('Permission required', 'Camera permission is required to capture photos.'));
      return;
    }
    
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setReturnPhoto(result.assets[0]);
    }
  };

  const handleSubmitReturn = async () => {
    const selectedList = Object.values(returnItems).filter(item => item.selected);
    if (selectedList.length === 0) {
      import('react-native').then(rn => rn.Alert.alert('Error', 'Please select at least one item to return.'));
      return;
    }
    if (!returnReason.trim()) {
      import('react-native').then(rn => rn.Alert.alert('Error', 'Please provide a reason for return.'));
      return;
    }
    if (!returnPhoto) {
      import('react-native').then(rn => rn.Alert.alert('Error', 'Please attach a photo of the issue.'));
      return;
    }

    setIsSubmittingReturn(true);
    try {
      const formData = new FormData();
      const itemsPayload = selectedList.map(item => ({
        delivery_item_id: item.id,
        return_qty: item.qty
      }));
      formData.append('items', JSON.stringify(itemsPayload));
      formData.append('return_reason', returnReason);
      if (Platform.OS === 'web') {
        // Always fetch the blob from the URI on the web to ensure it is a true binary Blob
        // rather than relying on the picker's file object which might be a plain JS object.
        const response = await fetch(returnPhoto.uri);
        const blob = await response.blob();
        formData.append('photo', blob, returnPhoto.fileName || 'return_photo.jpg');
      } else {
        formData.append('photo', {
          uri: returnPhoto.uri,
          name: returnPhoto.fileName || 'return_photo.jpg',
          type: returnPhoto.mimeType || 'image/jpeg',
        });
      }

      const { deliveryApi } = require('../services/api/delivery');
      const res = await deliveryApi.requestReturn(formData);
      if (res.success) {
        import('react-native').then(rn => rn.Alert.alert('Success', 'Return request submitted successfully.'));
        setReturnSheetVisible(false);
        setReturnReason('');
        setReturnPhoto(null);
      } else {
         import('react-native').then(rn => rn.Alert.alert('Error', res.message || 'Failed to submit return.'));
      }
    } catch (e) {
      import('react-native').then(rn => rn.Alert.alert('Error', 'Failed to submit return request.'));
    }
    setIsSubmittingReturn(false);
  };

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

        {/* ── Delivery partner ────────────────────────────────────────── */}
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

        {!!delivery.DeliveryItems?.length && (
          <FadeIn index={6}>
            <View style={{ marginBottom: 24, marginHorizontal: 16 }}>
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text, letterSpacing: -0.5 }}>Delivered items</Text>
                <Text style={{ fontSize: 13, color: colors.textSoft, fontWeight: '500', marginTop: 2 }}>Items included in this delivery</Text>
              </View>
              
              <View style={[s.deliveredListCard, { backgroundColor: colors.surface, borderColor: border }]}>
                {delivery.DeliveryItems.map((item, idx) => {
                  const hasReturn = item.return_status && item.return_status !== 'none';
                  const isApproved = item.return_status === 'approved';
                  const isRejected = item.return_status === 'rejected';
                  const returnColor = isApproved ? TONE_COLORS.success.text : isRejected ? TONE_COLORS.danger.text : TONE_COLORS.warning.text;
                  const returnBg = isApproved ? TONE_COLORS.success.bg : isRejected ? TONE_COLORS.danger.bg : TONE_COLORS.warning.bg;
                  
                  return (
                    <View key={item.id} style={[s.deliveredItemCard, idx < delivery.DeliveryItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: border }]}>
                      <View style={[s.itemIconBox, { backgroundColor: colors.primarySoft || '#EEF2FF' }]}>
                        <MaterialCommunityIcons name="leaf" size={18} color={colors.primary || '#3730A3'} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[s.deliveredItemName, { color: colors.text }]}>
                          {item.Product?.name || 'Product'}
                          {item.Product?.hindi_name ? ` (${item.Product.hindi_name})` : ''}
                        </Text>
                        {hasReturn && (
                          <View style={[s.returnBadge, { backgroundColor: returnBg, borderColor: returnColor + '30' }]}>
                            <MaterialCommunityIcons 
                              name={isApproved ? 'check-circle' : isRejected ? 'close-circle' : 'clock-outline'} 
                              size={12} 
                              color={returnColor}
                            />
                            <Text style={[s.returnBadgeText, { color: returnColor }]}>
                              {item.return_status.charAt(0).toUpperCase() + item.return_status.slice(1)}: {item.return_qty} {item.Product?.unit || 'gm'}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={[s.qtyBadge, { backgroundColor: colors.background }]}>
                        <Text style={[s.deliveredItemQty, { color: colors.textSoft }]}>{item.qty_gm} {item.Product?.unit || 'gm'}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </FadeIn>
        )}

        {/* ── Return action ────────────────────────────────────────────── */}
        {delivery.status === 'Delivered' && Object.keys(returnItems).length > 0 && (
          <FadeIn index={7}>
            <AppButton 
              title="Request Return" 
              variant="secondary"
              onPress={() => setReturnSheetVisible(true)}
              style={{ marginTop: 16 }}
            />
          </FadeIn>
        )}
      </ScrollView>

      {/* ── Return Request Modal ────────────────────────────────────── */}
      <Modal visible={returnSheetVisible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom + 16, 40) }]}>
            <View style={[s.modalHeader, { borderBottomColor: border }]}>
              <Text style={[s.modalTitle, { color: colors.text }]}>Request Return</Text>
              <Pressable onPress={() => setReturnSheetVisible(false)} hitSlop={12}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textSoft} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
              <SectionHeader title="Select items to return" />
              {Object.values(returnItems).map((item) => (
                <View key={item.id} style={[s.returnItemRow, { borderBottomColor: border }]}>
                  <Pressable
                    style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                    onPress={() => setReturnItems(prev => ({
                      ...prev,
                      [item.id]: { ...prev[item.id], selected: !prev[item.id].selected }
                    }))}
                  >
                    <MaterialCommunityIcons 
                      name={item.selected ? "checkbox-marked" : "checkbox-blank-outline"} 
                      size={24} 
                      color={item.selected ? colors.primary : colors.textSoft} 
                    />
                    <Text style={[s.returnItemName, { color: colors.text, marginLeft: 12 }]}>
                      {item.name}
                      {item.hindi_name ? ` (${item.hindi_name})` : ''}
                    </Text>
                  </Pressable>
                  {item.selected && (
                    <Text style={[s.returnItemQty, { color: colors.textSoft }]}>
                      {item.qty} {item.unit}
                    </Text>
                  )}
                </View>
              ))}

              <SectionHeader title="Return Details" style={{ marginTop: 24 }} />
              <Input
                label="Reason for return"
                value={returnReason}
                onChangeText={setReturnReason}
                placeholder="Product quality issue, spoiled, etc."
                multiline
                style={{ minHeight: 80 }}
              />

              <SectionHeader title="Photo Proof (Required)" style={{ marginTop: 16 }} />
              {returnPhoto ? (
                <View style={s.photoPreviewContainer}>
                  <Image source={{ uri: returnPhoto.uri }} style={s.photoPreview} />
                  <Pressable style={s.photoRemoveBtn} onPress={() => setReturnPhoto(null)}>
                    <MaterialCommunityIcons name="close-circle" size={28} color={colors.danger || '#EF4444'} />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  style={[s.photoUploadBtn, { borderColor: border, backgroundColor: colors.surfaceAlt || '#f9fafb' }]}
                  onPress={handlePickPhoto}
                >
                  <MaterialCommunityIcons name="camera-plus" size={32} color={colors.textSoft} />
                  <Text style={[s.photoUploadText, { color: colors.textSoft }]}>Upload Photo</Text>
                </Pressable>
              )}

              <AppButton 
                title="Submit Return Request" 
                onPress={handleSubmitReturn}
                loading={isSubmittingReturn}
                disabled={isSubmittingReturn}
                style={{ marginTop: 24, marginBottom: 40 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    marginTop: 14,
  },
  noteText: { fontSize: 12, lineHeight: 18, flex: 1 },

  trackingCard: { borderRadius: 20 },
  trackingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  trackingTitle: { fontSize: 16, fontWeight: '900' },
  trackingSub: { marginTop: 3, fontSize: 12, fontWeight: '700', lineHeight: 17 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveText: { fontSize: 11, fontWeight: '900' },
  routeStage: {
    height: 92,
    justifyContent: 'center',
    marginTop: 8,
  },
  routeLine: {
    position: 'absolute',
    left: 34,
    right: 34,
    height: 5,
    borderRadius: 99,
  },
  routeFill: {
    position: 'absolute',
    left: 34,
    right: 34,
    height: 5,
    borderRadius: 99,
  },
  routePin: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2B2112',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  routePinStart: { left: 14 },
  routePinEnd: { right: 14 },
  riderMarker: {
    position: 'absolute',
    left: 0,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#143C2A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 5,
    zIndex: 2,
  },

  timeline: { marginTop: 6 },
  timelineRow: { flexDirection: 'row' },
  timelineLeft: { alignItems: 'center', width: 32 },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 99,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: { width: 2, flex: 1, marginTop: 2 },
  timelineLabel: { fontSize: 14 },
  timelineSub: { fontSize: 11, marginTop: 2 },

  statusBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  statusBannerTitle: { fontSize: 13, fontWeight: '800', marginBottom: 3 },
  statusBannerBody: { fontSize: 12, lineHeight: 17, fontWeight: '500' },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 11 },
  infoLabel: { fontSize: 13, flex: 1 },
  infoValue: { fontSize: 13, fontWeight: '800' },

  driverRow: { flexDirection: 'row', alignItems: 'center' },
  driverAvatar: { width: 40, height: 40, borderRadius: 99, alignItems: 'center', justifyContent: 'center' },
  driverName: { fontSize: 14, fontWeight: '800' },
  driverPhone: { fontSize: 12, marginTop: 2 },
  callBtn: { width: 34, height: 34, borderRadius: 99, alignItems: 'center', justifyContent: 'center' },

  starRow: { flexDirection: 'row', marginTop: 6 },
  thanksRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  thanksText: { fontSize: 12, fontWeight: '700' },

  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: radius?.md ?? 12,
    padding: 13,
    marginTop: 4,
  },
  supportText: { flex: 1, fontSize: 13, fontWeight: '700' },

  deliveredListCard: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  deliveredItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  itemIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveredItemName: {
    fontSize: 15,
    fontWeight: '700',
  },
  qtyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 12,
  },
  deliveredItemQty: {
    fontSize: 12,
    fontWeight: '800',
  },
  returnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  returnBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 20, fontWeight: '900' },
  returnItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  returnItemName: { fontSize: 15, fontWeight: '700' },
  returnItemQty: { fontSize: 14, fontWeight: '600', marginLeft: 'auto' },
  photoUploadBtn: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    marginTop: 12,
  },
  photoUploadText: { fontSize: 15, fontWeight: '700', marginTop: 12 },
  photoPreviewContainer: { marginTop: 12, position: 'relative', width: 140, height: 140 },
  photoPreview: { width: 140, height: 140, borderRadius: 16 },
  photoRemoveBtn: { 
    position: 'absolute', 
    top: -12, 
    right: -12, 
    backgroundColor: '#fff', 
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
