/**
 * ÚNICA fonte de configuração de ambiente do app.
 *
 * Os valores vêm de `app.config.ts` (`extra`), que por sua vez lê o `.env`
 * ou o perfil do `eas.json`. Nenhum outro arquivo deve ler `process.env`
 * ou `Constants.expoConfig` diretamente.
 *
 * Para trocar a API de desenvolvimento pela de produção, altere apenas
 * `EXPO_PUBLIC_API_URL` no `.env` / `eas.json`.
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type AppEnv = 'development' | 'preview' | 'production';

export interface AppConfig {
  appEnv: AppEnv;
  /** URL base da API, sempre terminando em `/` (ex.: `http://127.0.0.1:8000/`). */
  apiUrl: string;
  /** URL base do WebSocket, sempre terminando em `/` (ex.: `ws://127.0.0.1:8000/`). */
  wsUrl: string;
  isProduction: boolean;
  easProjectId?: string;
}

export interface RawExtra {
  appEnv?: string;
  apiUrl?: string;
  wsUrl?: string;
  androidLocalhostRewrite?: string;
  eas?: { projectId?: string };
}

interface ParsedUrl {
  protocol: string;
  host: string;
  rest: string;
}

const APP_ENVS: readonly AppEnv[] = ['development', 'preview', 'production'];
const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost']);
/**
 * Endereço da máquina host visto de dentro do emulador Android.
 * Só é usado fora de produção (ver `buildConfig`).
 */
// eslint-disable-next-line sonarjs/no-hardcoded-ip -- alias fixo do emulador Android, apenas em desenvolvimento
const ANDROID_EMULATOR_HOST = '10.0.2.2';
const PROTOCOLS = new Set(['http', 'https', 'ws', 'wss']);
const HOST_END = /[/:?#]/;

export class ConfigError extends Error {
  constructor(message: string) {
    super(`[config] ${message}`);
    this.name = 'ConfigError';
  }
}

/**
 * Separa protocolo://host[:porta][/caminho] sem regex com backtracking e sem
 * a classe `URL` (no React Native ela não implementa os setters).
 */
function parseUrl(value: string, name: string): ParsedUrl {
  const trimmed = value.trim();
  const separator = trimmed.indexOf('://');
  const protocol = separator > 0 ? trimmed.slice(0, separator).toLowerCase() : '';
  const afterProtocol = trimmed.slice(separator + 3);
  const hostEnd = afterProtocol.search(HOST_END);
  const host = hostEnd === -1 ? afterProtocol : afterProtocol.slice(0, hostEnd);

  if (!PROTOCOLS.has(protocol) || !host) {
    throw new ConfigError(`${name} inválida: "${value}". Verifique o .env / eas.json.`);
  }
  return { protocol, host, rest: hostEnd === -1 ? '' : afterProtocol.slice(hostEnd) };
}

function format(url: ParsedUrl): string {
  const full = `${url.protocol}://${url.host}${url.rest}`;
  return full.endsWith('/') ? full : `${full}/`;
}

/**
 * No emulador Android, `127.0.0.1` aponta para o próprio emulador.
 * Trocamos pelo IP especial do host, salvo se desativado no `.env`.
 */
function rewriteLocalhostForAndroid(url: ParsedUrl, enabled: boolean): ParsedUrl {
  if (!enabled || Platform.OS !== 'android' || !LOCAL_HOSTS.has(url.host)) {
    return url;
  }
  return { ...url, host: ANDROID_EMULATOR_HOST };
}

function deriveWsUrl(api: ParsedUrl): ParsedUrl {
  return { ...api, protocol: api.protocol === 'https' ? 'wss' : 'ws' };
}

/** Monta e valida a configuração. Exportada para testes. */
export function buildConfig(extra: RawExtra): AppConfig {
  const appEnv = (extra.appEnv ?? 'development') as AppEnv;
  if (!APP_ENVS.includes(appEnv)) {
    throw new ConfigError(`APP_ENV desconhecido: "${extra.appEnv}".`);
  }
  if (!extra.apiUrl) {
    throw new ConfigError('EXPO_PUBLIC_API_URL não definida. Copie .env.example para .env.');
  }

  const isProduction = appEnv === 'production';
  const rewrite = !isProduction && extra.androidLocalhostRewrite !== 'false';

  const api = rewriteLocalhostForAndroid(parseUrl(extra.apiUrl, 'EXPO_PUBLIC_API_URL'), rewrite);
  const ws = extra.wsUrl
    ? rewriteLocalhostForAndroid(parseUrl(extra.wsUrl, 'EXPO_PUBLIC_WS_URL'), rewrite)
    : deriveWsUrl(api);

  // Em produção, tráfego sem criptografia é proibido.
  if (isProduction && (api.protocol !== 'https' || ws.protocol !== 'wss')) {
    throw new ConfigError('Em produção a API deve usar https:// e o WebSocket wss://.');
  }

  return {
    appEnv,
    apiUrl: format(api),
    wsUrl: format(ws),
    isProduction,
    easProjectId: extra.eas?.projectId || undefined,
  };
}

/** Configuração validada na inicialização: falha cedo e com mensagem clara. */
export const env: AppConfig = buildConfig((Constants.expoConfig?.extra ?? {}) as RawExtra);
