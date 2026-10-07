import type { Categoria, StatusPedido, TipoEntrega } from '@/types/api';

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : dateTimeFormatter.format(date);
}

/** "07:00:00" -> "07:00" */
export function formatTime(value: string): string {
  return value.slice(0, 5);
}

export const CATEGORIA_LABEL: Record<Categoria, string> = {
  HORTIFRUTI: 'Hortifrúti',
  MERCEARIA: 'Mercearia',
  BEBIDAS: 'Bebidas',
  LATICINIOS: 'Laticínios e frios',
  PADARIA: 'Padaria',
  ACOUGUE: 'Açougue',
  LIMPEZA: 'Limpeza',
  HIGIENE: 'Higiene e beleza',
};

export const CATEGORIAS = Object.keys(CATEGORIA_LABEL) as Categoria[];

export const STATUS_PEDIDO_LABEL: Record<StatusPedido, string> = {
  PENDENTE: 'Pendente',
  EM_SEPARACAO: 'Em separação',
  SEPARADO: 'Separado',
  SAIU_PARA_ENTREGA: 'Saiu para entrega',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
};

export const TIPO_ENTREGA_LABEL: Record<TipoEntrega, string> = {
  RETIRADA: 'Retirada na loja',
  DOMICILIO: 'Entrega em domicílio',
};

/** "60060170" -> "60060-170" (máscara progressiva para inputs). */
export function maskCep(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

/** Máscara de telefone brasileiro: (85) 99100-0005 */
export function maskPhone(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  const split = d.length === 11 ? 7 : 6;
  return `(${d.slice(0, 2)}) ${d.slice(2, split)}-${d.slice(split)}`;
}
