/**
 * Deep links (`superbenfica://pedido/15`) e abertura de telas ao tocar numa
 * notificação push que traga `data.orderId`.
 */
import type { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import type { NotificationResponse } from 'expo-notifications';

import { getNotifications } from '@/services/notifications/notificationsModule';

import type { AppStackParamList } from './types';

function urlFromNotification(response: NotificationResponse | null): string | null {
  const orderId = response?.notification.request.content.data?.orderId;
  return typeof orderId === 'number' ? Linking.createURL(`pedido/${orderId}`) : null;
}

export const linking: LinkingOptions<AppStackParamList> = {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      Tabs: {
        screens: {
          Home: '',
          Explore: 'explorar',
          Cart: 'carrinho',
          Orders: 'pedidos',
          Profile: 'perfil',
        },
      },
      ProductDetails: { path: 'produto/:productId', parse: { productId: Number } },
      OrderTracking: { path: 'pedido/:orderId', parse: { orderId: Number } },
      Notifications: 'notificacoes',
    },
  },
  async getInitialURL() {
    const url = await Linking.getInitialURL();
    if (url) return url;
    // No Expo Go do Android o módulo de notificações não existe (ver notificationsModule.ts).
    return urlFromNotification(getNotifications()?.getLastNotificationResponse() ?? null);
  },
  subscribe(listener) {
    const linkSub = Linking.addEventListener('url', ({ url }) => listener(url));
    const notificationSub = getNotifications()?.addNotificationResponseReceivedListener(
      (response) => {
        const url = urlFromNotification(response);
        if (url) listener(url);
      },
    );
    return () => {
      linkSub.remove();
      notificationSub?.remove();
    };
  },
};
