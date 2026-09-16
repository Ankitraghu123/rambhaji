/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const ThemeColors = {
  royalBlue: '#273AF8',      // Electric Royal/Deep Blue (Primary)
  magenta: '#EA33FF',        // Neon Pink / Magenta (Accent & Highlights)
  skyBlue: '#33C3FF',        // Bright Sky Blue (Secondary Highlight & Timers)
  royalBlueLight: '#EEF0FE', // Light Royal Blue for badges & card highlights
  magentaLight: '#FDF0FF',   // Light Magenta for warning/special badges
  skyBlueLight: '#EBF8FF',   // Light Sky Blue for bucket sections & inputs
  royalBlueBorder: '#CCD2FC',
  magentaBorder: '#F5B8FC',
  skyBlueBorder: '#BAEAFF',
};

export const PRIMARY_COLOR = ThemeColors.royalBlue;
export const ACCENT_COLOR = ThemeColors.magenta;
export const SECONDARY_COLOR = ThemeColors.skyBlue;

const tintColorLight = ThemeColors.royalBlue;
const tintColorDark = ThemeColors.skyBlue;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  hero: 32,
};

export const Radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 9999,
};

export const Shadows = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHover: {
    shadowColor: '#273AF8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  buttonPrimary: {
    shadowColor: '#273AF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonAccent: {
    shadowColor: '#EA33FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
};

export const Colors = {
  light: {
    text: '#0F172A',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    background: '#F8FAFC',
    card: '#FFFFFF',
    border: '#E2E8F0',
    primary: ThemeColors.royalBlue,
    secondary: ThemeColors.magenta,
    accent: ThemeColors.skyBlue,
    tint: tintColorLight,
    icon: ThemeColors.royalBlue,
    link: ThemeColors.royalBlue,
    success: '#10B981',
    danger: '#EF4444',
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    background: '#0F172A',
    card: '#1E293B',
    border: '#334155',
    primary: ThemeColors.skyBlue,
    secondary: ThemeColors.magenta,
    accent: ThemeColors.royalBlue,
    tint: tintColorDark,
    icon: ThemeColors.skyBlue,
    link: ThemeColors.skyBlue,
    success: '#10B981',
    danger: '#EF4444',
    tabIconDefault: '#64748B',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
    brand: 'Copperplate',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
    brand: 'serif',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    brand: "Copperplate, 'Copperplate Gothic Bold', serif",
  },
});
