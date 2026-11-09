# Sistema de Gestão dos Restaurantes · protótipo

Protótipo navegável, mobile first, para apresentar a Maryellen e Thiago Catelan.
Sem backend: todos os dados são fictícios. O que for feito na demo fica salvo **no próprio aparelho** (localStorage):
recarregar a página não perde nada. Para recomeçar, use **Reiniciar demonstração** no rodapé da tela inicial.
Os dados salvos valem só para o dia: no dia seguinte a demo recomeça sozinha com horários novos.

## Rodar no computador

```bash
npm install
```

```bash
npm run dev
```

Abre em http://localhost:5173. Para testar no celular na mesma rede: `npm run dev -- --host` e abra o IP que aparecer.

Build de produção (checa tipos e gera `dist/`):

```bash
npm run build
```

## Subir na Vercel

1. Crie um repositório **privado** no GitHub e faça push deste projeto.
2. Na Vercel: *Add New > Project*, importe o repositório. Ela detecta Vite sozinha
   (build `npm run build`, saída `dist`). Não precisa de variável de ambiente.
3. O `vercel.json` já redireciona todas as rotas para o `index.html`, então links diretos
   como `/garcom` ou `/painel/tv` funcionam.

Sem GitHub, pela linha de comando: `npx vercel` (primeira vez pede login) e depois `npx vercel --prod`.

## Rotas

| Rota | Perfil | O que faz |
|---|---|---|
| `/` | todos | Entrar como (seletor de perfil) |
| `/painel` | Dona | Faturamento, alertas, unidades, gráfico de 7 dias, carne, estoque crítico |
| `/painel/tv` | Dona | Modo TV (tela cheia, atualiza a cada 10s) |
| `/recebimento` | Recebimento | Conferência de lacre com peso cego |
| `/garcom` | Garçom | Mesas e comandas |
| `/caixa` | Caixa | Fechar contas, marmitas no balcão, fechamento de caixa |
| `/freezer` | Freezer | Retirada de carne (tablet) |
| `/central` | Central | Entrada de nota, envio com lacre, estoque |
| `/pedido/beira-rio` | Cliente | Cardápio de delivery do Beira Rio |

## Roteiro de demonstração

Antes de começar, toque em **Reiniciar demonstração** (rodapé da tela inicial) para partir do zero.
Para trocar de tela use o botão "Trocar perfil".

1. Entrar como **Central** > aba **Enviar** > destino Gado Nobre, Picanha, **10** kg > **Enviar**.
   Anote o lacre gerado (ex.: `L-004825`).
2. **Trocar perfil** > **Recebimento** (Gado Nobre) > toque no lacre da lista (ou digite) >
   no teclado digite **8** > **Confirmar recebimento** > tela vermelha de **divergência**.
   Repare que o peso enviado só aparece depois de digitar o conferido.
3. **Trocar perfil** > **Dona** > o alerta do lacre está no topo do painel.
4. **Trocar perfil** > **Garçom** > toque na **mesa 5** > 4 adultos > **Abrir mesa** >
   aba **Bebidas** > 4x **Coca-Cola lata** > **Pedir conta**.
5. **Trocar perfil** > **Caixa** > mesa 5 > **Por pessoas** (2) > parte 1 **Pix**, parte 2 **Crédito** > **Finalizar**.
6. **Trocar perfil** > **Dona** > o faturamento subiu.
7. **Trocar perfil** > **Cliente** > 2x **Marmita M** > Ver carrinho > bairro **Coloninha** (taxa R$ 7) >
   preencha nome, telefone, endereço > **Fazer pedido**. No painel, "Pedidos online hoje" sobe.
8. **Dona** > **Modo TV**.

Atalhos para improvisar:
- Lacre `L-004822` com 8 kg = divergência pronta; `L-004821` com 15 kg = conferido.
- Mesas 9 e 14 já estão pedindo conta.
- No Freezer, retirar carne fora do horário (antes de 2h da abertura ou depois do fechamento) gera alerta.
- No Caixa > Fechamento, digitar um valor contado diferente do registrado gera alerta de falta/sobra.

## Estrutura

```
src/
  types/       tipos de todas as entidades (espelham o schema do Supabase)
  data/        mocks (unidades, produtos, funcionários, cardápio, bairros, histórico, estado inicial)
  store/       estado em memória (Zustand) com as regras de negócio do protótipo
  services/    camada de dados: as telas só falam com ela (é o que troca pelo Supabase)
  components/  UI compartilhada (botões, modal, teclado numérico, leitura simulada, toast)
  pages/       uma pasta por módulo
  lib/         formatadores (R$, kg, datas)
supabase/
  migrations/001_schema.sql   tabelas, índices, RLS, funções e triggers
  seed.sql                    mesmos dados do mock (gerado por `npm run seed:gerar`)
```

Veja também `STATUS.md` (o que está pronto e como ligar o Supabase) e `DECISOES.md`.
