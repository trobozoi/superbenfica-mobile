/**
 * Cliente WebSocket para o Django Channels (`/ws/notificacoes/`).
 *
 * - Autentica com `?token=<access>` (formato exigido pelo backend).
 * - Reconecta com backoff exponencial + jitter (evita "tempestade" de
 *   reconexões quando o servidor volta).
 * - Fechamento 4401 (token inválido/expirado): renova o token e reconecta.
 * - Fechamento 4403 (sem permissão): não tenta de novo.
 * - Envia `{"acao": "ping"}` periodicamente para manter a conexão viva.
 */
import { WEBSOCKET } from '@/config/constants';
import { env } from '@/config/env';
import { WS_ENDPOINTS } from '@/services/api/endpoints';
import type { RealtimeMessage } from '@/types/api';
import { logger } from '@/utils/logger';

/** `WebSocket.OPEN` (constante local: o global não existe em todos os ambientes de teste). */
const SOCKET_OPEN = 1;

export type ConnectionState = 'idle' | 'connecting' | 'open' | 'closed';

export type MessageListener = (message: RealtimeMessage) => void;
export type StateListener = (state: ConnectionState) => void;

export interface RealtimeClientOptions {
  /** Retorna um access token válido (já renovado se necessário). */
  getToken: () => Promise<string | null>;
  /** Força a renovação do token (usado após fechamento 4401). */
  refreshToken: () => Promise<string>;
  url?: string;
  /** Injetável para testes. */
  createSocket?: (url: string) => WebSocket;
  random?: () => number;
}

/** Atraso da tentativa `attempt` (0, 1, 2...) com jitter de até 30%. */
export function computeBackoff(attempt: number, random: () => number = Math.random): number {
  const base = Math.min(WEBSOCKET.maxBackoffMs, WEBSOCKET.initialBackoffMs * 2 ** attempt);
  return Math.round(base * (0.7 + random() * 0.3));
}

export class RealtimeClient {
  private socket: WebSocket | null = null;
  private attempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private shouldRun = false;
  private state: ConnectionState = 'idle';
  private readonly messageListeners = new Set<MessageListener>();
  private readonly stateListeners = new Set<StateListener>();
  private readonly url: string;

  constructor(private readonly options: RealtimeClientOptions) {
    this.url = options.url ?? `${env.wsUrl}${WS_ENDPOINTS.notificacoes}`;
  }

  get connectionState(): ConnectionState {
    return this.state;
  }

  onMessage(listener: MessageListener): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  onStateChange(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  start(): void {
    if (this.shouldRun) return;
    this.shouldRun = true;
    this.attempt = 0;
    void this.connect();
  }

  stop(): void {
    this.shouldRun = false;
    this.clearTimers();
    const socket = this.socket;
    this.socket = null;
    socket?.close(1000, 'logout');
    this.setState('closed');
  }

  /** Reconecta já (ex.: app voltou ao primeiro plano ou internet voltou). */
  reconnectNow(): void {
    if (!this.shouldRun || this.state === 'open' || this.state === 'connecting') return;
    this.clearTimers();
    this.attempt = 0;
    void this.connect();
  }

  private setState(state: ConnectionState): void {
    this.state = state;
    this.stateListeners.forEach((listener) => listener(state));
  }

  private clearTimers(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.reconnectTimer = null;
    this.pingTimer = null;
  }

  private async connect(): Promise<void> {
    const token = await this.options.getToken().catch(() => null);
    if (!this.shouldRun) return;
    if (!token) {
      logger.debug('WebSocket: sem token, conexão não iniciada');
      this.setState('closed');
      return;
    }

    this.setState('connecting');
    const create = this.options.createSocket ?? ((url: string) => new WebSocket(url));
    // O token vai na query porque o handshake WebSocket não aceita header Authorization.
    const socket = create(`${this.url}?token=${encodeURIComponent(token)}`);
    this.socket = socket;

    socket.onopen = () => {
      this.attempt = 0;
      this.setState('open');
      this.pingTimer = setInterval(() => this.send({ acao: 'ping' }), WEBSOCKET.pingIntervalMs);
    };
    socket.onmessage = (event: MessageEvent) => this.handleMessage(event.data);
    socket.onerror = () => logger.debug('WebSocket: erro de conexão');
    socket.onclose = (event: CloseEvent) => {
      if (this.socket === socket) void this.handleClose(event.code);
    };
  }

  private send(payload: unknown): void {
    if (this.socket?.readyState === SOCKET_OPEN) {
      this.socket.send(JSON.stringify(payload));
    }
  }

  private handleMessage(raw: unknown): void {
    if (typeof raw !== 'string') return;
    try {
      const message = JSON.parse(raw) as RealtimeMessage;
      if (!message?.evento || message.evento === 'pong') return;
      this.messageListeners.forEach((listener) => listener(message));
    } catch {
      logger.warn('WebSocket: mensagem inválida ignorada');
    }
  }

  private async handleClose(code: number): Promise<void> {
    this.clearTimers();
    this.socket = null;
    this.setState('closed');
    if (!this.shouldRun) return;

    if (code === WEBSOCKET.closeForbidden) {
      logger.warn('WebSocket: acesso negado (4403), sem nova tentativa');
      this.shouldRun = false;
      return;
    }
    if (code === WEBSOCKET.closeUnauthorized) {
      try {
        await this.options.refreshToken();
      } catch {
        // Refresh falhou: a sessão expirou e o app fará logout.
        this.shouldRun = false;
        return;
      }
    }
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    const delay = computeBackoff(this.attempt, this.options.random);
    this.attempt += 1;
    logger.debug(`WebSocket: reconectando em ${delay}ms`);
    this.reconnectTimer = setTimeout(() => void this.connect(), delay);
  }
}
