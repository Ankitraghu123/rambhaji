// app/_layout.js
// Root application layout — providers, fonts, security, network monitor

import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { store } from '../src/store';
import { theme } from '../src/config/theme';
import NetworkMonitor from '../src/core/network/NetworkMonitor';
import { attachRefreshInterceptor } from '../src/core/network/refreshInterceptor';
import apiClient from '../src/core/network/apiClient';
import NotificationService from '../src/features/notifications/services/NotificationService';
import OfflineScreenModal from '../src/components/common/OfflineScreenModal';
import ServerErrorModal from '../src/components/common/ServerErrorModal';

// Attach JWT refresh interceptor once
attachRefreshInterceptor(apiClient);

function RootLayoutContent() {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F8F6" />
      <Stack screenOptions={{ headerShown: false }} />
      <OfflineScreenModal />
      <ServerErrorModal />
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    // Initialize network monitor
    NetworkMonitor.initialize();

    // Initialize real push notification listeners
    const cleanupNotifications = NotificationService.initialize();

    return () => {
      NetworkMonitor.destroy();
      if (typeof cleanupNotifications === 'function') {
        cleanupNotifications();
      }
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PaperProvider theme={theme}>
          <RootLayoutContent />
        </PaperProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
