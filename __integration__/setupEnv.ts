/**
 * Carrega o `.env.test` ANTES de importar os módulos do app (a URL da API é
 * lida na importação de `src/config/env.ts`).
 */
import path from 'node:path';

import { config } from 'dotenv';

config({ path: path.resolve(__dirname, '..', '.env.test'), quiet: true });
