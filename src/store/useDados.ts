// Estado global mockado (vive em memória; recarregou, volta ao inicial).
// As telas NÃO usam este arquivo direto: passam pela camada src/services/,
// que é o ponto único a trocar quando o Supabase for conectado.
import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import type {
  Alerta, Comanda, FechamentoCaixa, FormaPagamento, ItemComanda, ItemEstoque, ItemNota, Mesa, Movimento,
  NotaEntrada, Pagamento, PedidoOnline, ResultadoConferencia, RetiradaFreezer, Transferencia, UnidadeId, Venda,
} from '../types'
import {
  alertasIniciais, comandasIniciais, estoqueInicial, historicoInicial, mesasIniciais, movimentosIniciais,
  notasIniciais, pedidosIniciais, proximoPedidoInicial, retiradasIniciais, transferenciasIniciais, vendasIniciais,
} from '../data/inicial'
import { bairros, getCardapio, getProduto, getUnidade, TOLERANCIA_DIVERGENCIA } from '../data/cadastros'
import { agoraISO, dentroDoHorario, novoId } from '../lib/tempo'
import { DIA_REF, ehDiaOperacao } from '../lib/referencia'
import { arred, formatBRL, formatKg } from '../lib/format'

export interface DadosState {
  historico: typeof historicoInicial
  estoque: ItemEstoque[]
  movimentos: Movimento[]
  transferencias: Transferencia[]
  mesas: Mesa[]
  comandas: Comanda[]
  vendas: Venda[]
  fechamentos: FechamentoCaixa[]
  retiradas: RetiradaFreezer[]
  pedidos: PedidoOnline[]
  alertas: Alerta[]
  notas: NotaEntrada[]
  proximoLacre: number
  proximoPedido: number

  conferirLacre: (lacre: string, kg: number, por: string, unidadeId: UnidadeId) => ResultadoConferencia | null
  enviarTransferencia: (d: { destinoId: UnidadeId; produtoId: string; quantidade: number; volumes: number; lacre: string; por: string }) => Transferencia
  lancarNota: (d: { fornecedorId: string; numero: string; data: string; itens: ItemNota[]; por: string }) => NotaEntrada
  abrirMesa: (unidadeId: UnidadeId, numero: number, adultos: number, criancas: number, garcom: string) => Comanda
  lancarItem: (comandaId: string, cardapioId: string, garcom: string) => void
  removerUm: (comandaId: string, cardapioId: string, garcom: string) => void
  cancelarItem: (comandaId: string, itemId: string, por: string) => void
  pedirConta: (comandaId: string) => void
  reabrirComanda: (comandaId: string) => void
  finalizarConta: (comandaId: string, pagamentos: Pagamento[], troco: number, por: string) => Venda
  venderBalcao: (unidadeId: UnidadeId, itens: Array<{ cardapioId: string; quantidade: number }>, pagamentos: Pagamento[], troco: number, por: string) => Venda
  fecharCaixa: (unidadeId: UnidadeId, dinheiroContado: number, por: string) => FechamentoCaixa
  registrarRetirada: (unidadeId: UnidadeId, funcionarioId: string, funcionarioNome: string, produtoId: string, kg: number) => RetiradaFreezer
  fazerPedido: (d: Omit<PedidoOnline, 'id' | 'numero' | 'status' | 'em' | 'subtotal' | 'taxaEntrega' | 'total'>) => PedidoOnline
  avancarPedido: (id: string) => void
  marcarAlertaLido: (id: string) => void
  reiniciarDemo: () => void
}

const somaItens = (itens: ItemComanda[]) =>
  itens.filter((i) => !i.cancelado).reduce((s, i) => s + i.precoUnitario * i.quantidade, 0)

export const totalComanda = (c: Comanda) => arred(somaItens(c.itens))

function ajustarEstoque(estoque: ItemEstoque[], unidadeId: UnidadeId, produtoId: string, delta: number): ItemEstoque[] {
  const existe = estoque.some((e) => e.unidadeId === unidadeId && e.produtoId === produtoId)
  if (!existe) return [...estoque, { unidadeId, produtoId, quantidade: Math.max(0, delta), minimo: 0 }]
  return estoque.map((e) =>
    e.unidadeId === unidadeId && e.produtoId === produtoId
      ? { ...e, quantidade: arred(Math.max(0, e.quantidade + delta), 3) }
      : e,
  )
}

const mov = (m: Omit<Movimento, 'id' | 'em'>): Movimento => ({ ...m, id: novoId('mov'), em: agoraISO() })

// Só os dados (sem as funções) — é o que vai para o localStorage.
type Dados = Pick<DadosState,
  'historico' | 'estoque' | 'movimentos' | 'transferencias' | 'mesas' | 'comandas' | 'vendas' | 'fechamentos'
  | 'retiradas' | 'pedidos' | 'alertas' | 'notas' | 'proximoLacre' | 'proximoPedido'>

const estadoInicial = (): Dados => ({
  historico: historicoInicial,
  estoque: estoqueInicial,
  movimentos: movimentosIniciais,
  transferencias: transferenciasIniciais,
  mesas: mesasIniciais,
  comandas: comandasIniciais,
  vendas: vendasIniciais,
  fechamentos: [],
  retiradas: retiradasIniciais,
  pedidos: pedidosIniciais,
  alertas: alertasIniciais,
  notas: notasIniciais,
  proximoLacre: 4825,
  proximoPedido: proximoPedidoInicial,
})

// localStorage pode não existir ou falhar (aba anônima, cota cheia, bloqueado): nunca quebra a demo.
const CHAVE = 'catelan-demo'
const armazenamento: StateStorage = {
  getItem: (k) => { try { return localStorage.getItem(k) } catch { return null } },
  setItem: (k, v) => { try { localStorage.setItem(k, v) } catch { /* segue só em memória */ } },
  removeItem: (k) => { try { localStorage.removeItem(k) } catch { /* nada */ } },
}

export const useDados = create<DadosState>()(persist((set, get) => ({
  ...estadoInicial(),

  reiniciarDemo: () => {
    armazenamento.removeItem(CHAVE)
    set(estadoInicial())
  },

  conferirLacre: (lacre, kg, por, unidadeId) => {
    const alvo = lacre.trim().toUpperCase()
    const t = get().transferencias.find((x) => x.lacre === alvo && x.destinoId === unidadeId && x.status === 'em_transito')
    if (!t) return null
    const p = getProduto(t.produtoId)
    const diferenca = arred(kg - t.quantidadeEnviada, 3)
    const percentual = t.quantidadeEnviada ? Math.abs(diferenca) / t.quantidadeEnviada : 0
    const ok = percentual <= TOLERANCIA_DIVERGENCIA
    const valorEstimado = arred(Math.abs(diferenca) * p.custo)
    const agora = agoraISO()

    set((s) => {
      const alertas = ok ? s.alertas : [{
        id: novoId('alerta'), tipo: 'divergencia_lacre' as const, unidadeId,
        titulo: `Divergência no lacre ${t.lacre}`,
        detalhe: `${p.nome}: enviado ${formatKg(t.quantidadeEnviada)}, recebido ${formatKg(kg)} (tolerância ${Math.round(TOLERANCIA_DIVERGENCIA * 100)}%)`,
        quem: por, em: agora, valor: valorEstimado, lido: false,
      }, ...s.alertas]
      return {
        transferencias: s.transferencias.map((x) => x.id === t.id
          ? { ...x, status: ok ? 'conferido' : 'divergencia', quantidadeRecebida: kg, recebidoPor: por, recebidoEm: agora }
          : x),
        estoque: ajustarEstoque(s.estoque, unidadeId, t.produtoId, kg),
        movimentos: [mov({ unidadeId, produtoId: t.produtoId, tipo: 'recebimento_transferencia', quantidade: kg, feitoPor: por, referencia: t.lacre }), ...s.movimentos],
        alertas,
      }
    })

    return {
      ok, lacre: t.lacre, produtoNome: p.nome, enviado: t.quantidadeEnviada, recebido: kg,
      diferenca, percentual, valorEstimado, tolerancia: TOLERANCIA_DIVERGENCIA,
    }
  },

  enviarTransferencia: ({ destinoId, produtoId, quantidade, volumes, lacre, por }) => {
    const t: Transferencia = {
      id: novoId('transf'), lacre: lacre.trim().toUpperCase(), origemId: 'central', destinoId, produtoId,
      quantidadeEnviada: quantidade, volumes, enviadoPor: por, enviadoEm: agoraISO(), status: 'em_transito',
    }
    set((s) => ({
      transferencias: [t, ...s.transferencias],
      estoque: ajustarEstoque(s.estoque, 'central', produtoId, -quantidade),
      movimentos: [mov({ unidadeId: 'central', produtoId, tipo: 'envio_transferencia', quantidade: -quantidade, feitoPor: por, referencia: t.lacre }), ...s.movimentos],
      proximoLacre: s.proximoLacre + 1,
    }))
    return t
  },

  lancarNota: ({ fornecedorId, numero, data, itens, por }) => {
    const nota: NotaEntrada = {
      id: novoId('nota'), fornecedorId, numero, data, itens,
      total: arred(itens.reduce((s, i) => s + i.quantidade * i.custoUnitario, 0)),
      lancadaPor: por, lancadaEm: agoraISO(),
    }
    set((s) => {
      let estoque = s.estoque
      const movs: Movimento[] = []
      for (const i of itens) {
        estoque = ajustarEstoque(estoque, 'central', i.produtoId, i.quantidade)
        movs.push(mov({ unidadeId: 'central', produtoId: i.produtoId, tipo: 'entrada_nota', quantidade: i.quantidade, feitoPor: por, referencia: `NF ${numero}` }))
      }
      return { notas: [nota, ...s.notas], estoque, movimentos: [...movs, ...s.movimentos] }
    })
    return nota
  },

  abrirMesa: (unidadeId, numero, adultos, criancas, garcom) => {
    const agora = agoraISO()
    const itens: ItemComanda[] = []
    const add = (cardapioId: string, q: number) => {
      if (q <= 0) return
      const c = getCardapio(cardapioId)
      itens.push({ id: novoId('ic'), cardapioId, nome: c.nome, categoria: c.categoria, quantidade: q, precoUnitario: c.preco, lancadoPor: garcom, lancadoEm: agora })
    }
    if (getUnidade(unidadeId).tipo === 'rodizio') {
      add('rod-adulto', adultos)
      add('rod-crianca', criancas)
    }
    const comanda: Comanda = {
      id: novoId('cmd'), unidadeId, mesa: numero, pessoas: adultos + criancas, abertaPor: garcom, abertaEm: agora, status: 'aberta', itens,
    }
    set((s) => ({
      comandas: [...s.comandas, comanda],
      mesas: s.mesas.map((m) => m.unidadeId === unidadeId && m.numero === numero ? { ...m, status: 'ocupada', comandaId: comanda.id } : m),
    }))
    return comanda
  },

  lancarItem: (comandaId, cardapioId, garcom) => {
    const c = getCardapio(cardapioId)
    set((s) => ({
      comandas: s.comandas.map((cmd) => cmd.id !== comandaId ? cmd : {
        ...cmd,
        itens: [...cmd.itens, { id: novoId('ic'), cardapioId, nome: c.nome, categoria: c.categoria, quantidade: 1, precoUnitario: c.preco, lancadoPor: garcom, lancadoEm: agoraISO() }],
      }),
    }))
  },

  // Botão "-": nunca apaga. Cancela 1 unidade do lançamento mais recente, deixando o registro riscado.
  removerUm: (comandaId, cardapioId, garcom) => {
    set((s) => ({
      comandas: s.comandas.map((cmd) => {
        if (cmd.id !== comandaId) return cmd
        const idx = [...cmd.itens].reverse().findIndex((i) => i.cardapioId === cardapioId && !i.cancelado)
        if (idx < 0) return cmd
        const real = cmd.itens.length - 1 - idx
        const alvo = cmd.itens[real]!
        const cancelado = { por: garcom, em: agoraISO() }
        let itens: ItemComanda[]
        if (alvo.quantidade > 1) {
          itens = [...cmd.itens]
          itens[real] = { ...alvo, quantidade: alvo.quantidade - 1 }
          itens.push({ ...alvo, id: novoId('ic'), quantidade: 1, cancelado })
        } else {
          itens = cmd.itens.map((i, k) => (k === real ? { ...i, cancelado } : i))
        }
        return { ...cmd, itens }
      }),
    }))
  },

  cancelarItem: (comandaId, itemId, por) => {
    set((s) => ({
      comandas: s.comandas.map((cmd) => cmd.id !== comandaId ? cmd : {
        ...cmd, itens: cmd.itens.map((i) => i.id === itemId && !i.cancelado ? { ...i, cancelado: { por, em: agoraISO() } } : i),
      }),
    }))
  },

  pedirConta: (comandaId) => {
    set((s) => {
      const cmd = s.comandas.find((c) => c.id === comandaId)
      if (!cmd) return {}
      return {
        comandas: s.comandas.map((c) => c.id === comandaId ? { ...c, status: 'conta' } : c),
        mesas: s.mesas.map((m) => m.unidadeId === cmd.unidadeId && m.numero === cmd.mesa ? { ...m, status: 'conta' } : m),
      }
    })
  },

  reabrirComanda: (comandaId) => {
    set((s) => {
      const cmd = s.comandas.find((c) => c.id === comandaId)
      if (!cmd) return {}
      return {
        comandas: s.comandas.map((c) => c.id === comandaId ? { ...c, status: 'aberta' } : c),
        mesas: s.mesas.map((m) => m.unidadeId === cmd.unidadeId && m.numero === cmd.mesa ? { ...m, status: 'ocupada' } : m),
      }
    })
  },

  finalizarConta: (comandaId, pagamentos, troco, por) => {
    const cmd = get().comandas.find((c) => c.id === comandaId)!
    const total = totalComanda(cmd)
    const venda: Venda = {
      id: novoId('venda'), unidadeId: cmd.unidadeId, origem: 'mesa', descricao: `Mesa ${cmd.mesa}`, total, pagamentos,
      troco, clientes: cmd.pessoas, feitaPor: por, em: agoraISO(), comandaId,
    }
    set((s) => {
      // baixa de estoque das bebidas vendidas
      let estoque = s.estoque
      const movs: Movimento[] = []
      for (const i of cmd.itens.filter((x) => !x.cancelado)) {
        const pid = getCardapio(i.cardapioId).produtoId
        if (!pid) continue
        estoque = ajustarEstoque(estoque, cmd.unidadeId, pid, -i.quantidade)
        movs.push(mov({ unidadeId: cmd.unidadeId, produtoId: pid, tipo: 'venda', quantidade: -i.quantidade, feitoPor: i.lancadoPor, referencia: `Mesa ${cmd.mesa}` }))
      }
      return {
        vendas: [...s.vendas, venda],
        estoque,
        movimentos: [...movs, ...s.movimentos],
        comandas: s.comandas.map((c) => c.id === comandaId ? { ...c, status: 'fechada', fechadaEm: venda.em } : c),
        mesas: s.mesas.map((m) => m.unidadeId === cmd.unidadeId && m.numero === cmd.mesa ? { ...m, status: 'livre', comandaId: undefined } : m),
      }
    })
    return venda
  },

  venderBalcao: (unidadeId, itens, pagamentos, troco, por) => {
    const total = arred(itens.reduce((s, i) => s + getCardapio(i.cardapioId).preco * i.quantidade, 0))
    const descricao = itens.map((i) => `${i.quantidade}x ${getCardapio(i.cardapioId).nome}`).join(', ')
    const venda: Venda = {
      id: novoId('venda'), unidadeId, origem: 'marmita', descricao, total, pagamentos, troco,
      clientes: itens.reduce((s, i) => s + i.quantidade, 0), feitaPor: por, em: agoraISO(),
    }
    set((s) => ({ vendas: [...s.vendas, venda] }))
    return venda
  },

  fecharCaixa: (unidadeId, dinheiroContado, por) => {
    const totais = totaisPorForma(get().vendas, unidadeId)
    const diferenca = arred(dinheiroContado - totais.dinheiro)
    const f: FechamentoCaixa = { id: novoId('caixa'), unidadeId, fechadoPor: por, em: agoraISO(), totais, dinheiroContado, diferenca }
    set((s) => ({
      fechamentos: [f, ...s.fechamentos],
      alertas: Math.abs(diferenca) >= 1 ? [{
        id: novoId('alerta'), tipo: 'diferenca_caixa' as const, unidadeId,
        titulo: diferenca < 0 ? 'Falta no fechamento de caixa' : 'Sobra no fechamento de caixa',
        detalhe: `Registrado ${formatBRL(totais.dinheiro)} em dinheiro, contado ${formatBRL(dinheiroContado)}`,
        quem: por, em: f.em, valor: Math.abs(diferenca), lido: false,
      }, ...s.alertas] : s.alertas,
    }))
    return f
  },

  registrarRetirada: (unidadeId, funcionarioId, funcionarioNome, produtoId, kg) => {
    const u = getUnidade(unidadeId)
    const em = agoraISO()
    // Janela permitida: 2h antes de abrir (preparo) até o fechamento.
    const [ah, am] = u.horarioAbertura.split(':').map(Number)
    const abrePreparo = `${String(Math.max(0, ah! - 2)).padStart(2, '0')}:${String(am).padStart(2, '0')}`
    const foraDoHorario = !dentroDoHorario(em, abrePreparo, u.horarioFechamento)
    const r: RetiradaFreezer = { id: novoId('ret'), unidadeId, funcionarioId, funcionarioNome, produtoId, quantidade: kg, em, foraDoHorario }
    const p = getProduto(produtoId)
    set((s) => ({
      retiradas: [r, ...s.retiradas],
      estoque: ajustarEstoque(s.estoque, unidadeId, produtoId, -kg),
      movimentos: [mov({ unidadeId, produtoId, tipo: 'retirada_freezer', quantidade: -kg, feitoPor: funcionarioNome }), ...s.movimentos],
      alertas: foraDoHorario ? [{
        id: novoId('alerta'), tipo: 'freezer_fora_horario' as const, unidadeId,
        titulo: 'Retirada do freezer fora do horário',
        detalhe: `${formatKg(kg)} de ${p.nome} retirados fora do horário de funcionamento`,
        quem: funcionarioNome, em, valor: arred(kg * p.custo), lido: false,
      }, ...s.alertas] : s.alertas,
    }))
    return r
  },

  fazerPedido: (d) => {
    const subtotal = arred(d.itens.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0))
    const taxaEntrega = bairros.find((b) => b.id === d.bairroId)?.taxa ?? 0
    const numero = get().proximoPedido
    const pedido: PedidoOnline = {
      ...d, id: novoId('ped'), numero, status: 'recebido', em: agoraISO(), subtotal, taxaEntrega, total: arred(subtotal + taxaEntrega),
    }
    const forma: FormaPagamento = d.formaPagamento === 'pix' ? 'pix' : d.formaPagamento === 'cartao' ? 'credito' : 'dinheiro'
    const venda: Venda = {
      id: novoId('venda'), unidadeId: d.unidadeId, origem: 'online', descricao: `Pedido online nº ${numero}`,
      total: pedido.total, pagamentos: [{ forma, valor: pedido.total }], clientes: 1, feitaPor: 'Site', em: pedido.em,
    }
    set((s) => ({ pedidos: [...s.pedidos, pedido], vendas: [...s.vendas, venda], proximoPedido: numero + 1 }))
    return pedido
  },

  avancarPedido: (id) => {
    const ordem: PedidoOnline['status'][] = ['recebido', 'preparo', 'saiu', 'entregue']
    set((s) => ({
      pedidos: s.pedidos.map((p) => p.id === id ? { ...p, status: ordem[Math.min(ordem.indexOf(p.status) + 1, ordem.length - 1)]! } : p),
    }))
  },

  marcarAlertaLido: (id) => set((s) => ({ alertas: s.alertas.map((a) => (a.id === id ? { ...a, lido: true } : a)) })),
}), {
  name: CHAVE,
  version: 1,
  storage: createJSONStorage(() => armazenamento),
  partialize: (s) => ({ ...pegarDados(s), diaRef: DIA_REF }),
  // Dados salvos de outro dia de operação são descartados: a demo recomeça com horários atuais.
  merge: (salvo, atual) => {
    const x = salvo as (Partial<Dados> & { diaRef?: string }) | undefined
    if (!x || x.diaRef !== DIA_REF) return atual
    const { diaRef, ...dados } = x
    void diaRef
    return { ...atual, ...dados }
  },
}))

function pegarDados(s: DadosState): Dados {
  const { historico, estoque, movimentos, transferencias, mesas, comandas, vendas, fechamentos, retiradas, pedidos, alertas, notas, proximoLacre, proximoPedido } = s
  return { historico, estoque, movimentos, transferencias, mesas, comandas, vendas, fechamentos, retiradas, pedidos, alertas, notas, proximoLacre, proximoPedido }
}

export function totaisPorForma(vendas: Venda[], unidadeId: UnidadeId): Record<FormaPagamento, number> {
  const t: Record<FormaPagamento, number> = { pix: 0, credito: 0, debito: 0, dinheiro: 0 }
  for (const v of vendas) {
    if (v.unidadeId !== unidadeId || v.origem === 'online') continue
    if (!ehDiaOperacao(v.em)) continue
    // pagamento guarda o valor abatido da conta (o troco já fica de fora)
    for (const p of v.pagamentos) t[p.forma] += p.valor
  }
  for (const k of Object.keys(t) as FormaPagamento[]) t[k] = arred(t[k])
  return t
}
