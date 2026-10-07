import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { ApiError } from '@/services/api/errors';
import type { Paginated } from '@/types/api';

import { useApiQuery } from './useApiQuery';
import { useDebounce } from './useDebounce';
import { usePaginatedQuery } from './usePaginatedQuery';

const page = (ids: number[], next: string | null): Paginated<{ id: number }> => ({
  count: 99,
  next,
  previous: null,
  results: ids.map((id) => ({ id })),
});

describe('useApiQuery', () => {
  beforeEach(() => AsyncStorage.clear());

  it('carrega, expõe os dados e recarrega quando as deps mudam', async () => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const fetcher = jest.fn(async (n: number) => {
      await gate;
      return n * 10;
    });
    const { result, rerender } = await renderHook(
      ({ n }: { n: number }) => useApiQuery(() => fetcher(n), [n]),
      {
        initialProps: { n: 1 },
      },
    );

    expect(result.current.loading).toBe(true);
    await act(async () => release());
    await waitFor(() => expect(result.current.data).toBe(10));
    expect(result.current.loading).toBe(false);

    await rerender({ n: 2 });
    await waitFor(() => expect(result.current.data).toBe(20));
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('mostra a mensagem de erro', async () => {
    const { result } = await renderHook(() =>
      useApiQuery(async () => {
        throw new ApiError({ message: 'Falhou', kind: 'http', status: 500 });
      }, []),
    );
    await waitFor(() => expect(result.current.error).toBe('Falhou'));
    expect(result.current.loading).toBe(false);
  });

  it('usa o cache offline quando a rede cai', async () => {
    let online = true;
    const { result } = await renderHook(() =>
      useApiQuery(
        async () => {
          if (!online) throw new ApiError({ message: 'offline', kind: 'network' });
          return 'dados';
        },
        [],
        { cacheKey: 'teste' },
      ),
    );
    await waitFor(() => expect(result.current.data).toBe('dados'));

    online = false;
    await act(() => result.current.refetch());
    expect(result.current.data).toBe('dados');
    expect(result.current.stale).toBe(true);
  });

  it('não busca quando desabilitado', async () => {
    const fetcher = jest.fn(async () => 1);
    const { result } = await renderHook(() => useApiQuery(fetcher, [], { enabled: false }));
    expect(result.current.loading).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe('usePaginatedQuery', () => {
  beforeEach(() => AsyncStorage.clear());

  it('carrega páginas seguintes sem duplicar itens', async () => {
    const fetchPage = jest.fn(async (n: number) =>
      n === 1 ? page([1, 2], 'p2') : page([2, 3], null),
    );
    const { result } = await renderHook(() => usePaginatedQuery(fetchPage, [], 'lista'));
    await waitFor(() => expect(result.current.items.map((i) => i.id)).toEqual([1, 2]));
    expect(result.current.hasMore).toBe(true);

    await act(() => result.current.loadMore());
    expect(result.current.items.map((i) => i.id)).toEqual([1, 2, 3]);
    expect(result.current.hasMore).toBe(false);
    expect(fetchPage).toHaveBeenLastCalledWith(2);
  });
});

describe('useDebounce', () => {
  it('atrasa a atualização do valor', async () => {
    jest.useFakeTimers();
    const { result, rerender } = await renderHook(({ v }: { v: string }) => useDebounce(v, 300), {
      initialProps: { v: 'a' },
    });
    await rerender({ v: 'ab' });
    expect(result.current).toBe('a');
    await act(() => jest.advanceTimersByTime(300));
    expect(result.current).toBe('ab');
    jest.useRealTimers();
  });
});
