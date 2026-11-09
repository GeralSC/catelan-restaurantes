# Decisões tomadas sem consultar (noite de 08/11/2026)

Cada item: o que foi decidido e por quê. Tudo é fácil de mudar.

## Projeto e ferramentas
1. **Pasta `catelan-restaurantes/`** dentro de `1 x c`, como os outros projetos.
2. **Git local com autor `DesenvolveSolucoes`** (mesmo e-mail noreply usado no hum3 e na rja-vistoria).
   A memória diz para perguntar qual identidade usar, mas o PRD pediu para não parar. Os commits estão
   só no seu computador; se quiser outra identidade, dá para reescrever antes do primeiro push.
3. **Nada foi publicado**: sem GitHub, sem Vercel, sem Supabase. O repositório deve nascer privado.
4. **Versões fixas** de Vite 5, React 18, Tailwind 3, Zustand 4, Recharts 2, React Router 6 (estáveis, sem surpresa na véspera da demo).
5. **Telas carregadas sob demanda** (lazy): o gráfico (Recharts, o pacote mais pesado) só baixa quando abre o painel.

## Dados e regras do protótipo
6. **Vendas de hoje ancoradas na semana passada**: o faturamento inicial de cada unidade é o do mesmo dia da semana anterior
   com variação fixa (Gado Nobre +6,4%, Tijucas +3,8%, Biguaçu −2,7%, Beira Rio +5,1%). Assim o comparativo
   "vs. mesmo dia da semana passada" faz sentido em qualquer dia da demo e mostra uma unidade caindo (para mostrar o valor do alerta visual).
7. **Todas as unidades abrem todos os dias** no histórico. Na primeira versão a churrascaria fechava segunda e as de chapa domingo,
   mas aí o comparativo de domingo mostrava 0% e unidade "sem venda". Quando tivermos os dias reais, ajustamos.
8. **Horários de funcionamento inventados**: Gado Nobre 11h–23h; Rancho 10h30–15h30; Beira Rio 10h30–15h; Central 6h–18h.
   O status "Aberta/Fechada" do painel usa a hora real do celular.
9. **Freezer: janela permitida = 2h antes de abrir até o fechamento** (cozinha precisa tirar carne para o preparo).
   Fora disso gera alerta. Se a demo for de madrugada ou de manhã cedo, retirar carne gera alerta (é o comportamento certo).
10. **Retirada maior que o estoque é bloqueada** no freezer e no envio da Central (com mensagem). Na conferência de lacre não bloqueia: registra o que chegou.
11. **"Kg de carne consumidos hoje" = soma das retiradas do freezer do dia.** Por isso o freezer mexe no painel (R$ por kg).
12. **Na divergência, o estoque entra com o peso conferido** (o que realmente chegou), não com o enviado.
13. **Tolerância de 2% vale para mais e para menos.** Chegar mais carne do que saiu também é divergência (pode ser erro de lançamento).
14. **Diferença de caixa vira alerta a partir de R$ 1,00.**
15. **Pagamento guarda o valor abatido da conta**; o troco é calculado à parte. Assim o fechamento soma certo em dinheiro.
16. **Botão "−" na comanda não apaga**: cancela 1 unidade do lançamento mais recente e deixa o registro riscado no histórico
    ("cancelado por X às HH:MM"). Também dá para cancelar qualquer item pelo histórico (ícone de relógio na comanda).
17. **Garçom escolhe o nome no topo da tela** (no sistema real cada celular/usuário já sabe quem é). Recebimento e Caixa também têm quem está operando.
18. **Unidades sem rodízio** abrem mesa sem lançar nada e mostram "Pratos" no lugar de "Rodízio".
19. **Cardápio do delivery**: marmitas, executivos, sobremesas e 5 bebidas. Preços fictícios.
20. **Pedido online conta no faturamento do Beira Rio** e aparece no painel; o acompanhamento avança sozinho (5s e 9s).
21. **Pedido online só existe para o Beira Rio**: qualquer outra unidade na URL redireciona para `/pedido/beira-rio`.
22. **Leitura de câmera simulada**: no lacre, preenche `L-004822` (ou o primeiro em trânsito); no "Bipar" da Central, alterna entre produtos com código de barras e adiciona fardo de 12.
23. **Alertas no painel**: mostra os 2 mais recentes e "Ver mais". "Marcar como visto" move para "Alertas já vistos".
24. **Modo TV soma pequenas vendas simuladas a cada 10s** só na tela da TV (não altera os dados do resto do protótipo).
25. **Mock relativo ao horário em que a demo é aberta** (`src/lib/referencia.ts`, ajuste de 09/11):
    - A partir das **11:30** o "dia" é hoje: vendas, pedidos e retiradas vão da abertura de cada unidade até agora;
      as mesas abertas são comprimidas para depois da abertura do Gado Nobre e antes do fechamento.
    - **Antes das 11:30** mostra o dia anterior como se fossem 22:30 ("Faturamento de ontem" e aviso no painel).
      Usei 11:30 e não 10:30 (primeira abertura) para o Gado Nobre já ter meia hora de movimento; antes disso a churrascaria apareceria zerada.
    - O faturamento até agora é proporcional ao expediente já passado, e o painel compara com a **semana passada no mesmo horário**.
    - Os kg de carne retirados acompanham o faturamento (rendimento por kg coerente em qualquer horário).
    - Testado com o relógio às 00:10, 08:00, 11:29, 11:31, 12:30, 15:10, 19:00 e 23:55: nenhum horário no futuro.
35. **Estado salvo no localStorage** (com try/catch: se o navegador bloquear, segue só em memória). Guardo junto o dia de operação;
    se o salvo for de outro dia, é descartado. "Reiniciar demonstração" pede confirmação.
36. **Repositório na conta GeralSC** (conta do cliente), commits mantidos como DesenvolveSolucoes, como pedido.

## Visual
26. **Sem emojis** (regra da casa): todos os ícones são lucide (SVG). Fotos dos pratos são blocos coloridos com ícone, prontos para trocar por foto real.
27. **Logo da unidade = sigla num quadrado/círculo** (placeholder "BR" no delivery). Cores por unidade: Gado Nobre vermelho, Tijucas laranja,
    Biguaçu mostarda, Beira Rio verde-petróleo, Central cinza-azulado. Todas em tokens no `tailwind.config.js` e em `src/data/cadastros.ts`.

## Banco (Supabase, não conectado)
28. **Estoque é saldo derivado**: ninguém edita o saldo na mão; ele muda só por trigger quando entra um movimento.
29. **Peso cego no banco**: a tabela `transferencias` não é legível pela unidade de destino. Ela lê a view `transferencias_cegas`
    (sem peso) e confere pela função `registrar_recebimento`, que só devolve o peso enviado depois de gravar o conferido.
30. **Alertas só a dona vê** (e um perfil `gerente` opcional, da própria unidade). O funcionário que gerou o alerta não fica sabendo.
31. **Funcionários sem login próprio**: o tablet do freezer loga como a unidade e a pessoa toca no nome. Deixei campo `pin` para exigir PIN depois.
32. **Pedido online entra por função** (`criar_pedido_online`) que recalcula preços e taxa no banco. O navegador do cliente não decide valor.
33. **Seed gerado do mock** (`npm run seed:gerar`) para os dois nunca ficarem diferentes.
34. **Tabela `lacres`** separada controla lacre já usado (não deixa repetir).
