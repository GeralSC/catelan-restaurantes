# Status · atualizado em 09/11/2026

Repositório (privado): https://github.com/GeralSC/catelan-restaurantes

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
- **Demo salva no aparelho** (localStorage, à prova de erro): recarregar não perde nada; vale só para o dia.
  Botão **Reiniciar demonstração** no rodapé da tela inicial (pede confirmação).
- **Horários sempre no passado**: os dados fictícios são gerados em relação à hora em que a demo é aberta.
  Antes das 11:30 mostra o dia anterior ("Faturamento de ontem"). O painel compara com a semana passada no mesmo horário.
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
- Abrindo a demo logo depois das 11:30, os números do dia são pequenos (o restaurante acabou de abrir). É o comportamento real.
- Colaborador em repositório de conta pessoal não pode ter papel "admin" no GitHub (só em organização): a DesenvolveSolucoes entrou como colaboradora padrão (lê, envia código, abre PR; não muda configurações nem apaga o repositório).
- Não testei em iPhone real: no Safari do iPhone o botão "tela cheia" do Modo TV não funciona (limitação do iOS), o resto deve funcionar.

## 3. Decisões principais (detalhes em `DECISOES.md`)

- Git local com autor `DesenvolveSolucoes`; nada publicado em lugar nenhum.
- Vendas de hoje = mesmo dia da semana passada com variação fixa (comparativo sempre faz sentido).
- Freezer permitido de 2h antes de abrir até fechar; diferença de caixa vira alerta a partir de R$ 1.
- Na divergência entra no estoque o peso conferido; tolerância de 2% para mais e para menos.
- Botão "−" da comanda cancela e deixa riscado, nunca apaga.
- Alertas só a dona vê; funcionários do freezer se identificam tocando no nome (PIN opcional depois).

## 4. Publicar na Vercel (na conta da Vercel do Jaum)

O código está em `GeralSC/catelan-restaurantes` (privado). A Vercel do Jaum precisa de permissão para ler esse repositório,
e quem dá essa permissão é a conta **dona** do repositório (GeralSC), instalando o app da Vercel nela.

### 4.1 Dar acesso do app da Vercel ao repositório da GeralSC
1. Num navegador logado no GitHub **como GeralSC** (se estiver em outra conta, use janela anônima), abra
   https://github.com/apps/vercel/installations/new
2. Escolha a conta **GeralSC**.
3. Marque **Only select repositories** e selecione `catelan-restaurantes`. Clique em **Install**.
4. Se o GitHub pedir para ligar a uma conta da Vercel, faça login com a **sua** conta da Vercel (não crie uma para o cliente).

### 4.2 Importar o projeto na sua Vercel
1. Entre em https://vercel.com com a **sua** conta > **Add New... > Project**.
2. Em "Import Git Repository", abra o seletor de conta do GitHub. Se **GeralSC** não aparecer, clique em
   **Add GitHub Account** (ou "Adjust GitHub App Permissions") e conclua o passo 4.1.
3. Escolha `GeralSC/catelan-restaurantes` > **Import**.
4. Configurações (a Vercel já detecta, só confira):
   - **Framework Preset:** Vite
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
   - **Environment Variables:** nenhuma
   - **Node.js** (Settings > General, depois do primeiro deploy): 20.x ou mais novo
5. **Deploy**. Leva cerca de 1 minuto.
6. O rewrite de SPA já está no `vercel.json` do repositório (`/(.*)` vai para `/index.html`); não precisa configurar nada.
   Para confirmar, abra direto `<link>/garcom` e `<link>/painel/tv`: devem carregar, não dar 404.
7. (Opcional) Settings > Domains: troque o nome para algo como `catelan-demo.vercel.app`.

### 4.3 Se o deploy for bloqueado ("commit author ... not a member")
No plano Hobby, a Vercel só publica automaticamente commits feitos pela conta do GitHub ligada à sua Vercel. Os commits deste projeto são
da **DesenvolveSolucoes**. Se a sua Vercel estiver ligada a outra conta do GitHub, aparece esse bloqueio. Duas saídas:
- ligar a sua Vercel à conta DesenvolveSolucoes (Account Settings > Authentication > GitHub); ou
- publicar sem o GitHub: na pasta do projeto, `npx vercel` e depois `npx vercel --prod`.

### 4.4 Ligar o Supabase (depois de fechar o contrato)
1. Criar projeto no Supabase (região São Paulo).
2. SQL Editor: colar e rodar `supabase/migrations/001_schema.sql`, depois `supabase/seed.sql`.
   (Ou com a CLI: `npx supabase link --project-ref <ref>` e `npx supabase db push`.)
3. Authentication > Users: criar um usuário por perfil/aparelho e, para cada um, inserir em `usuarios`
   (`id` do auth, `nome`, `perfil`, `unidade_id`; a dona fica com `unidade_id` nulo).
4. Copiar `.env.example` para `.env.local` e preencher `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
   (os mesmos dois na Vercel > Settings > Environment Variables).
5. `npm i @supabase/supabase-js`, criar `src/lib/supabase.ts` e trocar, arquivo por arquivo, a implementação de `src/services/`
   (as telas não mudam). Trocar o seletor de perfil por login e tirar o salvamento no localStorage.
6. Testar o RLS entrando com cada usuário.

## 5. Próximos passos sugeridos

1. Trocar placeholders por logos, cores e fotos reais dos restaurantes antes da demo, se der tempo.
2. Ensaiar o roteiro do README no celular que vai ser usado na apresentação.
3. Pós-contrato: login, Supabase, impressão da comanda/cupom, relatórios por período, cadastro de cardápio/preços pela dona,
   inventário com estorno, integração com maquininha e com WhatsApp para os alertas da dona.
