import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const TOKEN_KEY = 'freshbox_auth_token';

export const useAppStore = create((set, get) => ({
  onboarded: false,
  loggedIn: false,
  token: null,
  user: null,
  themeMode: 'light',
  activePlanId: 'quarterly',
  selectedAddressId: 'a1',
  cartItems: [],
  cartCount: 0,
  walletBalance: 0,
  dueAmount: 0,
  veggieState: {},

  // Auth actions
  hydrateAuth: async () => {
    try {
      let storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      let onboardedStr = await AsyncStorage.getItem('freshbox_onboarded');
      
      if (storedToken) {
        set({ token: storedToken, loggedIn: true, onboarded: onboardedStr === 'true' });
        return storedToken;
      }
    } catch (e) {
      console.error('Error hydrating token', e);
    }
    return null;
  },
  setAuth: async (token, user) => {
    try {
      if (token) {
        await AsyncStorage.setItem(TOKEN_KEY, token);
      }
      set({ token, user, loggedIn: true, walletBalance: user?.wallet_balance || 0, dueAmount: user?.due_amount || 0 });
    } catch (e) {
      console.error('Error saving token', e);
    }
  },
  setUser: (user) => set({ user, walletBalance: user?.wallet_balance || 0, dueAmount: user?.due_amount || 0 }),
  logout: async () => {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem('freshbox_onboarded');
    } catch (e) {}
    set({ token: null, user: null, loggedIn: false, onboarded: false });
  },

  completeOnboarding: async () => {
    try {
      await AsyncStorage.setItem('freshbox_onboarded', 'true');
    } catch (e) {}
    set({ onboarded: true });
  },
  toggleTheme: () => set({ themeMode: 'light' }),
  setActivePlanId: (activePlanId) => set({ activePlanId }),
  setAddress: (selectedAddressId) => set({ selectedAddressId }),
  addToCart: (product, qty = 1) => set((state) => {
    const existing = state.cartItems.find(item => String(item.id) === String(product.id));
    let newCart;
    if (existing) {
      newCart = state.cartItems.map(item =>
        String(item.id) === String(product.id) ? { ...item, qty: item.qty + qty } : item
      );
    } else {
      newCart = [...state.cartItems, { ...product, qty }];
    }
    return {
      cartItems: newCart,
      cartCount: newCart.length
    };
  }),
  updateCartQty: (productId, qty) => set((state) => {
    let newCart;
    if (qty <= 0) {
      newCart = state.cartItems.filter(item => String(item.id) !== String(productId));
    } else {
      newCart = state.cartItems.map(item =>
        String(item.id) === String(productId) ? { ...item, qty } : item
      );
    }
    return {
      cartItems: newCart,
      cartCount: newCart.length
    };
  }),
  clearCart: () => set({ cartItems: [], cartCount: 0 }),
  rechargeWallet: (amount) => set((state) => ({ walletBalance: state.walletBalance + Number(amount || 0) })),
  setWallet: (walletBalance, dueAmount) => set({ walletBalance, dueAmount }),
  initVeggieState: (veggieState) => set({ veggieState }),
  togglePlanVeggie: (planId, veggieId) => set((state) => ({
    veggieState: {
      ...state.veggieState,
      [planId]: state.veggieState[planId]?.map(v => 
        v.id === veggieId ? { ...v, selected: !v.selected } : v
      ) || []
    }
  }))
}));

