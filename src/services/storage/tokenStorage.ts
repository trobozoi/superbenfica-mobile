/**
 * Tokens JWT ficam SOMENTE no armazenamento seguro do sistema
 * (Keychain no iOS, Keystore no Android). Nunca use AsyncStorage para isso.
 *
 * Mantemos uma cópia em memória para não ir ao Keychain a cada requisição.
 */
import * as SecureStore from 'expo-secure-store';

import { STORAGE_KEYS } from '@/config/constants';
import type { TokenPair } from '@/types/api';

const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  // Disponível após o primeiro desbloqueio; não migra para outro aparelho via backup.
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

let cache: TokenPair | null = null;
let loaded = false;

export const tokenStorage = {
  async load(): Promise<TokenPair | null> {
    if (loaded) return cache;
    const [access, refresh] = await Promise.all([
      SecureStore.getItemAsync(STORAGE_KEYS.accessToken, SECURE_OPTIONS),
      SecureStore.getItemAsync(STORAGE_KEYS.refreshToken, SECURE_OPTIONS),
    ]);
    cache = access && refresh ? { access, refresh } : null;
    loaded = true;
    return cache;
  },

  get(): TokenPair | null {
    return cache;
  },

  async save(tokens: TokenPair): Promise<void> {
    cache = tokens;
    loaded = true;
    await Promise.all([
      SecureStore.setItemAsync(STORAGE_KEYS.accessToken, tokens.access, SECURE_OPTIONS),
      SecureStore.setItemAsync(STORAGE_KEYS.refreshToken, tokens.refresh, SECURE_OPTIONS),
    ]);
  },

  async clear(): Promise<void> {
    cache = null;
    loaded = true;
    await Promise.all([
      SecureStore.deleteItemAsync(STORAGE_KEYS.accessToken, SECURE_OPTIONS),
      SecureStore.deleteItemAsync(STORAGE_KEYS.refreshToken, SECURE_OPTIONS),
    ]);
  },
};
