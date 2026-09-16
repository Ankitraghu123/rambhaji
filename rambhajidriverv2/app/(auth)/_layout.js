// app/(auth)/_layout.js
// Auth route group layout — redirects authenticated users away from login

import { Redirect, Stack } from 'expo-router';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../../src/features/auth/state/authSlice';

export default function AuthLayout() {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
  );
}
