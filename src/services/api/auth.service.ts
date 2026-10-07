import { tokenStorage } from '@/services/storage/tokenStorage';
import type { RegistroPayload, TokenPair, Usuario } from '@/types/api';
import { logger } from '@/utils/logger';

import { api } from './client';
import { ENDPOINTS } from './endpoints';

export const authService = {
  /** Faz login e guarda os tokens no armazenamento seguro. */
  async login(email: string, password: string): Promise<TokenPair> {
    const { data } = await api.post<TokenPair>(ENDPOINTS.auth.login, { email, password });
    await tokenStorage.save(data);
    return data;
  },

  /** Autocadastro público: cria o usuário com perfil CLIENTE. */
  async register(payload: RegistroPayload): Promise<Usuario> {
    const { data } = await api.post<Usuario>(ENDPOINTS.auth.register, payload);
    return data;
  },

  async me(): Promise<Usuario> {
    const { data } = await api.get<Usuario>(ENDPOINTS.usuarios.me);
    return data;
  },

  /**
   * Invalida o refresh token no servidor (blacklist) e apaga os tokens locais.
   * Os dados locais são apagados mesmo se a API estiver fora do ar.
   */
  async logout(): Promise<void> {
    const refresh = tokenStorage.get()?.refresh;
    try {
      if (refresh) await api.post(ENDPOINTS.auth.logout, { refresh });
    } catch (error) {
      logger.warn('Logout no servidor falhou; limpando sessão local mesmo assim', error);
    } finally {
      await tokenStorage.clear();
    }
  },

  /**
   * TODO: o backend ainda não tem recuperação de senha. Quando existir,
   * confirme a rota em `ENDPOINTS.auth.passwordReset` e o formato do corpo.
   */
  async requestPasswordReset(email: string): Promise<void> {
    await api.post(ENDPOINTS.auth.passwordReset, { email });
  },
};
