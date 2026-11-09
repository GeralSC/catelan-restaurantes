import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, RotateCcw } from 'lucide-react'
import { Button, Modal } from '../components/ui'
import { toast } from '../store/useUI'
import { perfis } from '../data/perfis'
import { reiniciarDemonstracao, useAlertas } from '../services'

export default function Inicio() {
  const alertas = useAlertas().filter((a) => !a.lido)
  const [confirmar, setConfirmar] = useState(false)
  return (
    <div className="min-h-dvh flex flex-col">
      <div className="bg-ink text-white">
        <div className="mx-auto max-w-3xl px-5 pt-10 pb-16">
          <div className="flex items-center gap-2 text-white/60 text-sm font-medium">
            <span className="h-2 w-2 rounded-full bg-green-400" /> Sistema de gestão dos restaurantes
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mt-3 tracking-tight">Entrar como</h1>
          <p className="text-white/70 mt-2 max-w-md">
            Cada pessoa vê só a tela do seu trabalho. Escolha um perfil para ver o sistema por dentro.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-3xl w-full px-4 -mt-10 flex-1">
        <div className="grid sm:grid-cols-2 gap-3">
          {perfis.map((p) => {
            const Icone = p.icone
            const badge = p.id === 'dona' && alertas.length > 0
            return (
              <Link
                key={p.id}
                to={p.rota}
                className="card p-4 flex items-center gap-4 min-h-[88px] hover:shadow-float hover:-translate-y-0.5 transition active:scale-[.99]"
              >
                <span className="relative h-14 w-14 rounded-2xl grid place-items-center text-white shrink-0" style={{ background: p.cor }}>
                  <Icone size={26} />
                  {badge && (
                    <span className="num absolute -top-1.5 -right-1.5 h-6 min-w-6 px-1 rounded-full bg-danger text-white text-xs font-bold grid place-items-center ring-2 ring-white">
                      {alertas.length}
                    </span>
                  )}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-bold text-lg leading-tight">
                    {p.nome} <span className="font-medium text-muted text-base">({p.quem})</span>
                  </span>
                  <span className="block text-sm text-muted mt-0.5">{p.descricao}</span>
                </span>
                <ChevronRight className="text-muted shrink-0" size={20} />
              </Link>
            )
          })}
        </div>

        <div className="mt-6 card p-4 text-sm text-ink-soft">
          <p className="font-semibold text-ink">Como o protótipo funciona</p>
          <p className="mt-1">
            Tudo o que você faz em um perfil aparece nos outros: uma mercadoria enviada pela Central chega no
            Recebimento, uma divergência vira alerta no painel da dona, uma conta fechada no Caixa soma no faturamento.
          </p>
        </div>
      </main>

      <footer className="text-center text-xs text-muted py-6 px-4 space-y-3">
        <p>Protótipo de demonstração · dados fictícios · Desenvolve Soluções</p>
        <button
          onClick={() => setConfirmar(true)}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-muted hover:text-ink hover:bg-muted-light"
        >
          <RotateCcw size={14} /> Reiniciar demonstração
        </button>
      </footer>

      <Modal
        aberto={confirmar}
        onFechar={() => setConfirmar(false)}
        titulo="Reiniciar demonstração?"
        rodape={
          <div className="grid grid-cols-2 gap-2">
            <Button variante="secondary" onClick={() => setConfirmar(false)}>Cancelar</Button>
            <Button
              variante="dark"
              onClick={async () => {
                await reiniciarDemonstracao()
                setConfirmar(false)
                toast({ tipo: 'sucesso', titulo: 'Demonstração reiniciada', texto: 'Os dados voltaram ao início.' })
              }}
            >
              Reiniciar
            </Button>
          </div>
        }
      >
        <p className="text-ink-soft">
          Tudo o que foi feito nesta demonstração (envios, recebimentos, mesas, vendas, pedidos) é apagado deste aparelho
          e os dados fictícios voltam ao início.
        </p>
      </Modal>
    </div>
  )
}
