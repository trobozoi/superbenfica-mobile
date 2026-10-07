import { useEffect, useState } from 'react';

/** Retorna `value` só depois de `delayMs` sem mudanças (ex.: busca ao digitar). */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
