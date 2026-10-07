/**
 * Logger do app. Em produção não escreve nada no console (evita vazar dados
 * em logs do dispositivo). Ponto único para plugar Sentry/Crashlytics no futuro.
 */
/* eslint-disable no-console -- único arquivo autorizado a usar o console */

const enabled = typeof __DEV__ !== 'undefined' && __DEV__;

export const logger = {
  debug: (...args: unknown[]): void => {
    if (enabled) console.debug('[sb]', ...args);
  },
  info: (...args: unknown[]): void => {
    if (enabled) console.info('[sb]', ...args);
  },
  warn: (...args: unknown[]): void => {
    if (enabled) console.warn('[sb]', ...args);
  },
  error: (...args: unknown[]): void => {
    if (enabled) console.error('[sb]', ...args);
    // TODO: enviar para o serviço de monitoramento de erros em produção.
  },
};
