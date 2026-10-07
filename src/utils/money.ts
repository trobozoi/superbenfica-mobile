/**
 * Dinheiro em centavos inteiros. A API envia decimais como string ("4.79");
 * somar floats (0.1 + 0.2) gera erros de arredondamento.
 */

export function toCents(value: string | number): number {
  const [intPart = '0', decPart = ''] = String(value).trim().split('.');
  const negative = intPart.startsWith('-');
  const cents =
    Math.abs(Number.parseInt(intPart, 10) || 0) * 100 +
    Number.parseInt(decPart.padEnd(2, '0').slice(0, 2), 10);
  return negative ? -cents : cents;
}

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** 479 -> "R$ 4,79" */
export function formatCents(cents: number): string {
  return brl.format(cents / 100);
}

/** "4.79" -> "R$ 4,79" */
export function formatPrice(value: string | number): string {
  return formatCents(toCents(value));
}
