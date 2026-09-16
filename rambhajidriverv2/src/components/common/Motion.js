// src/components/common/Motion.js
// High-performance reusable micro-animation components for GharTak app UI.
// Uses native driver for 60 FPS transitions.

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, TouchableWithoutFeedback, View, StyleSheet, Text, Dimensions,
  PanResponder, Pressable, Easing, Image, TouchableOpacity, TextInput, Vibration
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

export function triggerHaptic(type = 'light') {
  try {
    switch (type) {
      case 'light':
      case 'soft':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
      case 'rigid':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'selection':
      case 'tick':
        Haptics.selectionAsync();
        break;
      case 'success':
      case 'notificationSuccess':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
      case 'notificationWarning':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
      case 'notificationError':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      default:
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch (err) {
    try {
      if (type === 'error' || type === 'notificationError') {
        Vibration.vibrate([0, 50, 50, 100]);
      } else if (type === 'success' || type === 'notificationSuccess') {
        Vibration.vibrate([0, 30, 40, 30]);
      } else {
        Vibration.vibrate(30);
      }
    } catch (ve) {}
  }
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * A soft, glowing, pulsing dot indicating active status or live logs.
 */
function _PulsingDot({ color = '#22C55E', size = 8, style }) {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
}

/**
 * AnimatedCard: Fades in and slides up from bottom with a staggered delay.
 */
function _AnimatedCard({ children, delay = 0, style }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 550,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 35,
        friction: 7,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, delay]);

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

/**
 * AnimatedPressable: Physical bouncy feedback on button press.
 * Scales down slightly on touch start and springs back on release.
 */
function _AnimatedPressable({ children, onPress, style, disabled, hapticType = 'light' }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rippleScale = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;
  const [rippleCoords, setRippleCoords] = useState({ x: 0, y: 0 });

  const onPressIn = (e) => {
    if (disabled) return;
    triggerHaptic(hapticType);
    Animated.timing(scaleAnim, {
      toValue: 0.96,
      duration: 100,
      useNativeDriver: true,
    }).start();

    const { locationX, locationY } = e.nativeEvent;
    setRippleCoords({ x: locationX || 0, y: locationY || 0 });
    
    rippleScale.setValue(0);
    rippleOpacity.setValue(0.3);
    
    Animated.parallel([
      Animated.timing(rippleScale, {
        toValue: 3.5,
        duration: 320,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(rippleOpacity, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      })
    ]).start();
  };

  const onPressOut = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 200,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      style={[
        style,
        { overflow: 'hidden', position: 'relative' }
      ]}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: rippleCoords.y - 20,
            left: rippleCoords.x - 20,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(0, 0, 0, 0.08)',
            transform: [{ scale: rippleScale }],
            opacity: rippleOpacity,
            pointerEvents: 'none',
          }
        ]}
      />
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          width: '100%',
        }}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

/**
 * SlideInSheet: Slide-up animation for custom bottom sheet components.
 */
export function SlideInSheet({ children, visible, duration = 300, style }) {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: duration * 0.8,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: duration * 0.8,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: duration,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim, duration]);

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

/**
 * Shimmer: Animates a diagonal light reflection band across a background placeholder view.
 */
function _Shimmer({ style }) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  return (
    <View style={[styles.shimmerContainer, style]}>
      <Animated.View
        style={[
          styles.shimmerBand,
          {
            transform: [{ translateX }, { skewX: '-20deg' }],
          },
        ]}
      />
    </View>
  );
}

/**
 * SkeletonCard: Shimmering placeholders block representing a loading list item.
 */
function _SkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonRow}>
        <Shimmer style={styles.skeletonCircle} />
        <View style={{ flex: 1, gap: 8 }}>
          <Shimmer style={styles.skeletonTextLineLong} />
          <Shimmer style={styles.skeletonTextLineShort} />
        </View>
      </View>
    </View>
  );
}

/**
 * SuccessCheckmark: Animated checkmark popping effect.
 */
export function SuccessCheckmark({ size = 80, onComplete }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(checkAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onComplete) onComplete();
    });
  }, [scaleAnim, checkAnim]);

  return (
    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Animated.View
        style={[
          styles.checkmarkCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.Text
          style={[
            styles.checkmarkSymbol,
            {
              fontSize: size * 0.5,
              opacity: checkAnim,
            },
          ]}
        >
          ✓
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

/**
 * ConfettiRain: Simulated multi-color falling confetti.
 */
export function ConfettiRain({ active }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (!active) {
      setPieces([]);
      return;
    }

    const colors = ['#10B981', '#3B82F6', '#EF4444', '#F59E0B', '#EC4899', '#8B5CF6'];
    const generated = Array.from({ length: 45 }).map((_, idx) => {
      const leftPosition = Math.random() * SCREEN_WIDTH;
      const size = Math.random() * 8 + 6;
      const duration = Math.random() * 1500 + 1500;
      const delay = Math.random() * 1000;
      const rotation = `${Math.random() * 360}deg`;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const fallAnim = new Animated.Value(-50);

      return {
        id: idx,
        color,
        size,
        left: leftPosition,
        rotation,
        duration,
        delay,
        fallAnim,
      };
    });

    setPieces(generated);

    const anims = generated.map((piece) => {
      return Animated.timing(piece.fallAnim, {
        toValue: SCREEN_HEIGHT + 50,
        duration: piece.duration,
        delay: piece.delay,
        useNativeDriver: true,
      });
    });

    Animated.parallel(anims).start();
  }, [active]);

  if (!active) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((piece) => (
        <Animated.View
          key={piece.id}
          style={[
            styles.confettiPiece,
            {
              backgroundColor: piece.color,
              width: piece.size,
              height: piece.size * 1.5,
              left: piece.left,
              transform: [
                { translateY: piece.fallAnim },
                { rotate: piece.rotation },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

/**
 * ToastNotification: Custom sliding top alert banner.
 */
export function ToastNotification({ visible, message, type = 'success', onClose }) {
  const slideAnim = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 60,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, 3500);

      return () => clearTimeout(timer);
    } else {
      slideAnim.setValue(-120);
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -120,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      if (onClose) onClose();
    });
  };

  const bgMap = {
    success: '#0E4A35',
    error: '#DC2626',
    info: '#2563EB',
  };

  return (
    <Animated.View
      style={[
        styles.toastWrapper,
        {
          transform: [{ translateY: slideAnim }],
          backgroundColor: bgMap[type] || bgMap.success,
        },
      ]}
    >
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

/**
 * ExpandableFAB: snappily reveals option nodes when toggled.
 */
export function ExpandableFAB({ options = [], icon = '⚙️' }) {
  const [open, setOpen] = useState(false);
  const openAnim = useRef(new Animated.Value(0)).current;

  const toggleFAB = () => {
    const nextState = !open;
    setOpen(nextState);
    Animated.spring(openAnim, {
      toValue: nextState ? 1 : 0,
      tension: 100,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.fabContainer}>
      {options.map((opt, idx) => {
        const translateY = openAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -65 * (idx + 1)],
        });

        const scale = openAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        });

        const opacity = openAnim.interpolate({
          inputRange: [0, 0.4, 1],
          outputRange: [0, 0, 1],
        });

        return (
          <Animated.View
            key={idx}
            style={[
              styles.miniFab,
              {
                opacity,
                transform: [{ translateY }, { scale }],
              },
            ]}
          >
            <TouchableWithoutFeedback onPress={() => { toggleFAB(); opt.onPress(); }}>
              <View style={styles.miniFabInner}>
                <Text style={{ fontSize: 16 }}>{opt.emoji}</Text>
              </View>
            </TouchableWithoutFeedback>
          </Animated.View>
        );
      })}

      <TouchableWithoutFeedback onPress={toggleFAB}>
        <Animated.View style={styles.mainFab}>
          <Text style={{ fontSize: 22, color: '#fff' }}>{icon}</Text>
        </Animated.View>
      </TouchableWithoutFeedback>
    </View>
  );
}

/**
 * NumberCounter: snappily springs text on change to animate counts.
 */
export function NumberCounter({ value, style }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevVal = useRef(value);

  useEffect(() => {
    if (prevVal.current !== value) {
      prevVal.current = value;
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.35,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 160,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [value, scaleAnim]);

  return (
    <Animated.Text style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      {value}
    </Animated.Text>
  );
}

/**
 * TypingText: simple text typewriter effect.
 */
export function TypingText({ text, duration = 60, style }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let index = 0;
    setDisplayedText('');
    const timer = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(index));
      index++;
      if (index >= text.length) {
        clearInterval(timer);
      }
    }, duration);

    return () => clearInterval(timer);
  }, [text, duration]);

  return <Text style={style}>{displayedText}</Text>;
}

/**
 * CharacterWalk: Renders a character sprite (Walking, Running, Cycling, Scooter)
 * animating with custom stride bounces (Y swing) and tilt/rotate loops.
 */
export function CharacterWalk({ sprite = '🚶', speed = 1000, style }) {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const tiltAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(bounceAnim, { toValue: -8, duration: speed / 2, useNativeDriver: true }),
          Animated.timing(bounceAnim, { toValue: 0, duration: speed / 2, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(tiltAnim, { toValue: 1, duration: speed / 2, useNativeDriver: true }),
          Animated.timing(tiltAnim, { toValue: -1, duration: speed / 2, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, [bounceAnim, tiltAnim, speed]);

  const rotate = tiltAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-6deg', '6deg'],
  });

  return (
    <Animated.View style={[{ transform: [{ translateY: bounceAnim }, { rotate }] }, style]}>
      <Text style={{ fontSize: 44 }}>{sprite}</Text>
    </Animated.View>
  );
}

/**
 * LocationSearch: Illustrative GPS navigation / marker scanning animation.
 */
export function LocationSearch({ style }) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(spinAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 1250, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 1250, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, [spinAnim, pulseAnim]);

  const rotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1.2],
  });

  return (
    <View style={[styles.locSearchContainer, style]}>
      <Animated.View style={[styles.locSearchPulse, { transform: [{ scale }] }]} />
      <Text style={{ fontSize: 48, zIndex: 2 }}>📍</Text>
      <Animated.View style={[styles.locSearchGlass, { transform: [{ rotate }] }]}>
        <Text style={{ fontSize: 24, marginLeft: 28, marginTop: 28 }}>🔍</Text>
      </Animated.View>
    </View>
  );
}

/**
 * NoInternetAnim: Pulsing wifi signal arch rings.
 */
export function NoInternetAnim({ style }) {
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.stagger(400, [
        Animated.sequence([
          Animated.timing(pulse1, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulse1, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(pulse2, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulse2, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, [pulse1, pulse2]);

  const scale1 = pulse1.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.8] });
  const opacity1 = pulse1.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] });
  const scale2 = pulse2.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.8] });
  const opacity2 = pulse2.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] });

  return (
    <View style={[styles.internetContainer, style]}>
      <Animated.View style={[styles.wifiRing, { transform: [{ scale: scale1 }], opacity: opacity1 }]} />
      <Animated.View style={[styles.wifiRing, { transform: [{ scale: scale2 }], opacity: opacity2 }]} />
      <View style={styles.wifiCenter}>
        <Text style={{ fontSize: 26, color: '#DC2626' }}>📶</Text>
      </View>
    </View>
  );
}

/**
 * NoOrdersAnim: Hovering package box with cargo papers.
 */
export function NoOrdersAnim({ style }) {
  const hoverAnim = useRef(new Animated.Value(0)).current;
  const paperAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(hoverAnim, { toValue: -15, duration: 1500, useNativeDriver: true }),
          Animated.timing(hoverAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(paperAnim, { toValue: 10, duration: 1000, useNativeDriver: true }),
          Animated.timing(paperAnim, { toValue: -10, duration: 1000, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, [hoverAnim, paperAnim]);

  return (
    <View style={[styles.noOrdersContainer, style]}>
      <Animated.View style={{ transform: [{ translateY: hoverAnim }] }}>
        <Text style={{ fontSize: 64 }}>📦</Text>
      </Animated.View>
      <Animated.View style={[styles.cargoPaper, { transform: [{ translateX: paperAnim }] }]}>
        <Text style={{ fontSize: 16 }}>📄</Text>
      </Animated.View>
      <Animated.View style={[styles.cargoPaper, { left: 40, top: 20, transform: [{ translateY: paperAnim }] }]}>
        <Text style={{ fontSize: 14 }}>📝</Text>
      </Animated.View>
    </View>
  );
}

/**
 * MaintenanceAnim: Rotating gears and swaying tool.
 */
export function MaintenanceAnim({ style }) {
  const gearSpin = useRef(new Animated.Value(0)).current;
  const wrenchSway = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(gearSpin, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(wrenchSway, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(wrenchSway, { toValue: -1, duration: 800, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, [gearSpin, wrenchSway]);

  const rotateGear = gearSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const rotateWrench = wrenchSway.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-25deg', '25deg'],
  });

  return (
    <View style={[styles.maintenanceContainer, style]}>
      <Animated.View style={{ transform: [{ rotate: rotateGear }] }}>
        <Text style={{ fontSize: 60 }}>⚙️</Text>
      </Animated.View>
      <Animated.View style={[styles.wrenchOverlay, { transform: [{ rotate: rotateWrench }] }]}>
        <Text style={{ fontSize: 32 }}>🔧</Text>
      </Animated.View>
    </View>
  );
}

/**
 * PageNotFoundAnim: Bouncing 404 text and a hovering AI helper robot.
 */
export function PageNotFoundAnim({ style }) {
  const bounce404 = useRef(new Animated.Value(0)).current;
  const robotHover = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.spring(bounce404, { toValue: -20, tension: 80, friction: 3, useNativeDriver: true }),
          Animated.spring(bounce404, { toValue: 0, tension: 80, friction: 3, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(robotHover, { toValue: 10, duration: 1200, useNativeDriver: true }),
          Animated.timing(robotHover, { toValue: -10, duration: 1200, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, [bounce404, robotHover]);

  return (
    <View style={[styles.notFoundContainer, style]}>
      <Animated.Text style={[styles.notFoundText404, { transform: [{ translateY: bounce404 }] }]}>
        404
      </Animated.Text>
      <Animated.View style={[styles.robotHelper, { transform: [{ translateY: robotHover }] }]}>
        <Text style={{ fontSize: 44 }}>🤖</Text>
        <View style={styles.robotBubble}>
          <Text style={styles.robotBubbleText}>Lost?</Text>
        </View>
      </Animated.View>
    </View>
  );
}

/**
 * OrderTimelineAnim: A step-by-step progress tracking check timeline.
 */
export function OrderTimelineAnim({ activeStep = 3 }) {
  const steps = [
    { label: 'Order Accepted', emoji: '✅' },
    { label: 'Order Packed', emoji: '📦' },
    { label: 'Order Shipped', emoji: '🚚' },
    { label: 'Out For Delivery', emoji: '🛵' },
    { label: 'Delivered', emoji: '🏠' },
  ];

  return (
    <View style={styles.timelineList}>
      {steps.map((step, idx) => {
        const isPast = idx < activeStep;
        const isCurrent = idx === activeStep;
        const color = isPast ? '#10B981' : isCurrent ? '#FF6C40' : '#94A3B8';

        return (
          <View key={idx} style={styles.timelineStepRow}>
            <View style={styles.timelineIndicatorCol}>
              <View style={[styles.timelineNode, { borderColor: color, backgroundColor: isPast ? color : '#FFF' }]}>
                {isPast ? (
                  <Text style={styles.timelineNodeDoneText}>✓</Text>
                ) : (
                  <View style={[styles.timelineNodeDot, { backgroundColor: color }]} />
                )}
              </View>
              {idx < steps.length - 1 && (
                <View style={[styles.timelineVerticalLine, { backgroundColor: idx < activeStep ? '#10B981' : '#E2E8F0' }]} />
              )}
            </View>
            <View style={styles.timelineStepInfo}>
              <Text style={[styles.timelineStepLabel, isCurrent && { fontWeight: 'bold', color: '#1A2F25' }]}>
                {step.emoji} {step.label}
              </Text>
              {isCurrent && <Text style={styles.timelineStepBadge}>ACTIVE STEP</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/**
 * FadeView: Smooth fade transitions (Fade In / Fade Out)
 */
export function FadeView({ children, type = 'in', duration = 500, delay = 0, style }) {
  const anim = useRef(new Animated.Value(type === 'in' ? 0 : 1)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: type === 'in' ? 1 : 0,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, [type, duration, delay]);
  return <Animated.View style={[{ opacity: anim }, style]}>{children}</Animated.View>;
}

/**
 * SlideView: Slide transitions in 4 directions (Up, Down, Left, Right)
 */
export function SlideView({ children, direction = 'up', distance = 100, duration = 500, delay = 0, style }) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 0,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, [duration, delay]);

  const transform = [];
  if (direction === 'up') {
    transform.push({ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) });
  } else if (direction === 'down') {
    transform.push({ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-distance, 0] }) });
  } else if (direction === 'left') {
    transform.push({ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) });
  } else if (direction === 'right') {
    transform.push({ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-distance, 0] }) });
  }

  return <Animated.View style={[{ transform }, style]}>{children}</Animated.View>;
}

/**
 * ZoomView: Scale transitions (Zoom In / Zoom Out) with elastic spring option
 */
export function ZoomView({ children, type = 'in', duration = 400, delay = 0, elastic = false, style }) {
  const anim = useRef(new Animated.Value(type === 'in' ? 0 : 1)).current;
  useEffect(() => {
    if (elastic && type === 'in') {
      Animated.spring(anim, {
        toValue: 1,
        tension: 80,
        friction: 6,
        delay,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(anim, {
        toValue: type === 'in' ? 1 : 0,
        duration,
        delay,
        useNativeDriver: true,
      }).start();
    }
  }, [type, duration, delay, elastic]);

  return <Animated.View style={[{ transform: [{ scale: anim }] }, style]}>{children}</Animated.View>;
}

/**
 * BounceView / SpringView: Elastic spring animation
 */
export function BounceView({ children, delay = 0, style }) {
  const scale = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      tension: 100,
      friction: 5,
      delay,
      useNativeDriver: true,
    }).start();
  }, [delay]);
  return <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>;
}

/**
 * RippleEffect: Coordinate-aware ripple feedback
 */
export function RippleEffect({ children, onPress, style }) {
  const [ripples, setRipples] = useState([]);
  const handlePress = (e) => {
    const { locationX, locationY } = e.nativeEvent;
    const id = Date.now();
    const scaleAnim = new Animated.Value(0);
    const opacityAnim = new Animated.Value(0.5);

    setRipples((prev) => [...prev, { id, x: locationX, y: locationY, scaleAnim, opacityAnim }]);

    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    });

    if (onPress) onPress();
  };

  return (
    <Pressable onPress={handlePress} style={style}>
      {children}
      {ripples.map((ripple) => (
        <Animated.View
          key={ripple.id}
          style={[
            styles.ripple,
            {
              left: ripple.x - 20,
              top: ripple.y - 20,
              transform: [{ scale: ripple.scaleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.1, 4] }) }],
              opacity: ripple.opacityAnim,
            },
          ]}
        />
      ))}
    </Pressable>
  );
}

/**
 * GlassmorphismCard: Translucent frosted glass effect
 */
export function GlassmorphismCard({ children, style }) {
  return (
    <View style={[styles.glassCard, style]}>
      <View style={styles.glassSheen} />
      {children}
    </View>
  );
}

/**
 * NeumorphismButton: Beveled extruding/receding touch effect
 */
export function NeumorphismButton({ children, onPress, style }) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      style={[
        styles.neumorphicBtn,
        pressed ? styles.neumorphicBtnPressed : styles.neumorphicBtnActive,
        style
      ]}
    >
      {children}
    </Pressable>
  );
}

/**
 * GlowingView: Pulsing outer aura shadow glow
 */
export function GlowingView({ children, glowColor = '#2EC17E', style }) {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.0, duration: 1500, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0.4, duration: 1500, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          shadowColor: glowColor,
          shadowOpacity: pulse,
          shadowRadius: pulse.interpolate({ inputRange: [0.4, 1.0], outputRange: [4, 16] }),
          elevation: pulse.interpolate({ inputRange: [0.4, 1.0], outputRange: [2, 8] }),
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/**
 * GradientBackground: Pulsing color transition
 */
export function GradientBackground({ colors = ['#0E4A35', '#165B43', '#1A2F25'], children, style }) {
  const colorAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(colorAnim, { toValue: 1, duration: 5000, useNativeDriver: false }),
        Animated.timing(colorAnim, { toValue: 0, duration: 5000, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const backgroundColor = colorAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: colors,
  });

  return (
    <Animated.View style={[{ backgroundColor }, style]}>
      {children}
    </Animated.View>
  );
}

/**
 * ParticleBackground: Lightweight canvas particle simulation
 */
export function ParticleBackground({ count = 20, color = '#2EC17E', children, style }) {
  const [particles] = useState(() =>
    Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * SCREEN_WIDTH,
      size: Math.random() * 6 + 3,
      animY: new Animated.Value(SCREEN_HEIGHT + 20),
      duration: Math.random() * 4000 + 3000,
      delay: Math.random() * 3000,
    }))
  );

  useEffect(() => {
    particles.forEach((p) => {
      const loop = () => {
        p.animY.setValue(SCREEN_HEIGHT + 20);
        Animated.timing(p.animY, {
          toValue: -20,
          duration: p.duration,
          delay: p.delay,
          useNativeDriver: true,
        }).start(() => loop());
      };
      loop();
    });
  }, [particles]);

  return (
    <View style={[StyleSheet.absoluteFill, style]}>
      {particles.map((p) => (
        <Animated.View
          key={p.id}
          style={[
            styles.particle,
            {
              left: p.x,
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              backgroundColor: color,
              transform: [{ translateY: p.animY }],
            },
          ]}
        />
      ))}
      {children}
    </View>
  );
}

/**
 * ProgressiveImage: Renders a blur placeholder then fades in the full resolution image
 */
export function ProgressiveImage({ thumbnailSource, source, style }) {
  const thumbnailOpacity = useRef(new Animated.Value(1)).current;
  const imageOpacity = useRef(new Animated.Value(0)).current;

  const onThumbnailLoad = () => {
    Animated.timing(thumbnailOpacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  };

  const onImageLoad = () => {
    Animated.parallel([
      Animated.timing(imageOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(thumbnailOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  };

  return (
    <View style={[styles.progressiveImageBg, style]}>
      {thumbnailSource && (
        <Animated.Image
          source={thumbnailSource}
          style={[StyleSheet.absoluteFill, style, { opacity: thumbnailOpacity }]}
          onLoad={onThumbnailLoad}
          blurRadius={10}
        />
      )}
      <Animated.Image
        source={source}
        style={[StyleSheet.absoluteFill, style, { opacity: imageOpacity }]}
        onLoad={onImageLoad}
      />
    </View>
  );
}

/**
 * SkeletonTransition: Smooth crossfade between skeleton and actual content
 */
export function SkeletonTransition({ loading, skeleton, children }) {
  const fadeAnim = useRef(new Animated.Value(loading ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: loading ? 1 : 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [loading]);

  const skeletonOpacity = fadeAnim;
  const contentOpacity = fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <View style={{ position: 'relative', width: '100%' }}>
      {loading && (
        <Animated.View style={{ opacity: skeletonOpacity, width: '100%' }}>
          {skeleton}
        </Animated.View>
      )}
      {!loading && (
        <Animated.View style={{ opacity: contentOpacity, width: '100%' }}>
          {children}
        </Animated.View>
      )}
    </View>
  );
}

/**
 * StaggerContainer: Renders children sequentially with entry transitions
 */
export function StaggerContainer({ children, delayStep = 80 }) {
  const count = React.Children.count(children);
  const anims = useRef(Array.from({ length: count }).map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const staggerAnimations = anims.map((anim) =>
      Animated.spring(anim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      })
    );
    Animated.stagger(delayStep, staggerAnimations).start();
  }, [anims, delayStep]);

  return (
    <View style={{ width: '100%' }}>
      {React.Children.map(children, (child, index) => {
        const opacity = anims[index];
        const translateY = anims[index].interpolate({
          inputRange: [0, 1],
          outputRange: [30, 0],
        });
        return (
          <Animated.View style={{ opacity, transform: [{ translateY }] }}>
            {child}
          </Animated.View>
        );
      })}
    </View>
  );
}

/**
 * CartFly: Animates a flying item from coordinates to target (e.g. cart)
 */
export function CartFly({ active, startCoords, endCoords, onComplete, emoji = '🥦' }) {
  const flyX = useRef(new Animated.Value(0)).current;
  const flyY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (active && startCoords && endCoords) {
      flyX.setValue(startCoords.x);
      flyY.setValue(startCoords.y);
      scale.setValue(1);

      Animated.parallel([
        Animated.timing(flyX, {
          toValue: endCoords.x,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.sequence([
          // Arc Y trajectory
          Animated.timing(flyY, {
            toValue: Math.min(startCoords.y, endCoords.y) - 80,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(flyY, {
            toValue: endCoords.y,
            duration: 350,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.5, duration: 300, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.4, duration: 350, useNativeDriver: true }),
        ]),
      ]).start(() => {
        if (onComplete) onComplete();
      });
    }
  }, [active]);

  if (!active) return null;

  return (
    <Animated.View
      style={[
        styles.cartFlyDot,
        {
          transform: [
            { translateX: flyX },
            { translateY: flyY },
            { scale }
          ]
        }
      ]}
    >
      <Text style={{ fontSize: 24 }}>{emoji}</Text>
    </Animated.View>
  );
}

/**
 * HeartPop: Bursting favorite like trigger
 */
export function HeartPop({ liked, onPress, style }) {
  const scale = useRef(new Animated.Value(1)).current;
  const sparkAnim = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    if (!liked) {
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scale, { toValue: 1.6, friction: 3, tension: 120, useNativeDriver: true }),
          Animated.timing(sparkAnim, { toValue: 1, duration: 350, useNativeDriver: true })
        ]),
        Animated.spring(scale, { toValue: 1.0, friction: 5, tension: 150, useNativeDriver: true })
      ]).start(() => sparkAnim.setValue(0));
    }
    if (onPress) onPress();
  };

  const sparkScale = sparkAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.8] });
  const sparkOpacity = sparkAnim.interpolate({ inputRange: [0, 0.8, 1], outputRange: [0, 0.8, 0] });

  return (
    <View style={[{ justifyContent: 'center', alignItems: 'center' }, style]}>
      {liked && (
        <Animated.View
          style={[
            styles.sparkCircle,
            { transform: [{ scale: sparkScale }], opacity: sparkOpacity }
          ]}
        />
      )}
      <Pressable onPress={handlePress}>
        <Animated.Text style={{ fontSize: 28, transform: [{ scale }] }}>
          {liked ? '❤️' : '🤍'}
        </Animated.Text>
      </Pressable>
    </View>
  );
}

/**
 * NotificationBadge: Wiggles on counter update
 */
export function NotificationBadge({ count, style }) {
  const scale = useRef(new Animated.Value(1)).current;
  const wiggle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (count > 0) {
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.4, friction: 3, tension: 100, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(wiggle, { toValue: 1, duration: 60, useNativeDriver: true }),
          Animated.timing(wiggle, { toValue: -1, duration: 60, useNativeDriver: true }),
          Animated.timing(wiggle, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]),
        Animated.spring(scale, { toValue: 1.0, friction: 5, tension: 100, useNativeDriver: true }),
      ]).start();
    }
  }, [count]);

  if (!count) return null;

  const rotate = wiggle.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-15deg', '15deg'],
  });

  return (
    <Animated.View style={[styles.badge, { transform: [{ scale }, { rotate }] }, style]}>
      <Text style={styles.badgeText}>{count}</Text>
    </Animated.View>
  );
}

/**
 * MorphingShape: Morph shapes and colors continuously
 */
export function MorphingShape({ style }) {
  const morph = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(morph, { toValue: 1, duration: 2500, useNativeDriver: false }),
        Animated.timing(morph, { toValue: 0, duration: 2500, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const borderRadius = morph.interpolate({ inputRange: [0, 1], outputRange: [12, 50] });
  const backgroundColor = morph.interpolate({ inputRange: [0, 1], outputRange: ['#0E4A35', '#FF6C40'] });

  return <Animated.View style={[{ width: 80, height: 80, borderRadius, backgroundColor }, style]} />;
}

/**
 * SwipeableRow: Swipes left to delete/action
 */
export function SwipeableRow({ children, onDelete, height = 75 }) {
  const panX = useRef(new Animated.Value(0)).current;
  const isDeleted = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          panX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -120) {
          Animated.timing(panX, {
            toValue: -SCREEN_WIDTH,
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            if (onDelete && !isDeleted.current) {
              isDeleted.current = true;
              onDelete();
            }
          });
        } else {
          Animated.spring(panX, {
            toValue: 0,
            tension: 80,
            friction: 6,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View style={[styles.swipeableContainer, { height }]}>
      <View style={styles.swipeDeleteAction}>
        <Text style={styles.swipeDeleteText}>🗑️ Delete</Text>
      </View>
      <Animated.View
        style={[styles.swipeableContent, { transform: [{ translateX: panX }] }]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

/**
 * AutoHideHeader: Scroll-driven header visibility
 */
export function AutoHideHeader({ scrollY, headerHeight = 60, children, style }) {
  const clampedScroll = Animated.diffClamp(scrollY, 0, headerHeight);
  const translateY = clampedScroll.interpolate({
    inputRange: [0, headerHeight],
    outputRange: [0, -headerHeight],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.autoHideHeader, { height: headerHeight, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Shimmer
  shimmerContainer: {
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  shimmerBand: {
    width: '30%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    position: 'absolute',
    top: 0,
    bottom: 0,
  },

  // Skeleton placeholders
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E6E2',
    marginBottom: 12,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skeletonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  skeletonTextLineLong: {
    height: 16,
    width: '75%',
    borderRadius: 4,
  },
  skeletonTextLineShort: {
    height: 12,
    width: '45%',
    borderRadius: 4,
  },

  // Checkmark circle popup
  checkmarkCircle: {
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  checkmarkSymbol: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  // Confetti
  confettiPiece: {
    position: 'absolute',
    top: 0,
    borderRadius: 1,
  },

  // Toast
  toastWrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    zIndex: 9999,
  },
  toastText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },

  // Expandable FAB
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    alignItems: 'center',
    zIndex: 999,
  },
  mainFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0E4A35',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#0E4A35',
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  miniFab: {
    position: 'absolute',
    bottom: 0,
  },
  miniFabInner: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E0E6E2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },

  // Location Search Scan
  locSearchContainer: {
    width: 120, height: 120, justifyContent: 'center', alignItems: 'center',
    position: 'relative', alignSelf: 'center',
  },
  locSearchPulse: {
    position: 'absolute', width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#0E4A35', opacity: 0.15, zIndex: 1,
  },
  locSearchGlass: {
    position: 'absolute', width: '100%', height: '100%',
    justifyContent: 'flex-start', alignItems: 'flex-start',
  },

  // No Internet Anim
  internetContainer: {
    width: 90, height: 90, justifyContent: 'center', alignItems: 'center',
    position: 'relative', alignSelf: 'center',
  },
  wifiRing: {
    position: 'absolute', width: 64, height: 64, borderRadius: 32,
    borderWidth: 3, borderColor: '#DC2626',
  },
  wifiCenter: { zIndex: 2 },

  // Empty state order boxes
  noOrdersContainer: {
    width: 120, height: 100, justifyContent: 'center', alignItems: 'center',
    position: 'relative', alignSelf: 'center',
  },
  cargoPaper: { position: 'absolute', left: 24, top: 12, zIndex: -1 },

  // Maintenance Gears
  maintenanceContainer: {
    width: 120, height: 100, justifyContent: 'center', alignItems: 'center',
    position: 'relative', alignSelf: 'center',
  },
  wrenchOverlay: { position: 'absolute', left: 44, top: 22 },

  // Page 404 Robot helper
  notFoundContainer: {
    width: 160, height: 120, justifyContent: 'center', alignItems: 'center',
    position: 'relative', alignSelf: 'center',
  },
  notFoundText404: {
    fontSize: 56, fontWeight: '900', color: '#DC2626', opacity: 0.15,
  },
  robotHelper: { position: 'absolute', flexDirection: 'row', alignItems: 'center' },
  robotBubble: {
    backgroundColor: '#0E4A35', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
    marginLeft: 6, position: 'relative',
  },
  robotBubbleText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

  // Timeline Progress checklist
  timelineList: { gap: 0, paddingHorizontal: 12 },
  timelineStepRow: { flexDirection: 'row', gap: 14 },
  timelineIndicatorCol: { alignItems: 'center', width: 24 },
  timelineNode: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center', zIndex: 2,
  },
  timelineNodeDot: { width: 8, height: 8, borderRadius: 4 },
  timelineNodeDoneText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  timelineVerticalLine: { width: 3, flex: 1, marginVertical: -2, zIndex: 1, minHeight: 35 },
  timelineStepInfo: { flex: 1, paddingVertical: 2, gap: 2 },
  timelineStepLabel: { fontSize: 13, color: '#5C6F66', fontWeight: '500' },
  timelineStepBadge: {
    alignSelf: 'flex-start', backgroundColor: '#FF6C4015',
    color: '#FF6C40', fontSize: 8, fontWeight: 'bold', paddingHorizontal: 6,
    paddingVertical: 2, borderRadius: 6,
  },
  ripple: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0E4A35',
    opacity: 0.4,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  glassSheen: {
    position: 'absolute',
    top: 0, left: 0, right: 0, height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  neumorphicBtn: {
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  neumorphicBtnActive: {
    backgroundColor: '#FAF6F0',
    borderColor: '#EFEBE4',
    shadowColor: '#2C2B29',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  neumorphicBtnPressed: {
    backgroundColor: '#FAF6F0',
    borderColor: '#EFEBE4',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: -1, height: -1 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 1,
  },
  particle: {
    position: 'absolute',
    opacity: 0.25,
  },
  progressiveImageBg: {
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    position: 'relative',
  },
  cartFlyDot: {
    position: 'absolute',
    zIndex: 100000,
    left: 0,
    top: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 8,
  },
  sparkCircle: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#DC2626',
    opacity: 0,
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -6,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    zIndex: 10,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  swipeableContainer: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#DC2626',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  swipeDeleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 120,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeDeleteText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  swipeableContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E6E2',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  autoHideHeader: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 1000,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E6E2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
});

export const PulsingDot = React.memo(_PulsingDot);
export const AnimatedCard = React.memo(_AnimatedCard);
export const AnimatedPressable = React.memo(_AnimatedPressable);
export const Shimmer = React.memo(_Shimmer);
export const SkeletonCard = React.memo(_SkeletonCard);

// 📳 HORIZONTAL SHAKE COMPONENT FOR ERRORS
function _ShakeView({ children, trigger, style }) {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (trigger) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 5, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -5, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  }, [trigger]);

  return (
    <Animated.View style={[{ transform: [{ translateX: shakeAnim }] }, style]}>
      {children}
    </Animated.View>
  );
}
export const ShakeView = React.memo(_ShakeView);

// 🌟 SOFT GLOWING PULSE COMPONENT
function _GlowingPulse({ children, color = '#2E9D6A', borderWidth = 3, duration = 1800, style }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: duration,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opAnim, {
            toValue: 0.8,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(opAnim, {
            toValue: 0,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [pulseAnim, opAnim, duration]);

  return (
    <View style={[{ position: 'relative', justifyContent: 'center', alignItems: 'center' }, style]}>
      <Animated.View
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: 999,
          borderWidth: borderWidth,
          borderColor: color,
          transform: [{ scale: pulseAnim }],
          opacity: opAnim,
        }}
      />
      {children}
    </View>
  );
}
export const GlowingPulse = React.memo(_GlowingPulse);

// ✒️ PROGRESSIVE SVG DRAW COMPONENT (CHECKMARK)
const AnimatedPath = Animated.createAnimatedComponent(Path);
function _AnimatedSVGDraw({ size = 48, color = '#2E9D6A', strokeWidth = 5, duration = 400, onComplete }) {
  const drawAnim = useRef(new Animated.Value(60)).current;

  useEffect(() => {
    Animated.timing(drawAnim, {
      toValue: 0,
      duration: duration,
      useNativeDriver: false,
    }).start(() => {
      if (onComplete) onComplete();
    });
  }, [drawAnim, duration]);

  return (
    <Svg width={size} height={size} viewBox="0 0 50 50">
      <AnimatedPath
        d="M14,27 L22,35 L36,17"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="60"
        strokeDashoffset={drawAnim}
      />
    </Svg>
  );
}
export const AnimatedSVGDraw = React.memo(_AnimatedSVGDraw);
