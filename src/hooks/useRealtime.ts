/**
 * Liga o WebSocket enquanto o usuário está logado e transforma eventos de
 * pedido em: atualização do store + notificação na lista + notificação local.
 */
import { useEffect, useMemo } from 'react';
import { AppState } from 'react-native';

import { getValidAccessToken, refreshAccessToken } from '@/services/api/client';
import { showLocalNotification } from '@/services/notifications/pushNotifications';
import { RealtimeClient } from '@/services/websocket/realtimeClient';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { orderEventReceived, realtimeStateChanged } from '@/store/slices/appSlice';
import { notificationReceived } from '@/store/slices/notificationsSlice';
import type { PedidoEventoDados } from '@/types/api';
import { STATUS_PEDIDO_LABEL } from '@/utils/format';

const ORDER_EVENTS = new Set(['pedido.criado', 'pedido.atualizado']);

function isOrderEvent(dados: unknown): dados is PedidoEventoDados {
  return !!dados && typeof dados === 'object' && 'pedido_id' in dados && 'status' in dados;
}

export function useRealtime(): RealtimeClient {
  const dispatch = useAppDispatch();
  const authenticated = useAppSelector((state) => state.auth.status === 'authenticated');
  const notificationsEnabled = useAppSelector((state) => state.settings.notificationsEnabled);

  const client = useMemo(
    () => new RealtimeClient({ getToken: getValidAccessToken, refreshToken: refreshAccessToken }),
    [],
  );

  useEffect(
    () => client.onStateChange((state) => dispatch(realtimeStateChanged(state))),
    [client, dispatch],
  );

  useEffect(
    () =>
      client.onMessage(({ evento, dados }) => {
        if (!ORDER_EVENTS.has(evento) || !isOrderEvent(dados)) return;
        dispatch(orderEventReceived(dados));

        const title = `Pedido ${dados.codigo}`;
        const body =
          evento === 'pedido.criado'
            ? 'Recebemos o seu pedido!'
            : `Status: ${STATUS_PEDIDO_LABEL[dados.status] ?? dados.status}`;
        dispatch(
          notificationReceived({
            id: `${dados.pedido_id}-${dados.status}-${Date.now()}`,
            title,
            body,
            createdAt: Date.now(),
            orderId: dados.pedido_id,
          }),
        );
        if (notificationsEnabled) {
          void showLocalNotification(title, body, { orderId: dados.pedido_id });
        }
      }),
    [client, dispatch, notificationsEnabled],
  );

  useEffect(() => {
    if (!authenticated) {
      client.stop();
      return undefined;
    }
    client.start();
    // Ao voltar do segundo plano, reconecta imediatamente (o SO pode ter derrubado o socket).
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') client.reconnectNow();
    });
    return () => {
      subscription.remove();
      client.stop();
    };
  }, [authenticated, client]);

  return client;
}
