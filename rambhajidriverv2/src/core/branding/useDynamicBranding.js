import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import DynamicBrandingService from './DynamicBrandingService';
import { selectDriver } from '../../features/auth/state/authSlice';

export function useDynamicBranding() {
  const [activeTheme, setActiveTheme] = useState(DynamicBrandingService.activeTheme);
  const driver = useSelector(selectDriver);
  const isDarkMode = driver?.darkMode || false;

  useEffect(() => {
    // Subscribe to branding service updates
    const unsubscribe = DynamicBrandingService.subscribe((newTheme) => {
      setActiveTheme(newTheme);
    });

    return () => unsubscribe();
  }, []);

  const triggerConfigSync = () => {
    return DynamicBrandingService.checkForBrandingUpdates();
  };

  const setOverrideEvent = (eventId) => {
    DynamicBrandingService.setOverrideEvent(eventId);
  };

  const getOverrideEventId = () => {
    return DynamicBrandingService.getOverrideEventId();
  };

  const getBrandingLogs = () => {
    return DynamicBrandingService.getLogs();
  };

  const clearBrandingLogs = () => {
    DynamicBrandingService.clearLogs();
  };

  const baseColors = activeTheme.colors;
  
  // Dynamic Light Ice Blue 3-Color Palette mapping
  const themeColors = isDarkMode
    ? {
        ...baseColors,
        primary: '#00B4D8',
        secondary: '#E024E3',
        tertiary: '#1D4ED8',
        gradient: ['#1D4ED8', '#00B4D8', '#E024E3'],
        background: '#0B132B',
        surface: '#1C2541',
        text: '#F8FAFC',
        headerBg: '#0F172A',
        accent: '#E024E3',
        skyBlue: '#00B4D8',
        magentaPink: '#E024E3',
        royalBlue: '#1D4ED8',
        border: '#00B4D8',
        subtext: '#94A3B8',
        cardBg: '#1C2541',
        textLight: '#94A3B8',
        isDark: true,
      }
    : {
        ...baseColors,
        primary: '#00B4D8',
        secondary: '#E024E3',
        tertiary: '#1D4ED8',
        gradient: ['#1D4ED8', '#00B4D8', '#E024E3'],
        background: '#F0F7FF',    // Soft Ice Blue Background
        surface: '#FFFFFF',       // Clean Card Surface
        cardBg: 'rgba(240, 247, 255, 0.96)',
        text: '#0F172A',
        headerBg: '#F0F7FF',
        accent: '#E024E3',
        skyBlue: '#00B4D8',
        magentaPink: '#E024E3',
        royalBlue: '#1D4ED8',
        border: '#00B4D8',        // Sky Blue Border
        subtext: '#64748B',
        textLight: '#64748B',
        isDark: false,
      };

  return {
    activeTheme,
    themeColors,
    logoConfig: activeTheme.logo,
    mascotConfig: activeTheme.mascot,
    overlayConfig: activeTheme.overlay,
    triggerConfigSync,
    setOverrideEvent,
    getOverrideEventId,
    getBrandingLogs,
    clearBrandingLogs,
  };
}
