import { Platform } from 'react-native';

import { buildConfig, ConfigError } from './env';

const setOS = (os: 'ios' | 'android') =>
  Object.defineProperty(Platform, 'OS', { value: os, configurable: true });

describe('buildConfig', () => {
  afterEach(() => setOS('ios'));

  it('normaliza a URL e deriva o WebSocket', () => {
    const config = buildConfig({ apiUrl: 'http://127.0.0.1:8000' });
    expect(config.apiUrl).toBe('http://127.0.0.1:8000/');
    expect(config.wsUrl).toBe('ws://127.0.0.1:8000/');
    expect(config.appEnv).toBe('development');
  });

  it('usa wss quando a API é https', () => {
    const config = buildConfig({ apiUrl: 'https://api.exemplo.com/', appEnv: 'production' });
    expect(config.wsUrl).toBe('wss://api.exemplo.com/');
    expect(config.isProduction).toBe(true);
  });

  it('troca 127.0.0.1 por 10.0.2.2 no emulador Android', () => {
    setOS('android');
    expect(buildConfig({ apiUrl: 'http://127.0.0.1:8000/' }).apiUrl).toBe('http://10.0.2.2:8000/');
    expect(
      buildConfig({ apiUrl: 'http://localhost:8000/', androidLocalhostRewrite: 'false' }).apiUrl,
    ).toBe('http://localhost:8000/');
    expect(buildConfig({ apiUrl: 'http://192.168.0.10:8000/' }).apiUrl).toBe(
      'http://192.168.0.10:8000/',
    );
  });

  it('respeita EXPO_PUBLIC_WS_URL explícita', () => {
    const config = buildConfig({ apiUrl: 'http://a.com/', wsUrl: 'ws://b.com:9000' });
    expect(config.wsUrl).toBe('ws://b.com:9000/');
  });

  it('falha sem URL, com URL inválida ou com APP_ENV desconhecido', () => {
    expect(() => buildConfig({})).toThrow(ConfigError);
    expect(() => buildConfig({ apiUrl: 'ftp://x' })).toThrow(ConfigError);
    expect(() => buildConfig({ apiUrl: 'nada' })).toThrow(ConfigError);
    expect(() => buildConfig({ apiUrl: 'http://a.com', appEnv: 'staging' })).toThrow(ConfigError);
  });

  it('exige HTTPS em produção', () => {
    expect(() => buildConfig({ apiUrl: 'http://api.exemplo.com', appEnv: 'production' })).toThrow(
      /https/,
    );
  });
});
