/** Utilitários de teste compartilhados. */
import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Provider } from 'react-redux';

import { createStore, type RootState } from '@/store';
import { ThemeProvider } from '@/theme/ThemeProvider';

/** Gera um JWT (assinatura falsa) com `exp` em segundos a partir de agora. */
export function makeJwt(expiresInSeconds: number, claims: Record<string, unknown> = {}): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ exp, ...claims })}.assinatura`;
}

/** RNTL v14: `render` é assíncrono. */
export async function renderWithProviders(ui: ReactElement, preloadedState?: Partial<RootState>) {
  const store = createStore(preloadedState);
  return {
    store,
    ...(await render(
      <Provider store={store}>
        <ThemeProvider>{ui}</ThemeProvider>
      </Provider>,
    )),
  };
}
