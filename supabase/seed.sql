-- Gerado por scripts/gerar-seed.ts a partir de src/data. Não edite à mão.
-- Dados fictícios do protótipo.

insert into unidades (id, nome, cidade, tipo, descricao, cor, horario_abertura, horario_fechamento, total_mesas) values
  ('central', 'Central de Compras', 'Brusque', 'central', 'Estoque e distribuição', '#475569', '06:00', '18:00', 0),
  ('gado-nobre', 'Gado Nobre', 'Brusque', 'rodizio', 'Churrascaria rodízio · espeto corrido', '#B91C1C', '11:00', '23:00', 30),
  ('rancho-tijucas', 'Delícias do Rancho', 'Tijucas', 'chapa-buffet', 'Chapa, buffet livre e marmita', '#C2410C', '10:30', '15:30', 20),
  ('rancho-biguacu', 'Delícias do Rancho', 'Biguaçu', 'chapa-buffet', 'Chapa, buffet livre e marmita', '#A16207', '10:30', '15:30', 20),
  ('beira-rio', 'Beira Rio', 'Gaspar', 'buffet-entrega', 'Buffet livre, marmita e entrega', '#0F766E', '10:30', '15:00', 16);

insert into funcionarios (nome, funcao, unidade_id) values
  ('Rodrigo', 'Estoquista', 'central'),
  ('Sandra', 'Compradora', 'central'),
  ('Márcio', 'Motorista', 'central'),
  ('Eliane', 'Auxiliar de estoque', 'central'),
  ('Carlos', 'Churrasqueiro', 'gado-nobre'),
  ('Renan', 'Garçom', 'gado-nobre'),
  ('Juliana', 'Garçonete', 'gado-nobre'),
  ('Patrícia', 'Caixa', 'gado-nobre'),
  ('Wellington', 'Churrasqueiro', 'gado-nobre'),
  ('Diego', 'Auxiliar de cozinha', 'gado-nobre'),
  ('Adriana', 'Cozinheira', 'rancho-tijucas'),
  ('Marcos', 'Chapeiro', 'rancho-tijucas'),
  ('Luana', 'Atendente', 'rancho-tijucas'),
  ('Fernanda', 'Caixa', 'rancho-tijucas'),
  ('Jéssica', 'Cozinheira', 'rancho-biguacu'),
  ('Anderson', 'Chapeiro', 'rancho-biguacu'),
  ('Tatiane', 'Atendente', 'rancho-biguacu'),
  ('Gustavo', 'Caixa', 'rancho-biguacu'),
  ('Rosângela', 'Cozinheira', 'beira-rio'),
  ('Paulo', 'Entregador', 'beira-rio'),
  ('Camila', 'Atendente', 'beira-rio'),
  ('Vanessa', 'Caixa', 'beira-rio');

insert into produtos (id, nome, categoria, unidade_medida, codigo_barras, custo, preco_venda) values
  ('picanha', 'Picanha', 'carne', 'kg', null, 74.9, null),
  ('alcatra', 'Alcatra', 'carne', 'kg', null, 42.5, null),
  ('fraldinha', 'Fraldinha', 'carne', 'kg', null, 39.9, null),
  ('costela', 'Costela', 'carne', 'kg', null, 26.9, null),
  ('maminha', 'Maminha', 'carne', 'kg', null, 41.9, null),
  ('linguica', 'Linguiça', 'carne', 'kg', null, 19.9, null),
  ('coracao', 'Coração de frango', 'carne', 'kg', null, 24.9, null),
  ('coxa', 'Coxa de frango', 'carne', 'kg', null, 12.9, null),
  ('cupim', 'Cupim', 'carne', 'kg', null, 36.9, null),
  ('coca-2l', 'Coca-Cola 2L', 'bebida', 'un', '7894900011517', 8.4, 16),
  ('coca-lata', 'Coca-Cola lata 350ml', 'bebida', 'un', '7894900010015', 3.1, 7),
  ('guarana-2l', 'Guaraná Antarctica 2L', 'bebida', 'un', '7891991010924', 6.9, 14),
  ('heineken', 'Heineken long neck', 'bebida', 'un', '7896045504831', 5.8, 13),
  ('brahma', 'Brahma 600ml', 'bebida', 'un', '7891149100101', 6.2, 14),
  ('agua', 'Água sem gás 500ml', 'bebida', 'un', '7896065880011', 1.3, 5),
  ('suco', 'Suco natural 500ml', 'bebida', 'un', '2000000000107', 3.5, 11),
  ('arroz', 'Arroz 5kg (fardo)', 'mercearia', 'un', '7896006711152', 27.9, null),
  ('feijao', 'Feijão 1kg (fardo)', 'mercearia', 'un', '7896006751004', 8.9, null),
  ('macarrao', 'Macarrão 500g', 'mercearia', 'un', '7896022205017', 4.6, null),
  ('farinha', 'Farinha de trigo 1kg', 'mercearia', 'un', '7896079900019', 5.4, null),
  ('oleo', 'Óleo de soja 900ml', 'mercearia', 'un', '7891107101621', 7.9, null);

insert into fornecedores (nome, cnpj) values
  ('Frigorífico Vale do Itajaí', '12.345.678/0001-90'),
  ('Distribuidora Litoral', '23.456.789/0001-01'),
  ('Bebidas SC', '34.567.890/0001-12');

insert into bairros (id, unidade_id, nome, taxa) values
  ('centro', 'beira-rio', 'Centro', 5),
  ('sete-setembro', 'beira-rio', 'Sete de Setembro', 6),
  ('coloninha', 'beira-rio', 'Coloninha', 7),
  ('bela-vista', 'beira-rio', 'Bela Vista', 8),
  ('margem-esquerda', 'beira-rio', 'Margem Esquerda', 8),
  ('gasparinho', 'beira-rio', 'Gasparinho', 10),
  ('poco-grande', 'beira-rio', 'Poço Grande', 12);

insert into itens_cardapio (id, nome, descricao, categoria, preco, produto_id, disponivel_online) values
  ('rod-adulto', 'Rodízio adulto', null, 'rodizio', 89.9, null, false),
  ('rod-crianca', 'Rodízio criança (5 a 10 anos)', null, 'rodizio', 44.9, null, false),
  ('beb-coca-lata', 'Coca-Cola lata', null, 'bebidas', 7, 'coca-lata', true),
  ('beb-coca-2l', 'Coca-Cola 2L', null, 'bebidas', 16, 'coca-2l', true),
  ('beb-guarana-2l', 'Guaraná 2L', null, 'bebidas', 14, 'guarana-2l', true),
  ('beb-heineken', 'Heineken long neck', null, 'bebidas', 13, 'heineken', false),
  ('beb-brahma', 'Brahma 600ml', null, 'bebidas', 14, 'brahma', false),
  ('beb-agua', 'Água sem gás', null, 'bebidas', 5, 'agua', true),
  ('beb-agua-gas', 'Água com gás', null, 'bebidas', 6, null, false),
  ('beb-suco', 'Suco natural (laranja)', null, 'bebidas', 11, 'suco', true),
  ('beb-suco-abacaxi', 'Suco natural (abacaxi c/ hortelã)', null, 'bebidas', 12, null, false),
  ('beb-caipirinha', 'Caipirinha de limão', null, 'bebidas', 22, null, false),
  ('sob-pudim', 'Pudim de leite', null, 'sobremesas', 14, null, true),
  ('sob-petit', 'Petit gâteau com sorvete', null, 'sobremesas', 24, null, true),
  ('sob-abacaxi', 'Abacaxi com canela', null, 'sobremesas', 12, null, true),
  ('sob-mousse', 'Mousse de maracujá', null, 'sobremesas', 13, null, true),
  ('mar-p', 'Marmita P', 'Arroz, feijão, 1 carne e salada · 500g', 'marmitas', 18, null, true),
  ('mar-m', 'Marmita M', 'Arroz, feijão, 2 carnes, salada e farofa · 750g', 'marmitas', 23, null, true),
  ('mar-g', 'Marmita G', 'Arroz, feijão, 2 carnes, massa, salada e farofa · 1kg', 'marmitas', 28, null, true),
  ('exe-file', 'Filé de frango à parmegiana', 'Com arroz, fritas e salada', 'executivos', 36, null, true),
  ('exe-bife', 'Bife acebolado', 'Alcatra, arroz, feijão, fritas e ovo', 'executivos', 38, null, true),
  ('exe-tilapia', 'Filé de tilápia grelhado', 'Com arroz, pirão e salada', 'executivos', 42, null, true),
  ('exe-costela', 'Costela no bafo', 'Com mandioca, arroz e vinagrete', 'executivos', 44, null, true);

insert into mesas (unidade_id, numero) values
  ('gado-nobre', 1),
  ('gado-nobre', 2),
  ('gado-nobre', 3),
  ('gado-nobre', 4),
  ('gado-nobre', 5),
  ('gado-nobre', 6),
  ('gado-nobre', 7),
  ('gado-nobre', 8),
  ('gado-nobre', 9),
  ('gado-nobre', 10),
  ('gado-nobre', 11),
  ('gado-nobre', 12),
  ('gado-nobre', 13),
  ('gado-nobre', 14),
  ('gado-nobre', 15),
  ('gado-nobre', 16),
  ('gado-nobre', 17),
  ('gado-nobre', 18),
  ('gado-nobre', 19),
  ('gado-nobre', 20),
  ('gado-nobre', 21),
  ('gado-nobre', 22),
  ('gado-nobre', 23),
  ('gado-nobre', 24),
  ('gado-nobre', 25),
  ('gado-nobre', 26),
  ('gado-nobre', 27),
  ('gado-nobre', 28),
  ('gado-nobre', 29),
  ('gado-nobre', 30),
  ('rancho-tijucas', 1),
  ('rancho-tijucas', 2),
  ('rancho-tijucas', 3),
  ('rancho-tijucas', 4),
  ('rancho-tijucas', 5),
  ('rancho-tijucas', 6),
  ('rancho-tijucas', 7),
  ('rancho-tijucas', 8),
  ('rancho-tijucas', 9),
  ('rancho-tijucas', 10),
  ('rancho-tijucas', 11),
  ('rancho-tijucas', 12),
  ('rancho-tijucas', 13),
  ('rancho-tijucas', 14),
  ('rancho-tijucas', 15),
  ('rancho-tijucas', 16),
  ('rancho-tijucas', 17),
  ('rancho-tijucas', 18),
  ('rancho-tijucas', 19),
  ('rancho-tijucas', 20),
  ('rancho-biguacu', 1),
  ('rancho-biguacu', 2),
  ('rancho-biguacu', 3),
  ('rancho-biguacu', 4),
  ('rancho-biguacu', 5),
  ('rancho-biguacu', 6),
  ('rancho-biguacu', 7),
  ('rancho-biguacu', 8),
  ('rancho-biguacu', 9),
  ('rancho-biguacu', 10),
  ('rancho-biguacu', 11),
  ('rancho-biguacu', 12),
  ('rancho-biguacu', 13),
  ('rancho-biguacu', 14),
  ('rancho-biguacu', 15),
  ('rancho-biguacu', 16),
  ('rancho-biguacu', 17),
  ('rancho-biguacu', 18),
  ('rancho-biguacu', 19),
  ('rancho-biguacu', 20),
  ('beira-rio', 1),
  ('beira-rio', 2),
  ('beira-rio', 3),
  ('beira-rio', 4),
  ('beira-rio', 5),
  ('beira-rio', 6),
  ('beira-rio', 7),
  ('beira-rio', 8),
  ('beira-rio', 9),
  ('beira-rio', 10),
  ('beira-rio', 11),
  ('beira-rio', 12),
  ('beira-rio', 13),
  ('beira-rio', 14),
  ('beira-rio', 15),
  ('beira-rio', 16);

insert into movimentos (unidade_id, produto_id, tipo, quantidade, feito_por_nome, referencia) values
  ('central', 'picanha', 'ajuste_inventario', 86.4, 'Implantação', 'Estoque inicial'),
  ('central', 'alcatra', 'ajuste_inventario', 124.8, 'Implantação', 'Estoque inicial'),
  ('central', 'fraldinha', 'ajuste_inventario', 98.2, 'Implantação', 'Estoque inicial'),
  ('central', 'costela', 'ajuste_inventario', 142.5, 'Implantação', 'Estoque inicial'),
  ('central', 'maminha', 'ajuste_inventario', 54.3, 'Implantação', 'Estoque inicial'),
  ('central', 'linguica', 'ajuste_inventario', 38.6, 'Implantação', 'Estoque inicial'),
  ('central', 'coracao', 'ajuste_inventario', 22.1, 'Implantação', 'Estoque inicial'),
  ('central', 'coxa', 'ajuste_inventario', 76.9, 'Implantação', 'Estoque inicial'),
  ('central', 'cupim', 'ajuste_inventario', 31.7, 'Implantação', 'Estoque inicial'),
  ('central', 'coca-2l', 'ajuste_inventario', 96, 'Implantação', 'Estoque inicial'),
  ('central', 'coca-lata', 'ajuste_inventario', 288, 'Implantação', 'Estoque inicial'),
  ('central', 'guarana-2l', 'ajuste_inventario', 54, 'Implantação', 'Estoque inicial'),
  ('central', 'heineken', 'ajuste_inventario', 144, 'Implantação', 'Estoque inicial'),
  ('central', 'brahma', 'ajuste_inventario', 72, 'Implantação', 'Estoque inicial'),
  ('central', 'agua', 'ajuste_inventario', 210, 'Implantação', 'Estoque inicial'),
  ('central', 'suco', 'ajuste_inventario', 40, 'Implantação', 'Estoque inicial'),
  ('central', 'arroz', 'ajuste_inventario', 18, 'Implantação', 'Estoque inicial'),
  ('central', 'feijao', 'ajuste_inventario', 34, 'Implantação', 'Estoque inicial'),
  ('central', 'macarrao', 'ajuste_inventario', 46, 'Implantação', 'Estoque inicial'),
  ('central', 'farinha', 'ajuste_inventario', 9, 'Implantação', 'Estoque inicial'),
  ('central', 'oleo', 'ajuste_inventario', 28, 'Implantação', 'Estoque inicial'),
  ('gado-nobre', 'picanha', 'ajuste_inventario', 18.35, 'Implantação', 'Estoque inicial'),
  ('gado-nobre', 'alcatra', 'ajuste_inventario', 22.6, 'Implantação', 'Estoque inicial'),
  ('gado-nobre', 'fraldinha', 'ajuste_inventario', 9.8, 'Implantação', 'Estoque inicial'),
  ('gado-nobre', 'costela', 'ajuste_inventario', 31.2, 'Implantação', 'Estoque inicial'),
  ('gado-nobre', 'maminha', 'ajuste_inventario', 11.4, 'Implantação', 'Estoque inicial'),
  ('gado-nobre', 'linguica', 'ajuste_inventario', 14.7, 'Implantação', 'Estoque inicial'),
  ('gado-nobre', 'coracao', 'ajuste_inventario', 4.3, 'Implantação', 'Estoque inicial'),
  ('gado-nobre', 'coxa', 'ajuste_inventario', 12.9, 'Implantação', 'Estoque inicial'),
  ('gado-nobre', 'cupim', 'ajuste_inventario', 16.2, 'Implantação', 'Estoque inicial'),
  ('gado-nobre', 'coca-2l', 'ajuste_inventario', 22, 'Implantação', 'Estoque inicial'),
  ('gado-nobre', 'coca-lata', 'ajuste_inventario', 64, 'Implantação', 'Estoque inicial'),
  ('gado-nobre', 'heineken', 'ajuste_inventario', 48, 'Implantação', 'Estoque inicial'),
  ('gado-nobre', 'brahma', 'ajuste_inventario', 30, 'Implantação', 'Estoque inicial'),
  ('gado-nobre', 'agua', 'ajuste_inventario', 40, 'Implantação', 'Estoque inicial'),
  ('gado-nobre', 'guarana-2l', 'ajuste_inventario', 14, 'Implantação', 'Estoque inicial'),
  ('gado-nobre', 'suco', 'ajuste_inventario', 12, 'Implantação', 'Estoque inicial'),
  ('rancho-tijucas', 'alcatra', 'ajuste_inventario', 8.4, 'Implantação', 'Estoque inicial'),
  ('rancho-tijucas', 'costela', 'ajuste_inventario', 12.1, 'Implantação', 'Estoque inicial'),
  ('rancho-tijucas', 'coxa', 'ajuste_inventario', 15.3, 'Implantação', 'Estoque inicial'),
  ('rancho-tijucas', 'linguica', 'ajuste_inventario', 4.2, 'Implantação', 'Estoque inicial'),
  ('rancho-tijucas', 'fraldinha', 'ajuste_inventario', 6.6, 'Implantação', 'Estoque inicial'),
  ('rancho-tijucas', 'coca-lata', 'ajuste_inventario', 30, 'Implantação', 'Estoque inicial'),
  ('rancho-biguacu', 'alcatra', 'ajuste_inventario', 7.9, 'Implantação', 'Estoque inicial'),
  ('rancho-biguacu', 'costela', 'ajuste_inventario', 10.4, 'Implantação', 'Estoque inicial'),
  ('rancho-biguacu', 'coxa', 'ajuste_inventario', 13.8, 'Implantação', 'Estoque inicial'),
  ('rancho-biguacu', 'linguica', 'ajuste_inventario', 6.1, 'Implantação', 'Estoque inicial'),
  ('rancho-biguacu', 'fraldinha', 'ajuste_inventario', 3.2, 'Implantação', 'Estoque inicial'),
  ('rancho-biguacu', 'coca-lata', 'ajuste_inventario', 18, 'Implantação', 'Estoque inicial'),
  ('beira-rio', 'alcatra', 'ajuste_inventario', 9.7, 'Implantação', 'Estoque inicial'),
  ('beira-rio', 'costela', 'ajuste_inventario', 14.6, 'Implantação', 'Estoque inicial'),
  ('beira-rio', 'coxa', 'ajuste_inventario', 18.2, 'Implantação', 'Estoque inicial'),
  ('beira-rio', 'linguica', 'ajuste_inventario', 7.4, 'Implantação', 'Estoque inicial'),
  ('beira-rio', 'maminha', 'ajuste_inventario', 5.1, 'Implantação', 'Estoque inicial'),
  ('beira-rio', 'coca-lata', 'ajuste_inventario', 42, 'Implantação', 'Estoque inicial');

update estoque set minimo = 40 where unidade_id = 'central' and produto_id = 'picanha';
update estoque set minimo = 50 where unidade_id = 'central' and produto_id = 'alcatra';
update estoque set minimo = 40 where unidade_id = 'central' and produto_id = 'fraldinha';
update estoque set minimo = 60 where unidade_id = 'central' and produto_id = 'costela';
update estoque set minimo = 30 where unidade_id = 'central' and produto_id = 'maminha';
update estoque set minimo = 40 where unidade_id = 'central' and produto_id = 'linguica';
update estoque set minimo = 25 where unidade_id = 'central' and produto_id = 'coracao';
update estoque set minimo = 40 where unidade_id = 'central' and produto_id = 'coxa';
update estoque set minimo = 20 where unidade_id = 'central' and produto_id = 'cupim';
update estoque set minimo = 48 where unidade_id = 'central' and produto_id = 'coca-2l';
update estoque set minimo = 120 where unidade_id = 'central' and produto_id = 'coca-lata';
update estoque set minimo = 36 where unidade_id = 'central' and produto_id = 'guarana-2l';
update estoque set minimo = 96 where unidade_id = 'central' and produto_id = 'heineken';
update estoque set minimo = 48 where unidade_id = 'central' and produto_id = 'brahma';
update estoque set minimo = 96 where unidade_id = 'central' and produto_id = 'agua';
update estoque set minimo = 24 where unidade_id = 'central' and produto_id = 'suco';
update estoque set minimo = 12 where unidade_id = 'central' and produto_id = 'arroz';
update estoque set minimo = 20 where unidade_id = 'central' and produto_id = 'feijao';
update estoque set minimo = 30 where unidade_id = 'central' and produto_id = 'macarrao';
update estoque set minimo = 15 where unidade_id = 'central' and produto_id = 'farinha';
update estoque set minimo = 20 where unidade_id = 'central' and produto_id = 'oleo';
update estoque set minimo = 15 where unidade_id = 'gado-nobre' and produto_id = 'picanha';
update estoque set minimo = 15 where unidade_id = 'gado-nobre' and produto_id = 'alcatra';
update estoque set minimo = 12 where unidade_id = 'gado-nobre' and produto_id = 'fraldinha';
update estoque set minimo = 20 where unidade_id = 'gado-nobre' and produto_id = 'costela';
update estoque set minimo = 10 where unidade_id = 'gado-nobre' and produto_id = 'maminha';
update estoque set minimo = 8 where unidade_id = 'gado-nobre' and produto_id = 'linguica';
update estoque set minimo = 6 where unidade_id = 'gado-nobre' and produto_id = 'coracao';
update estoque set minimo = 8 where unidade_id = 'gado-nobre' and produto_id = 'coxa';
update estoque set minimo = 10 where unidade_id = 'gado-nobre' and produto_id = 'cupim';
update estoque set minimo = 12 where unidade_id = 'gado-nobre' and produto_id = 'coca-2l';
update estoque set minimo = 36 where unidade_id = 'gado-nobre' and produto_id = 'coca-lata';
update estoque set minimo = 48 where unidade_id = 'gado-nobre' and produto_id = 'heineken';
update estoque set minimo = 24 where unidade_id = 'gado-nobre' and produto_id = 'brahma';
update estoque set minimo = 24 where unidade_id = 'gado-nobre' and produto_id = 'agua';
update estoque set minimo = 10 where unidade_id = 'gado-nobre' and produto_id = 'guarana-2l';
update estoque set minimo = 10 where unidade_id = 'gado-nobre' and produto_id = 'suco';
update estoque set minimo = 6 where unidade_id = 'rancho-tijucas' and produto_id = 'alcatra';
update estoque set minimo = 8 where unidade_id = 'rancho-tijucas' and produto_id = 'costela';
update estoque set minimo = 10 where unidade_id = 'rancho-tijucas' and produto_id = 'coxa';
update estoque set minimo = 5 where unidade_id = 'rancho-tijucas' and produto_id = 'linguica';
update estoque set minimo = 5 where unidade_id = 'rancho-tijucas' and produto_id = 'fraldinha';
update estoque set minimo = 24 where unidade_id = 'rancho-tijucas' and produto_id = 'coca-lata';
update estoque set minimo = 6 where unidade_id = 'rancho-biguacu' and produto_id = 'alcatra';
update estoque set minimo = 8 where unidade_id = 'rancho-biguacu' and produto_id = 'costela';
update estoque set minimo = 10 where unidade_id = 'rancho-biguacu' and produto_id = 'coxa';
update estoque set minimo = 5 where unidade_id = 'rancho-biguacu' and produto_id = 'linguica';
update estoque set minimo = 5 where unidade_id = 'rancho-biguacu' and produto_id = 'fraldinha';
update estoque set minimo = 24 where unidade_id = 'rancho-biguacu' and produto_id = 'coca-lata';
update estoque set minimo = 6 where unidade_id = 'beira-rio' and produto_id = 'alcatra';
update estoque set minimo = 8 where unidade_id = 'beira-rio' and produto_id = 'costela';
update estoque set minimo = 10 where unidade_id = 'beira-rio' and produto_id = 'coxa';
update estoque set minimo = 5 where unidade_id = 'beira-rio' and produto_id = 'linguica';
update estoque set minimo = 4 where unidade_id = 'beira-rio' and produto_id = 'maminha';
update estoque set minimo = 24 where unidade_id = 'beira-rio' and produto_id = 'coca-lata';

insert into lacres (numero, status) values
  ('L-004821', 'usado'),
  ('L-004822', 'usado'),
  ('L-004823', 'usado'),
  ('L-004824', 'usado');

insert into transferencias (lacre, origem_id, destino_id, produto_id, quantidade_enviada, volumes, enviado_por_nome) values
  ('L-004821', 'central', 'gado-nobre', 'alcatra', 15, 2, 'Rodrigo'),
  ('L-004822', 'central', 'gado-nobre', 'picanha', 10, 1, 'Rodrigo'),
  ('L-004823', 'central', 'gado-nobre', 'fraldinha', 12.5, 2, 'Eliane'),
  ('L-004824', 'central', 'rancho-biguacu', 'alcatra', 8, 1, 'Márcio');
