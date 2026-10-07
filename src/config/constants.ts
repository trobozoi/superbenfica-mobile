/** Constantes globais do app (evita literais duplicados — regra S1192 do Sonar). */

export const STORAGE_KEYS = {
  accessToken: 'sb.auth.access',
  refreshToken: 'sb.auth.refresh',
  cart: 'sb.cart',
  settings: 'sb.settings',
  notifications: 'sb.notifications',
  offlineQueue: 'sb.offline-queue',
  cachePrefix: 'sb.cache.',
} as const;

export const API_TIMEOUT_MS = 15_000;

/** Renova o access token quando faltar menos que isto para expirar. */
export const TOKEN_REFRESH_MARGIN_SECONDS = 30;

export const PAGE_SIZE = 20;

export const SEARCH_DEBOUNCE_MS = 400;

export const WEBSOCKET = {
  pingIntervalMs: 25_000,
  initialBackoffMs: 1_000,
  maxBackoffMs: 30_000,
  /** Códigos de fechamento enviados pelo backend (apps/core/consumers.py). */
  closeUnauthorized: 4401,
  closeForbidden: 4403,
} as const;

export const MAX_STORED_NOTIFICATIONS = 50;

export const MAX_ITEM_QUANTITY = 999;
