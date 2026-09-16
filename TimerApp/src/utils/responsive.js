import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Base guideline dimensions based on standard mobile phone (e.g. iPhone 11 / Galaxy A series)
const GUIDELINE_BASE_WIDTH = 375;

/**
 * Hook providing responsive device characteristics and safe insets.
 * Updates dynamically on orientation change or window resize.
 */
export function useResponsive() {
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const isLandscape = width > height;
    const isTablet = (isLandscape ? height : width) >= 600 || width >= 768;
    const isSmallPhone = width < 360 || height < 680;
    const isMediumPhone = !isSmallPhone && !isTablet;

    // Scale font size moderately to prevent tiny text on small devices or oversized text on tablets
    const scaleFont = (size, factor = 0.5) => {
        const scale = width / GUIDELINE_BASE_WIDTH;
        const newSize = size + (scale - 1) * size * factor;
        if (isTablet) {
            return Math.min(newSize, size * 1.25);
        }
        return Math.max(Math.min(newSize, size * 1.15), size * 0.85);
    };

    // Calculate maximum content width for centered containers (cards, modals, dashboard content)
    const contentMaxWidth = isTablet ? 860 : (isLandscape ? 560 : '100%');
    const formMaxWidth = isTablet ? 440 : (isLandscape ? 400 : '100%');
    const modalMaxWidth = isTablet ? 540 : (isLandscape ? 480 : '100%');

    return {
        width,
        height,
        insets,
        isLandscape,
        isTablet,
        isSmallPhone,
        isMediumPhone,
        scaleFont,
        contentMaxWidth,
        formMaxWidth,
        modalMaxWidth,
    };
}

/**
 * Pure scale helpers when hook isn't convenient
 */
export const scaleFactor = (dimension, base) => dimension / base;
