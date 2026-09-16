import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AppButton from '../components/AppButton';
import Badge from '../components/Badge';
import Card from '../components/Card';
import Screen from '../components/Screen';
import ThemeHeader from '../components/ThemeHeader';
import { themeTokens } from '../constants/theme';
import { subscriptionsApi } from '../services/api/subscriptions';
import { useAppStore } from '../store/UseAppStore';

export default function ScheduleSelectionScreen({ navigation, route }) {
  const { subscription } = route.params || {};
  const mode = useAppStore((s) => s.themeMode);
  const colors = themeTokens[mode];
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [schedulesPool, setSchedulesPool] = useState([]);
  const [schedulesFixedItems, setSchedulesFixedItems] = useState([]);
  const [schedulesMaxCount, setSchedulesMaxCount] = useState(0);
  const [schedulesBudget, setSchedulesBudget] = useState(0);
  const [schedulesPerServiceAmount, setSchedulesPerServiceAmount] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);

  // Edit State
  const [activeScheduleId, setActiveScheduleId] = useState(null);
  const [editingFixedItems, setEditingFixedItems] = useState({}); // { product_id: qty_gm }
  const [selectedSeasonalItems, setSelectedSeasonalItems] = useState({}); // { product_id: qty_gm }
  const [saving, setSaving] = useState(false);

  // Pause states
  const [pauseModalVisible, setPauseModalVisible] = useState(false);
  const [pauseDays, setPauseDays] = useState('5');
  const [pauseType, setPauseType] = useState('monthly');
  const [pauseScope, setPauseScope] = useState('single');
  const [pausing, setPausing] = useState(false);
  const [scopeDropdownOpen, setScopeDropdownOpen] = useState(false);

  const [pauseStartDate, setPauseStartDate] = useState(new Date());
  const [pauseEndDate, setPauseEndDate] = useState(new Date(Date.now() + 4 * 24 * 60 * 60 * 1000));
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Restart states
  const now = new Date();
  const initialRestartDate = new Date();
  if (now.getHours() >= 20) {
    initialRestartDate.setDate(now.getDate() + 2);
  } else {
    initialRestartDate.setDate(now.getDate() + 1);
  }
  
  const [restartModalVisible, setRestartModalVisible] = useState(false);
  const [restartSelectedDate, setRestartSelectedDate] = useState(initialRestartDate);
  const [showRestartDatePicker, setShowRestartDatePicker] = useState(false);
  const [restarting, setRestarting] = useState(false);

  useEffect(() => {
    if (pauseStartDate && pauseEndDate) {
      // Calculate inclusive days (e.g. from 22 to 25 = 4 days)
      const diffTime = Math.abs(pauseEndDate - pauseStartDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      setPauseDays((diffDays + 1).toString());
    }
  }, [pauseStartDate, pauseEndDate]);

  const [cachedPauseInfo, setCachedPauseInfo] = useState(null);

  useEffect(() => {
    if (subscription?.id) {
      AsyncStorage.getItem(`@pause_info_${subscription.id}`).then(data => {
        if (data) {
          try {
            setCachedPauseInfo(JSON.parse(data));
          } catch(e) {}
        }
      });
      fetchSchedules();
    }
  }, [subscription]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await subscriptionsApi.getUpcomingSelections(subscription.id);
      if (res.success) {
        setSchedules(res.schedules || []);
        setSchedulesPool(res.seasonal_pool || []);
        setSchedulesFixedItems(res.fixed_items || []);
        setSchedulesMaxCount(res.max_select_count || 0);
        setSchedulesBudget(res.seasonal_budget || 0);
        setSchedulesPerServiceAmount(res.per_service_amount || 0);
        setWalletBalance(res.wallet_balance || 0);
      } else {
        Alert.alert('Error', 'Failed to fetch schedules.');
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not load schedules.');
    } finally {
      setLoading(false);
    }
  };

  const startEditSchedule = (schedule) => {
    setActiveScheduleId(schedule.id);
    
    // Setup initial state for editing based on previous selections or defaults
    const customFixed = {};
    const fixedIds = schedulesFixedItems.map(f => f.product_id);

    schedulesFixedItems.forEach(f => {
      const found = schedule.selections.find(sel => sel.product_id === f.product_id);
      customFixed[f.product_id] = found ? parseFloat(found.qty_gm) : parseFloat(f.qty_gm);
    });
    setEditingFixedItems(customFixed);

    const customSeasonal = {};
    schedule.selections.forEach(sel => {
      if (!fixedIds.includes(sel.product_id)) {
        customSeasonal[sel.product_id] = (parseFloat(sel.qty_gm) || 250).toString();
      }
    });
    setSelectedSeasonalItems(customSeasonal);
  };

  // --- Dynamic Calculation Variables for Active Edit ---
  const activeFixedCost = Object.entries(editingFixedItems).reduce((sum, [pid, qty]) => {
    const fi = schedulesFixedItems.find(item => item.product_id === parseInt(pid, 10));
    if (fi && fi.Product) {
      return sum + (parseFloat(qty || 0) * parseFloat(fi.Product.purchase_price_per_gm || 0));
    }
    return sum;
  }, 0);

  const activeSeasonalCost = Object.entries(selectedSeasonalItems).reduce((sum, [pid, qty]) => {
    const sp = schedulesPool.find(item => item.product_id === parseInt(pid, 10));
    if (sp && sp.Product) {
      return sum + (parseFloat(qty || 0) * parseFloat(sp.Product.purchase_price_per_gm || 0));
    }
    return sum;
  }, 0);

  const activeTotalCost = activeFixedCost + activeSeasonalCost;
  const activeActualLimit = Math.min(schedulesPerServiceAmount, walletBalance);
  const activeRemainingBudget = activeActualLimit - activeTotalCost;
  const isActiveOverBudget = activeTotalCost > activeActualLimit;
  
  const activeSelectedCount = Object.keys(selectedSeasonalItems).length;
  const activeRemovedFixedCount = Object.values(editingFixedItems).filter(qty => parseFloat(qty || 0) === 0).length;
  const effectiveSchedulesMaxCount = schedulesMaxCount + activeRemovedFixedCount;

  // --- Actions ---
  const updateFixedQty = (productId, val) => {
    setEditingFixedItems(prev => ({ ...prev, [productId]: val }));
  };

  const updateSeasonalQty = (productId, val) => {
    // Keep raw string so the user can freely edit/backspace without unselecting
    setSelectedSeasonalItems(prev => ({ ...prev, [productId]: val }));
  };

  const toggleSeasonalItem = (productId, isChecked) => {
    const newItems = { ...selectedSeasonalItems };
    if (isChecked) {
      if (schedulesMaxCount && activeSelectedCount >= effectiveSchedulesMaxCount) {
        Alert.alert('Limit Exceeded', `Maximum of ${effectiveSchedulesMaxCount} items allowed.`);
        return;
      }
      newItems[productId] = '250'; // default initial selection
    } else {
      delete newItems[productId];
    }
    setSelectedSeasonalItems(newItems);
  };

  const handleSave = async (scheduleId, silent = false) => {
    if (isActiveOverBudget) {
      Alert.alert('Budget Exceeded', 'Please reduce product quantities to stay within budget.');
      return false;
    }

    const invalidSeasonal = Object.entries(selectedSeasonalItems).find(
      ([, qty]) => !qty || isNaN(parseFloat(qty)) || parseFloat(qty) <= 0
    );
    if (invalidSeasonal) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity greater than 0 for all selected seasonal veggies.');
      return false;
    }

    const items = Object.entries(selectedSeasonalItems)
      .filter(([, qty]) => parseFloat(qty) > 0)
      .map(([product_id, qty_gm]) => ({ product_id: parseInt(product_id, 10), qty_gm: parseFloat(qty_gm) }));

    const fixedItemsList = Object.entries(editingFixedItems)
      .map(([product_id, qty_gm]) => ({ product_id: parseInt(product_id, 10), qty_gm: parseFloat(qty_gm) }));
// .map(([product_id, qty_gm]) => ({ product_id: parseInt(product_id, 10), qty_gm: parseFloat(qty_gm) }))
//       .filter(fi => fi.qty_gm > 0);
    const invalidFixed = fixedItemsList.find(fi => isNaN(fi.qty_gm) || fi.qty_gm < 0);
    if (invalidFixed) {
      Alert.alert('Invalid Input', 'Minimum limit is 0.');
      return false;
    }

    setSaving(true);
    try {
      const res = await subscriptionsApi.saveSeasonalSelection(subscription.id, {
        schedule_id: scheduleId,
        items,
        fixed_items: fixedItemsList
      });
      if (res.success) {
        if (!silent) Alert.alert('Success', res.message || 'Selections saved successfully!');
        setActiveScheduleId(null);
        fetchSchedules(); // Reload all to get updated selections
        return true;
      } else {
        Alert.alert('Error', res.message || 'Failed to save selections.');
        return false;
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not save selections.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndShop = async (scheduleId) => {
    const success = await handleSave(scheduleId, true);
    if (success) {
      navigation.navigate('Retail');
    }
  };

  const handlePause = async () => {
    const days = parseInt(pauseDays, 10);
    if (isNaN(days) || days <= 0) {
      return Alert.alert('Invalid Input', 'Please enter a valid number of days.');
    }
    if (pauseType === 'monthly' && days > 15) {
      return Alert.alert('Limit Exceeded', `You have only 15 available pause days for a monthly cycle.`);
    }
    if (pauseType === 'yearly' && days > 45) {
      return Alert.alert('Limit Exceeded', `You have only 45 available pause days for a yearly cycle.`);
    }

    setPausing(true);
    try {
      const res = await subscriptionsApi.pauseSubscription(subscription.id, {
        pause_days: days,
        pause_type: pauseType,
        pause_scope: pauseScope
      });
      if (res.success) {
        const pauseInfo = {
          pause_start_date: pauseStartDate.toISOString(),
          pause_end_date: pauseEndDate.toISOString(),
          pause_days: days
        };
        await AsyncStorage.setItem(`@pause_info_${subscription.id}`, JSON.stringify(pauseInfo));

        Alert.alert('Success', res.message || 'Subscription paused successfully.');
        setPauseModalVisible(false);
        navigation.goBack();
      } else {
        Alert.alert('Error', res.message || 'Could not pause subscription.');
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to pause subscription.');
    } finally {
      setPausing(false);
    }
  };

  const handleRestart = async () => {
    if (!restartSelectedDate) {
      return Alert.alert('Select Date', 'Please select a date to restart your subscription.');
    }
    setRestarting(true);
    try {
      const res = await subscriptionsApi.restartSubscription(subscription.id, {
        restart_date: restartSelectedDate.toISOString().split('T')[0]
      });
      if (res.success) {
        await AsyncStorage.removeItem(`@pause_info_${subscription.id}`);
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

  if (!subscription) return null;

  return (
    <Screen scroll={true}>
      <ThemeHeader 
        title="Manage Servings" 
        subtitle={`Select seasonal sabji for ${subscription.Package?.name}`}
        icon="leaf"
        onBack={() => navigation.goBack()}
      />

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <View style={{ paddingBottom: 40 }}>
          {schedules.length === 0 ? (
            <View style={{ marginTop: 20, paddingHorizontal: 16 }}>
              {subscription?.status === 'paused' ? (
                <Card style={{ marginBottom: 16 }}>
                  <View style={s.scheduleHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.scheduleDate, { color: colors.text }]}>
                        {(subscription.pause_start_date || cachedPauseInfo?.pause_start_date) ? new Date(subscription.pause_start_date || cachedPauseInfo.pause_start_date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Paused Subscription'}
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                        <Badge label="⏸ Paused" tone="error" size="small" />
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <AppButton 
                        title="▶️ Restart" 
                        onPress={() => setRestartModalVisible(true)}
                        size="small"
                        variant="secondary"
                      />
                    </View>
                  </View>

                  <View style={[s.viewModeContainer, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
                    <Text style={[s.viewModeTitle, { color: colors.textSoft }]}>PAUSE DETAILS:</Text>
                    
                    {(subscription.pause_start_date || subscription.pause_end_date || cachedPauseInfo) ? (
                      <View style={{ marginTop: 8 }}>
                        {(subscription.pause_start_date || cachedPauseInfo?.pause_start_date) && (
                          <Text style={{ fontSize: 13, color: colors.text, marginBottom: 4 }}>
                            <Text style={{ fontWeight: '600' }}>From: </Text>
                            {new Date(subscription.pause_start_date || cachedPauseInfo.pause_start_date).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                          </Text>
                        )}
                        {(subscription.pause_end_date || cachedPauseInfo?.pause_end_date) && (
                          <Text style={{ fontSize: 13, color: colors.text, marginBottom: 4 }}>
                            <Text style={{ fontWeight: '600' }}>To: </Text>
                            {new Date(subscription.pause_end_date || cachedPauseInfo.pause_end_date).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                          </Text>
                        )}
                        {(() => {
                          if (subscription.pause_end_date || cachedPauseInfo?.pause_end_date) {
                            const endDate = new Date(subscription.pause_end_date || cachedPauseInfo.pause_end_date);
                            endDate.setHours(23, 59, 59, 999);
                            const now = new Date();
                            const remainingDays = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
                            
                            return (
                              <View style={{ marginTop: 8, padding: 8, backgroundColor: colors.primarySoft, borderRadius: 8 }}>
                                {/* <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '700' }}>
                                  Total Pause Duration: {subscription.pause_days || cachedPauseInfo?.pause_days || Math.max(1, Math.round((new Date(subscription.pause_end_date || cachedPauseInfo?.pause_end_date) - new Date(subscription.pause_start_date || cachedPauseInfo?.pause_start_date)) / (1000 * 60 * 60 * 24)))} Days
                                </Text> */}
                                <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '800', marginTop: 4 }}>
                                  ⏳ Time Remaining: {remainingDays} {remainingDays === 1 ? 'Day' : 'Days'}
                                </Text>
                              </View>
                            );  
                          }
                          return null;
                        })()}
                      </View>
                    ) : (
                      <Text style={[s.italicText, { color: colors.textSoft, marginTop: 4 }]}>Duration details are not available.</Text>
                    )}
                    
                    <Text style={{ fontSize: 13, color: '#DC2626', fontWeight: '600', marginTop: 12 }}>
                      ⚠️ You have to restart your subscription to make changes to this delivery.
                    </Text>
                  </View>
                </Card>
              ) : (
                <View style={{ alignItems: 'center', marginTop: 40 }}>
                  <MaterialCommunityIcons name="calendar-blank" size={48} color={colors.textSoft} style={{ marginBottom: 12, opacity: 0.5 }} />
                  <Text style={{ color: colors.textSoft, fontSize: 16, textAlign: 'center', fontWeight: '500' }}>
                    No upcoming pending deliveries found for this subscription.
                  </Text>
                </View>
              )}
            </View>
          ) : (
            schedules.map(schedule => {
              const isEditing = activeScheduleId === schedule.id;
              const hasSelections = schedule.selections && schedule.selections.length > 0;
              const dateObj = new Date(schedule.scheduled_date);
              const formattedDate = dateObj.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

              return (
                <Card key={schedule.id} style={{ marginBottom: 16 }}>
                  <View style={s.scheduleHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.scheduleDate, { color: colors.text }]}>{formattedDate}</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                        {schedule.is_window_open ? (
                          <Badge label="⏳ Open for changes" tone="success" size="small" />
                        ) : (
                          <Badge label="🔒 Locked (Past deadline)" tone="error" size="small" />
                        )}
                        {hasSelections ? (
                          <Badge label="✅ Selected" tone="primary" size="small" />
                        ) : (
                          <Badge label="⏳ Auto-fill default" tone="neutral" size="small" />
                        )}
                      </View>
                    </View>

                    {schedule.is_window_open && !isEditing && (
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {subscription?.status === 'paused' ? (
                          <AppButton 
                            title="▶️ Restart" 
                            onPress={() => setRestartModalVisible(true)}
                            size="small"
                            variant="secondary"
                          />
                        ) : (
                          <>
                            <AppButton 
                              title="⏸ Pause" 
                              onPress={() => setPauseModalVisible(true)}
                              size="small"
                              variant="secondary"
                            />
                            <AppButton 
                              title={hasSelections ? "✏️ Edit" : "🥦 Select"} 
                              onPress={() => startEditSchedule(schedule)}
                              size="small"
                              style={{ paddingHorizontal: 12 }}
                            />
                          </>
                        )}
                      </View>
                    )}
                  </View>

                  {!isEditing && (
                    <View style={[s.viewModeContainer, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
                      <Text style={[s.viewModeTitle, { color: colors.textSoft }]}>Picks for this date:</Text>
                      {hasSelections ? (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                          {schedule.selections.map(sel => (
                            <View key={sel.id} style={[s.selectionChip, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
                              <Text style={[s.selectionChipText, { color: colors.primary }]}>
                                {sel.Product?.name}{sel.Product?.hindi_name ? ` (${sel.Product.hindi_name})` : ''} ({parseFloat(sel.qty_gm)}{sel.Product?.unit})
                              </Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <Text style={[s.italicText, { color: colors.textSoft }]}>No custom picks. Subscription defaults will be used.</Text>
                      )}
                      
                      {subscription?.status === 'paused' && (
                        <Text style={{ fontSize: 13, color: '#DC2626', fontWeight: '600', marginTop: 12 }}>
                          ⚠️ You have to restart your subscription to make changes to this delivery.
                        </Text>
                      )}
                    </View>
                  )}

                  {isEditing && (
                    <View style={[s.editModeContainer, { borderTopColor: colors.border }]}>
                      
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                        <MaterialCommunityIcons name="alert" size={14} color="#EAB308" />
                        <Text style={{ fontSize: 12, color: '#EAB308', fontWeight: '600', marginLeft: 4 }}>
                          Selection deadline: 8:00 PM on {new Date(dateObj.getTime() - 86400000).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}
                        </Text>
                      </View>

                      {/* Budget Warning */}
                      {isActiveOverBudget && (
                        <View style={s.budgetWarning}>
                          <MaterialCommunityIcons name="alert" size={16} color="#DC2626" />
                          <Text style={s.budgetWarningText}>Limit exceeded. Please reduce quantities.</Text>
                        </View>
                      )}
                      {/*
                      {activeRemainingBudget < 30 && activeRemainingBudget >= 0 && (
                        <View style={[s.budgetWarning, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
                          <MaterialCommunityIcons name="information" size={16} color="#B45309" />
                          <Text style={[s.budgetWarningText, { color: '#B45309' }]}>Almost at budget limit (₹{activeRemainingBudget.toFixed(2)} left).</Text>
                        </View>
                      )}
                      */}

                      {/* 1. Fixed Items */}
                      <View style={s.editSection}>
                        <Text style={[s.sectionHeader, { color: colors.textSoft }]}>1. Fixed Items (Set to 0 to remove)</Text>
                        
                        {schedulesFixedItems.map(fi => {
                          const qty = editingFixedItems[fi.product_id] !== undefined ? editingFixedItems[fi.product_id].toString() : fi.qty_gm.toString();
                          const numQty = parseFloat(qty) || 0;
                          
                          // max addable calculated based on remaining budget and item price
                          const itemPrice = parseFloat(fi.Product?.purchase_price_per_gm || 0);
                          let maxAddable = 0;
                          if (activeRemainingBudget > 0 && itemPrice > 0) {
                            maxAddable = Math.floor(activeRemainingBudget / (itemPrice * 50)) * 50;
                          }

                          return (
                            <View key={fi.product_id} style={[s.editRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                              <View style={{ flex: 1 }}>
                                <Text style={[s.itemName, { color: colors.text }]}>
                                  {fi.Product?.name}
                                  {fi.Product?.hindi_name ? ` (${fi.Product.hindi_name})` : ''}
                                </Text>
                                <Text style={[s.itemSub, { color: colors.textSoft }]}>Fixed Item</Text>
                              </View>
                              <View style={{ alignItems: 'flex-end' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                  <TextInput 
                                    style={[s.qtyInput, { color: colors.text, borderColor: colors.border }]}
                                    keyboardType="numeric"
                                    value={qty}
                                    onChangeText={(val) => updateFixedQty(fi.product_id, val)}
                                    onBlur={() => {
                                      if (qty.trim() === '') {
                                        updateFixedQty(fi.product_id, '0');
                                      }
                                    }}
                                  />
                                  <Text style={{ fontSize: 12, color: colors.textSoft, marginLeft: 4 }}>{fi.Product?.unit || 'gm'}</Text>
                                </View>
                                {maxAddable >= 50 && (
                                  <Pressable 
                                    style={s.quickAddBtn}
                                    onPress={() => updateFixedQty(fi.product_id, (numQty + maxAddable).toString())}
                                  >
                                    <Text style={s.quickAddText}>💡 Add {maxAddable}g</Text>
                                  </Pressable>
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </View>

                      {/* 2. Seasonal Items */}
                      <View style={s.editSection}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <Text style={[s.sectionHeader, { color: colors.textSoft, marginBottom: 0 }]}>2. Seasonal Sabji</Text>
                          <Text style={{ fontSize: 11, color: colors.textSoft }}>
                            Chosen: {activeSelectedCount} / {effectiveSchedulesMaxCount}
                          </Text>
                        </View>
                        
                        {schedulesPool.map(sp => {
                          const isChecked = selectedSeasonalItems[sp.product_id] !== undefined;
                          const qtyStr = isChecked ? (selectedSeasonalItems[sp.product_id] ?? '').toString() : '';
                          const numQty = parseFloat(qtyStr) || 0;

                          const itemPrice = parseFloat(sp.Product?.purchase_price_per_gm || 0);
                          let maxAddable = 0;
                          if (activeRemainingBudget > 0 && itemPrice > 0) {
                            maxAddable = Math.floor(activeRemainingBudget / (itemPrice * 50)) * 50;
                          }

                          return (
                            <View key={sp.product_id} style={[
                              s.editRow, 
                              { borderColor: colors.border, backgroundColor: colors.surface },
                              isChecked && { backgroundColor: colors.primarySoft, borderColor: colors.primary }
                            ]}>
                              <Pressable 
                                style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                                onPress={() => toggleSeasonalItem(sp.product_id, !isChecked)}
                              >
                                <View 
                                  style={[s.checkbox, { borderColor: colors.border }, isChecked && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                                >
                                  {isChecked && <MaterialCommunityIcons name="check" size={14} color="#FFF" />}
                                </View>
                                <Text style={[s.itemName, { color: colors.text, marginLeft: 12 }]}>
                                  {sp.Product?.name}
                                  {sp.Product?.hindi_name ? ` (${sp.Product.hindi_name})` : ''}
                                </Text>
                              </Pressable>

                              {isChecked && (
                                <View style={{ alignItems: 'flex-end' }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <TextInput 
                                      style={[s.qtyInput, { color: colors.text, borderColor: colors.border, backgroundColor: '#FFF' }]}
                                      keyboardType="numeric"
                                      value={qtyStr}
                                      onChangeText={(val) => updateSeasonalQty(sp.product_id, val)}
                                      onBlur={() => {
                                        if (!qtyStr || qtyStr.trim() === '' || isNaN(parseFloat(qtyStr))) {
                                          updateSeasonalQty(sp.product_id, '250');
                                        }
                                      }}
                                    />
                                    <Text style={{ fontSize: 12, color: colors.textSoft, marginLeft: 4 }}>{sp.Product?.unit || 'gm'}</Text>
                                  </View>
                                  {maxAddable >= 50 && (
                                    <Pressable 
                                      style={s.quickAddBtn}
                                      onPress={() => updateSeasonalQty(sp.product_id, (numQty + maxAddable).toString())}
                                    >
                                      <Text style={s.quickAddText}>💡 Add {maxAddable}g</Text>
                                    </Pressable>
                                  )}
                                </View>
                              )}
                            </View>
                          );
                        })}
                        {schedulesPool.length === 0 && (
                          <Text style={{ textAlign: 'center', color: colors.textSoft, paddingVertical: 20 }}>No seasonal options available.</Text>
                        )}
                      </View>

                      {/* Actions */}
                      <View style={{ flexDirection: 'column', gap: 12, marginTop: 12 }}>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                          <AppButton 
                            title="Cancel" 
                            variant="secondary" 
                            style={{ flex: 1 }} 
                            onPress={() => setActiveScheduleId(null)}
                            disabled={saving}
                          />
                          <AppButton 
                            title="Save Changes" 
                            style={{ flex: 1 }} 
                            onPress={() => handleSave(schedule.id)}
                            loading={saving}
                          />
                        </View>
                        <AppButton 
                          title="Shop from Retail 🛒" 
                          variant="custom"
                          style={{ backgroundColor: '#20894C', borderColor: 'transparent' }} 
                          textStyle={{ color: '#FFFFFF' }}
                          onPress={() => handleSaveAndShop(schedule.id)}
                          loading={saving}
                        />
                      </View>
                    </View>
                  )}
                </Card>
              );
            })
          )}
        </View>
      )}

      {/* Pause Subscription Modal */}
      <Modal visible={pauseModalVisible} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: colors.surface, maxHeight: '95%', paddingBottom: Math.max(insets.bottom + 16, 40) }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={s.modalHeader}>
                <Text style={[s.modalTitle, { color: colors.text }]}>Pause Subscription</Text>
                <Pressable hitSlop={10} onPress={() => setPauseModalVisible(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.textSoft} />
                </Pressable>
              </View>

            <Text style={[s.label, { color: colors.textSoft }]}>Pause Plan Type</Text>
            <View style={s.planTypeContainer}>
              <Pressable 
                style={[s.planTypeBox, pauseType === 'monthly' && s.planTypeActive]}
                onPress={() => { setPauseType('monthly'); setPauseDays('5'); }}
              >
                <Text style={[s.planTypeTitle, pauseType === 'monthly' && s.planTypeTitleActive]}>📅 Monthly Pause</Text>
                <Text style={s.planTypeSub}>Max 15 days total</Text>
              </Pressable>

              <Pressable 
                style={[s.planTypeBox, pauseType === 'yearly' && s.planTypeActive]}
                onPress={() => { setPauseType('yearly'); setPauseDays('10'); }}
              >
                <Text style={[s.planTypeTitle, pauseType === 'yearly' && s.planTypeTitleActive]}>🏆 Yearly Pause</Text>
                <Text style={s.planTypeSub}>Max 45 days (once a year)</Text>
              </Pressable>
            </View>

            <Text style={[s.label, { color: colors.textSoft }]}>Pause Dates</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: colors.textSoft, marginBottom: 4 }}>From</Text>
                <Pressable 
                  style={[s.input, { color: colors.text, borderColor: colors.border }]} 
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text>{pauseStartDate.toLocaleDateString()}</Text>
                </Pressable>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: colors.textSoft, marginBottom: 4 }}>To</Text>
                <Pressable 
                  style={[s.input, { color: colors.text, borderColor: colors.border }]} 
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text>{pauseEndDate.toLocaleDateString()}</Text>
                </Pressable>
              </View>
            </View>
            
            {showStartDatePicker && (
              <DateTimePicker
                value={pauseStartDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  if (Platform.OS === 'android') setShowStartDatePicker(false);
                  if (selectedDate) {
                    setPauseStartDate(selectedDate);
                    if (selectedDate > pauseEndDate) setPauseEndDate(selectedDate);
                  }
                }}
              />
            )}

            {showEndDatePicker && (
              <DateTimePicker
                value={pauseEndDate}
                mode="date"
                display="default"
                minimumDate={pauseStartDate}
                onChange={(event, selectedDate) => {
                  if (Platform.OS === 'android') setShowEndDatePicker(false);
                  if (selectedDate) setPauseEndDate(selectedDate);
                }}
              />
            )}

            <Text style={[s.label, { color: colors.textSoft, marginTop: 0 }]}>Calculated Duration (Days)</Text>
            <TextInput 
              style={[
                s.input, 
                { color: colors.text, borderColor: colors.border },
                ((pauseType === 'monthly' && parseInt(pauseDays) > 15) || (pauseType === 'yearly' && parseInt(pauseDays) > 45)) && { borderColor: colors.error }
              ]}
              keyboardType="number-pad"
              value={pauseDays}
              onChangeText={setPauseDays}
            />
            {((pauseType === 'monthly' && parseInt(pauseDays) > 15) || (pauseType === 'yearly' && parseInt(pauseDays) > 45)) ? (
              <Text style={[s.hintText, { color: colors.error, fontWeight: '700' }]}>
                {pauseType === 'monthly' 
                  ? "❌ You have only 15 available pause days for a monthly cycle."
                  : "❌ You have only 45 available pause days for a yearly cycle."}
              </Text>
            ) : (
              <Text style={s.hintText}>
                {pauseType === 'monthly' 
                  ? "Allows multiple pauses as long as total doesn't exceed 15 days this cycle."
                  : "⚠️ Can only be paused once per year. Any unused days of the 45-day limit will be forfeited."}
              </Text>
            )}

            <Text style={[s.label, { color: colors.textSoft }]}>Apply To</Text>
            <View style={{ zIndex: 10 }}>
              <Pressable 
                style={[s.dropdownBtn, { borderColor: colors.border }]} 
                onPress={() => setScopeDropdownOpen(!scopeDropdownOpen)}
              >
                <Text style={{ color: colors.text, fontSize: 15 }}>
                  {pauseScope === 'single' ? `Only this package (${subscription.Package?.name || ''})` : 'All active packages'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSoft} />
              </Pressable>
              
              {scopeDropdownOpen && (
                <View style={[s.dropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Pressable 
                    style={[s.dropdownItem, pauseScope === 'single' && { backgroundColor: colors.primary }]}
                    onPress={() => { setPauseScope('single'); setScopeDropdownOpen(false); }}
                  >
                    <Text style={{ color: pauseScope === 'single' ? '#FFF' : colors.text }}>
                      Only this package ({subscription.Package?.name || ''})
                    </Text>
                  </Pressable>
                  <Pressable 
                    style={[s.dropdownItem, pauseScope === 'all' && { backgroundColor: colors.primary }]}
                    onPress={() => { setPauseScope('all'); setScopeDropdownOpen(false); }}
                  >
                    <Text style={{ color: pauseScope === 'all' ? '#FFF' : colors.text }}>
                      All active packages
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>

            <View style={{ marginTop: 32 }}>
              <AppButton 
                title="Confirm Pause" 
                style={{ backgroundColor: '#20894C', marginBottom: 12 }} 
                onPress={handlePause}
                loading={pausing}
                disabled={((pauseType === 'monthly' && parseInt(pauseDays) > 15) || (pauseType === 'yearly' && parseInt(pauseDays) > 45))}
              />
              <AppButton 
                title="Cancel" 
                variant="secondary" 
                onPress={() => setPauseModalVisible(false)} 
                disabled={pausing}
              />
            </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Restart Subscription Modal */}
      <Modal visible={restartModalVisible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: colors.surface, paddingBottom: 40, borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: colors.text }]}>Restart Subscription</Text>
              <Pressable hitSlop={10} onPress={() => setRestartModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textSoft} />
              </Pressable>
            </View>

            <Text style={[s.sectionSub, { color: colors.textSoft }]}>Choose a date to resume your deliveries.</Text>
            
            <View style={{ marginVertical: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textSoft, marginBottom: 8 }}>Restart Date</Text>
              <Pressable 
                style={[s.input, { color: colors.text, borderColor: colors.border }]} 
                onPress={() => setShowRestartDatePicker(true)}
              >
                <Text>{restartSelectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
              </Pressable>
            </View>

            {showRestartDatePicker && (
              <DateTimePicker
                value={restartSelectedDate}
                mode="date"
                display="default"
                minimumDate={initialRestartDate}
                onChange={(event, selectedDate) => {
                  if (Platform.OS === 'android') setShowRestartDatePicker(false);
                  if (selectedDate) setRestartSelectedDate(selectedDate);
                }}
              />
            )}

            <Text style={[s.hintText, { color: colors.textSoft, marginBottom: 20 }]}>
              Note: You can select any date starting from {initialRestartDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} based on the 8 PM deadline.
            </Text>

            <View style={{ marginTop: 32 }}>
              <AppButton 
                title="Confirm Restart" 
                style={{ marginBottom: 12 }}
                disabled={!restartSelectedDate} 
                loading={restarting}
                onPress={handleRestart} 
              />
              <AppButton 
                title="Cancel" 
                variant="secondary" 
                onPress={() => setRestartModalVisible(false)} 
                disabled={restarting}
              />
            </View>
          </View>
        </View>
      </Modal>

    </Screen>
  );
}

const s = StyleSheet.create({
  scheduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  scheduleDate: { fontSize: 16, fontWeight: '700' },
  
  viewModeContainer: { marginTop: 16, padding: 12, borderRadius: 12, borderWidth: 1 },
  viewModeTitle: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  italicText: { fontSize: 12, fontStyle: 'italic', marginTop: 8 },
  selectionChip: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  selectionChipText: { fontSize: 12, fontWeight: '600' },
  
  editModeContainer: { marginTop: 16, paddingTop: 16, borderWidth: 0, borderTopWidth: 1 },
  
  budgetWarning: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', padding: 10, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#FCA5A5' },
  budgetWarningText: { fontSize: 12, color: '#DC2626', fontWeight: '600', marginLeft: 6 },
  
  editSection: { marginBottom: 20 },
  sectionHeader: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  
  editRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderWidth: 1, borderRadius: 12, marginBottom: 8 },
  itemName: { fontSize: 14, fontWeight: '600' },
  itemSub: { fontSize: 10, marginTop: 2 },
  
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  qtyInput: { borderWidth: 1, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8, width: 64, textAlign: 'center', fontSize: 14 },
  
  quickAddBtn: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 6, alignSelf: 'flex-end' },
  quickAddText: { fontSize: 10, color: '#166534', fontWeight: '600' },
  
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
