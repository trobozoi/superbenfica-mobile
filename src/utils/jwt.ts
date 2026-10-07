/**
 * Leitura (SEM validação de assinatura) das claims do JWT.
 * Usado apenas para saber quando o token expira; quem valida é o backend.
 */
export interface JwtClaims {
  exp?: number;
  user_id?: number | string;
  nome?: string;
  role?: string;
  loja_id?: number | null;
}

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Decodificador base64 puro (não depende de `atob`/`Buffer`). */
function base64Decode(input: string): string {
  const clean = input.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const char of clean) {
    buffer = (buffer << 6) | BASE64_CHARS.indexOf(char);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  // Converte bytes UTF-8 em string (nomes com acento nas claims).
  return decodeURIComponent(bytes.map((b) => `%${b.toString(16).padStart(2, '0')}`).join(''));
}

export function decodeJwt(token: string): JwtClaims | null {
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(base64Decode(base64)) as JwtClaims;
  } catch {
    return null;
  }
}

/** `true` se o token expira em menos de `marginSeconds` (ou é ilegível). */
export function isTokenExpiring(token: string, marginSeconds: number, now = Date.now()): boolean {
  const exp = decodeJwt(token)?.exp;
  if (!exp) return true;
  return exp * 1000 - now <= marginSeconds * 1000;
}
