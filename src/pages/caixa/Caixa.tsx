import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Banknote, CheckCircle2, CreditCard, Lock, Plus, QrCode, Receipt, Search, Trash2, Wallet } from 'lucide-react'
import { Layout } from '../../components/Layout'
import { Abas, Badge, Button, Card, Secao, Stepper, Vazio } from '../../components/ui'
import {
  fecharCaixa, finalizarConta, totalComanda, useComanda, useComandasAbertas, useComandasPedindoConta, useResumoCaixa,
  useVendasHoje, venderBalcao,
} from '../../services'
import { cardapio, funcionariosDa, getCardapio } from '../../data/cadastros'
import { useUI, toast } from '../../store/useUI'
import { arred, formatBRL, formatHora, parseNumero } from '../../lib/format'
import type { FormaPagamento, Pagamento, UnidadeId } from '../../types'

export const formas: Array<{ id: FormaPagamento; rotulo: string; icone: typeof QrCode }> = [
  { id: 'pix', rotulo: 'Pix', icone: QrCode },
  { id: 'credito', rotulo: 'Crédito', icone: CreditCard },
  { id: 'debito', rotulo: 'Débito', icone: Wallet },
  { id: 'dinheiro', rotulo: 'Dinheiro', icone: Banknote },
]
const rotuloForma = (f: FormaPagamento) => formas.find((x) => x.id === f)!.rotulo

const caixaDa = (u: UnidadeId) => {
  const fs = funcionariosDa(u)
  return (fs.find((f) => /caixa/i.test(f.funcao)) ?? fs[0])?.nome ?? 'Caixa'
}

type Aba = 'mesas' | 'marmitas' | 'fechamento'

export default function Caixa() {
  const unidadeId = useUI((s) => s.unidadeCaixa)
  const setUI = useUI((s) => s.set)
  const [aba, setAba] = useState<Aba>('mesas')
  const [comandaId, setComandaId] = useState<string>()
  const pedindo = useComandasPedindoConta(unidadeId)
  const operador = caixaDa(unidadeId)

  return (
    <Layout
      perfil="caixa"
      unidadeId={unidadeId}
      onTrocarUnidade={comandaId ? undefined : (u) => { setUI({ unidadeCaixa: u }); setComandaId(undefined) }}
    >
      {comandaId ? (
        <FecharConta comandaId={comandaId} operador={operador} onVoltar={() => setComandaId(undefined)} />
      ) : (
        <div className="space-y-4">
          <Abas<Aba>
            abas={[
              { id: 'mesas', rotulo: 'Mesas', contador: pedindo.length },
              { id: 'marmitas', rotulo: 'Marmitas balcão' },
              { id: 'fechamento', rotulo: 'Fechamento' },
            ]}
            valor={aba}
            onChange={setAba}
          />
          {aba === 'mesas' && <ListaMesas unidadeId={unidadeId} onAbrir={setComandaId} />}
          {aba === 'marmitas' && <Marmitas unidadeId={unidadeId} operador={operador} />}
          {aba === 'fechamento' && <Fechamento unidadeId={unidadeId} operador={operador} />}
        </div>
      )}
    </Layout>
  )
}

function ListaMesas({ unidadeId, onAbrir }: { unidadeId: UnidadeId; onAbrir: (id: string) => void }) {
  const pedindo = useComandasPedindoConta(unidadeId)
  const abertas = useComandasAbertas(unidadeId)
  const [busca, setBusca] = useState('')
  const achadas = busca ? abertas.filter((c) => String(c.mesa) === busca.trim()) : []

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          className="input pl-10 text-lg"
          inputMode="numeric"
          placeholder="Buscar pelo nº da mesa"
          value={busca}
          onChange={(e) => setBusca(e.target.value.replace(/\D/g, ''))}
        />
      </div>

      {busca ? (
        <Secao titulo="Resultado">
          {achadas.length === 0 ? (
            <Card><p className="p-4 text-sm text-muted">Nenhuma mesa {busca} aberta agora.</p></Card>
          ) : (
            <div className="space-y-2">{achadas.map((c) => <LinhaMesa key={c.id} id={c.id} onAbrir={onAbrir} />)}</div>
          )}
        </Secao>
      ) : (
        <Secao titulo={<span className="flex items-center gap-2">Pedindo conta <Badge cor="amarelo">{pedindo.length}</Badge></span>}>
          {pedindo.length === 0 ? (
            <Card><Vazio icone={<Receipt size={26} />} titulo="Nenhuma mesa pedindo conta" texto="Quando o garçom tocar em “Pedir conta”, a mesa aparece aqui." /></Card>
          ) : (
            <div className="space-y-2">{pedindo.map((c) => <LinhaMesa key={c.id} id={c.id} onAbrir={onAbrir} />)}</div>
          )}
        </Secao>
      )}

      {!busca && abertas.filter((c) => c.status === 'aberta').length > 0 && (
        <Secao titulo="Mesas ainda consumindo">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {abertas.filter((c) => c.status === 'aberta').map((c) => (
              <button key={c.id} onClick={() => onAbrir(c.id)} className="card px-3 h-11 flex items-center gap-2 text-sm font-semibold justify-between">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Mesa {c.mesa}
                <span className="num text-muted font-normal">{formatBRL(totalComanda(c))}</span>
              </button>
            ))}
          </div>
        </Secao>
      )}
    </div>
  )
}

function LinhaMesa({ id, onAbrir }: { id: string; onAbrir: (id: string) => void }) {
  const c = useComanda(id)
  if (!c) return null
  return (
    <Card onClick={() => onAbrir(c.id)} className="p-4 flex items-center gap-4">
      <span className={`h-14 w-14 rounded-2xl grid place-items-center num text-2xl font-extrabold shrink-0 ${c.status === 'conta' ? 'bg-warning-strong text-ink' : 'bg-primary text-white'}`}>
        {c.mesa}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-bold">Mesa {c.mesa}</p>
        <p className="text-sm text-muted">{c.pessoas} pessoas · aberta {formatHora(c.abertaEm)} por {c.abertaPor}</p>
      </div>
      <p className="num text-lg font-extrabold">{formatBRL(totalComanda(c))}</p>
    </Card>
  )
}

interface Linha { forma: FormaPagamento; valor: string; recebido: string }

const dividir = (total: number, n: number): number[] => {
  const base = Math.floor((total / n) * 100) / 100
  const partes = Array.from({ length: n }, () => base)
  partes[n - 1] = arred(total - base * (n - 1))
  return partes
}
const paraTexto = (v: number) => v.toFixed(2).replace('.', ',')

function FecharConta({ comandaId, operador, onVoltar }: { comandaId: string; operador: string; onVoltar: () => void }) {
  const comanda = useComanda(comandaId)
  const total = comanda ? totalComanda(comanda) : 0
  const [modo, setModo] = useState<'inteira' | 'pessoas' | 'manual'>('inteira')
  const [nPessoas, setNPessoas] = useState(2)
  const [linhas, setLinhas] = useState<Linha[]>([{ forma: 'pix', valor: paraTexto(total), recebido: '' }])

  useEffect(() => {
    if (modo === 'inteira') setLinhas((l) => [{ forma: l[0]?.forma ?? 'pix', valor: paraTexto(total), recebido: '' }])
    if (modo === 'pessoas') setLinhas((l) => dividir(total, nPessoas).map((v, i) => ({ forma: l[i]?.forma ?? 'pix', valor: paraTexto(v), recebido: '' })))
    if (modo === 'manual') setLinhas([{ forma: 'pix', valor: '', recebido: '' }])
  }, [modo, nPessoas, total])

  const itensAgrupados = useMemo(() => {
    const m = new Map<string, { nome: string; q: number; v: number; por: Set<string> }>()
    for (const i of comanda?.itens.filter((x) => !x.cancelado) ?? []) {
      const g = m.get(i.cardapioId) ?? { nome: i.nome, q: 0, v: 0, por: new Set<string>() }
      g.q += i.quantidade
      g.v += i.quantidade * i.precoUnitario
      g.por.add(i.lancadoPor)
      m.set(i.cardapioId, g)
    }
    return [...m.values()]
  }, [comanda])

  if (!comanda) return null
  const cancelados = comanda.itens.filter((i) => i.cancelado)
  const pago = arred(linhas.reduce((s, l) => s + parseNumero(l.valor), 0))
  const falta = arred(total - pago)
  const troco = arred(linhas.filter((l) => l.forma === 'dinheiro').reduce((s, l) => s + Math.max(0, parseNumero(l.recebido) - parseNumero(l.valor)), 0))
  const dinheiroInsuficiente = linhas.some((l) => l.forma === 'dinheiro' && l.recebido && parseNumero(l.recebido) < parseNumero(l.valor))

  const set = (i: number, p: Partial<Linha>) => setLinhas((ls) => ls.map((l, k) => (k === i ? { ...l, ...p } : l)))

  const finalizar = async () => {
    const pagamentos: Pagamento[] = linhas.filter((l) => parseNumero(l.valor) > 0).map((l) => ({ forma: l.forma, valor: parseNumero(l.valor) }))
    const v = await finalizarConta(comanda.id, pagamentos, troco, operador)
    const resumo = pagamentos.map((p) => `${rotuloForma(p.forma)} ${formatBRL(p.valor)}`).join(' + ')
    toast({ tipo: 'sucesso', titulo: `Mesa ${comanda.mesa} fechada · ${formatBRL(v.total)}`, texto: `${resumo}${troco ? ` · troco ${formatBRL(troco)}` : ''}` })
    onVoltar()
  }

  return (
    <div className="pb-32 space-y-5 animate-fade-in">
      <div className="flex items-center gap-2 -mt-1">
        <button onClick={onVoltar} aria-label="Voltar" className="h-11 w-11 -ml-2 rounded-xl grid place-items-center hover:bg-muted-light"><ArrowLeft size={22} /></button>
        <div>
          <h1 className="text-2xl font-extrabold">Conta da mesa {comanda.mesa}</h1>
          <p className="text-sm text-muted">{comanda.pessoas} pessoas · aberta às {formatHora(comanda.abertaEm)} por {comanda.abertaPor}</p>
        </div>
      </div>

      <Card className="divide-y divide-surface-line">
        {itensAgrupados.map((g) => (
          <div key={g.nome} className="px-4 py-2.5 flex items-start gap-3">
            <span className="num font-bold w-8 shrink-0">{g.q}x</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium leading-snug">{g.nome}</p>
              <p className="text-xs text-muted">lançado por {[...g.por].join(', ')}</p>
            </div>
            <span className="num font-semibold">{formatBRL(g.v)}</span>
          </div>
        ))}
        {cancelados.map((i) => (
          <div key={i.id} className="px-4 py-2 flex items-start gap-3 text-muted text-sm">
            <span className="num w-8 shrink-0 line-through">{i.quantidade}x</span>
            <div className="flex-1 min-w-0">
              <p className="line-through">{i.nome}</p>
              <p className="text-xs text-danger">cancelado por {i.cancelado!.por} às {formatHora(i.cancelado!.em)}</p>
            </div>
            <span className="num line-through">{formatBRL(i.precoUnitario * i.quantidade)}</span>
          </div>
        ))}
        <div className="px-4 py-3 flex justify-between items-baseline bg-muted-light/60 rounded-b-2xl">
          <span className="font-bold">Total</span>
          <span className="num text-2xl font-extrabold">{formatBRL(total)}</span>
        </div>
      </Card>

      <Secao titulo="Dividir conta">
        <Abas
          abas={[{ id: 'inteira', rotulo: 'Não dividir' }, { id: 'pessoas', rotulo: 'Por pessoas' }, { id: 'manual', rotulo: 'Valor manual' }]}
          valor={modo}
          onChange={setModo}
        />
        {modo === 'pessoas' && (
          <div className="card mt-3 p-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Dividir em</p>
              <p className="num text-sm text-muted">{formatBRL(total / nPessoas)} para cada</p>
            </div>
            <Stepper valor={nPessoas} onChange={setNPessoas} min={2} max={20} />
          </div>
        )}
      </Secao>

      <Secao titulo="Pagamento" acao={<span className="text-xs text-muted">Pode misturar formas</span>}>
        <div className="space-y-3">
          {linhas.map((l, i) => {
            const trocoLinha = l.forma === 'dinheiro' ? parseNumero(l.recebido) - parseNumero(l.valor) : 0
            return (
              <Card key={i} className="p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <p className="font-semibold">{linhas.length > 1 ? `Parte ${i + 1}` : 'Forma de pagamento'}</p>
                  {modo === 'manual' && linhas.length > 1 && (
                    <button onClick={() => setLinhas((ls) => ls.filter((_, k) => k !== i))} aria-label="Remover parte" className="h-9 w-9 rounded-lg grid place-items-center text-muted hover:text-danger">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {formas.map((f) => {
                    const Ic = f.icone
                    const ativo = l.forma === f.id
                    return (
                      <button
                        key={f.id}
                        onClick={() => set(i, { forma: f.id })}
                        className={`h-16 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition
                          ${ativo ? 'border-ink bg-ink text-white' : 'border-surface-line bg-white text-ink-soft'}`}
                      >
                        <Ic size={20} /> {f.rotulo}
                      </button>
                    )
                  })}
                </div>
                <div className={`grid gap-2 mt-3 ${l.forma === 'dinheiro' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  <label>
                    <span className="label">Valor</span>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">R$</span>
                      <input
                        className="input pl-9 num font-bold"
                        inputMode="decimal"
                        value={l.valor}
                        readOnly={modo !== 'manual'}
                        placeholder={paraTexto(Math.max(0, falta))}
                        onChange={(e) => set(i, { valor: e.target.value.replace(/[^\d,]/g, '') })}
                      />
                    </div>
                  </label>
                  {l.forma === 'dinheiro' && (
                    <label>
                      <span className="label">Recebido</span>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">R$</span>
                        <input
                          className="input pl-9 num font-bold"
                          inputMode="decimal"
                          value={l.recebido}
                          placeholder="0,00"
                          onChange={(e) => set(i, { recebido: e.target.value.replace(/[^\d,]/g, '') })}
                        />
                      </div>
                    </label>
                  )}
                </div>
                {l.forma === 'dinheiro' && l.recebido && (
                  <p className={`mt-2 text-sm font-semibold num ${trocoLinha >= 0 ? 'text-success' : 'text-danger'}`}>
                    {trocoLinha >= 0 ? `Troco: ${formatBRL(trocoLinha)}` : `Faltam ${formatBRL(-trocoLinha)} no dinheiro recebido`}
                  </p>
                )}
              </Card>
            )
          })}
          {modo === 'manual' && (
            <Button
              variante="secondary"
              bloco
              disabled={falta <= 0}
              onClick={() => setLinhas((ls) => [...ls, { forma: 'credito', valor: paraTexto(Math.max(0, falta)), recebido: '' }])}
            >
              <Plus size={18} /> Adicionar outra forma
            </Button>
          )}
        </div>
      </Secao>

      <div className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-surface-line pb-safe">
        <div className="mx-auto max-w-3xl px-4 pt-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted num">
              Total {formatBRL(total)} · pago {formatBRL(pago)}
            </p>
            {Math.abs(falta) < 0.005 ? (
              <p className="font-bold text-success flex items-center gap-1"><CheckCircle2 size={18} /> {troco ? `Troco ${formatBRL(troco)}` : 'Valor completo'}</p>
            ) : (
              <p className={`num text-lg font-extrabold ${falta > 0 ? 'text-danger' : 'text-warning'}`}>
                {falta > 0 ? `Falta ${formatBRL(falta)}` : `Passou ${formatBRL(-falta)}`}
              </p>
            )}
          </div>
          <Button tamanho="lg" variante="success" disabled={Math.abs(falta) >= 0.005 || dinheiroInsuficiente} onClick={finalizar}>
            Finalizar
          </Button>
        </div>
      </div>
    </div>
  )
}

function Marmitas({ unidadeId, operador }: { unidadeId: UnidadeId; operador: string }) {
  const opcoes = cardapio.filter((c) => c.categoria === 'marmitas' || c.id === 'beb-coca-lata' || c.id === 'beb-agua')
  const [qtd, setQtd] = useState<Record<string, number>>({})
  const [forma, setForma] = useState<FormaPagamento>('pix')
  const [recebido, setRecebido] = useState('')
  const vendas = useVendasHoje(unidadeId).filter((v) => v.origem === 'marmita').slice(-6).reverse()

  const itens = Object.entries(qtd).filter(([, q]) => q > 0).map(([cardapioId, quantidade]) => ({ cardapioId, quantidade }))
  const total = arred(itens.reduce((s, i) => s + getCardapio(i.cardapioId).preco * i.quantidade, 0))
  const troco = forma === 'dinheiro' ? parseNumero(recebido) - total : 0

  const vender = async () => {
    await venderBalcao(unidadeId, itens, [{ forma, valor: total }], Math.max(0, troco), operador)
    toast({ tipo: 'sucesso', titulo: `Venda registrada · ${formatBRL(total)}`, texto: `${itens.map((i) => `${i.quantidade}x ${getCardapio(i.cardapioId).nome}`).join(', ')} · ${rotuloForma(forma)}` })
    setQtd({})
    setRecebido('')
  }

  return (
    <div className="space-y-5 pb-4">
      <Card className="divide-y divide-surface-line">
        {opcoes.map((c) => (
          <div key={c.id} className="px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-bold">{c.nome}</p>
              <p className="text-xs text-muted truncate">{c.descricao ?? 'Bebida'}</p>
              <p className="num text-sm font-semibold mt-0.5">{formatBRL(c.preco)}</p>
            </div>
            <Stepper valor={qtd[c.id] ?? 0} onChange={(v) => setQtd((q) => ({ ...q, [c.id]: v }))} />
          </div>
        ))}
      </Card>

      <div className="grid grid-cols-4 gap-1.5">
        {formas.map((f) => {
          const Ic = f.icone
          return (
            <button
              key={f.id}
              onClick={() => setForma(f.id)}
              className={`h-16 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 ${forma === f.id ? 'border-ink bg-ink text-white' : 'border-surface-line bg-white text-ink-soft'}`}
            >
              <Ic size={20} /> {f.rotulo}
            </button>
          )
        })}
      </div>
      {forma === 'dinheiro' && (
        <div>
          <label className="label">Valor recebido</label>
          <input className="input num font-bold" inputMode="decimal" placeholder="0,00" value={recebido} onChange={(e) => setRecebido(e.target.value.replace(/[^\d,]/g, ''))} />
          {recebido && <p className={`mt-1.5 text-sm font-semibold num ${troco >= 0 ? 'text-success' : 'text-danger'}`}>{troco >= 0 ? `Troco: ${formatBRL(troco)}` : `Faltam ${formatBRL(-troco)}`}</p>}
        </div>
      )}

      <Button bloco tamanho="lg" variante="success" disabled={total === 0 || (forma === 'dinheiro' && !!recebido && troco < 0)} onClick={vender}>
        Registrar venda · <span className="num">{formatBRL(total)}</span>
      </Button>

      {vendas.length > 0 && (
        <Secao titulo="Últimas vendas de balcão">
          <Card className="divide-y divide-surface-line">
            {vendas.map((v) => (
              <div key={v.id} className="px-4 py-2.5 flex items-center gap-3 text-sm">
                <span className="num text-muted w-11 shrink-0">{formatHora(v.em)}</span>
                <span className="flex-1 min-w-0 truncate">{v.descricao}</span>
                <span className="text-xs text-muted">{rotuloForma(v.pagamentos[0]!.forma)}</span>
                <span className="num font-semibold">{formatBRL(v.total)}</span>
              </div>
            ))}
          </Card>
        </Secao>
      )}
    </div>
  )
}

function Fechamento({ unidadeId, operador }: { unidadeId: UnidadeId; operador: string }) {
  const r = useResumoCaixa(unidadeId)
  const [contado, setContado] = useState('')
  const diferenca = contado ? arred(parseNumero(contado) - r.totais.dinheiro) : null

  const fechar = async () => {
    const f = await fecharCaixa(unidadeId, parseNumero(contado), operador)
    if (Math.abs(f.diferenca) < 1) toast({ tipo: 'sucesso', titulo: 'Caixa fechado', texto: `Dinheiro confere. Fechado por ${operador} às ${formatHora(f.em)}.` })
    else toast({ tipo: 'alerta', titulo: `Caixa fechado com ${f.diferenca < 0 ? 'falta' : 'sobra'} de ${formatBRL(Math.abs(f.diferenca))}`, texto: 'A dona foi notificada.' })
    setContado('')
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 col-span-2">
          <p className="text-sm text-muted">Total do dia no caixa</p>
          <p className="num text-4xl font-extrabold mt-1">{formatBRL(r.total)}</p>
          <p className="text-sm text-muted mt-1"><span className="num font-semibold text-ink">{r.qtd}</span> vendas · ticket médio <span className="num font-semibold text-ink">{formatBRL(r.ticket)}</span></p>
        </Card>
        {formas.map((f) => {
          const Ic = f.icone
          return (
            <Card key={f.id} className="p-4">
              <p className="text-xs text-muted flex items-center gap-1.5"><Ic size={14} /> {f.rotulo}</p>
              <p className="num text-xl font-bold mt-1">{formatBRL(r.totais[f.id])}</p>
            </Card>
          )
        })}
      </div>

      <Card className="p-4">
        <label className="label" htmlFor="contado">Valor contado em dinheiro na gaveta</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">R$</span>
          <input id="contado" className="input pl-11 h-14 text-2xl num font-bold" inputMode="decimal" placeholder="0,00" value={contado} onChange={(e) => setContado(e.target.value.replace(/[^\d,]/g, ''))} />
        </div>
        <p className="text-sm text-muted mt-2">Sistema registrou <b className="num text-ink">{formatBRL(r.totais.dinheiro)}</b> em dinheiro.</p>
        {diferenca !== null && (
          <div className={`mt-3 rounded-xl px-4 py-3 font-bold num flex items-center justify-between ${Math.abs(diferenca) < 1 ? 'bg-success-light text-success' : diferenca < 0 ? 'bg-danger-light text-danger' : 'bg-success-light text-success'}`}>
            <span>{Math.abs(diferenca) < 1 ? 'Confere' : diferenca < 0 ? 'Falta' : 'Sobra'}</span>
            <span className="text-xl">{formatBRL(Math.abs(diferenca))}</span>
          </div>
        )}
        <Button bloco tamanho="lg" variante="dark" className="mt-4" disabled={!contado} onClick={fechar}>
          <Lock size={18} /> Fechar caixa
        </Button>
        <p className="text-xs text-muted mt-2 text-center">Fechando como {operador}. Diferença acima de R$ 1,00 vira alerta para a dona.</p>
      </Card>

      {r.fechamento && (
        <Card className="p-4 text-sm">
          <p className="font-semibold">Último fechamento: {formatHora(r.fechamento.em)} por {r.fechamento.fechadoPor}</p>
          <p className="text-muted num">Contado {formatBRL(r.fechamento.dinheiroContado)} · diferença {formatBRL(r.fechamento.diferenca)}</p>
        </Card>
      )}
    </div>
  )
}
