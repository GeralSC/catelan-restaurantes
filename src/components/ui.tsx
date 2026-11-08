import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Minus, Plus, X } from 'lucide-react'
import { iniciais } from '../lib/format'

type Variante = 'primary' | 'secondary' | 'ghost' | 'success' | 'danger' | 'dark'

const variantes: Record<Variante, string> = {
  primary: 'bg-primary text-white hover:bg-primary-dark active:bg-primary-dark shadow-sm',
  secondary: 'bg-white text-ink border border-surface-line hover:bg-muted-light active:bg-muted-light',
  ghost: 'bg-transparent text-ink-soft hover:bg-muted-light active:bg-muted-light',
  success: 'bg-success text-white hover:brightness-95 shadow-sm',
  danger: 'bg-danger text-white hover:brightness-95 shadow-sm',
  dark: 'bg-ink text-white hover:bg-ink-soft shadow-sm',
}

export function Button({
  variante = 'primary', tamanho = 'md', bloco, className = '', children, ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; tamanho?: 'sm' | 'md' | 'lg'; bloco?: boolean }) {
  const t = tamanho === 'sm' ? 'h-10 px-3 text-sm' : tamanho === 'lg' ? 'h-14 px-6 text-lg' : 'h-12 px-5 text-base'
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition select-none
        disabled:opacity-40 disabled:pointer-events-none active:scale-[.98] ${t} ${variantes[variante]} ${bloco ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  )
}

export function Card({ className = '', children, onClick }: { className?: string; children: ReactNode; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`card ${onClick ? 'cursor-pointer active:scale-[.99] transition' : ''} ${className}`}>
      {children}
    </div>
  )
}

const coresBadge = {
  cinza: 'bg-muted-light text-ink-soft',
  verde: 'bg-success-light text-success',
  vermelho: 'bg-danger-light text-danger',
  amarelo: 'bg-warning-light text-warning',
  primary: 'bg-primary-light text-primary',
  escuro: 'bg-ink text-white',
}
export function Badge({ cor = 'cinza', children, className = '' }: { cor?: keyof typeof coresBadge; children: ReactNode; className?: string }) {
  return <span className={`chip ${coresBadge[cor]} ${className}`}>{children}</span>
}

export function Avatar({ nome, cor = '#B91C1C', tamanho = 40 }: { nome: string; cor?: string; tamanho?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-bold text-white shrink-0"
      style={{ background: cor, width: tamanho, height: tamanho, fontSize: tamanho * 0.38 }}
    >
      {iniciais(nome)}
    </span>
  )
}

export function Modal({
  aberto, onFechar, titulo, children, rodape, largura = 'max-w-lg',
}: { aberto: boolean; onFechar: () => void; titulo?: ReactNode; children: ReactNode; rodape?: ReactNode; largura?: string }) {
  useEffect(() => {
    if (!aberto) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onFechar()
    document.addEventListener('keydown', esc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', esc)
      document.body.style.overflow = ''
    }
  }, [aberto, onFechar])
  if (!aberto) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-ink/50 animate-fade-in" onClick={onFechar} />
      <div className={`relative w-full ${largura} bg-white rounded-t-3xl sm:rounded-2xl shadow-float animate-slide-up max-h-[92dvh] flex flex-col`}>
        <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
          <h2 className="text-lg font-bold">{titulo}</h2>
          <button onClick={onFechar} aria-label="Fechar" className="h-10 w-10 -mr-2 rounded-full grid place-items-center hover:bg-muted-light">
            <X size={20} />
          </button>
        </div>
        <div className="px-5 pb-5 overflow-y-auto">{children}</div>
        {rodape && <div className="px-5 py-4 border-t border-surface-line pb-safe">{rodape}</div>}
      </div>
    </div>
  )
}

export function Stepper({ valor, onChange, min = 0, max = 99, grande }: { valor: number; onChange: (v: number) => void; min?: number; max?: number; grande?: boolean }) {
  const s = grande ? 'h-14 w-14' : 'h-11 w-11'
  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button" aria-label="Diminuir" disabled={valor <= min} onClick={() => onChange(Math.max(min, valor - 1))}
        className={`${s} rounded-xl border border-surface-line bg-white grid place-items-center active:scale-95 disabled:opacity-30`}
      >
        <Minus size={grande ? 22 : 18} />
      </button>
      <span className={`num font-bold text-center ${grande ? 'text-3xl w-14' : 'text-lg w-8'}`}>{valor}</span>
      <button
        type="button" aria-label="Aumentar" disabled={valor >= max} onClick={() => onChange(Math.min(max, valor + 1))}
        className={`${s} rounded-xl bg-primary text-white grid place-items-center active:scale-95 disabled:opacity-30`}
      >
        <Plus size={grande ? 22 : 18} />
      </button>
    </div>
  )
}

export function Abas<T extends string>({ abas, valor, onChange }: { abas: Array<{ id: T; rotulo: string; contador?: number }>; valor: T; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-1 p-1 bg-muted-light rounded-xl overflow-x-auto no-scrollbar">
      {abas.map((a) => (
        <button
          key={a.id}
          onClick={() => onChange(a.id)}
          className={`flex-1 min-w-fit whitespace-nowrap h-10 px-3 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1.5
            ${valor === a.id ? 'bg-white shadow-sm text-ink' : 'text-muted hover:text-ink'}`}
        >
          {a.rotulo}
          {a.contador ? <span className="num text-xs bg-primary text-white rounded-full px-1.5 min-w-5 h-5 inline-flex items-center justify-center">{a.contador}</span> : null}
        </button>
      ))}
    </div>
  )
}

export function Vazio({ icone, titulo, texto }: { icone: ReactNode; titulo: string; texto?: string }) {
  return (
    <div className="text-center py-10 px-6">
      <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-muted-light text-muted grid place-items-center">{icone}</div>
      <p className="font-semibold">{titulo}</p>
      {texto && <p className="text-sm text-muted mt-1">{texto}</p>}
    </div>
  )
}

export function Secao({ titulo, acao, children, className = '' }: { titulo: ReactNode; acao?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={className}>
      <div className="flex items-center justify-between mb-2.5 gap-2">
        <h2 className="text-[15px] font-bold text-ink">{titulo}</h2>
        {acao}
      </div>
      {children}
    </section>
  )
}

/** Dica discreta exibida só no protótipo. */
export function DicaProtótipo({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2 items-start text-xs text-muted bg-muted-light/70 border border-dashed border-surface-line rounded-xl px-3 py-2">
      <span className="mt-px h-4 w-4 shrink-0 rounded-full border border-muted grid place-items-center text-[10px] font-bold">i</span>
      <span>{children}</span>
    </div>
  )
}
