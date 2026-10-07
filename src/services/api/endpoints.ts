/**
 * Todas as rotas da API em um só lugar (caminhos relativos a `env.apiUrl`).
 * Referência: `GET /api/schema/` e Swagger em `/api/docs/` do backend.
 */
export const ENDPOINTS = {
  auth: {
    login: 'api/auth/token/',
    refresh: 'api/auth/token/refresh/',
    verify: 'api/auth/token/verify/',
    logout: 'api/auth/logout/',
    register: 'api/auth/registrar/',
    // TODO: confirmar rota — o backend ainda NÃO expõe recuperação de senha.
    passwordReset: 'api/auth/recuperar-senha/',
  },
  usuarios: {
    me: 'api/usuarios/me/',
  },
  clientes: {
    list: 'api/clientes/',
    detail: (id: number) => `api/clientes/${id}/`,
  },
  enderecos: {
    list: 'api/enderecos/',
    detail: (id: number) => `api/enderecos/${id}/`,
  },
  produtos: {
    list: 'api/produtos/',
    detail: (id: number) => `api/produtos/${id}/`,
  },
  lojas: {
    list: 'api/lojas/',
  },
  formasPagamento: {
    list: 'api/formas-pagamento/',
  },
  pedidos: {
    list: 'api/pedidos/',
    detail: (id: number) => `api/pedidos/${id}/`,
    cancelar: (id: number) => `api/pedidos/${id}/cancelar/`,
  },
} as const;

/** Canais WebSocket (relativos a `env.wsUrl`). */
export const WS_ENDPOINTS = {
  notificacoes: 'ws/notificacoes/',
} as const;

/** Rotas que não devem disparar refresh automático do token ao receber 401. */
export const AUTH_ROUTES_WITHOUT_REFRESH: readonly string[] = [
  ENDPOINTS.auth.login,
  ENDPOINTS.auth.refresh,
  ENDPOINTS.auth.register,
  ENDPOINTS.auth.logout,
];
