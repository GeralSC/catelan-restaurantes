import { Banknote, ChefHat, ClipboardCheck, LayoutDashboard, Refrigerator, ShoppingBag, Warehouse, type LucideIcon } from 'lucide-react'
import type { Perfil } from '../types'

export interface InfoPerfil {
  id: Perfil
  nome: string
  rota: string
  descricao: string
  quem: string
  icone: LucideIcon
  cor: string
}

export const perfis: InfoPerfil[] = [
  { id: 'dona', nome: 'Dona', quem: 'Maryellen', rota: '/painel', descricao: 'Vê todas as unidades', icone: LayoutDashboard, cor: '#B91C1C' },
  { id: 'central', nome: 'Central', quem: 'Brusque', rota: '/central', descricao: 'Entrada e envio de mercadoria', icone: Warehouse, cor: '#475569' },
  { id: 'recebimento', nome: 'Recebimento', quem: 'Unidades', rota: '/recebimento', descricao: 'Confere mercadoria que chegou', icone: ClipboardCheck, cor: '#0F766E' },
  { id: 'freezer', nome: 'Freezer', quem: 'Tablet da cozinha', rota: '/freezer', descricao: 'Registra retirada de carne', icone: Refrigerator, cor: '#0369A1' },
  { id: 'garcom', nome: 'Garçom', quem: 'Celular da empresa', rota: '/garcom', descricao: 'Mesas e comandas', icone: ChefHat, cor: '#C2410C' },
  { id: 'caixa', nome: 'Caixa', quem: 'Balcão', rota: '/caixa', descricao: 'Fecha contas e caixa', icone: Banknote, cor: '#15803D' },
  { id: 'cliente', nome: 'Cliente', quem: 'Pedido online', rota: '/pedido/beira-rio', descricao: 'Cardápio de entrega', icone: ShoppingBag, cor: '#A16207' },
]

export const getPerfil = (id: Perfil) => perfis.find((p) => p.id === id)!
