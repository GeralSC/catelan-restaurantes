import { useMemo } from 'react'
import { useDados } from '../store/useDados'
import { getProduto, unidadesRestaurante } from '../data/cadastros'
import type { UnidadeId } from '../types'
import { dataRef, ehDiaOperacao as ehHoje, fracaoExpediente, rotuloDiaRef } from '../lib/referencia'

export interface ResumoUnidade {
  unidadeId: UnidadeId
  faturamento: number
  clientes: number
  vendas: number
  ticket: number
  carneKg: number
  rsPorKg: number
  semanaPassada: number
  aberta: boolean
}

export function usePainel() {
  const vendas = useDados((s) => s.vendas)
  const retiradas = useDados((s) => s.retiradas)
  const historico = useDados((s) => s.historico)
  const pedidos = useDados((s) => s.pedidos)

  return useMemo(() => {
    const agora = new Date()
    const min = agora.getHours() * 60 + agora.getMinutes()
    const porUnidade: ResumoUnidade[] = unidadesRestaurante.map((u) => {
      const vs = vendas.filter((v) => v.unidadeId === u.id && ehHoje(v.em))
      const faturamento = vs.reduce((s, v) => s + v.total, 0)
      const clientes = vs.reduce((s, v) => s + v.clientes, 0)
      const carneKg = retiradas
        .filter((r) => r.unidadeId === u.id && ehHoje(r.em) && getProduto(r.produtoId).categoria === 'carne')
        .reduce((s, r) => s + r.quantidade, 0)
      // semana passada no MESMO ponto do expediente (comparação justa durante o dia)
      const semanaPassada = (historico.find((h) => h.unidadeId === u.id && h.data === dataRef(7))?.valor ?? 0)
        * fracaoExpediente(u.horarioAbertura, u.horarioFechamento)
      const [ah, am] = u.horarioAbertura.split(':').map(Number)
      const [fh, fm] = u.horarioFechamento.split(':').map(Number)
      return {
        unidadeId: u.id,
        faturamento,
        clientes,
        vendas: vs.length,
        ticket: clientes ? faturamento / clientes : 0,
        carneKg,
        rsPorKg: carneKg ? faturamento / carneKg : 0,
        semanaPassada,
        aberta: min >= ah! * 60 + am! && min <= fh! * 60 + fm!,
      }
    })

    // últimos 7 dias (6 de histórico + hoje)
    const grafico = [6, 5, 4, 3, 2, 1, 0].map((d) => {
      const data = dataRef(d)
      const linha: Record<string, string | number> = {
        dia: d === 0 ? rotuloDiaRef : new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      }
      for (const u of unidadesRestaurante) {
        linha[u.id] = d === 0
          ? Math.round(porUnidade.find((p) => p.unidadeId === u.id)!.faturamento)
          : Math.round(historico.find((h) => h.unidadeId === u.id && h.data === data)?.valor ?? 0)
      }
      return linha
    })

    const pedidosHoje = pedidos.filter((p) => ehHoje(p.em))
    return {
      porUnidade,
      grafico,
      pedidosOnlineHoje: pedidosHoje.length,
      faturamentoOnlineHoje: pedidosHoje.reduce((s, p) => s + p.total, 0),
      ultimosPedidos: [...pedidosHoje].sort((a, b) => b.em.localeCompare(a.em)).slice(0, 4),
    }
  }, [vendas, retiradas, historico, pedidos])
}

export function useAlertas() {
  const alertas = useDados((s) => s.alertas)
  return useMemo(() => [...alertas].sort((a, b) => b.em.localeCompare(a.em)), [alertas])
}

export const marcarAlertaLido = async (id: string) => useDados.getState().marcarAlertaLido(id)

/** Apaga tudo o que foi feito na demonstração e volta aos dados iniciais. */
export const reiniciarDemonstracao = async () => useDados.getState().reiniciarDemo()
