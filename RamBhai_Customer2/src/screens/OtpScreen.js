import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  Animated, Platform, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../store/UseAppStore';
import { themeTokens } from '../constants/theme';
import Screen from '../components/Screen';
import AppButton from '../components/AppButton';

const OTP_LENGTH = 6;

export default function OtpScreen({ navigation, route }) {
  const login  = useAppStore((s) => s.login);
  const mode   = useAppStore((s) => s.themeMode);
  const colors = themeTokens[mode];
  const isDark = mode === 'dark';

  const [otp, setOtp]           = useState('');
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const inputRef   = useRef(null);
  const shakeAnim  = useRef(new Animated.Value(0)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(28)).current;
  const iconScale  = useRef(new Animated.Value(0.6)).current;
  const cursorAnim = useRef(new Animated.Value(1)).current;

  const mobile     = route?.params?.mobile || 'your mobile number';
  const action     = route?.params?.action || 'register';
  const isComplete = otp.length === OTP_LENGTH;
  const activeIdx  = Math.min(otp.length, OTP_LENGTH - 1);
  const digits     = Array(OTP_LENGTH).fill('').map((_, i) => otp[i] || '');

  // ── Entrance ──────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 55, useNativeDriver: true }),
      Animated.spring(iconScale, { toValue: 1, friction: 5, tension: 38, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Cursor blink ──────────────────────────────────────────────────────
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorAnim, { toValue: 0, duration: 480, useNativeDriver: true }),
        Animated.timing(cursorAnim, { toValue: 1, duration: 480, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // ── Countdown ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (countdown === 0) { setCanResend(true); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // ── Helpers ───────────────────────────────────────────────────────────
  const shake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 7,   duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -7,  duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const doVerify = async () => {
    if (!isComplete) return;
    try {
      const { authApi } = require('../services/api/auth');
      const res = await authApi.verifyRegistrationOtp({ phone: mobile, otp });
      if (res.success && res.token && res.user) {
        await useAppStore.getState().setAuth(res.token, res.user);
        
        try {
          useAppStore.getState().completeOnboarding();
          navigation.replace('MainTabs');
        } catch (err) {
          console.log('Error during login navigation:', err);
          navigation.replace('MainTabs');
        }
      } else {
        Alert.alert('Verification Failed', res.message || 'Invalid OTP');
        setOtp('');
        shake();
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Network error occurred');
      setOtp('');
      shake();
    }
  };

  const handleVerify = () => {
    if (!isComplete) { shake(); return; }
    doVerify();
  };

  const handleChange = (v) => {
    const clean = v.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
    setOtp(clean);
    if (clean.length === OTP_LENGTH) {
      setTimeout(doVerify, 360);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    try {
      const { authApi } = require('../services/api/auth');
      const res = await authApi.resendOtp({ phone: mobile });
      if (res.success) {
        setOtp('');
        setCountdown(30);
        setCanResend(false);
        inputRef.current?.focus();
      } else {
        Alert.alert('Resend Failed', res.message || 'Failed to resend OTP');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Network error occurred');
    }
  };

  // ── Remaining-digits copy ─────────────────────────────────────────────
  const remaining = OTP_LENGTH - otp.length;
  const btnLabel  = isComplete
    ? 'Verify & Continue'
    : `${remaining} digit${remaining !== 1 ? 's' : ''} remaining`;

  return (
    <Screen>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── Layered-ring icon ───────────────────────────────────── */}
          <Animated.View style={[s.iconWrap, { transform: [{ scale: iconScale }] }]}>
            <View style={[s.ring3, { backgroundColor: colors.primary + '0D' }]}>
              <View style={[s.ring2, { backgroundColor: colors.primary + '1A' }]}>
                <View style={[s.ring1, { backgroundColor: colors.primary + '2E' }]}>
                  <View style={[s.iconCore, { backgroundColor: colors.primary }]}>
                    <MaterialCommunityIcons name="shield-check-outline" size={28} color="#fff" />
                  </View>
                </View>
              </View>
            </View>
            {/* floating accent dots */}
            <View style={[s.dotA, { backgroundColor: colors.primary }]} />
            <View style={[s.dotB, { backgroundColor: colors.primary + '55' }]} />
          </Animated.View>

          {/* ── Header ─────────────────────────────────────────────── */}
          <Text style={[s.title, { color: colors.text }]}>Enter the code</Text>
          <Text style={[s.sub, { color: colors.textSoft }]}>
            We sent a {OTP_LENGTH}-digit code to{'\n'}
            <Text style={[s.phone, { color: colors.text }]}>{mobile}</Text>
          </Text>

          {/* ── OTP digit boxes ─────────────────────────────────────── */}
          <Pressable onPress={() => inputRef.current?.focus()}>
            <Animated.View style={[s.otpRow, { transform: [{ translateX: shakeAnim }] }]}>
              {digits.map((d, i) => {
                const active = i === activeIdx && !isComplete;
                return (
                  <View
                    key={i}
                    style={[
                      s.box,
                      {
                        backgroundColor: d
                          ? colors.primary + '12'
                          : isDark ? colors.surface : '#F5F7FA',
                        borderColor: active
                          ? colors.primary
                          : d
                          ? colors.primary + '55'
                          : colors.border ?? '#DEE3EE',
                        borderWidth: active ? 2.5 : 1.5,
                        // glow on active
                        shadowColor:   colors.primary,
                        shadowOpacity: active ? 0.22 : 0,
                        shadowRadius:  active ? 14   : 0,
                        shadowOffset:  { width: 0, height: 4 },
                        elevation:     active ? 8    : 0,
                      },
                    ]}
                  >
                    {d ? (
                      <Text style={[s.digit, { color: colors.text }]}>{d}</Text>
                    ) : active ? (
                      <Animated.View
                        style={[s.cursor, { backgroundColor: colors.primary, opacity: cursorAnim }]}
                      />
                    ) : null}
                  </View>
                );
              })}
            </Animated.View>
          </Pressable>

          {/* ── Hidden real TextInput ───────────────────────────────── */}
          <TextInput
            ref={inputRef}
            value={otp}
            onChangeText={handleChange}
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            autoFocus
            style={s.hiddenInput}
          />

          {/* ── CTA button ──────────────────────────────────────────── */}
          <View style={s.btnWrap}>
            <AppButton title={btnLabel} onPress={handleVerify} />
          </View>

          {/* ── Resend row ──────────────────────────────────────────── */}
          <View style={s.resendRow}>
            <Text style={[s.resendLabel, { color: colors.textSoft }]}>
              Didn't get it?{'  '}
            </Text>
            <Pressable onPress={handleResend} disabled={!canResend}>
              <Text style={[
                s.resendCta,
                {
                  color:   canResend ? colors.primary : colors.textSoft,
                  opacity: canResend ? 1 : 0.55,
                },
              ]}>
                {canResend ? 'Resend code' : `Resend in 0:${String(countdown).padStart(2, '0')}`}
              </Text>
            </Pressable>
          </View>

        </Animated.View>
    </Screen>
  );
}

const BOX_SIZE = 68;

const s = StyleSheet.create({
  flex: { flex: 1 },

  // Icon
  iconWrap: {
    width: 128,
    height: 128,
    marginTop: 8,
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring3: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring2: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring1: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCore: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotA: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    top: 12,
    right: 4,
  },
  dotB: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 3.5,
    bottom: 16,
    left: 2,
  },

  // Header
  title: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.6,
    lineHeight: 36,
    marginBottom: 10,
  },
  sub: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 36,
  },
  phone: {
    fontWeight: '700',
    fontSize: 15,
  },

  // OTP boxes
  otpRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  box: {
    flex: 1,
    height: BOX_SIZE,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cursor: {
    width: 2.5,
    height: 28,
    borderRadius: 2,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },

  // CTA
  btnWrap: { marginBottom: 20 },

  // Resend
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  resendLabel: { fontSize: 14 },
  resendCta:   { fontSize: 14, fontWeight: '700' },
});
