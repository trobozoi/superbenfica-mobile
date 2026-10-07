/**
 * Observa a conexão com a internet: atualiza o store, reenvia a fila offline
 * e reconecta o WebSocket quando a conexão volta.
 */
import NetInfo from '@react-native-community/netinfo';
import { useEffect, useRef } from 'react';

import { flushQueue } from '@/services/offline/offlineQueue';
import { useAppDispatch } from '@/store/hooks';
import { connectivityChanged } from '@/store/slices/appSlice';
import { logger } from '@/utils/logger';

export function useConnectivity(onReconnect?: () => void): void {
  const dispatch = useAppDispatch();
  const wasOnline = useRef(true);
  const reconnectRef = useRef(onReconnect);

  useEffect(() => {
    reconnectRef.current = onReconnect;
  }, [onReconnect]);

  useEffect(() => {
    return NetInfo.addEventListener((state) => {
      // `isInternetReachable` pode ser null enquanto o sistema verifica.
      const online = !!state.isConnected && state.isInternetReachable !== false;
      dispatch(connectivityChanged(online));

      if (online && !wasOnline.current) {
        flushQueue()
          .then((sent) => sent > 0 && logger.info(`${sent} ação(ões) offline enviadas`))
          .catch((error: unknown) => logger.warn('Falha ao enviar fila offline', error));
        reconnectRef.current?.();
      }
      wasOnline.current = online;
    });
  }, [dispatch]);
}
