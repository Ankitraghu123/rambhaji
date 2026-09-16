import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Pressable, ScrollView, Modal, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../store/UseAppStore';
import { themeTokens, radius } from '../constants/theme';
import Screen from '../components/Screen';
import Card from '../components/Card';
import ThemeHeader from '../components/ThemeHeader';
import AppButton from '../components/AppButton';
import Badge from '../components/Badge';
import { subscriptionsApi } from '../services/api/subscriptions';

export default function SubscriptionManageScreen({ navigation, route }) {
  const { subscription: initialSubscription } = route.params || {};
  const [subscription, setSubscription] = useState(initialSubscription || {});
  const mode = useAppStore((s) => s.themeMode);
  const colors = themeTokens[mode];
  const insets = useSafeAreaInsets();
  
  const [loadingDates, setLoadingDates] = useState(true);
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [confirmingDate, setConfirmingDate] = useState(false);

  // Restart states
  const [restartModalVisible, setRestartModalVisible] = useState(false);
  const [restartSelectedDate, setRestartSelectedDate] = useState(null);
  const [restarting, setRestarting] = useState(false);
  
  // Custom dropdown state
  const [scopeDropdownOpen, setScopeDropdownOpen] = useState(false);

  const isPending = !subscription?.start_date;
  const isPaused = subscription?.status === 'paused';
  const isActive = subscription?.status === 'active';

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const fetchSubscriptionDetails = async () => {
        try {
          const res = await subscriptionsApi.getMySubscriptions();
          if (res.success && res.subscriptions) {
            const updated = res.subscriptions.find(s => s.id === subscription.id);
            if (updated && active) {
              setSubscription(updated);
            }
          }
        } catch(e) {
          console.log('Error fetching subscription details on focus:', e);
        }
      };
      
      if (subscription?.id) {
        fetchSubscriptionDetails();
      }
      
      return () => { active = false; };
    }, [subscription?.id])
  );

  useEffect(() => {
    if (isPending || isPaused) {
      fetchAvailableDates();
    }
  }, [isPending, isPaused]);

  const fetchAvailableDates = async () => {
    try {
      setLoadingDates(true);
      const res = await subscriptionsApi.getAvailableDates(subscription.package_id);
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
    if (!selectedDate) return;
    setConfirmingDate(true);
    try {
      const res = await subscriptionsApi.confirmStartDate({
        subscription_id: subscription.id,
        start_date: selectedDate
      });
      if (res.success) {
        Alert.alert('Success!', res.message || 'Start date confirmed.');
        navigation.goBack();
      } else {
        Alert.alert('Error', res.message || 'Could not confirm start date.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to confirm start date.');
    } finally {
      setConfirmingDate(false);
    }
  };

  const handleRestart = async () => {
    if (!restartSelectedDate) {
      return Alert.alert('Select Date', 'Please select a date to restart your subscription.');
    }
    setRestarting(true);
    try {
      const res = await subscriptionsApi.restartSubscription(subscription.id, {
        restart_date: restartSelectedDate
      });
      if (res.success) {
        Alert.alert('Success', res.message || 'Subscription restarted successfully.');
        setRestartModalVisible(false);
        navigation.goBack();
      } else {
        Alert.alert('Error', res.message || 'Could not restart subscription.');
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to restart subscription.');
    } finally {
      setRestarting(false);
    }
  };

  if (!subscription) {
    return (
      <Screen>
        <ThemeHeader title="Manage Plan" onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.text }}>No subscription selected.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={true}>
      <ThemeHeader 
        title="Manage Plan" 
        subtitle="Manage your plans."
        icon="calendar-edit"
        onBack={() => navigation.goBack()}
      />

      <View style={{ paddingBottom: 40 }}>
        {/* Subscription Info Card */}
        <Card style={{ marginBottom: 20 }}>
          <View style={s.cardTop}>
            <View style={{ flex: 1 }}>
              <Text style={[s.planName, { color: colors.text }]}>{subscription.Package?.name || 'Subscription Package'}</Text>
              <Text style={[s.planType, { color: colors.textSoft }]}>{(subscription.type || 'monthly').toUpperCase()} PLAN</Text>
            </View>
            <Badge 
              label={isPending ? 'Pending Start' : subscription.status} 
              tone={isPending ? 'warning' : subscription.status === 'active' ? 'success' : 'neutral'} 
            />
          </View>
          
          <View style={[s.divider, { backgroundColor: colors.border }]} />
          
          <View style={s.detailRow}>
            <MaterialCommunityIcons name="calendar-start" size={20} color={colors.textSoft} />
            <Text style={[s.detailText, { color: colors.text }]}>
              Start Date: <Text style={{ fontWeight: '700' }}>{subscription.start_date ? new Date(subscription.start_date).toLocaleDateString() : 'Not Set'}</Text>
            </Text>
          </View>
          
          {subscription.end_date && (
            <View style={s.detailRow}>
              <MaterialCommunityIcons name="calendar-end" size={20} color={colors.textSoft} />
              <Text style={[s.detailText, { color: colors.text }]}>
                End Date: <Text style={{ fontWeight: '700' }}>{new Date(subscription.end_date).toLocaleDateString()}</Text>
              </Text>
            </View>
          )}

          <View style={s.detailRow}>
            <MaterialCommunityIcons name="truck-delivery" size={20} color={colors.textSoft} />
            <Text style={[s.detailText, { color: colors.text }]}>
              Servings: <Text style={{ fontWeight: '700' }}>{subscription.services_completed || 0} / {subscription.total_services}</Text>
            </Text>
          </View>
        </Card>

        {/* Date Selection Section */}
        {isPending && (
          <View style={s.section}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Select Start Date</Text>
            <Text style={[s.sectionSub, { color: colors.textSoft }]}>Choose when you want your deliveries to begin.</Text>
            
            {loadingDates ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
            ) : availableDates.length > 0 ? (
              <>
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

                <AppButton 
                  title="Confirm Date" 
                  disabled={!selectedDate} 
                  loading={confirmingDate}
                  onPress={handleConfirmStartDate} 
                  style={{ marginTop: 20 }}
                />
              </>
            ) : (
              <Text style={[s.noDatesText, { color: colors.textSoft }]}>No available dates found.</Text>
            )}
          </View>
        )}

        {/* Action Buttons for Active / Paused */}
        {!isPending && (
          <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
            {(isActive || isPaused) && (
              <>
                <AppButton 
                  title="Customize Upcoming Servings 🥦" 
                  onPress={() => navigation.navigate('ScheduleSelection', { subscription })} 
                  style={{ marginBottom: 16 }}
                />
              </>
            )}
          </View>
        )}
      </View>

      {/* Restart Subscription Modal */}
      <Modal visible={restartModalVisible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom + 16, 40), borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: colors.text }]}>Restart Subscription</Text>
              <Pressable hitSlop={10} onPress={() => setRestartModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textSoft} />
              </Pressable>
            </View>

            <Text style={[s.sectionSub, { color: colors.textSoft }]}>Choose a date to resume your deliveries.</Text>
            
            {loadingDates ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
            ) : availableDates.length > 0 ? (
              <View style={s.dateGrid}>
                {availableDates.map(date => (
                  <Pressable 
                    key={date}
                    style={[
                      s.dateChip,
                      { borderColor: colors.border, backgroundColor: colors.surface },
                      restartSelectedDate === date && { backgroundColor: colors.primarySoft, borderColor: colors.primary }
                    ]}
                    onPress={() => setRestartSelectedDate(date)}
                  >
                    <Text style={[
                      s.dateChipText, 
                      { color: colors.text },
                      restartSelectedDate === date && { color: colors.primary, fontWeight: '800' }
                    ]}>
                      {new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={[s.noDatesText, { color: colors.textSoft }]}>No available dates found to restart.</Text>
            )}

            <View style={s.modalActions}>
              <AppButton 
                title="Cancel" 
                variant="secondary" 
                style={{ flex: 1 }} 
                onPress={() => setRestartModalVisible(false)} 
                disabled={restarting}
              />
              <View style={{ width: 12 }} />
              <AppButton 
                title="Restart" 
                style={{ flex: 1 }} 
                disabled={!restartSelectedDate} 
                loading={restarting}
                onPress={handleRestart} 
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
  planName: { fontSize: 20, fontWeight: '900' },
  planType: { fontSize: 12, fontWeight: '700', marginTop: 4, letterSpacing: 0.5 },
  divider: { height: 1, marginVertical: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  detailText: { fontSize: 15 },
  section: { marginTop: 10, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 6 },
  sectionSub: { fontSize: 13, marginBottom: 20 },
  dateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  dateChip: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16 },
  dateChipText: { fontSize: 14, fontWeight: '600' },
  noDatesText: { marginTop: 10, fontSize: 14, fontStyle: 'italic' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
  modalContent: { borderRadius: 16, padding: 20, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '900' },
  
  label: { fontSize: 14, fontWeight: '700', marginBottom: 8, marginTop: 16 },
  planTypeContainer: { flexDirection: 'row', gap: 12 },
  planTypeBox: { 
    flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, alignItems: 'center' 
  },
  planTypeActive: { borderColor: '#20894C', backgroundColor: '#F0FDF4' },
  planTypeTitle: { fontSize: 14, fontWeight: '700', color: '#6B7280', marginBottom: 4 },
  planTypeTitleActive: { color: '#20894C' },
  planTypeSub: { fontSize: 11, color: '#9CA3AF' },
  
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16 },
  hintText: { fontSize: 12, color: '#6B7280', marginTop: 8 },
  
  dropdownBtn: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    borderWidth: 1, borderRadius: 12, padding: 14, backgroundColor: '#FFF' 
  },
  dropdownMenu: { 
    borderWidth: 1, borderRadius: 12, overflow: 'hidden', marginTop: 8 
  },
  dropdownItem: { padding: 14 },
  
  modalActions: { flexDirection: 'row', marginTop: 32 }
});
