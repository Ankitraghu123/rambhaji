import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  Animated, Platform, Alert, Pressable
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../store/UseAppStore';
import { themeTokens } from '../constants/theme';
import Screen from '../components/Screen';
import AppButton from '../components/AppButton';
import { authApi } from '../services/api/auth';

const FEATURES = [
  { icon: 'calendar-clock-outline', text: 'Subscription plans — monthly, quarterly & annual' },
  { icon: 'basket-outline',         text: 'Veggie bag customisation & delivery scheduling' },
  { icon: 'wallet-outline',         text: 'Wallet recharge, retail orders & alkaline water' },
];

export default function LoginScreen({ navigation }) {
  const [mobile, setMobile]   = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const mode   = useAppStore((s) => s.themeMode);
  const colors = themeTokens[mode];
  const isDark = mode === 'dark';

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(32)).current;
  const iconScale = useRef(new Animated.Value(0.55)).current;
  const spinAnim  = useRef(new Animated.Value(0)).current;

  const isValid = mobile.length === 10 && password.length >= 6;

  // ── Entrance ────────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 7,  tension: 50, useNativeDriver: true }),
      Animated.spring(iconScale, { toValue: 1, friction: 5,  tension: 36, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Loading spin ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading) { spinAnim.setValue(0); return; }
    const loop = Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [loading]);

  const spinRotate = spinAnim.interpolate({
    inputRange: [0, 1], outputRange: ['0deg', '360deg'],
  });

  const handleSend = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await authApi.login({ phone: mobile, password });
      setLoading(false);
      if (res.success && res.token) {
        await useAppStore.getState().setAuth(res.token, res.user);
        
        try {
          useAppStore.getState().completeOnboarding();
          navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
        } catch (err) {
          console.log('Error during login navigation:', err);
          navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
        }
      } else {
        setErrorMsg(res.message || 'Invalid credentials');
      }
    } catch (error) {
      setLoading(false);
      if (error.response && error.response.status === 403) {
        setErrorMsg('Please verify your phone number.');
        // Route to OTP screen
        setTimeout(() => {
          navigation.navigate('Otp', { mobile, action: 'register' });
        }, 1500);
      } else if (error.response && error.response.status === 404) {
        setErrorMsg('User not found. Please register.');
      } else if (error.response && error.response.status === 400) {
        setErrorMsg('Invalid phone number or password.');
      } else {
        setErrorMsg(error.response?.data?.message || 'Network error occurred');
      }
    }
  };

  return (
    <Screen>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── Brand icon ───────────────────────────────────────────── */}
          <Animated.View style={[s.iconWrap, { transform: [{ scale: iconScale }] }]}>
            <View style={[s.ring3, { backgroundColor: colors.primary + '0D' }]}>
              <View style={[s.ring2, { backgroundColor: colors.primary + '1A' }]}>
                <View style={[s.ring1, { backgroundColor: colors.primary + '2E' }]}>
                  <View style={[s.iconCore, { backgroundColor: colors.primary }]}>
                    <MaterialCommunityIcons name="leaf" size={28} color="#fff" />
                  </View>
                </View>
              </View>
            </View>
            <View style={[s.dotA, { backgroundColor: colors.primary }]} />
            <View style={[s.dotB, { backgroundColor: colors.primary + '55' }]} />
          </Animated.View>

          {/* ── Header ──────────────────────────────────────────────── */}
          <Text style={[s.title, { color: colors.text }]}>Fresh at your door</Text>
          <Text style={[s.sub, { color: colors.textSoft }]}>
            Enter your mobile number and password to login.
          </Text>

          {/* ── Phone input ─────────────────────────────────────────── */}
          <View style={[
            s.phoneWrap,
            {
              backgroundColor: isDark ? colors.surface : '#F5F7FA',
              borderColor:     colors.border ?? '#DEE3EE',
            },
          ]}>
            {/* Country prefix */}
            <View style={[s.prefix, { borderRightColor: colors.border ?? '#DEE3EE' }]}>
              <Text style={s.flag}>🇮🇳</Text>
              <Text style={[s.code, { color: colors.text }]}>+91</Text>
            </View>

            {/* Number field */}
            <TextInput
              style={[s.phoneInput, { color: colors.text }]}
              value={mobile}
              onChangeText={(v) => setMobile(v.replace(/[^0-9]/g, '').slice(0, 10))}
              keyboardType="phone-pad"
              placeholder="10-digit number"
              placeholderTextColor={colors.textSoft}
              maxLength={10}
            />
          </View>

          {/* ── Password input ──────────────────────────────────────── */}
          <View style={[
            s.passwordBox,
            {
              backgroundColor: isDark ? colors.surface : '#F5F7FA',
              borderColor:     colors.border ?? '#DEE3EE',
            },
          ]}>
            <TextInput
              style={[s.passwordInput, { color: colors.text }]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="Password"
              placeholderTextColor={colors.textSoft}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
              <MaterialCommunityIcons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textSoft}
              />
            </Pressable>
          </View>

          {/* ── Forgot Password & Error ─────────────────────────────────────────── */}
          <View style={s.forgotRow}>
            {!!errorMsg ? (
              <Text style={[s.errorText, { color: colors.danger ?? '#EF4444' }]}>{errorMsg}</Text>
            ) : (
              <View style={{ flex: 1 }} />
            )}
            <Pressable onPress={() => navigation.navigate('Register', { screen: 'ForgotPassword' }) || navigation.navigate('ForgotPassword')}>
              <Text style={[s.forgotText, { color: colors.primary }]}>Forgot Password?</Text>
            </Pressable>
          </View>

          {/* ── CTA ─────────────────────────────────────────────────── */}
          <View style={s.btnWrap}>
            <AppButton
              title={loading ? 'Logging in…' : 'Login'}
              onPress={handleSend}
              disabled={!isValid || loading}
              loading={loading}
            />
          </View>
   {/* ── Register link ────────────────────────────────────────── */}
          <Pressable
            style={({ pressed }) => [
              s.registerRow,
              {
                backgroundColor: colors.primary + '10',
                borderColor: colors.primary + '30',
                opacity: pressed ? 0.8 : 1,
              }
            ]}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={[s.registerText, { color: colors.textSoft }]}>New here? </Text>
            <Text style={[s.registerLink, { color: colors.primary, marginLeft: 4 }]}>
              Create an account
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color={colors.primary} style={{ marginLeft: 6 }} />
          </Pressable>
          {/* ── What you get ─────────────────────────────────────────── */}
          <View style={s.sectionHead}>
            <View style={[s.line, { backgroundColor: colors.border ?? '#DEE3EE' }]} />
            <Text style={[s.sectionLabel, { color: colors.textSoft }]}>What you get</Text>
            <View style={[s.line, { backgroundColor: colors.border ?? '#DEE3EE' }]} />
          </View>

          {FEATURES.map(({ icon, text }, i) => (
            <View
              key={i}
              style={[
                s.featureRow,
                {
                  backgroundColor: isDark ? colors.surface : '#F5F7FA',
                  borderColor:     colors.border ?? '#DEE3EE',
                },
              ]}
            >
              <View style={[s.featureIcon, { backgroundColor: colors.primary + '15' }]}>
                <MaterialCommunityIcons name={icon} size={16} color={colors.primary} />
              </View>
              <Text style={[s.featureText, { color: colors.textSoft }]}>{text}</Text>
            </View>
          ))}



       

        </Animated.View>
    </Screen>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },

  // ── Icon rings ────────────────────────────────────────────────────────
  iconWrap: {
    width: 128, height: 128,
    marginTop: 8, marginBottom: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  ring3: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
  ring2: { width: 90,  height: 90,  borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
  ring1: { width: 68,  height: 68,  borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  iconCore: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  dotA: { position: 'absolute', width: 10, height: 10, borderRadius: 5,   top: 12,  right: 4  },
  dotB: { position: 'absolute', width: 7,  height: 7,  borderRadius: 3.5, bottom: 16, left: 2 },

  // ── Header ────────────────────────────────────────────────────────────
  title: {
    fontSize: 30, fontWeight: '900',
    letterSpacing: -0.6, lineHeight: 36, marginBottom: 10,
  },
  sub: { fontSize: 14, lineHeight: 22, marginBottom: 28 },

  // ── Phone input ───────────────────────────────────────────────────────
  phoneWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 16,
  },
  prefix: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: '100%',
    borderRightWidth: 1.5,
    gap: 6,
  },
  flag: { fontSize: 18 },
  code: { fontSize: 15, fontWeight: '700' },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  passwordBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // ── CTA & Forgot ───────────────────────────────────────────────────────
  forgotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: -4,
  },
  forgotText: { fontSize: 13, fontWeight: '700' },
  errorText: { fontSize: 13, flex: 1, paddingRight: 10 },
  btnWrap: { marginBottom: 28 },

  // ── Section divider ───────────────────────────────────────────────────
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  line:         { flex: 1, height: 1 },
  sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },

  // ── Feature rows ──────────────────────────────────────────────────────
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 8,
    gap: 12,
  },
  featureIcon: {
    width: 32, height: 32,
    borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  featureText: { flex: 1, fontSize: 13, lineHeight: 19 },

  // ── Demo pill ─────────────────────────────────────────────────────────
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
    marginTop: 10,
  },
  pillText: { fontSize: 12, fontWeight: '600' },

  // ── Register link ─────────────────────────────────────────────────────
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  registerText: { fontSize: 15, fontWeight: '600' },
  registerLink: { fontSize: 15, fontWeight: '800' },
});
