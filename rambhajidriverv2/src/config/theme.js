// src/config/theme.js
// React Native Paper theme for Ram Bhaji Driver App
// Signature 3-color palette: Sky Blue (#00B4D8), Neon Magenta Pink (#E024E3), and Royal Electric Blue (#1D4ED8)

import { MD3LightTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary:          '#00B4D8',   // Sky Blue / Cyan
    onPrimary:        '#FFFFFF',
    primaryContainer: '#E0F2FE',   // Light Sky Blue container
    onPrimaryContainer: '#00B4D8',
    secondary:        '#E024E3',   // Neon Magenta Pink
    onSecondary:      '#FFFFFF',
    secondaryContainer: '#FCE7F3', // Light Magenta Pink container
    onSecondaryContainer: '#E024E3',
    tertiary:         '#1D4ED8',   // Royal Electric Blue
    onTertiary:       '#FFFFFF',
    tertiaryContainer: '#DBEAFE',  // Light Royal Blue container
    onTertiaryContainer: '#1D4ED8',
    error:            '#EF4444',
    onError:          '#FFFFFF',
    background:       '#F0F7FF',   // Soft Ice Blue Tinted Background
    onBackground:     '#0F172A',   // Dark Charcoal text
    surface:          '#FFFFFF',   // Surface
    onSurface:        '#0F172A',   // Dark text
    surfaceVariant:   '#F0F9FF',
    onSurfaceVariant: '#64748B',   // Muted gray for sub-labels
    outline:          '#00B4D8',   // Sky Blue border
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level0: 'transparent',
      level1: '#FFFFFF',
      level2: '#F0F7FF',
      level3: '#E0F2FE',
    },
  },
  fonts: {
    ...MD3LightTheme.fonts,
    bodyLarge:  { ...MD3LightTheme.fonts.bodyLarge,  fontFamily: 'System' },
    bodyMedium: { ...MD3LightTheme.fonts.bodyMedium, fontFamily: 'System' },
    labelLarge: { ...MD3LightTheme.fonts.labelLarge, fontFamily: 'System' },
    titleLarge: { ...MD3LightTheme.fonts.titleLarge, fontFamily: 'System' },
  },
};
