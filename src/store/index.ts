import { combineReducers, configureStore } from '@reduxjs/toolkit';

import { setSessionExpiredHandler } from '@/services/api/client';

import { persistenceMiddleware } from './persistence';
import appReducer from './slices/appSlice';
import authReducer, { sessionExpired } from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import notificationsReducer from './slices/notificationsSlice';
import settingsReducer from './slices/settingsSlice';

export const rootReducer = combineReducers({
  app: appReducer,
  auth: authReducer,
  cart: cartReducer,
  notifications: notificationsReducer,
  settings: settingsReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export function createStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefault) => getDefault().prepend(persistenceMiddleware.middleware),
  });
}

export const store = createStore();

export type AppStore = ReturnType<typeof createStore>;
export type AppDispatch = AppStore['dispatch'];

// O cliente HTTP não conhece o store; ele só avisa que a sessão expirou.
setSessionExpiredHandler(() => store.dispatch(sessionExpired()));
