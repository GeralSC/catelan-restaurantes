const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const kgFmt = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
const intFmt = new Intl.NumberFormat('pt-BR')

export const formatBRL = (v: number) => brl.format(v).replace(/ /g, ' ')
export const formatKg = (v: number) => `${kgFmt.format(v)} kg`
export const formatInt = (v: number) => intFmt.format(v)
export const formatPct = (v: number, casas = 1) =>
  `${v > 0 ? '+' : ''}${(v * 100).toFixed(casas).replace('.', ',')}%`

export const formatHora = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

export const formatData = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

export const ehHoje = (iso: string) => new Date(iso).toDateString() === new Date().toDateString()

/** "hoje 10:42", "ontem 23:15" ou "05/11 14:00" */
export const formatQuando = (iso: string) => {
  const d = new Date(iso)
  const ontem = new Date()
  ontem.setDate(ontem.getDate() - 1)
  if (ehHoje(iso)) return `hoje ${formatHora(iso)}`
  if (d.toDateString() === ontem.toDateString()) return `ontem ${formatHora(iso)}`
  return `${formatData(iso)} ${formatHora(iso)}`
}

export const formatDataLonga = (d = new Date()) => {
  const s = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export const saudacao = (d = new Date()) => {
  const h = d.getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

/** Converte "12,5" ou "12.5" em número. */
export const parseNumero = (s: string) => {
  const n = parseFloat(s.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export const iniciais = (nome: string) =>
  nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')

export const arred = (v: number, casas = 2) => Math.round(v * 10 ** casas) / 10 ** casas
