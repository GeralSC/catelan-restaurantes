import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftRight, ChevronDown } from 'lucide-react'
import { getPerfil } from '../data/perfis'
import { getUnidade, unidades } from '../data/cadastros'
import type { Perfil, UnidadeId } from '../types'

interface Props {
  perfil: Perfil
  unidadeId?: UnidadeId
  onTrocarUnidade?: (u: UnidadeId) => void
  opcoesUnidade?: UnidadeId[]
  subtitulo?: string
  children: ReactNode
  largura?: string
  rodape?: ReactNode
}

/** Moldura padrão das telas internas: header com perfil, unidade e "Trocar perfil". */
export function Layout({ perfil, unidadeId, onTrocarUnidade, opcoesUnidade, subtitulo, children, largura = 'max-w-3xl', rodape }: Props) {
  const nav = useNavigate()
  const p = getPerfil(perfil)
  const u = unidadeId ? getUnidade(unidadeId) : undefined
  const Icone = p.icone
  const opcoes = opcoesUnidade ?? unidades.filter((x) => x.tipo !== 'central').map((x) => x.id)

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-surface-line">
        <div className={`mx-auto ${largura} px-4 h-16 flex items-center gap-3`}>
          <span className="h-10 w-10 rounded-full grid place-items-center text-white shrink-0" style={{ background: u?.cor ?? p.cor }}>
            <Icone size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold leading-tight truncate">{p.nome}{perfil === 'dona' ? ` · ${p.quem}` : ''}</p>
            {u && onTrocarUnidade ? (
              <label className="relative inline-flex items-center gap-1 text-sm text-muted max-w-full">
                <span className="truncate">{u.nome} · {u.cidade}</span>
                <ChevronDown size={14} className="shrink-0" />
                <select
                  aria-label="Trocar unidade"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  value={unidadeId}
                  onChange={(e) => onTrocarUnidade(e.target.value as UnidadeId)}
                >
                  {opcoes.map((id) => {
                    const x = getUnidade(id)
                    return <option key={id} value={id}>{x.nome} · {x.cidade}</option>
                  })}
                </select>
              </label>
            ) : (
              <p className="text-sm text-muted truncate">{u ? `${u.nome} · ${u.cidade}` : subtitulo}</p>
            )}
          </div>
          <button
            onClick={() => nav('/')}
            aria-label="Trocar perfil"
            className="h-10 px-3 rounded-xl border border-surface-line text-sm font-semibold flex items-center gap-1.5 hover:bg-muted-light shrink-0"
          >
            <ArrowLeftRight size={16} />
            <span className="hidden min-[400px]:inline">Trocar perfil</span>
            <span className="min-[400px]:hidden">Perfil</span>
          </button>
        </div>
      </header>
      <main className={`flex-1 w-full mx-auto ${largura} px-4 py-4`}>{children}</main>
      {rodape}
    </div>
  )
}
