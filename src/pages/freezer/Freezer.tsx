import { useState } from 'react'
import { AlertTriangle, ArrowLeft, Beef, Check, Snowflake } from 'lucide-react'
import { Layout } from '../../components/Layout'
import { Avatar, Badge, Button, Card, Secao } from '../../components/ui'
import { Teclado, VisorNumero } from '../../components/Teclado'
import { registrarRetirada, useEstoque, useRetiradas } from '../../services'
import { funcionariosDa, getProduto, getUnidade } from '../../data/cadastros'
import { useUI, toast } from '../../store/useUI'
import { formatHora, formatKg, formatQuando, parseNumero } from '../../lib/format'
import type { Funcionario } from '../../types'

const coresAvatar = ['#B91C1C', '#0F766E', '#C2410C', '#4338CA', '#A16207', '#0369A1', '#7C3AED', '#15803D']

export default function Freezer() {
  const unidadeId = useUI((s) => s.unidadeFreezer)
  const setUI = useUI((s) => s.set)
  const equipe = funcionariosDa(unidadeId)
  const carnes = useEstoque(unidadeId).filter((e) => e.produto.categoria === 'carne')
  const retiradas = useRetiradas(unidadeId)

  const [passo, setPasso] = useState<1 | 2 | 3>(1)
  const [quem, setQuem] = useState<Funcionario | null>(null)
  const [corte, setCorte] = useState<string | null>(null)
  const [kg, setKg] = useState('')

  const reiniciar = () => { setPasso(1); setQuem(null); setCorte(null); setKg('') }
  const estoqueCorte = carnes.find((c) => c.produtoId === corte)?.quantidade ?? 0
  const valor = parseNumero(kg)

  const confirmar = async () => {
    if (!quem || !corte) return
    if (valor > estoqueCorte) {
      toast({ tipo: 'erro', titulo: 'Mais do que tem no estoque', texto: `O sistema registra ${formatKg(estoqueCorte)} de ${getProduto(corte).nome}. Confira o peso.` })
      return
    }
    const r = await registrarRetirada(unidadeId, quem.id, quem.nome, corte, valor)
    toast({ tipo: 'sucesso', titulo: `${formatKg(valor)} de ${getProduto(corte).nome} retirados por ${quem.nome} às ${formatHora(r.em)}` })
    if (r.foraDoHorario) toast({ tipo: 'alerta', titulo: 'Retirada fora do horário', texto: 'O restaurante está fechado agora. A dona foi notificada.' })
    reiniciar()
  }

  return (
    <Layout perfil="freezer" unidadeId={unidadeId} onTrocarUnidade={(u) => { setUI({ unidadeFreezer: u }); reiniciar() }} largura="max-w-4xl">
      <div className="space-y-6">
        {/* indicador de passos */}
        <ol className="grid grid-cols-3 gap-2">
          {['Quem retira', 'Qual carne', 'Quanto'].map((t, i) => {
            const n = (i + 1) as 1 | 2 | 3
            const feito = passo > n
            const atual = passo === n
            return (
              <li key={t} className={`rounded-xl px-3 py-2.5 flex items-center gap-2 text-sm font-semibold border ${atual ? 'bg-ink text-white border-ink' : feito ? 'bg-success-light text-success border-transparent' : 'bg-white text-muted border-surface-line'}`}>
                <span className={`h-6 w-6 rounded-full grid place-items-center text-xs shrink-0 ${atual ? 'bg-white text-ink' : feito ? 'bg-success text-white' : 'bg-muted-light'}`}>
                  {feito ? <Check size={14} /> : n}
                </span>
                <span className="truncate">{t}</span>
              </li>
            )
          })}
        </ol>

        {passo === 1 && (
          <section className="animate-fade-in">
            <h1 className="text-2xl font-extrabold mb-3">Quem está retirando?</h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {equipe.map((f, i) => (
                <button
                  key={f.id}
                  onClick={() => { setQuem(f); setPasso(2) }}
                  className="card p-4 flex flex-col items-center gap-2 min-h-[140px] justify-center active:scale-[.98] hover:shadow-float transition"
                >
                  <Avatar nome={f.nome} cor={coresAvatar[i % coresAvatar.length]} tamanho={64} />
                  <span className="font-bold text-lg leading-tight">{f.nome}</span>
                  <span className="text-xs text-muted">{f.funcao}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {passo === 2 && quem && (
          <section className="animate-fade-in">
            <Voltar onClick={() => setPasso(1)} texto={`${quem.nome} · trocar`} />
            <h1 className="text-2xl font-extrabold mb-3">Qual corte?</h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {carnes.map((c) => {
                const baixo = c.quantidade < c.minimo
                return (
                  <button
                    key={c.produtoId}
                    onClick={() => { setCorte(c.produtoId); setPasso(3) }}
                    className="card p-4 text-left min-h-[120px] flex flex-col active:scale-[.98] hover:shadow-float transition"
                  >
                    <span className="h-10 w-10 rounded-xl bg-primary-soft text-primary grid place-items-center"><Beef size={22} /></span>
                    <span className="font-bold text-lg mt-2 leading-tight">{c.produto.nome}</span>
                    <span className={`num text-sm mt-auto pt-1 ${baixo ? 'text-warning font-semibold' : 'text-muted'}`}>{formatKg(c.quantidade)} no freezer</span>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {passo === 3 && quem && corte && (
          <section className="animate-fade-in max-w-md mx-auto">
            <Voltar onClick={() => setPasso(2)} texto="Trocar corte" />
            <Card className="p-4 mb-4 flex items-center gap-3">
              <Avatar nome={quem.nome} cor={coresAvatar[equipe.indexOf(quem) % coresAvatar.length]} />
              <div className="flex-1">
                <p className="font-bold">{getProduto(corte).nome}</p>
                <p className="text-sm text-muted">Retirada por {quem.nome} · <span className="num">{formatKg(estoqueCorte)}</span> no freezer</p>
              </div>
            </Card>
            <p className="label">Quantos kg estão saindo?</p>
            <VisorNumero valor={kg} sufixo="kg" placeholder="0,000" />
            <div className="mt-3"><Teclado valor={kg} onChange={setKg} casas={3} max={200} /></div>
            <Button bloco tamanho="lg" className="mt-4" disabled={valor <= 0} onClick={confirmar}>
              <Check size={22} /> Confirmar retirada
            </Button>
          </section>
        )}

        <Secao titulo={<span className="flex items-center gap-2"><Snowflake size={18} className="text-sky-600" /> Últimas retiradas</span>} acao={<span className="text-xs text-muted">últimas 24 horas</span>}>
          <Card className="divide-y divide-surface-line">
            {retiradas.map((r) => (
              <div key={r.id} className={`px-4 py-3 flex items-center gap-3 ${r.foraDoHorario ? 'bg-danger-light/60' : ''}`}>
                <span className="num text-sm text-muted w-[84px] shrink-0">{formatQuando(r.em)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{getProduto(r.produtoId).nome}</p>
                  <p className="text-xs text-muted">por {r.funcionarioNome}</p>
                </div>
                {r.foraDoHorario && <Badge cor="vermelho"><AlertTriangle size={12} /> Fora do horário</Badge>}
                <span className="num font-bold shrink-0">{formatKg(r.quantidade)}</span>
              </div>
            ))}
            {retiradas.length === 0 && <p className="p-4 text-sm text-muted">Nenhuma retirada nas últimas 24 horas.</p>}
          </Card>
          <p className="text-xs text-muted mt-2">
            Horário permitido em {getUnidade(unidadeId).nome}: 2h antes de abrir até {getUnidade(unidadeId).horarioFechamento}. Fora disso, a dona recebe um alerta.
          </p>
        </Secao>
      </div>
    </Layout>
  )
}

function Voltar({ onClick, texto }: { onClick: () => void; texto: string }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 text-sm font-semibold text-muted h-10 mb-1">
      <ArrowLeft size={18} /> {texto}
    </button>
  )
}
