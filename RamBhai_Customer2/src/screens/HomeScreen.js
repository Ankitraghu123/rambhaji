/* eslint-disable react/no-unknown-property */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Canvas, useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import Screen from '../components/Screen';
import { addressBook, freshVeggies, quickActions, subscriptionPlans } from '../data/mockData';
import { useAppStore } from '../store/UseAppStore';
import { formatINR, resolveImageUrl } from '../utils/format';
import { packagesApi } from '../services/api/packages';

// ─── PALETTE ────────────────────────────────────────────────────────────────
const palette = {
  aqua: '#35BDF2',
  dDeep: '#1286D8',
  pink: '#E52DF3',
  pinkDeep: '#A61BDF',
  blue: '#3446F4',
  blueDeep: '#182BC4',
  ink: '#101026',
  inkSoft: '#4E5172',
  mist: '#F6FBFF',
  card: 'rgba(255,255,255,0.92)',
  line: 'rgba(53, 70, 244, 0.14)',
};

// ─── REAL VEGGIE / FRUIT IMAGES (Unsplash) ───────────────────────────────────
// These replace the mockData placeholders with beautiful real photos.
const FRESH_ITEMS = [
  {
    id: 'f1',
    label: 'Fresh Tomatoes',
    image: 'https://images.unsplash.com/photo-1546470427-e75a6a3ff39c?w=400&q=80&auto=format&fit=crop',
  },
  {
    id: 'f2',
    label: 'Gajar (Carrots)',
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80&auto=format&fit=crop',
  },
  {
    id: 'f3',
    label: 'Broccoli',
    image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400&q=80&auto=format&fit=crop',
  },
  {
    id: 'f4',
    label: 'Shimla Mirch',
    image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&q=80&auto=format&fit=crop',
  },
  {
    id: 'f5',
    label: 'Palak (Spinach)',
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80&auto=format&fit=crop',
  },
  {
    id: 'f6',
    label: 'Alphonso Mango',
    image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&q=80&auto=format&fit=crop',
  },
];

const brandLogo = require('../../assets/rambhaji01.png');
const heroImage = require('../../assets/ram-bhaji-hero.png');
const planLogos = {
  trial: require('../../assets/nanologo.png'),
  monthly: require('../../assets/silver.png'),
  quarterly: require('../../assets/goldlogo.png'),
  miracle: require('../../assets/miracleplan.png'),
};

const GRID_GAP = 12;
const quickRoutes = {
  plans: 'Plans',
  wallet: 'Wallet',
  retail: 'Retail',
  water: 'Water',
  support: 'Support',
  deliveries: 'Deliveries',
};

const quickPalette = {
  plans: ['#35BDF2', '#E52DF3'],
  wallet: ['#3446F4', '#35BDF2'],
  retail: ['#E52DF3', '#3446F4'],
  water: ['#35BDF2', '#3446F4'],
  support: ['#E52DF3', '#35BDF2'],
  deliveries: ['#3446F4', '#E52DF3'],
};

// ─── ANIMATION HOOKS ─────────────────────────────────────────────────────────
function useLoop(duration = 2600, delay = 0) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: 1,
          duration,
          delay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, duration, value]);
  return value;
}

function Reveal({ children, delay = 0, style }) {
  const intro = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(intro, {
      toValue: 1,
      delay,
      speed: 12,
      bounciness: 8,
      useNativeDriver: true,
    }).start();
  }, [delay, intro]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: intro,
          transform: [
            { translateY: intro.interpolate({ inputRange: [0, 1], outputRange: [22, 0] }) },
            { scale: intro.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

function NeonBlob({ color, style, delay = 0, duration = 3200 }) {
  const drift = useLoop(duration, delay);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        s.neonBlob,
        style,
        {
          backgroundColor: color,
          transform: [
            { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -12] }) },
            { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [0, 10] }) },
            { scale: drift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) },
          ],
        },
      ]}
    />
  );
}

function NeonStroke({ color, style, delay = 0 }) {
  const float = useLoop(1700, delay);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        s.stroke,
        style,
        {
          backgroundColor: color,
          transform: [
            { translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
            { rotate: float.interpolate({ inputRange: [0, 1], outputRange: ['-7deg', '8deg'] }) },
          ],
        },
      ]}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3-D VEGGIE & FRUIT ORBIT SCENE
//
// A broccoli-like icosahedron floats at the center. Around it orbit
// a tomato, a carrot, a lemon, a brinjal / eggplant and a red capsicum.
// Two torus rings (green vine + golden) frame the composition.
// White sparkle dots pulse freshness across the outer ring.
// Warm red, leaf-green and gold point lights give organic depth.
// ─────────────────────────────────────────────────────────────────────────────
function VeggieOrbitScene() {
  const rootGroup = useRef();
  const coreRef   = useRef();
  const tomatoRef = useRef();
  const carrotRef = useRef();
  const lemonRef  = useRef();
  const eggRef    = useRef();
  const capRef    = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Root: slow y-axis rotation + gentle vertical bob
    if (rootGroup.current) {
      rootGroup.current.rotation.y = t * 0.22;
      rootGroup.current.position.y = Math.sin(t * 0.8) * 0.09;
    }
    // Broccoli core: independent tumble
    if (coreRef.current) {
      coreRef.current.rotation.x = t * 0.35;
      coreRef.current.rotation.z = t * 0.2;
    }
    // Tomato: elliptical orbit + self-rotation
    if (tomatoRef.current) {
      tomatoRef.current.position.x = Math.sin(t * 0.9) * 1.35;
      tomatoRef.current.position.z = Math.cos(t * 0.9) * 0.86;
      tomatoRef.current.position.y = Math.sin(t * 1.3) * 0.22;
      tomatoRef.current.rotation.y = t * 1.4;
    }
    // Carrot: tilted orbit, opposite phase
    if (carrotRef.current) {
      carrotRef.current.position.x = Math.cos(t * 0.78 + 1) * 1.4;
      carrotRef.current.position.z = Math.sin(t * 0.78 + 1) * 0.9;
      carrotRef.current.position.y = Math.cos(t * 1.1) * 0.3;
      carrotRef.current.rotation.z = t * 0.6;
    }
    // Lemon: wide, high orbit
    if (lemonRef.current) {
      lemonRef.current.position.x = Math.sin(t * 0.65 + 2.5) * 1.5;
      lemonRef.current.position.z = Math.cos(t * 0.65 + 2.5) * 0.7;
      lemonRef.current.position.y = Math.sin(t * 0.9 + 1) * 0.25;
    }
    // Brinjal / eggplant: low, slower orbit
    if (eggRef.current) {
      eggRef.current.position.x = Math.cos(t * 0.55 + 4) * 1.32;
      eggRef.current.position.z = Math.sin(t * 0.55 + 4) * 1.0;
      eggRef.current.position.y = Math.cos(t * 0.75) * 0.28;
    }
    // Capsicum: deep rear orbit
    if (capRef.current) {
      capRef.current.position.x = Math.sin(t * 0.48 + 3.5) * 1.18;
      capRef.current.position.z = Math.cos(t * 0.48 + 3.5) * 1.25;
      capRef.current.position.y = Math.sin(t * 0.62 + 2) * 0.35;
    }
  });

  return (
    <group ref={rootGroup} rotation={[0.08, -0.3, -0.05]}>

      {/* ── BROCCOLI CORE ────────────────────────────────────────── */}
      <group ref={coreRef}>
        {/* Main head */}
        <mesh>
          <icosahedronGeometry args={[0.82, 1]} />
          <meshStandardMaterial
            color="#2ECC71"
            roughness={0.65}
            metalness={0.08}
            emissive="#0D4A1F"
            emissiveIntensity={0.3}
          />
        </mesh>
        {/* Floret bumps scattered over the surface */}
        {[
          [0.52,  0.68,  0.38],
          [-0.48, 0.62,  0.50],
          [0.28, -0.70,  0.42],
          [0.72,  0.20, -0.42],
          [-0.62,-0.38,  0.52],
          [0.00,  0.62, -0.52],
        ].map((pos, i) => (
          <mesh key={i} position={pos} scale={0.27}>
            <sphereGeometry args={[1, 14, 10]} />
            <meshStandardMaterial
              color="#1E8449"
              roughness={0.72}
              emissive="#0A3015"
              emissiveIntensity={0.25}
            />
          </mesh>
        ))}
      </group>

      {/* ── ORBITAL RINGS ────────────────────────────────────────── */}
      {/* Green vine ring */}
      <mesh rotation={[Math.PI / 2.2, 0.12, 0.08]}>
        <torusGeometry args={[1.58, 0.032, 12, 90]} />
        <meshStandardMaterial color="#27AE60" emissive="#1A5E2A" emissiveIntensity={0.42} />
      </mesh>
      {/* Golden / harvest ring */}
      <mesh rotation={[0.88, 0.12, 0.62]}>
        <torusGeometry args={[1.8, 0.024, 12, 90]} />
        <meshStandardMaterial
          color="#F39C12"
          emissive="#7D5000"
          emissiveIntensity={0.38}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* ── TOMATO ───────────────────────────────────────────────── */}
      {/* starts at position [1.3, 0.25, 0] then orbits via useFrame */}
      <group ref={tomatoRef} position={[1.3, 0.25, 0]}>
        {/* Red body */}
        <mesh scale={0.37}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshStandardMaterial
            color="#E74C3C"
            roughness={0.28}
            metalness={0.14}
            emissive="#7B0000"
            emissiveIntensity={0.22}
          />
        </mesh>
        {/* Stem */}
        <mesh position={[0, 0.4, 0]} scale={[0.042, 0.13, 0.042]}>
          <cylinderGeometry args={[1, 1.2, 1, 8]} />
          <meshStandardMaterial color="#1E8449" />
        </mesh>
        {/* Crown leaflets */}
        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            position={[Math.sin(i * 2.09) * 0.12, 0.36, Math.cos(i * 2.09) * 0.12]}
            rotation={[0.5, i * 2.09, 0.2]}
            scale={[0.13, 0.06, 0.05]}
          >
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial color="#27AE60" />
          </mesh>
        ))}
      </group>

      {/* ── CARROT ───────────────────────────────────────────────── */}
      <group ref={carrotRef} position={[-1.3, 0.3, 0]}>
        {/* Orange cone body (tip points down) */}
        <mesh rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.15, 0.54, 16]} />
          <meshStandardMaterial
            color="#E67E22"
            roughness={0.46}
            metalness={0.06}
            emissive="#7D3C00"
            emissiveIntensity={0.2}
          />
        </mesh>
        {/* Green tops as elongated spheres */}
        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            position={[Math.sin(i * 2.09) * 0.09, 0.22 + i * 0.04, Math.cos(i * 2.09) * 0.09]}
            rotation={[0.28 + i * 0.1, i * 2.09, 0]}
            scale={[0.04, 0.26, 0.04]}
          >
            <sphereGeometry args={[1, 8, 8]} />
            <meshStandardMaterial color="#27AE60" />
          </mesh>
        ))}
      </group>

      {/* ── LEMON ────────────────────────────────────────────────── */}
      <group ref={lemonRef} position={[0.35, 1.22, 0.5]}>
        {/* Oblong yellow sphere */}
        <mesh scale={[0.26, 0.32, 0.26]}>
          <sphereGeometry args={[1, 20, 20]} />
          <meshStandardMaterial
            color="#F4D03F"
            roughness={0.38}
            metalness={0.09}
            emissive="#806600"
            emissiveIntensity={0.18}
          />
        </mesh>
      </group>

      {/* ── BRINJAL / EGGPLANT ───────────────────────────────────── */}
      <mesh ref={eggRef} position={[0.5, -1.25, 0.32]} scale={[0.2, 0.32, 0.2]}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial
          color="#8E44AD"
          roughness={0.32}
          metalness={0.16}
          emissive="#3D0066"
          emissiveIntensity={0.28}
        />
      </mesh>

      {/* ── RED CAPSICUM / BELL PEPPER ───────────────────────────── */}
      <group ref={capRef} position={[-0.6, -0.8, -1.0]}>
        {/* Lobed body - slightly wider than tall */}
        <mesh scale={[0.28, 0.3, 0.28]}>
          <sphereGeometry args={[1, 20, 20]} />
          <meshStandardMaterial
            color="#C0392B"
            roughness={0.3}
            metalness={0.12}
            emissive="#5C0A00"
            emissiveIntensity={0.22}
          />
        </mesh>
        {/* Stem */}
        <mesh position={[0, 0.33, 0]} scale={[0.04, 0.1, 0.04]}>
          <cylinderGeometry args={[1, 1, 1, 8]} />
          <meshStandardMaterial color="#1E8449" />
        </mesh>
      </group>

      {/* ── FRESHNESS SPARKLE DOTS ───────────────────────────────── */}
      {/* 8 tiny glowing spheres evenly spaced on the outer ring */}
      {[...Array(8)].map((_, i) => (
        <mesh
          key={`sp${i}`}
          position={[
            Math.sin((i * Math.PI * 2) / 8) * (1.9 + Math.sin(i * 0.5) * 0.3),
            Math.cos(i * 0.85) * 0.45,
            Math.cos((i * Math.PI * 2) / 8) * (1.42 + Math.cos(i * 0.5) * 0.2),
          ]}
          scale={0.055}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#FFFFFF"
            emissiveIntensity={2.5}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
    </group>
  );
}

function Hero3D() {
  return (
    <View pointerEvents="none" style={s.hero3d}>
      <Canvas
        style={s.canvas}
        camera={{ position: [0, 0, 5.1], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
        onCreated={({ gl }) => gl.setClearColor('#000000', 0)}
      >
        {/* Slightly green-tinted ambient for organic feel */}
        <ambientLight intensity={0.9} color="#E8FFE8" />
        {/* Main key light */}
        <directionalLight position={[3, 3.2, 4.2]} intensity={1.9} />
        {/* Warm red fill — makes tomato / capsicum glow */}
        <pointLight position={[-2, 1.4, 3.4]} intensity={1.3} color="#FF6B6B" />
        {/* Leaf-green rim — lifts the broccoli and carrot tops */}
        <pointLight position={[2, -1.6, 2.6]} intensity={1.1} color="#90EE90" />
        {/* Warm golden top light — harvest warmth */}
        <pointLight position={[0, 2.5, -1.5]} intensity={0.75} color="#FFD700" />
        <VeggieOrbitScene />
      </Canvas>
    </View>
  );
}

// ─── UI COMPONENTS ────────────────────────────────────────────────────────────
function IconButton({ icon, onPress }) {
  const press = useRef(new Animated.Value(0)).current;
  const pressIn  = () => Animated.spring(press, { toValue: 1, speed: 26, bounciness: 6,  useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(press, { toValue: 0, speed: 20, bounciness: 9,  useNativeDriver: true }).start();
  return (
    <Animated.View style={{ transform: [{ scale: press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.92] }) }] }}>
      <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={s.iconButton}>
        <MaterialCommunityIcons name={icon} size={21} color={palette.blue} />
      </Pressable>
    </Animated.View>
  );
}

function ActionTile({ item, index, width, onPress }) {
  const press  = useRef(new Animated.Value(0)).current;
  const float  = useLoop(1900 + index * 90, index * 80);
  const colors = quickPalette[item.key] || [palette.aqua, palette.blue];
  const pressIn  = () => Animated.spring(press, { toValue: 1, speed: 26, bounciness: 5, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(press, { toValue: 0, speed: 18, bounciness: 8, useNativeDriver: true }).start();
  return (
    <Reveal delay={120 + index * 45} style={{ width }}>
      <Animated.View
        style={[
          s.actionShadow,
          {
            transform: [
              { perspective: 700 },
              { translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) },
              { rotateX: press.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '8deg'] }) },
              { rotateY: press.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-7deg'] }) },
              { scale:   press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.96] }) },
            ],
          },
        ]}
      >
        <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={s.actionCard}>
          <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.actionIcon}>
            <MaterialCommunityIcons name={item.icon} size={22} color="#FFFFFF" />
          </LinearGradient>
          <Text style={s.actionText} numberOfLines={2}>{item.label}</Text>
          <View style={[s.actionDot, { backgroundColor: colors[0] }]} />
        </Pressable>
      </Animated.View>
    </Reveal>
  );
}

function PaletteSwatch({ color, label }) {
  return (
    <View style={s.swatchItem}>
      <View style={[s.swatch, { backgroundColor: color }]} />
      <Text style={s.swatchLabel}>{label}</Text>
    </View>
  );
}

function PlanCard({ plan, index, onPress }) {
  const colors = index % 2 === 0 ? [palette.aqua, palette.blue] : [palette.pink, palette.blue];
  return (
    <Reveal delay={220 + index * 80} style={s.planReveal}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [s.planCard, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}
      >
        <LinearGradient colors={['#FFFFFF', '#F2F8FF']} style={s.planInner}>
          <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.planBadge}>
            <Text style={s.planBadgeText}>{plan.type || 'Standard'}</Text>
          </LinearGradient>
          <View style={s.planLogoWrap}>
            {plan.image_url ? (
              <Image source={{ uri: resolveImageUrl(plan.image_url) }} style={s.planLogo} contentFit="contain" transition={300} />
            ) : (
              <View style={[s.planLogo, { alignItems: 'center', justifyContent: 'center' }]}>
                <MaterialCommunityIcons name="leaf-circle" size={36} color={palette.dDeep} />
              </View>
            )}
          </View>
          <Text style={s.planFrequency}>{plan.name}</Text>
          <Text style={s.planPrice}>{formatINR(plan.price)}</Text>
          <Text style={s.planMeta} numberOfLines={2}>{plan.services_per_month} deliveries / mo | For {plan.num_persons} {plan.num_persons > 1 ? 'persons' : 'person'}</Text>
        </LinearGradient>
      </Pressable>
    </Reveal>
  );
}

function StatCard({ icon, label, value, color, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.statCard, { transform: [{ scale: pressed ? 0.985 : 1 }] }]}
    >
      <View style={[s.statIcon, { backgroundColor: `${color}18` }]}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValue} numberOfLines={1}>{value}</Text>
    </Pressable>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const walletBalance = useAppStore((state) => state.walletBalance);
  const user = useAppStore((state) => state.user) || {};
  const { width }     = useWindowDimensions();
  const tabBarHeight  = useBottomTabBarHeight(); // 👈 real footer nav height, includes safe-area inset
  const [gridWidth, setGridWidth] = useState(width - 32);
  const pulse = useLoop(2100, 0);

  const [packages, setPackages] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [retailProducts, setRetailProducts] = useState([]);
  
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await packagesApi.getPackages();
        if (res.success && res.packages) {
          setPackages(res.packages);
        }
      } catch (error) {
        console.log('Error fetching packages in Home:', error);
      }
    };
    fetchPackages();

    const { addressesApi } = require('../services/api/addresses');
    addressesApi.getAddresses().then(res => {
      if (res.success && res.addresses && res.addresses.length > 0) {
        const defaultAddr = res.addresses.find(a => a.is_default) || res.addresses[0];
        setSelectedAddress(defaultAddr);
      }
    }).catch(e => console.warn('Fetch addresses failed in Home', e));
    const { walletApi } = require('../services/api/wallet');
    walletApi.getWalletBalance().then(res => {
      if (res.success) {
        useAppStore.getState().setWallet(res.wallet_balance, res.due_amount);
      }
    }).catch(e => console.warn('Fetch wallet failed', e));

    const { subscriptionsApi } = require('../services/api/subscriptions');
    subscriptionsApi.getMySubscriptions().then(res => {
      if (res.success && res.subscriptions && res.subscriptions.length > 0) {
        const active = res.subscriptions.find(s => s.status === 'active' || !s.start_date) || res.subscriptions[0];
        setActiveSubscription(active);
      }
    }).catch(e => console.warn('Fetch subscriptions failed in Home', e));

    const { productsApi } = require('../services/api/products');
    productsApi.getAllProducts().then(res => {
      const list = res.products || res.data || [];
      if (res.success && list.length > 0) {
        const mapped = list.slice(0, 6).map(p => ({
          id: p.id.toString(),
          label: p.name,
          image: resolveImageUrl(p.image_url || p.image) || 'https://via.placeholder.com/400'
        }));
        setRetailProducts(mapped);
      }
    }).catch(e => console.warn('Fetch retail products failed in Home', e));
  }, []);

  const heroPlan        = packages.length > 0 ? packages[0] : null;
  const visiblePlans    = packages.slice(0, 4);

  // Use real products from API exclusively
  const visibleVeggies = retailProducts;

  const homeQuickActions = useMemo(
    () => [...quickActions, { key: 'deliveries', label: 'Deliveries', icon: 'truck-delivery-outline' }],
    []
  );

  const onGridLayout = useCallback((event) => {
    const nextWidth = event.nativeEvent.layout.width;
    if (nextWidth > 0) setGridWidth(nextWidth);
  }, []);

  const tileWidth = Math.floor((gridWidth - GRID_GAP * 2) / 3);

  return (
    <Screen style={s.screen}>
      {/* ── BACKGROUND BLOBS ── */}
  <View style={s.backgroundLayer} pointerEvents="none">
     <NeonBlob color={palette.aqua} style={s.blobTop} />
        <NeonBlob color={palette.pink} style={s.blobMid}    delay={240} />
        <NeonBlob color={palette.blue} style={s.blobBottom} delay={480} />
      </View>

      {/* ── HEADER ── */}
      <Reveal>
        <View style={s.header}>
          <View style={s.brandBlock}>
            <View style={s.logoShell}>
              <Image source={brandLogo} style={s.logo} contentFit="contain" />
            </View>
            <View style={s.headerCopy}>
              <Text style={s.eyebrow}>Ram Bhaji</Text>
              <Text style={s.greeting} numberOfLines={1}>Namaste, {user.name ? user.name.trim().split(' ')[0] : 'Customer'}</Text>
            </View>
          </View>
          {/* <View style={s.iconButton}>
            <MaterialCommunityIcons name="bell-outline" size={24} color={palette.blue} />
          </View> */}
        </View>
      </Reveal>

      {/* ── ADDRESS CARD ── */}
      <Reveal delay={120}>
        <Pressable
          onPress={() => navigation.navigate('Address')}
          style={({ pressed }) => [s.addressCard, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}
        >
          <MaterialCommunityIcons name="map-marker-radius" size={24} color={palette.pink} />
          <View style={s.fill}>
            <Text style={s.addressLabel}>Delivering to</Text>
            <Text style={s.addressText} numberOfLines={1}>
              {selectedAddress ? `${selectedAddress.city || 'Bhopal'}, ${selectedAddress.pincode || ''}`.replace(/,\s*$/, '') : 'Bhopal, Madhya Pradesh'}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={palette.blue} />
        </Pressable>
      </Reveal>

      {/* ── HERO CARD ── */}
      <Reveal delay={240}>
        <View style={s.hero}>
          <View style={s.heroVeil} />
          
          {/* <View style={[s.stroke, s.strokeAqua, { backgroundColor: palette.aqua }]} /> */}
          <View style={[s.stroke, s.strokePink, { backgroundColor: palette.pink }]} />
          <View style={[s.stroke, s.strokeBlue, { backgroundColor: palette.blue }]} />
          
          <Hero3D />

          <View style={s.heroContent}>
            <View style={s.livePill}>
              <Animated.View style={[s.liveDot, { opacity: pulse }]} />
              <Text style={s.liveText}>LIVE SUBSCRIPTION</Text>
            </View>
            
            <Text style={s.heroTitle}>
              Fresh plans in electric color.
            </Text>
            
            <Text style={s.heroSubtitle}>
              Manage vegetables, water, wallet and deliveries from one polished dashboard.
            </Text>

            <View style={s.heroActions}>
              <Pressable
                onPress={() => navigation.navigate('Plans')}
                style={({ pressed }) => [s.primaryCta, { opacity: pressed ? 0.82 : 1 }]}
              >
                <Text style={s.primaryCtaText}>Explore Plans</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" />
              </Pressable>
              
              <Pressable
                onPress={() => navigation.navigate('Retail')}
                style={({ pressed }) => [s.secondaryCta, { opacity: pressed ? 0.82 : 1 }]}
              >
                <MaterialCommunityIcons name="basket-outline" size={18} color="#FFFFFF" />
              </Pressable>
              
              {/* The blue horizontal bar decorative element next to basket in original design */}
              <View style={{ flex: 1, height: 48, backgroundColor: palette.blue, borderRadius: 16, opacity: 0.9 }} />
            </View>
          </View>
        </View>
      </Reveal>

      {/* ── QUICK ACTIONS ── */}
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Quick Actions</Text>
        {/* <Text style={s.sectionHint}>Tap to manage</Text> */}
      </View>
      <View style={s.actionGrid} onLayout={onGridLayout}>
        {homeQuickActions.map((item, index) => (
          <ActionTile
            key={item.key}
            item={item}
            index={index}
            width={tileWidth}
            onPress={() => navigation.navigate(quickRoutes[item.key])}
          />
        ))}
      </View>

      {/* ── FEATURED PLANS ── */}
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Featured Plans</Text>
        <Pressable onPress={() => navigation.navigate('Plans')} hitSlop={8}>
          <Text style={s.sectionAction}>View all</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.planScroller}
      >
        {visiblePlans.map((plan, index) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            index={index}
            onPress={() => navigation.navigate('PlanDetail', { planId: plan.id })}
          />
        ))}
      </ScrollView>

      {/* ── STATS ── */}
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Today At A Glance</Text>
        <Text style={s.sectionHint}>Ready for action</Text>
      </View>
      <View style={s.statsGrid}>
        <StatCard
          icon="wallet-outline"
          label="Wallet"
          value={formatINR(walletBalance)}
          color={palette.blue}
          onPress={() => navigation.navigate('Wallet')}
        />
        <StatCard
          icon="truck-fast-outline"
          label="Next delivery"
          value="Today"
          color={palette.pink}
          onPress={() => navigation.navigate('Deliveries')}
        />
        <StatCard
          icon="leaf-circle-outline"
          label="Active plan"
          value={activeSubscription ? (activeSubscription.Package?.name || 'Active') : 'No active plan'}
          color={palette.dDeep}
          onPress={() => {
            if (activeSubscription) {
              navigation.navigate('MySubscriptions');
            } else {
              navigation.navigate('Plans');
            }
          }}
        />
      </View>

      {/* ── FRESH ADD-ONS (real veggie/fruit photos) ── */}
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Fresh Add-ons</Text>
        <Pressable onPress={() => navigation.navigate('Retail')} hitSlop={8}>
          <Text style={s.sectionAction}>Shop</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.veggieScroller}
      >
        {visibleVeggies.map((item, index) => (
          <Reveal key={item.id} delay={300 + index * 50}>
            <Pressable
              onPress={() => navigation.navigate('Retail')}
              style={({ pressed }) => [s.veggieChip, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
            >
              <Image
                source={{ uri: item.image }}
                style={s.veggieImage}
                contentFit="cover"
                // expo-image caches by default — no extra setup needed
              />
              <LinearGradient
                colors={['rgba(16,16,38,0)', 'rgba(16,16,38,0.72)']}
                style={s.veggieShade}
              />
              <Text style={s.veggieText} numberOfLines={1}>{item.label}</Text>
            </Pressable>
          </Reveal>
        ))}
      </ScrollView>
    </Screen>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: {
    paddingBottom: 34,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  neonBlob: {
    position: 'absolute',
    opacity: 0.18,
  },
  blobTop: {
    width: 190,
    height: 190,
    borderRadius: 95,
    right: -92,
    top: -60,
  },
  blobMid: {
    width: 180,
    height: 180,
    borderRadius: 90,
    left: -100,
    top: 340,
  },
  blobBottom: {
    width: 230,
    height: 230,
    borderRadius: 115,
    right: -126,
    bottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  brandBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingRight: 12,
  },
  logoShell: {
    width: 80,
    height: 74,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: palette.line,
    shadowColor: palette.blue,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 5,
  },
  logo: {
    width: 73,
    height: 66,
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    color: palette.blue,
    fontSize: 30,
    fontWeight: '800',
    fontFamily: 'Copperplate',
    textTransform: 'uppercase',
  },
  greeting: {
    color: '#74798eff',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: palette.line,
    shadowColor: palette.blue,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 15,
    elevation: 4,
  },
  addressCard: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderRadius: 18,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.line,
  },
  fill: {
    flex: 1,
  },
  addressLabel: {
    color: palette.inkSoft,
    fontSize: 11,
    fontWeight: '800',
  },
  addressText: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  hero: {
    minHeight: 284,
    borderRadius: 26,
    overflow: 'hidden',
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: palette.blue,
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.28,
    shadowRadius: 30,
    elevation: 8,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.15,
  },
  heroVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0c194dff', // Darker purple
  },
  stroke: {
    position: 'absolute',
    height: 24,
    borderRadius: 999,
    opacity: 0.92,
  },
  strokeAqua: {
    width: 168,
    top: 30,
    left: -18,
  },
  strokePink: {
    width: 138,
    right: 20,
    top: 118,
  },
  strokeBlue: {
    width: 152,
    right: -28,
    bottom: 38,
  },
  hero3d: {
    position: 'absolute',
    right: -18,
    top: 42,
    width: 184,
    height: 184,
  },
  canvas: {
    flex: 1,
  },
  heroContent: {
    position: 'relative',
    zIndex: 2,
    maxWidth: 232,
    paddingTop: 2,
    paddingRight: 30,
  },
  livePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    minHeight: 30,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.aqua,
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 33,
    lineHeight: 37,
    fontWeight: '900',
    marginTop: 18,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    marginTop: 10,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 17,
  },
  primaryCta: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: palette.pink,
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryCta: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  paletteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    marginBottom: 18,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: palette.line,
  },
  swatchItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  swatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  swatchLabel: {
    color: palette.inkSoft,
    fontSize: 12,
    fontWeight: '900',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    color: palette.ink,
    fontSize: 19,
    fontWeight: '900',
  },
  sectionHint: {
    color: palette.inkSoft,
    fontSize: 12,
    fontWeight: '800',
  },
  sectionAction: {
    color: palette.blue,
    fontSize: 13,
    fontWeight: '900',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    marginBottom: 14,
  },
  actionShadow: {
    shadowColor: palette.blue,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
  },
  actionCard: {
    height: 108,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 8,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: palette.line,
    overflow: 'hidden',
  },
  actionIcon: {
    width: 45,
    height: 45,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: palette.ink,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  actionDot: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    right: -24,
    top: -20,
    opacity: 0.18,
  },
  planScroller: {
    gap: 12,
    paddingRight: 18,
    paddingBottom: 8,
  },
  planReveal: {
    width: 174,
  },
  planCard: {
    height: 210,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: palette.blue,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 5,
  },
  planInner: {
    flex: 1,
    padding: 13,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 22,
  },
  planBadge: {
    alignSelf: 'flex-start',
    minHeight: 25,
    paddingHorizontal: 9,
    borderRadius: 999,
    justifyContent: 'center',
  },
  planBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  planLogoWrap: {
    width: 74,
    height: 74,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: palette.line,
  },
  planLogo: {
    width: 64,
    height: 64,
  },
  planFrequency: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 12,
  },
  planPrice: {
    color: palette.blue,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 4,
  },
  planMeta: {
    color: palette.inkSoft,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    minHeight: 120,
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: palette.line,
    justifyContent: 'space-between',
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    color: palette.inkSoft,
    fontSize: 11,
    fontWeight: '900',
    marginTop: 10,
  },
  statValue: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 3,
  },
  veggieScroller: {
    gap: 12,
    paddingRight: 18,
    paddingBottom: 20,
  },
  veggieChip: {
    width: 136,
    height: 116,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: palette.ink,
  },
  veggieImage: {
    width: '100%',
    height: '100%',
  },
  veggieShade: {
    ...StyleSheet.absoluteFillObject,
  },
  veggieText: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 10,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
});
