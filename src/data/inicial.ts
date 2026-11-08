// Estado inicial do protótipo. Ao recarregar a página, tudo volta para cá.
import type {
  Alerta, Comanda, FaturamentoDia, ItemComanda, ItemEstoque, Mesa, Movimento, NotaEntrada,
  PedidoOnline, RetiradaFreezer, Transferencia, UnidadeId, Venda, FormaPagamento,
} from '../types'
import { cardapio, getCardapio, getProduto, unidades, unidadesRestaurante } from './cadastros'
import { criarAleatorio, dataISO, emHora, minutosAtras } from '../lib/tempo'
import { arred } from '../lib/format'

const rnd = criarAleatorio(42)

// ---------- Histórico de 7 dias (+ o mesmo dia da semana passada) ----------
const baseDiaria: Record<Exclude<UnidadeId, 'central'>, { valor: number; ticket: number; kgPorReal: number }> = {
  'gado-nobre': { valor: 16800, ticket: 104, kgPorReal: 1 / 205 },
  'rancho-tijucas': { valor: 5200, ticket: 38, kgPorReal: 1 / 310 },
  'rancho-biguacu': { valor: 4600, ticket: 36, kgPorReal: 1 / 300 },
  'beira-rio': { valor: 6900, ticket: 34, kgPorReal: 1 / 330 },
}

export const historicoInicial: FaturamentoDia[] = []
for (let dias = 7; dias >= 1; dias--) {
  const d = new Date()
  d.setDate(d.getDate() - dias)
  const dow = d.getDay() // 0 dom, 6 sáb
  const fator = dow === 0 ? 1.45 : dow === 6 ? 1.3 : dow === 5 ? 1.15 : dow === 1 ? 0.78 : 1
  for (const u of unidadesRestaurante) {
    const b = baseDiaria[u.id as keyof typeof baseDiaria]
    // No protótipo todas as unidades abrem todos os dias (evita dia zerado no comparativo).
    const valor = arred(b.valor * fator * (0.9 + rnd() * 0.2), 2)
    historicoInicial.push({
      data: dataISO(dias),
      unidadeId: u.id,
      valor,
      clientes: Math.round(valor / b.ticket),
      carneKg: arred(valor * b.kgPorReal, 3),
    })
  }
}

// ---------- Vendas de hoje que já aconteceram antes da demonstração ----------
const formas: FormaPagamento[] = ['pix', 'pix', 'credito', 'credito', 'debito', 'dinheiro']
const vendasIniciais: Venda[] = []
// O total de hoje de cada unidade fica ancorado no mesmo dia da semana passada, com uma variação
// fixa (para o comparativo do painel fazer sentido em qualquer dia em que a demo for feita).
const vendasPorUnidade: Record<string, { variacao: number; ticketVenda: number; pessoas: [number, number] }> = {
  'gado-nobre': { variacao: 0.064, ticketVenda: 330, pessoas: [1, 6] },
  'rancho-tijucas': { variacao: 0.038, ticketVenda: 56, pessoas: [1, 3] },
  'rancho-biguacu': { variacao: -0.027, ticketVenda: 54, pessoas: [1, 3] },
  'beira-rio': { variacao: 0.051, ticketVenda: 66, pessoas: [1, 4] },
}
const caixaDe: Record<string, string> = {
  'gado-nobre': 'Patrícia', 'rancho-tijucas': 'Fernanda', 'rancho-biguacu': 'Gustavo', 'beira-rio': 'Vanessa',
}
for (const [unidadeId, cfg] of Object.entries(vendasPorUnidade)) {
  const semanaPassada = historicoInicial.find((h) => h.unidadeId === unidadeId && h.data === dataISO(7))!.valor
  // pedidos online do Beira Rio também contam no faturamento: descontamos uma estimativa
  const alvo = semanaPassada * (1 + cfg.variacao) - (unidadeId === 'beira-rio' ? 406 : 0)
  const qtd = Math.max(8, Math.round(alvo / cfg.ticketVenda))
  const brutos = Array.from({ length: qtd }, () => 0.55 + rnd() * 0.9)
  const soma = brutos.reduce((a, b) => a + b, 0)
  let acumulado = 0
  brutos.forEach((b, i) => {
    const total = i === qtd - 1 ? arred(alvo - acumulado) : arred((b / soma) * alvo)
    acumulado += total
    const forma = formas[Math.floor(rnd() * formas.length)]!
    const ehMarmita = unidadeId !== 'gado-nobre' && rnd() < 0.3
    const minuto = 11 * 60 + Math.floor((i / qtd) * 200)
    vendasIniciais.push({
      id: `v-ini-${unidadeId}-${i}`,
      unidadeId: unidadeId as UnidadeId,
      origem: ehMarmita ? 'marmita' : 'mesa',
      descricao: ehMarmita ? 'Marmita balcão' : `Mesa ${1 + Math.floor(rnd() * 16)}`,
      total,
      pagamentos: [{ forma, valor: total }],
      clientes: cfg.pessoas[0] + Math.floor(rnd() * (cfg.pessoas[1] - cfg.pessoas[0] + 1)),
      feitaPor: caixaDe[unidadeId]!,
      em: emHora(`${String(Math.floor(minuto / 60)).padStart(2, '0')}:${String(minuto % 60).padStart(2, '0')}`),
    })
  })
}
export { vendasIniciais }

// ---------- Mesas e comandas do Gado Nobre ----------
const item = (cardapioId: string, quantidade: number, por: string, minAtras: number, cancelado?: { por: string; minAtras: number }): ItemComanda => {
  const c = getCardapio(cardapioId)
  return {
    id: `ic-${cardapioId}-${minAtras}-${quantidade}-${Math.floor(rnd() * 1e6)}`,
    cardapioId, nome: c.nome, categoria: c.categoria, quantidade, precoUnitario: c.preco,
    lancadoPor: por, lancadoEm: minutosAtras(minAtras),
    cancelado: cancelado ? { por: cancelado.por, em: minutosAtras(cancelado.minAtras) } : undefined,
  }
}

const comandasSeed: Array<Omit<Comanda, 'unidadeId' | 'id'>> = [
  { mesa: 2, pessoas: 4, abertaPor: 'Renan', abertaEm: minutosAtras(72), status: 'aberta', itens: [
    item('rod-adulto', 3, 'Renan', 72), item('rod-crianca', 1, 'Renan', 72),
    item('beb-coca-2l', 1, 'Renan', 68), item('beb-suco', 2, 'Renan', 40), item('sob-pudim', 2, 'Renan', 8),
  ] },
  { mesa: 3, pessoas: 2, abertaPor: 'Juliana', abertaEm: minutosAtras(35), status: 'aberta', itens: [
    item('rod-adulto', 2, 'Juliana', 35), item('beb-heineken', 3, 'Juliana', 31), item('beb-agua', 1, 'Juliana', 20),
  ] },
  { mesa: 7, pessoas: 6, abertaPor: 'Renan', abertaEm: minutosAtras(58), status: 'aberta', itens: [
    item('rod-adulto', 5, 'Renan', 58), item('rod-crianca', 1, 'Renan', 58),
    item('beb-brahma', 4, 'Renan', 55), item('beb-coca-lata', 2, 'Renan', 55),
    item('beb-caipirinha', 1, 'Renan', 41, { por: 'Renan', minAtras: 39 }), item('beb-brahma', 2, 'Juliana', 22),
  ] },
  { mesa: 9, pessoas: 3, abertaPor: 'Juliana', abertaEm: minutosAtras(96), status: 'conta', itens: [
    item('rod-adulto', 3, 'Juliana', 96), item('beb-guarana-2l', 1, 'Juliana', 92),
    item('beb-heineken', 2, 'Juliana', 70), item('sob-petit', 1, 'Juliana', 15), item('sob-mousse', 2, 'Renan', 14),
  ] },
  { mesa: 12, pessoas: 2, abertaPor: 'Renan', abertaEm: minutosAtras(18), status: 'aberta', itens: [
    item('rod-adulto', 2, 'Renan', 18), item('beb-suco-abacaxi', 2, 'Renan', 15),
  ] },
  { mesa: 14, pessoas: 5, abertaPor: 'Juliana', abertaEm: minutosAtras(110), status: 'conta', itens: [
    item('rod-adulto', 4, 'Juliana', 110), item('rod-crianca', 1, 'Juliana', 110),
    item('beb-coca-2l', 2, 'Juliana', 105), item('beb-brahma', 3, 'Renan', 80),
    item('beb-agua-gas', 1, 'Juliana', 60), item('sob-abacaxi', 3, 'Juliana', 20),
  ] },
  { mesa: 18, pessoas: 4, abertaPor: 'Juliana', abertaEm: minutosAtras(44), status: 'aberta', itens: [
    item('rod-adulto', 4, 'Juliana', 44), item('beb-heineken', 4, 'Juliana', 40), item('beb-heineken', 2, 'Renan', 12),
  ] },
  { mesa: 21, pessoas: 8, abertaPor: 'Renan', abertaEm: minutosAtras(27), status: 'aberta', itens: [
    item('rod-adulto', 6, 'Renan', 27), item('rod-crianca', 2, 'Renan', 27),
    item('beb-coca-2l', 2, 'Renan', 25), item('beb-suco', 3, 'Renan', 25), item('beb-caipirinha', 2, 'Renan', 10),
  ] },
]

export const comandasIniciais: Comanda[] = comandasSeed.map((c, i) => ({ ...c, id: `cmd-ini-${i + 1}`, unidadeId: 'gado-nobre' }))

export const mesasIniciais: Mesa[] = unidades.flatMap((u) =>
  Array.from({ length: u.totalMesas }, (_, i) => {
    const numero = i + 1
    const cmd = u.id === 'gado-nobre' ? comandasIniciais.find((c) => c.mesa === numero) : undefined
    return {
      unidadeId: u.id, numero,
      status: cmd ? (cmd.status === 'conta' ? 'conta' : 'ocupada') : 'livre',
      comandaId: cmd?.id,
    } as Mesa
  }),
)

// ---------- Estoque ----------
const est = (unidadeId: UnidadeId, produtoId: string, quantidade: number, minimo: number): ItemEstoque => ({ unidadeId, produtoId, quantidade, minimo })

export const estoqueInicial: ItemEstoque[] = [
  // Central
  est('central', 'picanha', 86.4, 40), est('central', 'alcatra', 124.8, 50), est('central', 'fraldinha', 98.2, 40),
  est('central', 'costela', 142.5, 60), est('central', 'maminha', 54.3, 30), est('central', 'linguica', 38.6, 40),
  est('central', 'coracao', 22.1, 25), est('central', 'coxa', 76.9, 40), est('central', 'cupim', 31.7, 20),
  est('central', 'coca-2l', 96, 48), est('central', 'coca-lata', 288, 120), est('central', 'guarana-2l', 54, 36),
  est('central', 'heineken', 144, 96), est('central', 'brahma', 72, 48), est('central', 'agua', 210, 96),
  est('central', 'suco', 40, 24), est('central', 'arroz', 18, 12), est('central', 'feijao', 34, 20),
  est('central', 'macarrao', 46, 30), est('central', 'farinha', 9, 15), est('central', 'oleo', 28, 20),
  // Gado Nobre
  est('gado-nobre', 'picanha', 18.35, 15), est('gado-nobre', 'alcatra', 22.6, 15), est('gado-nobre', 'fraldinha', 9.8, 12),
  est('gado-nobre', 'costela', 31.2, 20), est('gado-nobre', 'maminha', 11.4, 10), est('gado-nobre', 'linguica', 14.7, 8),
  est('gado-nobre', 'coracao', 4.3, 6), est('gado-nobre', 'coxa', 12.9, 8), est('gado-nobre', 'cupim', 16.2, 10),
  est('gado-nobre', 'coca-2l', 22, 12), est('gado-nobre', 'coca-lata', 64, 36), est('gado-nobre', 'heineken', 48, 48),
  est('gado-nobre', 'brahma', 30, 24), est('gado-nobre', 'agua', 40, 24), est('gado-nobre', 'guarana-2l', 14, 10), est('gado-nobre', 'suco', 12, 10),
  // Rancho Tijucas
  est('rancho-tijucas', 'alcatra', 8.4, 6), est('rancho-tijucas', 'costela', 12.1, 8), est('rancho-tijucas', 'coxa', 15.3, 10),
  est('rancho-tijucas', 'linguica', 4.2, 5), est('rancho-tijucas', 'fraldinha', 6.6, 5), est('rancho-tijucas', 'coca-lata', 30, 24),
  // Rancho Biguaçu
  est('rancho-biguacu', 'alcatra', 7.9, 6), est('rancho-biguacu', 'costela', 10.4, 8), est('rancho-biguacu', 'coxa', 13.8, 10),
  est('rancho-biguacu', 'linguica', 6.1, 5), est('rancho-biguacu', 'fraldinha', 3.2, 5), est('rancho-biguacu', 'coca-lata', 18, 24),
  // Beira Rio
  est('beira-rio', 'alcatra', 9.7, 6), est('beira-rio', 'costela', 14.6, 8), est('beira-rio', 'coxa', 18.2, 10),
  est('beira-rio', 'linguica', 7.4, 5), est('beira-rio', 'maminha', 5.1, 4), est('beira-rio', 'coca-lata', 42, 24),
]

// ---------- Transferências ----------
export const transferenciasIniciais: Transferencia[] = [
  { id: 't-1', lacre: 'L-004821', origemId: 'central', destinoId: 'gado-nobre', produtoId: 'alcatra', quantidadeEnviada: 15, volumes: 2, enviadoPor: 'Rodrigo', enviadoEm: emHora('07:40'), status: 'em_transito' },
  { id: 't-2', lacre: 'L-004822', origemId: 'central', destinoId: 'gado-nobre', produtoId: 'picanha', quantidadeEnviada: 10, volumes: 1, enviadoPor: 'Rodrigo', enviadoEm: emHora('07:42'), status: 'em_transito' },
  { id: 't-3', lacre: 'L-004823', origemId: 'central', destinoId: 'gado-nobre', produtoId: 'fraldinha', quantidadeEnviada: 12.5, volumes: 2, enviadoPor: 'Eliane', enviadoEm: emHora('07:45'), status: 'em_transito' },
  { id: 't-4', lacre: 'L-004819', origemId: 'central', destinoId: 'rancho-tijucas', produtoId: 'costela', quantidadeEnviada: 18, volumes: 2, enviadoPor: 'Rodrigo', enviadoEm: emHora('06:50'), status: 'conferido', quantidadeRecebida: 17.9, recebidoPor: 'Adriana', recebidoEm: emHora('08:05') },
  { id: 't-5', lacre: 'L-004820', origemId: 'central', destinoId: 'beira-rio', produtoId: 'coxa', quantidadeEnviada: 20, volumes: 2, enviadoPor: 'Eliane', enviadoEm: emHora('06:55'), status: 'conferido', quantidadeRecebida: 20.05, recebidoPor: 'Rosângela', recebidoEm: emHora('08:20') },
  { id: 't-6', lacre: 'L-004824', origemId: 'central', destinoId: 'rancho-biguacu', produtoId: 'alcatra', quantidadeEnviada: 8, volumes: 1, enviadoPor: 'Márcio', enviadoEm: emHora('08:10'), status: 'em_transito' },
]

// ---------- Retiradas do freezer ----------
const retirada = (id: string, unidadeId: UnidadeId, funcionarioId: string, funcionarioNome: string, produtoId: string, quantidade: number, em: string, foraDoHorario = false): RetiradaFreezer =>
  ({ id, unidadeId, funcionarioId, funcionarioNome, produtoId, quantidade, em, foraDoHorario })

export const retiradasIniciais: RetiradaFreezer[] = [
  retirada('r-0', 'gado-nobre', 'f-gn-6', 'Diego', 'picanha', 4.2, emHora('23:15', 1), true),
  retirada('r-1', 'gado-nobre', 'f-gn-1', 'Carlos', 'picanha', 9.6, emHora('09:35')),
  retirada('r-2', 'gado-nobre', 'f-gn-1', 'Carlos', 'alcatra', 12.4, emHora('09:38')),
  retirada('r-3', 'gado-nobre', 'f-gn-5', 'Wellington', 'costela', 15.8, emHora('09:52')),
  retirada('r-4', 'gado-nobre', 'f-gn-5', 'Wellington', 'linguica', 6.2, emHora('10:05')),
  retirada('r-5', 'gado-nobre', 'f-gn-1', 'Carlos', 'cupim', 7.3, emHora('10:10')),
  retirada('r-6', 'gado-nobre', 'f-gn-1', 'Carlos', 'fraldinha', 8.1, emHora('12:20')),
  retirada('r-7', 'gado-nobre', 'f-gn-5', 'Wellington', 'coracao', 3.4, emHora('12:45')),
  retirada('r-8', 'rancho-tijucas', 'f-rt-2', 'Marcos', 'alcatra', 6.5, emHora('09:50')),
  retirada('r-9', 'rancho-tijucas', 'f-rt-1', 'Adriana', 'coxa', 7.2, emHora('09:55')),
  retirada('r-10', 'rancho-biguacu', 'f-rb-2', 'Anderson', 'alcatra', 5.8, emHora('09:40')),
  retirada('r-11', 'rancho-biguacu', 'f-rb-1', 'Jéssica', 'costela', 6.9, emHora('10:00')),
  retirada('r-12', 'beira-rio', 'f-br-1', 'Rosângela', 'costela', 9.4, emHora('09:30')),
  retirada('r-13', 'beira-rio', 'f-br-1', 'Rosângela', 'coxa', 8.6, emHora('09:45')),
]

// ---------- Alertas iniciais ----------
export const alertasIniciais: Alerta[] = [
  {
    id: 'a-1', tipo: 'freezer_fora_horario', unidadeId: 'gado-nobre',
    titulo: 'Retirada do freezer fora do horário',
    detalhe: `${'4,200 kg'} de Picanha retirados com o restaurante fechado`,
    quem: 'Diego', em: emHora('23:15', 1), valor: arred(4.2 * getProduto('picanha').custo), lido: false,
  },
  {
    id: 'a-2', tipo: 'diferenca_caixa', unidadeId: 'rancho-biguacu',
    titulo: 'Falta no fechamento de caixa',
    detalhe: 'Dinheiro contado menor que o registrado no sistema',
    quem: 'Gustavo', em: emHora('15:42', 1), valor: 42, lido: false,
  },
]

// ---------- Pedidos online de hoje (Beira Rio) ----------
const ped = (numero: number, cliente: string, bairroId: string, taxa: number, itens: Array<[string, number]>, status: PedidoOnline['status'], hora: string): PedidoOnline => {
  const its = itens.map(([id, q]) => { const c = getCardapio(id); return { cardapioId: id, nome: c.nome, quantidade: q, precoUnitario: c.preco } })
  const subtotal = its.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0)
  return {
    id: `p-${numero}`, numero, unidadeId: 'beira-rio', cliente, telefone: '(47) 9 9999-0000', bairroId,
    endereco: 'Endereço do cliente', formaPagamento: 'pix', itens: its, subtotal, taxaEntrega: taxa,
    total: subtotal + taxa, status, em: emHora(hora),
  }
}
export const pedidosIniciais: PedidoOnline[] = [
  ped(1041, 'Marcelo S.', 'centro', 5, [['mar-m', 2], ['beb-coca-lata', 2]], 'entregue', '11:05'),
  ped(1042, 'Bruna K.', 'coloninha', 7, [['mar-g', 1]], 'entregue', '11:18'),
  ped(1043, 'Jorge W.', 'bela-vista', 8, [['exe-bife', 1], ['mar-p', 1]], 'entregue', '11:32'),
  ped(1044, 'Simone R.', 'sete-setembro', 6, [['mar-m', 3]], 'entregue', '11:50'),
  ped(1045, 'Leandro P.', 'gasparinho', 10, [['exe-costela', 2], ['beb-guarana-2l', 1]], 'saiu', '12:10'),
  ped(1046, 'Aline M.', 'centro', 5, [['mar-p', 2], ['sob-pudim', 1]], 'preparo', '12:24'),
]

export const notasIniciais: NotaEntrada[] = []
export const movimentosIniciais: Movimento[] = []

// Usado em outros lugares para consultas rápidas
export const cardapioPorCategoria = (cat: string) => cardapio.filter((c) => c.categoria === cat)
