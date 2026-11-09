// Estado inicial do protótipo ("Reiniciar demonstração" volta para cá).
// Todos os horários são relativos ao momento de referência (src/lib/referencia.ts): nunca há horário no futuro.
import type {
  Alerta, Comanda, FaturamentoDia, ItemComanda, ItemEstoque, Mesa, Movimento, NotaEntrada,
  PedidoOnline, RetiradaFreezer, Transferencia, UnidadeId, Venda, FormaPagamento,
} from '../types'
import { cardapio, funcionariosDa, getCardapio, getProduto, getUnidade, unidades, unidadesRestaurante } from './cadastros'
import { criarAleatorio } from '../lib/tempo'
import { REF, agoraMinRef, antesDaRef, dataRef, emMinRef, fracaoExpediente, paraMin } from '../lib/referencia'
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
  const d = new Date(REF.dia)
  d.setDate(d.getDate() - dias)
  const dow = d.getDay() // 0 dom, 6 sáb
  const fator = dow === 0 ? 1.45 : dow === 6 ? 1.3 : dow === 5 ? 1.15 : dow === 1 ? 0.78 : 1
  for (const u of unidadesRestaurante) {
    const b = baseDiaria[u.id as keyof typeof baseDiaria]
    // No protótipo todas as unidades abrem todos os dias (evita dia zerado no comparativo).
    const valor = arred(b.valor * fator * (0.9 + rnd() * 0.2), 2)
    historicoInicial.push({
      data: dataRef(dias),
      unidadeId: u.id,
      valor,
      clientes: Math.round(valor / b.ticket),
      carneKg: arred(valor * b.kgPorReal, 3),
    })
  }
}

// ---------- Vendas do dia de operação até o momento de referência ----------
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
/** Janela do expediente já transcorrida: da abertura até agora (ou até o fechamento). Em minutos do dia. */
const janela = (unidadeId: UnidadeId) => {
  const u = getUnidade(unidadeId)
  const ini = paraMin(u.horarioAbertura)
  const fim = Math.max(ini, Math.min(agoraMinRef() - 2, paraMin(u.horarioFechamento)))
  return { ini, fim, fracao: fracaoExpediente(u.horarioAbertura, u.horarioFechamento) }
}

// ---------- Pedidos online do dia (Beira Rio) ----------
const modelosPedido: Array<[string, string, number, Array<[string, number]>]> = [
  ['Marcelo S.', 'centro', 5, [['mar-m', 2], ['beb-coca-lata', 2]]],
  ['Bruna K.', 'coloninha', 7, [['mar-g', 1]]],
  ['Jorge W.', 'bela-vista', 8, [['exe-bife', 1], ['mar-p', 1]]],
  ['Simone R.', 'sete-setembro', 6, [['mar-m', 3]]],
  ['Leandro P.', 'gasparinho', 10, [['exe-costela', 2], ['beb-guarana-2l', 1]]],
  ['Aline M.', 'centro', 5, [['mar-p', 2], ['sob-pudim', 1]]],
]
const jBR = janela('beira-rio')
const nPedidos = Math.max(1, Math.round(modelosPedido.length * jBR.fracao))
const aindaAberto = jBR.fracao < 1
export const pedidosIniciais: PedidoOnline[] = modelosPedido.slice(0, nPedidos).map(([cliente, bairroId, taxa, itens], i) => {
  const its = itens.map(([id, q]) => { const c = getCardapio(id); return { cardapioId: id, nome: c.nome, quantidade: q, precoUnitario: c.preco } })
  const subtotal = its.reduce((s, x) => s + x.precoUnitario * x.quantidade, 0)
  const numero = 1041 + i
  const status: PedidoOnline['status'] = aindaAberto && i === nPedidos - 1 ? 'preparo' : aindaAberto && i === nPedidos - 2 ? 'saiu' : 'entregue'
  const minuto = jBR.ini + Math.floor(((i + 0.5) / nPedidos) * (jBR.fim - jBR.ini))
  return {
    id: `p-${numero}`, numero, unidadeId: 'beira-rio', cliente, telefone: '(47) 9 9999-0000', bairroId,
    endereco: 'Endereço do cliente', formaPagamento: 'pix', itens: its, subtotal, taxaEntrega: taxa,
    total: subtotal + taxa, status, em: emMinRef(minuto),
  }
})
export const proximoPedidoInicial = 1041 + nPedidos
const totalOnline = pedidosIniciais.reduce((s, p) => s + p.total, 0)

for (const [unidadeId, cfg] of Object.entries(vendasPorUnidade)) {
  const semanaPassada = historicoInicial.find((h) => h.unidadeId === unidadeId && h.data === dataRef(7))!.valor
  const j = janela(unidadeId as UnidadeId)
  // faturamento até agora = semana passada no mesmo ponto do expediente, com a variação da unidade.
  // Os pedidos online do Beira Rio também contam no faturamento, então saem do alvo do balcão.
  const alvo = Math.max(150, semanaPassada * (1 + cfg.variacao) * j.fracao - (unidadeId === 'beira-rio' ? totalOnline : 0))
  const qtd = Math.max(2, Math.round(alvo / cfg.ticketVenda))
  const brutos = Array.from({ length: qtd }, () => 0.55 + rnd() * 0.9)
  const soma = brutos.reduce((a, b) => a + b, 0)
  let acumulado = 0
  brutos.forEach((b, i) => {
    const total = i === qtd - 1 ? arred(alvo - acumulado) : arred((b / soma) * alvo)
    acumulado += total
    const forma = formas[Math.floor(rnd() * formas.length)]!
    const ehMarmita = unidadeId !== 'gado-nobre' && rnd() < 0.3
    const minuto = j.ini + Math.floor(((i + 0.5) / qtd) * (j.fim - j.ini))
    vendasIniciais.push({
      id: `v-ini-${unidadeId}-${i}`,
      unidadeId: unidadeId as UnidadeId,
      origem: ehMarmita ? 'marmita' : 'mesa',
      descricao: ehMarmita ? 'Marmita balcão' : `Mesa ${1 + Math.floor(rnd() * 16)}`,
      total,
      pagamentos: [{ forma, valor: total }],
      clientes: cfg.pessoas[0] + Math.floor(rnd() * (cfg.pessoas[1] - cfg.pessoas[0] + 1)),
      feitaPor: caixaDe[unidadeId]!,
      em: emMinRef(minuto),
    })
  })
}
export { vendasIniciais }

// ---------- Mesas e comandas do Gado Nobre ----------
// Os "minutos atrás" abaixo são comprimidos se o Gado Nobre abriu há pouco tempo
// (nenhuma mesa aparece aberta antes da abertura).
const minutosDesdeAbertura = agoraMinRef() - paraMin(getUnidade('gado-nobre').horarioAbertura)
const escalaMesas = Math.min(1, Math.max(0.05, (minutosDesdeAbertura - 3) / 115))
// depois do fechamento, as últimas mesas ficam como abertas até a hora de fechar (não depois)
const depoisDoFechamento = Math.max(0, agoraMinRef() - paraMin(getUnidade('gado-nobre').horarioFechamento))
const minutosAtras = (min: number) => antesDaRef(min * escalaMesas + depoisDoFechamento)

const item =(cardapioId: string, quantidade: number, por: string, minAtras: number, cancelado?: { por: string; minAtras: number }): ItemComanda => {
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
  { id: 't-1', lacre: 'L-004821', origemId: 'central', destinoId: 'gado-nobre', produtoId: 'alcatra', quantidadeEnviada: 15, volumes: 2, enviadoPor: 'Rodrigo', enviadoEm: emMinRef(paraMin('07:40')), status: 'em_transito' },
  { id: 't-2', lacre: 'L-004822', origemId: 'central', destinoId: 'gado-nobre', produtoId: 'picanha', quantidadeEnviada: 10, volumes: 1, enviadoPor: 'Rodrigo', enviadoEm: emMinRef(paraMin('07:42')), status: 'em_transito' },
  { id: 't-3', lacre: 'L-004823', origemId: 'central', destinoId: 'gado-nobre', produtoId: 'fraldinha', quantidadeEnviada: 12.5, volumes: 2, enviadoPor: 'Eliane', enviadoEm: emMinRef(paraMin('07:45')), status: 'em_transito' },
  { id: 't-4', lacre: 'L-004819', origemId: 'central', destinoId: 'rancho-tijucas', produtoId: 'costela', quantidadeEnviada: 18, volumes: 2, enviadoPor: 'Rodrigo', enviadoEm: emMinRef(paraMin('06:50')), status: 'conferido', quantidadeRecebida: 17.9, recebidoPor: 'Adriana', recebidoEm: emMinRef(paraMin('08:05')) },
  { id: 't-5', lacre: 'L-004820', origemId: 'central', destinoId: 'beira-rio', produtoId: 'coxa', quantidadeEnviada: 20, volumes: 2, enviadoPor: 'Eliane', enviadoEm: emMinRef(paraMin('06:55')), status: 'conferido', quantidadeRecebida: 20.05, recebidoPor: 'Rosângela', recebidoEm: emMinRef(paraMin('08:20')) },
  { id: 't-6', lacre: 'L-004824', origemId: 'central', destinoId: 'rancho-biguacu', produtoId: 'alcatra', quantidadeEnviada: 8, volumes: 1, enviadoPor: 'Márcio', enviadoEm: emMinRef(paraMin('08:10')), status: 'em_transito' },
]

// ---------- Retiradas do freezer ----------
const retirada = (id: string, unidadeId: UnidadeId, funcionarioId: string, funcionarioNome: string, produtoId: string, quantidade: number, em: string, foraDoHorario = false): RetiradaFreezer =>
  ({ id, unidadeId, funcionarioId, funcionarioNome, produtoId, quantidade, em, foraDoHorario })

// Carne retirada no dia = o que a unidade costuma usar para faturar o que já faturou (rendimento coerente).
// Horários entre 2h antes da abertura (preparo) e o momento de referência.
const quemRetira: Record<string, string[]> = {
  'gado-nobre': ['f-gn-1', 'f-gn-5'], 'rancho-tijucas': ['f-rt-2', 'f-rt-1'],
  'rancho-biguacu': ['f-rb-2', 'f-rb-1'], 'beira-rio': ['f-br-1'],
}
const retiradasDoDia: RetiradaFreezer[] = []
for (const u of unidadesRestaurante) {
  const fat = vendasIniciais.filter((v) => v.unidadeId === u.id).reduce((s, v) => s + v.total, 0)
    + (u.id === 'beira-rio' ? totalOnline : 0)
  const kgTotal = fat * baseDiaria[u.id as keyof typeof baseDiaria].kgPorReal * (0.96 + rnd() * 0.08)
  const cortes = estoqueInicial.filter((e) => e.unidadeId === u.id && getProduto(e.produtoId).categoria === 'carne')
  const n = Math.min(cortes.length, u.id === 'gado-nobre' ? 7 : 3)
  const pesos = Array.from({ length: n }, () => 0.6 + rnd() * 0.8)
  const somaP = pesos.reduce((a, b) => a + b, 0)
  const ini = paraMin(u.horarioAbertura) - 120
  const fim = Math.min(agoraMinRef() - 3, paraMin(u.horarioFechamento))
  const equipe = funcionariosDa(u.id)
  pesos.forEach((p, i) => {
    const fid = quemRetira[u.id]![i % quemRetira[u.id]!.length]!
    retiradasDoDia.push(retirada(
      `r-${u.id}-${i}`, u.id, fid, equipe.find((f) => f.id === fid)!.nome, cortes[i]!.produtoId,
      arred((p / somaP) * kgTotal, 3), emMinRef(ini + Math.floor(((i + 0.3) / n) * (fim - ini))),
    ))
  })
}

export const retiradasIniciais: RetiradaFreezer[] = [
  // a retirada suspeita: noite anterior, com o restaurante fechado
  retirada('r-0', 'gado-nobre', 'f-gn-6', 'Diego', 'picanha', 4.2, emMinRef(paraMin('23:15'), 1), true),
  ...retiradasDoDia,
]

// ---------- Alertas iniciais ----------
export const alertasIniciais: Alerta[] = [
  {
    id: 'a-1', tipo: 'freezer_fora_horario', unidadeId: 'gado-nobre',
    titulo: 'Retirada do freezer fora do horário',
    detalhe: `${'4,200 kg'} de Picanha retirados com o restaurante fechado`,
    quem: 'Diego', em: emMinRef(paraMin('23:15'), 1), valor: arred(4.2 * getProduto('picanha').custo), lido: false,
  },
  {
    id: 'a-2', tipo: 'diferenca_caixa', unidadeId: 'rancho-biguacu',
    titulo: 'Falta no fechamento de caixa',
    detalhe: 'Dinheiro contado menor que o registrado no sistema',
    quem: 'Gustavo', em: emMinRef(paraMin('15:42'), 1), valor: 42, lido: false,
  },
]

export const notasIniciais: NotaEntrada[] = []
export const movimentosIniciais: Movimento[] = []

// Usado em outros lugares para consultas rápidas
export const cardapioPorCategoria = (cat: string) => cardapio.filter((c) => c.categoria === cat)
