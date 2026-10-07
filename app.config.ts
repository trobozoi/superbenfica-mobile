/**
 * Configuração dinâmica do Expo.
 *
 * As URLs da API vêm do `.env` (desenvolvimento) ou do bloco `env` do perfil
 * no `eas.json` (builds). O app lê esses valores SOMENTE por `src/config/env.ts`.
 *
 * Para apontar para produção basta trocar `EXPO_PUBLIC_API_URL` (e, se
 * necessário, `EXPO_PUBLIC_WS_URL`). Nada mais no código precisa mudar.
 */
import type { ConfigContext, ExpoConfig } from 'expo/config';

type AppEnv = 'development' | 'preview' | 'production';

const APP_ENV = (process.env.APP_ENV ?? 'development') as AppEnv;
const IS_PRODUCTION = APP_ENV === 'production';

/** Sufixo para instalar dev/preview/produção lado a lado no mesmo aparelho. */
const VARIANT_SUFFIX: Record<AppEnv, string> = {
  development: '.dev',
  preview: '.preview',
  production: '',
};

const VARIANT_NAME: Record<AppEnv, string> = {
  development: 'Super Benfica (Dev)',
  preview: 'Super Benfica (Preview)',
  production: 'Super Benfica',
};

const BUNDLE_ID = `br.com.superbenfica.cliente${VARIANT_SUFFIX[APP_ENV]}`;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: VARIANT_NAME[APP_ENV],
  slug: 'superbenfica-mobile',
  scheme: 'superbenfica',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  // Segue o tema do sistema; o usuário ainda pode forçar claro/escuro no app.
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: BUNDLE_ID,
    supportsTablet: false,
    infoPlist: {
      // HTTP sem TLS só para rede local em desenvolvimento; produção exige HTTPS.
      ...(IS_PRODUCTION ? {} : { NSAppTransportSecurity: { NSAllowsLocalNetworking: true } }),
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: BUNDLE_ID,
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    // Impede que o Android copie tokens e dados locais para o backup na nuvem.
    allowBackup: false,
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    'expo-secure-store',
    'expo-image',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#FFFFFF',
        dark: { backgroundColor: '#0F1115' },
      },
    ],
    [
      'expo-notifications',
      {
        color: '#C8102E',
      },
    ],
    [
      'expo-build-properties',
      {
        // Cleartext (http://) liberado apenas fora de produção, para a API local.
        android: { usesCleartextTraffic: !IS_PRODUCTION },
      },
    ],
  ],
  extra: {
    appEnv: APP_ENV,
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    wsUrl: process.env.EXPO_PUBLIC_WS_URL,
    androidLocalhostRewrite: process.env.EXPO_PUBLIC_ANDROID_LOCALHOST_REWRITE,
    eas: {
      // Preenchido por `eas init`. Necessário para push notifications remotas.
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
});
