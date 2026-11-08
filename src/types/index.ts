// Tipos de todas as entidades do sistema.
// Espelham as tabelas de supabase/migrations/001_schema.sql (camelCase aqui, snake_case no banco).

export type UnidadeId = 'central' | 'gado-nobre' | 'rancho-tijucas' | 'rancho-biguacu' | 'beira-rio'

export type TipoUnidade = 'central' | 'rodizio' | 'chapa-buffet' | 'buffet-entrega'

export interface Unidade {
  id: UnidadeId
  nome: string
  cidade: string
  tipo: TipoUnidade
  descricao: string
  cor: string // cor de destaque da unidade (hex)
  horarioAbertura: string // "11:00"
  horarioFechamento: string // "23:00"
  totalMesas: number
}

export type Perfil = 'dona' | 'central' | 'recebimento' | 'freezer' | 'garcom' | 'caixa' | 'cliente'

export interface Funcionario {
  id: string
  nome: string
  funcao: string
  unidadeId: UnidadeId
}

export type UnidadeMedida = 'kg' | 'un'

export interface Produto {
  id: string
  nome: string
  categoria: 'carne' | 'bebida' | 'mercearia'
  unidadeMedida: UnidadeMedida
  codigoBarras?: string
  custo: number // custo por kg ou por unidade
  precoVenda?: number
}

export interface ItemEstoque {
  unidadeId: UnidadeId
  produtoId: string
  quantidade: number // kg ou unidades
  minimo: number
}

export type TipoMovimento =
  | 'entrada_nota'
  | 'envio_transferencia'
  | 'recebimento_transferencia'
  | 'retirada_freezer'
  | 'venda'
  | 'estorno'

// Movimentos nunca são apagados. Correções viram um novo movimento do tipo "estorno".
export interface Movimento {
  id: string
  unidadeId: UnidadeId
  produtoId: string
  tipo: TipoMovimento
  quantidade: number // positivo entra, negativo sai
  feitoPor: string
  em: string // ISO
  referencia?: string // nº da nota, nº do lacre, id da comanda...
}

export interface Fornecedor {
  id: string
  nome: string
  cnpj: string
}

export type StatusTransferencia = 'em_transito' | 'conferido' | 'divergencia'

export interface Transferencia {
  id: string
  lacre: string
  origemId: UnidadeId
  destinoId: UnidadeId
  produtoId: string
  quantidadeEnviada: number // PESO CEGO: nunca exibir para quem recebe antes da conferência
  volumes: number
  enviadoPor: string
  enviadoEm: string
  status: StatusTransferencia
  quantidadeRecebida?: number
  recebidoPor?: string
  recebidoEm?: string
}

// Versão segura que a tela de recebimento enxerga (sem peso enviado).
export type TransferenciaCega = Omit<Transferencia, 'quantidadeEnviada' | 'quantidadeRecebida'>

export interface ResultadoConferencia {
  ok: boolean
  lacre: string
  produtoNome: string
  enviado: number
  recebido: number
  diferenca: number
  percentual: number
  valorEstimado: number
  tolerancia: number
}

export type StatusMesa = 'livre' | 'ocupada' | 'conta'

export interface Mesa {
  unidadeId: UnidadeId
  numero: number
  status: StatusMesa
  comandaId?: string
}

export type CategoriaCardapio = 'rodizio' | 'bebidas' | 'sobremesas' | 'marmitas' | 'executivos'

export interface ItemCardapio {
  id: string
  nome: string
  descricao?: string
  categoria: CategoriaCardapio
  preco: number
  produtoId?: string // vínculo com o estoque (bebidas)
}

export interface ItemComanda {
  id: string
  cardapioId: string
  nome: string
  categoria: CategoriaCardapio
  quantidade: number
  precoUnitario: number
  lancadoPor: string
  lancadoEm: string
  cancelado?: { por: string; em: string }
}

export interface Comanda {
  id: string
  unidadeId: UnidadeId
  mesa: number
  pessoas: number
  abertaPor: string
  abertaEm: string
  status: 'aberta' | 'conta' | 'fechada'
  itens: ItemComanda[]
  fechadaEm?: string
}

export type FormaPagamento = 'pix' | 'credito' | 'debito' | 'dinheiro'

export interface Pagamento {
  forma: FormaPagamento
  valor: number
}

export type OrigemVenda = 'mesa' | 'marmita' | 'online'

export interface Venda {
  id: string
  unidadeId: UnidadeId
  origem: OrigemVenda
  descricao: string
  total: number
  pagamentos: Pagamento[]
  troco?: number
  clientes: number
  feitaPor: string
  em: string
  comandaId?: string
}

export interface FechamentoCaixa {
  id: string
  unidadeId: UnidadeId
  fechadoPor: string
  em: string
  totais: Record<FormaPagamento, number>
  dinheiroContado: number
  diferenca: number
}

export interface RetiradaFreezer {
  id: string
  unidadeId: UnidadeId
  funcionarioId: string
  funcionarioNome: string
  produtoId: string
  quantidade: number
  em: string
  foraDoHorario: boolean
}

export interface Bairro {
  id: string
  unidadeId: UnidadeId
  nome: string
  taxa: number
}

export type StatusPedidoOnline = 'recebido' | 'preparo' | 'saiu' | 'entregue'

export interface ItemPedido {
  cardapioId: string
  nome: string
  quantidade: number
  precoUnitario: number
}

export interface PedidoOnline {
  id: string
  numero: number
  unidadeId: UnidadeId
  cliente: string
  telefone: string
  bairroId: string
  endereco: string
  formaPagamento: 'pix' | 'cartao' | 'dinheiro'
  trocoPara?: number
  itens: ItemPedido[]
  subtotal: number
  taxaEntrega: number
  total: number
  status: StatusPedidoOnline
  em: string
}

export type TipoAlerta = 'divergencia_lacre' | 'freezer_fora_horario' | 'diferenca_caixa'

export interface Alerta {
  id: string
  tipo: TipoAlerta
  unidadeId: UnidadeId
  titulo: string
  detalhe: string
  quem: string
  em: string
  valor: number
  lido: boolean
}

export interface FaturamentoDia {
  data: string // YYYY-MM-DD
  unidadeId: UnidadeId
  valor: number
  clientes: number
  carneKg: number
}

export interface ItemNota {
  produtoId: string
  quantidade: number
  custoUnitario: number
}

export interface NotaEntrada {
  id: string
  fornecedorId: string
  numero: string
  data: string
  itens: ItemNota[]
  total: number
  lancadaPor: string
  lancadaEm: string
}
