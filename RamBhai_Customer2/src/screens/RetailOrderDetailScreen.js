import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../store/UseAppStore';
import { themeTokens, radius, spacing, font } from '../constants/theme';
import Screen from '../components/Screen';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import { formatINR } from '../utils/format';

export default function RetailOrderDetailScreen({ route, navigation }) {
  const mode = useAppStore((state) => state.themeMode);
  const colors = themeTokens[mode];
  const { order } = route.params;

  if (!order) {
    return (
      <Screen>
        <Text style={{ color: colors.text }}>Order not found.</Text>
      </Screen>
    );
  }

  // Derived Values
  const deliveryStatus = order.delivery_status || 'pending';
  const deliveryDateStr = order.delivery_date ? new Date(order.delivery_date).toDateString() : 'TBD';
  
  const paymentMethod = order.payment_method?.toUpperCase() || 'N/A';
  const paymentStatus = order.payment_status || 'pending';
  
  const totalAmount = parseFloat(order.total_amount) || 0;
  const deliveryCharge = parseFloat(order.delivery_charge) || 0;
  const itemsSubtotal = totalAmount - deliveryCharge;
  
  const address = order.Address || {};
  const fullAddress = [
    address.address_line,
    address.landmark ? `Near ${address.landmark}` : null,
    address.city,
    address.pincode
  ].filter(Boolean).join(', ');

  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'delivered': return colors.success;
      case 'cancelled': return colors.danger;
      default: return colors.primary;
    }
  };

  const statusColor = getStatusColor(deliveryStatus);

  // Formatting Quantity correctly
  const formatOrderQty = (item) => {
    const rawUnit = (item.Product?.unit || 'pc').toLowerCase();
    const qty = parseFloat(item.quantity) || 0;
    
    // For Retail API, quantity comes in as kg for weight items or piece count.
    if (rawUnit === 'g' || rawUnit === 'gm' || rawUnit === 'gram' || rawUnit === 'grams' || rawUnit.includes('kg')) {
      if (qty >= 1000) {
        return `${qty / 1000} kg`;
      }
      return `${qty} gm`;
    }
    return `${qty} ${rawUnit}`;
  };

  return (
    <Screen scroll={true}>
      <View style={s.header}>
        <View>
          <Text style={[s.orderId, { color: colors.text }]}>Order #{order.id}</Text>
          <Text style={[s.orderDate, { color: colors.textSoft }]}>Placed on {new Date(order.created_at).toDateString()}</Text>
        </View>
        <View style={[s.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[s.statusText, { color: statusColor }]}>{deliveryStatus.toUpperCase()}</Text>
        </View>
      </View>

      <Card style={s.card}>
        <SectionHeader title="Delivery Details" />
        <View style={s.row}>
          <MaterialCommunityIcons name="calendar-clock" size={20} color={colors.textSoft} />
          <View style={s.rowContent}>
            <Text style={[s.label, { color: colors.textSoft }]}>Expected Delivery</Text>
            <Text style={[s.value, { color: colors.text }]}>{deliveryDateStr}</Text>
          </View>
        </View>
        
        <View style={s.divider} />
        
        <View style={s.row}>
          <MaterialCommunityIcons name="map-marker-outline" size={20} color={colors.textSoft} />
          <View style={s.rowContent}>
            <Text style={[s.label, { color: colors.textSoft }]}>Delivery Address</Text>
            <Text style={[s.value, { color: colors.text, lineHeight: 20 }]}>{fullAddress || 'No address provided'}</Text>
          </View>
        </View>
      </Card>

      <Card style={s.card}>
        <SectionHeader title="Payment Information" />
        <View style={s.row}>
          <MaterialCommunityIcons name="credit-card-outline" size={20} color={colors.textSoft} />
          <View style={s.rowContent}>
            <Text style={[s.label, { color: colors.textSoft }]}>Method</Text>
            <Text style={[s.value, { color: colors.text }]}>{paymentMethod}</Text>
          </View>
        </View>

        <View style={s.divider} />

        <View style={s.row}>
          <MaterialCommunityIcons name="check-decagram-outline" size={20} color={colors.textSoft} />
          <View style={s.rowContent}>
            <Text style={[s.label, { color: colors.textSoft }]}>Status</Text>
            <Text style={[s.value, { color: paymentStatus === 'success' ? colors.success : colors.warning }]}>
              {paymentStatus.toUpperCase()}
            </Text>
          </View>
        </View>
      </Card>

      <Card style={s.card}>
        <SectionHeader title="Order Items" />
        <View style={s.itemsList}>
          {order.Items?.map((item) => (
            <View key={item.id} style={s.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={[s.itemName, { color: colors.text }]}>
                  {item.Product?.name || 'Unknown Product'}
                  {item.Product?.hindi_name ? ` (${item.Product.hindi_name})` : ''}
                </Text>
                <Text style={[s.itemQty, { color: colors.textSoft }]}>{formatOrderQty(item)}</Text>
              </View>
              <Text style={[s.itemPrice, { color: colors.text }]}>{formatINR(item.total_price)}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card style={s.card}>
        <SectionHeader title="Bill Details" />
        
        <View style={s.billRow}>
          <Text style={[s.billLabel, { color: colors.textSoft }]}>Items Total</Text>
          <Text style={[s.billValue, { color: colors.text }]}>{formatINR(itemsSubtotal)}</Text>
        </View>
        
        <View style={s.billRow}>
          <Text style={[s.billLabel, { color: colors.textSoft }]}>Delivery Charge</Text>
          <Text style={[s.billValue, { color: colors.text }]}>{formatINR(deliveryCharge)}</Text>
        </View>
        
        <View style={[s.divider, { backgroundColor: colors.border }]} />
        
        <View style={s.billRow}>
          <Text style={[s.totalLabel, { color: colors.text }]}>Grand Total</Text>
          <Text style={[s.totalValue, { color: colors.primary }]}>{formatINR(totalAmount)}</Text>
        </View>
      </Card>
      
      <View style={{ height: 40 }} />
    </Screen>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  orderId: { fontSize: 22, fontWeight: '900', marginBottom: 4 },
  orderDate: { fontSize: 13, fontWeight: '500' },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: { fontSize: 12, fontWeight: '800' },
  
  card: { marginBottom: spacing.lg },
  
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  rowContent: { flex: 1, paddingTop: 2 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  value: { fontSize: 14, fontWeight: '700' },
  
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 14 },
  
  itemsList: { gap: 14 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  itemQty: { fontSize: 13, fontWeight: '500' },
  itemPrice: { fontSize: 15, fontWeight: '800' },
  
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  billLabel: { fontSize: 14, fontWeight: '600' },
  billValue: { fontSize: 14, fontWeight: '700' },
  
  totalLabel: { fontSize: 16, fontWeight: '800' },
  totalValue: { fontSize: 20, fontWeight: '900' },
});
