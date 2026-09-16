// app/order/[id].js
// SCR-09: Order Detail Screen — core operational details screen
// Redesigned with premium corporate logistics layouts (Uber Driver, Amazon Flex & Blinkit Rider inspired).
// Optimized for all Android screen sizes and form-factors.
// Integrates sticky shrinking headers, scrolling glassmorphism backgrounds, delivery progress step lines,
// detailed customer avatars, verified badges, rating labels, one-handed sticky action buttons,
// pulsing GPS markers, and fully responsive sliding modal sheets for Complete Delivery and Returns.

import { useState, useCallback, useRef, useEffect, memo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Linking, Alert, Modal, ActivityIndicator, Animated, Easing, Platform, Clipboard, TextInput, KeyboardAvoidingView
} from 'react-native';
import { Image } from 'expo-image';
import { s, vs, ms } from '../../src/core/utils/responsive';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { updateOrderStatus, setLocationTagged } from '../../src/features/routes/state/routeSlice';
import LocationVerificationService from '../../src/core/security/LocationVerificationService';
import QueueManager from '../../src/features/sync/services/QueueManager';
import { QUEUE_ACTION_TYPES } from '../../src/features/sync/constants/queueActionTypes';
import SyncEngine from '../../src/features/sync/services/SyncEngine';
import { categoryLabel, formatPhone, truncate, getProductImageFallback } from '../../src/core/utils/formatUtils';
import TelemetryService from '../../src/features/tracking/services/TelemetryService';
import apiClient from '../../src/core/network/apiClient';

import RouteService from '../../src/features/routes/services/RouteService';
import { AnimatedCard, AnimatedPressable, SlideInSheet, ShakeView, triggerHaptic } from '../../src/components/common/Motion';
import DeliverySuccessModal from '../../src/components/common/DeliverySuccessModal';
import PageLoader from '../../src/components/common/PageLoader';
import LocationSuccessModal from '../../src/components/common/LocationSuccessModal';

// Selectors
const selectOrderById = (orderId) => (state) => {
  const activeOrders = state.route?.orders || [];
  const historyOrders = state.route?.historyOrders || [];
  const foundActive = activeOrders.find((o) => String(o.id) === String(orderId));
  if (foundActive) return foundActive;
  return historyOrders.find((o) => String(o.id) === String(orderId)) ?? null;
};
const selectIsOnline = (state) => state.sync?.isOnline;

// Selection Options
const RETURN_REASONS = [
  { icon: '🚪', title: 'Customer Not Available', desc: 'Customer could not be contacted.' },
  { icon: '❌', title: 'Customer Rejected Order', desc: 'Customer refused delivery.' },
  { icon: '📦', title: 'Product Damaged', desc: 'Package damaged during transport.' },
  { icon: '📍', title: 'Wrong Address', desc: 'Unable to locate customer.' },
  { icon: '⚖️', title: 'Quantity Mismatch', desc: 'Incorrect quantity.' },
  { icon: '🚫', title: 'Customer Cancelled', desc: 'Order cancelled by customer.' },
  { icon: '📝', title: 'Other', desc: 'Custom reason.' }
];

// 🚚 PROGRESS TRACKER CARD
const ProgressTracker = memo(function ProgressTracker({ status }) {
  const isAssigned = true;
  const isPickedUp = true;
  const isOnWay = status === 'ASSIGNED' || status === 'IN_TRANSIT';
  const isDelivered = status === 'COMPLETED';

  const driveAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (isOnWay) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(driveAnim, { toValue: 0.65, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(driveAnim, { toValue: 0.45, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ])
      ).start();
    } else if (isDelivered) {
      driveAnim.setValue(1);
    }
  }, [status]);

  const leftPosition = driveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '88%'],
  });

  return (
    <View style={styles.progressCard}>
      <View style={styles.progressRowHeader}>
        <View>
          <Text style={styles.progressLabel}>ETA</Text>
          <Text style={styles.progressValue}>⚡ 8 min</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.progressLabel}>Distance</Text>
          <Text style={styles.progressValue}>📍 2.4 km</Text>
        </View>
      </View>

      <View style={styles.progressBarWrapper}>
        <View style={styles.progressTrackLine} />
        <Animated.View style={[styles.progressScooter, { left: leftPosition }]}>
          <Text style={{ fontSize: 18 }}>🛵</Text>
        </Animated.View>
      </View>

      <View style={styles.progressStepsRow}>
        <View style={styles.stepItem}>
          <Text style={[styles.stepDot, isAssigned && styles.stepDotCompleted]}>✓</Text>
          <Text style={styles.stepLabel}>Assigned</Text>
        </View>
        <View style={styles.stepItem}>
          <Text style={[styles.stepDot, isPickedUp && styles.stepDotCompleted]}>✓</Text>
          <Text style={styles.stepLabel}>Picked Up</Text>
        </View>
        <View style={styles.stepItem}>
          <Text style={[styles.stepDot, isOnWay && styles.stepDotActive]}>{isDelivered ? '✓' : '🛵'}</Text>
          <Text style={[styles.stepLabel, isOnWay && { color: '#15803D', fontWeight: 'bold' }]}>On Way</Text>
        </View>
        <View style={styles.stepItem}>
          <Text style={[styles.stepDot, isDelivered && styles.stepDotCompleted]}>{isDelivered ? '✓' : '○'}</Text>
          <Text style={styles.stepLabel}>Delivered</Text>
        </View>
      </View>
    </View>
  );
});

// 📍 PREMIUM LIVE LOCATION CARD — 4 states: Default / Loading / Success / Already Verified
const LiveLocationCard = memo(function LiveLocationCard({ isLocationTagged, isSubmitting, onPress }) {
  // Pulse ring for idle state
  const pulse = useRef(new Animated.Value(1)).current;
  // Spin for loading state  
  const spinVal = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(null);
  // Pop scale for success entry
  const successScale = useRef(new Animated.Value(isLocationTagged ? 1 : 0.85)).current;
  const successOpacity = useRef(new Animated.Value(isLocationTagged ? 1 : 0)).current;
  // Card status dot fade
  const dotFade = useRef(new Animated.Value(1)).current;

  // Idle pulsing dot animation
  useEffect(() => {
    if (!isLocationTagged && !isSubmitting) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.25, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1.0, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulse.setValue(1);
    }
  }, [isLocationTagged, isSubmitting]);

  // Loading spin animation
  useEffect(() => {
    if (isSubmitting) {
      spinVal.setValue(0);
      spinAnim.current = Animated.loop(
        Animated.timing(spinVal, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true })
      );
      spinAnim.current.start();
    } else {
      if (spinAnim.current) spinAnim.current.stop();
      spinVal.setValue(0);
    }
  }, [isSubmitting]);

  // Success pop-in animation when tagged
  useEffect(() => {
    if (isLocationTagged) {
      Animated.parallel([
        Animated.spring(successScale, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }),
        Animated.timing(successOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      successScale.setValue(0.85);
      successOpacity.setValue(0);
    }
  }, [isLocationTagged]);

  const spinRotation = spinVal.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const handlePress = () => {
    if (isLocationTagged || isSubmitting) return;
    onPress();
  };

  // ── Determine UI state
  const STATE = isLocationTagged ? 'VERIFIED' : isSubmitting ? 'LOADING' : 'DEFAULT';

  const btnStyle = [
    styles.tagLocationBtn,
    STATE === 'LOADING' && styles.tagLocationBtnLoading,
    STATE === 'VERIFIED' && styles.tagLocationBtnVerified,
  ];

  return (
    <View style={styles.locationCard}>
      {/* Header Row */}
      <View style={styles.locationHeaderRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(10) }}>
          <Animated.View style={{ transform: [{ scale: pulse }] }}>
            <View style={[
              styles.locationBadgeDot,
              STATE === 'VERIFIED' && { backgroundColor: '#22C55E' },
              STATE === 'LOADING' && { backgroundColor: '#F59E0B' },
            ]} />
          </Animated.View>
          <View>
            <Text style={styles.locationCardTitle}>Live GPS Status</Text>
            <Text style={[
              styles.locationCardSubtitle,
              STATE === 'VERIFIED' && { color: '#16A34A', fontWeight: '700' },
            ]}>
              {STATE === 'LOADING'
                ? 'Fetching coordinates...'
                : STATE === 'VERIFIED'
                  ? '✓ Coordinates saved successfully'
                  : 'Tap to calibrate delivery point'}
            </Text>
          </View>
        </View>
        {/* Verified badge chip */}
        {STATE === 'VERIFIED' && (
          <Animated.View style={[
            styles.verifiedChip,
            { transform: [{ scale: successScale }], opacity: successOpacity }
          ]}>
            <Text style={styles.verifiedChipText}>✅ Verified</Text>
          </Animated.View>
        )}
      </View>

      {/* Stats Row */}
      <View style={styles.locationStats}>
        <View style={styles.locStatItem}>
          <Text style={styles.locStatVal}>2.4 km</Text>
          <Text style={styles.locStatLbl}>Current Distance</Text>
        </View>
        <View style={styles.locStatItem}>
          <Text style={styles.locStatVal}>8 min</Text>
          <Text style={styles.locStatLbl}>ETA Time</Text>
        </View>
      </View>

      {/* CTA Button */}
      <AnimatedPressable
        onPress={handlePress}
        disabled={isSubmitting || isLocationTagged}
        style={btnStyle}
      >
        {STATE === 'LOADING' ? (
          <>
            <Animated.View style={{ transform: [{ rotate: spinRotation }], marginRight: s(8) }}>
              <Text style={{ fontSize: ms(16) }}>📡</Text>
            </Animated.View>
            <Text style={styles.tagLocationBtnTextLoading}>Saving Location...</Text>
          </>
        ) : STATE === 'VERIFIED' ? (
          <Animated.View style={[
            { flexDirection: 'row', alignItems: 'center' },
            { transform: [{ scale: successScale }], opacity: successOpacity },
          ]}>
            <Text style={{ fontSize: ms(16), marginRight: s(8) }}>✅</Text>
            <Text style={styles.tagLocationBtnTextVerified}>Location Verified</Text>
          </Animated.View>
        ) : (
          <>
            <Text style={{ fontSize: ms(16), marginRight: s(8) }}>📍</Text>
            <Text style={styles.tagLocationBtnText}>Calibrate Location GPS</Text>
          </>
        )}
      </AnimatedPressable>

      {/* Already verified hint */}
      {STATE === 'VERIFIED' && (
        <Text style={styles.locationAlreadyVerifiedHint}>
          Location already verified. No further update needed.
        </Text>
      )}
    </View>
  );
});

// 📝 REMARKS INPUT WIDGET
const RemarksInput = memo(function RemarksInput({ value, onChangeText, label = "Delivery Remarks (Optional)" }) {
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(borderAnim, {
      toValue: focused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [focused]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E5E7EB', '#166534'],
  });

  const labelTranslateY = useRef(new Animated.Value(value ? -18 : 10)).current;
  const labelScale = useRef(new Animated.Value(value ? 0.85 : 1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(labelTranslateY, {
        toValue: (focused || value) ? -18 : 10,
        tension: 150,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(labelScale, {
        toValue: (focused || value) ? 0.85 : 1,
        tension: 150,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused, value]);

  return (
    <Animated.View style={[styles.remarksContainer, { borderColor }]}>
      <Animated.View style={{
        position: 'absolute',
        left: 12,
        transform: [{ translateY: labelTranslateY }, { scale: labelScale }],
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 4,
        zIndex: 10,
      }}>
        <Text style={{ color: focused ? '#166534' : '#64748B', fontSize: 12, fontWeight: 'bold' }}>
          {label}
        </Text>
      </Animated.View>
      <TextInput
        style={styles.remarksTextArea}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        multiline
        maxLength={150}
        placeholder={focused ? "Enter details here..." : ""}
        placeholderTextColor="#64748B"
      />
      <Text style={styles.charCounter}>{value?.length || 0}/150</Text>
    </Animated.View>
  );
});

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const dispatch = useDispatch();
  const order = useSelector(selectOrderById(id));
  const isOnline = useSelector(selectIsOnline);
  const driver = useSelector((state) => state.auth?.driver);
  const insets = useSafeAreaInsets();

  const [isTransitioning, setIsTransitioning] = useState(true);

  // Flow controllers
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [completeSheetVisible, setCompleteSheetVisible] = useState(false);
  const [locationSuccessModalVisible, setLocationSuccessModalVisible] = useState(false);
  
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [returnPhotos, setReturnPhotos] = useState([]); // Array supporting multiple return proof images
  const [photoUploading, setPhotoUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);

  const [remarks, setRemarks] = useState('');
  const [returnRemarks, setReturnRemarks] = useState('');
  const [returnReason, setReturnReason] = useState('Other');
  const [isValidating, setIsValidating] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [imgErrors, setImgErrors] = useState({});

  // Scroll tracking value
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    RouteService.loadTodaysRoute(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [id]);

  const hasRealCoords = (ord) => {
    if (!ord) return false;
    const latitude = ord.latitude ?? ord.lat;
    const longitude = ord.longitude ?? ord.lng;
    if (!latitude || !longitude) return false;
    if (Math.abs(latitude - 23.25) < 0.0001 && Math.abs(longitude - 77.41) < 0.0001) {
      return false;
    }
    return true;
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  // Derive locationTagged directly from Redux order state (persists across screen reopens & different orders)
  const isLocationTagged = Boolean(order?.locationTagged) || hasRealCoords(order);
  const [geoError, setGeoError] = useState(null);
  const [validatedCoords, setValidatedCoords] = useState(null);

  // Return/Replacement details
  const [requestType, setRequestType] = useState('RETURN'); // 'RETURN' | 'REPLACEMENT'
  const [selectedItems, setSelectedItems] = useState({}); // { [itemId]: { selected: boolean, quantity: number } }

  if (!order) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Order not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCall = () => {
    triggerHaptic('light');
    Linking.openURL(`tel:${order.customerPhone || order.phone}`);
  };

  const handleWhatsApp = () => {
    triggerHaptic('light');
    const num = order.customerPhone || order.phone || '9000000002';
    Linking.openURL(`whatsapp://send?phone=+91${num}&text=Hello, I am your Ranbhaji delivery partner.`);
  };

  const handleNavigate = () => {
    triggerHaptic('light');
    const lat = order.latitude || order.lat || 23.25;
    const lng = order.longitude || order.lng || 77.41;
    Linking.openURL(`http://maps.google.com/?daddr=${lat},${lng}`);
  };

  const handleCopyAddress = () => {
    triggerHaptic('light');
    Clipboard.setString(order.address || 'Danish Kunji, Bhopal');
    Alert.alert('📋 Address Copied', 'Address copied to clipboard!');
  };

  const handleTagLocation = async () => {
    // Guard: prevent duplicate submissions
    if (isSubmitting || isLocationTagged) return;

    try {
      setIsSubmitting(true);
      triggerHaptic('light');

      // 1. Ensure GPS permission
      const permitted = await LocationVerificationService.hasPermission();
      if (!permitted) {
        const granted = await LocationVerificationService.requestPermission();
        if (!granted) {
          Alert.alert('Permission Required', 'Location permission is needed to calibrate GPS coordinates.');
          return;
        }
      }

      // 2. Fetch current GPS coords
      const location = await LocationVerificationService.getCurrentLocation();
      if (!location) {
        Alert.alert('GPS Unavailable', 'Unable to fetch your GPS coordinates. Move to an open area and retry.');
        return;
      }

      // 3. Try to save to backend (optional — skip gracefully if no addressId)
      const addressId = order.addressId;
      let backendSynced = false;
      if (addressId) {
        try {
          const response = await apiClient.patch(`/addresses/${addressId}/location`, {
            latitude: location.latitude,
            longitude: location.longitude,
          });
          backendSynced = Boolean(response.data?.success);
        } catch (apiErr) {
          // Non-fatal: persist locally even if backend is offline
          console.warn('[handleTagLocation] Backend sync failed (offline mode):', apiErr?.message);
        }
      }

      // 4. Persist locationTagged flag into Redux (and via MMKV)
      dispatch(setLocationTagged({
        orderId: order.id,
        latitude: location.latitude,
        longitude: location.longitude,
      }));

      // 5. Haptic + success modal
      triggerHaptic('notificationSuccess');
      setLocationSuccessModalVisible(true);

    } catch (err) {
      console.error('[handleTagLocation]', err);
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to save location.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Deliver Flow ───

  const handleDeliverPress = async () => {
    setGeoError(null);
    setIsValidating(true);

    const result = await LocationVerificationService.validateForDelivery({
      latitude: order.lat || order.latitude,
      longitude: order.lng || order.longitude,
    });

    setIsValidating(false);

    if (!result.valid) {
      const messages = {
        LOCATION_PERMISSION_DENIED: 'Location permission is required. Please enable it in Settings.',
        LOCATION_UNAVAILABLE: 'Could not get your GPS location. Move to an open area and try again.',
        OUTSIDE_GEOFENCE: `You are ${result.distanceMeters}m away. Move within 100m of the delivery address.`,
      };
      setGeoError(messages[result.reason] || 'Location check failed.');
      triggerHaptic('error');
      setShakeTrigger((prev) => prev + 1);
      return;
    }

    setValidatedCoords(result.driverCoords);
    triggerHaptic('medium');
    setCompleteSheetVisible(true);
    setConfirmCheckbox(false);
    setCapturedPhoto(null);
  };

  const performDeliverySubmit = async () => {
    if (!confirmCheckbox) {
      triggerHaptic('error');
      setShakeTrigger((prev) => prev + 1);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        orderId: order.id,
        status: 'COMPLETED',
        photoUri: capturedPhoto,
        driverName: driver?.name || 'Driver',
        latitude: validatedCoords?.latitude || 0.0,
        longitude: validatedCoords?.longitude || 0.0,
        remarks: remarks || 'Delivered to customer directly',
      };

      QueueManager.enqueue(QUEUE_ACTION_TYPES.ORDER_DELIVER, payload, capturedPhoto);
      dispatch(updateOrderStatus(payload));
      
      TelemetryService.logEvent('DELIVERY_COMPLETE', {
        latitude: payload.latitude,
        longitude: payload.longitude,
      });

      if (isOnline) {
        SyncEngine.triggerSync();
        RouteService.fetchHistoryCount();
      }

      setCompleteSheetVisible(false);
      setSuccessModalVisible(true);

      setTimeout(() => {
        setSuccessModalVisible(false);
        router.replace('/(tabs)');
      }, 5500);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to complete delivery.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Image Picker Integration ───

  const handlePickFromGallery = async (targetMode = 'deliver') => {
    triggerHaptic('light');
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission Denied', 'Gallery access is required to select photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      processSelectedImage(result.assets[0].uri, targetMode);
    }
  };

  const handlePickFromCamera = async (targetMode = 'deliver') => {
    triggerHaptic('light');
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission Denied', 'Camera access is required to capture verification photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      processSelectedImage(result.assets[0].uri, targetMode);
    }
  };

  const processSelectedImage = async (uri, targetMode) => {
    setPhotoUploading(true);
    setUploadProgress(0.1);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 0.9) {
          clearInterval(progressInterval);
          return 0.9;
        }
        return prev + 0.15;
      });
    }, 120);

    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.WEBP }
      );
      
      if (targetMode === 'deliver') {
        setCapturedPhoto(manipResult.uri);
      } else {
        // Return flow: append to multiple photos list (limit up to 5)
        setReturnPhotos((prev) => {
          if (prev.length >= 5) {
            Alert.alert('Limit Reached', 'You can upload up to 5 proof photos.');
            return prev;
          }
          return [...prev, manipResult.uri];
        });
      }
      setUploadProgress(1.0);
    } catch (e) {
      console.error('[processSelectedImage] Compression failed:', e);
    } finally {
      clearInterval(progressInterval);
      setPhotoUploading(false);
    }
  };

  // ─── Return/Replacement Flow ───

  const isItemLockedForReturn = (item) => {
    if (!item) return false;
    const rStatus = (item.returnStatus || item.return_status || 'none').toLowerCase();
    return (
      item.isReturned ||
      item.isReturnPending ||
      item.isReturnRequested ||
      item.isReturnRejected ||
      rStatus !== 'none'
    );
  };

  const handleReturnPress = () => {
    triggerHaptic('light');
    const initial = {};
    const eligibleItems = (order.items || []).filter(item => !isItemLockedForReturn(item));
    if (eligibleItems.length === 0) {
      Alert.alert(
        'Return Restricted',
        'All items in this order have already been returned, requested by customer, or are locked from selection.'
      );
      return;
    }
    eligibleItems.forEach((item) => {
      initial[item.id] = { selected: true, quantity: item.quantity };
    });
    setSelectedItems(initial);
    setReturnReason('Other');
    setReturnPhotos([]);
    setReturnRemarks('');
    setRequestType('RETURN');
    setReturnModalVisible(true);
  };

  const toggleItemSelection = (itemId) => {
    const targetItem = (order.items || []).find(it => String(it.id) === String(itemId));
    if (!targetItem || isItemLockedForReturn(targetItem)) {
      triggerHaptic('error');
      return;
    }
    triggerHaptic('light');
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        selected: !prev[itemId]?.selected,
      },
    }));
  };

  const adjustItemQuantity = (itemId, change) => {
    const targetItem = (order.items || []).find(it => String(it.id) === String(itemId));
    if (!targetItem || isItemLockedForReturn(targetItem)) return;

    triggerHaptic('light');
    const maxQty = targetItem.quantity || 1;
    setSelectedItems((prev) => {
      const current = prev[itemId]?.quantity || 1;
      let next = current + change;
      if (next < 1) next = 1;
      if (next > maxQty) next = maxQty;
      return {
        ...prev,
        [itemId]: {
          ...prev[itemId],
          quantity: next,
        },
      };
    });
  };

  const handleToggleSelectAll = () => {
    triggerHaptic('light');
    const eligibleItems = (order.items || []).filter(item => !isItemLockedForReturn(item));
    const allSelected = eligibleItems.length > 0 && eligibleItems.every(item => selectedItems[item.id]?.selected);

    setSelectedItems((prev) => {
      const next = { ...prev };
      eligibleItems.forEach((item) => {
        next[item.id] = {
          quantity: prev[item.id]?.quantity || item.quantity || 1,
          selected: !allSelected,
        };
      });
      return next;
    });
  };

  const handleReturnSubmit = async () => {
    const isReplacement = requestType === 'REPLACEMENT';
    const eligibleItems = (order.items || []).filter(item => !isItemLockedForReturn(item));
    // Strictly include ONLY checked / selected items from the checklist
    const selectedList = eligibleItems
      .filter((item) => selectedItems[item.id]?.selected)
      .map((item) => ({
        ...item,
        quantity: selectedItems[item.id]?.quantity || item.quantity,
      }));

    if (selectedList.length === 0) {
      triggerHaptic('error');
      Alert.alert('No Items Selected', 'Please check/select at least one item to return.');
      setShakeTrigger((prev) => prev + 1);
      return;
    }

    if (!returnReason || returnPhotos.length === 0) {
      triggerHaptic('error');
      Alert.alert('Photo Required', 'Please take at least one photo for verification.');
      setShakeTrigger((prev) => prev + 1);
      return;
    }
    setIsSubmitting(true);

    try {
      const status = isReplacement ? 'REPLACED' : 'RETURNED';

      const payload = {
        orderId: order.id,
        status,
        items: selectedList,
        reason: returnReason,
        photoUri: returnPhotos[0], // fallback first photo for backward MMKV compatibility
        photos: returnPhotos,
        remarks: returnRemarks,
        driverName: 'Rohan Sharma',
      };

      QueueManager.enqueue(
        isReplacement ? QUEUE_ACTION_TYPES.ORDER_REPLACE : QUEUE_ACTION_TYPES.ORDER_RETURN,
        payload,
        returnPhotos[0]
      );

      dispatch(updateOrderStatus(payload));

      TelemetryService.logEvent(isReplacement ? 'REPLACEMENT_COMPLETE' : 'RETURN_COMPLETE');

      if (isOnline) {
        SyncEngine.triggerSync();
        RouteService.fetchHistoryCount();
      }

      setReturnModalVisible(false);

      Alert.alert(
        isReplacement ? '↩️ Order Returned' : '↩️ Return Created',
        isReplacement
          ? 'Order returned successfully and pushed to next schedule.'
          : 'Return request has been logged successfully.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
      );

      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1200);
    } finally {
      setIsSubmitting(false);
    }
  };

  const eligibleReturnItems = (order.items || []).filter(item => !isItemLockedForReturn(item));
  const selectedReturnCount = eligibleReturnItems.filter(item => selectedItems[item.id]?.selected).length;
  const isAllSelected = eligibleReturnItems.length > 0 && selectedReturnCount === eligibleReturnItems.length;
  const isCompleted = order.status === 'COMPLETED' || order.status === 'RETURNED' || order.status === 'REPLACED' || order.status === 'REPLACEMENT_SCHEDULED';
  const canReturn = (order.status === 'COMPLETED' || order.status === 'RETURNED') && eligibleReturnItems.length > 0;
  const canDeliver = !isCompleted;

  // Compute active return modal progress step (1 to 3)
  const getReturnStep = () => {
    if (selectedReturnCount === 0) return 1;
    if (returnPhotos.length === 0) return 2;
    return 3;
  };

  const returnStep = getReturnStep();

  // Header shrinking values on scroll
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [65, 55],
    extrapolate: 'clamp',
  });

  const headerPadding = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [12, 6],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Fixed Sticky Header with Glassmorphism Effect ── */}
      <Animated.View style={[styles.topBar, { height: headerHeight, paddingBottom: headerPadding }]}>
        <AnimatedPressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </AnimatedPressable>
        <Text style={styles.orderNum}>Order #{order.id}</Text>
        <AnimatedPressable onPress={handleCall} style={styles.callBtn}>
          <Text style={styles.callText}>📞 Call</Text>
        </AnimatedPressable>
      </Animated.View>

      {/* ── Main Scroll View Content ── */}
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.content, { paddingBottom: isCompleted ? 40 : 120 + (insets.bottom || 14) }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* 🚚 DELIVERY PROGRESS CARD */}
        <AnimatedCard delay={20}>
          <ProgressTracker status={order.status} />
        </AnimatedCard>

        {/* CUSTOMER CARD WITH DETAILS & QUICK ACTIONS */}
        <AnimatedCard delay={60}>
          <View style={styles.card}>
            <View style={styles.customerHeaderRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{order.customerName?.charAt(0) || 'C'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.customerName}>{order.customerName}</Text>
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedBadgeText}>✓ Verified</Text>
                  </View>
                </View>
                <Text style={styles.customerPhone}>{formatPhone(order.customerPhone || order.phone)}</Text>
              </View>
            </View>

            {/* Profile Statistics */}
            <View style={styles.customerStatsRow}>
              <Text style={styles.customerStatTxt}>⭐ 4.9 Rating</Text>
              <View style={styles.statDot} />
              <Text style={styles.customerStatTxt}>42 Deliveries Done</Text>
            </View>

            <Text style={styles.address}>📍 {order.address}</Text>
            {order.deliveryInstructions && (
              <View style={styles.noteBox}>
                <Text style={styles.noteText}>📝 {order.deliveryInstructions}</Text>
              </View>
            )}

            {/* Quick Actions Row */}
            <View style={styles.quickActionsRow}>
              <TouchableOpacity activeOpacity={0.85} style={styles.quickActionBtn} onPress={handleCall}>
                <Text style={styles.quickActionIcon}>📞</Text>
                <Text style={styles.quickActionLbl}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.85} style={styles.quickActionBtn} onPress={handleWhatsApp}>
                <Text style={styles.quickActionIcon}>💬</Text>
                <Text style={styles.quickActionLbl}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.85} style={styles.quickActionBtn} onPress={handleNavigate}>
                <Text style={styles.quickActionIcon}>📍</Text>
                <Text style={styles.quickActionLbl}>Navigate</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.85} style={styles.quickActionBtn} onPress={handleCopyAddress}>
                <Text style={styles.quickActionIcon}>📋</Text>
                <Text style={styles.quickActionLbl}>Copy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </AnimatedCard>

        {/* 📍 LIVE GPS LOCATION PANEL */}
        <AnimatedCard delay={120}>
          <LiveLocationCard
            isLocationTagged={isLocationTagged}
            isSubmitting={isSubmitting}
            onPress={handleTagLocation}
          />
        </AnimatedCard>

        {/* CUSTOMER RETURN REQUEST BANNER */}
        {(() => {
          const userReturnItems = (order.items || []).filter(item => {
            const rStatus = (item.returnStatus || item.return_status || 'none').toLowerCase();
            return item.isReturnRequested || rStatus === 'requested' || (rStatus === 'pending' && (item.returnedBy === 'user' || item.returned_by === 'user'));
          });
          if (userReturnItems.length === 0) return null;
          return (
            <AnimatedCard delay={140}>
              <View style={{
                backgroundColor: '#FFFBEB',
                borderWidth: 1.5,
                borderColor: '#F59E0B',
                borderRadius: ms(12),
                padding: ms(14),
                marginBottom: vs(12),
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}>
                <Text style={{ fontSize: ms(24) }}>⚠️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: ms(13), fontWeight: 'bold', color: '#B45309' }}>
                    Customer Return Requested ({userReturnItems.length} items)
                  </Text>
                  <Text style={{ fontSize: ms(11), color: '#92400E', marginTop: 2, lineHeight: 16 }}>
                    User ne in items ke return ki request daal di hai. Yeh items locked hain taaki dubara return na ho sake.
                  </Text>
                </View>
              </View>
            </AnimatedCard>
          );
        })()}

        {/* ORDER ITEMS CARD */}
        <AnimatedCard delay={160}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🛒 Order Items ({order.items?.length || 0})</Text>
            {order.items?.map((item, i) => {
              const isWater = item.category?.toLowerCase().includes('water') || item.productName?.toLowerCase().includes('water') || item.productName?.toLowerCase().includes('alkaline');
              const rStatus = (item.returnStatus || item.return_status || 'none').toLowerCase();
              const isApproved = item.isReturned || rStatus === 'approved';
              const isRequested = item.isReturnRequested || rStatus === 'requested' || (rStatus === 'pending' && (item.returnedBy === 'user' || item.returned_by === 'user'));
              const isPending = !isRequested && (item.isReturnPending || rStatus === 'pending');
              const isRejected = item.isReturnRejected || rStatus === 'rejected';

              const pName = item.productName || item.name || '';
              const unitMatch = pName ? pName.match(/(\d+(?:\.\d+)?\s*(?:kg|gm|g|L|ml|units?|pcs?|pieces?))/i) : null;
              const unitLabel = unitMatch ? unitMatch[1].trim() : null;

              const displayName = unitMatch
                ? pName.replace(unitMatch[0], '').replace(/\s{2,}/g, ' ').trim().replace(/,\s*$/, '').replace(/-\s*$/, '').trim()
                : (pName || 'Item');

              const hindiName = item.hindiName || item.hindi_name || item.Product?.hindi_name || item.product?.hindi_name || null;

              const rawImg = item.image || item.imageUrl || item.image_url || item.photo || item.product_image || item.Product?.image_url || item.Product?.image || item.Product?.photo || item.product?.image_url || item.product?.image || null;
              const fallbackImg = getProductImageFallback(item.productName || item.name, item.category);

              const itemImgUri = (rawImg && !imgErrors[i])
                ? (rawImg.startsWith('http') ? rawImg : `https://rambhaji.backend.shreenari.com${rawImg.startsWith('/') ? '' : '/'}${rawImg}`)
                : fallbackImg;

              const displayQty = unitLabel || `${item.qty || item.quantity || 1} ${item.qtyUnit || 'pcs'}`;

              return (
                <View key={i} style={[styles.productRow, isApproved && { opacity: 0.8 }]}>
                  {/* Left: Product Thumbnail Box */}
                  <View style={styles.itemThumbWrapper}>
                    <Image
                      source={{ uri: itemImgUri }}
                      style={styles.itemThumbImage}
                      contentFit="cover"
                      transition={200}
                      onError={() => setImgErrors(prev => ({ ...prev, [i]: true }))}
                    />
                  </View>

                  {/* Middle Column: English Name, Hindi Name, Category Tag */}
                  <View style={styles.productDetailsCol}>
                    <Text
                      style={[
                        styles.productNameMain,
                        isApproved && { color: '#94A3B8', textDecorationLine: 'line-through' },
                        isRequested && { color: '#B45309' },
                        isPending && { color: '#D97706' },
                        isRejected && { color: '#DC2626' }
                      ]}
                      numberOfLines={1}
                    >
                      {displayName}
                    </Text>
                    {hindiName ? (
                      <Text
                        style={[
                          styles.productHindiSub,
                          isApproved && { color: '#94A3B8', textDecorationLine: 'line-through' }
                        ]}
                        numberOfLines={1}
                      >
                        {hindiName}
                      </Text>
                    ) : null}

                    {isApproved ? (
                      <View style={[styles.categoryPillTag, { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' }]}>
                        <Text style={[styles.categoryPillTagText, { color: '#64748B' }]}>
                          ↩️ Returned (Approved)
                        </Text>
                      </View>
                    ) : isRequested ? (
                      <View style={{ gap: 2, marginTop: 2 }}>
                        <View style={[styles.categoryPillTag, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
                          <Text style={[styles.categoryPillTagText, { color: '#B45309', fontWeight: 'bold' }]}>
                            🙋‍♂️ User Return Requested
                          </Text>
                        </View>
                        {item.returnReason ? (
                          <Text style={{ fontSize: 10, color: '#B45309', fontStyle: 'italic' }} numberOfLines={1}>
                            "{item.returnReason}"
                          </Text>
                        ) : null}
                      </View>
                    ) : isPending ? (
                      <View style={[styles.categoryPillTag, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                        <Text style={[styles.categoryPillTagText, { color: '#D97706' }]}>
                          ⏳ Return Pending
                        </Text>
                      </View>
                    ) : isRejected ? (
                      <View style={[styles.categoryPillTag, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
                        <Text style={[styles.categoryPillTagText, { color: '#DC2626' }]}>
                          ❌ Return Rejected
                        </Text>
                      </View>
                    ) : (
                      <View style={[styles.categoryPillTag, isWater && styles.categoryPillTagWater]}>
                        <Text style={[styles.categoryPillTagText, isWater && styles.categoryPillTagTextWater]}>
                          {(isWater ? '💧' : (item.category?.toLowerCase().includes('fruit') ? '🍎' : '🥬')) + ' ' + categoryLabel(item.category)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Right Column: Quantity Badge */}
                  <View style={styles.productQtyCol}>
                    <View style={[
                      styles.qtyBadgePill,
                      isWater && styles.qtyBadgePillWater,
                      isApproved && { backgroundColor: '#F8FAFC', borderColor: '#E5E7EB' },
                      (isRequested || isPending) && { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
                      isRejected && { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }
                    ]}>
                      <Text style={[
                        styles.qtyBadgeText,
                        isWater && styles.qtyBadgeTextWater,
                        isApproved && { color: '#94A3B8' },
                        (isRequested || isPending) && { color: '#D97706' },
                        isRejected && { color: '#DC2626' }
                      ]}>
                        {displayQty}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </AnimatedCard>

        {/* PAYMENT SUMMARY CARD */}
        {order.paymentMode !== 'PREPAID' && (
          <AnimatedCard delay={200}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>💵 Payment Details</Text>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Mode of Payment:</Text>
                <Text style={styles.paymentValue}>{order.paymentMode}</Text>
              </View>

              <View style={[styles.paymentRow, { marginTop: 10 }]}>
                <Text style={styles.paymentLabel}>Collect Cash Amount:</Text>
                <Text style={[styles.paymentValue, { color: '#F59E0B', fontSize: 17 }]}>₹{order.codAmount}</Text>
              </View>
            </View>
          </AnimatedCard>
        )}

        {/* Geo Error Alerts */}
        {geoError && (
          <ShakeView trigger={shakeTrigger}>
            <AnimatedCard delay={10}>
              <View style={[styles.errorCard, { borderColor: '#EF4444', borderWidth: 1.5 }]}>
                <Text style={styles.errorCardText}>⚠️ {geoError}</Text>
              </View>
            </AnimatedCard>
          </ShakeView>
        )}

        {/* Completed details status badge */}
        {isCompleted && (
          <AnimatedCard delay={260}>
            <View style={[
              styles.completedBadge,
              {
                backgroundColor: order.status === 'COMPLETED' ? '#E9F5EF' : (order.status === 'RETURNED' ? '#FEE2E2' : '#EFF6FF'),
                borderColor: order.status === 'COMPLETED' ? '#16A34A' : (order.status === 'RETURNED' ? '#EF4444' : '#2563EB'),
                borderWidth: 1.5
              }
            ]}>
              <Text style={[
                styles.completedText,
                { color: order.status === 'COMPLETED' ? '#16A34A' : (order.status === 'RETURNED' ? '#EF4444' : '#2563EB') }
              ]}>
                {order.status === 'COMPLETED' && '✅ Order Successfully Delivered'}
                {order.status === 'RETURNED' && '↩️ Returned Items (Return Request Submitted)'}
                {order.status === 'REPLACED' && '↩️ Returned Order (Whole Order Returned)'}
                {order.status === 'REPLACEMENT_SCHEDULED' && '📅 Order Rescheduled'}
              </Text>
            </View>
          </AnimatedCard>
        )}
      </ScrollView>

      {/* ── Fixed Bottom Actions Footer ── */}
      {(canReturn || canDeliver) && (
        <View style={[styles.stickyBottomBar, { paddingBottom: insets.bottom || 14 }]}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              activeOpacity={0.88}
              style={[styles.returnBtn, !canDeliver && { flex: 1 }]}
              onPress={handleReturnPress}
            >
              <Text style={styles.returnBtnText}>↩️ Return/Replace</Text>
            </TouchableOpacity>

            {canDeliver && (
              <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.deliverBtn, !canReturn && { flex: 1 }, isValidating && styles.btnDisabled]}
                onPress={handleDeliverPress}
                disabled={isValidating}
              >
                <LinearGradient
                  colors={['#1D4ED8', '#00B4D8', '#E024E3']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.deliverBtnGradient}
                >
                  {isValidating ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.deliverBtnText}>✓ Mark Delivered</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* ── Redesigned Return & Replacement Sliding Modal ── */}
      <Modal animationType="slide" transparent visible={returnModalVisible}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%', maxHeight: '100%', justifyContent: 'flex-end' }}
          >
            <ShakeView trigger={shakeTrigger} style={{ width: '100%', maxHeight: '100%' }}>
              <SlideInSheet visible={returnModalVisible} style={[styles.modalSheet, { maxHeight: '95%' }]}>
                <ScrollView style={{ flexShrink: 1 }} showsVerticalScrollIndicator={false}>
                  
                  <Text style={styles.modalTitle}>↩️ Return / Replacement</Text>
                  <Text style={styles.modalSubtitle}>Manage customer returns and replacements for Order #{order.id}</Text>

                  {/* Top Segment Control */}
                  {eligibleReturnItems.length > 1 && (
                    <View style={styles.typeSelector}>
                      <AnimatedPressable
                        style={[styles.typeBtn, requestType === 'RETURN' && styles.typeBtnActive]}
                        onPress={() => setRequestType('RETURN')}
                      >
                        <Text style={[styles.typeText, requestType === 'RETURN' && styles.typeTextActive]}>Return</Text>
                      </AnimatedPressable>
                      <AnimatedPressable
                        style={[styles.typeBtn, requestType === 'REPLACEMENT' && styles.typeBtnActive]}
                        onPress={() => setRequestType('REPLACEMENT')}
                      >
                        <Text style={[styles.typeText, requestType === 'REPLACEMENT' && styles.typeTextActive]}>Return Order</Text>
                      </AnimatedPressable>
                    </View>
                  )}

                  {/* 3-Step Progress Indicator */}
                  <View style={styles.returnProgressContainer}>
                    <View style={styles.returnStepsLine} />
                    <View style={styles.returnStepsRow}>
                      <View style={styles.returnStepCol}>
                        <View style={[styles.stepDot, returnStep >= 1 && styles.stepDotCompleted]}>
                          <Text style={[styles.stepDotTxt, returnStep >= 1 && { color: '#166534' }]}>{returnStep > 1 ? '✓' : '1'}</Text>
                        </View>
                        <Text style={styles.stepDotLbl}>Items</Text>
                      </View>
                      <View style={styles.returnStepCol}>
                        <View style={[styles.stepDot, returnStep >= 2 && styles.stepDotCompleted]}>
                          <Text style={[styles.stepDotTxt, returnStep >= 2 && { color: '#166534' }]}>{returnStep > 2 ? '✓' : '2'}</Text>
                        </View>
                        <Text style={styles.stepDotLbl}>Proof</Text>
                      </View>
                      <View style={styles.returnStepCol}>
                        <View style={[styles.stepDot, returnStep >= 3 && styles.stepDotCompleted]}>
                          <Text style={[styles.stepDotTxt, returnStep >= 3 && { color: '#166534' }]}>{returnStep > 3 ? '✓' : '3'}</Text>
                        </View>
                        <Text style={styles.stepDotLbl}>Submit</Text>
                      </View>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: vs(16), marginBottom: vs(10) }}>
                    <Text style={[styles.modalSectionTitle, { marginTop: 0, marginBottom: 0 }]}>
                      1. Select Items ({selectedReturnCount}/{eligibleReturnItems.length})
                    </Text>

                    {eligibleReturnItems.length > 1 && (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={handleToggleSelectAll}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: isAllSelected ? '#F1F5F9' : '#F0FDF4',
                          borderWidth: 1,
                          borderColor: isAllSelected ? '#CBD5E1' : '#BBF7D0',
                          borderRadius: s(8),
                          paddingHorizontal: s(10),
                          paddingVertical: vs(5),
                          gap: s(4),
                        }}
                      >
                        <Text style={{ fontSize: ms(11), fontWeight: 'bold', color: isAllSelected ? '#475569' : '#15803D' }}>
                          {isAllSelected ? '✕ Deselect All' : '✓ Select All'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {order.items?.map((item) => {
                    const rStatus = (item.returnStatus || item.return_status || 'none').toLowerCase();
                    const isApproved = item.isReturned || rStatus === 'approved';
                    const isRequested = item.isReturnRequested || rStatus === 'requested' || (rStatus === 'pending' && (item.returnedBy === 'user' || item.returned_by === 'user'));
                    const isPending = !isRequested && (item.isReturnPending || rStatus === 'pending');
                    const isRejected = item.isReturnRejected || rStatus === 'rejected';
                    const isLocked = isApproved || isRequested || isPending || isRejected || rStatus !== 'none';

                    const state = selectedItems[item.id] || { selected: false, quantity: 0 };
                    const unitMatch = item.productName?.match(/(\d+(?:\.\d+)?\s*(?:kg|gm|g|L|ml|units?|pcs?|pieces?))/i);
                    const unitLabel = unitMatch ? unitMatch[1].trim() : null;
                    const displayName = unitLabel
                      ? item.productName.replace(unitMatch[0], '').replace(/\s{2,}/g, ' ').trim().replace(/,\s*$/, '').replace(/-\s*$/, '').trim()
                      : item.productName;

                    const rawReturnImg = item.image || item.imageUrl || item.image_url || item.photo || item.product_image || item.Product?.image_url || item.Product?.image || item.product?.image_url || item.product?.image || null;
                    const returnImgUri = rawReturnImg ? (rawReturnImg.startsWith('http') ? rawReturnImg : `https://rambhaji.backend.shreenari.com${rawReturnImg.startsWith('/') ? '' : '/'}${rawReturnImg}`) : null;

                    return (
                      <AnimatedPressable
                        key={item.id}
                        style={[
                          styles.itemSelectCard,
                          state.selected && !isLocked && styles.itemSelectCardActive,
                          isLocked && { opacity: 0.75, backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }
                        ]}
                        onPress={() => !isLocked && toggleItemSelection(item.id)}
                        disabled={isLocked}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          {/* Checkbox or Status Icon */}
                          {isApproved ? (
                            <View style={[styles.checkboxDot, { backgroundColor: '#CBD5E1', borderColor: '#94A3B8' }]}>
                              <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>✓</Text>
                            </View>
                          ) : isRequested ? (
                            <View style={[styles.checkboxDot, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
                              <Text style={{ color: '#B45309', fontSize: 11, fontWeight: 'bold' }}>👤</Text>
                            </View>
                          ) : isPending ? (
                            <View style={[styles.checkboxDot, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
                              <Text style={{ color: '#D97706', fontSize: 10, fontWeight: 'bold' }}>⏳</Text>
                            </View>
                          ) : isRejected ? (
                            <View style={[styles.checkboxDot, { backgroundColor: '#FEE2E2', borderColor: '#EF4444' }]}>
                              <Text style={{ color: '#DC2626', fontSize: 10, fontWeight: 'bold' }}>✕</Text>
                            </View>
                          ) : (
                            <View style={[styles.checkboxDot, state.selected && styles.checkboxDotActive]}>
                              {state.selected && <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>✓</Text>}
                            </View>
                          )}

                          {returnImgUri ? (
                            <Image
                              source={{ uri: returnImgUri }}
                              style={{ width: s(36), height: vs(36), borderRadius: s(8), backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E5E7EB' }}
                              contentFit="cover"
                            />
                          ) : null}

                          <View style={{ flex: 1 }}>
                            <Text style={[
                              styles.itemSelectName,
                              isApproved && { color: '#94A3B8', textDecorationLine: 'line-through' },
                              isRequested && { color: '#B45309', fontWeight: 'bold' },
                              isPending && { color: '#B45309' },
                              isRejected && { color: '#991B1B' },
                              !isLocked && !state.selected && { color: '#94A3B8' }
                            ]}>
                              {displayName}
                            </Text>

                            {/* Status Subtitle */}
                            {isApproved ? (
                              <Text style={{ fontSize: 11, color: '#64748B', fontWeight: 'bold', marginTop: 2 }}>
                                ↩️ Already Returned (Approved) • Locked
                              </Text>
                            ) : isRequested ? (
                              <View style={{ marginTop: 2 }}>
                                <Text style={{ fontSize: 11, color: '#B45309', fontWeight: 'bold' }}>
                                  🙋‍♂️ Customer Return Requested • Cannot Select
                                </Text>
                                {item.returnReason ? (
                                  <Text style={{ fontSize: 10, color: '#D97706', fontStyle: 'italic' }}>
                                    Reason: "{item.returnReason}"
                                  </Text>
                                ) : null}
                              </View>
                            ) : isPending ? (
                              <Text style={{ fontSize: 11, color: '#D97706', fontWeight: 'bold', marginTop: 2 }}>
                                ⏳ Return Pending Review • Cannot Select
                              </Text>
                            ) : isRejected ? (
                              <Text style={{ fontSize: 11, color: '#DC2626', fontWeight: 'bold', marginTop: 2 }}>
                                ❌ Return Rejected by Admin • Cannot Select
                              </Text>
                            ) : (
                              <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                                {categoryLabel(item.category)} • 1 unit
                              </Text>
                            )}
                          </View>

                          {unitLabel && (
                            <View style={styles.gramChipCompact}>
                              <Text style={styles.gramChipTextCompact}>{unitLabel}</Text>
                            </View>
                          )}
                        </View>

                        {state.selected && !isLocked && (
                          <View style={[styles.quantityControls, { marginTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 10 }]}>
                            <Text style={{ fontSize: 12, color: '#64748B', marginRight: 'auto' }}>Adjust Return Qty:</Text>
                            <TouchableOpacity onPress={() => adjustItemQuantity(item.id, -1)} style={styles.qtyBtn}>
                              <Text style={styles.qtyBtnText}>-</Text>
                            </TouchableOpacity>
                            <Text style={styles.qtyVal}>{state.quantity}</Text>
                            <TouchableOpacity onPress={() => adjustItemQuantity(item.id, 1)} style={styles.qtyBtn}>
                              <Text style={styles.qtyBtnText}>+</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </AnimatedPressable>
                    );
                  })}

                  {/* 2. SELECT REASON SECTION (HIDDEN) */}
                  {/*
                  <Text style={[styles.modalSectionTitle, { marginTop: 20 }]}>2. Select Reason</Text>
                  <View style={{ gap: 8 }}>
                    {RETURN_REASONS.map((opt) => {
                      const isSelected = returnReason === opt.title;
                      return (
                        <AnimatedPressable
                          key={opt.title}
                          style={[
                            styles.reasonCard,
                            isSelected && styles.reasonCardSelected
                          ]}
                          onPress={() => {
                            triggerHaptic('light');
                            setReturnReason(opt.title);
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <Text style={styles.reasonCardIcon}>{opt.icon}</Text>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.reasonCardTitle, isSelected && { color: '#166534', fontWeight: 'bold' }]}>
                                {opt.title}
                              </Text>
                              <Text style={styles.reasonCardDesc}>{opt.desc}</Text>
                            </View>
                          </View>
                        </AnimatedPressable>
                      );
                    })}
                  </View>
                  */}

                  {/* 2. PHOTO VERIFICATION SECTION */}
                  <Text style={[styles.modalSectionTitle, { marginTop: 24 }]}>2. Photo Verification (Required)</Text>
                  <View style={styles.uploadDashedCard}>
                    <Text style={{ fontSize: 32, marginBottom: 8 }}>📷</Text>
                    <Text style={{ fontSize: 13, color: '#1F2937', fontWeight: 'bold', marginBottom: 4 }}>Capture photo for verification</Text>
                    <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 14 }}>
                      {returnPhotos.length} / 5 Photos Uploaded (Required)
                    </Text>

                    <View style={{ width: '100%', paddingHorizontal: 16 }}>
                      <TouchableOpacity
                        activeOpacity={0.88}
                        style={[styles.quickActionBtn, { backgroundColor: '#15803D', borderColor: '#15803D', paddingVertical: vs(12) }]}
                        onPress={() => handlePickFromCamera('return')}
                        disabled={photoUploading || returnPhotos.length >= 5}
                      >
                        <Text style={[styles.quickActionLbl, { color: '#FFFFFF', fontSize: ms(13) }]}>📷 Take Photo</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Upload Previews Carousel */}
                  {returnPhotos.length > 0 && (
                    <View style={{ marginTop: 14 }}>
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 }}>Attached Photo Proofs:</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                        {returnPhotos.map((photoUri, index) => (
                          <View key={index} style={styles.previewImageThumbContainer}>
                            <Image source={{ uri: photoUri }} style={styles.previewImageThumb} />
                            <TouchableOpacity
                              activeOpacity={0.7}
                              style={styles.removeImageBadge}
                              onPress={() => {
                                triggerHaptic('light');
                                setReturnPhotos(prev => prev.filter((_, idx) => idx !== index));
                              }}
                            >
                              <Text style={styles.removeImageBadgeTxt}>✕</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {photoUploading && (
                    <View style={{ marginTop: 10 }}>
                      <Text style={{ fontSize: 10, color: '#64748B', fontWeight: 'bold', marginBottom: 4 }}>Processing Verification Image...</Text>
                      <View style={styles.progressTrackLine}>
                        <View style={[styles.progressBarFill, { width: `${uploadProgress * 100}%` } ]} />
                      </View>
                    </View>
                  )}

                  {/* 3. OPTIONAL REMARKS SECTION */}
                  <Text style={[styles.modalSectionTitle, { marginTop: 24 }]}>3. Optional Remarks</Text>
                  <RemarksInput value={returnRemarks} onChangeText={setReturnRemarks} label="Return Comments (Optional)" />

                  {/* Bottom confirmation actions */}
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 28 }}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.sheetCancelBtn}
                      onPress={() => setReturnModalVisible(false)}
                    >
                      <Text style={styles.sheetCancelText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.9}
                      style={[
                        styles.deliverBtn,
                        (!returnReason || returnPhotos.length === 0 || selectedReturnCount === 0 || isSubmitting) && styles.btnDisabled
                      ]}
                      onPress={handleReturnSubmit}
                      disabled={!returnReason || returnPhotos.length === 0 || selectedReturnCount === 0 || isSubmitting}
                    >
                      <LinearGradient
                        colors={['#15803D', '#166534']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.deliverBtnGradient}
                      >
                        {isSubmitting ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Text style={styles.deliverBtnText}>Submit Return</Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>

                </ScrollView>
              </SlideInSheet>
            </ShakeView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── Complete Delivery sliding bottom sheet ── */}
      <Modal animationType="none" transparent visible={completeSheetVisible}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%', maxHeight: '100%', justifyContent: 'flex-end' }}
          >
            <ShakeView trigger={shakeTrigger} style={{ width: '100%', maxHeight: '100%' }}>
              <SlideInSheet visible={completeSheetVisible} style={[styles.modalSheet, { maxHeight: '95%' }]}>
                <ScrollView style={{ flexShrink: 1 }} showsVerticalScrollIndicator={false}>
                  
                  <Text style={styles.modalTitle}>Complete Delivery</Text>
                  <Text style={styles.modalSubtitle}>Confirm the delivery before marking it as completed.</Text>

                  {/* 1. Delivery Remarks Section */}
                  <Text style={styles.modalSectionTitle}>1. Remarks</Text>
                  <RemarksInput value={remarks} onChangeText={setRemarks} label="Delivery Remarks (Optional)" />

                  {/* 2. Proof of Delivery Section */}
                  <Text style={[styles.modalSectionTitle, { marginTop: 20 }]}>2. Proof of Delivery (Optional)</Text>
                  <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 10 }}>Upload a delivery photo if available.</Text>

                  {!capturedPhoto ? (
                    <View style={styles.uploadDashedCard}>
                      <Text style={{ fontSize: 32, marginBottom: 8 }}>📸</Text>
                      <Text style={{ fontSize: 13, color: '#1F2937', fontWeight: 'bold', marginBottom: 4 }}>Add doorstep photo proof</Text>
                      <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 14 }}>Skip if no photo is required.</Text>

                      <View style={{ width: '100%', paddingHorizontal: 16 }}>
                        <TouchableOpacity
                          activeOpacity={0.88}
                          style={[styles.quickActionBtn, { backgroundColor: '#15803D', borderColor: '#15803D', paddingVertical: vs(12) }]}
                          onPress={() => handlePickFromCamera('deliver')}
                          disabled={photoUploading}
                        >
                          <Text style={[styles.quickActionLbl, { color: '#FFFFFF', fontSize: ms(13) }]}>📷 Take Photo</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.imagePreviewBox}>
                      <Image source={{ uri: capturedPhoto }} style={styles.previewImage} />
                      <View style={{ flex: 1, gap: 10 }}>
                        <Text style={{ fontSize: 12, color: '#16A34A', fontWeight: 'bold' }}>✓ Proof Photo Attached</Text>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          style={[styles.quickActionBtn, { backgroundColor: '#F1F5F9', borderStyle: 'solid' }]}
                          onPress={() => handlePickFromCamera('deliver')}
                        >
                          <Text style={[styles.quickActionLbl, { color: '#16A34A' }]}>🔄 Retake Photo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          style={[styles.quickActionBtn, { borderColor: '#EF4444' }]}
                          onPress={() => setCapturedPhoto(null)}
                        >
                          <Text style={[styles.quickActionLbl, { color: '#EF4444' }]}>🗑 Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Upload progress state indicator */}
                  {photoUploading && (
                    <View style={{ marginTop: 10 }}>
                      <Text style={{ fontSize: 10, color: '#64748B', fontWeight: 'bold', marginBottom: 4 }}>Processing Verification WebP File...</Text>
                      <View style={styles.progressTrackLine}>
                        <View style={[styles.progressBarFill, { width: `${uploadProgress * 100}%` }]} />
                      </View>
                    </View>
                  )}

                  {/* 3. Doorstep Confirmation Checkbox */}
                  <Text style={[styles.modalSectionTitle, { marginTop: 24 }]}>3. Confirmation</Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.checkboxRow}
                    onPress={() => {
                      triggerHaptic('light');
                      setConfirmCheckbox(!confirmCheckbox);
                    }}
                  >
                    <View style={[styles.checkboxDot, confirmCheckbox && styles.checkboxDotActive]}>
                      {confirmCheckbox && <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxLabel}>
                      I confirm that the order has been delivered to the customer.
                    </Text>
                  </TouchableOpacity>

                  {/* 4. Bottom action links */}
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.sheetCancelBtn}
                      onPress={() => setCompleteSheetVisible(false)}
                    >
                      <Text style={styles.sheetCancelText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.9}
                      style={[styles.deliverBtn, (!confirmCheckbox || isSubmitting) && styles.btnDisabled]}
                      onPress={performDeliverySubmit}
                      disabled={!confirmCheckbox || isSubmitting}
                    >
                      <LinearGradient
                        colors={['#1D4ED8', '#00B4D8', '#E024E3']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.deliverBtnGradient}
                      >
                        {isSubmitting ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Text style={styles.deliverBtnText}>Mark as Delivered</Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>

                </ScrollView>
              </SlideInSheet>
            </ShakeView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Celebration success overlay */}
      <DeliverySuccessModal
        visible={successModalVisible}
        order={order}
        onClose={() => {
          setSuccessModalVisible(false);
          router.replace('/(tabs)');
        }}
      />

      <LocationSuccessModal
        visible={locationSuccessModalVisible}
        onClose={() => setLocationSuccessModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F7FF' },
  root: { flex: 1 },
  content: { padding: s(24), paddingBottom: vs(110), gap: vs(16) },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: 0,
    backgroundColor: 'rgba(240, 247, 255, 0.96)',
    borderBottomWidth: 1.5,
    borderBottomColor: '#00B4D8',
    paddingHorizontal: s(24),
    paddingTop: vs(10),
    zIndex: 10,
    shadowColor: '#1D4ED8', shadowOpacity: 0.08, shadowRadius: s(8), elevation: 3,
  },
  backBtn: {
    width: s(44), height: vs(44), borderRadius: s(14),
    backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#00B4D8',
    shadowColor: '#1D4ED8', shadowOpacity: 0.06, shadowRadius: s(6), elevation: 2,
  },
  backText: { fontSize: ms(20), color: '#1D4ED8', fontWeight: 'bold' },
  orderNum: { fontSize: ms(18), fontWeight: '900', color: '#1D4ED8', fontFamily: 'System' },
  callBtn: {
    paddingHorizontal: s(16), paddingVertical: vs(10), borderRadius: s(14),
    backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#00B4D8',
  },
  callText: { fontSize: ms(13), color: '#1D4ED8', fontWeight: 'bold' },

  card: {
    backgroundColor: 'rgba(240, 247, 255, 0.96)', borderRadius: s(20), padding: s(20),
    borderWidth: 1.5, borderColor: '#00B4D8',
    shadowColor: '#1D4ED8', shadowOpacity: 0.08, shadowRadius: s(12), elevation: 4,
  },
  cardTitle: {
    fontSize: ms(11), fontWeight: 'bold', color: '#1D4ED8',
    marginBottom: vs(14), letterSpacing: 0.8, textTransform: 'uppercase',
  },

  progressCard: {
    backgroundColor: 'rgba(240, 247, 255, 0.96)', borderRadius: s(20), padding: s(18),
    borderWidth: 1.5, borderColor: '#00B4D8',
    shadowColor: '#1D4ED8', shadowOpacity: 0.08, shadowRadius: s(12), elevation: 4,
  },
  progressRowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: vs(12) },
  progressLabel: { fontSize: ms(10), fontWeight: 'bold', color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: 0.5 },
  progressValue: { fontSize: ms(16), fontWeight: 'bold', color: '#1D4ED8', marginTop: vs(2) },
  progressBarWrapper: { height: vs(16), justifyContent: 'center', marginVertical: vs(14), position: 'relative' },
  progressTrackLine: { height: vs(4), backgroundColor: '#BAE6FD', borderRadius: s(2), position: 'absolute', left: 0, right: 0 },
  progressBarFill: { height: '100%', backgroundColor: '#00B4D8', borderRadius: s(2) },
  progressScooter: { position: 'absolute', top: -vs(7), width: s(24), height: vs(24), zIndex: 5 },
  progressStepsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: vs(4) },
  stepItem: { alignItems: 'center', width: '22%' },
  stepDot: {
    width: s(22), height: vs(22), borderRadius: s(11), backgroundColor: '#F0F9FF',
    textAlign: 'center', lineHeight: Platform.OS === 'ios' ? vs(22) : vs(20),
    fontSize: ms(10), fontWeight: 'bold', color: '#64748B', overflow: 'hidden',
    borderWidth: 1, borderColor: '#00B4D8',
  },
  stepDotCompleted: { backgroundColor: '#ECFDF5', borderColor: '#10B981', color: '#065F46' },
  stepDotActive: { backgroundColor: '#FDF4FF', borderColor: '#E024E3', color: '#E024E3' },
  stepLabel: { fontSize: ms(9), color: '#1D4ED8', fontWeight: 'bold', marginTop: vs(5), textAlign: 'center' },

  customerHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: s(14), marginBottom: vs(14) },
  avatarCircle: { width: s(48), height: vs(48), borderRadius: s(24), backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#00B4D8' },
  avatarText: { fontSize: ms(18), fontWeight: 'bold', color: '#1D4ED8' },
  verifiedBadge: { backgroundColor: '#ECFDF5', borderRadius: s(8), paddingHorizontal: s(6), paddingVertical: vs(2), alignSelf: 'center', borderWidth: 1, borderColor: '#10B981' },
  verifiedBadgeText: { fontSize: ms(9), color: '#065F46', fontWeight: 'bold' },
  customerStatsRow: { flexDirection: 'row', alignItems: 'center', gap: s(8), marginBottom: vs(14) },
  customerStatTxt: { fontSize: ms(11), fontWeight: 'bold', color: '#1D4ED8' },
  statDot: { width: s(4), height: vs(4), borderRadius: s(2), backgroundColor: '#00B4D8' },
  customerName: { fontSize: ms(18), fontWeight: '900', color: '#1D4ED8', marginBottom: vs(2) },
  customerPhone: { fontSize: ms(13), color: '#64748B', fontWeight: 'bold' },
  address: { fontSize: ms(13), color: '#0F172A', fontFamily: 'System', lineHeight: vs(18), marginTop: vs(4), fontWeight: '600' },
  noteBox: {
    marginTop: vs(14), backgroundColor: '#FFFDF9', borderRadius: s(14),
    padding: s(12), borderLeftWidth: 4, borderLeftColor: '#F59E0B',
    borderWidth: 1, borderColor: '#FDE68A',
  },
  noteText: { fontSize: ms(12), color: '#D97706', fontWeight: '600' },

  quickActionsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: s(8), marginTop: vs(16), borderTopWidth: 1, borderTopColor: '#BAE6FD', paddingTop: vs(14) },
  quickActionBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: vs(10), borderRadius: s(12), backgroundColor: '#F0F9FF', borderWidth: 1.5, borderColor: '#00B4D8' },
  quickActionIcon: { fontSize: ms(16), marginBottom: vs(4) },
  quickActionLbl: { fontSize: ms(10), fontWeight: 'bold', color: '#1D4ED8' },

  locationCard: {
    backgroundColor: 'rgba(240, 247, 255, 0.96)', borderRadius: s(20), padding: s(18),
    borderWidth: 1.5, borderColor: '#00B4D8',
    shadowColor: '#1D4ED8', shadowOpacity: 0.08, shadowRadius: s(12), elevation: 4,
  },
  locationHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(14) },
  locationBadgeDot: { width: s(10), height: vs(10), borderRadius: s(5), backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#FFFFFF', shadowColor: '#22C55E', shadowOpacity: 0.5, shadowRadius: s(4), elevation: 2 },
  locationCardTitle: { fontSize: ms(12), fontWeight: 'bold', color: '#1F2937' },
  locationCardSubtitle: { fontSize: ms(10), color: '#64748B', marginTop: vs(1) },
  locationStats: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: vs(12), paddingBottom: vs(6) },
  locStatItem: { flex: 1 },
  locStatVal: { fontSize: ms(16), fontWeight: 'bold', color: '#1F2937' },
  locStatLbl: { fontSize: ms(9), color: '#64748B', fontWeight: 'bold', marginTop: vs(2) },

  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemThumbWrapper: {
    width: s(50),
    height: vs(50),
    marginRight: s(12),
    borderRadius: s(12),
    overflow: 'hidden',
  },
  itemThumbImage: {
    width: '100%',
    height: '100%',
    borderRadius: s(12),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemThumbFallback: {
    width: '100%',
    height: '100%',
    borderRadius: s(12),
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productDetailsCol: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: s(6),
  },
  productNameMain: {
    fontSize: ms(14),
    fontWeight: '700',
    color: '#0F172A',
  },
  productHindiSub: {
    fontSize: ms(13),
    fontWeight: '600',
    color: '#16A34A',
    marginTop: vs(1),
  },
  categoryPillTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: s(6),
    paddingHorizontal: s(6),
    paddingVertical: vs(2),
    marginTop: vs(4),
  },
  categoryPillTagWater: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  categoryPillTagText: {
    fontSize: ms(10),
    fontWeight: '700',
    color: '#475569',
  },
  categoryPillTagTextWater: {
    color: '#2563EB',
  },
  productQtyCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  qtyBadgePill: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: s(10),
    paddingHorizontal: s(10),
    paddingVertical: vs(5),
  },
  qtyBadgePillWater: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  qtyBadgeText: {
    fontSize: ms(12),
    fontWeight: '700',
    color: '#16A34A',
  },
  qtyBadgeTextWater: {
    color: '#2563EB',
  },

  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  paymentLabel: { fontSize: ms(14), color: '#64748B', fontWeight: '500' },
  paymentValue: { fontSize: ms(15), color: '#1F2937', fontWeight: 'bold' },
  prepaidBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#DCFCE7', borderColor: '#86EFAC', borderWidth: 1,
    borderRadius: s(12), paddingHorizontal: s(10), paddingVertical: vs(4), gap: s(4),
  },
  prepaidBadgeText: { color: '#16A34A', fontSize: ms(10), fontWeight: 'bold' },

  remarksContainer: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: s(16),
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
    marginTop: vs(12),
    backgroundColor: '#FFFFFF',
    position: 'relative',
    height: vs(75),
  },
  remarksTextArea: {
    flex: 1,
    fontSize: ms(14),
    color: '#1F2937',
    paddingTop: vs(6),
    textAlignVertical: 'top',
  },
  charCounter: {
    position: 'absolute',
    bottom: vs(6),
    right: s(12),
    fontSize: ms(10),
    color: '#64748B',
    fontWeight: 'bold',
  },
  tagLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderColor: '#00B4D8',
    borderWidth: 1.5,
    borderRadius: s(14),
    paddingVertical: vs(13),
    marginTop: vs(14),
  },
  tagLocationBtnLoading: {
    backgroundColor: '#FFFBEB',
    borderColor: '#D97706',
  },
  tagLocationBtnVerified: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  tagLocationBtnText: {
    color: '#1D4ED8',
    fontWeight: 'bold',
    fontSize: ms(13),
    fontFamily: 'System',
  },
  tagLocationBtnTextLoading: {
    color: '#D97706',
    fontWeight: 'bold',
    fontSize: ms(13),
    fontFamily: 'System',
  },
  tagLocationBtnTextVerified: {
    color: '#065F46',
    fontWeight: 'bold',
    fontSize: ms(13),
    fontFamily: 'System',
  },
  tagLocationBtnDisabled: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  tagLocationBtnTextDisabled: {
    color: '#64748B',
  },
  verifiedChip: {
    backgroundColor: '#ECFDF5',
    borderRadius: s(20),
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderWidth: 1,
    borderColor: '#10B981',
  },
  verifiedChipText: {
    color: '#065F46',
    fontSize: ms(10),
    fontWeight: 'bold',
  },
  locationAlreadyVerifiedHint: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: ms(11),
    marginTop: vs(8),
    fontStyle: 'italic',
  },

  errorCard: {
    backgroundColor: '#FEE2E2', borderRadius: s(16), padding: s(16),
    borderWidth: 1, borderColor: '#FCA5A5', marginBottom: vs(16),
  },
  errorCardText: { color: '#EF4444', fontWeight: '500', fontSize: ms(14) },

  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(240, 247, 255, 0.98)',
    borderTopWidth: 1.5,
    borderTopColor: '#00B4D8',
    paddingTop: vs(14),
    paddingHorizontal: s(24),
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.12,
    shadowRadius: s(16),
    elevation: 10,
    zIndex: 99,
  },
  returnBtn: {
    borderWidth: 1.5,
    borderColor: '#E024E3',
    borderRadius: s(16),
    paddingVertical: vs(14),
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1.1,
    backgroundColor: '#FDF4FF',
  },
  returnBtnText: {
    color: '#E024E3',
    fontWeight: '900',
    fontSize: ms(13),
  },
  deliverBtn: {
    borderRadius: s(16),
    overflow: 'hidden',
    flex: 2,
  },
  deliverBtnGradient: {
    paddingVertical: vs(14),
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  deliverBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: ms(14),
  },
  btnDisabled: { opacity: 0.65 },

  completedBadge: {
    borderRadius: s(16),
    padding: s(16),
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: vs(4),
  },
  completedText: { fontSize: ms(14), fontWeight: 'bold' },

  uploadDashedCard: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E5E7EB',
    borderRadius: s(20),
    paddingVertical: vs(24),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    marginTop: vs(10),
  },
  imagePreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: s(20),
    padding: s(12),
    gap: s(14),
    marginTop: vs(10),
  },
  previewImage: {
    width: s(90),
    height: vs(120),
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
    marginTop: vs(10),
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: s(16),
    padding: s(14),
  },
  checkboxLabel: {
    flex: 1,
    fontSize: ms(13),
    color: '#1F2937',
    fontWeight: '500',
    lineHeight: vs(18),
  },

  sheetCancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: s(16),
    paddingVertical: vs(14),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  sheetCancelText: {
    color: '#64748B',
    fontWeight: 'bold',
    fontSize: ms(14),
  },

  // 4-step progress layout for returns
  returnProgressContainer: {
    marginVertical: vs(20),
    position: 'relative',
    justifyContent: 'center',
  },
  returnStepsLine: {
    position: 'absolute',
    left: '12.5%',
    right: '12.5%',
    height: vs(3),
    backgroundColor: '#E5E7EB',
    top: vs(11),
    zIndex: 1,
  },
  returnStepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  returnStepCol: {
    alignItems: 'center',
    width: '25%',
  },
  stepDotTxt: {
    fontSize: ms(9),
    fontWeight: '800',
    color: '#64748B',
  },
  stepDotLbl: {
    fontSize: ms(10),
    color: '#64748B',
    fontWeight: 'bold',
    marginTop: vs(6),
    textAlign: 'center',
  },

  // Selectable Item Cards for Returns
  itemSelectCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: s(18),
    padding: s(14),
    marginBottom: vs(10),
    shadowColor: '#1F2937', shadowOpacity: 0.02, shadowRadius: s(6), elevation: 1,
  },
  itemSelectCardActive: {
    borderColor: '#166534',
    backgroundColor: '#F0FDF4',
  },

  // Reason selectable cards styling
  reasonCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: s(18),
    padding: s(14),
    shadowColor: '#1F2937', shadowOpacity: 0.02, shadowRadius: s(6), elevation: 1,
  },
  reasonCardSelected: {
    borderColor: '#166534',
    backgroundColor: '#F0FDF4',
  },
  reasonCardIcon: { fontSize: ms(20), marginRight: s(4) },
  reasonCardTitle: { fontSize: ms(13), fontWeight: 'bold', color: '#1F2937' },
  reasonCardDesc: { fontSize: ms(11), color: '#64748B', marginTop: vs(2) },

  // Multiple photos carousel indicators
  previewImageThumbContainer: {
    position: 'relative',
    width: s(72),
    height: vs(96),
    borderRadius: s(10),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  previewImageThumb: {
    width: '100%',
    height: '100%',
  },
  removeImageBadge: {
    position: 'absolute',
    top: vs(4),
    right: s(4),
    width: s(18),
    height: vs(18),
    borderRadius: s(9),
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageBadgeTxt: {
    color: '#FFFFFF',
    fontSize: ms(9),
    fontWeight: 'bold',
  },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(31,41,55,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: s(30), borderTopRightRadius: s(30),
    padding: s(24), paddingBottom: vs(40), borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#1F2937', shadowOpacity: 0.1, shadowRadius: s(16), elevation: 8,
    maxHeight: '90%',
  },
  modalTitle: { fontSize: ms(22), fontWeight: 'bold', color: '#1F2937', marginBottom: vs(4) },
  modalSubtitle: { fontSize: ms(13), color: '#64748B', marginBottom: vs(16) },
  modalSectionTitle: { fontSize: ms(11), fontWeight: 'bold', color: '#1F2937', letterSpacing: 0.5, marginTop: vs(16), marginBottom: vs(10), textTransform: 'uppercase' },

  typeSelector: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: s(14), padding: s(4), marginBottom: vs(8), borderWidth: 1, borderColor: '#E5E7EB' },
  typeBtn: { flex: 1, paddingVertical: vs(10), alignItems: 'center', borderRadius: s(10) },
  typeBtnActive: { backgroundColor: '#16A34A' },
  typeText: { fontSize: ms(13), color: '#64748B', fontWeight: 'bold' },
  typeTextActive: { color: '#FFFFFF' },

  itemSelectRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: vs(12), borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  itemSelectCheckbox: { flexDirection: 'row', alignItems: 'center', gap: s(10), flex: 1, marginRight: s(8) },
  checkboxDot: { width: s(22), height: vs(22), borderRadius: s(6), borderWidth: 2, borderColor: '#A2B5AD', backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  checkboxDotActive: { borderColor: '#16A34A', backgroundColor: '#16A34A' },
  itemSelectName: { fontSize: ms(13), color: '#1F2937', fontWeight: '500', flex: 1 },
  quantityControls: { flexDirection: 'row', alignItems: 'center', gap: s(8), flex: 0.35, justifyContent: 'flex-end' },
  qtyBtn: { width: s(26), height: vs(26), borderRadius: s(13), backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { fontSize: ms(14), color: '#16A34A', fontWeight: 'bold' },
  qtyVal: { fontSize: ms(13), color: '#1F2937', fontWeight: 'bold', minWidth: s(16), textAlign: 'center' },

  reasonOption: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: vs(12),
    paddingHorizontal: s(16), borderRadius: s(14), marginBottom: vs(8),
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E5E7EB', gap: s(12),
  },
  reasonActive: { borderColor: '#16A34A', backgroundColor: '#F1F5F9' },
  reasonDot: { width: s(16), height: vs(16), borderRadius: s(8), borderWidth: 2, borderColor: '#A2B5AD' },
  reasonDotActive: { borderColor: '#16A34A', backgroundColor: '#16A34A' },
  reasonText: { color: '#64748B', fontSize: ms(13), flex: 1, fontWeight: '500' },
  reasonTextActive: { color: '#16A34A', fontWeight: 'bold' },
  photoConfirmed: { color: '#16A34A', fontWeight: 'bold', textAlign: 'center', marginVertical: vs(8), fontSize: ms(14) },
  notFound: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  notFoundText: { color: '#16A34A', fontSize: ms(18), fontWeight: 'bold', marginBottom: vs(12) },
  backLink: { color: '#16A34A', fontWeight: 'bold', fontSize: ms(15) },
  cancelLink: { color: '#64748B', fontSize: ms(15), fontWeight: 'bold' },
  gramChipCompact: {
    backgroundColor: '#F0FDF4', borderRadius: s(6),
    paddingHorizontal: s(6), paddingVertical: vs(2),
    borderWidth: 0.5, borderColor: '#BBF7D0',
    alignSelf: 'center',
  },
  gramChipTextCompact: { fontSize: ms(10), fontWeight: '700', color: '#16A34A' },
});
