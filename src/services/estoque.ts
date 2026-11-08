import { useMemo } from 'react'
import { useDados } from '../store/useDados'
import { getProduto } from '../data/cadastros'
import type { ItemNota, UnidadeId } from '../types'

export function useEstoque(unidadeId: UnidadeId) {
  const estoque = useDados((s) => s.estoque)
  return useMemo(
    () => estoque.filter((e) => e.unidadeId === unidadeId).map((e) => ({ ...e, produto: getProduto(e.produtoId) })),
    [estoque, unidadeId],
  )
}

/** Itens abaixo do mínimo (todas as unidades ou uma). */
export function useEstoqueCritico(unidadeId?: UnidadeId) {
  const estoque = useDados((s) => s.estoque)
  return useMemo(
    () =>
      estoque
        .filter((e) => (!unidadeId || e.unidadeId === unidadeId) && e.minimo > 0 && e.quantidade < e.minimo)
        .map((e) => ({ ...e, produto: getProduto(e.produtoId) }))
        .sort((a, b) => a.quantidade / a.minimo - b.quantidade / b.minimo),
    [estoque, unidadeId],
  )
}

export function useNotas() {
  return useDados((s) => s.notas)
}

export async function lancarNota(d: { fornecedorId: string; numero: string; data: string; itens: ItemNota[]; por: string }) {
  return useDados.getState().lancarNota(d)
}

export function useMovimentos(unidadeId?: UnidadeId) {
  const movs = useDados((s) => s.movimentos)
  return useMemo(() => (unidadeId ? movs.filter((m) => m.unidadeId === unidadeId) : movs), [movs, unidadeId])
}
