/**
 * Inicialização: carrega dados persistidos, restaura a sessão e só então
 * esconde a splash nativa (evita "piscar" a tela de login).
 */
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { useAppDispatch } from '@/store/hooks';
import { hydrateStore } from '@/store/persistence';
import { restoreSession } from '@/store/slices/authSlice';
import { logger } from '@/utils/logger';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export function useBootstrap(): void {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const run = async () => {
      try {
        await hydrateStore(dispatch);
        await dispatch(restoreSession());
      } catch (error) {
        logger.error('Falha na inicialização', error);
      } finally {
        await SplashScreen.hideAsync().catch(() => undefined);
      }
    };
    void run();
  }, [dispatch]);
}
