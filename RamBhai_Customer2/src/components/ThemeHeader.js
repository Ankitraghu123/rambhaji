/* eslint-disable react/no-unknown-property */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Canvas, useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import { homePalette } from '../constants/theme';

function usePulse(duration = 1900, delay = 0) {
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

function OrbitHarvest() {
  const group = useRef();
  const tomato = useRef();
  const lime = useRef();
  const water = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.75) * 0.34;
      group.current.rotation.x = Math.sin(t * 0.48) * 0.08;
      group.current.position.y = Math.sin(t * 1.1) * 0.08;
    }
    if (tomato.current) tomato.current.rotation.y += 0.018;
    if (lime.current) lime.current.rotation.x += 0.016;
    if (water.current) water.current.position.y = 0.68 + Math.sin(t * 1.6) * 0.08;
  });

  return (
    <group ref={group} position={[0, -0.08, 0]} rotation={[0.1, -0.18, 0]}>
      <mesh scale={[0.94, 1.18, 0.88]} rotation={[0.06, -0.16, -0.12]}>
        <sphereGeometry args={[1, 42, 42]} />
        <meshStandardMaterial color="#F5A92F" roughness={0.42} metalness={0.04} />
      </mesh>
      <mesh position={[0, 1.18, 0]} rotation={[0.18, 0, 0.15]}>
        <cylinderGeometry args={[0.05, 0.08, 0.42, 18]} />
        <meshStandardMaterial color="#70411E" roughness={0.64} />
      </mesh>
      <mesh position={[-0.32, 1.18, 0.02]} scale={[0.48, 0.16, 0.07]} rotation={[0.18, 0.04, -0.56]}>
        <sphereGeometry args={[1, 24, 14]} />
        <meshStandardMaterial color="#39A86B" roughness={0.5} />
      </mesh>
      <mesh position={[0.32, 1.12, 0.02]} scale={[0.54, 0.17, 0.07]} rotation={[0.12, 0.03, 0.56]}>
        <sphereGeometry args={[1, 24, 14]} />
        <meshStandardMaterial color="#20894C" roughness={0.5} />
      </mesh>

      <group ref={tomato} position={[1.12, 0.08, -0.32]} scale={0.32}>
        <mesh>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#EF4A3A" roughness={0.48} />
        </mesh>
        <mesh position={[0, 0.96, 0]} scale={[0.44, 0.12, 0.05]} rotation={[0, 0, 0.75]}>
          <sphereGeometry args={[1, 18, 10]} />
          <meshStandardMaterial color="#2F8A3F" roughness={0.5} />
        </mesh>
      </group>

      <group ref={lime} position={[-1.08, -0.76, -0.2]} scale={0.28}>
        <mesh>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#84C947" roughness={0.45} />
        </mesh>
        <mesh position={[-0.24, 0.28, 0.82]} scale={[0.24, 0.36, 0.03]} rotation={[0.2, 0, -0.25]}>
          <sphereGeometry args={[1, 18, 10]} />
          <meshStandardMaterial color="#DDF3A2" transparent opacity={0.54} roughness={0.3} />
        </mesh>
      </group>

      <group ref={water} position={[-0.96, 0.68, -0.42]} scale={0.28} rotation={[0, 0, -0.1]}>
        <mesh position={[0, -0.1, 0]} scale={[0.68, 0.78, 0.52]}>
          <sphereGeometry args={[1, 28, 28]} />
          <meshStandardMaterial color="#31E7D8" roughness={0.18} metalness={0.06} transparent opacity={0.88} />
        </mesh>
        <mesh position={[0, 0.62, 0]} rotation={[0, 0, Math.PI]} scale={[0.68, 1, 0.54]}>
          <coneGeometry args={[1, 1.28, 28]} />
          <meshStandardMaterial color="#177CFF" roughness={0.2} metalness={0.04} transparent opacity={0.9} />
        </mesh>
      </group>
    </group>
  );
}

function MiniScene() {
  return (
    <View pointerEvents="none" style={styles.scene}>
      <Canvas
        style={styles.canvas}
        camera={{ position: [0, 0, 5.4], fov: 38 }}
        dpr={[1, 1.35]}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => gl.setClearColor(new THREE.Color('#000000'), 0)}
      >
        <ambientLight intensity={1.1} />
        <directionalLight position={[2.4, 3.4, 4.8]} intensity={2.2} />
        <pointLight position={[-2.2, 1.1, 2.8]} intensity={0.75} color="#31E7D8" />
        <OrbitHarvest />
      </Canvas>
    </View>
  );
}

export default function ThemeHeader({
  title,
  subtitle,
  icon = 'leaf',
  badge = 'Live',
  actionLabel,
  onAction,
  compact = false,
}) {
  const enter = useRef(new Animated.Value(0)).current;
  const pulse = usePulse(1800);

  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1,
      speed: 12,
      bounciness: 7,
      useNativeDriver: true,
    }).start();
  }, [enter]);

  return (
    <Animated.View
      style={[
        styles.wrap,
        compact && styles.compact,
        {
          opacity: enter,
          transform: [
            {
              translateY: enter.interpolate({
                inputRange: [0, 1],
                outputRange: [18, 0],
              }),
            },
            {
              rotateX: enter.interpolate({
                inputRange: [0, 1],
                outputRange: ['8deg', '0deg'],
              }),
            },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={[homePalette.night, '#14207A', '#31107B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.glowA} />
      <View pointerEvents="none" style={styles.glowB} />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.stroke,
          styles.strokeA,
          {
            transform: [
              {
                translateX: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-8, 14],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.stroke,
          styles.strokeB,
          {
            transform: [
              {
                translateX: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [12, -10],
                }),
              },
            ],
          },
        ]}
      />
      <MiniScene />

      <View style={styles.copy}>
        <View style={styles.badge}>
          <Animated.View
            style={[
              styles.badgeDot,
              {
                transform: [
                  {
                    scale: pulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.45],
                    }),
                  },
                ],
              },
            ]}
          />
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {!!actionLabel && (
          <Pressable
            onPress={onAction}
            style={({ pressed }) => [styles.action, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
          >
            <MaterialCommunityIcons name={icon} size={18} color="#FFFFFF" />
            <Text style={styles.actionText}>{actionLabel}</Text>
            <MaterialCommunityIcons name="arrow-right" size={17} color="#FFFFFF" />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 208,
    borderRadius: 26,
    overflow: 'hidden',
    marginBottom: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    shadowColor: homePalette.blue,
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.24,
    shadowRadius: 28,
    elevation: 8,
  },
  compact: {
    minHeight: 176,
  },
  copy: {
    position: 'relative',
    zIndex: 3,
    maxWidth: 236,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: homePalette.aqua,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
    marginTop: 16,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    marginTop: 8,
  },
  action: {
    alignSelf: 'flex-start',
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: homePalette.pink,
    marginTop: 14,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  scene: {
    position: 'absolute',
    right: -20,
    top: 22,
    width: 172,
    height: 172,
    zIndex: 2,
  },
  canvas: {
    flex: 1,
  },
  glowA: {
    position: 'absolute',
    right: -70,
    top: -64,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(49,231,216,0.26)',
  },
  glowB: {
    position: 'absolute',
    left: -84,
    bottom: -92,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(244,63,143,0.2)',
  },
  stroke: {
    position: 'absolute',
    height: 22,
    borderRadius: 999,
    opacity: 0.9,
  },
  strokeA: {
    width: 142,
    left: -20,
    top: 28,
    backgroundColor: homePalette.aqua,
  },
  strokeB: {
    width: 126,
    right: 26,
    bottom: 34,
    backgroundColor: homePalette.pink,
  },
});
