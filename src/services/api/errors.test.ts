import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';

import { ApiError, getErrorMessage, parseDrfBody, toApiError } from './errors';

function httpError(
  status: number,
  data: unknown,
  headers: Record<string, string> = {},
): AxiosError {
  const response = {
    status,
    data,
    headers,
    statusText: '',
    config: { headers: new AxiosHeaders() },
  } as AxiosResponse;
  return new AxiosError('fail', 'ERR_BAD_RESPONSE', undefined, undefined, response);
}

describe('parseDrfBody', () => {
  it('lê detail', () => {
    expect(parseDrfBody({ detail: 'Não autorizado' })).toEqual({
      message: 'Não autorizado',
      fieldErrors: {},
    });
  });

  it('lê erros por campo e non_field_errors', () => {
    expect(
      parseDrfBody({ email: ['Este e-mail já está cadastrado.'], non_field_errors: ['Geral'] }),
    ).toEqual({ message: 'Geral', fieldErrors: { email: 'Este e-mail já está cadastrado.' } });
  });

  it('usa o primeiro erro de campo como mensagem', () => {
    expect(parseDrfBody({ endereco: ['Informe o endereço de entrega.'] }).message).toBe(
      'Informe o endereço de entrega.',
    );
  });

  it('lê lista e corpo vazio', () => {
    expect(parseDrfBody(['Estoque insuficiente']).message).toBe('Estoque insuficiente');
    expect(parseDrfBody(null)).toEqual({ fieldErrors: {} });
  });
});

describe('toApiError', () => {
  it('erro HTTP com mensagem da API', () => {
    const error = toApiError(httpError(409, { detail: 'Estoque insuficiente' }));
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ kind: 'http', status: 409, message: 'Estoque insuficiente' });
  });

  it('429 traz Retry-After', () => {
    const error = toApiError(httpError(429, {}, { 'retry-after': '12' }));
    expect(error.retryAfter).toBe(12);
    expect(error.message).toMatch(/Muitas tentativas/);
  });

  it('não exibe HTML de erro do servidor', () => {
    expect(toApiError(httpError(500, '<html>Server Error</html>')).message).toBe(
      'Algo deu errado. Tente novamente.',
    );
  });

  it('sem resposta = erro de rede; timeout = timeout', () => {
    expect(toApiError(new AxiosError('x', 'ERR_NETWORK')).isNetworkError).toBe(true);
    expect(toApiError(new AxiosError('x', 'ECONNABORTED')).kind).toBe('timeout');
  });

  it('erros desconhecidos viram mensagem genérica', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('Algo deu errado. Tente novamente.');
    const original = new ApiError({ message: 'x', kind: 'http' });
    expect(toApiError(original)).toBe(original);
  });
});
