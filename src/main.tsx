import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import './index.css'
import { Toaster } from './components/Toaster'
import Inicio from './pages/Inicio'

const Recebimento = lazy(() => import('./pages/recebimento/Recebimento'))
const Painel = lazy(() => import('./pages/painel/Painel'))
const ModoTV = lazy(() => import('./pages/painel/ModoTV'))
const Garcom = lazy(() => import('./pages/garcom/Garcom'))
const Caixa = lazy(() => import('./pages/caixa/Caixa'))
const Freezer = lazy(() => import('./pages/freezer/Freezer'))
const Central = lazy(() => import('./pages/central/Central'))
const PedidoOnline = lazy(() => import('./pages/pedido/PedidoOnline'))

function RolarParaTopo() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return null
}

function Carregando() {
  return (
    <div className="min-h-dvh grid place-items-center">
      <span className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <RolarParaTopo />
      <Toaster />
      <Suspense fallback={<Carregando />}>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/recebimento" element={<Recebimento />} />
          <Route path="/painel" element={<Painel />} />
          <Route path="/painel/tv" element={<ModoTV />} />
          <Route path="/garcom" element={<Garcom />} />
          <Route path="/caixa" element={<Caixa />} />
          <Route path="/freezer" element={<Freezer />} />
          <Route path="/central" element={<Central />} />
          <Route path="/pedido/:unidade" element={<PedidoOnline />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
)
