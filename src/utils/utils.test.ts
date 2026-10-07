import { formatTime, maskCep, maskPhone } from './format';
import { decodeJwt, isTokenExpiring } from './jwt';
import { formatCents, formatPrice, toCents } from './money';
import { addressSchema, checkoutSchema, loginSchema, registerSchema } from './validation';
import { makeJwt } from '../../test/helpers';

describe('money', () => {
  it.each([
    ['4.79', 479],
    ['10', 1000],
    ['0.1', 10],
    ['0.05', 5],
    ['-2.50', -250],
    [3.5, 350],
  ])('toCents(%p) = %p', (input, expected) => {
    expect(toCents(input)).toBe(expected);
  });

  it('soma em centavos sem erro de ponto flutuante', () => {
    expect(toCents('0.1') + toCents('0.2')).toBe(30);
  });

  it('formata em reais', () => {
    expect(formatCents(479).replace(/\s/g, ' ')).toBe('R$ 4,79');
    expect(formatPrice('1234.5').replace(/\s/g, ' ')).toBe('R$ 1.234,50');
  });
});

describe('jwt', () => {
  it('lê as claims, inclusive com acentos', () => {
    const token = makeJwt(60, { nome: 'Cláudio', role: 'CLIENTE' });
    expect(decodeJwt(token)).toMatchObject({ nome: 'Cláudio', role: 'CLIENTE' });
  });

  it('retorna null para token malformado', () => {
    expect(decodeJwt('invalido')).toBeNull();
    expect(decodeJwt('a.%%%.c')).toBeNull();
  });

  it('detecta expiração com margem', () => {
    expect(isTokenExpiring(makeJwt(600), 30)).toBe(false);
    expect(isTokenExpiring(makeJwt(10), 30)).toBe(true);
    expect(isTokenExpiring('lixo', 30)).toBe(true);
  });
});

describe('format', () => {
  it('aplica máscaras', () => {
    expect(maskCep('60060170')).toBe('60060-170');
    expect(maskCep('600')).toBe('600');
    expect(maskPhone('85991000005')).toBe('(85) 99100-0005');
    expect(maskPhone('8532001000')).toBe('(85) 3200-1000');
    expect(maskPhone('')).toBe('');
    expect(formatTime('07:00:00')).toBe('07:00');
  });
});

describe('validation', () => {
  it('login normaliza o e-mail', () => {
    const result = loginSchema.parse({ email: '  Cliente@Email.COM ', password: 'x' });
    expect(result.email).toBe('cliente@email.com');
  });

  it('login rejeita e-mail inválido', () => {
    expect(loginSchema.safeParse({ email: 'abc', password: 'x' }).success).toBe(false);
  });

  it('registro exige senhas iguais e não apenas numéricas', () => {
    const base = { nome: 'Fulano de Tal', email: 'a@b.com', telefone: '' };
    expect(
      registerSchema.safeParse({ ...base, password: 'senhaForte1', confirmPassword: 'outra' })
        .success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ ...base, password: '12345678', confirmPassword: '12345678' })
        .success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ ...base, password: 'senhaForte1', confirmPassword: 'senhaForte1' })
        .success,
    ).toBe(true);
  });

  it('endereço normaliza a UF', () => {
    const parsed = addressSchema.parse({
      cep: '60060-170',
      endereco: 'Rua A',
      numero: '10',
      complemento: '',
      bairro: 'Centro',
      cidade: 'Fortaleza',
      estado: 'ce',
      principal: true,
    });
    expect(parsed.estado).toBe('CE');
  });

  it('checkout exige endereço na entrega em domicílio', () => {
    const base = { loja: 1, formaPagamento: 1, observacao: '' };
    expect(
      checkoutSchema.safeParse({ ...base, tipoEntrega: 'DOMICILIO', endereco: null }).success,
    ).toBe(false);
    expect(
      checkoutSchema.safeParse({ ...base, tipoEntrega: 'RETIRADA', endereco: null }).success,
    ).toBe(true);
  });
});
