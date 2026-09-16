import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme as NavigationLightTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import * as Linking from 'expo-linking';

import RootNavigator from './src/navigation/RootNavigator';
import { themeTokens } from './src/constants/theme';

SplashScreen.setOptions({
  duration: 900,
  fade: true,
});

SystemUI.setBackgroundColorAsync(themeTokens.light.background);

export default function App() {
  const colors = themeTokens.light;
  const navTheme = {
    ...NavigationLightTheme,
    colors: {
      ...NavigationLightTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.danger
    }
  };

  const linking = {
    prefixes: [Linking.createURL('/'), 'vsms://'],
    config: {
      screens: {
        Register: 'register',
      },
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer theme={navTheme} linking={linking}>
          <StatusBar style="dark" backgroundColor={colors.background} />
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

