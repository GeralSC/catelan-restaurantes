import { useMemo } from 'react'
import { useDados } from '../store/useDados'
import type { ResultadoConferencia, Transferencia, TransferenciaCega, UnidadeId } from '../types'

const cegar = (t: Transferencia): TransferenciaCega => {
  const { quantidadeEnviada, quantidadeRecebida, ...cega } = t
  void quantidadeEnviada
  void quantidadeRecebida
  return cega
}

/** Para quem RECEBE: lista sem o peso enviado (peso cego). */
export function useTransferenciasAguardando(destinoId: UnidadeId): TransferenciaCega[] {
  const todas = useDados((s) => s.transferencias)
  return useMemo(
    () => todas.filter((t) => t.destinoId === destinoId && t.status === 'em_transito').map(cegar),
    [todas, destinoId],
  )
}

/** Busca um lacre destinado à unidade (sem peso). */
export function buscarLacre(lacre: string, destinoId: UnidadeId): TransferenciaCega | null {
  const alvo = lacre.trim().toUpperCase()
  const t = useDados.getState().transferencias.find((x) => x.lacre === alvo && x.destinoId === destinoId)
  return t ? cegar(t) : null
}

/** Para a Central e para a dona: visão completa. */
export function useTransferencias(): Transferencia[] {
  return useDados((s) => s.transferencias)
}

export async function registrarRecebimento(
  lacre: string, kgConferido: number, por: string, unidadeId: UnidadeId,
): Promise<ResultadoConferencia | null> {
  return useDados.getState().conferirLacre(lacre, kgConferido, por, unidadeId)
}

export async function enviarTransferencia(d: {
  destinoId: UnidadeId; produtoId: string; quantidade: number; volumes: number; lacre: string; por: string
}) {
  return useDados.getState().enviarTransferencia(d)
}

export function useProximoLacre() {
  const n = useDados((s) => s.proximoLacre)
  return `L-${String(n).padStart(6, '0')}`
}
