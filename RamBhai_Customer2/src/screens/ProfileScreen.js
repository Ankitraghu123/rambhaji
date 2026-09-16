import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Image, ScrollView, TextInput, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { useAppStore } from '../store/UseAppStore';
import { themeTokens, radius } from '../constants/theme';
import Screen from '../components/Screen';
import Card from '../components/Card';
import AppButton from '../components/AppButton';
import ThemeHeader from '../components/ThemeHeader';
import SectionHeader from '../components/SectionHeader';
import Badge from '../components/Badge';
import Input from '../components/Input';
import QuantityStepper from '../components/QuantityStepper';
import PlanCard from '../components/PlanCard';
import ProductCard from '../components/ProductCard';
import DeliveryCard from '../components/DeliveryCard';
import TransactionRow from '../components/TransactionRow';
import MenuRow from '../components/MenuRow';
import {
  subscriptionPlans, basketPlans, freshVeggies, waterProducts, retailProducts,
  deliveries, walletTransactions, notifications, supportTickets, menuItems,
  addressBook, fixedVeggies, pickupRules
} from '../data/mockData';
import { formatINR } from '../utils/format';
import { authApi } from '../services/api/auth';

export default function ProfileScreen({ navigation }) {
  const logout = useAppStore((s) => s.logout);
  const colors = themeTokens.light;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await authApi.getCurrentUser();
        if (res.success && res.user) {
          setUser(res.user);
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
        title="Account cockpit"
        subtitle="Profile, addresses, subscriptions and support links in one polished space."
        icon="account-circle-outline"
        badge="Member profile"
        compact
      />

      <Card>
        <View style={s.profileTop}>
          <View style={[s.avatar, { backgroundColor: colors.primarySoft }]}>
            <MaterialCommunityIcons name="account-heart-outline" size={34} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.name, { color: colors.text }]}>{user ? user.name : 'Loading...'}</Text>
            <Text style={[s.phone, { color: colors.textSoft }]}>{user ? `+91 ${user.phone}` : ''}</Text>
            {user && user.email ? <Text style={[s.addr, { color: colors.textSoft }]}>{user.email}</Text> : null}
          </View>
        </View>
      </Card>

      <Card>
        {menuItems.map((item) => (
          <MenuRow
            key={item.label}
            label={item.label}
            icon={item.icon}
            onPress={() => navigation.navigate(item.route, item.params)}
          />
        ))}
      </Card>

     {/* <Card>
        <View style={s.themeRow}>
          <View style={{ flex: 1 }}>
            <Text style={[s.name, { color: colors.text }]}>Light theme</Text>
            <Text style={[s.phone, { color: colors.textSoft }]}>Fresh green app appearance stays fixed.</Text>
          </View>
          <MaterialCommunityIcons name="check-circle" size={26} color={colors.primary} />
        </View>
      </Card> */}

      <AppButton
        title="Logout"
        variant="secondary"
        onPress={() => {
          logout();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }}
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '900' },
  sub: { marginTop: 6, marginBottom: 18, fontSize: 13, lineHeight: 20 },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 76, height: 76, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 18, fontWeight: '900' },
  phone: { marginTop: 3, fontSize: 12 },
  addr: { marginTop: 5, fontSize: 12 },
  themeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }
});
