# Status · 08/11/2026 (madrugada)

## 1. Pronto e funcionando

Testado no navegador em 375px (celular) e 1280px (desktop), sem rolagem horizontal e sem erro no console.
`npm run build` passa sem erros.

- **Entrar como** (`/`): 7 perfis, selo com nº de alertas na Dona, rodapé "Protótipo de demonstração".
- **Recebimento com lacre**: lista "Aguardando recebimento" sem peso, busca por nº ou câmera simulada, teclado numérico grande,
  tela verde (dentro de 2%) ou vermelha (enviado, recebido, diferença, R$ estimado, "A dona foi notificada").
- **Painel da dona**: saudação, filtro por unidade, alertas no topo, faturamento consolidado vs. semana passada, cards por unidade,
  gráfico empilhado de 7 dias, carne (kg e R$/kg), estoque crítico, últimos pedidos online.
- **Modo TV**: fundo escuro, relógio, números grandes, botão de tela cheia, variação simulada a cada 10s, faixa de alertas.
- **Garçom**: 30 mesas (8 abertas, 2 pedindo conta), abrir mesa com adultos/crianças já lançando rodízios, bebidas com busca,
  +/− grandes, total no rodapé, pedir conta, histórico com quem lançou/cancelou e quando.
- **Caixa**: mesas pedindo conta + busca, resumo com cancelados riscados, dividir igual ou valor manual, pagamento misto,
  troco em dinheiro, marmitas no balcão, fechamento com sobra/falta em verde/vermelho (gera alerta).
- **Freezer**: quem retira > corte > kg, estoque cai, toast com nome e hora, últimas 24h, alerta fora do horário (já tem um às 23:15).
- **Central**: entrada de nota (bipar simulado e item por peso), envio com lacre automático editável, em trânsito / entregues hoje, estoque.
- **Pedido online**: cardápio com categorias, carrinho flutuante, checkout com taxa automática por bairro, Pix/cartão/dinheiro com troco,
  confirmação nº 1047 com acompanhamento que avança sozinho.
- **Estado conectado**: Central > Recebimento > Painel; Garçom > Caixa > Painel; Freezer > Painel; Pedido > Painel.
  Roteiro completo testado (com os valores: divergência R$ 149,80; mesa 5 R$ 387,60 dividida em 2x R$ 193,80; pedido R$ 46 + R$ 7).
- **Backend preparado (não conectado)**:
  - `src/services/`: única camada que as telas usam (`useMesas`, `abrirMesa`, `registrarRecebimento`, `enviarTransferencia`...).
  - `src/types/`: tipos de todas as entidades.
  - `supabase/migrations/001_schema.sql`: 23 tabelas, índices, RLS por perfil e unidade, view de peso cego, funções
    `registrar_recebimento`, `enviar_transferencia`, `criar_pedido_online`, triggers de alerta e de imutabilidade.
  - `supabase/seed.sql`: gerado dos mesmos mocks.
  - **Schema e seed foram executados num Postgres de verdade (PGlite)** e as regras testadas: peso cego/conferência, alerta de divergência
    (R$ 149,80), bloqueio de apagar movimento, freezer fora do horário, envio com lacre automático, pedido com taxa calculada no banco,
    alerta de falta no caixa.

## 2. Incompleto ou com ressalva

- **As políticas RLS não foram testadas com usuários reais** (o teste rodou como superusuário). Testar no Supabase com um usuário de cada perfil.
- Os textos de alerta gerados pelo banco saem com ponto decimal (`10.000 kg`) dependendo do locale do servidor; no front sai certo.
- Os hooks de `src/services/` ainda leem do Zustand; para o Supabase precisa de cache + tempo real (sugestão: TanStack Query + `supabase.channel`).
- Fotos dos pratos, logos e cores reais dos restaurantes: placeholders.
- Se a demo for antes das 11h, algumas vendas do mock aparecem com horário futuro (ver DECISOES nº 25).
- Não testei em iPhone real: no Safari do iPhone o botão "tela cheia" do Modo TV não funciona (limitação do iOS), o resto deve funcionar.

## 3. Decisões principais (detalhes em `DECISOES.md`)

- Git local com autor `DesenvolveSolucoes`; nada publicado em lugar nenhum.
- Vendas de hoje = mesmo dia da semana passada com variação fixa (comparativo sempre faz sentido).
- Freezer permitido de 2h antes de abrir até fechar; diferença de caixa vira alerta a partir de R$ 1.
- Na divergência entra no estoque o peso conferido; tolerância de 2% para mais e para menos.
- Botão "−" da comanda cancela e deixa riscado, nunca apaga.
- Alertas só a dona vê; funcionários do freezer se identificam tocando no nome (PIN opcional depois).

## 4. Amanhã: subir na Vercel e (quando quiser) ligar o Supabase

### Subir o protótipo (o que precisa para 13/11)
1. Ver rodando: `npm install` e `npm run dev`.
2. Criar repositório **privado** no GitHub (conta que preferir) e dar push:
   `git remote add origin <url>` e `git push -u origin main`.
3. Vercel > Add New > Project > importar o repositório > Deploy (nenhuma variável necessária).
4. Testar no celular: abrir direto `<seu-link>/garcom` e `<seu-link>/painel/tv` para confirmar as rotas.

### Ligar o Supabase (depois de fechar o contrato)
1. Criar projeto no Supabase (região São Paulo).
2. SQL Editor: colar e rodar `supabase/migrations/001_schema.sql`, depois `supabase/seed.sql`.
   (Ou com a CLI: `npx supabase link --project-ref <ref>` e `npx supabase db push`.)
3. Authentication > Users: criar um usuário por perfil/aparelho e, para cada um, inserir em `usuarios`
   (`id` do auth, `nome`, `perfil`, `unidade_id`; a dona fica com `unidade_id` nulo).
4. Copiar `.env.example` para `.env.local` e preencher `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
   (os mesmos dois na Vercel > Settings > Environment Variables).
5. `npm i @supabase/supabase-js`, criar `src/lib/supabase.ts` e trocar, arquivo por arquivo, a implementação de `src/services/`
   (as telas não mudam). Trocar o seletor de perfil por login.
6. Testar o RLS entrando com cada usuário.

## 5. Próximos passos sugeridos

1. Trocar placeholders por logos, cores e fotos reais dos restaurantes antes da demo, se der tempo.
2. Ensaiar o roteiro do README no celular que vai ser usado na apresentação.
3. Pós-contrato: login, Supabase, impressão da comanda/cupom, relatórios por período, cadastro de cardápio/preços pela dona,
   inventário com estorno, integração com maquininha e com WhatsApp para os alertas da dona.
