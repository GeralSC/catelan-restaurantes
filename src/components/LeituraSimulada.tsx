import { useEffect, useRef, useState } from 'react'
import { ScanLine } from 'lucide-react'
import { Modal } from './ui'

/** Modal que imita a câmera lendo um código. Depois de ~1,4s devolve o valor. */
export function LeituraSimulada({
  aberto, onFechar, onLido, valor, titulo = 'Leitura simulada', instrucao = 'Aponte a câmera para o código',
}: { aberto: boolean; onFechar: () => void; onLido: (v: string) => void; valor: string; titulo?: string; instrucao?: string }) {
  const [lido, setLido] = useState(false)
  const cb = useRef({ onLido, onFechar, valor })
  cb.current = { onLido, onFechar, valor }
  useEffect(() => {
    if (!aberto) return setLido(false)
    const t1 = setTimeout(() => setLido(true), 1400)
    const t2 = setTimeout(() => {
      cb.current.onLido(cb.current.valor)
      cb.current.onFechar()
    }, 2100)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [aberto])

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo={titulo}>
      <div className="relative aspect-[4/3] rounded-2xl bg-ink overflow-hidden grid place-items-center">
        <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 50% 40%, #57534e, #0c0a09 70%)' }} />
        <div className="relative w-3/4 h-1/2 rounded-xl border-2 border-white/70">
          <span className="absolute -top-0.5 -left-0.5 h-5 w-5 border-t-4 border-l-4 border-white rounded-tl-lg" />
          <span className="absolute -top-0.5 -right-0.5 h-5 w-5 border-t-4 border-r-4 border-white rounded-tr-lg" />
          <span className="absolute -bottom-0.5 -left-0.5 h-5 w-5 border-b-4 border-l-4 border-white rounded-bl-lg" />
          <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 border-b-4 border-r-4 border-white rounded-br-lg" />
          {!lido && <span className="absolute left-2 right-2 h-0.5 bg-primary shadow-[0_0_12px_#ef4444] animate-[scan_1.2s_ease-in-out_infinite]" />}
          {lido && (
            <div className="absolute inset-0 grid place-items-center animate-pop">
              <span className="bg-success text-white font-mono font-bold px-3 py-1.5 rounded-lg text-lg">{valor}</span>
            </div>
          )}
        </div>
        <style>{`@keyframes scan{0%,100%{top:10%}50%{top:88%}}`}</style>
      </div>
      <p className="text-center text-sm text-muted mt-3 flex items-center justify-center gap-2">
        <ScanLine size={16} /> {lido ? 'Código lido' : instrucao}
      </p>
      <p className="text-center text-xs text-muted mt-1">No protótipo a leitura é simulada.</p>
    </Modal>
  )
}
