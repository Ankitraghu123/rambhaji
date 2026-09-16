// src/features/notifications/state/notificationSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],    // [{ id, type, title, body, data, readAt, receivedAt }]
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      state.items.unshift({ ...action.payload, readAt: null, receivedAt: Date.now() });
      state.unreadCount += 1;
    },
    markAllRead: (state) => {
      state.items = state.items.map((n) => ({ ...n, readAt: n.readAt ?? Date.now() }));
      state.unreadCount = 0;
    },
    markRead: (state, action) => {
      const item = state.items.find((n) => n.id === action.payload);
      if (item && !item.readAt) {
        item.readAt = Date.now();
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    clearNotifications: () => initialState,
  },
});

export const {
  addNotification,
  markAllRead,
  markRead,
  clearNotifications,
} = notificationSlice.actions;

export const selectAllNotifications = (state) => state.notifications.items;
export const selectUnreadCount = (state) => state.notifications.unreadCount;

export default notificationSlice.reducer;
