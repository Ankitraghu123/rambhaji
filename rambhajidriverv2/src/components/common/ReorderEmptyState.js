// src/components/common/ReorderEmptyState.js
// Premium animated Ram Bhaji reorder empty state — fixed system design
// All absolute-positioned elements are scoped inside a fixed-size illustration box
// Proper overflow:hidden boundaries, no layout overflow, 60fps native driver

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions, Easing,
} from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');

// The illustration area is fixed-width so all absolute positions are relative to it
const ILLUS_W = Math.min(SCREEN_W - 40, 360);
const ILLUS_H = 220;

// ─── Cloud (scoped inside illustration box) ──────────────────────────────────
function Cloud({ top, fontSize, duration, startX }) {
  const x = useRef(new Animated.Value(startX)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(x, {
          toValue: ILLUS_W + 60,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(x, {
          toValue: -60,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  return (
    <Animated.Text
      style={{
        position: 'absolute',
        top,
        fontSize,
        opacity: 0.75,
        transform: [{ translateX: x }],
      }}
    >
      ☁️
    </Animated.Text>
  );
}

// ─── Floating Veggie (scoped inside illustration box) ────────────────────────
function FloatingVeggie({ emoji, left, top, delay, amp = 10, dur = 2600, fontSize = 20 }) {
  const y = useRef(new Animated.Value(0)).current;
  const rot = useRef(new Animated.Value(0)).current;
  const op = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(op, { toValue: 1, duration: 500, delay, useNativeDriver: true }).start();
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(y, { toValue: -amp, duration: dur, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(y, { toValue: amp * 0.5, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(rot, { toValue: 1, duration: dur * 0.7, useNativeDriver: true }),
          Animated.timing(rot, { toValue: -1, duration: dur * 0.7, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  const rotate = rot.interpolate({ inputRange: [-1, 1], outputRange: ['-14deg', '14deg'] });

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left,
        top,
        fontSize,
        opacity: op,
        transform: [{ translateY: y }, { rotate }],
      }}
    >
      {emoji}
    </Animated.Text>
  );
}

// ─── Cart veggie that pops in and bobs ───────────────────────────────────────
function CartItem({ emoji, delay }) {
  const scale = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1, tension: 130, friction: 6, delay, useNativeDriver: true,
    }).start();
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bob, { toValue: -5, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(bob, { toValue: 0, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      ).start();
    }, delay + 500);
  }, []);

  return (
    <Animated.Text style={{ fontSize: 22, transform: [{ scale }, { translateY: bob }] }}>
      {emoji}
    </Animated.Text>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ReorderEmptyState() {
  // Cart slide-in from left (starts off-screen)
  const cartX = useRef(new Animated.Value(-ILLUS_W - 40)).current;
  const cartBob = useRef(new Animated.Value(0)).current;

  // Character
  const charBob = useRef(new Animated.Value(0)).current;
  const bagSwing = useRef(new Animated.Value(0)).current;

  // Logo
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoPulse = useRef(new Animated.Value(0.4)).current;
  const logoFloatY = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;

  // Items appearing below cart
  const item1op = useRef(new Animated.Value(0)).current;
  const item1y = useRef(new Animated.Value(20)).current;
  const item1bob = useRef(new Animated.Value(0)).current;

  const item2op = useRef(new Animated.Value(0)).current;
  const item2y = useRef(new Animated.Value(20)).current;
  const item2bob = useRef(new Animated.Value(0)).current;

  const item3op = useRef(new Animated.Value(0)).current;
  const item3y = useRef(new Animated.Value(20)).current;
  const item3bob = useRef(new Animated.Value(0)).current;

  // Text
  const textOp = useRef(new Animated.Value(0)).current;
  const textY = useRef(new Animated.Value(18)).current;

  const pop = (opRef, yRef, delay) => {
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(opRef, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(yRef, { toValue: 0, tension: 90, friction: 7, useNativeDriver: true }),
      ]).start();
    }, delay);
  };

  useEffect(() => {
    // Phase 1 — cart enters
    Animated.spring(cartX, {
      toValue: 0, tension: 26, friction: 7, delay: 300, useNativeDriver: true,
    }).start(() => {
      // Phase 2 — character celebrates
      Animated.loop(
        Animated.sequence([
          Animated.timing(charBob, { toValue: -9, duration: 380, useNativeDriver: true }),
          Animated.timing(charBob, { toValue: 0, duration: 380, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(bagSwing, { toValue: 1, duration: 560, useNativeDriver: true }),
          Animated.timing(bagSwing, { toValue: -1, duration: 560, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(cartBob, { toValue: -3, duration: 900, useNativeDriver: true }),
          Animated.timing(cartBob, { toValue: 0, duration: 900, useNativeDriver: true }),
        ])
      ).start();

      // Phase 3 — logo appears and floats
      Animated.sequence([
        Animated.delay(200),
        Animated.spring(logoScale, { toValue: 1, tension: 70, friction: 6, useNativeDriver: true }),
      ]).start(() => {
        // Continuous organic floating & slight rotate tilt
        Animated.loop(
          Animated.parallel([
            Animated.sequence([
              Animated.timing(logoFloatY, { toValue: -6, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(logoFloatY, { toValue: 6, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ]),
            Animated.sequence([
              Animated.timing(logoRotate, { toValue: -1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(logoRotate, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
          ])
        ).start();
      });

      Animated.loop(
        Animated.sequence([
          Animated.timing(logoPulse, { toValue: 1, duration: 1300, useNativeDriver: true }),
          Animated.timing(logoPulse, { toValue: 0.4, duration: 1300, useNativeDriver: true }),
        ])
      ).start();

      // Phase 4 — items land and start offset floating bobbing
      pop(item1op, item1y, 500);
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(item1bob, { toValue: -5, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(item1bob, { toValue: 2, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          ])
        ).start();
      }, 900);

      pop(item2op, item2y, 780);
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(item2bob, { toValue: -5, duration: 1450, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(item2bob, { toValue: 2, duration: 1450, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          ])
        ).start();
      }, 1200);

      pop(item3op, item3y, 1060);
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(item3bob, { toValue: -5, duration: 1320, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(item3bob, { toValue: 2, duration: 1320, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          ])
        ).start();
      }, 1500);

      // Phase 5 — text reveals
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(textOp, { toValue: 1, duration: 550, useNativeDriver: true }),
          Animated.spring(textY, { toValue: 0, tension: 55, friction: 8, useNativeDriver: true }),
        ]).start();
      }, 1600);
    });
  }, []);

  const bagRotate = bagSwing.interpolate({ inputRange: [-1, 1], outputRange: ['-12deg', '12deg'] });
  const logoRotation = logoRotate.interpolate({ inputRange: [-1, 1], outputRange: ['-3deg', '3deg'] });

  return (
    <View style={styles.root}>

      {/* ── Illustration box: fixed size, all absolutes scoped here ── */}
      <View style={styles.illustrationBox}>

        {/* Sky stripe */}
        <View style={styles.skyStripe} />

        {/* Clouds — absolute inside illustrationBox */}
        <Cloud top={6}  fontSize={26} duration={12000} startX={ILLUS_W * 0.05} />
        <Cloud top={14} fontSize={18} duration={18000} startX={ILLUS_W * 0.45} />
        <Cloud top={2}  fontSize={14} duration={15000} startX={ILLUS_W * 0.7} />

        {/* Floating veggies — left side */}
        <FloatingVeggie emoji="🍅" left={4}            top={65}  delay={900}  amp={11} dur={2500} />
        <FloatingVeggie emoji="🌿" left={8}            top={130} delay={1400} amp={14} dur={3100} />
        {/* Floating veggies — right side */}
        <FloatingVeggie emoji="🧅" left={ILLUS_W - 32} top={55}  delay={1100} amp={9}  dur={2800} />
        <FloatingVeggie emoji="🥕" left={ILLUS_W - 28} top={115} delay={1500} amp={12} dur={2200} />
        <FloatingVeggie emoji="🍋" left={ILLUS_W - 30} top={165} delay={1800} amp={8}  dur={2700} />
        <FloatingVeggie emoji="🥬" left={6}            top={180} delay={1200} amp={10} dur={2900} />

        {/* Cart + Character group — slides in as a unit */}
        <Animated.View
          style={[
            styles.cartGroup,
            { transform: [{ translateX: cartX }, { translateY: cartBob }] },
          ]}
        >
          {/* Delivery boy character */}
          <Animated.View style={[styles.character, { transform: [{ translateY: charBob }] }]}>
            {/* Cap with RB badge */}
            <View style={styles.capWrap}>
              <Text style={styles.capText}>🧢</Text>
              <View style={styles.rbBadge}><Text style={styles.rbBadgeText}>RB</Text></View>
            </View>
            {/* Face */}
            <Text style={styles.face}>😄</Text>
            {/* Uniform torso */}
            <View style={styles.torso}>
              <Text style={styles.torsoText}>Ram{'\n'}Bhaji</Text>
            </View>
            {/* Legs */}
            <Text style={styles.legs}>🦿</Text>
          </Animated.View>

          {/* Swinging shopping bag */}
          <Animated.View style={[styles.swingBag, { transform: [{ rotate: bagRotate }] }]}>
            <Text style={styles.swingBagText}>🛍️</Text>
          </Animated.View>

          {/* Vegetable cart */}
          <View style={styles.vegCart}>
            {/* Cart body */}
            <View style={styles.cartBody}>
              {/* Brand strip */}
              <View style={styles.cartBrand}>
                <Text style={styles.cartBrandText}>🟠 Ram Bhaji</Text>
              </View>
              {/* Veggies inside */}
              <View style={styles.cartItemsRow}>
                <CartItem emoji="🍅" delay={1100} />
                <CartItem emoji="🥦" delay={1300} />
                <CartItem emoji="🥕" delay={1500} />
                <CartItem emoji="🍌" delay={1700} />
                <CartItem emoji="💧" delay={1900} />
              </View>
            </View>
            {/* Wheels */}
            <View style={styles.wheelsRow}>
              <View style={styles.wheel} />
              <View style={styles.wheel} />
            </View>
          </View>
        </Animated.View>

        {/* Ram Bhaji Logo — appears after cart arrives and floats */}
        <Animated.View
          style={[
            styles.logoWrap,
            { 
              transform: [
                { scale: logoScale },
                { translateY: logoFloatY },
                { rotate: logoRotation }
              ],
              opacity: logoPulse.interpolate({ inputRange: [0.4, 1], outputRange: [0.85, 1.0] })
            },
          ]}
        >
          <View style={styles.logoBorder}>
            <Text style={styles.logoLeaf}>🌿</Text>
            <Text style={styles.logoName}>Ram Bhaji</Text>
            <Text style={styles.logoTagline}>ताज़ी सब्ज़ियाँ • रोज़</Text>
          </View>
        </Animated.View>

        {/* Unloaded items row — appear bottom-center with offset bobbing */}
        <View style={styles.unloadRow}>
          <Animated.View style={{ opacity: item1op, transform: [{ translateY: Animated.add(item1y, item1bob) }] }}>
            <View style={styles.unloadCard}>
              <Text style={styles.unloadEmoji}>🥗</Text>
              <Text style={styles.unloadLabel}>Veggies</Text>
            </View>
          </Animated.View>
          <Animated.View style={{ opacity: item2op, transform: [{ translateY: Animated.add(item2y, item2bob) }] }}>
            <View style={styles.unloadCard}>
              <Text style={styles.unloadEmoji}>🧺</Text>
              <Text style={styles.unloadLabel}>Grocery</Text>
            </View>
          </Animated.View>
          <Animated.View style={{ opacity: item3op, transform: [{ translateY: Animated.add(item3y, item3bob) }] }}>
            <View style={styles.unloadCard}>
              <Text style={styles.unloadEmoji}>💧</Text>
              <Text style={styles.unloadLabel}>Water</Text>
            </View>
          </Animated.View>
        </View>
      </View>

      {/* ── Text section — normal flow, not absolute ── */}
      <Animated.View style={[styles.textSection, { opacity: textOp, transform: [{ translateY: textY }] }]}>
        <Text style={styles.heading}>Reordering will be easy</Text>
        <Text style={styles.subtext}>
          Your previously ordered <Text style={styles.brand}>Ram Bhaji</Text> items{'\n'}will appear here for quick reordering.
        </Text>
        <View style={styles.pillRow}>
          <View style={styles.pill}><Text style={styles.pillText}>🍅 Fresh Daily</Text></View>
          <View style={styles.pill}><Text style={styles.pillText}>⚡ Quick Reorder</Text></View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#FFFDF7',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EDE5D8',
    marginHorizontal: 0,
    marginVertical: 6,
    shadowColor: '#E8750A',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    alignItems: 'center',
    paddingBottom: 18,
    overflow: 'hidden', // clips the slide-in cart cleanly
  },

  // ── Illustration box ──────────────────────────────────────────────────────
  illustrationBox: {
    width: ILLUS_W,
    height: ILLUS_H,
    // position:relative is default — absolute children are clipped to this box
    overflow: 'hidden',
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: '#F9F4EC',
    borderWidth: 1,
    borderColor: '#EDE5D8',
  },

  // Sky stripe at top of illustration
  skyStripe: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 50,
    backgroundColor: '#DFF0FF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },

  // ── Cart group (slides horizontally) ─────────────────────────────────────
  cartGroup: {
    position: 'absolute',
    bottom: 36,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },

  // Character
  character: { alignItems: 'center', marginBottom: 2 },
  capWrap: { position: 'relative', alignItems: 'center' },
  capText: { fontSize: 26 },
  rbBadge: {
    position: 'absolute',
    bottom: -1, right: -6,
    backgroundColor: '#E8750A',
    borderRadius: 5, paddingHorizontal: 3, paddingVertical: 1,
  },
  rbBadgeText: { fontSize: 6, color: '#fff', fontWeight: 'bold' },
  face: { fontSize: 28, marginTop: -2 },
  torso: {
    width: 36, height: 30,
    backgroundColor: '#E8750A', borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
    marginTop: 2,
  },
  torsoText: { fontSize: 6, color: '#fff', fontWeight: 'bold', textAlign: 'center', lineHeight: 8 },
  legs: { fontSize: 18, marginTop: 2 },

  // Swinging bag
  swingBag: { marginBottom: 8 },
  swingBagText: { fontSize: 32 },

  // Vegetable cart
  vegCart: { alignItems: 'center' },
  cartBody: {
    width: 105, minHeight: 72,
    backgroundColor: '#FFF8F0',
    borderRadius: 10,
    borderWidth: 2, borderColor: '#E8750A',
    padding: 6, alignItems: 'center',
  },
  cartBrand: { marginBottom: 4 },
  cartBrandText: { fontSize: 8, fontWeight: 'bold', color: '#E8750A', letterSpacing: 0.3 },
  cartItemsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, justifyContent: 'center' },
  wheelsRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    width: 80, marginTop: 4,
  },
  wheel: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#444', borderWidth: 2, borderColor: '#222',
  },

  // Logo — centered top area
  logoWrap: {
    position: 'absolute',
    top: 56,
    alignSelf: 'center',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  logoBorder: {
    backgroundColor: '#FFF8F0',
    borderWidth: 2, borderColor: '#E8750A',
    borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 8,
    alignItems: 'center',
    shadowColor: '#E8750A', shadowOpacity: 0.35, shadowRadius: 10, elevation: 4,
  },
  logoLeaf: { fontSize: 18, marginBottom: 2 },
  logoName: { fontSize: 16, fontWeight: 'bold', color: '#E8750A', letterSpacing: 0.4 },
  logoTagline: { fontSize: 9, color: '#9B6B3C', marginTop: 2, fontStyle: 'italic' },

  // Unloaded items row — absolute bottom
  unloadRow: {
    position: 'absolute',
    bottom: 4,
    left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  unloadCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: '#EDDED0',
    shadowColor: '#E8750A', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  unloadEmoji: { fontSize: 22 },
  unloadLabel: { fontSize: 9, color: '#9B6B3C', fontWeight: '600', marginTop: 2 },

  // ── Text section ──────────────────────────────────────────────────────────
  textSection: {
    width: ILLUS_W,
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 4,
  },
  heading: {
    fontSize: 17, fontWeight: '700', color: '#1C1C1C',
    textAlign: 'center', marginBottom: 7,
    letterSpacing: 0.2,
  },
  subtext: {
    fontSize: 13, color: '#666',
    textAlign: 'center', lineHeight: 20,
  },
  brand: { color: '#E8750A', fontWeight: '700' },
  pillRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  pill: {
    backgroundColor: '#FFF3E0', borderRadius: 20,
    paddingHorizontal: 13, paddingVertical: 6,
    borderWidth: 1, borderColor: '#F5C88A',
  },
  pillText: { fontSize: 11, color: '#E8750A', fontWeight: '600' },
});
