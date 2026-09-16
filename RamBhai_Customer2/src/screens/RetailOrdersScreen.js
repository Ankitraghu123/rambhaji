import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, RefreshControl, ActivityIndicator, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../store/UseAppStore';
import { themeTokens } from '../constants/theme';
import Screen from '../components/Screen';
import Card from '../components/Card';
import ThemeHeader from '../components/ThemeHeader';
import Badge from '../components/Badge';
import { retailApi } from '../services/api/retail';
import { formatINR } from '../utils/format';

function AnimatedRow({ children, index }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 340,
      delay: index * 70,
      useNativeDriver: true,
    }).start();
  }, [anim, index]);
  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

export default function RetailOrdersScreen({ navigation }) {
  const mode = useAppStore((s) => s.themeMode);
  const colors = themeTokens[mode];

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await retailApi.getOrders();
      if (res.success && res.orders) {
        setOrders(res.orders);
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.warn('Failed to fetch retail orders:', e);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusTone = (status) => {
    const s = status.toLowerCase();
    if (s === 'delivered') return 'success';
    if (s === 'pending') return 'info';
    if (s === 'failed' || s === 'cancelled') return 'danger';
    return 'primary';
  };

  return (
    <Screen>
      <ThemeHeader
        title="My Orders"
        subtitle="Track your recent retail and one-time orders."
        icon="cart-outline"
        badge="Retail"
        compact
      />

      {loading ? (
        <View style={s.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {orders.length === 0 ? (
            <View style={[s.emptyState, { borderColor: colors.border }]}>
              <MaterialCommunityIcons name="cart-off" size={38} color={colors.textSoft} />
              <Text style={[s.emptyTitle, { color: colors.text }]}>No orders found</Text>
              <Text style={[s.emptyBody, { color: colors.textSoft }]}>
                You haven't placed any retail orders yet.
              </Text>
            </View>
          ) : (
            <View style={s.list}>
              {orders.map((order, idx) => {
                const dateStr = new Date(order.delivery_date || order.created_at).toDateString();
                return (
                  <AnimatedRow key={order.id} index={idx}>
                    <Pressable onPress={() => navigation.navigate('RetailOrderDetail', { order })}>
                      <Card style={{ marginBottom: 12 }}>
                        <View style={s.cardHeader}>
                          <View>
                            <Text style={[s.orderId, { color: colors.text }]}>Order #{order.id}</Text>
                            <Text style={[s.orderDate, { color: colors.textSoft }]}>{dateStr}</Text>
                          </View>
                          <Badge label={order.delivery_status || 'Pending'} tone={getStatusTone(order.delivery_status || 'Pending')} />
                        </View>

                        <View style={[s.divider, { backgroundColor: colors.border }]} />

                        <View style={s.itemsList}>
                          {(order.Items || []).map((item, i) => {
                            const rawUnit = (item.Product?.unit || 'gm').toLowerCase();
                            let displayQty = `${item.quantity} ${rawUnit}`;
                            if (rawUnit === 'g' || rawUnit === 'gm' || rawUnit === 'gram' || rawUnit === 'grams' || rawUnit.includes('kg')) {
                               const q = parseFloat(item.quantity) || 0;
                               if (q >= 1000) displayQty = `${q / 1000} kg`;
                               else displayQty = `${q} gm`;
                            }
                            return (
                              <View key={i} style={s.itemRow}>
                                <View style={{ flex: 1 }}>
                                  <Text style={[s.itemName, { color: colors.text }]}>
                                    {item.Product?.name || 'Product'} {item.Product?.hindi_name ? `(${item.Product.hindi_name})` : ''}
                                  </Text>
                                  <Text style={[s.itemQty, { color: colors.textSoft }]}>
                                    {displayQty}
                                  </Text>
                                </View>
                                <Text style={[s.itemPrice, { color: colors.text }]}>
                                  {formatINR(item.total_price || 0)}
                                </Text>
                              </View>
                            );
                          })}
                        </View>

                        <View style={[s.divider, { backgroundColor: colors.border }]} />
                        
                        <View style={s.footer}>
                          <View style={{ flex: 1, marginRight: 16 }}>
                            <Text style={[s.addressLabel, { color: colors.textSoft }]}>Delivering to</Text>
                            <Text style={[s.addressText, { color: colors.text }]} numberOfLines={1}>
                              {order.Address ? `${order.Address.address_line}, ${order.Address.city}` : 'No address provided'}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[s.totalLabel, { color: colors.textSoft }]}>Total</Text>
                            <Text style={[s.totalAmount, { color: colors.primary }]}>{formatINR(order.total_amount)}</Text>
                          </View>
                        </View>
                      </Card>
                    </Pressable>
                  </AnimatedRow>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  list: { gap: 4 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderRadius: 20,
    borderStyle: 'dashed',
    marginTop: 20,
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: '900', marginTop: 4 },
  emptyBody: { fontSize: 13, fontWeight: '500', textAlign: 'center', lineHeight: 19 },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { fontSize: 16, fontWeight: '900' },
  orderDate: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  
  divider: { height: 1, marginVertical: 14, opacity: 0.6 },
  
  itemsList: { gap: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemName: { fontSize: 14, fontWeight: '800' },
  itemQty: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  itemPrice: { fontSize: 15, fontWeight: '800' },
  
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  addressLabel: { fontSize: 11, fontWeight: '700' },
  addressText: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  totalLabel: { fontSize: 11, fontWeight: '700' },
  totalAmount: { fontSize: 18, fontWeight: '900', marginTop: 1 },
});
