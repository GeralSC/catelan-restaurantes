import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  AlertOctagon, Banknote, Beef, Check, Monitor, PackageX, Refrigerator, ShoppingBag, TrendingDown, TrendingUp, Users,
} from 'lucide-react'
import { Layout } from '../../components/Layout'
import { Badge, Card, Secao } from '../../components/ui'
import { marcarAlertaLido, useAlertas, useEstoqueCritico, usePainel } from '../../services'
import { getUnidade, unidadesRestaurante } from '../../data/cadastros'
import { useUI } from '../../store/useUI'
import { formatBRL, formatDataLonga, formatInt, formatKg, formatPct, formatQuando, saudacao } from '../../lib/format'
import type { Alerta, UnidadeId } from '../../types'

const iconeAlerta = {
  divergencia_lacre: AlertOctagon,
  freezer_fora_horario: Refrigerator,
  diferenca_caixa: Banknote,
}

export default function Painel() {
  const filtro = useUI((s) => s.filtroPainel)
  const setUI = useUI((s) => s.set)
  const { porUnidade, grafico, pedidosOnlineHoje, faturamentoOnlineHoje, ultimosPedidos } = usePainel()
  const alertas = useAlertas()
  const critico = useEstoqueCritico(filtro === 'todas' ? undefined : filtro)
  const [todosAlertas, setTodosAlertas] = useState(false)

  const visiveis = filtro === 'todas' ? porUnidade : porUnidade.filter((u) => u.unidadeId === filtro)
  const total = visiveis.reduce((s, u) => s + u.faturamento, 0)
  const semanaPassada = visiveis.reduce((s, u) => s + u.semanaPassada, 0)
  const variacao = semanaPassada ? total / semanaPassada - 1 : 0
  const clientes = visiveis.reduce((s, u) => s + u.clientes, 0)
  const carneKg = visiveis.reduce((s, u) => s + u.carneKg, 0)

  const alertasVisiveis = alertas.filter((a) => filtro === 'todas' || a.unidadeId === filtro)
  const novos = alertasVisiveis.filter((a) => !a.lido)
  const vistos = alertasVisiveis.filter((a) => a.lido).slice(0, 3)

  const unidadesGrafico = filtro === 'todas' ? unidadesRestaurante : unidadesRestaurante.filter((u) => u.id === filtro)
  const maxKg = Math.max(...visiveis.map((u) => u.carneKg), 1)

  const chips = useMemo(() => [{ id: 'todas' as const, nome: 'Todas' }, ...unidadesRestaurante.map((u) => ({ id: u.id, nome: `${u.nome.replace('Delícias do ', '')} ${u.tipo === 'chapa-buffet' ? u.cidade : ''}`.trim() }))], [])

  return (
    <Layout perfil="dona" subtitulo="Todas as unidades" largura="max-w-5xl">
      <div className="space-y-6">
        {/* Topo */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{saudacao()}, Maryellen</h1>
            <p className="text-muted">{formatDataLonga()}</p>
          </div>
          <Link
            to="/painel/tv"
            className="h-11 px-4 rounded-xl bg-ink text-white font-semibold flex items-center gap-2 hover:bg-ink-soft active:scale-[.98]"
          >
            <Monitor size={18} /> Modo TV
          </Link>
        </div>

        <div className="-mx-4 px-4 flex gap-2 overflow-x-auto no-scrollbar">
          {chips.map((c) => (
            <button
              key={c.id}
              onClick={() => setUI({ filtroPainel: c.id as UnidadeId | 'todas' })}
              className={`h-10 px-4 rounded-full text-sm font-semibold whitespace-nowrap border transition flex items-center gap-2
                ${filtro === c.id ? 'bg-ink text-white border-ink' : 'bg-white border-surface-line text-ink-soft'}`}
            >
              {c.id !== 'todas' && <span className="h-2.5 w-2.5 rounded-full" style={{ background: getUnidade(c.id).cor }} />}
              {c.nome}
            </button>
          ))}
        </div>

        {/* Alertas */}
        {novos.length > 0 && (
          <section className="space-y-2" aria-label="Alertas">
            <div className="flex items-center gap-2 text-danger font-bold">
              <span className="h-2.5 w-2.5 rounded-full bg-danger animate-flash" />
              {novos.length === 1 ? '1 alerta precisa da sua atenção' : `${novos.length} alertas precisam da sua atenção`}
            </div>
            {(todosAlertas ? novos : novos.slice(0, 2)).map((a) => <CardAlerta key={a.id} a={a} />)}
            {novos.length > 2 && (
              <button onClick={() => setTodosAlertas((v) => !v)} className="w-full h-11 rounded-xl border border-danger/30 text-danger font-semibold text-sm bg-white">
                {todosAlertas ? 'Mostrar menos' : `Ver mais ${novos.length - 2} ${novos.length - 2 === 1 ? 'alerta' : 'alertas'}`}
              </button>
            )}
          </section>
        )}

        {/* Faturamento */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="p-5 sm:col-span-2 bg-gradient-to-br from-white to-primary-soft/40">
            <p className="text-sm font-medium text-muted">Faturamento de hoje{filtro !== 'todas' ? ` · ${getUnidade(filtro).nome}` : ' · consolidado'}</p>
            <p className="num text-4xl sm:text-5xl font-extrabold tracking-tight mt-1">{formatBRL(total)}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <Badge cor={variacao >= 0 ? 'verde' : 'vermelho'} className="text-sm">
                {variacao >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span className="num">{formatPct(variacao)}</span>
              </Badge>
              <span className="text-muted">vs. mesmo dia da semana passada (<span className="num">{formatBRL(semanaPassada)}</span>)</span>
            </div>
          </Card>
          <div className="grid grid-cols-2 sm:grid-cols-1 gap-3">
            <Card className="p-4">
              <p className="text-xs font-medium text-muted flex items-center gap-1.5"><Users size={14} /> Clientes hoje</p>
              <p className="num text-2xl font-bold mt-1">{formatInt(clientes)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-muted flex items-center gap-1.5"><ShoppingBag size={14} /> Pedidos online hoje</p>
              <p className="num text-2xl font-bold mt-1">{pedidosOnlineHoje}</p>
              <p className="num text-xs text-muted">{formatBRL(faturamentoOnlineHoje)}</p>
            </Card>
          </div>
        </div>

        {/* Cards por unidade */}
        <Secao titulo="Unidades hoje">
          <div className="grid gap-3 sm:grid-cols-2">
            {visiveis.map((u) => {
              const un = getUnidade(u.unidadeId)
              const v = u.semanaPassada ? u.faturamento / u.semanaPassada - 1 : 0
              return (
                <Card key={u.unidadeId} className="p-4 overflow-hidden relative">
                  <span className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: un.cor }} />
                  <div className="flex items-start justify-between gap-2 pl-1">
                    <div className="min-w-0">
                      <p className="font-bold truncate">{un.nome}{un.tipo === 'chapa-buffet' ? ` · ${un.cidade}` : ''}</p>
                      <p className="text-xs text-muted">{un.cidade} · {un.descricao}</p>
                    </div>
                    <Badge cor={u.aberta ? 'verde' : 'cinza'}>
                      <span className={`h-1.5 w-1.5 rounded-full ${u.aberta ? 'bg-success' : 'bg-muted'}`} />
                      {u.aberta ? 'Aberta' : 'Fechada'}
                    </Badge>
                  </div>
                  <div className="pl-1 mt-3 flex items-baseline gap-2">
                    <p className="num text-2xl font-extrabold">{formatBRL(u.faturamento)}</p>
                    <span className={`num text-xs font-semibold ${v >= 0 ? 'text-success' : 'text-danger'}`}>{formatPct(v)}</span>
                  </div>
                  <div className="pl-1 mt-3 grid grid-cols-3 gap-2 text-sm">
                    <Mini rotulo={un.tipo === 'rodizio' ? 'Clientes' : 'Clientes'} valor={formatInt(u.clientes)} />
                    <Mini rotulo="Ticket médio" valor={formatBRL(u.ticket)} />
                    <Mini rotulo="Vendas" valor={formatInt(u.vendas)} />
                  </div>
                </Card>
              )
            })}
          </div>
        </Secao>

        {/* Gráfico */}
        <Secao titulo="Faturamento dos últimos 7 dias">
          <Card className="p-3 sm:p-4">
            <div className="h-64 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={grafico} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#E7E5E4" />
                  <XAxis dataKey="dia" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#78716C' }} />
                  <YAxis tickLine={false} axisLine={false} width={56} tick={{ fontSize: 11, fill: '#78716C' }} tickFormatter={(v) => `${Math.round(v / 1000)} mil`} />
                  <Tooltip
                    cursor={{ fill: 'rgba(28,25,23,.04)' }}
                    formatter={(v: number, k: string) => [formatBRL(v), `${getUnidade(k).nome} ${getUnidade(k).tipo === 'chapa-buffet' ? getUnidade(k).cidade : ''}`]}
                    contentStyle={{ borderRadius: 12, border: '1px solid #E7E5E4', fontSize: 13 }}
                  />
                  {unidadesGrafico.map((u, i) => (
                    <Bar key={u.id} dataKey={u.id} stackId="a" isAnimationActive={false} fill={u.cor} radius={i === unidadesGrafico.length - 1 ? [6, 6, 0, 0] : 0} maxBarSize={44} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 px-2 pt-2 text-xs text-ink-soft">
              {unidadesGrafico.map((u) => (
                <span key={u.id} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: u.cor }} />
                  {u.nome} {u.tipo === 'chapa-buffet' ? u.cidade : ''}
                </span>
              ))}
            </div>
          </Card>
        </Secao>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Carne */}
          <Secao titulo={<span className="flex items-center gap-2"><Beef size={18} className="text-primary" /> Carne consumida hoje</span>}>
            <Card className="p-4">
              <div className="flex items-baseline justify-between">
                <p className="num text-2xl font-extrabold">{formatKg(carneKg)}</p>
                <p className="text-sm text-muted">rendimento <span className="num font-bold text-ink">{formatBRL(carneKg ? total / carneKg : 0)}</span>/kg</p>
              </div>
              <div className="mt-4 space-y-3">
                {visiveis.map((u) => {
                  const un = getUnidade(u.unidadeId)
                  return (
                    <div key={u.unidadeId}>
                      <div className="flex justify-between text-sm gap-2">
                        <span className="font-medium truncate">{un.nome} {un.tipo === 'chapa-buffet' ? un.cidade : ''}</span>
                        <span className="num text-muted shrink-0">{formatKg(u.carneKg)} · <b className="text-ink">{formatBRL(u.rsPorKg)}/kg</b></span>
                      </div>
                      <div className="h-2 rounded-full bg-muted-light mt-1.5 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(u.carneKg / maxKg) * 100}%`, background: un.cor }} />
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-muted mt-4">R$ faturado para cada kg de carne que saiu do freezer. Se cair, tem carne sumindo ou sendo desperdiçada.</p>
            </Card>
          </Secao>

          {/* Estoque crítico */}
          <Secao titulo={<span className="flex items-center gap-2"><PackageX size={18} className="text-warning" /> Estoque crítico</span>} acao={<Badge cor="amarelo">{critico.length} itens</Badge>}>
            <Card className="divide-y divide-surface-line">
              {critico.length === 0 && <p className="p-4 text-sm text-muted">Nenhum item abaixo do mínimo.</p>}
              {critico.slice(0, 7).map((e) => {
                const un = getUnidade(e.unidadeId)
                const kg = e.produto.unidadeMedida === 'kg'
                return (
                  <div key={`${e.unidadeId}-${e.produtoId}`} className="px-4 py-3 flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: un.cor }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{e.produto.nome}</p>
                      <p className="text-xs text-muted truncate">{un.nome} {un.tipo === 'chapa-buffet' ? un.cidade : ''}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="num font-bold text-warning">{kg ? formatKg(e.quantidade) : `${e.quantidade} un`}</p>
                      <p className="num text-xs text-muted">mín. {kg ? formatKg(e.minimo) : `${e.minimo} un`}</p>
                    </div>
                  </div>
                )
              })}
            </Card>
          </Secao>
        </div>

        {/* Pedidos online */}
        {(filtro === 'todas' || filtro === 'beira-rio') && ultimosPedidos.length > 0 && (
          <Secao titulo="Últimos pedidos online · Beira Rio">
            <Card className="divide-y divide-surface-line">
              {ultimosPedidos.map((p) => (
                <div key={p.id} className="px-4 py-3 flex items-center gap-3">
                  <span className="num font-mono text-sm font-bold bg-muted-light rounded-lg px-2 py-1">nº {p.numero}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{p.cliente}</p>
                    <p className="text-xs text-muted truncate">{p.itens.map((i) => `${i.quantidade}x ${i.nome}`).join(', ')}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="num font-bold">{formatBRL(p.total)}</p>
                    <p className="text-xs text-muted">{formatQuando(p.em)}</p>
                  </div>
                </div>
              ))}
            </Card>
          </Secao>
        )}

        {vistos.length > 0 && (
          <Secao titulo="Alertas já vistos">
            <div className="space-y-2 opacity-70">{vistos.map((a) => <CardAlerta key={a.id} a={a} />)}</div>
          </Secao>
        )}
      </div>
    </Layout>
  )
}

function Mini({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="bg-muted-light rounded-lg px-2 py-1.5 min-w-0">
      <p className="text-[11px] text-muted truncate">{rotulo}</p>
      <p className="num font-bold text-[13px] truncate">{valor}</p>
    </div>
  )
}

function CardAlerta({ a }: { a: Alerta }) {
  const Icone = iconeAlerta[a.tipo]
  const un = getUnidade(a.unidadeId)
  return (
    <div className={`rounded-2xl p-3.5 flex gap-3 animate-slide-up ${a.lido ? 'bg-white border border-surface-line' : 'bg-danger text-white shadow-float'}`}>
      <span className={`h-11 w-11 rounded-xl grid place-items-center shrink-0 ${a.lido ? 'bg-muted-light text-muted' : 'bg-white/15'}`}>
        <Icone size={22} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-bold leading-snug">{a.titulo}</p>
          <p className="num font-extrabold text-lg shrink-0 leading-tight">{formatBRL(a.valor)}</p>
        </div>
        <p className={`text-sm mt-0.5 ${a.lido ? 'text-muted' : 'text-white/85'}`}>{a.detalhe}</p>
        <div className={`mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ${a.lido ? 'text-muted' : 'text-white/80'}`}>
          <span className="flex items-center gap-1.5 font-semibold">
            <span className="h-2 w-2 rounded-full ring-1 ring-white/60" style={{ background: un.cor }} />
            {un.nome} {un.tipo === 'chapa-buffet' ? un.cidade : ''}
          </span>
          <span>por {a.quem}</span>
          <span>{formatQuando(a.em)}</span>
        </div>
        {!a.lido && (
          <button
            onClick={() => marcarAlertaLido(a.id)}
            className="mt-3 h-9 px-3 rounded-lg bg-white/15 hover:bg-white/25 text-sm font-semibold flex items-center gap-1.5"
          >
            <Check size={16} /> Marcar como visto
          </button>
        )}
      </div>
    </div>
  )
}
