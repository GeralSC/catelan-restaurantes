import { useDados } from '../store/useDados'
import type { PedidoOnline } from '../types'

export function usePedido(id?: string) {
  return useDados((s) => s.pedidos.find((p) => p.id === id))
}

export function usePedidos() {
  return useDados((s) => s.pedidos)
}

export const fazerPedido = async (d: Omit<PedidoOnline, 'id' | 'numero' | 'status' | 'em' | 'subtotal' | 'taxaEntrega' | 'total'>) =>
  useDados.getState().fazerPedido(d)

export const avancarPedido = async (id: string) => useDados.getState().avancarPedido(id)
