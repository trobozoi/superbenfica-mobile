import { WEBSOCKET } from '@/config/constants';

import { computeBackoff, RealtimeClient } from './realtimeClient';

class FakeSocket {
  static readonly instances: FakeSocket[] = [];
  readyState = 0;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: ((event: { code: number }) => void) | null = null;

  constructor(public url: string) {
    FakeSocket.instances.push(this);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close(code = 1000) {
    this.readyState = 3;
    this.onclose?.({ code });
  }

  open() {
    this.readyState = 1;
    this.onopen?.();
  }

  serverClose(code: number) {
    this.readyState = 3;
    this.onclose?.({ code });
  }
}

const tick = () => new Promise((resolve) => setImmediate(resolve));

function createClient(overrides: Partial<ConstructorParameters<typeof RealtimeClient>[0]> = {}) {
  return new RealtimeClient({
    url: 'ws://teste/ws/notificacoes/',
    getToken: jest.fn(async () => 'token-1'),
    refreshToken: jest.fn(async () => 'token-2'),
    createSocket: (url) => new FakeSocket(url) as unknown as WebSocket,
    random: () => 1,
    ...overrides,
  });
}

describe('computeBackoff', () => {
  it('cresce exponencialmente até o teto', () => {
    expect(computeBackoff(0, () => 1)).toBe(WEBSOCKET.initialBackoffMs);
    expect(computeBackoff(3, () => 1)).toBe(WEBSOCKET.initialBackoffMs * 8);
    expect(computeBackoff(20, () => 1)).toBe(WEBSOCKET.maxBackoffMs);
    expect(computeBackoff(0, () => 0)).toBe(Math.round(WEBSOCKET.initialBackoffMs * 0.7));
  });
});

describe('RealtimeClient', () => {
  beforeEach(() => {
    FakeSocket.instances.length = 0;
    jest.useFakeTimers({ doNotFake: ['setImmediate'] });
  });

  afterEach(() => jest.useRealTimers());

  it('conecta com o token na query e repassa eventos (ignora pong)', async () => {
    const client = createClient();
    const listener = jest.fn();
    const states: string[] = [];
    client.onMessage(listener);
    client.onStateChange((s) => states.push(s));

    client.start();
    await tick();
    const socket = FakeSocket.instances[0]!;
    expect(socket.url).toBe('ws://teste/ws/notificacoes/?token=token-1');

    socket.open();
    socket.onmessage?.({ data: JSON.stringify({ evento: 'pong', dados: {} }) });
    socket.onmessage?.({ data: 'não é json' });
    socket.onmessage?.({
      data: JSON.stringify({ evento: 'pedido.atualizado', dados: { pedido_id: 1 } }),
    });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ evento: 'pedido.atualizado', dados: { pedido_id: 1 } });
    expect(states).toEqual(['connecting', 'open']);
    client.stop();
  });

  it('envia ping periodicamente', async () => {
    const client = createClient();
    client.start();
    await tick();
    const socket = FakeSocket.instances[0]!;
    socket.open();
    jest.advanceTimersByTime(WEBSOCKET.pingIntervalMs);
    expect(socket.sent).toEqual([JSON.stringify({ acao: 'ping' })]);
    client.stop();
  });

  it('reconecta com backoff após queda', async () => {
    const client = createClient();
    client.start();
    await tick();
    FakeSocket.instances[0]!.serverClose(1006);
    await tick();
    expect(FakeSocket.instances).toHaveLength(1);

    jest.advanceTimersByTime(WEBSOCKET.initialBackoffMs);
    await tick();
    expect(FakeSocket.instances).toHaveLength(2);
    client.stop();
  });

  it('4401: renova o token antes de reconectar', async () => {
    const refreshToken = jest.fn(async () => 'token-2');
    const getToken = jest.fn().mockResolvedValueOnce('token-1').mockResolvedValue('token-2');
    const client = createClient({ refreshToken, getToken });
    client.start();
    await tick();
    FakeSocket.instances[0]!.serverClose(WEBSOCKET.closeUnauthorized);
    await tick();
    expect(refreshToken).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(WEBSOCKET.initialBackoffMs);
    await tick();
    expect(FakeSocket.instances[1]!.url).toContain('token=token-2');
    client.stop();
  });

  it('4403: não tenta reconectar', async () => {
    const client = createClient();
    client.start();
    await tick();
    FakeSocket.instances[0]!.serverClose(WEBSOCKET.closeForbidden);
    jest.advanceTimersByTime(WEBSOCKET.maxBackoffMs);
    await tick();
    expect(FakeSocket.instances).toHaveLength(1);
  });

  it('sem token não conecta', async () => {
    const client = createClient({ getToken: async () => null });
    client.start();
    await tick();
    expect(FakeSocket.instances).toHaveLength(0);
    expect(client.connectionState).toBe('closed');
  });
});
