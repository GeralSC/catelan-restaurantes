import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useUI } from '../store/useUI'

const estilos = {
  sucesso: { cls: 'bg-ink text-white', icone: <CheckCircle2 size={20} className="text-green-400" /> },
  info: { cls: 'bg-ink text-white', icone: <Info size={20} className="text-sky-300" /> },
  alerta: { cls: 'bg-danger text-white ring-4 ring-danger/20', icone: <AlertTriangle size={20} /> },
  erro: { cls: 'bg-danger text-white', icone: <XCircle size={20} /> },
}

export function Toaster() {
  const toasts = useUI((s) => s.toasts)
  const fechar = useUI((s) => s.fecharToast)
  return (
    <div className="fixed z-[60] top-3 inset-x-0 px-3 flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((t) => {
        const e = estilos[t.tipo]
        return (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto w-full max-w-md rounded-2xl shadow-float px-4 py-3 flex items-start gap-3 animate-slide-up ${e.cls}`}
          >
            <span className="mt-0.5 shrink-0">{e.icone}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold leading-snug">{t.titulo}</p>
              {t.texto && <p className="text-sm opacity-85 leading-snug mt-0.5">{t.texto}</p>}
            </div>
            <button onClick={() => fechar(t.id)} aria-label="Fechar aviso" className="shrink-0 opacity-70 hover:opacity-100 -mr-1 h-7 w-7 grid place-items-center">
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
