/**
 * Persistência seletiva do store no AsyncStorage (carrinho, preferências e
 * notificações). Usa o listener middleware do RTK em vez de redux-persist
 * para gravar só o que muda, sem dependência extra.
 */
import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';

import { STORAGE_KEYS } from '@/config/constants';
import { readJson, writeJson } from '@/services/storage/storage';

import { logout, sessionExpired } from './slices/authSlice';
import {
  addItem,
  cartHydrated,
  clearCart,
  removeItem,
  setQuantity,
  type CartState,
} from './slices/cartSlice';
import {
  clearNotifications,
  markAllAsRead,
  markAsRead,
  notificationReceived,
  notificationsHydrated,
  type NotificationsState,
} from './slices/notificationsSlice';
import {
  setNotificationsEnabled,
  setTheme,
  settingsHydrated,
  type SettingsState,
} from './slices/settingsSlice';

interface PersistedSlices {
  cart: CartState;
  notifications: NotificationsState;
  settings: SettingsState;
}

export const persistenceMiddleware = createListenerMiddleware();

persistenceMiddleware.startListening({
  matcher: isAnyOf(addItem, setQuantity, removeItem, clearCart),
  effect: async (_action, api) => {
    await writeJson(STORAGE_KEYS.cart, (api.getState() as PersistedSlices).cart);
  },
});

persistenceMiddleware.startListening({
  matcher: isAnyOf(notificationReceived, markAsRead, markAllAsRead, clearNotifications),
  effect: async (_action, api) => {
    await writeJson(STORAGE_KEYS.notifications, (api.getState() as PersistedSlices).notifications);
  },
});

persistenceMiddleware.startListening({
  matcher: isAnyOf(setTheme, setNotificationsEnabled),
  effect: async (_action, api) => {
    await writeJson(STORAGE_KEYS.settings, (api.getState() as PersistedSlices).settings);
  },
});

// Ao sair, o carrinho e as notificações do usuário anterior são descartados.
persistenceMiddleware.startListening({
  matcher: isAnyOf(logout.fulfilled, sessionExpired),
  effect: (_action, api) => {
    api.dispatch(clearCart());
    api.dispatch(clearNotifications());
  },
});

/** Carrega os dados salvos para o store (chamado na inicialização). */
export async function hydrateStore(dispatch: (action: unknown) => unknown): Promise<void> {
  const [cart, notifications, settings] = await Promise.all([
    readJson<CartState>(STORAGE_KEYS.cart),
    readJson<NotificationsState>(STORAGE_KEYS.notifications),
    readJson<Partial<SettingsState>>(STORAGE_KEYS.settings),
  ]);
  dispatch(cartHydrated(cart));
  dispatch(notificationsHydrated(notifications));
  dispatch(settingsHydrated(settings));
}
