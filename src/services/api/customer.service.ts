import type { Cliente, Endereco, EnderecoPayload, Paginated } from '@/types/api';

import { api } from './client';
import { ENDPOINTS } from './endpoints';
import { ApiError } from './errors';

export const customerService = {
  /** Cadastro de cliente do usuário logado (a API retorna só o próprio). */
  async getProfile(): Promise<Cliente> {
    const { data } = await api.get<Paginated<Cliente>>(ENDPOINTS.clientes.list);
    const cliente = data.results[0];
    if (!cliente) {
      throw new ApiError({
        message: 'Seu usuário não possui cadastro de cliente.',
        kind: 'http',
        status: 404,
      });
    }
    return cliente;
  },

  async updateProfile(id: number, changes: Pick<Cliente, 'nome' | 'telefone'>): Promise<Cliente> {
    const { data } = await api.patch<Cliente>(ENDPOINTS.clientes.detail(id), changes);
    return data;
  },

  async listAddresses(): Promise<Endereco[]> {
    const { data } = await api.get<Paginated<Endereco>>(ENDPOINTS.enderecos.list);
    return data.results;
  },

  async createAddress(payload: EnderecoPayload): Promise<Endereco> {
    const { data } = await api.post<Endereco>(ENDPOINTS.enderecos.list, payload);
    return data;
  },

  async updateAddress(id: number, payload: Partial<EnderecoPayload>): Promise<Endereco> {
    const { data } = await api.patch<Endereco>(ENDPOINTS.enderecos.detail(id), payload);
    return data;
  },

  async deleteAddress(id: number): Promise<void> {
    await api.delete(ENDPOINTS.enderecos.detail(id));
  },
};
