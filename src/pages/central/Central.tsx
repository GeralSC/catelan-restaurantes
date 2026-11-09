import { useMemo, useState } from 'react'
import { Barcode, CheckCircle2, FileText, PackageCheck, Scale, Send, Trash2, Truck, AlertOctagon } from 'lucide-react'
import { Layout } from '../../components/Layout'
import { Abas, Badge, Button, Card, Modal, Secao, Stepper, Vazio } from '../../components/ui'
import { LeituraSimulada } from '../../components/LeituraSimulada'
import { enviarTransferencia, lancarNota, useEstoque, useProximoLacre, useTransferencias } from '../../services'
import { fornecedores, funcionariosDa, getProduto, getUnidade, produtos, unidadesRestaurante } from '../../data/cadastros'
import { toast } from '../../store/useUI'
import { ehDiaOperacao as ehHoje } from '../../lib/referencia'
import { arred, formatBRL, formatKg, formatQuando, parseNumero } from '../../lib/format'
import type { ItemNota, UnidadeId } from '../../types'

type Aba = 'nota' | 'enviar' | 'estoque'

const qtdTexto = (produtoId: string, q: number) => (getProduto(produtoId).unidadeMedida === 'kg' ? formatKg(q) : `${q} un`)

export default function Central() {
  const [aba, setAba] = useState<Aba>('nota')
  const equipe = funcionariosDa('central')
  const [operador, setOperador] = useState(equipe[0]!.nome)
  const transf = useTransferencias()
  const emTransito = transf.filter((t) => t.status === 'em_transito').length

  return (
    <Layout perfil="central" unidadeId="central">
      <div className="space-y-4">
        <label className="card px-4 h-14 flex items-center gap-3">
          <span className="text-sm text-muted">Operador</span>
          <select className="flex-1 bg-transparent font-bold outline-none h-full text-right" value={operador} onChange={(e) => setOperador(e.target.value)}>
            {equipe.map((f) => <option key={f.id} value={f.nome}>{f.nome} · {f.funcao}</option>)}
          </select>
        </label>
        <Abas<Aba>
          abas={[{ id: 'nota', rotulo: 'Entrada de nota' }, { id: 'enviar', rotulo: 'Enviar', contador: emTransito }, { id: 'estoque', rotulo: 'Estoque' }]}
          valor={aba}
          onChange={setAba}
        />
        {aba === 'nota' && <EntradaNota operador={operador} />}
        {aba === 'enviar' && <Enviar operador={operador} />}
        {aba === 'estoque' && <EstoqueCentral />}
      </div>
    </Layout>
  )
}

// ---------------- Entrada de nota ----------------
const ordemBipe = ['coca-2l', 'heineken', 'guarana-2l', 'arroz', 'coca-lata', 'brahma', 'feijao', 'agua', 'oleo', 'macarrao', 'farinha', 'suco']

function EntradaNota({ operador }: { operador: string }) {
  const [fornecedorId, setFornecedorId] = useState(fornecedores[2]!.id)
  const [numero, setNumero] = useState('')
  const [data, setData] = useState(new Date().toISOString().slice(0, 10))
  const [itens, setItens] = useState<ItemNota[]>([])
  const [bipando, setBipando] = useState(false)
  const [nBipe, setNBipe] = useState(0)
  const [porPeso, setPorPeso] = useState(false)

  const proximoBipe = ordemBipe[nBipe % ordemBipe.length]!
  const total = arred(itens.reduce((s, i) => s + i.quantidade * i.custoUnitario, 0))

  const adicionar = (produtoId: string, quantidade: number, custoUnitario?: number) => {
    setItens((its) => {
      const p = getProduto(produtoId)
      const existe = its.find((i) => i.produtoId === produtoId)
      if (existe && p.unidadeMedida === 'un') return its.map((i) => (i.produtoId === produtoId ? { ...i, quantidade: i.quantidade + quantidade } : i))
      return [...its, { produtoId, quantidade, custoUnitario: custoUnitario ?? p.custo }]
    })
  }

  const lancar = async () => {
    const n = await lancarNota({ fornecedorId, numero: numero || String(Math.floor(10000 + Math.random() * 89999)), data, itens, por: operador })
    toast({ tipo: 'sucesso', titulo: `Nota ${n.numero} lançada · ${formatBRL(n.total)}`, texto: `${itens.length} itens entraram no estoque da Central.` })
    setItens([])
    setNumero('')
  }

  return (
    <div className="space-y-4 pb-4">
      <Card className="p-4 grid gap-3 sm:grid-cols-3">
        <label className="sm:col-span-3">
          <span className="label">Fornecedor</span>
          <select className="input" value={fornecedorId} onChange={(e) => setFornecedorId(e.target.value)}>
            {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className="label">Nº da nota</span>
          <input className="input num" inputMode="numeric" placeholder="Ex.: 48213" value={numero} onChange={(e) => setNumero(e.target.value.replace(/\D/g, ''))} />
        </label>
        <label>
          <span className="label">Data</span>
          <input className="input" type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </label>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Button variante="dark" tamanho="lg" onClick={() => setBipando(true)}><Barcode size={22} /> Bipar</Button>
        <Button variante="secondary" tamanho="lg" onClick={() => setPorPeso(true)}><Scale size={22} /> Por peso</Button>
      </div>

      <Card>
        {itens.length === 0 ? (
          <Vazio icone={<FileText size={26} />} titulo="Nenhum item na nota" texto="Bipe os produtos ou adicione carne por peso." />
        ) : (
          <div className="divide-y divide-surface-line">
            {itens.map((i, k) => {
              const p = getProduto(i.produtoId)
              return (
                <div key={`${i.produtoId}-${k}`} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{p.nome}</p>
                    <p className="num text-xs text-muted">
                      {p.codigoBarras ? `${p.codigoBarras} · ` : ''}{formatBRL(i.custoUnitario)}{p.unidadeMedida === 'kg' ? '/kg' : '/un'}
                    </p>
                  </div>
                  {p.unidadeMedida === 'un' ? (
                    <Stepper valor={i.quantidade} min={1} max={999} onChange={(v) => setItens((its) => its.map((x, j) => (j === k ? { ...x, quantidade: v } : x)))} />
                  ) : (
                    <span className="num font-semibold">{formatKg(i.quantidade)}</span>
                  )}
                  <span className="num font-bold w-24 text-right hidden min-[420px]:block">{formatBRL(i.quantidade * i.custoUnitario)}</span>
                  <button onClick={() => setItens((its) => its.filter((_, j) => j !== k))} aria-label={`Tirar ${p.nome}`} className="h-9 w-9 rounded-lg grid place-items-center text-muted hover:text-danger">
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            })}
            <div className="px-4 py-3 flex justify-between items-baseline bg-muted-light/60 rounded-b-2xl">
              <span className="font-bold">Total da nota</span>
              <span className="num text-2xl font-extrabold">{formatBRL(total)}</span>
            </div>
          </div>
        )}
      </Card>

      <Button bloco tamanho="lg" disabled={itens.length === 0} onClick={lancar}><PackageCheck size={20} /> Lançar nota</Button>

      <LeituraSimulada
        aberto={bipando}
        onFechar={() => setBipando(false)}
        valor={getProduto(proximoBipe).codigoBarras!}
        titulo="Bipar produto"
        instrucao="Aponte para o código de barras"
        onLido={() => {
          adicionar(proximoBipe, getProduto(proximoBipe).unidadeMedida === 'un' ? 12 : 1)
          toast({ tipo: 'sucesso', titulo: `${getProduto(proximoBipe).nome} adicionado`, texto: 'Fardo com 12 unidades. Ajuste a quantidade se precisar.' })
          setNBipe((n) => n + 1)
        }}
      />
      <ModalPorPeso aberto={porPeso} onFechar={() => setPorPeso(false)} onAdicionar={(id, kg, custo) => { adicionar(id, kg, custo); setPorPeso(false) }} />
    </div>
  )
}

function ModalPorPeso({ aberto, onFechar, onAdicionar }: { aberto: boolean; onFechar: () => void; onAdicionar: (id: string, kg: number, custo: number) => void }) {
  const carnes = produtos.filter((p) => p.categoria === 'carne')
  const [id, setId] = useState(carnes[0]!.id)
  const [kg, setKg] = useState('')
  const [custo, setCusto] = useState(String(carnes[0]!.custo).replace('.', ','))
  const v = parseNumero(kg)
  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo="Item por peso"
      rodape={<Button bloco tamanho="lg" disabled={v <= 0} onClick={() => { onAdicionar(id, v, parseNumero(custo)); setKg('') }}>Adicionar à nota</Button>}
    >
      <div className="space-y-3">
        <label className="block">
          <span className="label">Corte</span>
          <select className="input" value={id} onChange={(e) => { setId(e.target.value); setCusto(String(getProduto(e.target.value).custo).replace('.', ',')) }}>
            {carnes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="label">Peso (kg)</span>
            <input className="input num font-bold text-lg" inputMode="decimal" placeholder="0,000" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d,]/g, ''))} autoFocus />
          </label>
          <label>
            <span className="label">Custo por kg</span>
            <input className="input num" inputMode="decimal" value={custo} onChange={(e) => setCusto(e.target.value.replace(/[^\d,]/g, ''))} />
          </label>
        </div>
        {v > 0 && <p className="text-sm text-muted">Total do item: <b className="num text-ink">{formatBRL(v * parseNumero(custo))}</b></p>}
      </div>
    </Modal>
  )
}

// ---------------- Enviar para unidade ----------------
function Enviar({ operador }: { operador: string }) {
  const estoque = useEstoque('central')
  const sugestao = useProximoLacre()
  const transf = useTransferencias()
  const [destinoId, setDestinoId] = useState<UnidadeId>('gado-nobre')
  const [produtoId, setProdutoId] = useState('picanha')
  const [qtd, setQtd] = useState('')
  const [volumes, setVolumes] = useState(1)
  const [lacre, setLacre] = useState('')

  const p = getProduto(produtoId)
  const disponivel = estoque.find((e) => e.produtoId === produtoId)?.quantidade ?? 0
  const q = parseNumero(qtd)
  const lacreFinal = (lacre || sugestao).toUpperCase()
  const lacreRepetido = transf.some((t) => t.lacre === lacreFinal)

  const emTransito = transf.filter((t) => t.status === 'em_transito')
  const entregues = transf.filter((t) => t.status !== 'em_transito' && t.recebidoEm && ehHoje(t.recebidoEm))

  const enviar = async () => {
    if (q > disponivel) {
      toast({ tipo: 'erro', titulo: 'Estoque insuficiente', texto: `A Central tem ${qtdTexto(produtoId, disponivel)} de ${p.nome}.` })
      return
    }
    const t = await enviarTransferencia({ destinoId, produtoId, quantidade: q, volumes, lacre: lacreFinal, por: operador })
    toast({ tipo: 'sucesso', titulo: `Transferência enviada · lacre ${t.lacre}`, texto: `${qtdTexto(produtoId, q)} de ${p.nome} para ${getUnidade(destinoId).nome}. Já aparece no recebimento de lá.` })
    setQtd('')
    setLacre('')
    setVolumes(1)
  }

  return (
    <div className="space-y-5 pb-4">
      <Card className="p-4 space-y-3">
        <label className="block">
          <span className="label">Destino</span>
          <select className="input" value={destinoId} onChange={(e) => setDestinoId(e.target.value as UnidadeId)}>
            {unidadesRestaurante.map((u) => <option key={u.id} value={u.id}>{u.nome} · {u.cidade}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="label">Produto</span>
          <select className="input" value={produtoId} onChange={(e) => setProdutoId(e.target.value)}>
            {estoque.map((e) => <option key={e.produtoId} value={e.produtoId}>{e.produto.nome} · {qtdTexto(e.produtoId, e.quantidade)}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="label">{p.unidadeMedida === 'kg' ? 'Peso (kg)' : 'Quantidade'}</span>
            <input className="input num font-bold text-lg" inputMode="decimal" placeholder={p.unidadeMedida === 'kg' ? '0,000' : '0'} value={qtd} onChange={(e) => setQtd(e.target.value.replace(/[^\d,]/g, ''))} />
          </label>
          <div>
            <span className="label">Volumes</span>
            <Stepper valor={volumes} onChange={setVolumes} min={1} max={20} />
          </div>
        </div>
        <label className="block">
          <span className="label">Nº do lacre</span>
          <input className="input font-mono uppercase tracking-wider" value={lacre} placeholder={sugestao} onChange={(e) => setLacre(e.target.value)} />
          <span className="text-xs text-muted mt-1 block">
            {lacre ? 'Lacre digitado manualmente.' : `Gerado automaticamente: ${sugestao}. Pode trocar pelo nº do lacre físico.`}
          </span>
          {lacreRepetido && <span className="text-xs text-danger font-semibold mt-1 block">Esse lacre já foi usado.</span>}
        </label>
        <Button bloco tamanho="lg" disabled={q <= 0 || lacreRepetido} onClick={enviar}><Send size={20} /> Enviar</Button>
        <p className="text-xs text-muted">O peso fica registrado aqui, mas quem recebe <b>não vê</b>: precisa pesar e digitar.</p>
      </Card>

      <Secao titulo={<span className="flex items-center gap-2"><Truck size={18} /> Em trânsito <Badge cor="primary">{emTransito.length}</Badge></span>}>
        <ListaTransf itens={emTransito} />
      </Secao>
      <Secao titulo={<span className="flex items-center gap-2"><PackageCheck size={18} /> Entregues hoje</span>}>
        <ListaTransf itens={entregues} />
      </Secao>
    </div>
  )
}

function ListaTransf({ itens }: { itens: ReturnType<typeof useTransferencias> }) {
  if (itens.length === 0) return <Card><p className="p-4 text-sm text-muted">Nada por aqui.</p></Card>
  return (
    <Card className="divide-y divide-surface-line">
      {itens.map((t) => {
        const u = getUnidade(t.destinoId)
        return (
          <div key={t.id} className="px-4 py-3 flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: u.cor }} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate"><span className="font-mono">{t.lacre}</span> · {getProduto(t.produtoId).nome}</p>
              <p className="text-xs text-muted truncate">
                {u.nome} {u.tipo === 'chapa-buffet' ? u.cidade : ''} · enviado {formatQuando(t.enviadoEm)} por {t.enviadoPor}
                {t.recebidoPor && <> · conferido por {t.recebidoPor}</>}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="num font-bold text-sm">{qtdTexto(t.produtoId, t.quantidadeEnviada)}</p>
              {t.status === 'em_transito' && <Badge cor="amarelo">Aguardando</Badge>}
              {t.status === 'conferido' && <Badge cor="verde"><CheckCircle2 size={12} /> Conferido</Badge>}
              {t.status === 'divergencia' && (
                <Badge cor="vermelho"><AlertOctagon size={12} /> {t.quantidadeRecebida !== undefined ? qtdTexto(t.produtoId, t.quantidadeRecebida) : 'Divergência'}</Badge>
              )}
            </div>
          </div>
        )
      })}
    </Card>
  )
}

// ---------------- Estoque ----------------
function EstoqueCentral() {
  const estoque = useEstoque('central')
  const grupos = useMemo(() => ([
    { titulo: 'Carnes', itens: estoque.filter((e) => e.produto.categoria === 'carne') },
    { titulo: 'Bebidas', itens: estoque.filter((e) => e.produto.categoria === 'bebida') },
    { titulo: 'Mercearia', itens: estoque.filter((e) => e.produto.categoria === 'mercearia') },
  ]), [estoque])
  return (
    <div className="space-y-5 pb-4">
      {grupos.map((g) => (
        <Secao key={g.titulo} titulo={g.titulo}>
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted-light/70 text-muted text-xs">
                <tr>
                  <th className="text-left font-semibold px-4 py-2">Produto</th>
                  <th className="text-right font-semibold px-2 py-2">Estoque</th>
                  <th className="text-right font-semibold px-2 py-2 hidden min-[420px]:table-cell">Mínimo</th>
                  <th className="text-right font-semibold px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-line">
                {g.itens.map((e) => {
                  const baixo = e.quantidade < e.minimo
                  return (
                    <tr key={e.produtoId}>
                      <td className="px-4 py-2.5 font-medium">{e.produto.nome}</td>
                      <td className={`px-2 py-2.5 text-right num font-semibold ${baixo ? 'text-warning' : ''}`}>{qtdTexto(e.produtoId, e.quantidade)}</td>
                      <td className="px-2 py-2.5 text-right num text-muted hidden min-[420px]:table-cell">{qtdTexto(e.produtoId, e.minimo)}</td>
                      <td className="px-4 py-2.5 text-right">{baixo ? <Badge cor="amarelo">Baixo</Badge> : <Badge cor="verde">OK</Badge>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>
        </Secao>
      ))}
    </div>
  )
}
