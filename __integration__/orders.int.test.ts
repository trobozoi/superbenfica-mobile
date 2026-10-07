import { catalogService } from '@/services/api/catalog.service';
import { getValidAccessToken, refreshAccessToken } from '@/services/api/client';
import { ordersService } from '@/services/api/orders.service';
import { RealtimeClient, type ConnectionState } from '@/services/websocket/realtimeClient';
import type { RealtimeMessage } from '@/types/api';

import { describeApi, itWrites, useSharedSession } from './helpers';

const API_URL = process.env.TEST_API_URL ?? 'http://127.0.0.1:8000/';
const ORIGIN = API_URL.replace(/\/$/, '');

/**
 * O backend usa `AllowedHostsOriginValidator`: sem header Origin o handshake é
 * recusado (403). O WebSocket nativo do React Native envia o Origin sozinho;
 * o do Node não, então aqui ele é passado explicitamente.
 */
type NodeWebSocket = new (url: string, init: { headers: Record<string, string> }) => WebSocket;
const createSocket = (url: string) =>
  new (WebSocket as unknown as NodeWebSocket)(url, { headers: { Origin: ORIGIN } });

function newRealtimeClient(): RealtimeClient {
  return new RealtimeClient({
    getToken: getValidAccessToken,
    refreshToken: refreshAccessToken,
    createSocket,
  });
}

function waitFor<T>(
  register: (resolve: (value: T) => void) => void,
  timeoutMs = 10_000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout aguardando evento')), timeoutMs);
    register((value) => {
      clearTimeout(timer);
      resolve(value);
    });
  });
}

describeApi('Pedidos e tempo real (API real)', () => {
  beforeAll(useSharedSession);

  it('lista os pedidos do cliente', async () => {
    const page = await ordersService.list();
    expect(page.count).toBeGreaterThanOrEqual(0);
    for (const pedido of page.results) {
      expect(pedido.codigo).toMatch(/^PED-/);
      expect(pedido.cliente_nome.length).toBeGreaterThan(0);
    }
  });

  it('detalhe do pedido mais recente', async () => {
    const page = await ordersService.list();
    const recente = page.results[0];
    if (!recente) return; // cliente sem pedidos
    const pedido = await ordersService.get(recente.id);
    expect(pedido.itens.length).toBeGreaterThan(0);
  });

  it('pedido sem itens é rejeitado (400) sem gravar', async () => {
    const [lojas, formas] = await Promise.all([
      catalogService.listStores(),
      catalogService.listPaymentMethods(),
    ]);
    await expect(
      ordersService.create({
        loja: lojas[0]!.id,
        forma_pagamento: formas[0]!.id,
        tipo_entrega: 'RETIRADA',
        itens: [],
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('conecta no WebSocket /ws/notificacoes/ com o token', async () => {
    const client = newRealtimeClient();
    try {
      const opened = waitFor<ConnectionState>((resolve) =>
        client.onStateChange((state) => state === 'open' && resolve(state)),
      );
      client.start();
      expect(await opened).toBe('open');
    } finally {
      client.stop();
    }
  });

  it('WebSocket com token inválido é recusado', async () => {
    const socket = createSocket(`${API_URL.replace(/^http/, 'ws')}ws/notificacoes/?token=invalido`);
    let opened = false;
    socket.onopen = () => {
      opened = true;
    };
    const code = await waitFor<number>((resolve) => {
      socket.onclose = (event) => resolve(event.code);
    });
    // O consumer fecha com 4401 ANTES do accept(); o Channels converte isso em
    // HTTP 403 no handshake, então o cliente vê 1006 (conexão anormal).
    expect(opened).toBe(false);
    expect(code).toBe(1006);
  });

  itWrites('cria pedido, recebe o evento em tempo real e cancela', async () => {
    const [lojas, formas, produtos] = await Promise.all([
      catalogService.listStores(),
      catalogService.listPaymentMethods(),
      catalogService.listProducts(),
    ]);

    const client = newRealtimeClient();
    const opened = waitFor<void>((resolve) =>
      client.onStateChange((state) => state === 'open' && resolve()),
    );
    client.start();
    await opened;

    try {
      const evento = waitFor<RealtimeMessage>((resolve) => client.onMessage(resolve));
      const pedido = await ordersService.create({
        loja: lojas[0]!.id,
        forma_pagamento: formas[0]!.id,
        tipo_entrega: 'RETIRADA',
        itens: [{ produto: produtos.results[0]!.id, quantidade: 1 }],
        observacao: 'Teste de integração do app mobile',
      });
      expect(pedido.status).toBe('PENDENTE');

      const mensagem = await evento;
      expect(mensagem.evento).toBe('pedido.criado');
      expect(mensagem.dados).toMatchObject({ pedido_id: pedido.id });

      const cancelado = await ordersService.cancel(pedido.id);
      expect(cancelado.status).toBe('CANCELADO');
    } finally {
      client.stop();
    }
  });
});
