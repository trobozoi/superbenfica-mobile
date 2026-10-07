/**
 * Tipos da API Super Benfica (espelham os serializers do backend Django).
 * Valores monetários chegam como string decimal ("4.79"): nunca use float
 * para somar preços — veja `utils/money.ts`.
 */

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type Role = 'ADMIN' | 'GERENTE' | 'SEPARADOR' | 'CAIXA' | 'CLIENTE';

export interface TokenPair {
  access: string;
  refresh: string;
}

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  loja: number | null;
  loja_nome: string | null;
  role: Role;
  is_active: boolean;
  data_cadastro: string;
}

export interface RegistroPayload {
  nome: string;
  email: string;
  telefone?: string;
  password: string;
  loja?: number | null;
}

export type Categoria =
  | 'HORTIFRUTI'
  | 'MERCEARIA'
  | 'BEBIDAS'
  | 'LATICINIOS'
  | 'PADARIA'
  | 'ACOUGUE'
  | 'LIMPEZA'
  | 'HIGIENE';

export interface Produto {
  id: number;
  nome: string;
  descricao: string;
  categoria: Categoria;
  preco: string;
  sku: string;
  codigo_barras: string;
  ativo: boolean;
  foto: string | null;
  data_criacao: string;
  data_atualizacao: string;
}

export interface Loja {
  id: number;
  nome: string;
  endereco: string;
  telefone: string;
  horario_abertura: string;
  horario_fechamento: string;
  ativa: boolean;
}

export type TipoPagamento = 'PIX' | 'CREDITO' | 'DEBITO' | 'DINHEIRO' | 'VALE_ALIMENTACAO';

export interface FormaPagamento {
  id: number;
  nome: string;
  tipo: TipoPagamento;
  tipo_display: string;
  permite_troco: boolean;
  ativa: boolean;
  ordem: number;
}

export interface Endereco {
  id: number;
  cliente: number;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  principal: boolean;
}

export type EnderecoPayload = Omit<Endereco, 'id'>;

export interface Cliente {
  id: number;
  usuario: number | null;
  nome: string;
  email: string;
  telefone: string;
  loja: number | null;
  data_cadastro: string;
  enderecos: Endereco[];
}

export type StatusPedido =
  'PENDENTE' | 'EM_SEPARACAO' | 'SEPARADO' | 'SAIU_PARA_ENTREGA' | 'FINALIZADO' | 'CANCELADO';

export type TipoEntrega = 'RETIRADA' | 'DOMICILIO';

export interface ItemPedido {
  id: number;
  produto: number;
  produto_nome: string;
  produto_sku: string;
  produto_codigo_barras: string;
  quantidade: number;
  preco_unitario: string;
  subtotal: string;
  separado: boolean;
}

export interface Pedido {
  id: number;
  codigo: string;
  cliente: number;
  cliente_nome: string;
  loja: number;
  loja_nome: string;
  status: StatusPedido;
  forma_pagamento: number | null;
  forma_pagamento_nome: string | null;
  tipo_entrega: TipoEntrega;
  endereco_entrega: string;
  observacao: string;
  itens: ItemPedido[];
  total: string;
  data_criacao: string;
  data_atualizacao: string;
}

export interface PedidoCreatePayload {
  loja: number;
  forma_pagamento: number;
  itens: { produto: number; quantidade: number }[];
  observacao?: string;
  tipo_entrega: TipoEntrega;
  endereco?: number | null;
}

/** Mensagem recebida em `ws/notificacoes/`. */
export interface RealtimeMessage<T = Record<string, unknown>> {
  evento: string;
  dados: T;
}

export interface PedidoEventoDados {
  pedido_id: number;
  codigo: string;
  status: StatusPedido;
  tipo_entrega: TipoEntrega;
}
