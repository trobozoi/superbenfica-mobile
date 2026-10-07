/**
 * Notificações push.
 *
 * Hoje o backend envia os eventos pelo WebSocket; quando o app recebe uma
 * mudança de status, mostra uma notificação LOCAL. O token de push remoto
 * (Expo Push) já é obtido para o dia em que o backend tiver um endpoint
 * de registro de dispositivos.
 *
 * No Expo Go do Android o módulo não está disponível (ver `notificationsModule.ts`):
 * as funções viram no-op e o app segue com a lista de notificações interna.
 */
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { env } from '@/config/env';
import { logger } from '@/utils/logger';

import { getNotifications } from './notificationsModule';

const ANDROID_CHANNEL_ID = 'pedidos';

let handlerConfigured = false;

/** Define como notificações recebidas com o app aberto são exibidas (uma vez). */
function configureHandler(): void {
  const Notifications = getNotifications();
  if (!Notifications || handlerConfigured) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: () =>
      Promise.resolve({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
  });
}

async function ensureAndroidChannel(): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications || Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Status dos pedidos',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

/** Pede permissão (uma vez) e retorna se as notificações estão liberadas. */
export async function requestNotificationPermission(): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) return false;
  configureHandler();
  await ensureAndroidChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * Token do Expo Push. Só funciona em aparelho físico e com `projectId` do EAS.
 * TODO: enviar ao backend quando existir o endpoint de dispositivos.
 */
export async function getPushToken(): Promise<string | null> {
  const Notifications = getNotifications();
  if (!Notifications || !Device.isDevice || !env.easProjectId) return null;
  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId: env.easProjectId });
    return data;
  } catch (error) {
    logger.warn('Não foi possível obter o token de push', error);
    return null;
  }
}

export async function showLocalNotification(
  title: string,
  body: string,
  data: Record<string, unknown> = {},
): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;
  configureHandler();
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data },
      trigger: Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : null,
    });
  } catch (error) {
    logger.warn('Falha ao exibir notificação local', error);
  }
}
