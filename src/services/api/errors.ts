/**
 * Normalização de erros HTTP/rede em um formato único (`ApiError`).
 *
 * A DRF devolve erros em vários formatos:
 *  - `{"detail": "..."}`
 *  - `{"campo": ["msg", ...], "non_field_errors": ["msg"]}`
 *  - `["msg"]`
 * As telas só precisam lidar com `message` e, em formulários, `fieldErrors`.
 */
import { isAxiosError } from 'axios';

export type ApiErrorKind = 'network' | 'timeout' | 'http' | 'unknown';

export type FieldErrors = Record<string, string>;

const NON_FIELD_KEYS = new Set(['detail', 'non_field_errors']);

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Verifique os dados informados.',
  401: 'Sua sessão expirou. Entre novamente.',
  403: 'Você não tem permissão para esta ação.',
  404: 'Não encontrado.',
  409: 'Não foi possível concluir a operação.',
  429: 'Muitas tentativas. Aguarde um pouco e tente novamente.',
};

const GENERIC_MESSAGE = 'Algo deu errado. Tente novamente.';
const NETWORK_MESSAGE = 'Sem conexão com o servidor. Verifique sua internet.';
const TIMEOUT_MESSAGE = 'O servidor demorou para responder. Tente novamente.';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly fieldErrors: FieldErrors;
  /** Segundos sugeridos pelo cabeçalho `Retry-After` (429). */
  readonly retryAfter?: number;

  constructor(params: {
    message: string;
    kind: ApiErrorKind;
    status?: number;
    fieldErrors?: FieldErrors;
    retryAfter?: number;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.kind = params.kind;
    this.status = params.status;
    this.fieldErrors = params.fieldErrors ?? {};
    this.retryAfter = params.retryAfter;
  }

  get isNetworkError(): boolean {
    return this.kind === 'network' || this.kind === 'timeout';
  }
}

function firstMessage(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return firstMessage(value[0]);
  if (value && typeof value === 'object') return firstMessage(Object.values(value)[0]);
  return undefined;
}

/** Extrai `{campo: mensagem}` e a mensagem geral do corpo de erro da DRF. */
export function parseDrfBody(body: unknown): { message?: string; fieldErrors: FieldErrors } {
  if (typeof body === 'string' || Array.isArray(body)) {
    return { message: firstMessage(body), fieldErrors: {} };
  }
  if (!body || typeof body !== 'object') {
    return { fieldErrors: {} };
  }

  const fieldErrors: FieldErrors = {};
  let message: string | undefined;
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    const text = firstMessage(value);
    if (!text) continue;
    if (NON_FIELD_KEYS.has(key)) {
      message ??= text;
    } else {
      fieldErrors[key] = text;
    }
  }
  return { message: message ?? Object.values(fieldErrors)[0], fieldErrors };
}

function parseRetryAfter(header: unknown): number | undefined {
  const seconds = Number(header);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined;
}

/** Converte qualquer erro lançado em uma chamada à API em `ApiError`. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError({ message: TIMEOUT_MESSAGE, kind: 'timeout' });
    }
    if (!error.response) {
      return new ApiError({ message: NETWORK_MESSAGE, kind: 'network' });
    }
    const { status, data, headers } = error.response;
    const parsed = parseDrfBody(data);
    // Corpos HTML (ex.: página de erro 500 do Django) não são mostrados ao usuário.
    const isHtml = typeof data === 'string' && data.trimStart().startsWith('<');
    return new ApiError({
      message: (!isHtml && parsed.message) || STATUS_MESSAGES[status] || GENERIC_MESSAGE,
      kind: 'http',
      status,
      fieldErrors: parsed.fieldErrors,
      retryAfter: parseRetryAfter(headers?.['retry-after']),
    });
  }

  return new ApiError({ message: GENERIC_MESSAGE, kind: 'unknown' });
}

/** Mensagem amigável para exibir em telas (aceita qualquer erro). */
export function getErrorMessage(error: unknown): string {
  return toApiError(error).message;
}
