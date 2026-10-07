/**
 * Executado uma vez antes de todos os testes de integração:
 * 1. verifica se a API responde (senão, os testes são pulados);
 * 2. faz UM login e compartilha os tokens via variáveis de ambiente.
 *
 * Um login só é importante: a API limita o login a 5/min por IP.
 */
import path from 'node:path';

import { config } from 'dotenv';

const TIMEOUT_MS = 5_000;

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function skip(reason: string): void {
  process.env.INTEGRATION_SKIP_REASON = reason;
  process.stdout.write(`\n[integração] Testes pulados: ${reason}\n`);
}

export default async function globalSetup(): Promise<void> {
  config({ path: path.resolve(__dirname, '..', '.env.test'), quiet: true });
  const apiUrl = process.env.TEST_API_URL ?? 'http://127.0.0.1:8000/';
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    skip('defina TEST_USER_EMAIL e TEST_USER_PASSWORD no .env.test');
    return;
  }

  try {
    await fetchWithTimeout(`${apiUrl}api/schema/`);
  } catch {
    skip(`API não respondeu em ${apiUrl}`);
    return;
  }

  const response = await fetchWithTimeout(`${apiUrl}api/auth/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    skip(`login do usuário de teste falhou (HTTP ${response.status})`);
    return;
  }
  const tokens = (await response.json()) as { access: string; refresh: string };
  process.env.INTEGRATION_ACCESS = tokens.access;
  process.env.INTEGRATION_REFRESH = tokens.refresh;
}
