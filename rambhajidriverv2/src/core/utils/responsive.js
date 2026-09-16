// src/core/utils/responsive.js
// Modular responsive scaling utility for Ram Bhaji App
// Exports scale, verticalScale, and moderateScale to standardize spacing & typography

import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

export const s = (size) => scale(size);
export const vs = (size) => verticalScale(size);
export const ms = (size, factor = 0.5) => moderateScale(size, factor);

// Consistent default responsive spacing constraints (Material Design 3 & Apple Human Interface standards)
export const RESPONSIVE_SPACING = {
  horizontal: s(16),
  vertical: vs(12),
  cardRadius: s(20),
  gap: s(12),
};
