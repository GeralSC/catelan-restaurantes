import { useMemo, useState } from 'react'
import { ArrowLeft, Clock, History, Minus, Plus, Receipt, RotateCcw, Search, Undo2, UserRound, Users } from 'lucide-react'
import { Layout } from '../../components/Layout'
import { Abas, Badge, Button, Modal, Stepper } from '../../components/ui'
import {
  abrirMesa, cancelarItem, lancarItem, pedirConta, reabrirComanda, removerUm, totalComanda, useComanda, useMesas,
} from '../../services'
import { cardapio, funcionariosDa, getUnidade } from '../../data/cadastros'
import { useUI, toast } from '../../store/useUI'
import { formatBRL, formatHora } from '../../lib/format'
import type { CategoriaCardapio, Comanda, UnidadeId } from '../../types'

const garconsDa = (u: UnidadeId) => {
  const fs = funcionariosDa(u)
  const g = fs.filter((f) => /gar|atend/i.test(f.funcao))
  return (g.length ? g : fs).map((f) => f.nome)
}

export default function Garcom() {
  const unidadeId = useUI((s) => s.unidadeGarcom)
  const garcom = useUI((s) => s.garcomAtual)
  const setUI = useUI((s) => s.set)
  const mesas = useMesas(unidadeId)
  const un = getUnidade(unidadeId)

  const [comandaId, setComandaId] = useState<string>()
  const [abrindo, setAbrindo] = useState<number | null>(null)

  const trocarUnidade = (u: UnidadeId) => {
    setUI({ unidadeGarcom: u, garcomAtual: garconsDa(u)[0] ?? '' })
    setComandaId(undefined)
  }

  const contagem = useMemo(() => ({
    livre: mesas.filter((m) => m.status === 'livre').length,
    ocupada: mesas.filter((m) => m.status === 'ocupada').length,
    conta: mesas.filter((m) => m.status === 'conta').length,
  }), [mesas])

  if (comandaId) {
    return (
      <Layout perfil="garcom" unidadeId={unidadeId}>
        <TelaComanda comandaId={comandaId} garcom={garcom} rodizio={un.tipo === 'rodizio'} onVoltar={() => setComandaId(undefined)} />
      </Layout>
    )
  }

  return (
    <Layout perfil="garcom" unidadeId={unidadeId} onTrocarUnidade={trocarUnidade}>
      <div className="space-y-4">
        <label className="card px-4 h-14 flex items-center gap-3">
          <UserRound size={20} className="text-muted" />
          <span className="text-sm text-muted">Garçom</span>
          <select
            className="flex-1 bg-transparent font-bold outline-none h-full text-right"
            value={garcom}
            onChange={(e) => setUI({ garcomAtual: e.target.value })}
          >
            {garconsDa(unidadeId).map((n) => <option key={n}>{n}</option>)}
          </select>
        </label>

        <div className="grid grid-cols-3 gap-2 text-center">
          <Legenda cor="bg-white border border-surface-line" rotulo="Livres" n={contagem.livre} />
          <Legenda cor="bg-primary" rotulo="Ocupadas" n={contagem.ocupada} />
          <Legenda cor="bg-warning-strong" rotulo="Pedindo conta" n={contagem.conta} />
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
          {mesas.map((m) => {
            const total = m.comanda ? totalComanda(m.comanda) : 0
            const cls = m.status === 'livre'
              ? 'bg-white border border-surface-line text-ink-soft'
              : m.status === 'conta'
                ? 'bg-warning-strong text-ink shadow-sm'
                : 'bg-primary text-white shadow-sm'
            return (
              <button
                key={m.numero}
                onClick={() => (m.status === 'livre' ? setAbrindo(m.numero) : setComandaId(m.comandaId))}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition active:scale-95 ${cls}`}
                aria-label={`Mesa ${m.numero}, ${m.status === 'livre' ? 'livre' : m.status === 'conta' ? 'pedindo conta' : 'ocupada'}`}
              >
                <span className="num text-xl sm:text-2xl font-extrabold leading-none">{m.numero}</span>
                {m.comanda && (
                  <span className="num text-[10px] sm:text-xs font-semibold mt-1 opacity-90 leading-none">
                    {m.comanda.pessoas}p · {Math.round(total)}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <p className="text-xs text-muted text-center">Toque numa mesa livre para abrir. Toque numa mesa ocupada para lançar itens.</p>
      </div>

      <ModalAbrirMesa
        numero={abrindo}
        rodizio={un.tipo === 'rodizio'}
        onFechar={() => setAbrindo(null)}
        onAbrir={async (adultos, criancas) => {
          const c = await abrirMesa(unidadeId, abrindo!, adultos, criancas, garcom)
          toast({ tipo: 'sucesso', titulo: `Mesa ${abrindo} aberta`, texto: `${adultos + criancas} pessoas · aberta por ${garcom} às ${formatHora(c.abertaEm)}` })
          setAbrindo(null)
          setComandaId(c.id)
        }}
      />
    </Layout>
  )
}

function Legenda({ cor, rotulo, n }: { cor: string; rotulo: string; n: number }) {
  return (
    <div className="card py-2.5 px-2">
      <div className="flex items-center justify-center gap-1.5">
        <span className={`h-3 w-3 rounded ${cor}`} />
        <span className="num font-bold">{n}</span>
      </div>
      <p className="text-[11px] text-muted mt-0.5">{rotulo}</p>
    </div>
  )
}

function ModalAbrirMesa({ numero, rodizio, onFechar, onAbrir }: { numero: number | null; rodizio: boolean; onFechar: () => void; onAbrir: (a: number, c: number) => void }) {
  const [adultos, setAdultos] = useState(2)
  const [criancas, setCriancas] = useState(0)
  const fechar = () => { setAdultos(2); setCriancas(0); onFechar() }
  return (
    <Modal
      aberto={numero !== null}
      onFechar={fechar}
      titulo={`Abrir mesa ${numero ?? ''}`}
      rodape={
        <Button bloco tamanho="lg" disabled={adultos + criancas === 0} onClick={() => { onAbrir(adultos, criancas); setAdultos(2); setCriancas(0) }}>
          Abrir mesa
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-bold text-lg">{rodizio ? 'Adultos' : 'Pessoas'}</p>
            {rodizio && <p className="text-sm text-muted">Rodízio {formatBRL(89.9)}</p>}
          </div>
          <Stepper valor={adultos} onChange={setAdultos} grande max={30} />
        </div>
        {rodizio && (
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-lg">Crianças</p>
              <p className="text-sm text-muted">5 a 10 anos · {formatBRL(44.9)}</p>
            </div>
            <Stepper valor={criancas} onChange={setCriancas} grande max={20} />
          </div>
        )}
        <div className="rounded-xl bg-muted-light px-4 py-3 text-sm text-ink-soft">
          {rodizio ? (
            <>Já entram na comanda: <b>{adultos} rodízio{adultos === 1 ? '' : 's'} adulto</b>{criancas > 0 && <> e <b>{criancas} criança</b></>}. Dá para mudar depois.</>
          ) : (
            <>A mesa abre com {adultos + criancas} pessoa{adultos + criancas === 1 ? '' : 's'}. Os itens você lança em seguida.</>
          )}
        </div>
      </div>
    </Modal>
  )
}

function TelaComanda({ comandaId, garcom, rodizio, onVoltar }: { comandaId: string; garcom: string; rodizio: boolean; onVoltar: () => void }) {
  const comanda = useComanda(comandaId)
  const cats: Array<{ id: CategoriaCardapio; rotulo: string }> = rodizio
    ? [{ id: 'rodizio', rotulo: 'Rodízio' }, { id: 'bebidas', rotulo: 'Bebidas' }, { id: 'sobremesas', rotulo: 'Sobremesas' }]
    : [{ id: 'executivos', rotulo: 'Pratos' }, { id: 'bebidas', rotulo: 'Bebidas' }, { id: 'sobremesas', rotulo: 'Sobremesas' }]
  const [aba, setAba] = useState<CategoriaCardapio>(rodizio ? 'rodizio' : 'executivos')
  const [busca, setBusca] = useState('')
  const [historico, setHistorico] = useState(false)

  if (!comanda) return null
  if (comanda.status === 'fechada') {
    return (
      <div className="text-center py-16">
        <p className="font-bold text-lg">Mesa {comanda.mesa} já foi fechada no caixa.</p>
        <Button className="mt-4" onClick={onVoltar}>Voltar para as mesas</Button>
      </div>
    )
  }

  const total = totalComanda(comanda)
  const qtdAtiva = (cardapioId: string) =>
    comanda.itens.filter((i) => i.cardapioId === cardapioId && !i.cancelado).reduce((s, i) => s + i.quantidade, 0)
  const itensAba = cardapio
    .filter((c) => c.categoria === aba)
    .filter((c) => !busca || c.nome.toLowerCase().includes(busca.toLowerCase()))
  const lancados = comanda.itens.filter((i) => !i.cancelado).length

  return (
    <div className="pb-28 animate-fade-in">
      <div className="flex items-center gap-2 -mt-1">
        <button onClick={onVoltar} aria-label="Voltar para as mesas" className="h-11 w-11 -ml-2 rounded-xl grid place-items-center hover:bg-muted-light">
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold">Mesa {comanda.mesa}</h1>
            {comanda.status === 'conta' ? <Badge cor="amarelo">Pedindo conta</Badge> : <Badge cor="primary">Aberta</Badge>}
          </div>
          <p className="text-sm text-muted flex items-center gap-3">
            <span className="flex items-center gap-1"><Users size={14} /> {comanda.pessoas}</span>
            <span className="flex items-center gap-1"><Clock size={14} /> {formatHora(comanda.abertaEm)} por {comanda.abertaPor}</span>
          </p>
        </div>
        <button onClick={() => setHistorico(true)} className="h-11 px-3 rounded-xl border border-surface-line text-sm font-semibold flex items-center gap-1.5 bg-white">
          <History size={18} /> <span className="num">{comanda.itens.length}</span>
        </button>
      </div>

      <div className="mt-4"><Abas abas={cats} valor={aba} onChange={(v) => { setAba(v); setBusca('') }} /></div>

      {aba === 'bebidas' && (
        <div className="relative mt-3">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input pl-10" placeholder="Buscar bebida" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
      )}

      <div className="mt-3 card divide-y divide-surface-line">
        {itensAba.map((c) => {
          const q = qtdAtiva(c.id)
          return (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3 min-h-[68px]">
              <div className="flex-1 min-w-0">
                <p className="font-semibold leading-snug">{c.nome}</p>
                <p className="num text-sm text-muted">{formatBRL(c.preco)}</p>
              </div>
              <button
                aria-label={`Tirar 1 ${c.nome}`}
                disabled={q === 0}
                onClick={() => removerUm(comanda.id, c.id, garcom)}
                className="h-12 w-12 rounded-xl border border-surface-line grid place-items-center active:scale-95 disabled:opacity-25"
              >
                <Minus size={20} />
              </button>
              <span className={`num w-7 text-center text-lg font-bold ${q ? '' : 'text-muted/50'}`}>{q}</span>
              <button
                aria-label={`Lançar 1 ${c.nome}`}
                onClick={() => lancarItem(comanda.id, c.id, garcom)}
                className="h-12 w-12 rounded-xl bg-primary text-white grid place-items-center active:scale-95"
              >
                <Plus size={20} />
              </button>
            </div>
          )
        })}
        {itensAba.length === 0 && <p className="p-4 text-sm text-muted">Nada encontrado.</p>}
      </div>
      <p className="text-xs text-muted mt-3 text-center">
        Cada toque fica registrado com o nome de quem lançou e a hora. O botão de menos não apaga: o item fica riscado no histórico.
      </p>

      {/* Rodapé fixo */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-surface-line pb-safe">
        <div className="mx-auto max-w-3xl px-4 pt-3 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-muted">Total parcial · {lancados} lançamentos</p>
            <p className="num text-2xl font-extrabold">{formatBRL(total)}</p>
          </div>
          {comanda.status === 'aberta' ? (
            <Button
              tamanho="lg"
              className="bg-warning-strong text-ink hover:bg-warning-strong/90"
              onClick={async () => {
                await pedirConta(comanda.id)
                toast({ tipo: 'sucesso', titulo: `Mesa ${comanda.mesa} pediu a conta`, texto: 'Já apareceu no caixa.' })
                onVoltar()
              }}
            >
              <Receipt size={20} /> Pedir conta
            </Button>
          ) : (
            <Button tamanho="lg" variante="secondary" onClick={() => reabrirComanda(comanda.id)}>
              <RotateCcw size={18} /> Reabrir
            </Button>
          )}
        </div>
      </div>

      <ModalHistorico comanda={comanda} garcom={garcom} aberto={historico} onFechar={() => setHistorico(false)} />
    </div>
  )
}

function ModalHistorico({ comanda, garcom, aberto, onFechar }: { comanda: Comanda; garcom: string; aberto: boolean; onFechar: () => void }) {
  const itens = [...comanda.itens].sort((a, b) => b.lancadoEm.localeCompare(a.lancadoEm))
  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo={`Histórico · mesa ${comanda.mesa}`}>
      <p className="text-sm text-muted mb-3">Tudo o que foi lançado, por quem e quando. Nada é apagado.</p>
      <ul className="space-y-2">
        <li className="text-sm rounded-xl bg-muted-light px-3 py-2.5">
          Mesa aberta por <b>{comanda.abertaPor}</b> às {formatHora(comanda.abertaEm)} · {comanda.pessoas} pessoas
        </li>
        {itens.map((i) => (
          <li key={i.id} className={`rounded-xl border px-3 py-2.5 flex items-center gap-3 ${i.cancelado ? 'border-dashed border-surface-line bg-surface' : 'border-surface-line'}`}>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold ${i.cancelado ? 'line-through text-muted' : ''}`}>
                <span className="num">{i.quantidade}x</span> {i.nome}
              </p>
              <p className="text-xs text-muted">Lançado por {i.lancadoPor} às {formatHora(i.lancadoEm)}</p>
              {i.cancelado && <p className="text-xs font-semibold text-danger">Cancelado por {i.cancelado.por} às {formatHora(i.cancelado.em)}</p>}
            </div>
            <p className={`num text-sm font-bold shrink-0 ${i.cancelado ? 'line-through text-muted' : ''}`}>{formatBRL(i.precoUnitario * i.quantidade)}</p>
            {!i.cancelado && (
              <button
                onClick={() => {
                  cancelarItem(comanda.id, i.id, garcom)
                  toast({ tipo: 'info', titulo: 'Item cancelado', texto: `${i.nome} · cancelado por ${garcom}. Fica registrado no histórico.` })
                }}
                aria-label={`Cancelar ${i.nome}`}
                className="h-9 w-9 rounded-lg border border-surface-line grid place-items-center text-muted hover:text-danger shrink-0"
              >
                <Undo2 size={16} />
              </button>
            )}
          </li>
        ))}
      </ul>
    </Modal>
  )
}
