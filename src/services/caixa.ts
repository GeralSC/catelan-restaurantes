import { useMemo } from 'react'
import { useDados, totaisPorForma } from '../store/useDados'
import type { Pagamento, UnidadeId } from '../types'

import { ehDiaOperacao as ehHoje } from '../lib/referencia'

export function useVendasHoje(unidadeId?: UnidadeId) {
  const vendas = useDados((s) => s.vendas)
  return useMemo(() => vendas.filter((v) => ehHoje(v.em) && (!unidadeId || v.unidadeId === unidadeId)), [vendas, unidadeId])
}

export function useResumoCaixa(unidadeId: UnidadeId) {
  const vendas = useDados((s) => s.vendas)
  const fechamentos = useDados((s) => s.fechamentos)
  return useMemo(() => {
    const doCaixa = vendas.filter((v) => v.unidadeId === unidadeId && v.origem !== 'online' && ehHoje(v.em))
    const totais = totaisPorForma(vendas, unidadeId)
    const total = Object.values(totais).reduce((a, b) => a + b, 0)
    return {
      totais,
      total,
      qtd: doCaixa.length,
      ticket: doCaixa.length ? total / doCaixa.length : 0,
      fechamento: fechamentos.find((f) => f.unidadeId === unidadeId && ehHoje(f.em)),
    }
  }, [vendas, fechamentos, unidadeId])
}

export const venderBalcao = async (
  unidadeId: UnidadeId, itens: Array<{ cardapioId: string; quantidade: number }>, pagamentos: Pagamento[], troco: number, por: string,
) => useDados.getState().venderBalcao(unidadeId, itens, pagamentos, troco, por)

export const fecharCaixa = async (unidadeId: UnidadeId, dinheiroContado: number, por: string) =>
  useDados.getState().fecharCaixa(unidadeId, dinheiroContado, por)
