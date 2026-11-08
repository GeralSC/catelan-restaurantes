import { create } from 'zustand'
import type { UnidadeId } from '../types'

export type TipoToast = 'sucesso' | 'erro' | 'alerta' | 'info'

export interface Toast {
  id: number
  tipo: TipoToast
  titulo: string
  texto?: string
}

interface UIState {
  toasts: Toast[]
  unidadeRecebimento: UnidadeId
  unidadeFreezer: UnidadeId
  unidadeCaixa: UnidadeId
  unidadeGarcom: UnidadeId
  garcomAtual: string
  filtroPainel: UnidadeId | 'todas'
  toast: (t: Omit<Toast, 'id'>) => void
  fecharToast: (id: number) => void
  set: (p: Partial<Omit<UIState, 'toast' | 'fecharToast' | 'set' | 'toasts'>>) => void
}

let n = 0

export const useUI = create<UIState>((set) => ({
  toasts: [],
  unidadeRecebimento: 'gado-nobre',
  unidadeFreezer: 'gado-nobre',
  unidadeCaixa: 'gado-nobre',
  unidadeGarcom: 'gado-nobre',
  garcomAtual: 'Renan',
  filtroPainel: 'todas',
  toast: (t) => {
    const id = ++n
    set((s) => ({ toasts: [...s.toasts.slice(-2), { ...t, id }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), t.tipo === 'alerta' || t.tipo === 'erro' ? 6000 : 3500)
  },
  fecharToast: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
  set: (p) => set(p),
}))

export const toast = (t: Omit<Toast, 'id'>) => useUI.getState().toast(t)
