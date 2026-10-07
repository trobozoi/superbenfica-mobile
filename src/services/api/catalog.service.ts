import { PAGE_SIZE } from '@/config/constants';
import type { Categoria, FormaPagamento, Loja, Paginated, Produto } from '@/types/api';

import { api } from './client';
import { ENDPOINTS } from './endpoints';

export interface ProductFilters {
  search?: string;
  categoria?: Categoria | null;
  /** Campo de ordenação da DRF (ex.: `preco`, `-preco`, `nome`). */
  ordering?: string;
  page?: number;
}

export const catalogService = {
  async listProducts(filters: ProductFilters = {}): Promise<Paginated<Produto>> {
    const params: Record<string, string | number> = {
      page: filters.page ?? 1,
      page_size: PAGE_SIZE,
    };
    if (filters.search?.trim()) params.search = filters.search.trim();
    if (filters.categoria) params.categoria = filters.categoria;
    if (filters.ordering) params.ordering = filters.ordering;

    const { data } = await api.get<Paginated<Produto>>(ENDPOINTS.produtos.list, { params });
    return data;
  },

  async getProduct(id: number): Promise<Produto> {
    const { data } = await api.get<Produto>(ENDPOINTS.produtos.detail(id));
    return data;
  },

  async listStores(): Promise<Loja[]> {
    const { data } = await api.get<Paginated<Loja>>(ENDPOINTS.lojas.list);
    return data.results.filter((loja) => loja.ativa);
  },

  async listPaymentMethods(): Promise<FormaPagamento[]> {
    const { data } = await api.get<Paginated<FormaPagamento>>(ENDPOINTS.formasPagamento.list, {
      params: { ativa: true, ordering: 'ordem' },
    });
    return data.results;
  },
};
