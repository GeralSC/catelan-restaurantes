import { useMemo } from 'react'
import { useDados } from '../store/useDados'
import type { UnidadeId } from '../types'

/** Retiradas das últimas 24h da unidade (mais recentes primeiro). */
export function useRetiradas(unidadeId: UnidadeId) {
  const retiradas = useDados((s) => s.retiradas)
  return useMemo(() => {
    const limite = Date.now() - 24 * 3600_000
    return retiradas
      .filter((r) => r.unidadeId === unidadeId && new Date(r.em).getTime() >= limite)
      .sort((a, b) => b.em.localeCompare(a.em))
  }, [retiradas, unidadeId])
}

export const registrarRetirada = async (unidadeId: UnidadeId, funcionarioId: string, funcionarioNome: string, produtoId: string, kg: number) =>
  useDados.getState().registrarRetirada(unidadeId, funcionarioId, funcionarioNome, produtoId, kg)
