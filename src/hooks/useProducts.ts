/**
 * Catálogo paginado com busca e filtro por categoria (scroll infinito).
 * A primeira página de cada filtro fica em cache para o modo offline.
 */
import { useCallback } from 'react';

import { catalogService, type ProductFilters } from '@/services/api/catalog.service';

import { usePaginatedQuery } from './usePaginatedQuery';

type Filters = Omit<ProductFilters, 'page'>;

export function useProducts({ search, categoria, ordering }: Filters) {
  const fetchPage = useCallback(
    (page: number) => catalogService.listProducts({ search, categoria, ordering, page }),
    [search, categoria, ordering],
  );
  return usePaginatedQuery(
    fetchPage,
    [search, categoria, ordering],
    `produtos:${categoria ?? 'todas'}:${search ?? ''}:${ordering ?? ''}`,
  );
}
