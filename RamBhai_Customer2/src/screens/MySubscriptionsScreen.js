import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, Pressable, Modal, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../store/UseAppStore';
import { themeTokens, radius } from '../constants/theme';
import Screen from '../components/Screen';
import Card from '../components/Card';
import ThemeHeader from '../components/ThemeHeader';
import Badge from '../components/Badge';
import AppButton from '../components/AppButton';
import { subscriptionsApi } from '../services/api/subscriptions';

export default function MySubscriptionsScreen({ navigation }) {
  const mode = useAppStore((s) => s.themeMode);
  const colors = themeTokens[mode];
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [loadingDates, setLoadingDates] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [confirmingDate, setConfirmingDate] = useState(false);

  // Refresh subscriptions when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchSubscriptions();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await subscriptionsApi.getMySubscriptions();
      if (res.success) {
        setSubscriptions(res.subscriptions || []);
      }
    } catch (e) {
      console.warn('Failed to fetch subscriptions', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableDates = async (packageId) => {
    try {
      setLoadingDates(true);
      const res = await subscriptionsApi.getAvailableDates(packageId);
      if (res.success && res.available_dates) {
        setAvailableDates(res.available_dates);
      } else {
        Alert.alert('Error', 'Could not fetch available start dates.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to get available dates.');
    } finally {
      setLoadingDates(false);
    }
  };

  const handleConfirmStartDate = async () => {
    if (!selectedDate || !selectedSubscription) return;
    setConfirmingDate(true);
    try {
      const res = await subscriptionsApi.confirmStartDate({
        subscription_id: selectedSubscription.id,
        start_date: selectedDate
      });
      if (res.success) {
        Alert.alert('Success!', res.message || 'Start date confirmed.');
        setModalVisible(false);
        fetchSubscriptions();
      } else {
        Alert.alert('Error', res.message || 'Could not confirm start date.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to confirm start date.');
    } finally {
      setConfirmingDate(false);
    }
  };

  const renderSubscription = ({ item }) => {
    const isPending = !item.start_date; // Assuming no start_date means it's pending activation
    
    return (
      <Card style={{ marginBottom: 16 }}>
        <View style={s.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={[s.planName, { color: colors.text }]}>{item.Package?.name || 'Subscription Package'}</Text>
            <Text style={[s.planType, { color: colors.textSoft }]}>{(item.type || 'monthly').toUpperCase()} PLAN</Text>
          </View>
          <Badge 
            label={isPending ? 'Pending Start' : item.status} 
            tone={isPending ? 'warning' : item.status === 'active' ? 'success' : 'neutral'} 
          />
        </View>
        
        <View style={[s.divider, { backgroundColor: colors.border }]} />
        
        <View style={s.detailRow}>
          <MaterialCommunityIcons name="calendar-start" size={20} color={colors.textSoft} />
          <Text style={[s.detailText, { color: colors.text }]}>
            Start Date: <Text style={{ fontWeight: '700' }}>{item.start_date ? new Date(item.start_date).toLocaleDateString() : 'Not Set'}</Text>
          </Text>
        </View>
        
        {item.end_date && (
          <View style={s.detailRow}>
            <MaterialCommunityIcons name="calendar-end" size={20} color={colors.textSoft} />
            <Text style={[s.detailText, { color: colors.text }]}>
              End Date: <Text style={{ fontWeight: '700' }}>{new Date(item.end_date).toLocaleDateString()}</Text>
            </Text>
          </View>
        )}

        <View style={s.detailRow}>
          <MaterialCommunityIcons name="truck-delivery" size={20} color={colors.textSoft} />
          <Text style={[s.detailText, { color: colors.text }]}>
            Servings: <Text style={{ fontWeight: '700' }}>{item.services_completed || 0} / {item.total_services}</Text>
          </Text>
        </View>

        {isPending ? (
          <Pressable onPress={() => {
            setSelectedSubscription(item);
            setSelectedDate(null);
            setModalVisible(true);
            fetchAvailableDates(item.package_id);
          }}>
            <View style={{ marginTop: 12, alignItems: 'center', backgroundColor: colors.primarySoft, padding: 10, borderRadius: 10 }}>
              <Text style={{ color: colors.primary, fontWeight: '800' }}>Manage Plan</Text>
            </View>
          </Pressable>
        ) : (
          <AppButton 
            title="Customize Upcoming Servings 🥦" 
            onPress={() => navigation.navigate('ScheduleSelection', { subscription: item })} 
            style={{ marginTop: 12 }}
          />
        )}
      </Card>
    );
  };

  return (
    <Screen scroll={true}>
      <ThemeHeader 
        title="My Subscriptions" 
        subtitle="Manage your active plans."
        icon="leaf"
        onBack={() => navigation.goBack()}
      />
      
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <View style={{ paddingBottom: 40, paddingHorizontal: 16, paddingTop: 16 }}>
          {subscriptions.length === 0 ? (
            <View style={s.emptyState}>
              <MaterialCommunityIcons name="basket-outline" size={64} color={colors.border} />
              <Text style={[s.emptyText, { color: colors.textSoft }]}>You have no active subscriptions.</Text>
            </View>
          ) : (
            subscriptions.map(item => <React.Fragment key={item.id.toString()}>{renderSubscription({item})}</React.Fragment>)
          )}
        </View>
      )}

      {/* Date Selection Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setModalVisible(false)}>
        <View style={s.modalOverlay}>
          {/* Dismiss area above */}
          <Pressable style={{ flex: 1 }} onPress={() => setModalVisible(false)} />
          <View style={[s.modalContent, { backgroundColor: colors.surface }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={[s.modalTitle, { color: colors.text }]}>Select Start Date</Text>
              <Pressable hitSlop={10} onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textSoft} />
              </Pressable>
            </View>
            <Text style={[s.modalSub, { color: colors.textSoft }]}>Choose when you want your deliveries to begin.</Text>
            
            {loadingDates ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
            ) : availableDates.length > 0 ? (
              <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                <View style={s.dateGrid}>
                  {availableDates.map(date => (
                    <Pressable 
                      key={date}
                      style={[
                        s.dateChip,
                        { borderColor: colors.border, backgroundColor: colors.surface },
                        selectedDate === date && { backgroundColor: colors.primarySoft, borderColor: colors.primary }
                      ]}
                      onPress={() => setSelectedDate(date)}
                    >
                      <Text style={[
                        s.dateChipText, 
                        { color: colors.text },
                        selectedDate === date && { color: colors.primary, fontWeight: '800' }
                      ]}>
                        {new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <Text style={[{ color: colors.textSoft, fontStyle: 'italic', marginBottom: 20 }]}>No available dates found.</Text>
            )}

            <View style={s.modalActions}>
              <AppButton 
                title="Cancel" 
                variant="secondary" 
                style={{ flex: 1 }} 
                onPress={() => setModalVisible(false)} 
                disabled={confirmingDate}
              />
              <View style={{ width: 12 }} />
              <AppButton 
                title="Confirm Date" 
                style={{ flex: 1 }} 
                disabled={!selectedDate} 
                loading={confirmingDate}
                onPress={handleConfirmStartDate} 
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const s = StyleSheet.create({
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planName: { fontSize: 18, fontWeight: '900' },
  planType: { fontSize: 12, fontWeight: '700', marginTop: 2, letterSpacing: 0.5 },
  divider: { height: 1, marginVertical: 14 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  detailText: { fontSize: 14 },
  emptyState: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '600' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 60 },
  modalTitle: { fontSize: 20, fontWeight: '900', marginBottom: 6 },
  modalSub: { fontSize: 13, marginBottom: 20 },
  dateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  dateChip: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16 },
  dateChipText: { fontSize: 14, fontWeight: '600' },
  modalActions: { flexDirection: 'row', marginTop: 16, marginBottom: 48 }
});

