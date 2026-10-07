import { tokenStorage } from '@/services/storage/tokenStorage';

/** `describe` que é pulado quando a API ou o usuário de teste não estão disponíveis. */
export const describeApi = process.env.INTEGRATION_SKIP_REASON ? describe.skip : describe;

/** Testes que gravam dados só rodam com TEST_ALLOW_WRITES=true. */
export const itWrites = process.env.TEST_ALLOW_WRITES === 'true' ? it : it.skip;

/** Usa a sessão criada no globalSetup (evita estourar o limite de logins). */
export async function useSharedSession(): Promise<void> {
  const access = process.env.INTEGRATION_ACCESS;
  const refresh = process.env.INTEGRATION_REFRESH;
  if (!access || !refresh) throw new Error('Sessão de integração ausente (veja globalSetup).');
  await tokenStorage.save({ access, refresh });
}
