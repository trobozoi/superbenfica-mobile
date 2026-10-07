/**
 * Busca de dados com estados de loading/erro/refresh e cache offline opcional.
 * Mantém as telas declarativas: `const { data, loading, error, refetch } = useApiQuery(...)`.
 *
 * `loading` é derivado (a chave atual ainda não foi carregada) e o estado só é
 * atualizado depois do `await`, evitando renders em cascata dentro de efeitos.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { getErrorMessage } from '@/services/api/errors';
import { fetchWithOfflineCache } from '@/services/offline/offlineCache';

export interface RefetchOptions {
  /** Atualiza sem mostrar o indicador de "puxar para atualizar". */
  silent?: boolean;
}

export interface ApiQueryState<T> {
  data: T | undefined;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  /** Dados exibidos vieram do cache (sem conexão). */
  stale: boolean;
  refetch: (options?: RefetchOptions) => Promise<void>;
}

interface Options {
  /** Chave do cache offline; sem ela, nada é salvo localmente. */
  cacheKey?: string;
  enabled?: boolean;
}

interface QueryResult<T> {
  key?: string;
  data?: T;
  error: string | null;
  stale: boolean;
}

export function useApiQuery<T>(
  fetcher: () => Promise<T>,
  deps: readonly unknown[],
  { cacheKey, enabled = true }: Options = {},
): ApiQueryState<T> {
  const key = `${cacheKey ?? ''}|${JSON.stringify(deps)}`;
  const [result, setResult] = useState<QueryResult<T>>({ error: null, stale: false });
  const [refreshing, setRefreshing] = useState(false);
  const fetcherRef = useRef(fetcher);
  const latestKey = useRef(key);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const load = useCallback(
    async (forKey: string) => {
      try {
        const response = cacheKey
          ? await fetchWithOfflineCache(cacheKey, () => fetcherRef.current())
          : { data: await fetcherRef.current(), fromCache: false };
        // Ignora respostas antigas (ex.: o usuário trocou de filtro no meio).
        if (latestKey.current !== forKey) return;
        setResult({ key: forKey, data: response.data, error: null, stale: response.fromCache });
      } catch (err) {
        if (latestKey.current !== forKey) return;
        setResult((prev) => ({ ...prev, key: forKey, error: getErrorMessage(err) }));
      }
    },
    [cacheKey],
  );

  useEffect(() => {
    latestKey.current = key;
    if (enabled) void load(key);
  }, [key, enabled, load]);

  const refetch = useCallback(
    async ({ silent = false }: RefetchOptions = {}) => {
      if (!silent) setRefreshing(true);
      try {
        await load(latestKey.current);
      } finally {
        if (!silent) setRefreshing(false);
      }
    },
    [load],
  );

  return {
    data: result.data,
    loading: enabled && result.key !== key,
    refreshing,
    error: result.key === key ? result.error : null,
    stale: result.stale,
    refetch,
  };
}
