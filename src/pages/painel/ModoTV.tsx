import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertOctagon, Beef, Maximize, Minimize, ShoppingBag, Users, X } from 'lucide-react'
import { useAlertas, usePainel } from '../../services'
import { getUnidade } from '../../data/cadastros'
import { formatBRL, formatDataLonga, formatInt, formatKg, formatQuando } from '../../lib/format'

/** Painel para o telão: fundo escuro, letras grandes, atualiza a cada 10s. */
export default function ModoTV() {
  const nav = useNavigate()
  const { porUnidade, pedidosOnlineHoje } = usePainel()
  const alertas = useAlertas().filter((a) => !a.lido)
  const [agora, setAgora] = useState(new Date())
  const [extra, setExtra] = useState<Record<string, { valor: number; clientes: number }>>({})
  const [piscar, setPiscar] = useState(false)
  const [telaCheia, setTelaCheia] = useState(false)

  // relógio
  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // variações simuladas a cada 10s (vendas chegando)
  useEffect(() => {
    const t = setInterval(() => {
      setExtra((e) => {
        const n = { ...e }
        for (const u of porUnidade) {
          if (Math.random() < 0.35) continue
          const ticket = u.ticket || 40
          const pessoas = 1 + Math.floor(Math.random() * 3)
          const atual = n[u.unidadeId] ?? { valor: 0, clientes: 0 }
          n[u.unidadeId] = { valor: atual.valor + ticket * pessoas * (0.8 + Math.random() * 0.4), clientes: atual.clientes + pessoas }
        }
        return n
      })
      setPiscar(true)
      setTimeout(() => setPiscar(false), 900)
    }, 10_000)
    return () => clearInterval(t)
  }, [porUnidade])

  useEffect(() => {
    const f = () => setTelaCheia(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', f)
    return () => document.removeEventListener('fullscreenchange', f)
  }, [])

  const linhas = useMemo(
    () => porUnidade.map((u) => ({ ...u, faturamento: u.faturamento + (extra[u.unidadeId]?.valor ?? 0), clientes: u.clientes + (extra[u.unidadeId]?.clientes ?? 0) })),
    [porUnidade, extra],
  )
  const total = linhas.reduce((s, u) => s + u.faturamento, 0)
  const clientes = linhas.reduce((s, u) => s + u.clientes, 0)
  const kg = linhas.reduce((s, u) => s + u.carneKg, 0)

  const alternarTelaCheia = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
    } catch {
      /* navegador sem suporte (ex.: iPhone): segue normal */
    }
  }

  return (
    <div className="min-h-dvh bg-[#0C0A09] text-white p-4 sm:p-8 flex flex-col gap-5 sm:gap-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-white/50 text-sm sm:text-lg">{formatDataLonga(agora)}</p>
          <p className="num text-4xl sm:text-6xl font-extrabold tracking-tight">{agora.toLocaleTimeString('pt-BR')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={alternarTelaCheia} aria-label="Tela cheia" className="h-12 w-12 rounded-xl bg-white/10 hover:bg-white/20 grid place-items-center">
            {telaCheia ? <Minimize size={22} /> : <Maximize size={22} />}
          </button>
          <button
            onClick={() => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); nav('/painel') }}
            aria-label="Sair do modo TV"
            className="h-12 px-4 rounded-xl bg-white/10 hover:bg-white/20 flex items-center gap-2 font-semibold"
          >
            <X size={20} /> <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      <section>
        <p className="text-white/60 text-lg sm:text-2xl flex items-center gap-3">
          Faturamento de hoje · todas as unidades
          <span className={`h-3 w-3 rounded-full bg-green-400 transition ${piscar ? 'scale-150 opacity-100' : 'opacity-60'}`} />
        </p>
        <p className={`num text-6xl sm:text-8xl lg:text-9xl font-extrabold tracking-tighter transition-colors duration-700 ${piscar ? 'text-green-300' : ''}`}>
          {formatBRL(total)}
        </p>
        <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-white/70 text-lg sm:text-2xl">
          <span className="flex items-center gap-2"><Users className="text-white/40" /> <b className="num text-white">{formatInt(clientes)}</b> clientes</span>
          <span className="flex items-center gap-2"><Beef className="text-white/40" /> <b className="num text-white">{formatKg(kg)}</b> de carne</span>
          <span className="flex items-center gap-2"><ShoppingBag className="text-white/40" /> <b className="num text-white">{pedidosOnlineHoje}</b> pedidos online</span>
        </div>
      </section>

      <section className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-4 flex-1">
        {linhas.map((u) => {
          const un = getUnidade(u.unidadeId)
          return (
            <div key={u.unidadeId} className="rounded-3xl bg-white/[.06] border border-white/10 p-5 sm:p-6 flex flex-col relative overflow-hidden">
              <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: un.cor }} />
              <p className="text-xl sm:text-2xl font-bold">{un.nome}</p>
              <p className="text-white/50">{un.cidade}</p>
              <p className="num text-4xl sm:text-5xl font-extrabold mt-auto pt-6 tracking-tight">{formatBRL(u.faturamento)}</p>
              <div className="mt-3 flex justify-between text-white/60 text-base sm:text-lg">
                <span><b className="num text-white">{formatInt(u.clientes)}</b> clientes</span>
                <span><b className="num text-white">{formatBRL(u.rsPorKg)}</b>/kg</span>
              </div>
            </div>
          )
        })}
      </section>

      {alertas.length > 0 && (
        <section className="rounded-3xl bg-danger p-4 sm:p-6 flex items-center gap-4 overflow-hidden">
          <AlertOctagon size={40} className="shrink-0 animate-flash" />
          <div className="min-w-0">
            <p className="text-xl sm:text-3xl font-extrabold">{alertas.length} {alertas.length === 1 ? 'alerta' : 'alertas'} sem resposta</p>
            <p className="text-white/85 text-base sm:text-xl truncate">
              {alertas[0]!.titulo} · {getUnidade(alertas[0]!.unidadeId).nome} · {alertas[0]!.quem} · {formatQuando(alertas[0]!.em)} · {formatBRL(alertas[0]!.valor)}
            </p>
          </div>
        </section>
      )}

      <p className="text-center text-white/30 text-sm">Atualiza sozinho a cada 10 segundos</p>
    </div>
  )
}
