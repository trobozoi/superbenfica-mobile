/**
 * Raiz do app: providers globais (Redux, tema, safe area, error boundary) e
 * serviços de fundo (conectividade, WebSocket, notificações).
 */
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useConnectivity } from '@/hooks/useConnectivity';
import { useRealtime } from '@/hooks/useRealtime';
import { RootNavigator } from '@/navigation/RootNavigator';
import {
  getPushToken,
  requestNotificationPermission,
} from '@/services/notifications/pushNotifications';
import { store } from '@/store';
import { useAppSelector } from '@/store/hooks';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { logger } from '@/utils/logger';

import { useBootstrap } from './useBootstrap';

function BackgroundServices() {
  useBootstrap();
  const realtime = useRealtime();
  useConnectivity(() => realtime.reconnectNow());

  const authenticated = useAppSelector((state) => state.auth.status === 'authenticated');
  const notificationsEnabled = useAppSelector((state) => state.settings.notificationsEnabled);

  // Pede permissão de notificação só depois do login (melhor taxa de aceite).
  useEffect(() => {
    if (!authenticated || !notificationsEnabled) return;
    void requestNotificationPermission()
      .then((granted) => (granted ? getPushToken() : null))
      .then((token) => token && logger.debug('Expo push token obtido'));
  }, [authenticated, notificationsEnabled]);

  return null;
}

function ThemedApp() {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <BackgroundServices />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <SafeAreaProvider>
          <ThemeProvider>
            <ThemedApp />
          </ThemeProvider>
        </SafeAreaProvider>
      </Provider>
    </ErrorBoundary>
  );
}
