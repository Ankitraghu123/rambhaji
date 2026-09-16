// import React from 'react';
// import { SafeAreaView, ScrollView, View, StyleSheet } from 'react-native';
// import { useAppStore } from '../store/UseAppStore';
// import { themeTokens } from '../constants/theme';

// export default function Screen({ children, scroll = true, contentStyle, style }) {
//   const mode = useAppStore((s) => s.themeMode);
//   const colors = themeTokens[mode];

//   return (
//     <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }, style]}>
//       {scroll ? (
//         <ScrollView
//           style={{ flex: 1 }}
//           contentContainerStyle={[styles.scroll, { backgroundColor: colors.background }, contentStyle]}
//           showsVerticalScrollIndicator={false}
//         >
//           {children}
//         </ScrollView>
//       ) : (
//         <View style={[styles.view, { backgroundColor: colors.background }, contentStyle]}>
//           {children}
//         </View>
//       )}
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safe: { flex: 1 },
//   scroll: { padding: 16, paddingBottom: 30, flexGrow: 1 },
//   view: { flex: 1, padding: 16 }
// });

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BottomTabBarHeightContext } from "@react-navigation/bottom-tabs";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { homePalette, themeTokens } from "../constants/theme";

const colors = themeTokens.light;
const rootRouteNames = new Set([
  "Splash",
  "AppLoader",
  "Onboarding",
  "Login",
  "Otp",
  "Address",
  "MainTabs",
  "Home",
  "Plans",
  "Deliveries",
  "Wallet",
  "Account",
]);
const doodles = [
  {
    name: "carrot",
    size: 46,
    top: 28,
    left: -12,
    rotate: "-18deg",
    opacity: 0.1,
    color: homePalette.pink,
  },
  {
    name: "leaf",
    size: 34,
    top: 92,
    right: 24,
    rotate: "21deg",
    opacity: 0.1,
    color: homePalette.aquaDeep,
  },
  {
    name: "corn",
    size: 44,
    top: 210,
    right: -10,
    rotate: "-24deg",
    opacity: 0.1,
    color: "#F5B82E",
  },
  {
    name: "sprout",
    size: 38,
    top: 330,
    left: 18,
    rotate: "14deg",
    opacity: 0.09,
    color: homePalette.blue,
  },
  {
    name: "fruit-cherries",
    size: 34,
    bottom: 98,
    right: 30,
    rotate: "16deg",
    opacity: 0.09,
    color: homePalette.pink,
  },
  {
    name: "water-outline",
    size: 42,
    bottom: 22,
    left: -6,
    rotate: "-10deg",
    opacity: 0.1,
    color: homePalette.aqua,
  },
];

function VegetableDoodles() {
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 3600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 3600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [drift]);

  return (
    <View pointerEvents="none" style={styles.doodleLayer}>
      <LinearGradient
        colors={[
          "rgba(49,231,216,0.22)",
          "rgba(244,63,143,0.1)",
          "rgba(247,250,255,0)",
        ]}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        style={[
          styles.glowTop,
          {
            transform: [
              {
                translateY: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 10],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.glowBottom,
          {
            transform: [
              {
                translateY: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -10],
                }),
              },
            ],
          },
        ]}
      />
      {doodles.map((item) => (
        <Animated.View
          key={`${item.name}-${item.top || item.bottom}`}
          style={[
            styles.doodle,
            {
              top: item.top,
              bottom: item.bottom,
              left: item.left,
              right: item.right,
              opacity: item.opacity,
              transform: [
                {
                  translateY: drift.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, item.left != null ? -7 : 7],
                  }),
                },
                {
                  rotate: drift.interpolate({
                    inputRange: [0, 1],
                    outputRange: [
                      item.rotate,
                      item.left != null ? "7deg" : "-7deg",
                    ],
                  }),
                },
              ],
            },
          ]}
        >
          <MaterialCommunityIcons
            name={item.name}
            size={item.size}
            color={item.color}
          />
        </Animated.View>
      ))}
    </View>
  );
}

function BackButton({ navigation }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={8}
      onPress={() => navigation.goBack()}
      style={({ pressed }) => [
        styles.backButton,
        {
          opacity: pressed ? 0.78 : 1,
          transform: [
            { translateY: pressed ? 1 : 0 },
            { scale: pressed ? 0.98 : 1 },
          ],
        },
      ]}
    >
      <View style={styles.backIcon}>
        <MaterialCommunityIcons
          name="arrow-left"
          size={20}
          color={colors.primary}
        />
      </View>
      <Text style={styles.backText}>Back</Text>
    </Pressable>
  );
}

export default function Screen({
  children,
  scroll = true,
  style,
  showBack = true,
}) {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const shouldShowBack =
    showBack && navigation.canGoBack() && !rootRouteNames.has(route.name);
  
  // Tab screens where the floating tab bar overlaps content:
  // Tab bar = 64px height + max(insets.bottom, 10) bottom offset + 24 breathing room
  const TAB_SCREEN_NAMES = ["Home", "Plans", "Deliveries", "Wallet", "Account"];
  const isTabScreen = TAB_SCREEN_NAMES.includes(route.name);
  const tabBarClearance = isTabScreen
    ? 64 + Math.max(insets.bottom, 10) + 24
    : 0;

  if (scroll) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top", "left", "right"]}
      >
        <VegetableDoodles />
        <KeyboardAwareScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, style]}
          showsVerticalScrollIndicator={false}
          enableOnAndroid={true}
          keyboardShouldPersistTaps="handled"
          extraScrollHeight={20}
        >
          {shouldShowBack && <BackButton navigation={navigation} />}
          {children}
          {/* Physical spacer to push content above the floating tab bar */}
          {tabBarClearance > 0 && <View style={{ height: tabBarClearance }} />}
        </KeyboardAwareScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right"]}
    >
      <VegetableDoodles />
      <View style={[styles.flex, styles.content, style, tabBarClearance > 0 && { paddingBottom: tabBarClearance }]}>
        {shouldShowBack && <BackButton navigation={navigation} />}
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: "hidden",
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 30,
  },
  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 42,
    paddingLeft: 6,
    paddingRight: 14,
    marginBottom: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(23,124,255,0.18)",
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    shadowColor: homePalette.blue,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 4,
  },
  backIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E7F1FF",
  },
  backText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "900",
  },
  doodleLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  glowTop: {
    position: "absolute",
    top: -88,
    right: -82,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: homePalette.aqua,
    opacity: 0.2,
  },
  glowBottom: {
    position: "absolute",
    bottom: -104,
    left: -96,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: homePalette.pink,
    opacity: 0.13,
  },
  doodle: {
    position: "absolute",
  },
});
