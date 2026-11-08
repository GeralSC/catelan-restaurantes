-- =====================================================================
-- Sistema de Gestão dos Restaurantes · schema inicial
-- Ainda NÃO aplicado em nenhum projeto. Pensado para Supabase (Postgres 15+).
--
-- Regras críticas garantidas pelo banco (não só pela tela):
--   1. Peso cego: quem recebe não consegue ler o peso enviado (view + RPC).
--   2. Movimentos de estoque nunca são apagados nem editados (só estorno).
--   3. Itens de comanda não são apagados: cancelamento marca quem/quando.
--   4. Divergência de lacre, freezer fora do horário e diferença de caixa
--      geram alerta automaticamente (triggers).
--   5. RLS: dona vê tudo; cada usuário vê só a sua unidade.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
create type perfil_usuario as enum ('dona', 'central', 'recebimento', 'freezer', 'garcom', 'caixa', 'gerente');
create type tipo_unidade as enum ('central', 'rodizio', 'chapa-buffet', 'buffet-entrega');
create type unidade_medida as enum ('kg', 'un');
create type categoria_produto as enum ('carne', 'bebida', 'mercearia');
create type tipo_movimento as enum ('entrada_nota', 'envio_transferencia', 'recebimento_transferencia', 'retirada_freezer', 'venda', 'estorno', 'ajuste_inventario');
create type status_transferencia as enum ('em_transito', 'conferido', 'divergencia');
create type status_lacre as enum ('disponivel', 'usado', 'inutilizado');
create type status_mesa as enum ('livre', 'ocupada', 'conta');
create type status_comanda as enum ('aberta', 'conta', 'fechada');
create type categoria_cardapio as enum ('rodizio', 'bebidas', 'sobremesas', 'marmitas', 'executivos');
create type forma_pagamento as enum ('pix', 'credito', 'debito', 'dinheiro');
create type origem_venda as enum ('mesa', 'marmita', 'online');
create type status_pedido as enum ('recebido', 'preparo', 'saiu', 'entregue', 'cancelado');
create type pagamento_online as enum ('pix', 'cartao', 'dinheiro');
create type tipo_alerta as enum ('divergencia_lacre', 'freezer_fora_horario', 'diferenca_caixa');

-- ---------------------------------------------------------------------
-- Cadastros
-- ---------------------------------------------------------------------
create table unidades (
  id text primary key,                          -- 'gado-nobre', 'beira-rio'...
  nome text not null,
  cidade text not null,
  tipo tipo_unidade not null,
  descricao text,
  cor text not null default '#B91C1C',
  horario_abertura time not null default '11:00',
  horario_fechamento time not null default '23:00',
  freezer_antecedencia interval not null default '2 hours', -- janela de preparo antes de abrir
  tolerancia_divergencia numeric(5,4) not null default 0.02, -- 2%
  tolerancia_caixa numeric(10,2) not null default 1.00,
  total_mesas int not null default 0,
  ativa boolean not null default true,
  criado_em timestamptz not null default now()
);

-- Usuários que fazem login (ligados ao Supabase Auth). Um usuário por aparelho/pessoa.
create table usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  perfil perfil_usuario not null,
  unidade_id text references unidades(id),     -- null só para a dona
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  constraint usuario_com_unidade check (perfil = 'dona' or unidade_id is not null)
);

-- Funcionários (quem retira do freezer, quem lança na comanda). Não precisam de login próprio:
-- o tablet do freezer está logado como a unidade e a pessoa se identifica tocando no nome.
create table funcionarios (
  id uuid primary key default gen_random_uuid(),
  unidade_id text not null references unidades(id),
  nome text not null,
  funcao text not null,
  pin text,                                     -- opcional: PIN de 4 dígitos (hash) para o freezer
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
create index on funcionarios (unidade_id) where ativo;

create table produtos (
  id text primary key,
  nome text not null,
  categoria categoria_produto not null,
  unidade_medida unidade_medida not null,
  codigo_barras text unique,
  custo numeric(12,2) not null default 0,       -- por kg ou por unidade
  preco_venda numeric(12,2),
  ativo boolean not null default true
);

create table fornecedores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text,
  ativo boolean not null default true
);

create table bairros (
  id text primary key,
  unidade_id text not null references unidades(id),
  nome text not null,
  taxa numeric(10,2) not null,
  ativo boolean not null default true
);
create index on bairros (unidade_id) where ativo;

create table itens_cardapio (
  id text primary key,
  unidade_id text references unidades(id),      -- null = vale para todas
  nome text not null,
  descricao text,
  categoria categoria_cardapio not null,
  preco numeric(10,2) not null,
  produto_id text references produtos(id),      -- baixa de estoque (bebidas)
  disponivel_online boolean not null default false,
  ativo boolean not null default true
);

-- ---------------------------------------------------------------------
-- Estoque (saldo) e movimentos (histórico imutável)
-- ---------------------------------------------------------------------
create table estoque (
  unidade_id text not null references unidades(id),
  produto_id text not null references produtos(id),
  quantidade numeric(12,3) not null default 0,
  minimo numeric(12,3) not null default 0,
  atualizado_em timestamptz not null default now(),
  primary key (unidade_id, produto_id)
);

create table movimentos (
  id uuid primary key default gen_random_uuid(),
  unidade_id text not null references unidades(id),
  produto_id text not null references produtos(id),
  tipo tipo_movimento not null,
  quantidade numeric(12,3) not null,            -- positivo entra, negativo sai
  feito_por_usuario uuid references usuarios(id),
  feito_por_nome text not null,                 -- nome de quem fez (funcionário ou usuário)
  referencia text,                              -- nº da nota, lacre, mesa...
  estorna_movimento uuid references movimentos(id),
  em timestamptz not null default now()
);
create index on movimentos (unidade_id, em desc);
create index on movimentos (produto_id, em desc);

-- ---------------------------------------------------------------------
-- Compras (entrada de nota na Central)
-- ---------------------------------------------------------------------
create table notas_entrada (
  id uuid primary key default gen_random_uuid(),
  unidade_id text not null references unidades(id) default 'central',
  fornecedor_id uuid not null references fornecedores(id),
  numero text not null,
  data date not null,
  total numeric(12,2) not null default 0,
  lancada_por uuid references usuarios(id),
  lancada_em timestamptz not null default now(),
  unique (fornecedor_id, numero)
);

create table itens_nota (
  id uuid primary key default gen_random_uuid(),
  nota_id uuid not null references notas_entrada(id),
  produto_id text not null references produtos(id),
  quantidade numeric(12,3) not null check (quantidade > 0),
  custo_unitario numeric(12,2) not null
);
create index on itens_nota (nota_id);

-- ---------------------------------------------------------------------
-- Lacres e transferências entre unidades
-- ---------------------------------------------------------------------
create table lacres (
  numero text primary key,                      -- 'L-004821'
  status status_lacre not null default 'disponivel',
  criado_em timestamptz not null default now()
);

create table transferencias (
  id uuid primary key default gen_random_uuid(),
  lacre text not null unique references lacres(numero),
  origem_id text not null references unidades(id),
  destino_id text not null references unidades(id),
  produto_id text not null references produtos(id),
  quantidade_enviada numeric(12,3) not null check (quantidade_enviada > 0),   -- PESO CEGO
  volumes int not null default 1,
  enviado_por uuid references usuarios(id),
  enviado_por_nome text not null,
  enviado_em timestamptz not null default now(),
  status status_transferencia not null default 'em_transito',
  quantidade_recebida numeric(12,3),
  recebido_por uuid references usuarios(id),
  recebido_por_nome text,
  recebido_em timestamptz,
  constraint origem_diferente_destino check (origem_id <> destino_id)
);
create index on transferencias (destino_id, status);

-- ---------------------------------------------------------------------
-- Salão: mesas, comandas, itens
-- ---------------------------------------------------------------------
create table mesas (
  unidade_id text not null references unidades(id),
  numero int not null,
  status status_mesa not null default 'livre',
  comanda_id uuid,
  primary key (unidade_id, numero)
);

create table comandas (
  id uuid primary key default gen_random_uuid(),
  unidade_id text not null references unidades(id),
  mesa int not null,
  pessoas int not null check (pessoas > 0),
  aberta_por uuid references usuarios(id),
  aberta_por_nome text not null,
  aberta_em timestamptz not null default now(),
  status status_comanda not null default 'aberta',
  fechada_em timestamptz,
  foreign key (unidade_id, mesa) references mesas(unidade_id, numero)
);
create index on comandas (unidade_id, status);
alter table mesas add constraint mesas_comanda_fk foreign key (comanda_id) references comandas(id);

create table itens_comanda (
  id uuid primary key default gen_random_uuid(),
  comanda_id uuid not null references comandas(id),
  cardapio_id text not null references itens_cardapio(id),
  nome text not null,
  quantidade numeric(10,3) not null check (quantidade > 0),
  preco_unitario numeric(10,2) not null,
  lancado_por uuid references usuarios(id),
  lancado_por_nome text not null,
  lancado_em timestamptz not null default now(),
  cancelado_por_nome text,
  cancelado_em timestamptz
);
create index on itens_comanda (comanda_id);

-- ---------------------------------------------------------------------
-- Caixa: vendas, pagamentos, fechamentos
-- ---------------------------------------------------------------------
create table vendas (
  id uuid primary key default gen_random_uuid(),
  unidade_id text not null references unidades(id),
  origem origem_venda not null,
  descricao text,
  total numeric(12,2) not null,
  troco numeric(12,2) not null default 0,
  clientes int not null default 1,
  comanda_id uuid references comandas(id),
  pedido_id uuid,
  feita_por uuid references usuarios(id),
  feita_por_nome text not null,
  em timestamptz not null default now()
);
create index on vendas (unidade_id, em desc);

create table pagamentos (
  id uuid primary key default gen_random_uuid(),
  venda_id uuid not null references vendas(id),
  forma forma_pagamento not null,
  valor numeric(12,2) not null check (valor > 0)   -- valor abatido da conta (troco fica em vendas.troco)
);
create index on pagamentos (venda_id);

create table caixas (
  id uuid primary key default gen_random_uuid(),
  unidade_id text not null references unidades(id),
  data date not null default current_date,
  total_pix numeric(12,2) not null default 0,
  total_credito numeric(12,2) not null default 0,
  total_debito numeric(12,2) not null default 0,
  total_dinheiro numeric(12,2) not null default 0,
  dinheiro_contado numeric(12,2) not null,
  diferenca numeric(12,2) generated always as (dinheiro_contado - total_dinheiro) stored,
  fechado_por uuid references usuarios(id),
  fechado_por_nome text not null,
  fechado_em timestamptz not null default now()
);
create index on caixas (unidade_id, data desc);

-- ---------------------------------------------------------------------
-- Freezer
-- ---------------------------------------------------------------------
create table retiradas_freezer (
  id uuid primary key default gen_random_uuid(),
  unidade_id text not null references unidades(id),
  funcionario_id uuid not null references funcionarios(id),
  funcionario_nome text not null,
  produto_id text not null references produtos(id),
  quantidade numeric(12,3) not null check (quantidade > 0),
  fora_do_horario boolean not null default false,  -- calculado pelo trigger
  registrado_por uuid references usuarios(id),     -- aparelho (tablet) que registrou
  em timestamptz not null default now()
);
create index on retiradas_freezer (unidade_id, em desc);

-- ---------------------------------------------------------------------
-- Pedido online
-- ---------------------------------------------------------------------
create sequence pedido_numero_seq start 1047;

create table pedidos_online (
  id uuid primary key default gen_random_uuid(),
  numero int not null unique default nextval('pedido_numero_seq'),
  unidade_id text not null references unidades(id),
  cliente text not null,
  telefone text not null,
  bairro_id text not null references bairros(id),
  endereco text not null,
  forma_pagamento pagamento_online not null,
  troco_para numeric(10,2),
  subtotal numeric(10,2) not null,
  taxa_entrega numeric(10,2) not null,
  total numeric(10,2) not null,
  status status_pedido not null default 'recebido',
  em timestamptz not null default now()
);
create index on pedidos_online (unidade_id, em desc);

create table itens_pedido (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos_online(id),
  cardapio_id text not null references itens_cardapio(id),
  nome text not null,
  quantidade int not null check (quantidade > 0),
  preco_unitario numeric(10,2) not null
);
alter table vendas add constraint vendas_pedido_fk foreign key (pedido_id) references pedidos_online(id);

-- ---------------------------------------------------------------------
-- Alertas
-- ---------------------------------------------------------------------
create table alertas (
  id uuid primary key default gen_random_uuid(),
  tipo tipo_alerta not null,
  unidade_id text not null references unidades(id),
  titulo text not null,
  detalhe text not null,
  quem text not null,
  valor numeric(12,2) not null default 0,
  referencia_id uuid,                            -- transferência, retirada ou caixa que gerou
  em timestamptz not null default now(),
  lido_em timestamptz,
  lido_por uuid references usuarios(id)
);
create index on alertas (em desc) where lido_em is null;

-- =====================================================================
-- Funções auxiliares de acesso (usadas nas políticas RLS)
-- =====================================================================
create or replace function meu_perfil() returns perfil_usuario
language sql stable security definer set search_path = public as $$
  select perfil from usuarios where id = auth.uid() and ativo
$$;

create or replace function minha_unidade() returns text
language sql stable security definer set search_path = public as $$
  select unidade_id from usuarios where id = auth.uid() and ativo
$$;

create or replace function eh_dona() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select perfil = 'dona' from usuarios where id = auth.uid() and ativo), false)
$$;

create or replace function meu_nome() returns text
language sql stable security definer set search_path = public as $$
  select nome from usuarios where id = auth.uid()
$$;

-- pode ver/mexer nos dados desta unidade?
create or replace function acessa_unidade(u text) returns boolean
language sql stable as $$
  select eh_dona() or u = minha_unidade()
$$;

-- =====================================================================
-- Regras críticas
-- =====================================================================

-- (2) Movimentos são imutáveis --------------------------------------
create or replace function bloquear_alteracao() returns trigger
language plpgsql as $$
begin
  raise exception 'Registros de % não podem ser alterados nem apagados. Use um estorno.', tg_table_name;
end $$;

create trigger movimentos_imutaveis before update or delete on movimentos
  for each row execute function bloquear_alteracao();
create trigger pagamentos_imutaveis before update or delete on pagamentos
  for each row execute function bloquear_alteracao();
create trigger vendas_sem_delete before delete on vendas
  for each row execute function bloquear_alteracao();
create trigger retiradas_imutaveis before update or delete on retiradas_freezer
  for each row execute function bloquear_alteracao();
create trigger alertas_sem_delete before delete on alertas
  for each row execute function bloquear_alteracao();
create trigger caixas_imutaveis before update or delete on caixas
  for each row execute function bloquear_alteracao();

-- Saldo de estoque é consequência dos movimentos (ninguém edita o saldo na mão)
create or replace function aplicar_movimento() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into estoque (unidade_id, produto_id, quantidade, atualizado_em)
  values (new.unidade_id, new.produto_id, new.quantidade, now())
  on conflict (unidade_id, produto_id)
  do update set quantidade = estoque.quantidade + excluded.quantidade, atualizado_em = now();
  return new;
end $$;
create trigger movimento_atualiza_estoque after insert on movimentos
  for each row execute function aplicar_movimento();

-- (3) Item de comanda: não apaga; só pode ser marcado como cancelado ---
create or replace function proteger_item_comanda() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Itens de comanda não são apagados. Cancele o item.';
  end if;
  if old.cancelado_em is not null then
    raise exception 'Item já cancelado.';
  end if;
  if (new.comanda_id, new.cardapio_id, new.nome, new.quantidade, new.preco_unitario, new.lancado_por_nome, new.lancado_em)
     is distinct from
     (old.comanda_id, old.cardapio_id, old.nome, old.quantidade, old.preco_unitario, old.lancado_por_nome, old.lancado_em) then
    raise exception 'Só é permitido cancelar o item (cancelado_por_nome, cancelado_em).';
  end if;
  new.cancelado_em := coalesce(new.cancelado_em, now());
  new.cancelado_por_nome := coalesce(new.cancelado_por_nome, meu_nome());
  return new;
end $$;
create trigger itens_comanda_protegidos before update or delete on itens_comanda
  for each row execute function proteger_item_comanda();

-- (1) Peso cego -------------------------------------------------------
-- A tabela transferencias NÃO é legível por quem recebe (ver RLS abaixo).
-- Quem recebe usa esta view, que não tem o peso enviado.
create or replace view transferencias_cegas
with (security_barrier = true) as
  select id, lacre, origem_id, destino_id, produto_id, volumes,
         enviado_por_nome, enviado_em, status, recebido_por_nome, recebido_em
  from transferencias
  where destino_id = minha_unidade() or eh_dona();

-- Conferência: única forma de registrar recebimento. Devolve o resultado só DEPOIS de gravar o peso.
create or replace function registrar_recebimento(p_lacre text, p_kg numeric)
returns table (ok boolean, enviado numeric, recebido numeric, diferenca numeric, percentual numeric, valor_estimado numeric, tolerancia numeric)
language plpgsql security definer set search_path = public as $$
declare
  t transferencias%rowtype;
  u unidades%rowtype;
  v_custo numeric;
  v_dif numeric;
  v_pct numeric;
begin
  if p_kg is null or p_kg <= 0 then raise exception 'Informe o peso conferido.'; end if;

  select * into t from transferencias
   where lacre = upper(trim(p_lacre)) and status = 'em_transito'
   for update;
  if not found then raise exception 'Lacre não encontrado ou já conferido.'; end if;
  if not (eh_dona() or t.destino_id = minha_unidade()) then
    raise exception 'Este lacre não é para a sua unidade.';
  end if;

  select * into u from unidades where id = t.destino_id;
  select custo into v_custo from produtos where id = t.produto_id;
  v_dif := p_kg - t.quantidade_enviada;
  v_pct := abs(v_dif) / t.quantidade_enviada;

  update transferencias set
    status = case when v_pct <= u.tolerancia_divergencia then 'conferido'::status_transferencia else 'divergencia' end,
    quantidade_recebida = p_kg,
    recebido_por = auth.uid(),
    recebido_por_nome = coalesce(meu_nome(), 'Sistema'),
    recebido_em = now()
  where id = t.id;

  insert into movimentos (unidade_id, produto_id, tipo, quantidade, feito_por_usuario, feito_por_nome, referencia)
  values (t.destino_id, t.produto_id, 'recebimento_transferencia', p_kg, auth.uid(), coalesce(meu_nome(), 'Sistema'), t.lacre);

  return query select v_pct <= u.tolerancia_divergencia, t.quantidade_enviada, p_kg, v_dif, v_pct,
                      round(abs(v_dif) * v_custo, 2), u.tolerancia_divergencia;
end $$;

-- Envio: cria a transferência, usa o lacre e dá baixa na origem.
create or replace function enviar_transferencia(p_destino text, p_produto text, p_quantidade numeric, p_volumes int, p_lacre text default null)
returns transferencias
language plpgsql security definer set search_path = public as $$
declare
  v_lacre text := upper(trim(coalesce(p_lacre, '')));
  v_origem text := coalesce(minha_unidade(), 'central');
  t transferencias;
begin
  if not (eh_dona() or meu_perfil() in ('central', 'gerente')) then
    raise exception 'Sem permissão para enviar mercadoria.';
  end if;
  if v_lacre = '' then
    v_lacre := 'L-' || lpad((select coalesce(max(substring(numero from 3)::int), 0) + 1 from lacres)::text, 6, '0');
  end if;
  insert into lacres (numero, status) values (v_lacre, 'usado')
    on conflict (numero) do update set status = 'usado' where lacres.status = 'disponivel';
  if not found then raise exception 'Lacre % já foi usado.', v_lacre; end if;

  insert into transferencias (lacre, origem_id, destino_id, produto_id, quantidade_enviada, volumes, enviado_por, enviado_por_nome)
  values (v_lacre, v_origem, p_destino, p_produto, p_quantidade, p_volumes, auth.uid(), coalesce(meu_nome(), 'Sistema'))
  returning * into t;

  insert into movimentos (unidade_id, produto_id, tipo, quantidade, feito_por_usuario, feito_por_nome, referencia)
  values (v_origem, p_produto, 'envio_transferencia', -p_quantidade, auth.uid(), coalesce(meu_nome(), 'Sistema'), v_lacre);
  return t;
end $$;

-- (4) Alertas automáticos ----------------------------------------------
create or replace function alerta_divergencia() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_prod produtos%rowtype;
  v_tol numeric;
begin
  if new.status = 'divergencia' and old.status = 'em_transito' then
    select * into v_prod from produtos where id = new.produto_id;
    select tolerancia_divergencia into v_tol from unidades where id = new.destino_id;
    insert into alertas (tipo, unidade_id, titulo, detalhe, quem, valor, referencia_id)
    values ('divergencia_lacre', new.destino_id,
            'Divergência no lacre ' || new.lacre,
            format('%s: enviado %s kg, recebido %s kg (tolerância %s%%)', v_prod.nome,
                   to_char(new.quantidade_enviada, 'FM999990D000'), to_char(new.quantidade_recebida, 'FM999990D000'),
                   round(v_tol * 100)),
            coalesce(new.recebido_por_nome, 'Desconhecido'),
            round(abs(new.quantidade_recebida - new.quantidade_enviada) * v_prod.custo, 2),
            new.id);
  end if;
  return new;
end $$;
create trigger transferencia_gera_alerta after update of status on transferencias
  for each row execute function alerta_divergencia();

create or replace function processar_retirada_freezer() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  u unidades%rowtype;
  v_hora time := (new.em at time zone 'America/Sao_Paulo')::time;
  v_prod produtos%rowtype;
begin
  select * into u from unidades where id = new.unidade_id;
  select * into v_prod from produtos where id = new.produto_id;
  new.fora_do_horario := not (v_hora between (u.horario_abertura - u.freezer_antecedencia) and u.horario_fechamento);
  new.funcionario_nome := (select nome from funcionarios where id = new.funcionario_id);

  insert into movimentos (unidade_id, produto_id, tipo, quantidade, feito_por_usuario, feito_por_nome, referencia)
  values (new.unidade_id, new.produto_id, 'retirada_freezer', -new.quantidade, auth.uid(), new.funcionario_nome, 'Freezer');

  if new.fora_do_horario then
    insert into alertas (tipo, unidade_id, titulo, detalhe, quem, valor, referencia_id)
    values ('freezer_fora_horario', new.unidade_id, 'Retirada do freezer fora do horário',
            format('%s kg de %s retirados fora do horário de funcionamento', to_char(new.quantidade, 'FM999990D000'), v_prod.nome),
            new.funcionario_nome, round(new.quantidade * v_prod.custo, 2), new.id);
  end if;
  return new;
end $$;
create trigger retirada_freezer_processa before insert on retiradas_freezer
  for each row execute function processar_retirada_freezer();

create or replace function alerta_caixa() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_tol numeric;
begin
  select tolerancia_caixa into v_tol from unidades where id = new.unidade_id;
  if abs(new.diferenca) >= v_tol then
    insert into alertas (tipo, unidade_id, titulo, detalhe, quem, valor, referencia_id)
    values ('diferenca_caixa', new.unidade_id,
            case when new.diferenca < 0 then 'Falta no fechamento de caixa' else 'Sobra no fechamento de caixa' end,
            format('Registrado R$ %s em dinheiro, contado R$ %s', new.total_dinheiro, new.dinheiro_contado),
            new.fechado_por_nome, abs(new.diferenca), new.id);
  end if;
  return new;
end $$;
create trigger caixa_gera_alerta after insert on caixas
  for each row execute function alerta_caixa();

-- Pedido online: o cliente (anônimo) só cria pedido por aqui; a taxa vem do banco, não do navegador.
create or replace function criar_pedido_online(
  p_unidade text, p_cliente text, p_telefone text, p_bairro text, p_endereco text,
  p_pagamento pagamento_online, p_troco_para numeric, p_itens jsonb  -- [{"cardapio_id":"mar-m","quantidade":2}]
) returns pedidos_online
language plpgsql security definer set search_path = public as $$
declare
  v_taxa numeric;
  v_sub numeric := 0;
  p pedidos_online;
  i jsonb;
  c itens_cardapio%rowtype;
  v_venda uuid;
begin
  select taxa into v_taxa from bairros where id = p_bairro and unidade_id = p_unidade and ativo;
  if v_taxa is null then raise exception 'Bairro não atendido.'; end if;
  if jsonb_array_length(p_itens) = 0 then raise exception 'Carrinho vazio.'; end if;

  for i in select * from jsonb_array_elements(p_itens) loop
    select * into c from itens_cardapio where id = i->>'cardapio_id' and disponivel_online and ativo;
    if not found then raise exception 'Item indisponível: %', i->>'cardapio_id'; end if;
    v_sub := v_sub + c.preco * (i->>'quantidade')::int;
  end loop;

  insert into pedidos_online (unidade_id, cliente, telefone, bairro_id, endereco, forma_pagamento, troco_para, subtotal, taxa_entrega, total)
  values (p_unidade, p_cliente, p_telefone, p_bairro, p_endereco, p_pagamento, p_troco_para, v_sub, v_taxa, v_sub + v_taxa)
  returning * into p;

  insert into itens_pedido (pedido_id, cardapio_id, nome, quantidade, preco_unitario)
  select p.id, ic.id, ic.nome, (x->>'quantidade')::int, ic.preco
  from jsonb_array_elements(p_itens) x join itens_cardapio ic on ic.id = x->>'cardapio_id';

  insert into vendas (unidade_id, origem, descricao, total, clientes, pedido_id, feita_por_nome)
  values (p_unidade, 'online', 'Pedido online nº ' || p.numero, p.total, 1, p.id, 'Site')
  returning id into v_venda;
  insert into pagamentos (venda_id, forma, valor)
  values (v_venda, case p_pagamento when 'pix' then 'pix' when 'cartao' then 'credito' else 'dinheiro' end::forma_pagamento, p.total);

  return p;
end $$;
grant execute on function criar_pedido_online to anon;

-- =====================================================================
-- RLS
-- =====================================================================
alter table unidades enable row level security;
alter table usuarios enable row level security;
alter table funcionarios enable row level security;
alter table produtos enable row level security;
alter table fornecedores enable row level security;
alter table bairros enable row level security;
alter table itens_cardapio enable row level security;
alter table estoque enable row level security;
alter table movimentos enable row level security;
alter table notas_entrada enable row level security;
alter table itens_nota enable row level security;
alter table lacres enable row level security;
alter table transferencias enable row level security;
alter table mesas enable row level security;
alter table comandas enable row level security;
alter table itens_comanda enable row level security;
alter table vendas enable row level security;
alter table pagamentos enable row level security;
alter table caixas enable row level security;
alter table retiradas_freezer enable row level security;
alter table pedidos_online enable row level security;
alter table itens_pedido enable row level security;
alter table alertas enable row level security;

-- Cadastros públicos/leitura geral
create policy "unidades: todos logados leem" on unidades for select to authenticated using (true);
create policy "unidades: cliente vê unidades com entrega" on unidades for select to anon using (tipo = 'buffet-entrega');
create policy "unidades: dona edita" on unidades for all to authenticated using (eh_dona()) with check (eh_dona());

create policy "usuarios: vê a si mesmo, dona vê todos" on usuarios for select to authenticated using (id = auth.uid() or eh_dona());
create policy "usuarios: dona gerencia" on usuarios for all to authenticated using (eh_dona()) with check (eh_dona());

create policy "funcionarios: da unidade" on funcionarios for select to authenticated using (acessa_unidade(unidade_id));
create policy "funcionarios: dona/gerente gerencia" on funcionarios for all to authenticated
  using (eh_dona() or (meu_perfil() = 'gerente' and unidade_id = minha_unidade()))
  with check (eh_dona() or (meu_perfil() = 'gerente' and unidade_id = minha_unidade()));

create policy "produtos: logados leem" on produtos for select to authenticated using (true);
create policy "produtos: dona/central editam" on produtos for all to authenticated
  using (eh_dona() or meu_perfil() = 'central') with check (eh_dona() or meu_perfil() = 'central');

create policy "fornecedores: dona/central" on fornecedores for all to authenticated
  using (eh_dona() or meu_perfil() = 'central') with check (eh_dona() or meu_perfil() = 'central');

create policy "bairros: público lê ativos" on bairros for select to anon, authenticated using (ativo);
create policy "bairros: dona edita" on bairros for all to authenticated using (eh_dona()) with check (eh_dona());

create policy "cardapio: público lê o que é online" on itens_cardapio for select to anon using (ativo and disponivel_online);
create policy "cardapio: logados leem" on itens_cardapio for select to authenticated using (true);
create policy "cardapio: dona edita" on itens_cardapio for all to authenticated using (eh_dona()) with check (eh_dona());

-- Estoque: leitura por unidade; escrita só via movimentos (trigger security definer). Mínimo: dona/central.
create policy "estoque: lê a sua unidade" on estoque for select to authenticated using (acessa_unidade(unidade_id));
create policy "estoque: dona ajusta mínimo" on estoque for update to authenticated using (eh_dona()) with check (eh_dona());

create policy "movimentos: lê a sua unidade" on movimentos for select to authenticated using (acessa_unidade(unidade_id));
create policy "movimentos: insere na sua unidade" on movimentos for insert to authenticated
  with check (acessa_unidade(unidade_id) and tipo in ('entrada_nota', 'estorno', 'ajuste_inventario', 'venda'));
-- (envio, recebimento e freezer entram só pelas funções/trigger acima)

create policy "notas: central e dona" on notas_entrada for all to authenticated
  using (eh_dona() or meu_perfil() = 'central') with check (eh_dona() or meu_perfil() = 'central');
create policy "itens_nota: central e dona" on itens_nota for all to authenticated
  using (eh_dona() or meu_perfil() = 'central') with check (eh_dona() or meu_perfil() = 'central');

create policy "lacres: central e dona leem" on lacres for select to authenticated using (eh_dona() or meu_perfil() = 'central');

-- PESO CEGO: só dona e quem ENVIOU (origem) leem a tabela completa. Destino usa a view transferencias_cegas.
create policy "transferencias: dona e origem" on transferencias for select to authenticated
  using (eh_dona() or (origem_id = minha_unidade() and meu_perfil() in ('central', 'gerente')));
-- inserts/updates só por enviar_transferencia() e registrar_recebimento()

create policy "mesas: da unidade" on mesas for select to authenticated using (acessa_unidade(unidade_id));
create policy "mesas: garçom/caixa atualizam" on mesas for update to authenticated
  using (acessa_unidade(unidade_id) and (eh_dona() or meu_perfil() in ('garcom', 'caixa', 'gerente')))
  with check (acessa_unidade(unidade_id));

create policy "comandas: da unidade" on comandas for select to authenticated using (acessa_unidade(unidade_id));
create policy "comandas: garçom abre" on comandas for insert to authenticated
  with check (unidade_id = minha_unidade() and meu_perfil() in ('garcom', 'gerente', 'caixa'));
create policy "comandas: garçom/caixa atualizam" on comandas for update to authenticated
  using (acessa_unidade(unidade_id) and (eh_dona() or meu_perfil() in ('garcom', 'caixa', 'gerente')))
  with check (acessa_unidade(unidade_id));

create policy "itens_comanda: da unidade" on itens_comanda for select to authenticated
  using (exists (select 1 from comandas c where c.id = comanda_id and acessa_unidade(c.unidade_id)));
create policy "itens_comanda: garçom lança" on itens_comanda for insert to authenticated
  with check (exists (select 1 from comandas c where c.id = comanda_id and c.status <> 'fechada' and c.unidade_id = minha_unidade()));
create policy "itens_comanda: garçom cancela" on itens_comanda for update to authenticated
  using (exists (select 1 from comandas c where c.id = comanda_id and c.status <> 'fechada' and c.unidade_id = minha_unidade()));

create policy "vendas: da unidade" on vendas for select to authenticated using (acessa_unidade(unidade_id));
create policy "vendas: caixa registra" on vendas for insert to authenticated
  with check (unidade_id = minha_unidade() and meu_perfil() in ('caixa', 'gerente'));

create policy "pagamentos: da unidade" on pagamentos for select to authenticated
  using (exists (select 1 from vendas v where v.id = venda_id and acessa_unidade(v.unidade_id)));
create policy "pagamentos: caixa registra" on pagamentos for insert to authenticated
  with check (exists (select 1 from vendas v where v.id = venda_id and v.unidade_id = minha_unidade()));

create policy "caixas: da unidade" on caixas for select to authenticated using (acessa_unidade(unidade_id));
create policy "caixas: caixa fecha" on caixas for insert to authenticated
  with check (unidade_id = minha_unidade() and meu_perfil() in ('caixa', 'gerente'));

create policy "freezer: da unidade" on retiradas_freezer for select to authenticated using (acessa_unidade(unidade_id));
create policy "freezer: tablet registra" on retiradas_freezer for insert to authenticated
  with check (unidade_id = minha_unidade() and meu_perfil() in ('freezer', 'gerente')
              and exists (select 1 from funcionarios f where f.id = funcionario_id and f.unidade_id = unidade_id and f.ativo));

create policy "pedidos: unidade e dona leem" on pedidos_online for select to authenticated using (acessa_unidade(unidade_id));
create policy "pedidos: unidade atualiza status" on pedidos_online for update to authenticated
  using (acessa_unidade(unidade_id)) with check (acessa_unidade(unidade_id));
create policy "itens_pedido: unidade e dona leem" on itens_pedido for select to authenticated
  using (exists (select 1 from pedidos_online p where p.id = pedido_id and acessa_unidade(p.unidade_id)));

-- Alertas: só a dona (e gerente da unidade, se existir) vê. Funcionário que gerou NÃO vê.
create policy "alertas: dona vê tudo" on alertas for select to authenticated
  using (eh_dona() or (meu_perfil() = 'gerente' and unidade_id = minha_unidade()));
create policy "alertas: dona marca como lido" on alertas for update to authenticated using (eh_dona()) with check (eh_dona());

-- Grants das funções
grant execute on function registrar_recebimento(text, numeric) to authenticated;
grant execute on function enviar_transferencia(text, text, numeric, int, text) to authenticated;
grant select on transferencias_cegas to authenticated;

-- Tempo real para o painel da dona e o Modo TV
alter publication supabase_realtime add table vendas, alertas, pedidos_online, mesas, comandas, itens_comanda, retiradas_freezer, transferencias;
