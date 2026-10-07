/**
 * Carregamento protegido do `expo-notifications`.
 *
 * Desde o SDK 53, o pacote lança um erro já na IMPORTAÇÃO quando roda no
 * Expo Go do Android (o registro automático de token de push é executado ao
 * carregar o módulo). Por isso ninguém importa `expo-notifications`
 * diretamente: use `getNotifications()`, que retorna `null` nesse ambiente.
 * Em dev builds e builds de loja tudo funciona normalmente.
 */
import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

export const notificationsSupported = !(Platform.OS === 'android' && isRunningInExpoGo());

let cached: NotificationsModule | null = null;

export function getNotifications(): NotificationsModule | null {
  if (!notificationsSupported) return null;
  // require sob demanda: o import estático executaria o código que quebra no Expo Go.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  cached ??= require('expo-notifications') as NotificationsModule;
  return cached;
}
