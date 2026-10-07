/**
 * Armazenamento local NÃO sensível (carrinho, preferências, cache offline).
 * Erros de leitura/escrita são registrados e nunca derrubam o app.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '@/config/constants';
import { logger } from '@/utils/logger';

export async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (error) {
    logger.warn('Falha ao ler do storage', key, error);
    return null;
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    logger.warn('Falha ao gravar no storage', key, error);
  }
}

export async function removeKey(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    logger.warn('Falha ao remover do storage', key, error);
  }
}

/** Remove os dados do usuário (logout). Preferências como tema são mantidas. */
export async function clearUserData(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const userKeys = keys.filter(
      (key) =>
        key.startsWith(STORAGE_KEYS.cachePrefix) ||
        key === STORAGE_KEYS.cart ||
        key === STORAGE_KEYS.notifications ||
        key === STORAGE_KEYS.offlineQueue,
    );
    await AsyncStorage.multiRemove(userKeys);
  } catch (error) {
    logger.warn('Falha ao limpar dados do usuário', error);
  }
}
