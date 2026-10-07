/**
 * Lista paginada (scroll infinito) sobre `useApiQuery`: a 1ª página usa o
 * cache offline; as seguintes são carregadas sob demanda.
 */
import { useCallback, useMemo, useState } from 'react';

import type { Paginated } from '@/types/api';

import { useApiQuery, type RefetchOptions } from './useApiQuery';

interface ExtraPages<T> {
  /** 1ª página à qual estas páginas extras pertencem (descartadas se ela mudar). */
  base?: Paginated<T>;
  items: T[];
  page: number;
  hasMore: boolean;
}

export function usePaginatedQuery<T extends { id: number }>(
  fetchPage: (page: number) => Promise<Paginated<T>>,
  deps: readonly unknown[],
  cacheKey: string,
) {
  const first = useApiQuery(() => fetchPage(1), deps, { cacheKey });
  const [extra, setExtra] = useState<ExtraPages<T>>({ items: [], page: 1, hasMore: false });
  const [loadingMore, setLoadingMore] = useState(false);

  const current = extra.base !== undefined && extra.base === first.data;
  const extraItems = useMemo(() => (current ? extra.items : []), [current, extra.items]);
  const page = current ? extra.page : 1;
  const hasMore = current ? extra.hasMore : !!first.data?.next && !first.stale;

  const seen = new Set(first.data?.results.map((item) => item.id));
  const items = [
    ...(first.data?.results ?? []),
    ...extraItems.filter((item) => !seen.has(item.id)),
  ];

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !first.data) return;
    const base = first.data;
    setLoadingMore(true);
    try {
      const next = await fetchPage(page + 1);
      setExtra({
        base,
        items: [...extraItems, ...next.results],
        page: page + 1,
        hasMore: !!next.next,
      });
    } catch {
      setExtra({ base, items: extraItems, page, hasMore: false });
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, first.data, fetchPage, page, extraItems]);

  return {
    items,
    loading: first.loading,
    refreshing: first.refreshing,
    error: first.error,
    stale: first.stale,
    hasMore,
    loadingMore,
    loadMore,
    refetch: (options?: RefetchOptions) => first.refetch(options),
  };
}
