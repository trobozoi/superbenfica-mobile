/**
 * Instância Axios única do app.
 *
 * - `baseURL` vem de `config/env.ts` (troca dev/produção em um só lugar).
 * - Injeta `Authorization: Bearer <access>`.
 * - Renova o access token ANTES de expirar e, como fallback, ao receber 401.
 * - Várias requisições simultâneas compartilham UM único refresh
 *   (o backend rotaciona o refresh token; dois refreshes em paralelo
 *   invalidariam a sessão).
 * - Se o refresh falhar, avisa o app (`onSessionExpired`) para fazer logout.
 */
import { AxiosHeaders, create, type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { API_TIMEOUT_MS, TOKEN_REFRESH_MARGIN_SECONDS } from '@/config/constants';
import { env } from '@/config/env';
import { tokenStorage } from '@/services/storage/tokenStorage';
import type { TokenPair } from '@/types/api';
import { isTokenExpiring } from '@/utils/jwt';
import { logger } from '@/utils/logger';

import { AUTH_ROUTES_WITHOUT_REFRESH, ENDPOINTS } from './endpoints';
import { toApiError } from './errors';

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

export const api = create({
  baseURL: env.apiUrl,
  timeout: API_TIMEOUT_MS,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

/** Cliente sem interceptors, usado só para o refresh (evita recursão). Exportado para testes. */
export const refreshClient = create({ baseURL: env.apiUrl, timeout: API_TIMEOUT_MS });

let refreshPromise: Promise<string> | null = null;
let sessionExpiredHandler: (() => void) | null = null;

/** Registrado pelo store para despachar logout quando a sessão expira. */
export function setSessionExpiredHandler(handler: (() => void) | null): void {
  sessionExpiredHandler = handler;
}

function isAuthRoute(url?: string): boolean {
  return !!url && AUTH_ROUTES_WITHOUT_REFRESH.some((route) => url.endsWith(route));
}

async function performRefresh(): Promise<string> {
  const current = tokenStorage.get();
  if (!current?.refresh) {
    throw new Error('Sem refresh token');
  }
  const { data } = await refreshClient.post<Partial<TokenPair>>(ENDPOINTS.auth.refresh, {
    refresh: current.refresh,
  });
  if (!data.access) {
    throw new Error('Resposta de refresh sem access token');
  }
  // O backend rotaciona o refresh: guarde o novo, se vier.
  await tokenStorage.save({ access: data.access, refresh: data.refresh ?? current.refresh });
  return data.access;
}

/** Renova o access token garantindo uma única chamada em andamento. */
export function refreshAccessToken(): Promise<string> {
  refreshPromise ??= performRefresh()
    .catch(async (error: unknown) => {
      logger.warn('Falha ao renovar sessão', error);
      await tokenStorage.clear();
      sessionExpiredHandler?.();
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

/** Retorna um access token válido (renovando se estiver para expirar). */
export async function getValidAccessToken(): Promise<string | null> {
  const tokens = tokenStorage.get();
  if (!tokens) return null;
  if (isTokenExpiring(tokens.access, TOKEN_REFRESH_MARGIN_SECONDS)) {
    return refreshAccessToken();
  }
  return tokens.access;
}

api.interceptors.request.use(async (config) => {
  if (isAuthRoute(config.url)) return config;
  const token = await getValidAccessToken().catch(() => null);
  if (token) {
    config.headers = AxiosHeaders.from(config.headers);
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const canRetry =
      error.response?.status === 401 &&
      config &&
      !config._retried &&
      !isAuthRoute(config.url) &&
      tokenStorage.get() !== null;

    if (canRetry) {
      config._retried = true;
      try {
        const token = await refreshAccessToken();
        config.headers.set('Authorization', `Bearer ${token}`);
        return await api.request(config);
      } catch (refreshError) {
        throw toApiError(refreshError);
      }
    }
    throw toApiError(error);
  },
);
