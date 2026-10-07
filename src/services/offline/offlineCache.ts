/**
 * Cache "network-first" para o modo offline: tenta a API; se der erro de
 * rede, devolve a última resposta salva. Só para dados NÃO sensíveis
 * (catálogo, lojas, formas de pagamento, histórico de pedidos).
 */
import { STORAGE_KEYS } from '@/config/constants';
import { toApiError } from '@/services/api/errors';
import { readJson, writeJson } from '@/services/storage/storage';

export interface CachedResult<T> {
  data: T;
  /** `true` quando os dados vieram do cache por falta de conexão. */
  fromCache: boolean;
  savedAt?: number;
}

interface CacheEntry<T> {
  data: T;
  savedAt: number;
}

export async function fetchWithOfflineCache<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
): Promise<CachedResult<T>> {
  const storageKey = `${STORAGE_KEYS.cachePrefix}${cacheKey}`;
  try {
    const data = await fetcher();
    await writeJson(storageKey, { data, savedAt: Date.now() } satisfies CacheEntry<T>);
    return { data, fromCache: false };
  } catch (error) {
    const apiError = toApiError(error);
    if (apiError.isNetworkError) {
      const cached = await readJson<CacheEntry<T>>(storageKey);
      if (cached) return { data: cached.data, fromCache: true, savedAt: cached.savedAt };
    }
    throw apiError;
  }
}
