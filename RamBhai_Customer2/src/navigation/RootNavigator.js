import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import AppLoaderScreen from '../screens/AppLoaderScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import OtpScreen from '../screens/OtpScreen';
import AddressScreen from '../screens/AddressScreen';
import PlansScreen from '../screens/PlansScreen';
import PlanDetailScreen from '../screens/PlanDetailScreen';
import CustomizationScreen from '../screens/CustomaizationScreen';
import RetailScreen from '../screens/RetailScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import WaterScreen from '../screens/WaterScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SupportScreen from '../screens/SupportScreen';
import DeliveryDetailScreen from '../screens/DeliveryDetailScreen';
import TicketDetailScreen from '../screens/TicketDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import FaqScreen from '../screens/FaqScreen';
import ReferScreen from '../screens/ReferScreen';
import RegisterScreen from '../screens/Registerscreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import PaymentScreen from '../screens/PaymentScreen';
import MySubscriptionsScreen from '../screens/MySubscriptionsScreen';
import SubscriptionManageScreen from '../screens/SubscriptionManageScreen';
import ScheduleSelectionScreen from '../screens/ScheduleSelectionScreen';
import RetailOrdersScreen from '../screens/RetailOrdersScreen';
import RetailOrderDetailScreen from '../screens/RetailOrderDetailScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 260,
        contentStyle: { backgroundColor: '#F7FAFF' },
      }}
    >
      <Stack.Screen name="AppLoader"     component={AppLoaderScreen} />
      <Stack.Screen name="Onboarding"    component={OnboardingScreen} />
      <Stack.Screen name="Login"         component={LoginScreen} />
      <Stack.Screen name="Otp"           component={OtpScreen} />
      <Stack.Screen name="Plans"         component={PlansScreen} />
      <Stack.Screen name="Address"       component={AddressScreen} />
      <Stack.Screen name="MainTabs"      component={MainTabs} />
      <Stack.Screen name="PlanDetail"    component={PlanDetailScreen} />
      <Stack.Screen name="Customization" component={CustomizationScreen} />
      <Stack.Screen name="Retail"        component={RetailScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Water"         component={WaterScreen} />
      <Stack.Screen name="Cart"          component={CartScreen} />
      <Stack.Screen name="Checkout"      component={CheckoutScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Support"       component={SupportScreen} />
      <Stack.Screen name="DeliveryDetail" component={DeliveryDetailScreen} />
      <Stack.Screen name="TicketDetail"  component={TicketDetailScreen} />
      <Stack.Screen name="RetailOrders"  component={RetailOrdersScreen} />
      <Stack.Screen name="RetailOrderDetail" component={RetailOrderDetailScreen} />
      <Stack.Screen name="Settings"      component={SettingsScreen} />
      <Stack.Screen name="Faq"           component={FaqScreen} />
      <Stack.Screen name="Refer"         component={ReferScreen} />
      <Stack.Screen name="Register"      component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="Payment"       component={PaymentScreen} />
      <Stack.Screen name="MySubscriptions" component={MySubscriptionsScreen} />
      <Stack.Screen name="SubscriptionManage" component={SubscriptionManageScreen} />
      <Stack.Screen name="ScheduleSelection" component={ScheduleSelectionScreen} />
    </Stack.Navigator>
  );
}

