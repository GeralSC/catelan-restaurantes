// Gera supabase/seed.sql a partir dos MESMOS mocks do protótipo (src/data).
// Uso: npm run seed:gerar
import { writeFileSync } from 'node:fs'
import { bairros, cardapio, fornecedores, funcionarios, produtos, unidades } from '../src/data/cadastros'
import { estoqueInicial, transferenciasIniciais } from '../src/data/inicial'

const q = (v: unknown): string => {
  if (v === null || v === undefined) return 'null'
  if (typeof v === 'number') return String(v)
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  return `'${String(v).replace(/'/g, "''")}'`
}
const linhas: string[] = []
const ins = (tabela: string, cols: string[], rows: unknown[][]) => {
  if (!rows.length) return
  linhas.push(`insert into ${tabela} (${cols.join(', ')}) values\n${rows.map((r) => `  (${r.map(q).join(', ')})`).join(',\n')};\n`)
}

linhas.push('-- Gerado por scripts/gerar-seed.ts a partir de src/data. Não edite à mão.\n-- Dados fictícios do protótipo.\n')

ins('unidades', ['id', 'nome', 'cidade', 'tipo', 'descricao', 'cor', 'horario_abertura', 'horario_fechamento', 'total_mesas'],
  unidades.map((u) => [u.id, u.nome, u.cidade, u.tipo, u.descricao, u.cor, u.horarioAbertura, u.horarioFechamento, u.totalMesas]))

ins('funcionarios', ['nome', 'funcao', 'unidade_id'], funcionarios.map((f) => [f.nome, f.funcao, f.unidadeId]))

ins('produtos', ['id', 'nome', 'categoria', 'unidade_medida', 'codigo_barras', 'custo', 'preco_venda'],
  produtos.map((p) => [p.id, p.nome, p.categoria, p.unidadeMedida, p.codigoBarras ?? null, p.custo, p.precoVenda ?? null]))

ins('fornecedores', ['nome', 'cnpj'], fornecedores.map((f) => [f.nome, f.cnpj]))

ins('bairros', ['id', 'unidade_id', 'nome', 'taxa'], bairros.map((b) => [b.id, b.unidadeId, b.nome, b.taxa]))

const online = new Set(['marmitas', 'executivos', 'sobremesas'])
const bebidasOnline = new Set(['beb-coca-lata', 'beb-coca-2l', 'beb-guarana-2l', 'beb-agua', 'beb-suco'])
ins('itens_cardapio', ['id', 'nome', 'descricao', 'categoria', 'preco', 'produto_id', 'disponivel_online'],
  cardapio.map((c) => [c.id, c.nome, c.descricao ?? null, c.categoria, c.preco, c.produtoId ?? null, online.has(c.categoria) || bebidasOnline.has(c.id)]))

// mesas
const mesas: unknown[][] = []
for (const u of unidades) for (let n = 1; n <= u.totalMesas; n++) mesas.push([u.id, n])
ins('mesas', ['unidade_id', 'numero'], mesas)

// Estoque inicial entra como movimento de inventário (o trigger monta o saldo); depois ajusta o mínimo.
ins('movimentos', ['unidade_id', 'produto_id', 'tipo', 'quantidade', 'feito_por_nome', 'referencia'],
  estoqueInicial.map((e) => [e.unidadeId, e.produtoId, 'ajuste_inventario', e.quantidade, 'Implantação', 'Estoque inicial']))
linhas.push(estoqueInicial.map((e) => `update estoque set minimo = ${e.minimo} where unidade_id = ${q(e.unidadeId)} and produto_id = ${q(e.produtoId)};`).join('\n') + '\n')

// Lacres e transferências em trânsito (para testar o recebimento)
const pend = transferenciasIniciais.filter((t) => t.status === 'em_transito')
ins('lacres', ['numero', 'status'], pend.map((t) => [t.lacre, 'usado']))
ins('transferencias', ['lacre', 'origem_id', 'destino_id', 'produto_id', 'quantidade_enviada', 'volumes', 'enviado_por_nome'],
  pend.map((t) => [t.lacre, t.origemId, t.destinoId, t.produtoId, t.quantidadeEnviada, t.volumes, t.enviadoPor]))

writeFileSync(new URL('../supabase/seed.sql', import.meta.url), linhas.join('\n'))
console.log('supabase/seed.sql gerado')
