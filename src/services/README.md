# Camada de dados

As telas só importam daqui. Hoje cada função lê/escreve no estado em memória (`src/store/useDados.ts`).
Para ligar o Supabase, troque a implementação **destes arquivos** (mesmas assinaturas):

- Funções `async` (mutações) viram chamadas `supabase.from(...).insert/update` ou `supabase.rpc(...)`.
- Hooks `useXxx` (leitura) viram consultas com cache (ex.: TanStack Query) + `supabase.channel()` para tempo real.

Regras que já estão aqui e precisam continuar valendo no banco:

- `useTransferenciasAguardando` e `buscarLacre` nunca devolvem o peso enviado (peso cego).
  No banco: view `transferencias_cegas` + RPC `registrar_recebimento` (ver `supabase/migrations/001_schema.sql`).
- Nada é apagado: cancelamentos marcam o registro (`cancelado_por`, `cancelado_em`); estoque só muda por movimento.
