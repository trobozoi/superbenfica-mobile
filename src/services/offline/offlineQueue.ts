/**
 * Fila de ações feitas sem internet, reenviadas quando a conexão volta.
 *
 * Só entram ações seguras de repetir e sem efeito financeiro.
 * Pedidos NUNCA entram na fila: estoque e preço precisam ser confirmados
 * na hora, com o usuário vendo o resultado.
 */
import { STORAGE_KEYS } from '@/config/constants';
import { customerService } from '@/services/api/customer.service';
import { toApiError } from '@/services/api/errors';
import { readJson, writeJson } from '@/services/storage/storage';
import type { EnderecoPayload } from '@/types/api';
import { logger } from '@/utils/logger';

export type QueuedAction =
  | { type: 'address.create'; payload: EnderecoPayload }
  | { type: 'address.delete'; payload: { id: number } };

interface QueueItem {
  id: string;
  createdAt: number;
  action: QueuedAction;
}

let flushing = false;

async function readQueue(): Promise<QueueItem[]> {
  return (await readJson<QueueItem[]>(STORAGE_KEYS.offlineQueue)) ?? [];
}

export async function enqueue(action: QueuedAction): Promise<void> {
  const queue = await readQueue();
  queue.push({ id: `${Date.now()}-${queue.length}`, createdAt: Date.now(), action });
  await writeJson(STORAGE_KEYS.offlineQueue, queue);
}

export async function pendingCount(): Promise<number> {
  return (await readQueue()).length;
}

async function execute(action: QueuedAction): Promise<void> {
  switch (action.type) {
    case 'address.create':
      await customerService.createAddress(action.payload);
      return;
    case 'address.delete':
      await customerService.deleteAddress(action.payload.id);
      return;
  }
}

/**
 * Reenvia a fila em ordem. Para no primeiro erro de rede (tenta de novo na
 * próxima reconexão); erros de validação descartam a ação para não travar a fila.
 * @returns quantas ações foram enviadas com sucesso.
 */
export async function flushQueue(): Promise<number> {
  if (flushing) return 0;
  flushing = true;
  let sent = 0;
  try {
    const queue = await readQueue();
    const remaining = [...queue];
    for (const item of queue) {
      try {
        await execute(item.action);
        sent += 1;
        remaining.shift();
      } catch (error) {
        if (toApiError(error).isNetworkError) break;
        logger.warn('Ação offline descartada', item.action.type, error);
        remaining.shift();
      }
    }
    await writeJson(STORAGE_KEYS.offlineQueue, remaining);
  } finally {
    flushing = false;
  }
  return sent;
}
