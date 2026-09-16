import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useAppStore } from '../store/UseAppStore';
import { themeTokens } from '../constants/theme';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Input from '../components/Input';
import AppButton from '../components/AppButton';
import { authApi } from '../services/api/auth';
import ThemeHeader from '../components/ThemeHeader';

export default function SettingsScreen() {
  const mode = useAppStore((s) => s.themeMode);
  const colors = themeTokens[mode];

  const [user, setUser] = useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await authApi.getCurrentUser();
        if (res.success && res.user) {
          setUser({
            name: res.user.name || '',
            email: res.user.email || '',
            phone: res.user.phone || ''
          });
        }
      } catch (error) {
        console.log('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  return (
    <Screen>
      <ThemeHeader
        title="Personal Information"
        subtitle="Manage your account details and preferences."
        icon="account-outline"
        badge="Profile"
        compact
      />

      {loading ? (
        <View style={{ marginTop: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <Card>
          <Input 
            label="Name" 
            value={user.name} 
            editable={false} 
          />
          <Input 
            label="Email" 
            value={user.email} 
            editable={false} 
          />
          <Input 
            label="Phone" 
            value={user.phone ? `+91 ${user.phone}` : ''} 
            editable={false} 
          />
        </Card>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '900' },
  sub: { marginTop: 6, marginBottom: 18, fontSize: 13, lineHeight: 20 }
});
