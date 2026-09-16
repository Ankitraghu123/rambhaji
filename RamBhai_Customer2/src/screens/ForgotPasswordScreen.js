import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../store/UseAppStore';
import { themeTokens, radius } from '../constants/theme';
import Screen from '../components/Screen';
import Card from '../components/Card';
import AppButton from '../components/AppButton';
import SectionHeader from '../components/SectionHeader';
import Input from '../components/Input';
import { authApi } from '../services/api/auth';

function getPasswordStrength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0–4
}

const STRENGTH_META = [
  { label: 'Too weak', color: '#EF4444' },
  { label: 'Weak', color: '#F59E0B' },
  { label: 'Fair', color: '#F59E0B' },
  { label: 'Good', color: '#3B82F6' },
  { label: 'Strong', color: '#16A34A' },
];

function PasswordField({ label, value, onChangeText, show, onToggleShow, colors, border, danger, error, placeholder }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[s.fieldLabel, { color: colors.text }]}>{label}</Text>
      <View
        style={[
          s.passwordBox,
          { borderColor: error ? danger : border, backgroundColor: colors.surfaceSoft ?? 'transparent' },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!show}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          style={[s.passwordInput, { color: colors.text }]}
          autoCapitalize="none"
        />
        <Pressable onPress={onToggleShow} hitSlop={8}>
          <MaterialCommunityIcons
            name={show ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color={colors.textSoft}
          />
        </Pressable>
      </View>
      {!!error && <Text style={[s.errorText, { color: danger }]}>{error}</Text>}
    </View>
  );
}

export default function ForgotPasswordScreen({ navigation }) {
  const mode = useAppStore((s) => s.themeMode);
  const colors = themeTokens[mode];

  const border = colors.border ?? 'rgba(0,0,0,0.08)';
  const danger = colors.danger ?? '#EF4444';
  const success = colors.success ?? '#16A34A';

  const [step, setStep] = useState(1);
  const stepFade = useRef(new Animated.Value(1)).current;

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const strengthScore = useMemo(() => getPasswordStrength(password), [password]);
  const strengthMeta = STRENGTH_META[strengthScore];
  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === password;

  function goToStep(next) {
    Animated.timing(stepFade, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
      setStep(next);
      Animated.timing(stepFade, { toValue: 1, duration: 240, useNativeDriver: true }).start();
    });
  }

  // STEP 1: Send OTP
  async function handleSendOtp() {
    const next = {};
    if (!/^\d{10}$/.test(phone)) next.phone = 'Enter a valid 10-digit phone number';
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setSubmitting(true);
    try {
      const res = await authApi.forgotPassword({ phone });
      if (res.success) {
        setErrors({});
        goToStep(2);
      } else {
        setErrors({ phone: res.message || 'Failed to send OTP' });
      }
    } catch (e) {
      setErrors({ phone: e.response?.data?.message || 'Error connecting to server' });
    } finally {
      setSubmitting(false);
    }
  }

  // STEP 2: Verify OTP
  async function handleVerifyOtp() {
    const next = {};
    if (otp.length < 4) next.otp = 'Enter a valid OTP';
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setSubmitting(true);
    try {
      const res = await authApi.verifyForgotPasswordOtp({ phone, otp });
      if (res.success) {
        setErrors({});
        goToStep(3);
      } else {
        setErrors({ otp: res.message || 'Invalid OTP' });
      }
    } catch (e) {
      setErrors({ otp: e.response?.data?.message || 'Error connecting to server' });
    } finally {
      setSubmitting(false);
    }
  }

  // STEP 3: Reset Password
  async function handleResetPassword() {
    const next = {};
    if (password.length < 8) next.password = 'Password must be at least 8 characters';
    if (confirmPassword !== password) next.confirmPassword = 'Passwords do not match';
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setSubmitting(true);
    try {
      const res = await authApi.resetPassword({ phone, otp, password, confirmPassword });
      if (res.success) {
        setErrors({});
        navigation.navigate('Login');
      } else {
        setErrors({ api: res.message || 'Failed to reset password' });
      }
    } catch (e) {
      setErrors({ api: e.response?.data?.message || 'Error connecting to server' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <View style={s.headerRow}>
        <View style={[s.heroIcon, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="lock-reset" size={26} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, { color: colors.text }]}>Reset Password</Text>
          <Text style={[s.sub, { color: colors.textSoft }]}>
            Securely set a new password to access your account.
          </Text>
        </View>
      </View>

      {/* ── Step progress ─────────────────────────────────────────────── */}
      <View style={s.progressRow}>
        {[1, 2, 3].map((n) => {
          const reached = step >= n;
          const current = step === n;
          return (
            <React.Fragment key={n}>
              <View style={s.progressStep}>
                <View
                  style={[
                    s.progressDot,
                    {
                      backgroundColor: reached ? colors.primary : 'transparent',
                      borderColor: reached ? colors.primary : border,
                    },
                  ]}
                >
                  {step > n ? (
                    <MaterialCommunityIcons name="check" size={12} color="#fff" />
                  ) : (
                    <Text style={[s.progressDotText, { color: reached ? '#fff' : colors.textMuted }]}>
                      {n}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    s.progressLabel,
                    { color: current ? colors.text : colors.textMuted, fontWeight: current ? '800' : '600' },
                  ]}
                >
                  {n === 1 ? 'Phone' : n === 2 ? 'Verify' : 'New Password'}
                </Text>
              </View>
              {n < 3 && (
                <View style={[s.progressLine, { backgroundColor: step > n ? colors.primary : border }]} />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* ── Animated step content ────────────────────────────────────── */}
      <Animated.View style={{ opacity: stepFade }}>
        <Card>
          {step === 1 && (
            <>
              <SectionHeader title="Identify your account" subtitle="Enter your phone number to receive an OTP" />

              <Input
                label="Phone Number"
                value={phone}
                onChangeText={(v) => {
                  setPhone(v.replace(/[^0-9]/g, '').slice(0, 10));
                  if (errors.phone) setErrors((e) => ({ ...e, phone: undefined }));
                }}
                keyboardType="number-pad"
                maxLength={10}
                placeholder="10-digit mobile number"
              />
              {!!errors.phone && <Text style={[s.errorText, { color: danger }]}>{errors.phone}</Text>}

              <AppButton
                title={submitting ? 'Sending...' : 'Send OTP'}
                onPress={handleSendOtp}
                disabled={submitting}
              />
            </>
          )}

          {step === 2 && (
            <>
              <SectionHeader title="Verify OTP" subtitle={`We sent a code to ${phone}`} />

              <Input
                label="OTP Code"
                value={otp}
                onChangeText={(v) => {
                  setOtp(v.replace(/[^0-9]/g, '').slice(0, 6));
                  if (errors.otp) setErrors((e) => ({ ...e, otp: undefined }));
                }}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="Enter verification code"
              />
              {!!errors.otp && <Text style={[s.errorText, { color: danger }]}>{errors.otp}</Text>}

              <View style={s.actionRow}>
                <AppButton title="Back" variant="secondary" onPress={() => goToStep(1)} style={{ flex: 1 }} />
                <AppButton
                  title={submitting ? 'Verifying...' : 'Verify OTP'}
                  onPress={handleVerifyOtp}
                  disabled={submitting}
                  style={{ flex: 1 }}
                />
              </View>
            </>
          )}

          {step === 3 && (
            <>
              <SectionHeader title="Create new password" subtitle="Set a strong password for your account" />

              <PasswordField
                label="New Password"
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
                }}
                show={showPassword}
                onToggleShow={() => setShowPassword((v) => !v)}
                colors={colors}
                border={border}
                danger={danger}
                error={errors.password}
                placeholder="At least 8 characters"
              />

              {!!password && (
                <View style={s.strengthWrap}>
                  <View style={s.strengthBars}>
                    {[0, 1, 2, 3].map((i) => (
                      <View
                        key={i}
                        style={[
                          s.strengthBar,
                          { backgroundColor: i < strengthScore ? strengthMeta.color : border },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[s.strengthLabel, { color: strengthMeta.color }]}>{strengthMeta.label}</Text>
                </View>
              )}

              <PasswordField
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={(v) => {
                  setConfirmPassword(v);
                  if (errors.confirmPassword) setErrors((e) => ({ ...e, confirmPassword: undefined }));
                }}
                show={showConfirm}
                onToggleShow={() => setShowConfirm((v) => !v)}
                colors={colors}
                border={border}
                danger={danger}
                error={errors.confirmPassword}
                placeholder="Re-enter your password"
              />
              {passwordsMatch && !errors.confirmPassword && (
                <View style={s.matchRow}>
                  <MaterialCommunityIcons name="check-circle" size={14} color={success} />
                  <Text style={[s.matchText, { color: success }]}>Passwords match</Text>
                </View>
              )}

              {!!errors.api && <Text style={[s.errorText, { color: danger, marginBottom: 10 }]}>{errors.api}</Text>}

              <AppButton
                title={submitting ? 'Resetting...' : 'Reset Password'}
                onPress={handleResetPassword}
                disabled={submitting}
              />
            </>
          )}
        </Card>
      </Animated.View>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <Pressable onPress={() => navigation.navigate('Login')} style={s.loginRow} hitSlop={6}>
        <Text style={[s.loginText, { color: colors.textSoft }]}>
          Remembered your password?{' '}
          <Text style={{ color: colors.primary, fontWeight: '800' }}>Log in</Text>
        </Text>
      </Pressable>
    </Screen>
  );
}

const s = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: radius?.lg ?? 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '900' },
  sub: { fontSize: 13, lineHeight: 19, marginTop: 2 },

  progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18, justifyContent: 'space-between' },
  progressStep: { alignItems: 'center', flex: 1 },
  progressDot: {
    width: 26,
    height: 26,
    borderRadius: 99,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotText: { fontSize: 12, fontWeight: '800' },
  progressLabel: { fontSize: 11, marginTop: 4, textAlign: 'center' },
  progressLine: { flex: 1, height: 2, marginHorizontal: -4, marginBottom: 16 },

  fieldLabel: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  passwordBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius?.md ?? 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  passwordInput: { flex: 1, fontSize: 14, paddingVertical: 10 },
  errorText: { fontSize: 12, fontWeight: '600', marginTop: 4, marginBottom: 6 },

  strengthWrap: { marginTop: -6, marginBottom: 14 },
  strengthBars: { flexDirection: 'row', gap: 5, marginBottom: 5 },
  strengthBar: { flex: 1, height: 5, borderRadius: 99 },
  strengthLabel: { fontSize: 11, fontWeight: '700' },

  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: -8, marginBottom: 14 },
  matchText: { fontSize: 12, fontWeight: '700' },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 8 },

  loginRow: { alignItems: 'center', marginTop: 24 },
  loginText: { fontSize: 13, fontWeight: '600' },
});
