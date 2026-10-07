import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { MAX_STORED_NOTIFICATIONS } from '@/config/constants';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
  /** Pedido relacionado, para abrir o acompanhamento ao tocar. */
  orderId?: number;
}

export interface NotificationsState {
  items: AppNotification[];
}

const initialState: NotificationsState = { items: [] };

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    notificationsHydrated: (_state, action: PayloadAction<NotificationsState | null>) =>
      action.payload ?? initialState,
    notificationReceived: (state, action: PayloadAction<Omit<AppNotification, 'read'>>) => {
      state.items.unshift({ ...action.payload, read: false });
      state.items = state.items.slice(0, MAX_STORED_NOTIFICATIONS);
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const item = state.items.find((n) => n.id === action.payload);
      if (item) item.read = true;
    },
    markAllAsRead: (state) => {
      state.items.forEach((item) => {
        item.read = true;
      });
    },
    clearNotifications: () => initialState,
  },
});

export const {
  notificationsHydrated,
  notificationReceived,
  markAsRead,
  markAllAsRead,
  clearNotifications,
} = notificationsSlice.actions;
export default notificationsSlice.reducer;

type WithNotifications = { notifications: NotificationsState };

export const selectNotifications = (state: WithNotifications) => state.notifications.items;
export const selectUnreadCount = createSelector(
  selectNotifications,
  (items) => items.filter((n) => !n.read).length,
);
