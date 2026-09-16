import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Switch,
  Modal,
  KeyboardAvoidingView,
  TextInput,
  Image,
  ActivityIndicator,
  Animated,
  Easing
} from 'react-native';
import { useSelector, shallowEqual, useDispatch } from 'react-redux';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import {
  Ionicons,
  Feather,
  MaterialIcons,
  MaterialCommunityIcons
} from '@expo/vector-icons';

import { AnimatedCard, triggerHaptic } from '../../src/components/common/Motion';
import { useDynamicBranding } from '../../src/core/branding/useDynamicBranding';
import AuthService from '../../src/features/auth/services/AuthService';
import { timeAgo } from '../../src/core/utils/dateUtils';
import { s, vs, ms } from '../../src/core/utils/responsive';
import { selectRiskLevel, selectRiskScore, selectActiveDeviceMeta } from '../../src/features/security/state/securitySlice';
import { setNetworkStatus } from '../../src/features/sync/state/syncSlice';
import { setDriver } from '../../src/features/auth/state/authSlice';
import { STORAGE_KEYS } from '../../src/config/constants';
import { secureStorage } from '../../src/core/storage/mmkvInstances';
import RouteService from '../../src/features/routes/services/RouteService';

// Redux selectors
const selectDriver = (state) => state.auth?.driver;
const selectDashboardStats = (state) => {
  const activeOrders = state.route?.orders || [];
  const historyOrders = state.route?.historyOrders || [];
  const combinedRaw = [...activeOrders, ...historyOrders];

  const allOrders = [];
  const seenIds = new Set();
  combinedRaw.forEach(o => {
    const key = String(o.id);
    if (!seenIds.has(key)) {
      seenIds.add(key);
      allOrders.push(o);
    }
  });

  const pending = activeOrders.filter((o) => {
    const s = (o.status || '').toUpperCase();
    return s === 'ASSIGNED' || s === 'IN_TRANSIT' || s === 'PENDING' || s === 'READY_FOR_DELIVERY';
  }).length;

  const completedOrdersCount = allOrders.filter((o) => {
    const s = (o.status || '').toUpperCase();
    return s === 'COMPLETED' || s === 'DELIVERED';
  }).length;
  const completed = Math.max(state.route?.historyCount || 0, completedOrdersCount);

  const returnedOrders = allOrders.filter((o) => (o.status || '').toUpperCase() === 'RETURNED');
  const replacedOrders = allOrders.filter((o) => (o.status || '').toUpperCase() === 'REPLACED');

  const returnedCount = returnedOrders.length;
  const replacementCount = replacedOrders.length;

  return {
    total: activeOrders.filter((o) => o.status !== 'REPLACEMENT_SCHEDULED').length,
    pending,
    completed,
    completedToday: state.route?.historyCountToday || completed,
    returned: returnedCount,
    replacement: replacementCount,
    totalDistanceKm: state.route?.totalDistanceKm || 0,
  };
};
const selectRouteStats = selectDashboardStats;
const selectPendingCount = (state) => state.sync?.pendingCount || 0;
const selectLastSyncAt = (state) => state.sync?.lastSyncAt;
const selectIsOnline = (state) => state.sync?.isOnline ?? true;

// Responsive window size
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 🎚️ CUSTOM COUNT UP HOOK WITH SHIMMER SUPPORT
function useCountUp(targetValue, duration = 1200, isRefreshing = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isRefreshing) {
      setCount(0);
      return;
    }

    let start = 0;
    const isKm = typeof targetValue === 'string' && targetValue.endsWith('km');
    const numericTarget = isKm
      ? parseFloat(targetValue.replace('km', ''))
      : typeof targetValue === 'number'
        ? targetValue
        : parseFloat(targetValue) || 0;

    if (numericTarget === 0) {
      setCount(targetValue);
      return;
    }

    const startTime = performance.now();

    const updateCount = (currentTime) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      // Easing out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = easeProgress * numericTarget;

      if (isKm) {
        setCount(`${currentValue.toFixed(1)}km`);
      } else if (Number.isInteger(numericTarget)) {
        setCount(Math.floor(currentValue));
      } else {
        setCount(currentValue.toFixed(2));
      }

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        setCount(targetValue);
      }
    };

    requestAnimationFrame(updateCount);
  }, [targetValue, duration, isRefreshing]);

  return count;
}

// ✨ SKELETON SHIMMER CARD WRAPPER
function ShimmerWrapper({ loading, children, style }) {
  const { themeColors } = useDynamicBranding();
  const styles = getStyles(themeColors);
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.8,
            duration: 650,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.4,
            duration: 650,
            useNativeDriver: true,
          })
        ])
      ).start();
    } else {
      opacity.setValue(1);
    }
  }, [loading]);

  if (loading) {
    return (
      <Animated.View style={[styles.shimmerCard, style, { opacity }]}>
        <View style={styles.shimmerLinesWrap}>
          <View style={styles.shimmerLineCircle} />
          <View style={styles.shimmerLineLong} />
          <View style={styles.shimmerLineShort} />
        </View>
      </Animated.View>
    );
  }

  return <>{children}</>;
}


// 🎡 ROTATING AVATAR RING COMPONENT
function RotatingAvatarRing({ children, size = ms(106) }) {
  const { themeColors } = useDynamicBranding();
  const styles = getStyles(themeColors);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 15000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Animated.View
        style={[
          styles.dashedRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            position: 'absolute',
            transform: [{ rotate }],
          },
        ]}
      />
      {children}
    </View>
  );
}


// 🟢 ONLINE STATUS PULSING BADGE
function PulseOnlineBadge({ isOnline }) {
  const { themeColors } = useDynamicBranding();
  const styles = getStyles(themeColors);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isOnline) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.8,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 0,
            useNativeDriver: true,
          })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isOnline]);

  const scale = pulseAnim;
  const opacity = pulseAnim.interpolate({
    inputRange: [1, 1.8],
    outputRange: [0.6, 0],
  });

  return (
    <View style={styles.onlineBadgeContainer}>
      {isOnline && (
        <Animated.View style={[styles.pulseCircle, { transform: [{ scale }], opacity }]} />
      )}
      <View style={[styles.solidBadge, { backgroundColor: isOnline ? '#22C55E' : '#64748B' }]} />
    </View>
  );
}

// 🔵 CIRCULAR PROGRESS INDICATOR
function useAnimProgress(targetValue, duration = 1200, isRefreshing = false) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isRefreshing) {
      setProgress(0);
      return;
    }

    const startTime = performance.now();
    const startVal = progress;

    const updateValue = (currentTime) => {
      const elapsedTime = currentTime - startTime;
      const t = Math.min(elapsedTime / duration, 1);
      
      const easeProgress = 1 - Math.pow(1 - t, 3);
      const currentValue = startVal + easeProgress * (targetValue - startVal);

      setProgress(currentValue);

      if (t < 1) {
        requestAnimationFrame(updateValue);
      } else {
        setProgress(targetValue);
      }
    };

    requestAnimationFrame(updateValue);
  }, [targetValue, duration, isRefreshing]);

  return progress;
}

function CircularProgress({ size = 56, strokeWidth = 4.5, percentage = 0, color = '#22C55E', isRefreshing = false }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useAnimProgress(percentage, 1200, isRefreshing);
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const progressRotate = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(progressRotate, {
        toValue: 1,
        duration: 18000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = progressRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-90deg', '270deg'],
  });

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Animated.View style={[{ width: size, height: size, transform: [{ rotate }] }]}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
      <View style={{ position: 'absolute' }}>
        <Text style={{ fontSize: ms(10), fontWeight: 'bold', color: '#1F2937' }}>
          {Math.floor(progress)}%
        </Text>
      </View>
    </View>
  );
}

// 📦 STATISTIC CARD WITH INTERACTION AND COUNT-UP
function StatCard({ label, targetValue, iconName, color, isRefreshing }) {
  const { themeColors } = useDynamicBranding();
  const styles = getStyles(themeColors);
  const count = useCountUp(targetValue, 1200, isRefreshing);
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    triggerHaptic('light');
    Animated.timing(scale, {
      toValue: 0.94,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[styles.statCardWrapper, { transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.statCard}
      >
        <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
          <Feather name={iconName} size={ms(20)} color={color} />
        </View>
        <Text style={styles.statCardValue}>{count}</Text>
        <Text style={styles.statCardLabel}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}


// ⚡ PREMIUM QUICK ACTION CARD
function ActionCard({ label, iconName, color, onPress }) {
  const { themeColors } = useDynamicBranding();
  const styles = getStyles(themeColors);
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    triggerHaptic('light');
    Animated.timing(scale, {
      toValue: 0.95,
      duration: 90,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[styles.actionCardWrapper, { transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={styles.actionCard}
      >
        <View style={[styles.actionIconContainer, { backgroundColor: color + '10' }]}>
          <Feather name={iconName} size={ms(18)} color={color} />
        </View>
        <Text numberOfLines={1} style={styles.actionCardLabel}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// 🔠 NAME LETTER BY LETTER FADE IN
function NameLetterFade({ name }) {
  const { themeColors } = useDynamicBranding();
  const styles = getStyles(themeColors);
  const letters = name.split('');
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {letters.map((char, idx) => (
        <Text key={idx} style={styles.driverName}>
          {char}
        </Text>
      ))}
    </View>
  );
}

// 🎊 CONFETTI PARTICLES FOR SUCCESS ANIME
function ConfettiParticle({ index }) {
  const x = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const angle = (index * 2 * Math.PI) / 16 + (Math.random() - 0.5) * 0.2;
    const speed = 40 + Math.random() * 60;
    const targetX = Math.cos(angle) * speed;
    const targetY = Math.sin(angle) * speed - 20;

    Animated.parallel([
      Animated.timing(x, {
        toValue: targetX,
        duration: 1100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(y, {
          toValue: targetY,
          duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(y, {
          toValue: targetY + 120,
          duration: 800,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        })
      ]),
      Animated.sequence([
        Animated.timing(scale, {
          toValue: ms(8 + Math.random() * 6),
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(650),
        Animated.timing(scale, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        })
      ]),
      Animated.sequence([
        Animated.delay(650),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        })
      ])
    ]).start();
  }, []);

  const colors = ['#22C55E', '#3B82F6', '#EAB308', '#EC4899', '#8B5CF6', '#F59E0B'];
  const randomColor = colors[index % colors.length];

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 8,
          height: 8,
          borderRadius: index % 2 === 0 ? 4 : 2,
          backgroundColor: randomColor,
          transform: [{ translateX: x }, { translateY: y }, { scale }],
          opacity,
        },
      ]}
    />
  );
}

// 🛡️ SYNC SUCCESS OVERLAY
function SuccessSyncOverlay({ visible, title = "Sync Completed", subtitle = "Logs secured & active" }) {
  const { themeColors } = useDynamicBranding();
  const styles = getStyles(themeColors);
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          damping: 9,
          stiffness: 90,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.successOverlay, { opacity }]}>
      <Animated.View style={[styles.successBox, { transform: [{ scale }] }]}>
        <View style={styles.successGlow} />
        <View style={styles.successCheckWrap}>
          <Ionicons name="checkmark-circle" size={54} color="#22C55E" />
        </View>
        <Text style={styles.successTitle}>{title}</Text>
        <Text style={styles.successSubtitle}>{subtitle}</Text>

        {Array.from({ length: 16 }).map((_, idx) => (
          <ConfettiParticle key={idx} index={idx} />
        ))}
      </Animated.View>
    </Animated.View>
  );
}

// 🔑 PASSWORD STRENGTH HELPER
const getPasswordStrength = (pass) => {
  if (!pass) return { label: '', color: '#E5E7EB', width: '0%' };
  let score = 0;
  if (pass.length > 5) score += 1;
  if (pass.length >= 8) score += 1;
  if (/[A-Z]/.test(pass)) score += 1;
  if (/[0-9]/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;

  if (score <= 2) {
    return { label: 'Weak', color: '#EF4444', width: '33%' };
  } else if (score <= 4) {
    return { label: 'Medium', color: '#F59E0B', width: '66%' };
  } else {
    return { label: 'Strong', color: '#10B981', width: '100%' };
  }
};

export default function ProfileScreen() {
  const { themeColors } = useDynamicBranding();
  const styles = getStyles(themeColors);
  const driver = useSelector(selectDriver);
  const stats = useSelector(selectDashboardStats, shallowEqual);
  const pendingCount = useSelector(selectPendingCount);
  const lastSyncAt = useSelector(selectLastSyncAt);
  const isOnline = useSelector(selectIsOnline);
  const riskLevel = useSelector(selectRiskLevel);
  const riskScore = useSelector(selectRiskScore);
  const deviceMeta = useSelector(selectActiveDeviceMeta);

  const dispatch = useDispatch();

  const [refreshing, setRefreshing] = useState(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const [showEditSuccess, setShowEditSuccess] = useState(false);
  const insets = useSafeAreaInsets();

  // Scroll animated values
  const scrollY = useRef(new Animated.Value(0)).current;

  // Edit Profile Bottom Sheet states
  const [showEditSheet, setShowEditSheet] = useState(false);
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Edit Profile Form States
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editGender, setEditGender] = useState('Male');
  const [editLanguage, setEditLanguage] = useState('English');
  const [editEmergencyContact, setEditEmergencyContact] = useState('');
  const [editBloodGroup, setEditBloodGroup] = useState('O+');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editPincode, setEditPincode] = useState('');
  const [editGpsLocation, setEditGpsLocation] = useState('');
  const [editAvatarUri, setEditAvatarUri] = useState(null);

  // Account Setting toggles
  const [editDarkMode, setEditDarkMode] = useState(false);
  const [editNotifEnabled, setEditNotifEnabled] = useState(true);
  const [editOnlineStatus, setEditOnlineStatus] = useState(true);
  const [editAutoAccept, setEditAutoAccept] = useState(false);
  const [editLocationPerm, setEditLocationPerm] = useState(true);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Upload/Save indicators
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [savingProfile, setSavingProfile] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showLocationSuccess, setShowLocationSuccess] = useState(false);

  // Action sheet for image picker
  const [showActionSheet, setShowActionSheet] = useState(false);

  // Pre-fill form when sheet opens
  const openEditSheet = () => {
    setEditName(driver?.name || 'Delivery Boy');
    setEditPhone(driver?.phone || '9000000004');
    setEditEmail(driver?.email || 'partner@rambhaji.com');
    setEditDob(driver?.dob || '1996-08-12');
    setEditGender(driver?.gender || 'Male');
    setEditLanguage(driver?.language || 'English');
    setEditEmergencyContact(driver?.emergencyContact || '+91 98765 43210');
    setEditBloodGroup(driver?.bloodGroup || 'O+');
    setEditAddress(driver?.address || '12, Main Road, Sector 4');
    setEditCity(driver?.city || 'Bengaluru');
    setEditState(driver?.state || 'Karnataka');
    setEditPincode(driver?.pincode || '560102');
    setEditGpsLocation(driver?.gpsLocation || '12.9716, 77.5946');
    setEditAvatarUri(driver?.avatarUri || null);

    setEditDarkMode(driver?.darkMode || false);
    setEditNotifEnabled(driver?.notifEnabled ?? true);
    setEditOnlineStatus(isOnline);
    setEditAutoAccept(driver?.autoAccept || false);
    setEditLocationPerm(driver?.locationPerm ?? true);

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');

    setShowEditSheet(true);
    triggerHaptic('light');

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(sheetTranslateY, {
        toValue: 0,
        damping: 18,
        stiffness: 90,
        useNativeDriver: true,
      })
    ]).start();
  };

  const closeEditSheet = () => {
    triggerHaptic('light');
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowEditSheet(false);
    });
  };

  // Image upload simulator
  const simulatePhotoUpload = (uri) => {
    setUploadingPhoto(true);
    setUploadProgress(0);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setUploadingPhoto(false);
        setEditAvatarUri(uri);
        triggerHaptic('success');
      }
    }, 120);
  };

  // Launch Camera
  const pickFromCamera = async () => {
    setShowActionSheet(false);
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Camera permission is required to snap photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      simulatePhotoUpload(result.assets[0].uri);
    }
  };

  // Launch Gallery
  const pickFromGallery = async () => {
    setShowActionSheet(false);
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Media library permission is required to choose photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      simulatePhotoUpload(result.assets[0].uri);
    }
  };

  // Remove photo
  const removePhoto = () => {
    setShowActionSheet(false);
    triggerHaptic('light');
    setEditAvatarUri(null);
  };

  // Fetch current GPS location
  const updateCurrentGPS = async () => {
    triggerHaptic('light');
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to update GPS coordinates.');
        setLocationLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setEditGpsLocation(`${loc.coords.latitude.toFixed(6)}, ${loc.coords.longitude.toFixed(6)}`);
      triggerHaptic('success');
      setShowLocationSuccess(true);
      setTimeout(() => setShowLocationSuccess(false), 2000);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch GPS coordinates.');
    } finally {
      setLocationLoading(false);
    }
  };

  // Save changes
  const saveProfileChanges = () => {
    if (!editName.trim()) {
      Alert.alert('Validation Error', 'Full Name cannot be empty.');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'New password and confirm password do not match.');
      return;
    }

    setSavingProfile(true);
    triggerHaptic('medium');

    // Simulate saving changes
    setTimeout(() => {
      const updatedDriver = {
        ...driver,
        name: editName,
        phone: editPhone,
        email: editEmail,
        dob: editDob,
        gender: editGender,
        language: editLanguage,
        emergencyContact: editEmergencyContact,
        bloodGroup: editBloodGroup,
        address: editAddress,
        city: editCity,
        state: editState,
        pincode: editPincode,
        gpsLocation: editGpsLocation,
        avatarUri: editAvatarUri,
        darkMode: editDarkMode,
        notifEnabled: editNotifEnabled,
        autoAccept: editAutoAccept,
        locationPerm: editLocationPerm,
      };

      // Persist locally
      secureStorage.set(STORAGE_KEYS.DRIVER_PROFILE, JSON.stringify(updatedDriver));
      dispatch(setDriver(updatedDriver));
      dispatch(setNetworkStatus(editOnlineStatus));

      setSavingProfile(false);
      triggerHaptic('success');
      
      // Close sheet & show success
      closeEditSheet();
      setShowEditSuccess(true);
      setTimeout(() => setShowEditSuccess(false), 2200);
    }, 1500);
  };

  const handleLogout = () => {
    triggerHaptic('heavy');
    if (Platform.OS === 'web') {
      const confirmLogout = window.confirm('Are you sure you want to logout? Ensure all deliveries are synced.');
      if (confirmLogout) {
        AuthService.logout();
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout? Ensure all deliveries are synced.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'destructive', onPress: () => AuthService.logout() },
        ]
      );
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    triggerHaptic('medium');
    RouteService.loadTodaysRoute(true);
    RouteService.fetchHistoryCount();
    setTimeout(() => {
      setRefreshing(false);
      setShowSyncSuccess(true);
      triggerHaptic('success');
      setTimeout(() => {
        setShowSyncSuccess(false);
      }, 2200);
    }, 1200);
  };

  const roleDisplay = {
    DRIVER:      'Delivery Executive',
    LEAD_DRIVER: 'Lead Driver',
    ADMIN:       'Administrator',
  };

  const rawPhone = driver?.phone || '';
  const displayPhone = rawPhone.startsWith('+91')
    ? rawPhone.replace('+91', '+91 ')
    : `+91 ${rawPhone}`;

  const employeeId = driver?.id ? `EMP-${String(driver.id).slice(0, 6).toUpperCase()}` : 'EMP-2026-9041';
  const joiningDate = driver?.joiningDate || 'Joined Oct 2024';
  const shiftTiming = driver?.shiftTiming || '08:00 AM - 06:00 PM';
  const currentStatus = isOnline ? 'Active & Online' : 'Offline';
  const ratingVal = driver?.rating || '4.9';

  // Floating Sync Cloud Icon
  const cloudFloat = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(cloudFloat, {
          toValue: -4,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(cloudFloat, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  // Collapsible Header Animations
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 160],
    outputRange: [vs(280), vs(115)],
    extrapolate: 'clamp',
  });

  const profileOpacity = scrollY.interpolate({
    inputRange: [0, 90],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const profileScale = scrollY.interpolate({
    inputRange: [0, 95],
    outputRange: [1, 0.72],
    extrapolate: 'clamp',
  });

  const profileTranslateY = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [0, -vs(32)],
    extrapolate: 'clamp',
  });

  const glassDetailsOpacity = scrollY.interpolate({
    inputRange: [0, 75],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const glassDetailsTranslateY = scrollY.interpolate({
    inputRange: [0, 75],
    outputRange: [0, -vs(15)],
    extrapolate: 'clamp',
  });

  const passStrength = getPasswordStrength(newPassword);

  return (
    <View style={styles.container}>
      {/* ── Collapsible Gradient Header Section ── */}
      <Animated.View style={[styles.headerWrapper, { height: headerHeight }]}>
        <LinearGradient
          colors={['#1D4ED8', '#00B4D8', '#E024E3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerContainer, { paddingTop: insets.top + 8 }]}
        >
          {/* Top Navbar Row */}
          <View style={styles.topNavbar}>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                router.back();
              }}
              style={styles.navbarBtn}
            >
              <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.navbarTitle}>Profile</Text>
            
            {/* ✏️ Edit Profile Navbar button */}
            <TouchableOpacity
              onPress={openEditSheet}
              style={styles.navbarBtn}
            >
              <Feather name="edit-2" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Profile Card Overlay Row */}
          <Animated.View style={[styles.profileMetaWrap, { opacity: profileOpacity, transform: [{ scale: profileScale }, { translateY: profileTranslateY }] }]}>
            <RotatingAvatarRing>
              <View style={styles.avatarCircle}>
                {driver?.avatarUri ? (
                  <Image source={{ uri: driver.avatarUri }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarLetter}>
                    {driver?.name?.[0]?.toUpperCase() || 'D'}
                  </Text>
                )}
                
                {/* Online/Offline status indicator */}
                <PulseOnlineBadge isOnline={isOnline} />

                {/* Verified Blue Badge overlay */}
                <View style={styles.verifiedBadgeContainer}>
                  <MaterialIcons name="verified" size={ms(18)} color="#3B82F6" />
                </View>
              </View>
            </RotatingAvatarRing>

            <View style={styles.profileTextWrap}>
              <Text style={styles.driverGreeting}>Hello Partner 👋</Text>
              <View style={styles.nameTagRow}>
                <NameLetterFade name={driver?.name || 'Delivery Boy'} />
              </View>
              <Text style={styles.driverRole}>{roleDisplay[driver?.role] || 'Delivery Executive'}</Text>
              <Text style={styles.driverPhone}>{displayPhone}</Text>
            </View>
          </Animated.View>

          {/* Extra Premium Glassmorphic details bar inside the header */}
          <Animated.View style={[styles.glassDetailsBar, { opacity: glassDetailsOpacity, transform: [{ translateY: glassDetailsTranslateY }] }]}>
            <View style={styles.glassDetailItem}>
              <Feather name="hash" size={11} color="rgba(255,255,255,0.7)" />
              <Text style={styles.glassDetailText}>{employeeId}</Text>
            </View>
            <View style={styles.glassDetailDivider} />
            <View style={styles.glassDetailItem}>
              <Feather name="clock" size={11} color="rgba(255,255,255,0.7)" />
              <Text style={styles.glassDetailText}>{shiftTiming}</Text>
            </View>
            <View style={styles.glassDetailDivider} />
            <View style={styles.glassDetailItem}>
              <Feather name="calendar" size={11} color="rgba(255,255,255,0.7)" />
              <Text style={styles.glassDetailText}>{joiningDate}</Text>
            </View>
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      {/* ── Lower Section Scroll Container (Premium White / Light Blue-Gray Sheet) ── */}
      <View style={styles.whiteSheet}>
        <Animated.ScrollView
          style={styles.scrollRoot}
          contentContainerStyle={[styles.scrollContent, { paddingTop: vs(280) }]}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#00B4D8"
              colors={['#00B4D8', '#E024E3', '#1D4ED8']}
              progressViewOffset={vs(280)}
            />
          }
        >
          {/* Custom refresh loading visual inside scroll */}
          {refreshing && (
            <View style={styles.customRefreshContainer}>
              <ActivityIndicator size="small" color="#00B4D8" />
              <Text style={styles.refreshText}>Syncing Logistics Server...</Text>
            </View>
          )}

          {/* Today's Summary Section */}
          <ShimmerWrapper loading={refreshing}>
            <AnimatedCard delay={100} style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>TODAY'S SUMMARY</Text>
              <View style={styles.statsGrid}>
                <StatCard
                  label="Total Orders"
                  targetValue={stats.total ?? 0}
                  iconName="package"
                  color="#166534"
                  isRefreshing={refreshing}
                />
                <StatCard
                  label="Delivered"
                  targetValue={stats.completed ?? 0}
                  iconName="check-circle"
                  color="#22C55E"
                  isRefreshing={refreshing}
                />
                <StatCard
                  label="Returned"
                  targetValue={stats.returned ?? 0}
                  iconName="corner-up-left"
                  color="#EF4444"
                  isRefreshing={refreshing}
                />
                <StatCard
                  label="Distance"
                  targetValue={`${stats.totalDistanceKm?.toFixed(1) || 0}km`}
                  iconName="map-pin"
                  color="#3B82F6"
                  isRefreshing={refreshing}
                />
              </View>
            </AnimatedCard>
          </ShimmerWrapper>

          {/* Performance Section */}
          <ShimmerWrapper loading={refreshing}>
            <AnimatedCard delay={200} style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>PERFORMANCE METRICS</Text>
              <View style={styles.performanceRow}>
                <View style={styles.performanceItem}>
                  <CircularProgress percentage={98} color="#22C55E" isRefreshing={refreshing} />
                  <Text style={styles.performanceLabel}>Completion Rate</Text>
                </View>
                <View style={styles.performanceDivider} />
                <View style={styles.performanceItem}>
                  <CircularProgress percentage={96} color="#3B82F6" isRefreshing={refreshing} />
                  <Text style={styles.performanceLabel}>On Time Rate</Text>
                </View>
                <View style={styles.performanceDivider} />
                <View style={styles.performanceItem}>
                  <View style={styles.ratingBox}>
                    <Text style={styles.ratingNumber}>{ratingVal}</Text>
                    <MaterialIcons name="star" size={16} color="#EAB308" />
                  </View>
                  <Text style={styles.performanceLabel}>Customer Rating</Text>
                </View>
              </View>
            </AnimatedCard>
          </ShimmerWrapper>

          {/* Sync Status Section */}
          <AnimatedCard delay={280} style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>LOGISTICS SYNC STATUS</Text>
            <View style={styles.syncCard}>
              <View style={styles.syncRow}>
                <View style={styles.syncMetaItem}>
                  <Animated.View style={[styles.syncIconBox, { transform: [{ translateY: cloudFloat }] }]}>
                    <Feather name="cloud" size={16} color="#166534" />
                  </Animated.View>
                  <View>
                    <Text style={styles.syncMetaTitle}>Cloud Sync</Text>
                    <Text style={styles.syncMetaSubtitle}>Backup secure</Text>
                  </View>
                </View>
                <View style={styles.syncMetaItem}>
                  <View style={styles.syncIconBox}>
                    <Feather name="refresh-cw" size={15} color="#3B82F6" />
                  </View>
                  <View>
                    <Text style={styles.syncMetaTitle}>Pending Upload</Text>
                    <Text style={[styles.syncMetaSubtitle, pendingCount > 0 && styles.warnText]}>
                      {pendingCount} records
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.innerDivider} />

              <View style={styles.syncRow}>
                <View style={styles.syncMetaItem}>
                  <View style={styles.syncIconBox}>
                    <Feather name="clock" size={16} color="#64748B" />
                  </View>
                  <View>
                    <Text style={styles.syncMetaTitle}>Last Sync</Text>
                    <Text style={styles.syncMetaSubtitle}>
                      {lastSyncAt ? timeAgo(lastSyncAt) : 'Not synced'}
                    </Text>
                  </View>
                </View>
                <View style={styles.syncMetaItem}>
                  <View style={styles.syncIconBox}>
                    <Feather name="wifi" size={16} color={isOnline ? '#22C55E' : '#EF4444'} />
                  </View>
                  <View>
                    <Text style={styles.syncMetaTitle}>Network Status</Text>
                    <View style={styles.statusBadgeRow}>
                      <View style={[styles.statusDot, { backgroundColor: isOnline ? '#22C55E' : '#EF4444' }]} />
                      <Text style={styles.syncMetaSubtitle}>{currentStatus}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </AnimatedCard>

          {/* Fraud & Security Protection Section */}
          <AnimatedCard delay={320} style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>FRAUD & SECURITY PROTECTION</Text>
            <View style={styles.syncCard}>
              <View style={styles.syncRow}>
                <View style={styles.syncMetaItem}>
                  <View style={[styles.syncIconBox, { backgroundColor: riskLevel === 'HIGH' ? '#FEF2F2' : '#ECFDF5' }]}>
                    <Feather name="shield" size={16} color={riskLevel === 'HIGH' ? '#EF4444' : '#10B981'} />
                  </View>
                  <View>
                    <Text style={styles.syncMetaTitle}>Risk Protection</Text>
                    <Text style={[styles.syncMetaSubtitle, { color: riskLevel === 'HIGH' ? '#EF4444' : '#10B981' }]}>
                      {riskLevel === 'HIGH' ? 'High Risk Alert' : 'Verified (Low Risk)'}
                    </Text>
                  </View>
                </View>
                <View style={styles.syncMetaItem}>
                  <View style={styles.syncIconBox}>
                    <Feather name="cpu" size={15} color="#00B4D8" />
                  </View>
                  <View>
                    <Text style={styles.syncMetaTitle}>Rate Limiting</Text>
                    <Text style={styles.syncMetaSubtitle}>Enforced & Active</Text>
                  </View>
                </View>
              </View>

              <View style={styles.innerDivider} />

              <View style={styles.syncRow}>
                <View style={styles.syncMetaItem}>
                  <View style={styles.syncIconBox}>
                    <Feather name="smartphone" size={16} color="#E024E3" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.syncMetaTitle}>Trusted Device</Text>
                    <Text style={styles.syncMetaSubtitle} numberOfLines={1}>
                      {deviceMeta?.modelName || 'Current Phone'}
                    </Text>
                  </View>
                </View>
                <View style={styles.syncMetaItem}>
                  <View style={styles.syncIconBox}>
                    <Feather name="map-pin" size={16} color="#1D4ED8" />
                  </View>
                  <View>
                    <Text style={styles.syncMetaTitle}>GPS Velocity Check</Text>
                    <Text style={styles.syncMetaSubtitle}>Spoof Guard On</Text>
                  </View>
                </View>
              </View>
            </View>
          </AnimatedCard>

          {/* Quick Actions Grid Section */}
          <AnimatedCard delay={360} style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>QUICK ACTIONS</Text>
            <View style={styles.actionsGrid}>
              <ActionCard
                label="Edit Profile"
                iconName="user"
                color="#166534"
                onPress={openEditSheet}
              />
              <ActionCard
                label="Documents"
                iconName="file-text"
                color="#3B82F6"
                onPress={() => Alert.alert('Documents', 'All identity and KYC documents are verified.')}
              />
              <ActionCard
                label="Vehicle Details"
                iconName="truck"
                color="#8B5CF6"
                onPress={() => Alert.alert('Vehicle Details', 'Registered Vehicle: Active status.')}
              />
              <ActionCard
                label="Support & Help"
                iconName="help-circle"
                color="#EC4899"
                onPress={() => Alert.alert('Support & Help', 'Direct logistics manager support channel loaded.')}
              />
              <ActionCard
                label="Delivery History"
                iconName="list"
                color="#F59E0B"
                onPress={() => Alert.alert('Delivery History', 'History records sync automatically in background.')}
              />
            </View>
          </AnimatedCard>

          {/* Achievements Section */}
          <AnimatedCard delay={420} style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>MY ACHIEVEMENTS</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.achievementsScroll}
            >
              {[
                { title: 'Top Performer', desc: 'Top 5% of region', emoji: '🥇', color: '#FFF8E1', textClr: '#F59E0B' },
                { title: '15 deliveries streak', desc: 'Done in a single shift', emoji: '🔥', color: '#FFEBEE', textClr: '#EF4444' },
                { title: '4.9 Rating Club', desc: 'Top positive feedback', emoji: '⭐', color: '#E3F2FD', textClr: '#3B82F6' },
                { title: 'Monthly Champ', desc: 'Awarded June 2026', emoji: '🏆', color: '#E8F5E9', textClr: '#10B981' },
              ].map((ach, idx) => (
                <View key={idx} style={[styles.achievementCard, { backgroundColor: ach.color }]}>
                  <Text style={styles.achievementEmoji}>{ach.emoji}</Text>
                  <Text style={[styles.achievementTitle, { color: ach.textClr }]}>{ach.title}</Text>
                  <Text style={styles.achievementDesc}>{ach.desc}</Text>
                </View>
              ))}
            </ScrollView>
          </AnimatedCard>

          {/* Bottom Actions Row */}
          <AnimatedCard delay={480} style={styles.bottomLinkSection}>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
              <Feather name="log-out" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.logoutText}>Logout Account</Text>
            </TouchableOpacity>

            <View style={styles.policyRow}>
              <Text style={styles.policyText}>Privacy Policy</Text>
              <Text style={styles.policyBullet}>•</Text>
              <Text style={styles.policyText}>Terms of Service</Text>
              <Text style={styles.policyBullet}>•</Text>
              <Text style={styles.policyText}>About</Text>
              <Text style={styles.policyBullet}>•</Text>
              <Text style={styles.policyText}>Support</Text>
            </View>

            <Text style={styles.versionText}>App Version 1.0.0 (Enterprise Gold)</Text>
          </AnimatedCard>
        </Animated.ScrollView>
      </View>

      {/* ── Success Animation Overlay (Checkmark + Confetti) ── */}
      <SuccessSyncOverlay visible={showSyncSuccess} />
      <SuccessSyncOverlay visible={showEditSuccess} title="Profile Updated" subtitle="Profile updated successfully" />

      {/* ── Edit Profile Slide Up Bottom Sheet (90% Height) ── */}
      {showEditSheet && (
        <Animated.View style={[styles.sheetBackdrop, { opacity: backdropOpacity }]}>
          <TouchableOpacity activeOpacity={1} onPress={closeEditSheet} style={{ flex: 1 }} />
          
          <Animated.View style={[styles.sheetContainer, { transform: [{ translateY: sheetTranslateY }] }]}>
            {/* Sheet Handle Bar */}
            <View style={styles.sheetHandleBar} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetHeaderTitle}>✏️ Edit Profile</Text>
              <TouchableOpacity onPress={closeEditSheet} style={styles.sheetCloseIconBtn}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
            >
              <ScrollView
                style={styles.sheetScroll}
                contentContainerStyle={styles.sheetScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Profile Photo Picker Layout */}
                <View style={styles.pickerAvatarSection}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setShowActionSheet(true)}
                    style={styles.pickerAvatarTouch}
                  >
                    <View style={styles.pickerAvatarCircle}>
                      {editAvatarUri ? (
                        <Image source={{ uri: editAvatarUri }} style={styles.pickerAvatarImg} />
                      ) : (
                        <Text style={styles.pickerAvatarLetter}>
                          {editName?.[0]?.toUpperCase() || 'D'}
                        </Text>
                      )}

                      {/* Photo Uploading Overlay */}
                      {uploadingPhoto && (
                        <View style={styles.uploadProgressOverlay}>
                          <ActivityIndicator size="small" color="#FFFFFF" />
                          <Text style={styles.uploadProgressText}>{uploadProgress}%</Text>
                        </View>
                      )}

                      {/* Edit Badge Trigger */}
                      <View style={styles.avatarEditBadge}>
                        <Feather name="camera" size={14} color="#FFFFFF" />
                      </View>
                    </View>
                  </TouchableOpacity>

                  <Text style={styles.pickerAvatarHelpText}>Tap image to update profile photo</Text>
                </View>

                {/* Section: Personal Information */}
                <Text style={styles.formSectionHeader}>👤 Personal Information</Text>
                
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Full Name</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Enter full name"
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Phone Number</Text>
                    <TextInput
                      style={styles.formInput}
                      value={editPhone}
                      onChangeText={setEditPhone}
                      keyboardType="phone-pad"
                      placeholder="Enter phone number"
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Employee ID (Read Only)</Text>
                    <TextInput
                      style={[styles.formInput, styles.formInputDisabled]}
                      value={employeeId}
                      editable={false}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Email Address</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editEmail}
                    onChangeText={setEditEmail}
                    keyboardType="email-address"
                    placeholder="Enter email address"
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Date of Birth</Text>
                    <TextInput
                      style={styles.formInput}
                      value={editDob}
                      onChangeText={setEditDob}
                      placeholder="YYYY-MM-DD"
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Blood Group</Text>
                    <TextInput
                      style={styles.formInput}
                      value={editBloodGroup}
                      onChangeText={setEditBloodGroup}
                      placeholder="e.g. O+"
                    />
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Language</Text>
                    <TextInput
                      style={styles.formInput}
                      value={editLanguage}
                      onChangeText={setEditLanguage}
                      placeholder="Preferred language"
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Emergency Contact</Text>
                    <TextInput
                      style={styles.formInput}
                      value={editEmergencyContact}
                      onChangeText={setEditEmergencyContact}
                      keyboardType="phone-pad"
                      placeholder="Emergency phone"
                    />
                  </View>
                </View>

                {/* Section: Address Details */}
                <Text style={[styles.formSectionHeader, { marginTop: vs(16) }]}>📍 Address Information</Text>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Current Address</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editAddress}
                    onChangeText={setEditAddress}
                    placeholder="Enter street address"
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1.2 }]}>
                    <Text style={styles.formLabel}>City</Text>
                    <TextInput
                      style={styles.formInput}
                      value={editCity}
                      onChangeText={setEditCity}
                      placeholder="City"
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>State</Text>
                    <TextInput
                      style={styles.formInput}
                      value={editState}
                      onChangeText={setEditState}
                      placeholder="State"
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Pincode</Text>
                    <TextInput
                      style={styles.formInput}
                      value={editPincode}
                      onChangeText={setEditPincode}
                      keyboardType="numeric"
                      placeholder="Pincode"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Current GPS Coordinates</Text>
                  <View style={styles.gpsRow}>
                    <TextInput
                      style={[styles.formInput, styles.formInputDisabled, { flex: 1, marginBottom: 0 }]}
                      value={editGpsLocation}
                      editable={false}
                    />
                    <TouchableOpacity
                      onPress={updateCurrentGPS}
                      disabled={locationLoading}
                      style={styles.gpsFetchBtn}
                    >
                      {locationLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.gpsFetchBtnText}>📍 Fetch GPS</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                  {showLocationSuccess && (
                    <Text style={styles.locationSuccessLabel}>✓ Coordinates updated successfully!</Text>
                  )}
                </View>

                {/* Section: Account settings */}
                <Text style={[styles.formSectionHeader, { marginTop: vs(16) }]}>⚙️ Account Settings</Text>

                <View style={styles.toggleRow}>
                  <View>
                    <Text style={styles.toggleRowTitle}>Dark Mode</Text>
                    <Text style={styles.toggleRowDesc}>Switch layout theme colors</Text>
                  </View>
                  <Switch
                    value={editDarkMode}
                    onValueChange={setEditDarkMode}
                    trackColor={{ true: '#22C55E' }}
                  />
                </View>

                <View style={styles.toggleRow}>
                  <View>
                    <Text style={styles.toggleRowTitle}>Push Notifications</Text>
                    <Text style={styles.toggleRowDesc}>Alerts on new order assignments</Text>
                  </View>
                  <Switch
                    value={editNotifEnabled}
                    onValueChange={setEditNotifEnabled}
                    trackColor={{ true: '#22C55E' }}
                  />
                </View>

                <View style={styles.toggleRow}>
                  <View>
                    <Text style={styles.toggleRowTitle}>Online Status</Text>
                    <Text style={styles.toggleRowDesc}>Broadcast status to control center</Text>
                  </View>
                  <Switch
                    value={editOnlineStatus}
                    onValueChange={setEditOnlineStatus}
                    trackColor={{ true: '#22C55E' }}
                  />
                </View>

                <View style={styles.toggleRow}>
                  <View>
                    <Text style={styles.toggleRowTitle}>Auto Accept Orders</Text>
                    <Text style={styles.toggleRowDesc}>Instantly accept new jobs</Text>
                  </View>
                  <Switch
                    value={editAutoAccept}
                    onValueChange={setEditAutoAccept}
                    trackColor={{ true: '#22C55E' }}
                  />
                </View>

                <View style={styles.toggleRow}>
                  <View>
                    <Text style={styles.toggleRowTitle}>Location Permission</Text>
                    <Text style={styles.toggleRowDesc}>Background location sync tracking</Text>
                  </View>
                  <Switch
                    value={editLocationPerm}
                    onValueChange={setEditLocationPerm}
                    trackColor={{ true: '#22C55E' }}
                  />
                </View>

                {/* Section: Password changes */}
                <Text style={[styles.formSectionHeader, { marginTop: vs(16) }]}>🔒 Change Password</Text>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Current Password</Text>
                  <View style={styles.passInputWrapper}>
                    <TextInput
                      style={[styles.formInput, { flex: 1, marginBottom: 0 }]}
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      secureTextEntry={!showCurrentPass}
                      placeholder="Enter current password"
                    />
                    <TouchableOpacity
                      onPress={() => setShowCurrentPass(!showCurrentPass)}
                      style={styles.eyeToggleBtn}
                    >
                      <Feather name={showCurrentPass ? "eye-off" : "eye"} size={16} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>New Password</Text>
                  <View style={styles.passInputWrapper}>
                    <TextInput
                      style={[styles.formInput, { flex: 1, marginBottom: 0 }]}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!showNewPass}
                      placeholder="Enter new password"
                    />
                    <TouchableOpacity
                      onPress={() => setShowNewPass(!showNewPass)}
                      style={styles.eyeToggleBtn}
                    >
                      <Feather name={showNewPass ? "eye-off" : "eye"} size={16} color="#64748B" />
                    </TouchableOpacity>
                  </View>

                  {/* Password Strength Meter */}
                  {newPassword.length > 0 && (
                    <View style={styles.strengthWrapper}>
                      <View style={styles.strengthBarBg}>
                        <View style={[styles.strengthBarFill, { backgroundColor: passStrength.color, width: passStrength.width }]} />
                      </View>
                      <Text style={[styles.strengthLabel, { color: passStrength.color }]}>
                        {passStrength.label} Strength
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Confirm Password</Text>
                  <View style={styles.passInputWrapper}>
                    <TextInput
                      style={[styles.formInput, { flex: 1, marginBottom: 0 }]}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPass}
                      placeholder="Confirm new password"
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPass(!showConfirmPass)}
                      style={styles.eyeToggleBtn}
                    >
                      <Feather name={showConfirmPass ? "eye-off" : "eye"} size={16} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Save Changes Button */}
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={saveProfileChanges}
                  disabled={savingProfile || uploadingPhoto}
                  style={[styles.saveBtnWrapper, (savingProfile || uploadingPhoto) && styles.saveBtnDisabled]}
                >
                  <LinearGradient
                    colors={['#22C55E', '#166534']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.saveBtnGradient}
                  >
                    {savingProfile ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.saveBtnText}>Save Changes</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </Animated.View>

          {/* Photo Action Sheet overlay */}
          <Modal
            visible={showActionSheet}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowActionSheet(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setShowActionSheet(false)}
              style={styles.actionSheetBackdrop}
            >
              <View style={styles.actionSheetContainer}>
                <Text style={styles.actionSheetTitle}>Update Profile Photo</Text>
                
                <TouchableOpacity onPress={pickFromCamera} style={styles.actionSheetBtn}>
                  <Feather name="camera" size={18} color="#1F2937" style={{ marginRight: 12 }} />
                  <Text style={styles.actionSheetBtnText}>Take Photo</Text>
                </TouchableOpacity>

                {editAvatarUri && (
                  <TouchableOpacity onPress={removePhoto} style={[styles.actionSheetBtn, styles.actionSheetBtnDestructive]}>
                    <Feather name="trash-2" size={18} color="#EF4444" style={{ marginRight: 12 }} />
                    <Text style={[styles.actionSheetBtnText, { color: '#EF4444' }]}>Remove Photo</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.actionSheetDivider} />

                <TouchableOpacity onPress={() => setShowActionSheet(false)} style={styles.actionSheetCancelBtn}>
                  <Text style={styles.actionSheetCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
        </Animated.View>
      )}
    </View>
  );
}

const getStyles = (themeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14532D',
  },

  // ── UPPER SECTION: GRADIENT HEADER ──
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    overflow: 'hidden',
  },
  headerContainer: {
    paddingHorizontal: s(20),
    paddingBottom: vs(16),
    height: '100%',
    justifyContent: 'space-between',
  },
  topNavbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  navbarBtn: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(19),
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navbarTitle: {
    fontSize: ms(18),
    color: themeColors.surface,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  profileMetaWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(16),
    marginTop: vs(8),
  },
  dashedRing: {
    borderWidth: 2.2,
    borderColor: '#22C55E',
    borderStyle: 'dashed',
  },
  avatarCircle: {
    width: ms(92),
    height: ms(92),
    borderRadius: ms(46),
    backgroundColor: themeColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarImage: {
    width: ms(92),
    height: ms(92),
    borderRadius: ms(46),
  },
  avatarLetter: {
    fontSize: ms(40),
    fontWeight: 'bold',
    color: '#166534',
  },
  onlineBadgeContainer: {
    position: 'absolute',
    bottom: -ms(2),
    left: -ms(2),
    width: ms(20),
    height: ms(20),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  pulseCircle: {
    position: 'absolute',
    width: ms(20),
    height: ms(20),
    borderRadius: ms(10),
    backgroundColor: '#22C55E',
  },
  solidBadge: {
    width: ms(12),
    height: ms(12),
    borderRadius: ms(6),
    borderWidth: 2,
    borderColor: themeColors.surface,
  },
  verifiedBadgeContainer: {
    position: 'absolute',
    bottom: -ms(2),
    right: -ms(2),
    backgroundColor: themeColors.surface,
    borderRadius: ms(10),
    padding: ms(1),
    zIndex: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  profileTextWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  driverGreeting: {
    fontSize: ms(12),
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginBottom: vs(1),
  },
  nameTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(3),
  },
  driverName: {
    fontSize: ms(22),
    fontWeight: 'bold',
    color: themeColors.surface,
  },
  driverRole: {
    fontSize: ms(14),
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
    marginBottom: vs(2),
  },
  driverPhone: {
    fontSize: ms(13),
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  glassDetailsBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: ms(12),
    paddingVertical: vs(8),
    paddingHorizontal: s(12),
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  glassDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
  },
  glassDetailText: {
    fontSize: ms(11),
    color: themeColors.surface,
    fontWeight: '600',
  },
  glassDetailDivider: {
    width: 1,
    height: vs(12),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  // ── LOWER SECTION: WHITE SHEET ──
  whiteSheet: {
    flex: 1,
    backgroundColor: '#F0F7FF',
    borderTopLeftRadius: ms(32),
    borderTopRightRadius: ms(32),
    overflow: 'hidden',
  },
  scrollRoot: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: s(20),
    paddingBottom: vs(32),
  },
  customRefreshContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: s(8),
    paddingVertical: vs(14),
    backgroundColor: '#F0F9FF',
    borderRadius: ms(16),
    marginBottom: vs(16),
    borderWidth: 1.5,
    borderColor: '#00B4D8',
  },
  refreshText: {
    fontSize: ms(13),
    color: '#00B4D8',
    fontWeight: 'bold',
  },
  sectionCard: {
    marginBottom: vs(20),
  },
  sectionHeader: {
    fontSize: ms(12),
    fontWeight: '800',
    color: '#1D4ED8',
    letterSpacing: 1.2,
    marginBottom: vs(10),
    paddingLeft: s(2),
  },

  // Stats Grid Section
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: vs(12),
  },
  statCardWrapper: {
    width: '48.5%',
  },
  statCard: {
    backgroundColor: 'rgba(240, 247, 255, 0.96)',
    borderRadius: ms(20),
    padding: ms(16),
    alignItems: 'center',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: '#00B4D8',
  },
  statIconContainer: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(8),
  },
  statCardValue: {
    fontSize: ms(22),
    fontWeight: 'bold',
    color: '#1D4ED8',
    marginBottom: vs(2),
  },
  statCardLabel: {
    fontSize: ms(11),
    color: '#64748B',
    fontWeight: '600',
  },

  // Performance Section
  performanceRow: {
    backgroundColor: 'rgba(240, 247, 255, 0.96)',
    borderRadius: ms(20),
    paddingVertical: vs(16),
    paddingHorizontal: s(12),
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: '#00B4D8',
  },
  performanceItem: {
    alignItems: 'center',
    flex: 1,
  },
  performanceDivider: {
    width: 1,
    height: vs(36),
    backgroundColor: '#00B4D8',
  },
  performanceLabel: {
    fontSize: ms(11),
    color: '#64748B',
    fontWeight: '600',
    marginTop: vs(8),
    textAlign: 'center',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(4),
    height: ms(56),
  },
  ratingNumber: {
    fontSize: ms(26),
    fontWeight: 'bold',
    color: '#1D4ED8',
  },

  // Sync Status Card
  syncCard: {
    backgroundColor: 'rgba(240, 247, 255, 0.96)',
    borderRadius: ms(20),
    padding: ms(16),
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: '#00B4D8',
  },
  syncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  syncMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    width: '48%',
  },
  syncIconBox: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(10),
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncMetaTitle: {
    fontSize: ms(11),
    color: '#64748B',
    fontWeight: '600',
  },
  syncMetaSubtitle: {
    fontSize: ms(13),
    color: '#0F172A',
    fontWeight: 'bold',
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
  },
  statusDot: {
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
  },
  warnText: {
    color: '#DC2626',
  },
  innerDivider: {
    height: 1,
    backgroundColor: '#00B4D8',
    marginVertical: vs(12),
  },

  // Actions Grid
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: vs(12),
  },
  actionCardWrapper: {
    width: '31%',
  },
  actionCard: {
    backgroundColor: 'rgba(240, 247, 255, 0.96)',
    borderRadius: ms(16),
    paddingVertical: vs(16),
    paddingHorizontal: s(8),
    alignItems: 'center',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: '#00B4D8',
    minHeight: vs(90),
    justifyContent: 'center',
  },
  actionIconContainer: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(8),
  },
  actionCardLabel: {
    fontSize: ms(11),
    fontWeight: '700',
    color: themeColors.text,
    textAlign: 'center',
  },

  // Achievements
  achievementsScroll: {
    paddingLeft: s(2),
    gap: s(12),
    paddingBottom: vs(4),
  },
  achievementCard: {
    width: s(140),
    borderRadius: ms(16),
    padding: ms(12),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  achievementEmoji: {
    fontSize: ms(24),
    marginBottom: vs(4),
  },
  achievementTitle: {
    fontSize: ms(12),
    fontWeight: 'bold',
    marginBottom: vs(2),
  },
  achievementDesc: {
    fontSize: ms(10),
    color: themeColors.subtext,
    fontWeight: '500',
  },

  // Bottom Links & Buttons
  bottomLinkSection: {
    alignItems: 'center',
    marginTop: vs(8),
  },
  logoutBtn: {
    backgroundColor: '#DC2626',
    borderRadius: ms(16),
    paddingVertical: vs(14),
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: vs(24),
  },
  logoutText: {
    color: themeColors.surface,
    fontSize: ms(15),
    fontWeight: 'bold',
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    columnGap: s(8),
    rowGap: vs(4),
    marginBottom: vs(12),
  },
  policyText: {
    fontSize: ms(12),
    color: themeColors.subtext,
    fontWeight: '600',
  },
  policyBullet: {
    fontSize: ms(10),
    color: '#94A3B8',
  },
  versionText: {
    fontSize: ms(11),
    color: '#94A3B8',
    fontWeight: '500',
  },

  // Shimmer skeleton placeholder
  shimmerCard: {
    backgroundColor: themeColors.surface,
    borderRadius: ms(20),
    padding: ms(20),
    borderWidth: 1,
    borderColor: themeColors.border,
    marginBottom: vs(20),
  },
  shimmerLinesWrap: {
    gap: vs(8),
  },
  shimmerLineCircle: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    backgroundColor: themeColors.border,
    marginBottom: vs(4),
  },
  shimmerLineLong: {
    width: '80%',
    height: vs(16),
    borderRadius: ms(4),
    backgroundColor: themeColors.border,
  },
  shimmerLineShort: {
    width: '45%',
    height: vs(12),
    borderRadius: ms(4),
    backgroundColor: themeColors.border,
  },

  // Success Sync Overlay styles
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  successBox: {
    backgroundColor: themeColors.surface,
    borderRadius: ms(24),
    padding: ms(24),
    width: SCREEN_WIDTH * 0.82,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  successGlow: {
    position: 'absolute',
    width: ms(100),
    height: ms(100),
    borderRadius: ms(50),
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    top: vs(-20),
    zIndex: -1,
  },
  successCheckWrap: {
    marginBottom: vs(16),
  },
  successTitle: {
    fontSize: ms(18),
    fontWeight: 'bold',
    color: themeColors.text,
    marginBottom: vs(4),
  },
  successSubtitle: {
    fontSize: ms(13),
    color: themeColors.subtext,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: vs(8),
  },

  // ── EDIT PROFILE SHEET STYLES ──
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 1000,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.9,
    backgroundColor: themeColors.background,
    borderTopLeftRadius: ms(28),
    borderTopRightRadius: ms(28),
    paddingTop: vs(8),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  sheetHandleBar: {
    width: s(36),
    height: vs(5),
    backgroundColor: themeColors.border,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: vs(12),
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: s(20),
    paddingBottom: vs(12),
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  sheetHeaderTitle: {
    fontSize: ms(18),
    fontWeight: 'bold',
    color: themeColors.text,
  },
  sheetCloseIconBtn: {
    padding: s(4),
  },
  sheetScroll: {
    flex: 1,
  },
  sheetScrollContent: {
    paddingHorizontal: s(20),
    paddingTop: vs(16),
    paddingBottom: vs(50),
  },

  // Avatar Picker styles
  pickerAvatarSection: {
    alignItems: 'center',
    marginBottom: vs(24),
  },
  pickerAvatarTouch: {
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  pickerAvatarCircle: {
    width: ms(100),
    height: ms(100),
    borderRadius: ms(50),
    backgroundColor: themeColors.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 3,
    borderColor: themeColors.surface,
  },
  pickerAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: ms(50),
  },
  pickerAvatarLetter: {
    fontSize: ms(44),
    fontWeight: 'bold',
    color: themeColors.subtext,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: ms(28),
    height: ms(28),
    borderRadius: ms(14),
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.2,
    borderColor: themeColors.surface,
  },
  pickerAvatarHelpText: {
    fontSize: ms(11),
    color: themeColors.subtext,
    fontWeight: '600',
    marginTop: vs(8),
  },
  uploadProgressOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: ms(50),
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadProgressText: {
    color: themeColors.surface,
    fontSize: ms(12),
    fontWeight: 'bold',
    marginTop: vs(4),
  },

  // Forms
  formSectionHeader: {
    fontSize: ms(13),
    fontWeight: '800',
    color: themeColors.subtext,
    letterSpacing: 1.0,
    marginBottom: vs(12),
    textTransform: 'uppercase',
  },
  formGroup: {
    marginBottom: vs(14),
  },
  formRow: {
    flexDirection: 'row',
    gap: s(12),
  },
  formLabel: {
    fontSize: ms(12),
    fontWeight: '700',
    color: '#475569',
    marginBottom: vs(6),
  },
  formInput: {
    height: vs(50),
    backgroundColor: themeColors.surface,
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: ms(12),
    paddingHorizontal: s(14),
    fontSize: ms(14),
    color: themeColors.text,
    fontWeight: '600',
  },
  formInputDisabled: {
    backgroundColor: themeColors.isDark ? '#334155' : '#F1F5F9',
    color: themeColors.subtext,
  },

  // GPS styles
  gpsRow: {
    flexDirection: 'row',
    gap: s(10),
    alignItems: 'center',
  },
  gpsFetchBtn: {
    height: vs(50),
    backgroundColor: '#166534',
    borderRadius: ms(12),
    paddingHorizontal: s(16),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#166534',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  gpsFetchBtnText: {
    color: themeColors.surface,
    fontWeight: 'bold',
    fontSize: ms(12),
  },
  locationSuccessLabel: {
    fontSize: ms(11),
    color: '#22C55E',
    fontWeight: 'bold',
    marginTop: vs(4),
  },

  // Settings Toggles
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: themeColors.surface,
    borderRadius: ms(16),
    padding: ms(14),
    marginBottom: vs(12),
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  toggleRowTitle: {
    fontSize: ms(14),
    fontWeight: 'bold',
    color: themeColors.text,
  },
  toggleRowDesc: {
    fontSize: ms(11),
    color: themeColors.subtext,
    fontWeight: '500',
    marginTop: vs(2),
  },

  // Password wrapper
  passInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  eyeToggleBtn: {
    position: 'absolute',
    right: s(14),
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  strengthWrapper: {
    marginTop: vs(6),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  strengthBarBg: {
    height: vs(5),
    backgroundColor: themeColors.border,
    borderRadius: 2,
    flex: 1,
    marginRight: s(10),
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
  },
  strengthLabel: {
    fontSize: ms(11),
    fontWeight: 'bold',
  },

  // Save changes button wrapper
  saveBtnWrapper: {
    marginTop: vs(24),
    height: vs(58),
    borderRadius: ms(18),
    overflow: 'hidden',
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: {
    opacity: 0.65,
  },
  saveBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: themeColors.surface,
    fontSize: ms(16),
    fontWeight: 'bold',
  },

  // Action sheet photo menu styles
  actionSheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  actionSheetContainer: {
    backgroundColor: themeColors.surface,
    borderTopLeftRadius: ms(24),
    borderTopRightRadius: ms(24),
    paddingBottom: vs(32),
    paddingHorizontal: s(24),
    paddingTop: vs(20),
  },
  actionSheetTitle: {
    fontSize: ms(16),
    fontWeight: 'bold',
    color: themeColors.subtext,
    marginBottom: vs(16),
    textAlign: 'center',
  },
  actionSheetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(14),
    borderBottomWidth: 1,
    borderBottomColor: themeColors.isDark ? '#334155' : '#F1F5F9',
  },
  actionSheetBtnDestructive: {
    borderBottomWidth: 0,
  },
  actionSheetBtnText: {
    fontSize: ms(15),
    fontWeight: '600',
    color: themeColors.text,
  },
  actionSheetDivider: {
    height: 1,
    backgroundColor: themeColors.border,
    marginVertical: vs(12),
  },
  actionSheetCancelBtn: {
    alignItems: 'center',
    paddingVertical: vs(8),
  },
  actionSheetCancelText: {
    fontSize: ms(15),
    fontWeight: 'bold',
    color: '#166534',
  },
});
