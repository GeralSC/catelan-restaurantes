import { Delete } from 'lucide-react'

/**
 * Teclado numérico grande para uso em pé (balança, freezer, caixa).
 * Trabalha com string em formato brasileiro ("12,450").
 */
export function Teclado({ valor, onChange, casas = 3, max = 9999 }: { valor: string; onChange: (v: string) => void; casas?: number; max?: number }) {
  const tecla = (t: string) => {
    if (t === 'apagar') return onChange(valor.slice(0, -1))
    if (t === ',') {
      if (casas === 0 || valor.includes(',')) return
      return onChange((valor || '0') + ',')
    }
    const [int, dec] = valor.split(',')
    if (dec !== undefined && dec.length >= casas) return
    const novo = valor === '0' ? t : valor + t
    const n = parseFloat(novo.replace(',', '.'))
    if (n > max) return
    if (dec === undefined && (int ?? '').length >= 5) return
    onChange(novo)
  }
  const teclas = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'apagar']
  return (
    <div className="grid grid-cols-3 gap-2">
      {teclas.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => tecla(t)}
          disabled={t === ',' && casas === 0}
          aria-label={t === 'apagar' ? 'Apagar' : t === ',' ? 'Vírgula' : t}
          className={`h-16 rounded-2xl text-2xl font-semibold num select-none transition active:scale-95 disabled:opacity-20
            ${t === 'apagar' ? 'bg-muted-light text-ink-soft grid place-items-center' : 'bg-white border border-surface-line shadow-sm active:bg-muted-light'}`}
        >
          {t === 'apagar' ? <Delete size={26} className="mx-auto" /> : t}
        </button>
      ))}
    </div>
  )
}

export function VisorNumero({ valor, sufixo, placeholder = '0' }: { valor: string; sufixo?: string; placeholder?: string }) {
  return (
    <div className="rounded-2xl bg-ink text-white px-5 py-4 flex items-baseline justify-end gap-2 min-h-[84px]">
      <span className={`num text-5xl font-bold tracking-tight ${valor ? '' : 'text-white/30'}`}>{valor || placeholder}</span>
      {sufixo && <span className="text-xl text-white/60 font-medium">{sufixo}</span>}
    </div>
  )
}
