// // import React, { useEffect, useRef } from 'react';
// // import { Animated, StyleSheet, Text, View } from 'react-native';
// // import { Image } from 'expo-image';
// // import { LinearGradient } from 'expo-linear-gradient';
// // import { MaterialCommunityIcons } from '@expo/vector-icons';
// // import Screen from '../components/Screen';
// // import { themeTokens } from '../constants/theme';
// // import { useAppStore } from '../store/UseAppStore';

// // const brandLogo = require('../../assets/ram bhaji 01 .png');

// // export default function AppLoaderScreen({ navigation, route }) {
// //   const mode = useAppStore((state) => state.themeMode);
// //   const colors = themeTokens[mode];
// //   const nextRoute = route?.params?.nextRoute || 'MainTabs';
// //   const nextParams = route?.params?.nextParams;
// //   const spin = useRef(new Animated.Value(0)).current;
// //   const lift = useRef(new Animated.Value(0)).current;
// //   const progress = useRef(new Animated.Value(0)).current;

// //   useEffect(() => {
// //     Animated.loop(
// //       Animated.timing(spin, {
// //         toValue: 1,
// //         duration: 1600,
// //         useNativeDriver: true,
// //       })
// //     ).start();

// //     Animated.loop(
// //       Animated.sequence([
// //         Animated.timing(lift, { toValue: 1, duration: 900, useNativeDriver: true }),
// //         Animated.timing(lift, { toValue: 0, duration: 900, useNativeDriver: true }),
// //       ])
// //     ).start();

// //     Animated.timing(progress, {
// //       toValue: 1,
// //       duration: 1450,
// //       useNativeDriver: false,
// //     }).start();

// //     const timer = setTimeout(() => {
// //       navigation.reset({
// //         index: 0,
// //         routes: [{ name: nextRoute, params: nextParams }],
// //       });
// //     }, 1650);

// //     return () => clearTimeout(timer);
// //   }, [lift, navigation, nextParams, nextRoute, progress, spin]);

// //   return (
// //     <Screen scroll={false}>
// //       <LinearGradient colors={['#FFF9EA', '#E7F3DC', '#FFFFFF']} style={s.wrap}>
// //         <Animated.View
// //           style={[
// //             s.logoShell,
// //             {
// //               transform: [
// //                 {
// //                   translateY: lift.interpolate({
// //                     inputRange: [0, 1],
// //                     outputRange: [0, -9],
// //                   }),
// //                 },
// //               ],
// //             },
// //           ]}
// //         >
// //           <Image source={brandLogo} style={s.logo} contentFit="contain" />
// //           <Animated.View
// //             style={[
// //               s.ring,
// //               {
// //                 borderColor: colors.primary,
// //                 transform: [
// //                   {
// //                     rotate: spin.interpolate({
// //                       inputRange: [0, 1],
// //                       outputRange: ['0deg', '360deg'],
// //                     }),
// //                   },
// //                 ],
// //               },
// //             ]}
// //           />
// //         </Animated.View>

// //         <Text style={[s.title, { color: colors.text }]}>Preparing fresh market</Text>
// //         <Text style={[s.sub, { color: colors.textSoft }]}>Plans, veggies, water and deliveries are getting ready.</Text>

// //         <View style={[s.progressTrack, { backgroundColor: colors.surfaceStrong }]}>
// //           <Animated.View
// //             style={[
// //               s.progressFill,
// //               {
// //                 backgroundColor: colors.primary,
// //                 width: progress.interpolate({
// //                   inputRange: [0, 1],
// //                   outputRange: ['10%', '100%'],
// //                 }),
// //               },
// //             ]}
// //           />
// //         </View>

// //         <View style={s.statusRow}>
// //           <MaterialCommunityIcons name="leaf" size={16} color={colors.primary} />
// //           <Text style={[s.statusText, { color: colors.textSoft }]}>Checking fresh harvest</Text>
// //         </View>
// //       </LinearGradient>
// //     </Screen>
// //   );
// // }

// // const s = StyleSheet.create({
// //   wrap: {
// //     flex: 1,
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //     paddingHorizontal: 24,
// //   },
// //   logoShell: {
// //     width: 142,
// //     height: 142,
// //     borderRadius: 44,
// //     backgroundColor: 'rgba(255, 252, 244, 0.92)',
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //     shadowColor: '#2B2112',
// //     shadowOffset: { width: 0, height: 18 },
// //     shadowOpacity: 0.16,
// //     shadowRadius: 28,
// //     elevation: 8,
// //   },
// //   logo: {
// //     width: 104,
// //     height: 82,
// //   },
// //   ring: {
// //     position: 'absolute',
// //     width: 154,
// //     height: 154,
// //     borderRadius: 77,
// //     borderWidth: 3,
// //     borderLeftColor: 'transparent',
// //     borderBottomColor: 'transparent',
// //   },
// //   title: {
// //     fontSize: 24,
// //     lineHeight: 30,
// //     fontWeight: '900',
// //     marginTop: 34,
// //     textAlign: 'center',
// //   },
// //   sub: {
// //     maxWidth: 280,
// //     fontSize: 13,
// //     lineHeight: 20,
// //     fontWeight: '700',
// //     marginTop: 8,
// //     textAlign: 'center',
// //   },
// //   progressTrack: {
// //     width: '100%',
// //     maxWidth: 270,
// //     height: 8,
// //     borderRadius: 99,
// //     overflow: 'hidden',
// //     marginTop: 26,
// //   },
// //   progressFill: {
// //     height: '100%',
// //     borderRadius: 99,
// //   },
// //   statusRow: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     gap: 7,
// //     marginTop: 16,
// //   },
// //   statusText: {
// //     fontSize: 12,
// //     fontWeight: '800',
// //   },
// // });




// import React, { useEffect, useRef, useState } from 'react';
// import { Animated, StyleSheet, Text, View } from 'react-native';
// import { Image } from 'expo-image';
// import { LinearGradient } from 'expo-linear-gradient';
// import { MaterialCommunityIcons } from '@expo/vector-icons';
// import Screen from '../components/Screen';
// import { themeTokens } from '../constants/theme';
// import { useAppStore } from '../store/UseAppStore';

// const brandLogo = require('../../assets/ram bhaji 01 .png');

// // 5 status messages — each shown for ~330ms to fill the 1650ms window
// const STATUS = [
//   { icon: 'leaf',                   text: 'Checking fresh harvest'      },
//   { icon: 'truck-delivery-outline', text: 'Loading delivery routes'     },
//   { icon: 'calendar-check-outline', text: 'Syncing subscription plans'  },
//   { icon: 'water-outline',          text: 'Preparing water orders'      },
//   { icon: 'check-circle-outline',   text: 'All set — ready to serve!'   },
// ];

// // Particles distributed around a 200×200 logo zone
// const PARTICLES = [
//   { size: 7, top: -4,  left: 95,  delay:   0, opacity: 0.55 },
//   { size: 5, top: 14,  left: 172, delay: 220, opacity: 0.38 },
//   { size: 6, top: 94,  left: 188, delay: 440, opacity: 0.42 },
//   { size: 8, top: 168, left: 158, delay: 110, opacity: 0.48 },
//   { size: 5, top: 170, left: 30,  delay: 330, opacity: 0.32 },
//   { size: 6, top: 94,  left: -4,  delay: 550, opacity: 0.36 },
// ];

// export default function AppLoaderScreen({ navigation, route }) {
//   const mode   = useAppStore((state) => state.themeMode);
//   const colors = themeTokens[mode];
//   const nextRoute  = route?.params?.nextRoute  || 'MainTabs';
//   const nextParams = route?.params?.nextParams;

//   const [statusIdx, setStatusIdx] = useState(0);

//   // ── Animated values ────────────────────────────────────────────────────
//   // native driver
//   const spin1      = useRef(new Animated.Value(0)).current; // outer ring, slow CW
//   const spin2      = useRef(new Animated.Value(0)).current; // middle ring, medium CW
//   const spin3      = useRef(new Animated.Value(0)).current; // inner ring, fast CCW
//   const lift       = useRef(new Animated.Value(0)).current; // logo bob
//   const pulse      = useRef(new Animated.Value(0)).current; // glow scale + opacity
//   const statusFade = useRef(new Animated.Value(1)).current; // status row crossfade
//   const titleFade  = useRef(new Animated.Value(0)).current; // title entrance
//   const titleSlide = useRef(new Animated.Value(18)).current;
//   const particleAnims = useRef(PARTICLES.map(() => new Animated.Value(0))).current;

//   // non-native driver (layout properties)
//   const progress = useRef(new Animated.Value(0)).current;
//   const shimmer  = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     // ── 3 rings ───────────────────────────────────────────────────────
//     Animated.loop(
//       Animated.timing(spin1, { toValue: 1, duration: 3400, useNativeDriver: true })
//     ).start();
//     Animated.loop(
//       Animated.timing(spin2, { toValue: 1, duration: 1600, useNativeDriver: true })
//     ).start();
//     Animated.loop(
//       Animated.timing(spin3, { toValue: 1, duration: 1050, useNativeDriver: true })
//     ).start();

//     // ── Logo bob ──────────────────────────────────────────────────────
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(lift, { toValue: 1, duration: 900, useNativeDriver: true }),
//         Animated.timing(lift, { toValue: 0, duration: 900, useNativeDriver: true }),
//       ])
//     ).start();

//     // ── Glow pulse ────────────────────────────────────────────────────
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(pulse, { toValue: 1, duration: 1350, useNativeDriver: true }),
//         Animated.timing(pulse, { toValue: 0, duration: 1350, useNativeDriver: true }),
//       ])
//     ).start();

//     // ── Progress bar (non-native) ─────────────────────────────────────
//     Animated.timing(progress, {
//       toValue: 1, duration: 1450, useNativeDriver: false,
//     }).start();

//     // ── Shimmer (non-native) ──────────────────────────────────────────
//     Animated.loop(
//       Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: false })
//     ).start();

//     // ── Title entrance (delayed so it doesn't pop instantly) ──────────
//     setTimeout(() => {
//       Animated.parallel([
//         Animated.timing(titleFade,  { toValue: 1, duration: 380, useNativeDriver: true }),
//         Animated.spring(titleSlide, { toValue: 0, friction: 7, tension: 50, useNativeDriver: true }),
//       ]).start();
//     }, 200);

//     // ── Floating particles (staggered) ────────────────────────────────
//     particleAnims.forEach((anim, i) => {
//       setTimeout(() => {
//         Animated.loop(
//           Animated.sequence([
//             Animated.timing(anim, { toValue: 1, duration: 1100 + i * 130, useNativeDriver: true }),
//             Animated.timing(anim, { toValue: 0, duration: 1100 + i * 130, useNativeDriver: true }),
//           ])
//         ).start();
//       }, PARTICLES[i].delay);
//     });

//     // ── Cycling status messages ───────────────────────────────────────
//     const interval = setInterval(() => {
//       Animated.timing(statusFade, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
//         setStatusIdx((i) => (i + 1) % STATUS.length);
//         Animated.timing(statusFade, { toValue: 1, duration: 240, useNativeDriver: true }).start();
//       });
//     }, 330);

//     // ── Navigate when done ────────────────────────────────────────────
//     const timer = setTimeout(() => {
//       navigation.reset({ index: 0, routes: [{ name: nextRoute, params: nextParams }] });
//     }, 1650);

//     return () => {
//       clearTimeout(timer);
//       clearInterval(interval);
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // ── Derived interpolations ─────────────────────────────────────────────
//   const rotate1 = spin1.interpolate({ inputRange: [0, 1], outputRange: ['0deg',  '360deg']  });
//   const rotate2 = spin2.interpolate({ inputRange: [0, 1], outputRange: ['0deg',  '360deg']  });
//   const rotate3 = spin3.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg']  });

//   const logoY     = lift.interpolate({ inputRange: [0, 1], outputRange: [0,    -9]    });
//   const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1,    1.14] });
//   const glowAlpha = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.24, 0]    });

//   const progressWidth = progress.interpolate({
//     inputRange: [0, 1], outputRange: ['5%', '100%'],
//   });
//   const shimmerLeft = shimmer.interpolate({
//     inputRange: [0, 1], outputRange: ['-30%', '130%'],
//   });

//   return (
//     <Screen scroll={false}>
//       <LinearGradient colors={['#FFF9EA', '#E7F3DC', '#FFFFFF']} style={s.wrap}>

//         {/* ── Logo zone ──────────────────────────────────────────────── */}
//         <View style={s.logoZone}>

//           {/* Floating particles — orbit the outer ring */}
//           {PARTICLES.map((p, i) => (
//             <Animated.View
//               key={i}
//               style={[
//                 s.particle,
//                 {
//                   width: p.size, height: p.size,
//                   borderRadius: p.size / 2,
//                   top: p.top, left: p.left,
//                   backgroundColor: colors.primary,
//                   opacity: p.opacity,
//                   transform: [{
//                     translateY: particleAnims[i].interpolate({
//                       inputRange: [0, 1], outputRange: [0, -14],
//                     }),
//                   }],
//                 },
//               ]}
//             />
//           ))}

//           {/* Expanding glow — pulses from behind the logo */}
//           <Animated.View style={[
//             s.glow,
//             {
//               backgroundColor: colors.primary,
//               opacity:   glowAlpha,
//               transform: [{ scale: glowScale }],
//             },
//           ]} />

//           {/* Outer ring — slowest, faint, left+right sides hidden */}
//           <Animated.View style={[
//             s.ringOuter,
//             { borderColor: colors.primary + '55', transform: [{ rotate: rotate1 }] },
//           ]} />

//           {/* Middle ring — existing speed, top+left sides hidden */}
//           <Animated.View style={[
//             s.ringMid,
//             { borderColor: colors.primary, transform: [{ rotate: rotate2 }] },
//           ]} />

//           {/* Inner ring — fastest, counter-clockwise, bottom+right hidden */}
//           <Animated.View style={[
//             s.ringInner,
//             { borderColor: colors.primary + 'CC', transform: [{ rotate: rotate3 }] },
//           ]} />

//           {/* Logo shell — bobs up and down */}
//           <Animated.View style={[s.logoShell, { transform: [{ translateY: logoY }] }]}>
//             <Image source={brandLogo} style={s.logo} contentFit="contain" />
//           </Animated.View>

//         </View>

//         {/* ── Title + subtitle ───────────────────────────────────────── */}
//         <Animated.View style={{ opacity: titleFade, transform: [{ translateY: titleSlide }] }}>
//           <Text style={[s.title, { color: colors.text }]}>Preparing fresh market</Text>
//           <Text style={[s.sub, { color: colors.textSoft }]}>
//             Plans, veggies, water and deliveries{'\n'}are getting ready.
//           </Text>
//         </Animated.View>

//         {/* ── Progress bar with shimmer ──────────────────────────────── */}
//         <View style={[s.progressTrack, { backgroundColor: colors.surfaceStrong ?? '#DDEACC' }]}>
//           <Animated.View
//             style={[s.progressFill, { backgroundColor: colors.primary, width: progressWidth }]}
//           >
//             {/* Shimmer highlight — sweeps left to right */}
//             <Animated.View style={[s.shimmer, { left: shimmerLeft }]} />
//           </Animated.View>
//         </View>

//         {/* ── Cycling status row ─────────────────────────────────────── */}
//         <Animated.View style={[s.statusRow, { opacity: statusFade }]}>
//           <MaterialCommunityIcons
//             name={STATUS[statusIdx].icon}
//             size={15}
//             color={colors.primary}
//           />
//           <Text style={[s.statusText, { color: colors.textSoft }]}>
//             {STATUS[statusIdx].text}
//           </Text>
//         </Animated.View>

//       </LinearGradient>
//     </Screen>
//   );
// }

// const s = StyleSheet.create({
//   wrap: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 24,
//   },

//   // ── Logo zone ──────────────────────────────────────────────────────────
//   logoZone: {
//     width: 200,
//     height: 200,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 36,
//   },
//   particle: {
//     position: 'absolute',
//   },
//   glow: {
//     position: 'absolute',
//     width: 142,
//     height: 142,
//     borderRadius: 71,
//   },
//   ringOuter: {
//     position: 'absolute',
//     width: 192,
//     height: 192,
//     borderRadius: 96,
//     borderWidth: 1.5,
//     borderLeftColor: 'transparent',
//     borderRightColor: 'transparent',
//   },
//   ringMid: {
//     position: 'absolute',
//     width: 164,
//     height: 164,
//     borderRadius: 82,
//     borderWidth: 3,
//     borderTopColor: 'transparent',
//     borderLeftColor: 'transparent',
//   },
//   ringInner: {
//     position: 'absolute',
//     width: 144,
//     height: 144,
//     borderRadius: 72,
//     borderWidth: 2,
//     borderBottomColor: 'transparent',
//     borderRightColor: 'transparent',
//   },
//   logoShell: {
//     width: 130,
//     height: 130,
//     borderRadius: 44,
//     backgroundColor: 'rgba(255, 252, 244, 0.95)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#2B2112',
//     shadowOffset: { width: 0, height: 16 },
//     shadowOpacity: 0.14,
//     shadowRadius: 24,
//     elevation: 8,
//   },
//   logo: { width: 100, height: 80 },

//   // ── Text ───────────────────────────────────────────────────────────────
//   title: {
//     fontSize: 24,
//     lineHeight: 30,
//     fontWeight: '900',
//     textAlign: 'center',
//     marginBottom: 8,
//   },
//   sub: {
//     fontSize: 13,
//     lineHeight: 20,
//     fontWeight: '700',
//     textAlign: 'center',
//     marginBottom: 26,
//   },

//   // ── Progress ───────────────────────────────────────────────────────────
//   progressTrack: {
//     width: '100%',
//     maxWidth: 270,
//     height: 8,
//     borderRadius: 99,
//     overflow: 'hidden',
//   },
//   progressFill: {
//     height: '100%',
//     borderRadius: 99,
//     overflow: 'hidden',
//   },
//   shimmer: {
//     position: 'absolute',
//     top: 0,
//     bottom: 0,
//     width: '30%',
//     backgroundColor: 'rgba(255, 255, 255, 0.38)',
//     borderRadius: 99,
//     transform: [{ skewX: '-15deg' }],
//   },

//   // ── Status ─────────────────────────────────────────────────────────────
//   statusRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 7,
//     marginTop: 14,
//   },
//   statusText: {
//     fontSize: 12,
//     fontWeight: '800',
//   },
// });



import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import { themeTokens } from '../constants/theme';
import { useAppStore } from '../store/UseAppStore';

const brandLogo = require('../../assets/rambhaji01.png');

// 5 status messages — each shown for ~330ms to fill the 1650ms window
const STATUS = [
  { icon: 'leaf',                   text: 'Checking fresh harvest'      },
  { icon: 'truck-delivery-outline', text: 'Loading delivery routes'     },
  { icon: 'calendar-check-outline', text: 'Syncing subscription plans'  },
  { icon: 'water-outline',          text: 'Preparing water orders'      },
  { icon: 'check-circle-outline',   text: 'All set — ready to serve!'   },
];

// Particles distributed around a 200×200 logo zone
const PARTICLES = [
  { size: 7, top: -4,  left: 95,  delay:   0, opacity: 0.55 },
  { size: 5, top: 14,  left: 172, delay: 220, opacity: 0.38 },
  { size: 6, top: 94,  left: 188, delay: 440, opacity: 0.42 },
  { size: 8, top: 168, left: 158, delay: 110, opacity: 0.48 },
  { size: 5, top: 170, left: 30,  delay: 330, opacity: 0.32 },
  { size: 6, top: 94,  left: -4,  delay: 550, opacity: 0.36 },
];

export default function AppLoaderScreen({ navigation, route }) {
  const mode   = useAppStore((state) => state.themeMode);
  const colors = themeTokens[mode];

  // No default here on purpose — see the navigation effect below.
  // If this is undefined, AppLoader is being used as the app's cold-start
  // screen (Splash was removed from the navigator) and we decide the
  // destination from auth state instead of a hardcoded route.
  const nextRoute  = route?.params?.nextRoute;
  const nextParams = route?.params?.nextParams;

  const [statusIdx, setStatusIdx] = useState(0);

  // ── Animated values ────────────────────────────────────────────────────
  // native driver
  const spin1      = useRef(new Animated.Value(0)).current; // outer ring, slow CW
  const spin2      = useRef(new Animated.Value(0)).current; // middle ring, medium CW
  const spin3      = useRef(new Animated.Value(0)).current; // inner ring, fast CCW
  const lift       = useRef(new Animated.Value(0)).current; // logo bob
  const pulse      = useRef(new Animated.Value(0)).current; // glow scale + opacity
  const statusFade = useRef(new Animated.Value(1)).current; // status row crossfade
  const titleFade  = useRef(new Animated.Value(0)).current; // title entrance
  const titleSlide = useRef(new Animated.Value(18)).current;
  const particleAnims = useRef(PARTICLES.map(() => new Animated.Value(0))).current;

  // non-native driver (layout properties)
  const progress = useRef(new Animated.Value(0)).current;
  const shimmer  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // ── 3 rings ───────────────────────────────────────────────────────
    Animated.loop(
      Animated.timing(spin1, { toValue: 1, duration: 3400, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.timing(spin2, { toValue: 1, duration: 1600, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.timing(spin3, { toValue: 1, duration: 1050, useNativeDriver: true })
    ).start();

    // ── Logo bob ──────────────────────────────────────────────────────
    Animated.loop(
      Animated.sequence([
        Animated.timing(lift, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(lift, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    // ── Glow pulse ────────────────────────────────────────────────────
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1350, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1350, useNativeDriver: true }),
      ])
    ).start();

    // ── Progress bar (non-native) ─────────────────────────────────────
    Animated.timing(progress, {
      toValue: 1, duration: 1450, useNativeDriver: false,
    }).start();

    // ── Shimmer (non-native) ──────────────────────────────────────────
    Animated.loop(
      Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: false })
    ).start();

    // ── Title entrance (delayed so it doesn't pop instantly) ──────────
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(titleFade,  { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.spring(titleSlide, { toValue: 0, friction: 7, tension: 50, useNativeDriver: true }),
      ]).start();
    }, 200);

    // ── Floating particles (staggered) ────────────────────────────────
    particleAnims.forEach((anim, i) => {
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: 1, duration: 1100 + i * 130, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0, duration: 1100 + i * 130, useNativeDriver: true }),
          ])
        ).start();
      }, PARTICLES[i].delay);
    });

    // ── Cycling status messages ───────────────────────────────────────
    const interval = setInterval(() => {
      Animated.timing(statusFade, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
        setStatusIdx((i) => (i + 1) % STATUS.length);
        Animated.timing(statusFade, { toValue: 1, duration: 240, useNativeDriver: true }).start();
      });
    }, 330);

    // ── Navigate when done ────────────────────────────────────────────
    let timer;
    const bootSession = async () => {
      let target = nextRoute;
      let targetParams = nextParams;

      // Cold start: nothing told AppLoader where to go, so decide here —
      if (!target) {
        const state = useAppStore.getState();
        
        try {
          const token = await state.hydrateAuth();
          if (token) {
            const { authApi } = require('../services/api/auth');
            const res = await authApi.getCurrentUser();
            if (res.success && res.user) {
              state.setUser(res.user);
              target = 'MainTabs';
            } else {
              await state.logout();
              target = 'Login';
            }
          } else {
            target = 'Login';
          }
        } catch (error) {
          console.warn('Session bootstrap failed', error);
          await state.logout();
          target = 'Login';
        }
      }

      return { target, targetParams };
    };

    const startTime = Date.now();
    bootSession().then(({ target, targetParams }) => {
      const elapsed = Date.now() - startTime;
      const delay = Math.max(0, 1650 - elapsed);
      timer = setTimeout(() => {
        navigation.reset({ index: 0, routes: [{ name: target, params: targetParams }] });
      }, delay);
    });

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived interpolations ─────────────────────────────────────────────
  const rotate1 = spin1.interpolate({ inputRange: [0, 1], outputRange: ['0deg',  '360deg']  });
  const rotate2 = spin2.interpolate({ inputRange: [0, 1], outputRange: ['0deg',  '360deg']  });
  const rotate3 = spin3.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg']  });

  const logoY     = lift.interpolate({ inputRange: [0, 1], outputRange: [0,    -9]    });
  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1,    1.14] });
  const glowAlpha = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.24, 0]    });

  const progressWidth = progress.interpolate({
    inputRange: [0, 1], outputRange: ['5%', '100%'],
  });
  const shimmerLeft = shimmer.interpolate({
    inputRange: [0, 1], outputRange: ['-30%', '130%'],
  });

  return (
    <Screen scroll={false}>
      <LinearGradient colors={['#FFF9EA', '#E7F3DC', '#FFFFFF']} style={s.wrap}>

        {/* ── Logo zone ──────────────────────────────────────────────── */}
        <View style={s.logoZone}>

          {/* Floating particles — orbit the outer ring */}
          {PARTICLES.map((p, i) => (
            <Animated.View
              key={i}
              style={[
                s.particle,
                {
                  width: p.size, height: p.size,
                  borderRadius: p.size / 2,
                  top: p.top, left: p.left,
                  backgroundColor: colors.primary,
                  opacity: p.opacity,
                  transform: [{
                    translateY: particleAnims[i].interpolate({
                      inputRange: [0, 1], outputRange: [0, -14],
                    }),
                  }],
                },
              ]}
            />
          ))}

          {/* Expanding glow — pulses from behind the logo */}
          <Animated.View style={[
            s.glow,
            {
              backgroundColor: colors.primary,
              opacity:   glowAlpha,
              transform: [{ scale: glowScale }],
            },
          ]} />

          {/* Outer ring — slowest, faint, left+right sides hidden */}
          <Animated.View style={[
            s.ringOuter,
            { borderColor: colors.primary + '55', transform: [{ rotate: rotate1 }] },
          ]} />

          {/* Middle ring — existing speed, top+left sides hidden */}
          <Animated.View style={[
            s.ringMid,
            { borderColor: colors.primary, transform: [{ rotate: rotate2 }] },
          ]} />

          {/* Inner ring — fastest, counter-clockwise, bottom+right hidden */}
          <Animated.View style={[
            s.ringInner,
            { borderColor: colors.primary + 'CC', transform: [{ rotate: rotate3 }] },
          ]} />

          {/* Logo shell — bobs up and down */}
          <Animated.View style={[s.logoShell, { transform: [{ translateY: logoY }] }]}>
            <Image source={brandLogo} style={s.logo} contentFit="contain" />
          </Animated.View>

        </View>

        {/* ── Title + subtitle ───────────────────────────────────────── */}
        <Animated.View style={{ opacity: titleFade, transform: [{ translateY: titleSlide }] }}>
          <Text style={[s.title, { color: colors.text }]}>Preparing fresh market</Text>
          <Text style={[s.sub, { color: colors.textSoft }]}>
            Plans, veggies, water and deliveries{'\n'}are getting ready.
          </Text>
        </Animated.View>

        {/* ── Progress bar with shimmer ──────────────────────────────── */}
        <View style={[s.progressTrack, { backgroundColor: colors.surfaceStrong ?? '#DDEACC' }]}>
          <Animated.View
            style={[s.progressFill, { backgroundColor: colors.primary, width: progressWidth }]}
          >
            {/* Shimmer highlight — sweeps left to right */}
            <Animated.View style={[s.shimmer, { left: shimmerLeft }]} />
          </Animated.View>
        </View>

        {/* ── Cycling status row ─────────────────────────────────────── */}
        <Animated.View style={[s.statusRow, { opacity: statusFade }]}>
          <MaterialCommunityIcons
            name={STATUS[statusIdx].icon}
            size={15}
            color={colors.primary}
          />
          <Text style={[s.statusText, { color: colors.textSoft }]}>
            {STATUS[statusIdx].text}
          </Text>
        </Animated.View>

      </LinearGradient>
    </Screen>
  );
}

const s = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  // ── Logo zone ──────────────────────────────────────────────────────────
  logoZone: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  particle: {
    position: 'absolute',
  },
  glow: {
    position: 'absolute',
    width: 142,
    height: 142,
    borderRadius: 71,
  },
  ringOuter: {
    position: 'absolute',
    width: 192,
    height: 192,
    borderRadius: 96,
    borderWidth: 1.5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  ringMid: {
    position: 'absolute',
    width: 164,
    height: 164,
    borderRadius: 82,
    borderWidth: 3,
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  ringInner: {
    position: 'absolute',
    width: 144,
    height: 144,
    borderRadius: 72,
    borderWidth: 2,
    borderBottomColor: 'transparent',
    borderRightColor: 'transparent',
  },
  logoShell: {
    width: 130,
    height: 130,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 252, 244, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2B2112',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
  logo: { width: 100, height: 80 },

  // ── Text ───────────────────────────────────────────────────────────────
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  sub: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 26,
  },

  // ── Progress ───────────────────────────────────────────────────────────
  progressTrack: {
    width: '100%',
    maxWidth: 270,
    height: 8,
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '30%',
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
    borderRadius: 99,
    transform: [{ skewX: '-15deg' }],
  },

  // ── Status ─────────────────────────────────────────────────────────────
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 14,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
});