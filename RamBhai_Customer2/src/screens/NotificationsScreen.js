import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Image, ScrollView, Switch, TextInput, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { useAppStore } from '../store/UseAppStore';
import { themeTokens, radius } from '../constants/theme';
import Screen from '../components/Screen';
import Card from '../components/Card';
import ThemeHeader from '../components/ThemeHeader';
import AppButton from '../components/AppButton';
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
  deliveries, walletTransactions, notifications, supportTickets, userProfile, menuItems,
  addressBook, fixedVeggies, pickupRules
} from '../data/mockData';
import { formatINR } from '../utils/format';

export default function NotificationsScreen({ navigation }) {
  const mode = useAppStore((s) => s.themeMode);
  const colors = themeTokens[mode];
  const [serverNotifications, setServerNotifications] = useState([]);

  useEffect(() => {
    const { notificationsApi } = require('../services/api/notifications');
    notificationsApi.getNotifications().then(res => {
      if (res.success) setServerNotifications(res.notifications || res.data || []);
    }).catch(e => console.warn('Fetch notifications failed', e));
  }, []);

  const notificationsList = serverNotifications.length > 0 ? serverNotifications : notifications;

  const handleMarkRead = async (id) => {
    try {
      const { notificationsApi } = require('../services/api/notifications');
      await notificationsApi.markRead(id);
      setServerNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true, unread: false } : n));
    } catch (e) {
      console.warn('Failed to mark read', e);
    }
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <ThemeHeader
          title="Notification pulse"
          subtitle="Delivery updates, wallet alerts and support replies with clear priority signals."
          icon="bell-badge-outline"
          badge="Live alerts"
          compact
        />

        {notificationsList.map((item) => (
          <Pressable key={item.id} onPress={() => item.unread && handleMarkRead(item.id)}>
            <Card>
              <View style={s.row}>
                <View style={[s.dot, { backgroundColor: item.unread ? colors.primary : colors.border }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.itemTitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[s.itemMsg, { color: colors.textSoft }]}>{item.message}</Text>
                </View>
                <Badge label={item.type || 'info'} tone={item.type === 'danger' ? 'danger' : item.type === 'warning' ? 'warning' : 'primary'} />
              </View>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '900' },
  sub: { marginTop: 6, marginBottom: 18, fontSize: 13, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 99 },
  itemTitle: { fontSize: 15, fontWeight: '800' },
  itemMsg: { marginTop: 4, fontSize: 12, lineHeight: 18 }
});
