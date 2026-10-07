import MockAdapter from 'axios-mock-adapter';

import { tokenStorage } from '@/services/storage/tokenStorage';

import { api, getValidAccessToken, refreshClient, setSessionExpiredHandler } from './client';
import { ENDPOINTS } from './endpoints';
import { ApiError } from './errors';
import { makeJwt } from '../../../test/helpers';

describe('cliente HTTP', () => {
  let apiMock: MockAdapter;
  let refreshMock: MockAdapter;

  beforeEach(async () => {
    apiMock = new MockAdapter(api);
    refreshMock = new MockAdapter(refreshClient);
    await tokenStorage.clear();
    setSessionExpiredHandler(null);
  });

  afterEach(() => {
    apiMock.restore();
    refreshMock.restore();
  });

  it('envia o Bearer token', async () => {
    const access = makeJwt(600);
    await tokenStorage.save({ access, refresh: 'r' });
    apiMock.onGet('/ping').reply((config) => [200, { auth: config.headers?.Authorization }]);

    const { data } = await api.get('/ping');
    expect(data.auth).toBe(`Bearer ${access}`);
  });

  it('não envia token na rota de login', async () => {
    await tokenStorage.save({ access: makeJwt(600), refresh: 'r' });
    apiMock
      .onPost(ENDPOINTS.auth.login)
      .reply((config) => [200, { auth: config.headers?.Authorization ?? null }]);

    const { data } = await api.post(ENDPOINTS.auth.login, {});
    expect(data.auth).toBeNull();
  });

  it('converte erros em ApiError com erros de campo', async () => {
    apiMock.onGet('/x').reply(400, { nome: ['Obrigatório'] });
    await expect(api.get('/x')).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      fieldErrors: { nome: 'Obrigatório' },
    });
  });

  it('getValidAccessToken retorna null sem sessão', async () => {
    expect(await getValidAccessToken()).toBeNull();
  });

  it('renova antes de expirar (refresh proativo) e guarda o refresh rotacionado', async () => {
    const fresh = makeJwt(900);
    await tokenStorage.save({ access: makeJwt(5), refresh: 'refresh-1' });
    refreshMock.onPost(ENDPOINTS.auth.refresh).reply(200, { access: fresh, refresh: 'refresh-2' });

    expect(await getValidAccessToken()).toBe(fresh);
    expect(tokenStorage.get()).toEqual({ access: fresh, refresh: 'refresh-2' });
  });

  it('após 401, várias requisições compartilham UM único refresh', async () => {
    const newAccess = makeJwt(900);
    await tokenStorage.save({ access: makeJwt(600), refresh: 'refresh-1' });
    let refreshCalls = 0;
    refreshMock.onPost(ENDPOINTS.auth.refresh).reply(() => {
      refreshCalls += 1;
      return [200, { access: newAccess, refresh: 'refresh-2' }];
    });
    apiMock
      .onGet('/protegido')
      .reply((config) =>
        config.headers?.Authorization === `Bearer ${newAccess}` ? [200, { ok: true }] : [401, {}],
      );

    const results = await Promise.all([
      api.get('/protegido'),
      api.get('/protegido'),
      api.get('/protegido'),
    ]);

    expect(results.map((r) => r.data.ok)).toEqual([true, true, true]);
    expect(refreshCalls).toBe(1);
  });

  it('refresh falhou: limpa a sessão e avisa o app', async () => {
    await tokenStorage.save({ access: makeJwt(600), refresh: 'refresh-velho' });
    const onExpired = jest.fn();
    setSessionExpiredHandler(onExpired);
    apiMock.onGet('/protegido').reply(401, {});
    refreshMock.onPost(ENDPOINTS.auth.refresh).reply(401, { detail: 'Token inválido' });

    await expect(api.get('/protegido')).rejects.toBeInstanceOf(ApiError);
    expect(onExpired).toHaveBeenCalledTimes(1);
    expect(tokenStorage.get()).toBeNull();
  });
});
