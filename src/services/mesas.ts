import { useMemo } from 'react'
import { useDados, totalComanda } from '../store/useDados'
import type { Pagamento, UnidadeId } from '../types'

export { totalComanda }

export function useMesas(unidadeId: UnidadeId) {
  const mesas = useDados((s) => s.mesas)
  const comandas = useDados((s) => s.comandas)
  return useMemo(
    () =>
      mesas
        .filter((m) => m.unidadeId === unidadeId)
        .map((m) => ({ ...m, comanda: m.comandaId ? comandas.find((c) => c.id === m.comandaId) : undefined })),
    [mesas, comandas, unidadeId],
  )
}

export function getMesas(unidadeId: UnidadeId) {
  return useDados.getState().mesas.filter((m) => m.unidadeId === unidadeId)
}

export function useComanda(comandaId?: string) {
  return useDados((s) => s.comandas.find((c) => c.id === comandaId))
}

export function useComandasPedindoConta(unidadeId: UnidadeId) {
  const comandas = useDados((s) => s.comandas)
  return useMemo(
    () => comandas.filter((c) => c.unidadeId === unidadeId && c.status === 'conta').sort((a, b) => a.mesa - b.mesa),
    [comandas, unidadeId],
  )
}

export function useComandasAbertas(unidadeId: UnidadeId) {
  const comandas = useDados((s) => s.comandas)
  return useMemo(
    () => comandas.filter((c) => c.unidadeId === unidadeId && c.status !== 'fechada').sort((a, b) => a.mesa - b.mesa),
    [comandas, unidadeId],
  )
}

export const abrirMesa = async (unidadeId: UnidadeId, numero: number, adultos: number, criancas: number, garcom: string) =>
  useDados.getState().abrirMesa(unidadeId, numero, adultos, criancas, garcom)
export const lancarItem = async (comandaId: string, cardapioId: string, garcom: string) =>
  useDados.getState().lancarItem(comandaId, cardapioId, garcom)
export const removerUm = async (comandaId: string, cardapioId: string, garcom: string) =>
  useDados.getState().removerUm(comandaId, cardapioId, garcom)
export const cancelarItem = async (comandaId: string, itemId: string, por: string) =>
  useDados.getState().cancelarItem(comandaId, itemId, por)
export const pedirConta = async (comandaId: string) => useDados.getState().pedirConta(comandaId)
export const reabrirComanda = async (comandaId: string) => useDados.getState().reabrirComanda(comandaId)
export const finalizarConta = async (comandaId: string, pagamentos: Pagamento[], troco: number, por: string) =>
  useDados.getState().finalizarConta(comandaId, pagamentos, troco, por)
