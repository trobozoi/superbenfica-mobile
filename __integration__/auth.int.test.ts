import { authService } from '@/services/api/auth.service';
import { refreshAccessToken } from '@/services/api/client';
import { ApiError } from '@/services/api/errors';
import { tokenStorage } from '@/services/storage/tokenStorage';
import { decodeJwt } from '@/utils/jwt';

import { describeApi, useSharedSession } from './helpers';

describeApi('Autenticação (API real)', () => {
  it('GET /usuarios/me/ retorna o usuário CLIENTE da sessão', async () => {
    await useSharedSession();
    const me = await authService.me();
    expect(me.email).toBe(process.env.TEST_USER_EMAIL?.toLowerCase());
    expect(me.role).toBe('CLIENTE');
  });

  it('o access token traz as claims de perfil e expira', () => {
    const claims = decodeJwt(process.env.INTEGRATION_ACCESS ?? '');
    expect(claims?.role).toBe('CLIENTE');
    expect(typeof claims?.exp).toBe('number');
  });

  it('senha errada retorna ApiError 401 com mensagem amigável', async () => {
    const error = await authService
      .login(process.env.TEST_USER_EMAIL ?? '', 'senha-errada-123')
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(401);
    expect((error as ApiError).message.length).toBeGreaterThan(0);
  });

  it('login → refresh (rotacionado) → logout invalida o refresh', async () => {
    const email = process.env.TEST_USER_EMAIL ?? '';
    const password = process.env.TEST_USER_PASSWORD ?? '';

    const first = await authService.login(email, password);
    expect(tokenStorage.get()).toEqual(first);

    const newAccess = await refreshAccessToken();
    const rotated = tokenStorage.get();
    expect(newAccess).toBe(rotated?.access);
    expect(rotated?.refresh).not.toBe(first.refresh);

    const refreshBeforeLogout = rotated?.refresh;
    await authService.logout();
    expect(tokenStorage.get()).toBeNull();

    // Refresh na blacklist: renovar de novo deve falhar.
    await tokenStorage.save({ access: newAccess, refresh: refreshBeforeLogout ?? '' });
    await expect(refreshAccessToken()).rejects.toBeTruthy();
    expect(tokenStorage.get()).toBeNull();
  });
});
