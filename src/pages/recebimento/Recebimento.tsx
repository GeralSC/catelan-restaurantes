import { useState } from 'react'
import { AlertOctagon, ArrowLeft, Bell, Camera, CheckCircle2, EyeOff, Package, Search, Truck, UserRound } from 'lucide-react'
import { Layout } from '../../components/Layout'
import { Badge, Button, Card, DicaProtótipo, Secao, Vazio } from '../../components/ui'
import { Teclado, VisorNumero } from '../../components/Teclado'
import { LeituraSimulada } from '../../components/LeituraSimulada'
import { buscarLacre, registrarRecebimento, useTransferenciasAguardando } from '../../services'
import { funcionariosDa, getProduto, getUnidade, TOLERANCIA_DIVERGENCIA } from '../../data/cadastros'
import { useUI, toast } from '../../store/useUI'
import { formatBRL, formatKg, formatQuando, parseNumero } from '../../lib/format'
import type { ResultadoConferencia, TransferenciaCega } from '../../types'

type Etapa = 'buscar' | 'pesar' | 'resultado'

export default function Recebimento() {
  const unidadeId = useUI((s) => s.unidadeRecebimento)
  const setUI = useUI((s) => s.set)
  const aguardando = useTransferenciasAguardando(unidadeId)
  const equipe = funcionariosDa(unidadeId)

  const [conferente, setConferente] = useState(equipe[0]?.nome ?? '')
  const [etapa, setEtapa] = useState<Etapa>('buscar')
  const [lacre, setLacre] = useState('')
  const [atual, setAtual] = useState<TransferenciaCega | null>(null)
  const [peso, setPeso] = useState('')
  const [resultado, setResultado] = useState<ResultadoConferencia | null>(null)
  const [camera, setCamera] = useState(false)

  const trocarUnidade = (u: typeof unidadeId) => {
    setUI({ unidadeRecebimento: u })
    setConferente(funcionariosDa(u)[0]?.nome ?? '')
    reiniciar()
  }

  const reiniciar = () => {
    setEtapa('buscar')
    setLacre('')
    setAtual(null)
    setPeso('')
    setResultado(null)
  }

  const buscar = (valor = lacre) => {
    const v = valor.trim().toUpperCase()
    if (!v) return
    const t = buscarLacre(v, unidadeId)
    if (!t) {
      toast({ tipo: 'erro', titulo: 'Lacre não encontrado', texto: `Nenhum envio com o lacre ${v} para ${getUnidade(unidadeId).nome}.` })
      return
    }
    if (t.status !== 'em_transito') {
      toast({ tipo: 'erro', titulo: 'Lacre já conferido', texto: `${v} foi recebido por ${t.recebidoPor} (${formatQuando(t.recebidoEm!)}).` })
      return
    }
    setLacre(v)
    setAtual(t)
    setPeso('')
    setEtapa('pesar')
  }

  const confirmar = async () => {
    if (!atual) return
    const kg = parseNumero(peso)
    const r = await registrarRecebimento(atual.lacre, kg, conferente, unidadeId)
    if (!r) return
    setResultado(r)
    setEtapa('resultado')
    if (r.ok) toast({ tipo: 'sucesso', titulo: 'Recebimento conferido', texto: `${formatKg(kg)} de ${r.produtoNome} entraram no estoque.` })
    else toast({ tipo: 'alerta', titulo: 'Divergência detectada', texto: `Lacre ${r.lacre}: faltam ${formatKg(Math.abs(r.diferenca))}. A dona foi notificada.` })
  }

  const lacreCamera = aguardando.find((t) => t.lacre === 'L-004822')?.lacre ?? aguardando[0]?.lacre ?? 'L-004822'

  return (
    <Layout perfil="recebimento" unidadeId={unidadeId} onTrocarUnidade={trocarUnidade}>
      {etapa === 'buscar' && (
        <div className="space-y-5 animate-fade-in">
          <Card className="p-4">
            <label className="label flex items-center gap-1.5"><UserRound size={15} /> Quem está conferindo</label>
            <select className="input" value={conferente} onChange={(e) => setConferente(e.target.value)}>
              {equipe.map((f) => <option key={f.id} value={f.nome}>{f.nome} · {f.funcao}</option>)}
            </select>

            <label className="label mt-4" htmlFor="lacre">Nº do lacre</label>
            <div className="flex gap-2">
              <input
                id="lacre"
                className="input font-mono uppercase text-lg tracking-wider"
                placeholder="L-000000"
                value={lacre}
                autoComplete="off"
                onChange={(e) => setLacre(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && buscar()}
              />
              <button
                onClick={() => setCamera(true)}
                aria-label="Ler lacre com a câmera"
                className="h-12 w-14 shrink-0 rounded-xl bg-ink text-white grid place-items-center active:scale-95"
              >
                <Camera size={22} />
              </button>
            </div>
            <Button bloco className="mt-3" onClick={() => buscar()} disabled={!lacre.trim()}>
              <Search size={18} /> Buscar lacre
            </Button>
          </Card>

          <DicaProtótipo>Para testar: lacre <b className="font-mono">L-004822</b>, digite <b>8 kg</b> (divergência). Ou <b className="font-mono">L-004821</b> com <b>15 kg</b> (conferido).</DicaProtótipo>

          <Secao
            titulo={<span className="flex items-center gap-2">Aguardando recebimento <Badge cor="primary">{aguardando.length}</Badge></span>}
          >
            {aguardando.length === 0 ? (
              <Card><Vazio icone={<Truck size={26} />} titulo="Nada em trânsito" texto="Quando a Central enviar mercadoria, ela aparece aqui." /></Card>
            ) : (
              <div className="space-y-2">
                {aguardando.map((t) => (
                  <Card key={t.id} onClick={() => buscar(t.lacre)} className="p-4 flex items-center gap-3">
                    <span className="h-11 w-11 rounded-xl bg-primary-soft text-primary grid place-items-center shrink-0"><Package size={22} /></span>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono font-bold text-[17px]">{t.lacre}</p>
                      <p className="text-sm text-muted truncate">
                        {t.origemId === 'central' ? 'Central' : getUnidade(t.origemId).nome} · enviado {formatQuando(t.enviadoEm)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="num font-bold">{t.volumes}</p>
                      <p className="text-xs text-muted">{t.volumes === 1 ? 'volume' : 'volumes'}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            <p className="text-xs text-muted mt-3 flex items-center gap-1.5">
              <EyeOff size={14} /> O peso enviado fica escondido até você digitar o peso conferido.
            </p>
          </Secao>
        </div>
      )}

      {etapa === 'pesar' && atual && (
        <div className="space-y-4 animate-slide-up">
          <button onClick={reiniciar} className="flex items-center gap-1.5 text-sm font-semibold text-muted h-10">
            <ArrowLeft size={18} /> Voltar
          </button>
          <Card className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted">Lacre <span className="font-mono font-semibold text-ink">{atual.lacre}</span></p>
                <p className="text-2xl font-extrabold mt-0.5">{getProduto(atual.produtoId).nome}</p>
                <p className="text-sm text-muted mt-0.5">{atual.volumes} {atual.volumes === 1 ? 'volume' : 'volumes'} · de {getUnidade(atual.origemId).nome}</p>
              </div>
              <span className="h-14 w-14 rounded-2xl bg-primary-soft text-primary grid place-items-center shrink-0"><Package size={28} /></span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs font-medium text-ink-soft bg-muted-light rounded-lg px-3 py-2">
              <EyeOff size={14} className="shrink-0" /> Peso enviado: <span className="tracking-widest">•••••</span> (aparece depois da conferência)
            </div>
          </Card>

          <div>
            <p className="label">Peso conferido na balança (kg)</p>
            <VisorNumero valor={peso} sufixo="kg" placeholder="0,000" />
          </div>
          <Teclado valor={peso} onChange={setPeso} casas={3} max={999} />
          <Button bloco tamanho="lg" onClick={confirmar} disabled={parseNumero(peso) <= 0}>
            <CheckCircle2 size={22} /> Confirmar recebimento
          </Button>
        </div>
      )}

      {etapa === 'resultado' && resultado && (
        <Resultado r={resultado} conferente={conferente} onNovo={reiniciar} />
      )}

      <LeituraSimulada
        aberto={camera}
        onFechar={() => setCamera(false)}
        valor={lacreCamera}
        titulo="Ler lacre"
        instrucao="Aponte a câmera para o lacre"
        onLido={(v) => { setLacre(v); buscar(v) }}
      />
    </Layout>
  )
}

function Resultado({ r, conferente, onNovo }: { r: ResultadoConferencia; conferente: string; onNovo: () => void }) {
  if (r.ok) {
    return (
      <div className="animate-fade-in">
        <div className="rounded-3xl bg-success text-white p-6 text-center">
          <CheckCircle2 size={72} className="mx-auto animate-pop" strokeWidth={1.75} />
          <h2 className="text-2xl font-extrabold mt-3">Recebimento conferido</h2>
          <p className="text-white/85 mt-1">{formatKg(r.recebido)} de {r.produtoNome} entraram no estoque.</p>
          <div className="mt-5 grid grid-cols-2 gap-2 text-left">
            <Info rotulo="Enviado" valor={formatKg(r.enviado)} />
            <Info rotulo="Recebido" valor={formatKg(r.recebido)} />
          </div>
          <p className="text-sm text-white/75 mt-4">
            Diferença de {formatKg(Math.abs(r.diferenca))} ({(r.percentual * 100).toFixed(1).replace('.', ',')}%), dentro da tolerância de {Math.round(r.tolerancia * 100)}%.
          </p>
          <p className="text-xs text-white/70 mt-2">Conferido por {conferente} · lacre {r.lacre}</p>
        </div>
        <Button bloco tamanho="lg" variante="dark" className="mt-4" onClick={onNovo}>Conferir outro lacre</Button>
      </div>
    )
  }
  return (
    <div className="animate-fade-in">
      <div className="rounded-3xl bg-danger text-white p-6 text-center ring-8 ring-danger/15">
        <AlertOctagon size={72} className="mx-auto animate-pop" strokeWidth={1.75} />
        <h2 className="text-2xl font-extrabold mt-3">Divergência detectada</h2>
        <p className="text-white/85 mt-1">Lacre {r.lacre} · {r.produtoNome}</p>
        <div className="mt-5 grid grid-cols-2 gap-2 text-left">
          <Info rotulo="Enviado" valor={formatKg(r.enviado)} />
          <Info rotulo="Recebido" valor={formatKg(r.recebido)} />
          <Info rotulo="Diferença" valor={`${r.diferenca > 0 ? '+' : '−'}${formatKg(Math.abs(r.diferenca))}`} destaque />
          <Info rotulo="Valor estimado" valor={formatBRL(r.valorEstimado)} destaque />
        </div>
        <p className="text-sm text-white/80 mt-4">
          {(r.percentual * 100).toFixed(1).replace('.', ',')}% de diferença · tolerância de {Math.round(TOLERANCIA_DIVERGENCIA * 100)}%
        </p>
        <div className="mt-4 inline-flex items-center gap-2 bg-white text-danger font-bold rounded-full px-4 py-2">
          <Bell size={18} /> A dona foi notificada.
        </div>
        <p className="text-xs text-white/70 mt-3">Registrado por {conferente} · a mercadoria entrou com o peso conferido.</p>
      </div>
      <Button bloco tamanho="lg" variante="dark" className="mt-4" onClick={onNovo}>Conferir outro lacre</Button>
    </div>
  )
}

function Info({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <div className={`rounded-xl px-3 py-2.5 ${destaque ? 'bg-white text-ink' : 'bg-white/15'}`}>
      <p className={`text-xs ${destaque ? 'text-muted' : 'text-white/70'}`}>{rotulo}</p>
      <p className={`num font-bold text-lg ${destaque ? 'text-danger' : ''}`}>{valor}</p>
    </div>
  )
}
