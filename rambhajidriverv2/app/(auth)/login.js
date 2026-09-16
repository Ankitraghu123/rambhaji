// app/(auth)/login.js
// SCR-02: Redesigned Premium Login Screen — Rambhaji Delivery Partner App
// World-class design, Reanimated v3 parallax, breathing logo, morphing success button, and custom truck loaders.

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useRootNavigationState, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useForm, Controller } from 'react-hook-form';
import { useSelector, useDispatch } from 'react-redux';
import {
  Ionicons,
  Feather,
  MaterialCommunityIcons,
  MaterialIcons
} from '@expo/vector-icons';
import Svg from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  Easing,
  runOnJS,
  FadeIn,
  FadeInUp,
  ZoomIn
} from 'react-native-reanimated';

import { s, vs, ms } from '../../src/core/utils/responsive';
import { validatePhone } from '../../src/core/validators/phoneValidator';
import AuthService from '../../src/features/auth/services/AuthService';
import { selectAuthLoading, selectAuthError } from '../../src/features/auth/state/authSlice';
import { triggerHaptic } from '../../src/components/common/Motion';
import SecurityService from '../../src/core/security/SecurityService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Floating Background Particles ───────────────────────────────────────────
function FloatingParticle({ emoji, startX, duration, delay, size = 18 }) {
  const translateY = useSharedValue(SCREEN_HEIGHT + 50);
  const translateX = useSharedValue(startX);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    let active = true;
    const animate = () => {
      if (!active) return;
      translateY.value = SCREEN_HEIGHT + 50;
      opacity.value = 0;
      rotation.value = 0;
      
      opacity.value = withDelay(delay, withTiming(0.6, { duration: 1000 }));
      
      translateY.value = withDelay(
        delay,
        withTiming(-100, { duration, easing: Easing.linear }, (finished) => {
          if (finished && active) {
            runOnJS(animate)();
          }
        })
      );

      translateX.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(startX + 18, { duration: duration / 4, easing: Easing.inOut(Easing.ease) }),
            withTiming(startX - 18, { duration: duration / 4, easing: Easing.inOut(Easing.ease) })
          ),
          4,
          true
        )
      );

      rotation.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(35, { duration: duration / 5 }),
            withTiming(-35, { duration: duration / 5 })
          ),
          5,
          true
        )
      );
    };

    animate();
    return () => {
      active = false;
    };
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotation.value}deg` }
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[styles.floatingPart, animStyle, { fontSize: size }]}>
      {emoji}
    </Animated.Text>
  );
}

// ─── Floating Feature Icon Badge ─────────────────────────────────────────────
function FloatingFeatureBadge({ iconName, label, delay = 0 }) {
  const floatY = useSharedValue(0);

  useEffect(() => {
    floatY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-4, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  return (
    <Animated.View style={[styles.featureCard, floatStyle]}>
      <View style={styles.featureIconWrap}>
        <Feather name={iconName} size={16} color="#166534" />
      </View>
      <Text style={styles.featureCardText}>{label}</Text>
    </Animated.View>
  );
}

// ─── Confetti Burst Particle ──────────────────────────────────────────────────
function Confetti({ index }) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const angle = (index * 2 * Math.PI) / 16 + (Math.random() - 0.5) * 0.25;
    const speed = 45 + Math.random() * 55;
    const targetX = Math.cos(angle) * speed;
    const targetY = Math.sin(angle) * speed - 15;

    x.value = withTiming(targetX, { duration: 1000, easing: Easing.out(Easing.quad) });
    y.value = withSequence(
      withTiming(targetY, { duration: 350, easing: Easing.out(Easing.quad) }),
      withTiming(targetY + 110, { duration: 750, easing: Easing.in(Easing.quad) })
    );
    scale.value = withSequence(
      withTiming(ms(8 + Math.random() * 5), { duration: 180 }),
      withDelay(550, withTiming(0, { duration: 350 }))
    );
    opacity.value = withDelay(600, withTiming(0, { duration: 400 }));
  }, []);

  const colors = ['#22C55E', '#3B82F6', '#EAB308', '#EC4899', '#8B5CF6', '#F59E0B'];
  const confettiColor = colors[index % colors.length];

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.confettiPiece, style, { backgroundColor: confettiColor }]} />;
}

// ─── Checkbox Remember Me ────────────────────────────────────────────────────
function RememberMeCheckbox({ checked, onChange }) {
  const scale = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(checked ? 1 : 0, { damping: 9, stiffness: 100 });
  }, [checked]);

  const tickStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onChange}
      style={styles.checkboxRow}
    >
      <View style={[styles.checkboxBox, checked && styles.checkboxBoxChecked]}>
        <Animated.View style={[styles.checkboxTick, tickStyle]}>
          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
        </Animated.View>
      </View>
      <Text style={styles.checkboxText}>Remember Me</Text>
    </TouchableOpacity>
  );
}

// ─── Custom Delivery Truck Loader ────────────────────────────────────────────
function DeliveryWorkspaceLoader() {
  const truckX = useSharedValue(-s(60));

  useEffect(() => {
    let active = true;
    const runAnimation = () => {
      if (!active) return;
      truckX.value = -s(60);
      truckX.value = withTiming(SCREEN_WIDTH + s(60), { duration: 3200, easing: Easing.linear }, (finished) => {
        if (finished && active) {
          runOnJS(runAnimation)();
        }
      });
    };
    runAnimation();
    return () => {
      active = false;
    };
  }, []);

  const truckStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: truckX.value }],
  }));

  return (
    <View style={styles.loaderContainer}>
      <View style={styles.loaderCenterBox}>
        {/* Breathing Logo */}
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.loaderLogo}
          resizeMode="contain"
        />

        {/* Moving Delivery Truck Track */}
        <View style={styles.loaderTrack}>
          <View style={styles.loaderTrackDashed} />
          <Animated.View style={[styles.loaderTruckWrap, truckStyle]}>
            <MaterialCommunityIcons name="truck-delivery" size={42} color="#166534" />
          </Animated.View>
        </View>

        {/* Shimmer loading bar */}
        <View style={styles.loaderProgressBg}>
          <LinearGradient
            colors={['#22C55E', '#166534']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.loaderProgressFill}
          />
        </View>

        <Text style={styles.loaderMsg}>Preparing your delivery workspace...</Text>
      </View>
    </View>
  );
}

// ─── Password Strength Evaluator ─────────────────────────────────────────────
const getPasswordStrength = (pass) => {
  if (!pass) return { label: '', color: '#E2E8F0', width: '0%' };
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

// ─── Main Login Screen ───────────────────────────────────────────────────────
export default function LoginScreen() {
  const isLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { phone: '', password: '' }
  });

  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [localServerError, setLocalServerError] = useState(null);

  // Focus triggers
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  // Reanimated values for card, logo, waves, button
  const cardTranslateY = useSharedValue(SCREEN_HEIGHT * 0.4);
  const cardOpacity = useSharedValue(0);
  const shakeX = useSharedValue(0);

  const logoScale = useSharedValue(1);
  const waveRotation = useSharedValue(0);

  // Morphing button animations
  const btnWidthShared = useSharedValue(SCREEN_WIDTH - s(48));
  const btnRadiusShared = useSharedValue(ms(20));
  const successCheckOpacity = useSharedValue(0);

  const rootNavigationState = useRootNavigationState();
  const params = useLocalSearchParams();

  const activeServerError = localServerError || authError;

  // Check for Session Expiry params or Auth Error
  useEffect(() => {
    if (params?.sessionExpired === 'true' || params?.reason || authError) {
      const msg = params?.reason || authError || 'Session expired, please login again.';
      setLocalServerError(msg);
      triggerHaptic('warning');
    }
  }, [params?.sessionExpired, params?.reason, authError]);

  // Instant Session Hydration Check
  useEffect(() => {
    if (!rootNavigationState?.key) return;

    // Do not auto-redirect if session expired query param is set
    if (params?.sessionExpired === 'true') {
      setIsCheckingSession(false);
      return;
    }

    const hasSession = AuthService.hydrateSession();
    if (hasSession) {
      router.replace('/(tabs)/');
    } else {
      setIsCheckingSession(false);
    }
  }, [rootNavigationState?.key, params?.sessionExpired]);

  // Breathing logo loop
  useEffect(() => {
    logoScale.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  // Waving hand loop
  useEffect(() => {
    waveRotation.value = withRepeat(
      withSequence(
        withTiming(16, { duration: 350 }),
        withTiming(-10, { duration: 350 }),
        withTiming(16, { duration: 350 }),
        withTiming(0, { duration: 350 }),
        withDelay(1800, withTiming(0, { duration: 100 }))
      ),
      -1,
      false
    );
  }, []);

  // Slide up card on sheet loaded
  useEffect(() => {
    if (!isCheckingSession) {
      cardTranslateY.value = withSpring(0, { damping: 14, stiffness: 85 });
      cardOpacity.value = withTiming(1, { duration: 550 });
    }
  }, [isCheckingSession]);

  const onSubmit = async ({ phone, password }) => {
    triggerHaptic('light');

    // 🛡️ Security Check: Lockout status
    const lockout = SecurityService.checkLoginLockout();
    if (lockout.isLocked) {
      triggerHaptic('error');
      Alert.alert('🛡️ Security Lockout Active', lockout.message);
      return;
    }

    // 🛡️ Security Check: Rate limiting
    const rateCheck = SecurityService.checkRateLimit('login_attempt', 5, 10 * 60 * 1000);
    if (!rateCheck.allowed) {
      triggerHaptic('error');
      Alert.alert('🛡️ Rate Limit Triggered', rateCheck.message);
      return;
    }

    const cleanedPhone = phone.replace(/\D/g, '').slice(-10);
    const result = await AuthService.loginWithPassword(cleanedPhone, password);
    
    if (result.success) {
      SecurityService.recordSuccessfulLogin();
      // Morph button and redirect
      setLoginSuccess(true);
      triggerHaptic('success');
      btnWidthShared.value = withTiming(ms(60), { duration: 350 });
      btnRadiusShared.value = withTiming(ms(30), { duration: 350 });
      successCheckOpacity.value = withDelay(350, withTiming(1, { duration: 250 }));
      
      setTimeout(() => {
        router.replace('/(tabs)/');
      }, 2000);
    } else {
      SecurityService.recordFailedLogin();
      // Shake card, trigger error haptic
      triggerHaptic('error');
      shakeX.value = withSequence(
        withTiming(-10, { duration: 60 }),
        withTiming(10, { duration: 60 }),
        withTiming(-10, { duration: 60 }),
        withTiming(10, { duration: 60 }),
        withTiming(-5, { duration: 60 }),
        withTiming(5, { duration: 60 }),
        withTiming(0, { duration: 60 })
      );
      Alert.alert('Authentication Failed', result.error || 'Invalid phone number or password.');
    }
  };

  // Animated styles
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardTranslateY.value }, { translateX: shakeX.value }],
    opacity: cardOpacity.value,
  }));

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const waveAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${waveRotation.value}deg` }],
  }));

  const morphBtnStyle = useAnimatedStyle(() => ({
    width: btnWidthShared.value,
    borderRadius: btnRadiusShared.value,
  }));

  const checkMarkStyle = useAnimatedStyle(() => ({
    opacity: successCheckOpacity.value,
  }));

  if (isCheckingSession) {
    return <DeliveryWorkspaceLoader />;
  }

  const passStrength = getPasswordStrength(passwordInput);

  return (
    <LinearGradient
      colors={['#F0F9FF', '#FDF4FF', '#EFF6FF']}
      style={styles.root}
    >
      {/* ── Parallax Floating Particles ── */}
      <FloatingParticle emoji="🍃" startX={SCREEN_WIDTH * 0.08} duration={12000} delay={0} size={ms(20)} />
      <FloatingParticle emoji="🍎" startX={SCREEN_WIDTH * 0.22} duration={16000} delay={1800} size={ms(16)} />
      <FloatingParticle emoji="💧" startX={SCREEN_WIDTH * 0.76} duration={14000} delay={700} size={ms(18)} />
      <FloatingParticle emoji="🥬" startX={SCREEN_WIDTH * 0.88} duration={11000} delay={2800} size={ms(22)} />
      <FloatingParticle emoji="✨" startX={SCREEN_WIDTH * 0.50} duration={10000} delay={1200} size={ms(14)} />
      <FloatingParticle emoji="🥕" startX={SCREEN_WIDTH * 0.36} duration={18000} delay={3800} size={ms(16)} />
      <FloatingParticle emoji="🍋" startX={SCREEN_WIDTH * 0.64} duration={13000} delay={5200} size={ms(15)} />

      {/* ── Soft Landscape farming silhouette in background ── */}
      <View style={styles.silhouetteContainer} pointerEvents="none">
        <Svg width="100%" height={vs(80)} style={{ opacity: 0.07 }}>
          {/* Hills */}
          <Animated.View style={styles.hillShadow} />
        </Svg>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Header ── */}
            <View style={styles.header}>
              <Animated.View style={[styles.logoWrap, logoAnimatedStyle]}>
                <Image
                  source={require('../../assets/images/logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </Animated.View>
              
              <Text style={styles.tagline}>
                Fresh Fruits, Vegetables & Alkaline Water
              </Text>

              <View style={styles.glassPill}>
                <Text style={styles.glassPillText}>DELIVERY PARTNER PORTAL</Text>
              </View>
            </View>

            {/* ── Welcome Glassmorphism Card ── */}
            <Animated.View style={[styles.card, cardAnimatedStyle]}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>Welcome Back</Text>
                <Animated.View style={waveAnimatedStyle}>
                  <Text style={styles.waveEmoji}>👋</Text>
                </Animated.View>
              </View>
              <Text style={styles.subtitle}>Continue using your registered delivery account.</Text>

              {/* Server Error Alert Banner */}
              {activeServerError && (
                <View style={styles.serverErrorBox}>
                  <Feather name="alert-circle" size={16} color="#DC2626" />
                  <Text style={styles.serverErrorText}>{activeServerError}</Text>
                </View>
              )}

              {/* Phone Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.floatingLabel}>Phone Number</Text>
                <View style={[
                  styles.inputField,
                  phoneFocused && styles.inputFieldFocused,
                  errors.phone && styles.inputFieldError
                ]}>
                  <Feather name="smartphone" size={16} color="#64748B" style={{ marginRight: 8 }} />
                  <View style={styles.countryCode}>
                    <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                  </View>
                  <Controller
                    control={control}
                    name="phone"
                    rules={{ validate: validatePhone }}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        value={value}
                        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, 10))}
                        keyboardType="phone-pad"
                        maxLength={10}
                        placeholder="10-digit mobile"
                        placeholderTextColor="#94A3B8"
                        style={styles.textInput}
                        onFocus={() => setPhoneFocused(true)}
                        onBlur={() => setPhoneFocused(false)}
                      />
                    )}
                  />
                </View>
                {errors.phone && <Text style={styles.errorText}>{errors.phone.message}</Text>}
              </View>

              {/* Password Field */}
              <View style={[styles.inputGroup, { marginTop: vs(14) }]}>
                <Text style={styles.floatingLabel}>Password</Text>
                <View style={[
                  styles.inputField,
                  passwordFocused && styles.inputFieldFocused,
                  errors.password && styles.inputFieldError
                ]}>
                  <Feather name="lock" size={16} color="#64748B" style={{ marginRight: 8 }} />
                  <Controller
                    control={control}
                    name="password"
                    rules={{ required: 'Password is required' }}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        value={value}
                        onChangeText={(t) => {
                          onChange(t);
                          setPasswordInput(t);
                        }}
                        secureTextEntry={!showPassword}
                        placeholder="Password"
                        placeholderTextColor="#94A3B8"
                        style={styles.textInput}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                      />
                    )}
                  />
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                  >
                    <Feather name={showPassword ? "eye-off" : "eye"} size={16} color="#64748B" />
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

                {/* Password Strength Meter */}
                {passwordInput.length > 0 && (
                  <View style={styles.strengthWrapper}>
                    <View style={styles.strengthBarBg}>
                      <View style={[styles.strengthBarFill, { backgroundColor: passStrength.color, width: passStrength.width }]} />
                    </View>
                    <Text style={[styles.strengthText, { color: passStrength.color }]}>
                      {passStrength.label} Password
                    </Text>
                  </View>
                )}
              </View>

              {/* Remember Me & Forgot Password Row */}
              <View style={styles.rememberRow}>
                <RememberMeCheckbox
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                />
                <TouchableOpacity onPress={() => Alert.alert('Forgot Password', 'Please contact support@rambhaji.com to reset your credential.')}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>



              {/* Gradient Submit Button */}
              <Animated.View style={[styles.submitBtnWrapper, morphBtnStyle]}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={handleSubmit(onSubmit)}
                  disabled={isLoading || loginSuccess}
                  style={styles.submitBtn}
                >
                  <LinearGradient
                    colors={['#1D4ED8', '#00B4D8', '#E024E3']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitBtnGradient}
                  >
                    {loginSuccess ? (
                      <Animated.View style={checkMarkStyle}>
                        <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                      </Animated.View>
                    ) : isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitBtnText}>Login Portal</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* Confetti Rain Overlay on Success */}
              {loginSuccess && (
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <Confetti key={i} index={i} />
                  ))}
                </View>
              )}
            </Animated.View>

            {/* ── Three Floating Premium Info Badges (Hidden) ── */}
            {/*
            <View style={styles.featuresRow}>
              <FloatingFeatureBadge iconName="shield" label="Secure Login" delay={0} />
              <FloatingFeatureBadge iconName="zap" label="Fast Delivery" delay={400} />
              <FloatingFeatureBadge iconName="map-pin" label="Live Tracking" delay={800} />
            </View>
            */}

            {/* ── Support Mail ── */}
            <View style={styles.supportContainer}>
              <Text style={styles.supportText}>Having trouble? Contact </Text>
              <TouchableOpacity
                onPress={() => Alert.alert('Support Support', 'Opening mail app to contact support@rambhaji.com...')}
                style={styles.supportLinkRow}
              >
                <Feather name="mail" size={12} color="#166534" style={{ marginRight: 4 }} />
                <Text style={styles.supportLink}>support@rambhaji.com</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: s(20),
    paddingBottom: vs(16),
    paddingTop: vs(12),
    minHeight: SCREEN_HEIGHT - vs(20),
    justifyContent: 'center',
  },
  floatingPart: {
    position: 'absolute',
    zIndex: 0,
  },
  silhouetteContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: vs(120),
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 0,
  },
  hillShadow: {
    width: '120%',
    height: vs(90),
    backgroundColor: '#E2F0E7',
    borderRadius: SCREEN_WIDTH * 0.6,
    transform: [{ translateY: vs(40) }],
  },

  // Header styles
  header: {
    alignItems: 'center',
    marginBottom: vs(10),
  },
  logoWrap: {
    width: s(160),
    height: vs(76),
    marginBottom: vs(6),
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  tagline: {
    fontSize: ms(11),
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: vs(6),
    lineHeight: vs(16),
  },
  glassPill: {
    backgroundColor: 'rgba(0, 180, 216, 0.08)',
    borderWidth: 1.2,
    borderColor: '#BAE6FD',
    borderRadius: s(20),
    paddingHorizontal: s(12),
    paddingVertical: vs(4),
  },
  glassPillText: {
    fontSize: ms(9.5),
    fontWeight: 'bold',
    color: '#0284C7',
    letterSpacing: 1.2,
  },

  // Card styles
  card: {
    backgroundColor: 'rgba(240, 247, 255, 0.94)',
    borderRadius: ms(22),
    padding: ms(18),
    borderWidth: 1.8,
    borderColor: '#00B4D8',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 8,
    zIndex: 2,
    marginBottom: vs(14),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    marginBottom: vs(2),
  },
  title: {
    fontSize: ms(20),
    fontWeight: 'bold',
    color: '#1D4ED8',
  },
  waveEmoji: {
    fontSize: ms(20),
  },
  subtitle: {
    fontSize: ms(12),
    color: '#1E293B',
    lineHeight: vs(16),
    marginBottom: vs(12),
    fontWeight: '600',
  },
  serverErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: s(12),
    paddingHorizontal: s(12),
    paddingVertical: vs(7),
    marginBottom: vs(12),
  },
  serverErrorText: {
    fontSize: ms(11),
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
  },

  // Input styles
  inputGroup: {
    width: '100%',
  },
  floatingLabel: {
    fontSize: ms(10.5),
    fontWeight: 'bold',
    color: '#1D4ED8',
    marginBottom: vs(4),
    paddingLeft: s(2),
  },
  inputField: {
    height: vs(46),
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#00B4D8',
    borderRadius: ms(14),
    paddingHorizontal: s(14),
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  inputFieldFocused: {
    borderColor: '#E024E3',
    shadowColor: '#E024E3',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  inputFieldError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  countryCode: {
    borderRightWidth: 1.2,
    borderRightColor: '#E2E8F0',
    paddingRight: s(10),
    marginRight: s(10),
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: ms(14),
    fontWeight: 'bold',
    color: '#1F2937',
  },
  textInput: {
    flex: 1,
    fontSize: ms(14),
    color: '#1F2937',
    fontWeight: '600',
    height: '100%',
  },
  eyeBtn: {
    padding: s(6),
  },

  // Strength meter
  strengthWrapper: {
    marginTop: vs(6),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(2),
  },
  strengthBarBg: {
    height: vs(4),
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    flex: 1,
    marginRight: s(10),
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
  },
  strengthText: {
    fontSize: ms(10),
    fontWeight: 'bold',
  },

  // Remember row
  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: vs(14),
    marginBottom: vs(4),
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
  },
  checkboxBox: {
    width: ms(18),
    height: ms(18),
    borderRadius: ms(5),
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxBoxChecked: {
    borderColor: '#E024E3',
    backgroundColor: '#E024E3',
  },
  checkboxTick: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxText: {
    fontSize: ms(12),
    color: '#64748B',
    fontWeight: '600',
  },
  forgotText: {
    fontSize: ms(12),
    color: '#E024E3',
    fontWeight: 'bold',
  },

  // Submit button
  submitBtnWrapper: {
    marginTop: vs(24),
    height: vs(60),
    alignSelf: 'center',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  submitBtn: {
    width: '100%',
    height: '100%',
  },
  submitBtnGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: ms(16),
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  errorText: {
    color: '#EF4444',
    fontSize: ms(11),
    fontWeight: 'bold',
    marginTop: vs(4),
    paddingLeft: s(2),
  },
  serverErrorBox: {
    backgroundColor: '#FDF4FF',
    borderWidth: 1.2,
    borderColor: '#F5D0FE',
    borderRadius: ms(14),
    padding: ms(12),
    marginTop: vs(14),
  },
  serverErrorText: {
    color: '#C026D3',
    fontSize: ms(12),
    fontWeight: '700',
    textAlign: 'center',
  },

  // Features Row
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: s(10),
    marginBottom: vs(32),
  },
  featureCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: ms(16),
    paddingVertical: vs(14),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  featureIconWrap: {
    width: ms(30),
    height: ms(30),
    borderRadius: ms(10),
    backgroundColor: '#EAF8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(6),
  },
  featureCardText: {
    fontSize: ms(10),
    fontWeight: 'bold',
    color: '#1F2937',
  },

  // Support
  supportContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  supportText: {
    fontSize: ms(12),
    color: '#64748B',
    fontWeight: '600',
  },
  supportLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supportLink: {
    fontSize: ms(12),
    color: '#166534',
    fontWeight: 'bold',
  },

  // Workspace loader styles
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F6FFF8',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  loaderCenterBox: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: s(36),
  },
  loaderLogo: {
    width: s(260),
    height: vs(130),
    marginBottom: vs(24),
  },
  loaderTrack: {
    width: '100%',
    height: vs(44),
    position: 'relative',
    justifyContent: 'center',
    marginBottom: vs(20),
  },
  loaderTrackDashed: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1.5,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
  },
  loaderTruckWrap: {
    position: 'absolute',
    height: vs(44),
    justifyContent: 'center',
  },
  loaderProgressBg: {
    width: '100%',
    height: vs(6),
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginBottom: vs(12),
    overflow: 'hidden',
  },
  loaderProgressFill: {
    width: '35%',
    height: '100%',
  },
  loaderMsg: {
    fontSize: ms(13),
    color: '#64748B',
    fontWeight: 'bold',
  },

  // Confetti piece
  confettiPiece: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    top: '50%',
    left: '50%',
  },
});
