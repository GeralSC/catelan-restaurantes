// "Dia de operação" do protótipo.
//
// Todos os dados fictícios são gerados em relação a um momento de referência, para nunca aparecer
// horário no futuro, em qualquer hora em que a demo for aberta:
//   - a partir das 11:30 (Gado Nobre aberto há meia hora): dia = hoje, momento = agora;
//   - antes disso (madrugada / manhã): dia = ontem, momento = ontem às 22:30
//     (como se fosse o fim do expediente do dia anterior).
// O que for feito durante a demo (vendas, retiradas...) usa a hora real e conta no mesmo dia de operação.

const INICIO_DIA_HOJE_MIN = 11 * 60 + 30
const FIM_DO_DIA_ANTERIOR = '22:30'

const meiaNoite = (d: Date) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

const dataLocal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function calcularReferencia(agoraReal = new Date()) {
  const min = agoraReal.getHours() * 60 + agoraReal.getMinutes()
  if (min >= INICIO_DIA_HOJE_MIN) {
    return { dia: meiaNoite(agoraReal), agora: new Date(agoraReal), ehHoje: true }
  }
  const dia = meiaNoite(agoraReal)
  dia.setDate(dia.getDate() - 1)
  const [h, m] = FIM_DO_DIA_ANTERIOR.split(':').map(Number)
  const agora = new Date(dia)
  agora.setHours(h!, m!, 0, 0)
  return { dia, agora, ehHoje: false }
}

export const REF = calcularReferencia()
/** Identificador do dia de operação (YYYY-MM-DD, horário local). */
export const DIA_REF = dataLocal(REF.dia)

/** O evento pertence ao dia de operação (ou aconteceu depois dele, durante a demo)? */
export const ehDiaOperacao = (iso: string) => new Date(iso).getTime() >= REF.dia.getTime()

/** YYYY-MM-DD (local) de N dias antes do dia de operação. */
export const dataRef = (diasAtras = 0) => {
  const d = new Date(REF.dia)
  d.setDate(d.getDate() - diasAtras)
  return dataLocal(d)
}

/** Converte "HH:MM" em minutos. */
export const paraMin = (hora: string) => {
  const [h, m] = hora.split(':').map(Number)
  return h! * 60 + m!
}

/** ISO no dia de operação (ou N dias antes) num horário em minutos desde a meia-noite. */
export const emMinRef = (minutos: number, diasAtras = 0) => {
  const d = new Date(REF.dia)
  d.setDate(d.getDate() - diasAtras)
  d.setMinutes(minutos)
  return d.toISOString()
}

/** Minutos desde a meia-noite do momento de referência. */
export const agoraMinRef = () => REF.agora.getHours() * 60 + REF.agora.getMinutes()

/** ISO de N minutos antes do momento de referência. */
export const antesDaRef = (min: number) => new Date(REF.agora.getTime() - min * 60_000).toISOString()

/**
 * Quanto do expediente da unidade já passou no momento de referência (0 a 1).
 * Usado para gerar o faturamento "até agora" e comparar com a semana passada no mesmo horário.
 */
export const fracaoExpediente = (abertura: string, fechamento: string) => {
  const a = paraMin(abertura)
  const f = paraMin(fechamento)
  return Math.min(1, Math.max(0, (agoraMinRef() - a) / (f - a)))
}

/** Rótulo do dia de operação no gráfico. */
export const rotuloDiaRef = REF.ehHoje ? 'Hoje' : 'Ontem'
