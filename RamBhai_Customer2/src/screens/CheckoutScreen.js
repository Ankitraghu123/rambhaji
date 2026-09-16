import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppButton from "../components/AppButton";
import Badge from "../components/Badge";
import Card from "../components/Card";
import Input from "../components/Input";
import Screen from "../components/Screen";
import SectionHeader from "../components/SectionHeader";
import { themeTokens } from "../constants/theme";
import { addressesApi } from "../services/api/addresses";
import { paymentApi } from "../services/api/payment";
import { batchesApi } from "../services/api/batches";
import { useAppStore } from "../store/UseAppStore";
import { formatINR } from "../utils/format";

function SuccessSheet({ visible, colors, onDone, onClose, orderType }) {
  const sheet = useRef(new Animated.Value(0)).current;
  const check = useRef(new Animated.Value(0)).current;
  const confetti = useRef(new Animated.Value(0)).current;

  const pieces = useMemo(
    () => [
      { x: -110, y: -72, color: "#267447" },
      { x: -68, y: -98, color: "#F5B82E" },
      { x: -22, y: -82, color: "#C85A3B" },
      { x: 24, y: -104, color: "#137C78" },
      { x: 72, y: -86, color: "#B87922" },
      { x: 112, y: -58, color: "#287A49" },
    ],
    [],
  );

  useEffect(() => {
    if (visible) {
      sheet.setValue(0);
      check.setValue(0);
      confetti.setValue(0);
      Animated.sequence([
        Animated.spring(sheet, {
          toValue: 1,
          speed: 12,
          bounciness: 7,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.spring(check, {
            toValue: 1,
            speed: 14,
            bounciness: 12,
            useNativeDriver: true,
          }),
          Animated.timing(confetti, {
            toValue: 1,
            duration: 760,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [visible, check, confetti, sheet]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={s.successOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[
            s.successModalCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: sheet,
              transform: [
                {
                  scale: sheet.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.85, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={s.closeModalBtn}
          >
            <MaterialCommunityIcons name="close" size={22} color={colors.textSoft} />
          </Pressable>

          <View pointerEvents="none" style={s.confettiLayer}>
            {pieces.map((piece, index) => (
              <Animated.View
                key={`${piece.color}-${index}`}
                style={[
                  s.confetti,
                  {
                    backgroundColor: piece.color,
                    opacity: confetti.interpolate({
                      inputRange: [0, 0.8, 1],
                      outputRange: [0, 1, 0.3],
                    }),
                    transform: [
                      {
                        translateX: confetti.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, piece.x],
                        }),
                      },
                      {
                        translateY: confetti.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, piece.y],
                        }),
                      },
                      {
                        rotate: confetti.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0deg", `${index % 2 ? "-" : ""}42deg`],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))}
          </View>

          <Animated.View
            style={[
              s.checkWrap,
              {
                backgroundColor: colors.primarySoft,
                transform: [
                  {
                    scale: check.interpolate({
                      inputRange: [0, 0.65, 1],
                      outputRange: [0.4, 1.16, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <MaterialCommunityIcons
              name="check-bold"
              size={36}
              color={colors.primary}
            />
          </Animated.View>
          <Text style={[s.successTitle, { color: colors.text }]}>
            Payment successful
          </Text>
          <Text style={[s.successSub, { color: colors.textSoft }]}>
            Your payment has been verified successfully.
          </Text>
          <AppButton
            title={
              orderType === "subscription"
                ? "Go to your subscription"
                : "Go to your orders"
            }
            onPress={onDone}
            style={{ marginTop: 8, width: "100%" }}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

function MockPhonePeModal({ visible, onClose, onSuccess, amount, colors }) {
  const [processing, setProcessing] = useState(false);

  const handlePay = () => {
    setProcessing(true);
    // Simulate network delay for realistic feel
    setTimeout(() => {
      setProcessing(false);
      onSuccess();
    }, 2000);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={s.paymentOverlay}>
        <View
          style={[s.mockPhonePeContainer, { backgroundColor: colors.surface }]}
        >
          <View style={s.mockHeader}>
            <MaterialCommunityIcons
              name="shield-check"
              size={24}
              color="#6739B7"
            />
            <Text style={s.mockTitle}>PhonePe (Test Mode)</Text>
          </View>

          <View style={s.mockContent}>
            <Text style={[s.mockLabel, { color: colors.textSoft }]}>
              Paying to
            </Text>
            <Text style={[s.mockMerchant, { color: colors.text }]}>
              Rambhaji 
            </Text>
            <Text style={[s.mockAmount, { color: colors.text }]}>
              {formatINR(amount)}
            </Text>

            <Text style={[s.mockNote, { color: colors.textSoft }]}>
              This is a dummy payment gateway for testing purposes. No real money
              will be deducted.
            </Text>
          </View>

          <AppButton
            title={processing ? "Processing..." : `Pay ${formatINR(amount)}`}
            loading={processing}
            onPress={handlePay}
            style={{ backgroundColor: "#6739B7", marginTop: 20 }}
          />
          <AppButton
            title="Cancel"
            variant="secondary"
            onPress={onClose}
            disabled={processing}
            style={{ marginTop: 12 }}
          />
        </View>
      </View>
    </Modal>
  );
}

function AddressSheet({ visible, onClose, onSelectAddress, colors, orderType }) {
  const insets = useSafeAreaInsets();
  const [addresses, setAddresses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("list"); // 'list' or 'add'

  // Form state
  const [addressLine, setAddressLine] = useState("");
  const [landmark, setLandmark] = useState("");
  const [pincode, setPincode] = useState("");

  useEffect(() => {
    if (visible && mode === "list") {
      fetchAddresses();
      if (orderType === "subscription") {
        fetchBatches();
      }
    }
  }, [visible, mode, orderType]);

  const fetchBatches = async () => {
    try {
      const res = await batchesApi.getBatches();
      if (res.success) {
        setBatches(res.batches || []);
        if (res.batches && res.batches.length > 0) {
          setSelectedBatchId(res.batches[0].id);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch batches", e);
    }
  };

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await addressesApi.getAddresses();
      if (res.success) {
        setAddresses(res.addresses || []);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!addressLine.trim() || !pincode.trim()) {
      alert("Please fill address and pincode");
      return;
    }
    setLoading(true);
    try {
      const res = await addressesApi.createAddress({
        address_line: addressLine,
        city: "Bhopal", // Defaulting for now
        pincode: pincode,
        landmark: landmark,
        is_default: addresses.length === 0,
      });
      if (res.success && res.address) {
        if (orderType === "subscription" && !selectedBatchId && batches.length > 0) {
          alert("Please select a batch before continuing");
          return;
        }
        onSelectAddress(res.address.id, selectedBatchId);
      }
    } catch (e) {
      alert("Failed to save address");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={s.addressOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Dismiss area */}
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={[
            s.bottomSheet,
            {
              backgroundColor: colors.surface,
              paddingBottom: Math.max(insets.bottom + 16, 40),
            },
          ]}
        >
          <View style={s.sheetHeader}>
            <Text style={[s.sheetTitle, { color: colors.text }]}>
              {mode === "list" ? "Select Address" : "Add New Address"}
            </Text>
            <Pressable
              onPress={mode === "add" ? () => setMode("list") : onClose}
              hitSlop={10}
            >
              <MaterialCommunityIcons
                name={mode === "add" ? "arrow-left" : "close"}
                size={24}
                color={colors.textSoft}
              />
            </Pressable>
          </View>

          {orderType === "subscription" && batches.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 8 }}>Select Batch</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {batches.map((b) => (
                  <Pressable
                    key={b.id}
                    onPress={() => setSelectedBatchId(b.id)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: selectedBatchId === b.id ? colors.primary : colors.border,
                      backgroundColor: selectedBatchId === b.id ? colors.primarySoft : 'transparent',
                      marginRight: 8,
                    }}
                  >
                    <Text style={{
                      color: selectedBatchId === b.id ? colors.primary : colors.textSoft,
                      fontWeight: selectedBatchId === b.id ? '700' : '500'
                    }}>
                      {b.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {mode === "list" ? (
            <>
              <ScrollView style={{ maxHeight: 300 }}>
                {addresses.map((item) => (
                  <Pressable
                    key={item.id}
                    style={[s.addressItem, { borderColor: colors.border }]}
                    onPress={() => {
                      if (orderType === "subscription" && !selectedBatchId && batches.length > 0) {
                        alert("Please select a batch first");
                        return;
                      }
                      onSelectAddress(item.id, selectedBatchId);
                    }}
                  >
                    <MaterialCommunityIcons
                      name="map-marker-outline"
                      size={24}
                      color={colors.primary}
                    />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={[s.addrLabel, { color: colors.text }]}>
                        {item.landmark || "Home"}
                      </Text>
                      <Text style={[s.addrValue, { color: colors.textSoft }]}>
                        {item.address_line}, {item.city} - {item.pincode}
                      </Text>
                    </View>
                  </Pressable>
                ))}
                {addresses.length === 0 && !loading && (
                  <Text
                    style={{
                      textAlign: "center",
                      color: colors.textSoft,
                      marginVertical: 20,
                    }}
                  >
                    No saved addresses.
                  </Text>
                )}
              </ScrollView>
              <AppButton
                title="+ Add New Address"
                variant="secondary"
                onPress={() => setMode("add")}
                style={{ marginTop: 16 }}
              />
            </>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Input
                label="Full Address *"
                value={addressLine}
                onChangeText={setAddressLine}
                placeholder="House / Flat no., street, area"
              />
              <Input
                label="Landmark"
                value={landmark}
                onChangeText={setLandmark}
                placeholder="Near market / apartment"
              />
              <Input
                label="PIN Code *"
                value={pincode}
                onChangeText={setPincode}
                keyboardType="number-pad"
                placeholder="6-digit PIN code"
                maxLength={6}
              />
              <AppButton
                title="Save & Continue"
                onPress={handleSaveAddress}
                loading={loading}
                style={{ marginTop: 16 }}
              />
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function CheckoutScreen({ navigation, route }) {
  const mode = useAppStore((state) => state.themeMode);
  const colors = themeTokens[mode];
  const [promo, setPromo] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);

  const { planId, plan, billingCycle, selectedSeasonal, displayPrice } =
    route?.params || {};
  const orderType = planId ? "subscription" : "retail";

  const orderTotal = displayPrice || 0; // Use dynamically calculated price from previous screen

  const [addressSheetVisible, setAddressSheetVisible] = useState(false);

  // Mock PhonePe state
  const [mockPhonePeVisible, setMockPhonePeVisible] = useState(false);
  const [currentTxnId, setCurrentTxnId] = useState(null);

  function handleStartCheckout() {
    setAddressSheetVisible(true);
  }

  const completePayment = async () => {
    setMockPhonePeVisible(false);
    try {
      const statusRes = await paymentApi.checkPaymentStatus(currentTxnId);
      if (statusRes.success && statusRes.status === "success") {
        setPlaced(true);
        if (orderType === "retail") {
          useAppStore.getState().clearCart();
        }
      } else {
        alert(statusRes.message || "Your payment could not be verified.");
      }
    } catch (e) {
      alert("Error verifying payment.");
    } finally {
      setPlacing(false);
    }
  };

  async function handlePlaceOrder(addressId, batchId) {
    setAddressSheetVisible(false);
    if (placing || placed) return;
    setPlacing(true);

    try {
      if (orderType === "subscription") {
        // PhonePe Subscription Payment Flow
        const initiateRes = await paymentApi.initiatePhonePe({
          type: "package",
          package_id: planId,
          billing_type: billingCycle,
          address_id: addressId,
          batch_id: batchId,
          redirectUrl: "http://localhost:8081"
        });

        if (initiateRes.success) {
          console.log("Initiate Response:", initiateRes);
          let txnId = "dummy_txn_123";
          
          if (initiateRes.txnId || initiateRes.transactionId || initiateRes.merchantTransactionId || initiateRes.data?.merchantTransactionId) {
            txnId = initiateRes.txnId || initiateRes.transactionId || initiateRes.merchantTransactionId || initiateRes.data?.merchantTransactionId;
          } else if (initiateRes.redirectUrl && initiateRes.redirectUrl.includes("txnId=")) {
            const match = initiateRes.redirectUrl.match(/txnId=([^&]+)/);
            if (match) txnId = match[1];
          }
          setCurrentTxnId(txnId);
          setMockPhonePeVisible(true);
        } else {
          alert("Could not initiate PhonePe payment.");
          setPlacing(false);
        }
      } else {
        // Retail PhonePe Payment Flow
        const mappedItems = (route.params?.items || []).map(item => {
          let q = item.qty;
          let u = (item.unit || '').trim().toLowerCase();
          if (u === 'gm' || u === 'g' || u === 'gram' || u === 'grams' || u.includes('kg')) {
            q = q / 1000;
          }
          return {
            product_id: parseInt(item.id) || item.id,
            quantity: q
          };
        });
        
        const initiateRes = await paymentApi.initiatePhonePe({
          type: "retail",
          address_id: addressId,
          items: mappedItems.length > 0 ? mappedItems : [{ product_id: 1, quantity: 2 }],
          redirectUrl: "http://localhost:8081"
        });

        if (initiateRes.success) {
          console.log("Initiate Response:", initiateRes);
          let txnId = "dummy_txn_retail_123";
          
          if (initiateRes.txnId || initiateRes.transactionId || initiateRes.merchantTransactionId || initiateRes.data?.merchantTransactionId) {
            txnId = initiateRes.txnId || initiateRes.transactionId || initiateRes.merchantTransactionId || initiateRes.data?.merchantTransactionId;
          } else if (initiateRes.redirectUrl && initiateRes.redirectUrl.includes("txnId=")) {
            const match = initiateRes.redirectUrl.match(/txnId=([^&]+)/);
            if (match) txnId = match[1];
          }
          setCurrentTxnId(txnId);
          setMockPhonePeVisible(true);
        } else {
          alert("Could not initiate PhonePe payment.");
          setPlacing(false);
        }
      }
    } catch (e) {
      alert(e.response?.data?.message || e.message || "Failed to place order");
      setPlacing(false);
    }
  }

  return (
    <Screen>
      <Text style={[s.title, { color: colors.text }]}>Checkout</Text>
      <Text style={[s.sub, { color: colors.textSoft }]}>
        Review your subscription, retail, and water order before payment.
      </Text>

      <Card style={s.summaryCard}>
        <SectionHeader title="Order summary" />
        <View style={s.lineRow}>
          <Text style={[s.line, { color: colors.textSoft }]}>
            {orderType === "subscription" ? "Plan" : "Items"}
          </Text>
          <Text style={[s.value, { color: colors.text }]}>
            {plan ? `${plan.name} (${billingCycle})` : "Retail Items"}
          </Text>
        </View>
        <View style={s.lineRow}>
          <Text style={[s.line, { color: colors.textSoft }]}>
            Delivery charge
          </Text>
          <Text style={[s.value, { color: colors.success }]}>
            Free for this order
          </Text>
        </View>
        <View style={s.lineRow}>
          <Text style={[s.line, { color: colors.textSoft }]}>
            Payment Method
          </Text>
          <Text style={[s.value, { color: colors.text }]}>
            PhonePe UPI/Card
          </Text>
        </View>
        <View style={[s.divider, { backgroundColor: colors.border }]} />
        <View style={s.lineRow}>
          <Text style={[s.totalLabel, { color: colors.text }]}>Total</Text>
          <Text style={[s.totalValue, { color: colors.text }]}>
            {formatINR(orderTotal)}
          </Text>
        </View>
      </Card>

      {/* <Card style={s.promoCard}>
        <Input
          label="Promo code"
          value={promo}
          onChangeText={setPromo}
          placeholder="Enter coupon code"
        />
        <Badge label="Coupon support is ready in the UI" tone="info" />
      </Card> */}

      <AppButton
        title={
          placing && !mockPhonePeVisible
            ? "Processing Payment..."
            : "Select Address & Pay"
        }
        loading={placing && !mockPhonePeVisible}
        disabled={placing || placed}
        onPress={handleStartCheckout}
        iconRight={
          <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
        }
      />

      <AddressSheet
        visible={addressSheetVisible}
        onClose={() => setAddressSheetVisible(false)}
        onSelectAddress={handlePlaceOrder}
        colors={colors}
        orderType={orderType}
      />

      {/* MockPhonePeModal is now a true Modal, rendered outside Screen's ScrollView hierarchy */}
      <MockPhonePeModal
        visible={mockPhonePeVisible}
        onClose={() => {
          setMockPhonePeVisible(false);
          setPlacing(false);
        }}
        onSuccess={completePayment}
        amount={orderTotal}
        colors={colors}
      />

      <SuccessSheet
        visible={placed}
        colors={colors}
        orderType={orderType}
        onDone={() => {
          setPlaced(false);
          if (orderType === "subscription") {
            navigation.navigate("MySubscriptions"); // Redirect to new screen
          } else {
            navigation.navigate("RetailOrders");
          }
        }}
        onClose={() => setPlaced(false)}
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 28, fontWeight: "900" },
  sub: {
    marginTop: 6,
    marginBottom: 18,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
  },
  summaryCard: { borderRadius: 22 },
  promoCard: { borderRadius: 22 },
  lineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingVertical: 7,
  },
  line: { flex: 1, fontSize: 13, fontWeight: "700" },
  value: { flex: 1.2, textAlign: "right", fontSize: 13, fontWeight: "900" },
  divider: { height: 1, marginVertical: 8 },
  totalLabel: { fontSize: 16, fontWeight: "900" },
  totalValue: { fontSize: 20, fontWeight: "900" },
  successOverlay: {
    flex: 1,
    backgroundColor: "rgba(16, 16, 38, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  successModalCard: {
    width: "100%",
    maxWidth: 360,
    borderWidth: 1,
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 20,
    position: "relative",
  },
  closeModalBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    zIndex: 9999,
  },
  checkWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  successSub: {
    marginTop: 8,
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 8,
  },
  confettiLayer: {
    position: "absolute",
    top: 70,
    left: "50%",
    width: 1,
    height: 1,
  },
  confetti: {
    position: "absolute",
    width: 8,
    height: 13,
    borderRadius: 3,
  },
  addressOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  paymentOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 20,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "900",
  },
  addressItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 12,
  },
  addrLabel: {
    fontSize: 15,
    fontWeight: "800",
  },
  addrValue: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  mockPhonePeContainer: {
    width: "90%",
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  mockHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  mockTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#6739B7",
  },
  mockContent: {
    alignItems: "center",
    paddingVertical: 16,
  },
  mockLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  mockMerchant: {
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 16,
  },
  mockAmount: {
    fontSize: 42,
    fontWeight: "900",
    marginBottom: 24,
  },
  mockNote: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
});
