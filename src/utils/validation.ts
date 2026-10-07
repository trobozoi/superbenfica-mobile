/**
 * Schemas Zod dos formulários. A validação local melhora a UX, mas a regra
 * final é sempre do backend (erros de campo da API são exibidos no form).
 */
import { z } from 'zod';

const REQUIRED = 'Campo obrigatório';

const email = z.string().trim().min(1, REQUIRED).toLowerCase().pipe(z.email('E-mail inválido'));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, REQUIRED),
});
export type LoginForm = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    nome: z.string().trim().min(3, 'Informe seu nome completo').max(150),
    email,
    telefone: z
      .string()
      .trim()
      .refine((v) => v === '' || v.replace(/\D/g, '').length >= 10, 'Telefone inválido'),
    // Espelha o mínimo do Django (MinimumLengthValidator = 8 e NumericPasswordValidator).
    password: z
      .string()
      .min(8, 'Mínimo de 8 caracteres')
      .refine((v) => !/^\d+$/.test(v), 'A senha não pode ter apenas números'),
    confirmPassword: z.string().min(1, REQUIRED),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem',
  });
export type RegisterForm = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export const addressSchema = z.object({
  cep: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
  endereco: z.string().trim().min(3, REQUIRED).max(200),
  numero: z.string().trim().min(1, REQUIRED).max(20),
  complemento: z.string().trim().max(100),
  bairro: z.string().trim().min(2, REQUIRED).max(100),
  cidade: z.string().trim().min(2, REQUIRED).max(100),
  estado: z
    .string()
    .trim()
    .length(2, 'Use a sigla (ex.: CE)')
    .transform((v) => v.toUpperCase()),
  principal: z.boolean(),
});
export type AddressForm = z.input<typeof addressSchema>;

export const checkoutSchema = z
  .object({
    loja: z.number({ error: 'Escolha a loja' }).int().positive(),
    formaPagamento: z.number({ error: 'Escolha a forma de pagamento' }).int().positive(),
    tipoEntrega: z.enum(['RETIRADA', 'DOMICILIO']),
    endereco: z.number().int().positive().nullable(),
    observacao: z.string().max(500, 'Máximo de 500 caracteres'),
  })
  .refine((data) => data.tipoEntrega === 'RETIRADA' || data.endereco !== null, {
    path: ['endereco'],
    message: 'Escolha o endereço de entrega',
  });
export type CheckoutForm = z.infer<typeof checkoutSchema>;
