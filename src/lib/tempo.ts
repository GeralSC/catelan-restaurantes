/** ISO de hoje (ou de N dias atrás) num horário fixo. */
export const emHora = (hora: string, diasAtras = 0) => {
  const [h, m] = hora.split(':').map(Number)
  const d = new Date()
  d.setDate(d.getDate() - diasAtras)
  d.setHours(h!, m!, 0, 0)
  return d.toISOString()
}

/** ISO de N minutos atrás. */
export const minutosAtras = (min: number) => new Date(Date.now() - min * 60_000).toISOString()

export const agoraISO = () => new Date().toISOString()

export const dataISO = (diasAtras = 0) => {
  const d = new Date()
  d.setDate(d.getDate() - diasAtras)
  return d.toISOString().slice(0, 10)
}

let seq = 0
export const novoId = (prefixo: string) => `${prefixo}-${Date.now().toString(36)}-${(seq++).toString(36)}`

/** Gerador pseudo-aleatório determinístico (mesmos números a cada carregamento). */
export const criarAleatorio = (semente: number) => {
  let s = semente
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

/** Está dentro do horário de funcionamento? Horários "HH:MM". */
export const dentroDoHorario = (iso: string, abre: string, fecha: string) => {
  const d = new Date(iso)
  const min = d.getHours() * 60 + d.getMinutes()
  const [ah, am] = abre.split(':').map(Number)
  const [fh, fm] = fecha.split(':').map(Number)
  return min >= ah! * 60 + am! && min <= fh! * 60 + fm!
}
