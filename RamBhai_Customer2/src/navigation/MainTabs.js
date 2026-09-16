// import React from 'react';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { MaterialCommunityIcons } from '@expo/vector-icons';
// import { useAppStore } from '../store/UseAppStore';
// import { themeTokens } from '../constants/theme';

// import HomeScreen from '../screens/HomeScreen';
// import PlansScreen from '../screens/PlansScreen';
// import DeliveriesScreen from '../screens/DeliveriesScreen';
// import WalletScreen from '../screens/WalletScreen';
// import ProfileScreen from '../screens/ProfileScreen';

// const Tab = createBottomTabNavigator();

// export default function MainTabs() {
//   const mode = useAppStore((s) => s.themeMode);
//   const colors = themeTokens[mode];

//   return (
//     <Tab.Navigator
//       screenOptions={({ route }) => ({
//         headerShown: false,
//         tabBarActiveTintColor: colors.primary,
//         tabBarInactiveTintColor: colors.tabInactive,
//         tabBarStyle: {
//           backgroundColor: colors.tabBar,
//           borderTopColor: colors.border,
//           height: 68,
//           paddingBottom: 10,
//           paddingTop: 8
//         },
//         tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
//         tabBarIcon: ({ color, size }) => {
//           const map = {
//             Home: 'home-variant',
//             Plans: 'leaf',
//             Deliveries: 'truck-delivery-outline',
//             Wallet: 'wallet-outline',
//             Account: 'account-circle-outline'
//           };
//           return <MaterialCommunityIcons name={map[route.name]} color={color} size={size} />;
//         }
//       })}
//     >
//       <Tab.Screen name="Home" component={HomeScreen} />
//       <Tab.Screen name="Plans" component={PlansScreen} />
//       <Tab.Screen name="Deliveries" component={DeliveriesScreen} />
//       <Tab.Screen name="Wallet" component={WalletScreen} />
//       <Tab.Screen name="Account" component={ProfileScreen} />
//     </Tab.Navigator>
//   );
// }


import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../store/UseAppStore';
import { themeTokens } from '../constants/theme';

import HomeScreen from '../screens/HomeScreen';
import PlansScreen from '../screens/PlansScreen';
import DeliveriesScreen from '../screens/DeliveriesScreen';
import WalletScreen from '../screens/WalletScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const mode = useAppStore((s) => s.themeMode);
  const colors = themeTokens[mode];
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent || colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarBackground: () => (
          <BlurView
            intensity={82}
            tint="light"
            style={{
              flex: 1,
              backgroundColor: 'rgba(255,255,255,0.78)',
              overflow: 'hidden',
            }}
          />
        ),
        tabBarStyle: {
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: Math.max(insets.bottom, 10),
          height: 64,
          borderRadius: 24,
          borderWidth: 1,
          borderTopWidth: 1,
          borderColor: 'rgba(23,124,255,0.18)',
          backgroundColor: 'rgba(255,255,255,0.8)',
          overflow: 'hidden',
          paddingBottom: 8,
          paddingTop: 8,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 14 },
          shadowOpacity: 0.18,
          shadowRadius: 22,
          elevation: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '900', marginTop: 0 },
        tabBarItemStyle: {
          borderRadius: 20,
          marginHorizontal: 2,
        },
        tabBarIcon: ({ color, focused }) => {
          const map = {
            Home: 'home-variant',
            Plans: 'text-box-outline',
            Deliveries: 'truck-delivery-outline',
            Wallet: 'wallet-outline',
            Account: 'account-circle-outline',
          };
          return (
            <View
              style={{
                width: 34,
                height: 30,
                borderRadius: 15,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? 'rgba(244,63,143,0.12)' : 'transparent',
              }}
            >
              <MaterialCommunityIcons name={map[route.name]} color={color} size={focused ? 23 : 21} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Plans" component={PlansScreen} />
      <Tab.Screen name="Deliveries" component={DeliveriesScreen} />
      <Tab.Screen name="Wallet" component={WalletScreen} />
      <Tab.Screen name="Account" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
