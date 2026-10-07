import AsyncStorage from '@react-native-async-storage/async-storage';

import { customerService } from '@/services/api/customer.service';
import { ApiError } from '@/services/api/errors';

import { fetchWithOfflineCache } from './offlineCache';
import { enqueue, flushQueue, pendingCount } from './offlineQueue';

jest.mock('@/services/api/customer.service', () => ({
  customerService: { createAddress: jest.fn(), deleteAddress: jest.fn() },
}));

const networkError = () => new ApiError({ message: 'offline', kind: 'network' });
const mocked = jest.mocked(customerService);

describe('fetchWithOfflineCache', () => {
  beforeEach(() => AsyncStorage.clear());

  it('salva a resposta e usa o cache quando a rede falha', async () => {
    const online = await fetchWithOfflineCache('k', async () => ({ v: 1 }));
    expect(online).toEqual({ data: { v: 1 }, fromCache: false });

    const offline = await fetchWithOfflineCache('k', async () => {
      throw networkError();
    });
    expect(offline.data).toEqual({ v: 1 });
    expect(offline.fromCache).toBe(true);
  });

  it('erros HTTP não usam o cache', async () => {
    await fetchWithOfflineCache('k2', async () => 1);
    await expect(
      fetchWithOfflineCache('k2', async () => {
        throw new ApiError({ message: 'proibido', kind: 'http', status: 403 });
      }),
    ).rejects.toMatchObject({ status: 403 });
  });
});

describe('offlineQueue', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    mocked.deleteAddress.mockReset();
    mocked.createAddress.mockReset();
  });

  it('envia as ações em ordem e esvazia a fila', async () => {
    await enqueue({ type: 'address.delete', payload: { id: 1 } });
    await enqueue({ type: 'address.delete', payload: { id: 2 } });

    expect(await flushQueue()).toBe(2);
    expect(mocked.deleteAddress.mock.calls).toEqual([[1], [2]]);
    expect(await pendingCount()).toBe(0);
  });

  it('para no erro de rede e mantém o restante', async () => {
    mocked.deleteAddress.mockResolvedValueOnce(undefined).mockRejectedValueOnce(networkError());
    await enqueue({ type: 'address.delete', payload: { id: 1 } });
    await enqueue({ type: 'address.delete', payload: { id: 2 } });
    await enqueue({ type: 'address.delete', payload: { id: 3 } });

    expect(await flushQueue()).toBe(1);
    expect(await pendingCount()).toBe(2);
  });

  it('descarta ação rejeitada pela API (ex.: 400) para não travar a fila', async () => {
    mocked.deleteAddress.mockRejectedValueOnce(
      new ApiError({ message: 'inválido', kind: 'http', status: 400 }),
    );
    await enqueue({ type: 'address.delete', payload: { id: 1 } });
    await enqueue({ type: 'address.delete', payload: { id: 2 } });

    expect(await flushQueue()).toBe(1);
    expect(await pendingCount()).toBe(0);
  });
});
