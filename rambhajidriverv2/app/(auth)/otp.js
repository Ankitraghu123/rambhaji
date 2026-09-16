// app/(auth)/otp.js
// SCR-03: OTP verification screen
// Redesigned with premium fresh green theme (fruits, vegetables & alkaline water)

import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  KeyboardAvoidingView, Platform, TouchableOpacity, Animated,
} from 'react-native';
import { Button } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import AuthService from '../../src/features/auth/services/AuthService';
import { useSelector } from 'react-redux';
import { selectAuthLoading, selectAuthError } from '../../src/features/auth/state/authSlice';
import { formatCountdown } from '../../src/core/utils/dateUtils';
import { OTP_EXPIRY_SECONDS } from '../../src/config/constants';
import PageLoader from '../../src/components/common/PageLoader';

const OTP_LENGTH = 6;

export default function OtpScreen() {
  const { phone } = useLocalSearchParams();
  const isLoading = useSelector(selectAuthLoading);
  const serverError = useSelector(selectAuthError);

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(OTP_EXPIRY_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Shake animation on error
  useEffect(() => {
    if (serverError) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
      ]).start();
    }
  }, [serverError]);

  const handleDigitChange = (text, index) => {
    const val = text.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = val;
    setDigits(newDigits);

    if (val && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (val && index === OTP_LENGTH - 1 && newDigits.every(Boolean)) {
      submitOtp(newDigits.join(''));
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const submitOtp = async (otp) => {
    const result = await AuthService.verifyOtp(phone, otp);
    if (result.success) {
      router.replace('/(tabs)/');
    } else {
      // Clear digits on failure
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    setCanResend(false);
    setCountdown(OTP_EXPIRY_SECONDS);
    await AuthService.requestOtp(phone);
  };

  const otp = digits.join('');
  const isComplete = otp.length === OTP_LENGTH;

  if (isLoading) {
    return <PageLoader message="Verifying credentials..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconBox}>
            <Text style={styles.iconText}>📱</Text>
          </View>
          <Text style={styles.title}>Verify Your Number</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code we sent to{'\n'}
            <Text style={styles.phone}>+91 {phone}</Text>
          </Text>
        </View>

        {/* OTP Input Cells */}
        <Animated.View style={[styles.otpRow, { transform: [{ translateX: shakeAnim }] }]}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={(r) => { inputRefs.current[i] = r; }}
              style={[styles.cell, d ? styles.cellFilled : null]}
              value={d}
              onChangeText={(t) => handleDigitChange(t, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              placeholder="0"
              placeholderTextColor="#CBD5E1"
              caretHidden
            />
          ))}
        </Animated.View>

        {/* Error */}
        {serverError && (
          <Text style={styles.errorText}>{serverError}</Text>
        )}

        {/* Timer & Resend */}
        <View style={styles.resendRow}>
          {canResend ? (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendActive}>Resend OTP</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.resendInactive}>
              Resend code in <Text style={styles.countdown}>{formatCountdown(countdown)}</Text>
            </Text>
          )}
        </View>

        {/* Submit */}
        <Button
          mode="contained"
          onPress={() => submitOtp(otp)}
          loading={isLoading}
          disabled={!isComplete || isLoading}
          style={styles.button}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
          buttonColor="#0E4A35"
        >
          {isLoading ? 'Verifying…' : 'Verify & Login'}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, padding: 24, justifyContent: 'center' },

  backBtn: { position: 'absolute', top: 56, left: 24, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#F5F8F6', borderRadius: 12 },
  backText: { color: '#0E4A35', fontSize: 14, fontFamily: 'System', fontWeight: 'bold' },

  header: { alignItems: 'center', marginBottom: 40 },
  iconBox: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: '#E9F5EF', justifyContent: 'center', alignItems: 'center',
    marginBottom: 20, borderWidth: 1, borderColor: '#E0E6E2',
    shadowColor: '#0E4A35', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  iconText: { fontSize: 32 },
  title: { fontSize: 24, fontWeight: 'bold', fontFamily: 'System', color: '#1A2F25', marginBottom: 8 },
  subtitle: {
    fontSize: 14, fontFamily: 'System', color: '#5C6F66',
    textAlign: 'center', lineHeight: 22,
  },
  phone: { color: '#0E4A35', fontWeight: 'bold', fontFamily: 'System' },

  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 8 },
  cell: {
    width: 44, height: 54, borderRadius: 14,
    backgroundColor: '#F5F8F6', borderWidth: 1.5, borderColor: '#E0E6E2',
    textAlign: 'center', fontSize: 20, fontWeight: 'bold', fontFamily: 'System', color: '#1A2F25',
  },
  cellFilled: { borderColor: '#0E4A35', backgroundColor: '#E9F5EF' },

  errorText: {
    color: '#DC2626', textAlign: 'center', fontSize: 13,
    fontFamily: 'System', marginTop: 12, fontWeight: '500',
  },

  resendRow: { alignItems: 'center', marginTop: 20, marginBottom: 32 },
  resendInactive: { color: '#64748B', fontSize: 14, fontFamily: 'System' },
  countdown: { color: '#0E4A35', fontWeight: '600', fontFamily: 'System' },
  resendActive: { color: '#0E4A35', fontSize: 14, fontFamily: 'System', fontWeight: 'bold' },

  button: {
    borderRadius: 20, elevation: 3,
    shadowColor: '#0E4A35', shadowOpacity: 0.2, shadowRadius: 8,
  },
  buttonContent: { height: 54 },
  buttonLabel: { fontSize: 16, fontFamily: 'System', fontWeight: 'bold', letterSpacing: 0.5 },
});
