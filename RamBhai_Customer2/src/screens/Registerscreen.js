import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useAppStore } from '../store/UseAppStore';
import { themeTokens, radius } from '../constants/theme';
import Screen from '../components/Screen';
import Card from '../components/Card';
import AppButton from '../components/AppButton';
import SectionHeader from '../components/SectionHeader';
import Input from '../components/Input';

// ─── Password strength helper ───────────────────────────────────────────────
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

// ─── Reusable password field with show/hide toggle ──────────────────────────
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

export default function RegisterScreen({ navigation, route }) {
  const mode = useAppStore((s) => s.themeMode);
  const colors = themeTokens[mode];

  const border = colors.border ?? 'rgba(0,0,0,0.08)';
  const danger = colors.danger ?? '#EF4444';
  const success = colors.success ?? '#16A34A';

  const [step, setStep] = useState(1);
  const stepFade = useRef(new Animated.Value(1)).current;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('male');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  // Read deep link param (e.g. vsms://register?ref=CODE)
  const initialRef = route?.params?.ref || '';
  const [referralCode, setReferralCode] = useState(initialRef);
  
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

  function validateStep1() {
    const next = {};
    if (!fullName.trim()) next.fullName = 'Please enter your full name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Enter a valid email address';
    if (!/^\d{10}$/.test(phone)) next.phone = 'Enter a valid 10-digit phone number';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateStep2() {
    const next = {};
    if (password.length < 8) next.password = 'Password must be at least 8 characters';
    if (confirmPassword !== password) next.confirmPassword = 'Passwords do not match';
    if (!agreeTerms) next.terms = 'Please accept the Terms to continue';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleContinue() {
    if (validateStep1()) {
      setErrors({});
      goToStep(2);
    }
  }

  function handleBack() {
    setErrors({});
    goToStep(1);
  }

  async function handleCreateAccount() {
    if (!validateStep2()) return;
    setSubmitting(true);
    try {
      const { authApi } = require('../services/api/auth');
      const res = await authApi.register({
        name: fullName.trim(),
        email: email.trim() || undefined,
        phone,
        gender,
        password,
        referral_code: referralCode.trim() || undefined
      });
      if (res.success && res.user) {
        navigation.navigate('Otp', { mobile: phone, action: 'register' });
      } else {
        setErrors({ terms: res.message || 'Registration failed' });
      }
    } catch (e) {
      setErrors({ terms: e.response?.data?.message || 'Error connecting to server' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <View style={s.headerRow}>
        <View style={[s.heroIcon, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="account-plus-outline" size={26} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, { color: colors.text }]}>Create Account</Text>
          <Text style={[s.sub, { color: colors.textSoft }]}>
            Join us for fresh deliveries, wallet payments, and easy subscriptions.
          </Text>
        </View>
      </View>

      {/* ── Step progress ─────────────────────────────────────────────── */}
      <View style={s.progressRow}>
        {[1, 2].map((n) => {
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
                  {n === 1 ? 'Personal info' : 'Security'}
                </Text>
              </View>
              {n === 1 && (
                <View style={[s.progressLine, { backgroundColor: step > 1 ? colors.primary : border }]} />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* ── Animated step content ────────────────────────────────────── */}
      <Animated.View style={{ opacity: stepFade }}>
        <Card>
          {step === 1 ? (
            <>
              <SectionHeader title="Personal information" subtitle="Tell us a bit about yourself" />

              <Input
                label="Full Name"
                value={fullName}
                onChangeText={(v) => {
                  setFullName(v);
                  if (errors.fullName) setErrors((e) => ({ ...e, fullName: undefined }));
                }}
                placeholder="Enter your full name"
              />
              {!!errors.fullName && <Text style={[s.errorText, { color: danger }]}>{errors.fullName}</Text>}

              <Input
                label="Email"
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
                }}
                keyboardType="email-address"
                placeholder="you@example.com"
              />
              {!!errors.email && <Text style={[s.errorText, { color: danger }]}>{errors.email}</Text>}

              <Input
                label="Referral Code (Optional)"
                value={referralCode}
                onChangeText={setReferralCode}
                placeholder="Enter referral code if you have one"
                autoCapitalize="characters"
              />

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

              <View style={{ marginBottom: 14 }}>
                <Text style={[s.fieldLabel, { color: colors.text }]}>Gender</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  {['male', 'female', 'other'].map((option) => {
                    const isSelected = gender === option;
                    return (
                      <Pressable
                        key={option}
                        onPress={() => setGender(option)}
                        style={[
                          s.genderBtn,
                          {
                            backgroundColor: isSelected ? colors.primary : (mode === 'dark' ? colors.surfaceAlt : '#fff'),
                            borderColor: isSelected ? colors.primary : colors.border,
                            borderWidth: 1,
                            flex: 1,
                          }
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={option === 'male' ? 'gender-male' : option === 'female' ? 'gender-female' : 'gender-non-binary'}
                          size={18}
                          color={isSelected ? '#fff' : colors.textSoft}
                        />
                        <Text style={[
                          s.genderBtnText,
                          { color: isSelected ? '#fff' : colors.textSoft, fontWeight: isSelected ? '800' : '600' }
                        ]}>
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <AppButton title="Continue" onPress={handleContinue} />
            </>
          ) : (
            <>
              <SectionHeader title="Set a password" subtitle="Choose a strong password to secure your account" />

              <PasswordField
                label="Password"
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

              <View style={[s.termsRow, { borderColor: border }]}>
                <Switch
                  value={agreeTerms}
                  onValueChange={(v) => {
                    setAgreeTerms(v);
                    if (errors.terms) setErrors((e) => ({ ...e, terms: undefined }));
                  }}
                  trackColor={{ false: border, true: colors.primary }}
                  thumbColor="#fff"
                />
                <Text style={[s.termsText, { color: colors.textSoft }]}>
                  I agree to the <Text style={{ fontWeight: '800', color: colors.text }}>Terms of Service</Text> and{' '}
                  <Text style={{ fontWeight: '800', color: colors.text }}>Privacy Policy</Text>.
                </Text>
              </View>
              {!!errors.terms && <Text style={[s.errorText, { color: danger }]}>{errors.terms}</Text>}

              <View style={s.actionRow}>
                <AppButton title="Back" variant="secondary" onPress={handleBack} style={{ flex: 1 }} />
                <AppButton
                  title={submitting ? 'Creating…' : 'Create Account'}
                  onPress={handleCreateAccount}
                  disabled={submitting}
                  style={{ flex: 1 }}
                />
              </View>
            </>
          )}
        </Card>
      </Animated.View>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <Pressable 
        onPress={() => navigation.navigate('Login')} 
        style={({ pressed }) => [
          s.loginRow, 
          { 
            backgroundColor: colors.primary + '10', 
            borderColor: colors.primary + '30',
            opacity: pressed ? 0.8 : 1
          }
        ]}
      >
        <Text style={[s.loginText, { color: colors.textSoft }]}>
          Already have an account?
        </Text>
        <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 15, marginLeft: 4 }}>
          Log in
        </Text>
        <MaterialCommunityIcons name="arrow-right" size={18} color={colors.primary} style={{ marginLeft: 6 }} />
      </Pressable>

      <View style={s.trustRow}>
        <MaterialCommunityIcons name="shield-check-outline" size={14} color={success} />
        <Text style={[s.trustText, { color: colors.textMuted }]}>
          Your information is encrypted and never shared.
        </Text>
      </View>
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

  progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  progressStep: { alignItems: 'center', width: 92 },
  progressDot: {
    width: 26,
    height: 26,
    borderRadius: 99,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotText: { fontSize: 12, fontWeight: '800' },
  progressLabel: { fontSize: 11, marginTop: 4 },
  progressLine: { flex: 1, height: 2, marginHorizontal: -8, marginBottom: 16 },

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
  genderBtn: {
    paddingVertical: 12,
    borderRadius: radius?.md ?? 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6
  },
  genderBtnText: {
    fontSize: 13,
  },

  strengthWrap: { marginTop: -6, marginBottom: 14 },
  strengthBars: { flexDirection: 'row', gap: 5, marginBottom: 5 },
  strengthBar: { flex: 1, height: 5, borderRadius: 99 },
  strengthLabel: { fontSize: 11, fontWeight: '700' },

  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: -8, marginBottom: 14 },
  matchText: { fontSize: 12, fontWeight: '700' },

  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: radius?.md ?? 12,
    padding: 12,
    marginTop: 4,
    marginBottom: 6,
  },
  termsText: { flex: 1, fontSize: 12, lineHeight: 18 },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 8 },

  loginRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginTop: 22, 
    paddingVertical: 16,
    borderRadius: radius?.md ?? 12,
    borderWidth: 1,
  },
  loginText: { fontSize: 15, fontWeight: '600' },

  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  trustText: { fontSize: 11 },
});
