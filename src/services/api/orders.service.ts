import type { Paginated, Pedido, PedidoCreatePayload } from '@/types/api';

import { api } from './client';
import { ENDPOINTS } from './endpoints';

export const ordersService = {
  /** Lista os pedidos do cliente logado (o backend já filtra pelo usuário). */
  async list(page = 1): Promise<Paginated<Pedido>> {
    const { data } = await api.get<Paginated<Pedido>>(ENDPOINTS.pedidos.list, {
      params: { page, ordering: '-data_criacao' },
    });
    return data;
  },

  async get(id: number): Promise<Pedido> {
    const { data } = await api.get<Pedido>(ENDPOINTS.pedidos.detail(id));
    return data;
  },

  /**
   * Cria o pedido. Erros esperados:
   * - 409: estoque insuficiente / produto indisponível na loja;
   * - 400: forma de pagamento inativa ou endereço inválido.
   */
  async create(payload: PedidoCreatePayload): Promise<Pedido> {
    const { data } = await api.post<Pedido>(ENDPOINTS.pedidos.list, payload);
    return data;
  },

  /** O cliente só consegue cancelar pedidos PENDENTES. */
  async cancel(id: number): Promise<Pedido> {
    const { data } = await api.post<Pedido>(ENDPOINTS.pedidos.cancelar(id));
    return data;
  },
};
