import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowLeftRight, Bike, Check, ChefHat, Clock, CupSoda, IceCreamCone, MapPin, Minus, Plus, ShoppingBag, Soup, UtensilsCrossed,
} from 'lucide-react'
import { Button } from '../../components/ui'
import { avancarPedido, fazerPedido, usePedido } from '../../services'
import { bairros, cardapio, getUnidade } from '../../data/cadastros'
import { toast } from '../../store/useUI'
import { formatBRL, parseNumero } from '../../lib/format'
import type { CategoriaCardapio, ItemCardapio, PedidoOnline as TPedido } from '../../types'

const categorias: Array<{ id: CategoriaCardapio; rotulo: string; icone: typeof Soup; fundo: string }> = [
  { id: 'marmitas', rotulo: 'Marmitas', icone: Soup, fundo: 'from-orange-100 to-amber-50 text-orange-700' },
  { id: 'executivos', rotulo: 'Pratos executivos', icone: UtensilsCrossed, fundo: 'from-rose-100 to-orange-50 text-rose-700' },
  { id: 'bebidas', rotulo: 'Bebidas', icone: CupSoda, fundo: 'from-sky-100 to-cyan-50 text-sky-700' },
  { id: 'sobremesas', rotulo: 'Sobremesas', icone: IceCreamCone, fundo: 'from-pink-100 to-fuchsia-50 text-pink-700' },
]
const bebidasDelivery = ['beb-coca-lata', 'beb-coca-2l', 'beb-guarana-2l', 'beb-agua', 'beb-suco']
const descricaoPadrao: Record<string, string> = {
  'beb-coca-lata': 'Lata 350ml gelada', 'beb-coca-2l': 'Garrafa 2 litros', 'beb-guarana-2l': 'Garrafa 2 litros',
  'beb-agua': 'Garrafa 500ml', 'beb-suco': 'Laranja espremida na hora · 500ml',
  'sob-pudim': 'Fatia generosa, calda de caramelo', 'sob-petit': 'Com sorvete de creme', 'sob-abacaxi': 'Grelhado com canela e açúcar', 'sob-mousse': 'Pote 200ml',
}

type Etapa = 'cardapio' | 'checkout' | 'confirmado'

export default function PedidoOnline() {
  const { unidade } = useParams()
  if (unidade !== 'beira-rio') return <Navigate to="/pedido/beira-rio" replace />
  return <Loja />
}

function Loja() {
  const un = getUnidade('beira-rio')
  const [etapa, setEtapa] = useState<Etapa>('cardapio')
  const [carrinho, setCarrinho] = useState<Record<string, number>>({})
  const [pedidoId, setPedidoId] = useState<string>()

  const itensLoja = useMemo(
    () => cardapio.filter((c) => ['marmitas', 'executivos', 'sobremesas'].includes(c.categoria) || bebidasDelivery.includes(c.id)),
    [],
  )
  const linhas = Object.entries(carrinho).filter(([, q]) => q > 0).map(([id, q]) => ({ item: itensLoja.find((c) => c.id === id)!, q }))
  const qtd = linhas.reduce((s, l) => s + l.q, 0)
  const subtotal = linhas.reduce((s, l) => s + l.q * l.item.preco, 0)
  const mudar = (id: string, d: number) => setCarrinho((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) + d) }))

  return (
    <div className="min-h-dvh bg-surface">
      {etapa === 'cardapio' && (
        <>
          <Cabecalho cor={un.cor} />
          <Cardapio itens={itensLoja} carrinho={carrinho} mudar={mudar} />
          {qtd > 0 && (
            <div className="fixed bottom-0 inset-x-0 z-30 px-4 pb-safe pt-2 bg-gradient-to-t from-surface via-surface/90 to-transparent">
              <button
                onClick={() => setEtapa('checkout')}
                className="mx-auto max-w-2xl w-full h-14 rounded-2xl text-white font-bold flex items-center gap-3 px-4 shadow-float active:scale-[.99] animate-slide-up"
                style={{ background: un.cor }}
              >
                <span className="relative">
                  <ShoppingBag size={22} />
                  <span className="num absolute -top-2 -right-2.5 h-5 min-w-5 px-1 rounded-full bg-white text-xs font-bold grid place-items-center" style={{ color: un.cor }}>{qtd}</span>
                </span>
                <span className="flex-1 text-left">Ver carrinho</span>
                <span className="num">{formatBRL(subtotal)}</span>
              </button>
            </div>
          )}
        </>
      )}
      {etapa === 'checkout' && (
        <Checkout
          linhas={linhas}
          subtotal={subtotal}
          mudar={mudar}
          onVoltar={() => setEtapa('cardapio')}
          onConfirmado={(p) => { setPedidoId(p.id); setCarrinho({}); setEtapa('confirmado') }}
        />
      )}
      {etapa === 'confirmado' && pedidoId && <Confirmado pedidoId={pedidoId} onNovo={() => setEtapa('cardapio')} />}
    </div>
  )
}

function Cabecalho({ cor }: { cor: string }) {
  return (
    <header className="relative text-white overflow-hidden" style={{ background: cor }}>
      <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 85% 20%, #fff 0, transparent 40%), radial-gradient(circle at 10% 100%, #000 0, transparent 50%)' }} />
      <div className="relative mx-auto max-w-2xl px-4 pt-4 pb-6">
        <div className="flex justify-end">
          <Link to="/" className="h-9 px-3 rounded-lg bg-white/15 text-sm font-semibold flex items-center gap-1.5 hover:bg-white/25">
            <ArrowLeftRight size={15} /> Trocar perfil
          </Link>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <span className="h-16 w-16 rounded-2xl bg-white grid place-items-center text-2xl font-extrabold shrink-0 shadow-lg" style={{ color: cor }}>BR</span>
          <div>
            <h1 className="text-2xl font-extrabold leading-tight">Beira Rio · Gaspar</h1>
            <p className="text-white/85 text-sm">Buffet, marmitas e pratos executivos</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 bg-white text-ink rounded-full px-3 py-1 font-semibold">
            <span className="h-2 w-2 rounded-full bg-success" /> Aberto
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1"><Clock size={14} /> Entrega 40-60 min</span>
          <span className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1"><Bike size={14} /> A partir de {formatBRL(5)}</span>
        </div>
      </div>
    </header>
  )
}

function Cardapio({ itens, carrinho, mudar }: { itens: ItemCardapio[]; carrinho: Record<string, number>; mudar: (id: string, d: number) => void }) {
  const refs = useRef<Record<string, HTMLElement | null>>({})
  const [ativa, setAtiva] = useState<CategoriaCardapio>('marmitas')
  const ir = (id: CategoriaCardapio) => {
    setAtiva(id)
    const el = refs.current[id]
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 64, behavior: 'smooth' })
  }
  return (
    <div className="pb-28">
      <nav className="sticky top-0 z-20 bg-surface/95 backdrop-blur border-b border-surface-line">
        <div className="mx-auto max-w-2xl px-4 py-2.5 flex gap-2 overflow-x-auto no-scrollbar">
          {categorias.map((c) => (
            <button
              key={c.id}
              onClick={() => ir(c.id)}
              className={`h-10 px-4 rounded-full text-sm font-semibold whitespace-nowrap border ${ativa === c.id ? 'bg-ink text-white border-ink' : 'bg-white border-surface-line text-ink-soft'}`}
            >
              {c.rotulo}
            </button>
          ))}
        </div>
      </nav>
      <div className="mx-auto max-w-2xl px-4 space-y-7 pt-5">
        {categorias.map((cat) => {
          const Ic = cat.icone
          return (
            <section key={cat.id} ref={(el) => { refs.current[cat.id] = el }}>
              <h2 className="text-lg font-extrabold mb-3">{cat.rotulo}</h2>
              <div className="space-y-3">
                {itens.filter((i) => i.categoria === cat.id).map((i) => {
                  const q = carrinho[i.id] ?? 0
                  return (
                    <div key={i.id} className="card p-3 flex gap-3">
                      <div className={`h-24 w-24 rounded-xl bg-gradient-to-br ${cat.fundo} grid place-items-center shrink-0`}>
                        <Ic size={36} strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <p className="font-bold leading-snug">{i.nome}</p>
                        <p className="text-sm text-muted leading-snug line-clamp-2">{i.descricao ?? descricaoPadrao[i.id] ?? ''}</p>
                        <div className="mt-auto pt-2 flex items-center justify-between">
                          <span className="num font-bold">{formatBRL(i.preco)}</span>
                          {q === 0 ? (
                            <button onClick={() => mudar(i.id, 1)} aria-label={`Adicionar ${i.nome}`} className="h-10 w-10 rounded-full bg-ink text-white grid place-items-center active:scale-95">
                              <Plus size={20} />
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 bg-muted-light rounded-full p-1">
                              <button onClick={() => mudar(i.id, -1)} aria-label="Tirar um" className="h-9 w-9 rounded-full bg-white grid place-items-center active:scale-95"><Minus size={18} /></button>
                              <span className="num w-6 text-center font-bold">{q}</span>
                              <button onClick={() => mudar(i.id, 1)} aria-label="Mais um" className="h-9 w-9 rounded-full bg-ink text-white grid place-items-center active:scale-95"><Plus size={18} /></button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function Checkout({ linhas, subtotal, mudar, onVoltar, onConfirmado }: {
  linhas: Array<{ item: ItemCardapio; q: number }>; subtotal: number; mudar: (id: string, d: number) => void; onVoltar: () => void; onConfirmado: (p: TPedido) => void
}) {
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [bairroId, setBairroId] = useState('')
  const [endereco, setEndereco] = useState('')
  const [pagamento, setPagamento] = useState<TPedido['formaPagamento']>('pix')
  const [trocoPara, setTrocoPara] = useState('')
  const [tentou, setTentou] = useState(false)

  const bairro = bairros.find((b) => b.id === bairroId)
  const taxa = bairro?.taxa ?? 0
  const total = subtotal + taxa
  const valido = nome.trim() && telefone.replace(/\D/g, '').length >= 10 && bairroId && endereco.trim() && linhas.length > 0

  useEffect(() => {
    if (linhas.length === 0) onVoltar()
  }, [linhas.length, onVoltar])

  const mascaraTel = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11)
    if (d.length <= 2) return d
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  }

  const enviar = async () => {
    setTentou(true)
    if (!valido) {
      toast({ tipo: 'erro', titulo: 'Faltam alguns dados', texto: 'Preencha nome, telefone, bairro e endereço.' })
      return
    }
    const p = await fazerPedido({
      unidadeId: 'beira-rio', cliente: nome.trim(), telefone, bairroId, endereco: endereco.trim(), formaPagamento: pagamento,
      trocoPara: pagamento === 'dinheiro' && trocoPara ? parseNumero(trocoPara) : undefined,
      itens: linhas.map((l) => ({ cardapioId: l.item.id, nome: l.item.nome, quantidade: l.q, precoUnitario: l.item.preco })),
    })
    onConfirmado(p)
  }

  const erro = (v: unknown) => tentou && !v ? 'border-danger ring-2 ring-danger/15' : ''

  return (
    <div className="pb-32 animate-fade-in">
      <header className="sticky top-0 z-20 bg-white border-b border-surface-line">
        <div className="mx-auto max-w-2xl px-4 h-14 flex items-center gap-2">
          <button onClick={onVoltar} aria-label="Voltar ao cardápio" className="h-10 w-10 -ml-2 rounded-xl grid place-items-center hover:bg-muted-light"><ArrowLeft size={22} /></button>
          <h1 className="font-bold text-lg">Seu pedido</h1>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-4 py-4 space-y-5">
        <div className="card divide-y divide-surface-line">
          {linhas.map(({ item, q }) => (
            <div key={item.id} className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold leading-snug">{item.nome}</p>
                <p className="num text-sm text-muted">{formatBRL(item.preco * q)}</p>
              </div>
              <div className="flex items-center gap-1 bg-muted-light rounded-full p-1">
                <button onClick={() => mudar(item.id, -1)} aria-label="Tirar um" className="h-9 w-9 rounded-full bg-white grid place-items-center"><Minus size={18} /></button>
                <span className="num w-6 text-center font-bold">{q}</span>
                <button onClick={() => mudar(item.id, 1)} aria-label="Mais um" className="h-9 w-9 rounded-full bg-ink text-white grid place-items-center"><Plus size={18} /></button>
              </div>
            </div>
          ))}
        </div>

        <section className="space-y-3">
          <h2 className="font-bold">Seus dados</h2>
          <input className={`input ${erro(nome.trim())}`} placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" />
          <input className={`input ${erro(telefone.replace(/\D/g, '').length >= 10)}`} placeholder="Telefone (WhatsApp)" inputMode="tel" value={telefone} onChange={(e) => setTelefone(mascaraTel(e.target.value))} autoComplete="tel" />
        </section>

        <section className="space-y-3">
          <h2 className="font-bold flex items-center gap-1.5"><MapPin size={18} /> Entrega</h2>
          <select className={`input ${erro(bairroId)}`} value={bairroId} onChange={(e) => setBairroId(e.target.value)}>
            <option value="">Escolha o bairro</option>
            {bairros.map((b) => <option key={b.id} value={b.id}>{b.nome} · taxa {formatBRL(b.taxa)}</option>)}
          </select>
          <input className={`input ${erro(endereco.trim())}`} placeholder="Rua, número e complemento" value={endereco} onChange={(e) => setEndereco(e.target.value)} autoComplete="street-address" />
          {bairro && <p className="text-sm text-success font-semibold num">Taxa de entrega para {bairro.nome}: {formatBRL(bairro.taxa)}</p>}
        </section>

        <section className="space-y-2">
          <h2 className="font-bold">Pagamento</h2>
          {([
            { id: 'pix', rotulo: 'Pix', sub: 'Chave enviada no WhatsApp após o pedido' },
            { id: 'cartao', rotulo: 'Cartão na entrega', sub: 'Crédito ou débito na maquininha' },
            { id: 'dinheiro', rotulo: 'Dinheiro', sub: 'Pague ao entregador' },
          ] as const).map((f) => (
            <label key={f.id} className={`card p-4 flex items-center gap-3 cursor-pointer ${pagamento === f.id ? 'ring-2 ring-ink border-ink' : ''}`}>
              <input type="radio" name="pag" className="h-5 w-5 accent-[#1C1917]" checked={pagamento === f.id} onChange={() => setPagamento(f.id)} />
              <span className="flex-1">
                <span className="block font-semibold">{f.rotulo}</span>
                <span className="block text-xs text-muted">{f.sub}</span>
              </span>
            </label>
          ))}
          {pagamento === 'dinheiro' && (
            <input className="input num" inputMode="decimal" placeholder="Troco para quanto? (ex.: 100)" value={trocoPara} onChange={(e) => setTrocoPara(e.target.value.replace(/[^\d,]/g, ''))} />
          )}
        </section>

        <section className="card p-4 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-muted">Subtotal</span><span className="num">{formatBRL(subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted">Taxa de entrega</span><span className="num">{bairro ? formatBRL(taxa) : 'escolha o bairro'}</span></div>
          <div className="flex justify-between text-lg font-extrabold pt-1.5 border-t border-surface-line"><span>Total</span><span className="num">{formatBRL(total)}</span></div>
          {pagamento === 'dinheiro' && trocoPara && parseNumero(trocoPara) > total && (
            <p className="text-success font-semibold num">Troco: {formatBRL(parseNumero(trocoPara) - total)}</p>
          )}
        </section>
      </div>

      <div className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-surface-line pb-safe">
        <div className="mx-auto max-w-2xl px-4 pt-3">
          <Button bloco tamanho="lg" onClick={enviar} style={{ background: getUnidade('beira-rio').cor }}>
            Fazer pedido · <span className="num">{formatBRL(total)}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

function Confirmado({ pedidoId, onNovo }: { pedidoId: string; onNovo: () => void }) {
  const pedido = usePedido(pedidoId)
  const status = pedido?.status

  // acompanhamento simulado: avança sozinho
  useEffect(() => {
    if (!status || status === 'saiu' || status === 'entregue') return
    const t = setTimeout(() => avancarPedido(pedidoId), status === 'recebido' ? 5000 : 9000)
    return () => clearTimeout(t)
  }, [status, pedidoId])

  if (!pedido) return null
  const passos = [
    { id: 'recebido', rotulo: 'Pedido recebido', sub: 'O restaurante já está vendo seu pedido', icone: Check },
    { id: 'preparo', rotulo: 'Em preparo', sub: 'Sua comida está sendo montada', icone: ChefHat },
    { id: 'saiu', rotulo: 'Saiu para entrega', sub: 'Chega em 20 a 30 minutos', icone: Bike },
  ]
  const idx = ['recebido', 'preparo', 'saiu', 'entregue'].indexOf(pedido.status)
  const bairro = bairros.find((b) => b.id === pedido.bairroId)

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 animate-fade-in">
      <div className="text-center">
        <span className="mx-auto h-20 w-20 rounded-full bg-success text-white grid place-items-center animate-pop"><Check size={44} strokeWidth={2.5} /></span>
        <h1 className="text-2xl font-extrabold mt-4">Pedido recebido!</h1>
        <p className="text-muted">Nº <span className="num font-bold text-ink text-lg">{pedido.numero}</span></p>
      </div>

      <ol className="card p-5 mt-6 space-y-0">
        {passos.map((p, i) => {
          const feito = i <= idx
          const atual = i === idx
          const Ic = p.icone
          return (
            <li key={p.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className={`h-10 w-10 rounded-full grid place-items-center transition-colors duration-500 ${feito ? 'bg-success text-white' : 'bg-muted-light text-muted'} ${atual ? 'ring-4 ring-success/20' : ''}`}>
                  <Ic size={20} />
                </span>
                {i < passos.length - 1 && <span className={`w-0.5 flex-1 min-h-8 transition-colors duration-500 ${i < idx ? 'bg-success' : 'bg-surface-line'}`} />}
              </div>
              <div className="pb-6">
                <p className={`font-bold ${feito ? '' : 'text-muted'}`}>{p.rotulo}</p>
                <p className="text-sm text-muted">{p.sub}</p>
              </div>
            </li>
          )
        })}
      </ol>

      <div className="card p-4 mt-4 text-sm space-y-1">
        <p className="font-semibold">{pedido.cliente} · {pedido.telefone}</p>
        <p className="text-muted">{pedido.endereco} · {bairro?.nome}</p>
        <p className="text-muted">{pedido.itens.map((i) => `${i.quantidade}x ${i.nome}`).join(', ')}</p>
        <p className="num font-bold pt-1">Total {formatBRL(pedido.total)} <span className="font-normal text-muted">(entrega {formatBRL(pedido.taxaEntrega)})</span></p>
      </div>

      <Button bloco variante="secondary" className="mt-5" onClick={onNovo}>Fazer outro pedido</Button>
      <p className="text-center text-xs text-muted mt-3">No protótipo o acompanhamento avança sozinho. O pedido já aparece no painel da dona.</p>
    </div>
  )
}
