import type { Bairro, Fornecedor, Funcionario, ItemCardapio, Produto, Unidade } from '../types'

export const TOLERANCIA_DIVERGENCIA = 0.02 // 2%

export const unidades: Unidade[] = [
  {
    id: 'central', nome: 'Central de Compras', cidade: 'Brusque', tipo: 'central',
    descricao: 'Estoque e distribuição', cor: '#475569',
    horarioAbertura: '06:00', horarioFechamento: '18:00', totalMesas: 0,
  },
  {
    id: 'gado-nobre', nome: 'Gado Nobre', cidade: 'Brusque', tipo: 'rodizio',
    descricao: 'Churrascaria rodízio · espeto corrido', cor: '#B91C1C',
    horarioAbertura: '11:00', horarioFechamento: '23:00', totalMesas: 30,
  },
  {
    id: 'rancho-tijucas', nome: 'Delícias do Rancho', cidade: 'Tijucas', tipo: 'chapa-buffet',
    descricao: 'Chapa, buffet livre e marmita', cor: '#C2410C',
    horarioAbertura: '10:30', horarioFechamento: '15:30', totalMesas: 20,
  },
  {
    id: 'rancho-biguacu', nome: 'Delícias do Rancho', cidade: 'Biguaçu', tipo: 'chapa-buffet',
    descricao: 'Chapa, buffet livre e marmita', cor: '#A16207',
    horarioAbertura: '10:30', horarioFechamento: '15:30', totalMesas: 20,
  },
  {
    id: 'beira-rio', nome: 'Beira Rio', cidade: 'Gaspar', tipo: 'buffet-entrega',
    descricao: 'Buffet livre, marmita e entrega', cor: '#0F766E',
    horarioAbertura: '10:30', horarioFechamento: '15:00', totalMesas: 16,
  },
]

export const unidadesRestaurante = unidades.filter((u) => u.tipo !== 'central')

export const funcionarios: Funcionario[] = [
  { id: 'f-cen-1', nome: 'Rodrigo', funcao: 'Estoquista', unidadeId: 'central' },
  { id: 'f-cen-2', nome: 'Sandra', funcao: 'Compradora', unidadeId: 'central' },
  { id: 'f-cen-3', nome: 'Márcio', funcao: 'Motorista', unidadeId: 'central' },
  { id: 'f-cen-4', nome: 'Eliane', funcao: 'Auxiliar de estoque', unidadeId: 'central' },

  { id: 'f-gn-1', nome: 'Carlos', funcao: 'Churrasqueiro', unidadeId: 'gado-nobre' },
  { id: 'f-gn-2', nome: 'Renan', funcao: 'Garçom', unidadeId: 'gado-nobre' },
  { id: 'f-gn-3', nome: 'Juliana', funcao: 'Garçonete', unidadeId: 'gado-nobre' },
  { id: 'f-gn-4', nome: 'Patrícia', funcao: 'Caixa', unidadeId: 'gado-nobre' },
  { id: 'f-gn-5', nome: 'Wellington', funcao: 'Churrasqueiro', unidadeId: 'gado-nobre' },
  { id: 'f-gn-6', nome: 'Diego', funcao: 'Auxiliar de cozinha', unidadeId: 'gado-nobre' },

  { id: 'f-rt-1', nome: 'Adriana', funcao: 'Cozinheira', unidadeId: 'rancho-tijucas' },
  { id: 'f-rt-2', nome: 'Marcos', funcao: 'Chapeiro', unidadeId: 'rancho-tijucas' },
  { id: 'f-rt-3', nome: 'Luana', funcao: 'Atendente', unidadeId: 'rancho-tijucas' },
  { id: 'f-rt-4', nome: 'Fernanda', funcao: 'Caixa', unidadeId: 'rancho-tijucas' },

  { id: 'f-rb-1', nome: 'Jéssica', funcao: 'Cozinheira', unidadeId: 'rancho-biguacu' },
  { id: 'f-rb-2', nome: 'Anderson', funcao: 'Chapeiro', unidadeId: 'rancho-biguacu' },
  { id: 'f-rb-3', nome: 'Tatiane', funcao: 'Atendente', unidadeId: 'rancho-biguacu' },
  { id: 'f-rb-4', nome: 'Gustavo', funcao: 'Caixa', unidadeId: 'rancho-biguacu' },

  { id: 'f-br-1', nome: 'Rosângela', funcao: 'Cozinheira', unidadeId: 'beira-rio' },
  { id: 'f-br-2', nome: 'Paulo', funcao: 'Entregador', unidadeId: 'beira-rio' },
  { id: 'f-br-3', nome: 'Camila', funcao: 'Atendente', unidadeId: 'beira-rio' },
  { id: 'f-br-4', nome: 'Vanessa', funcao: 'Caixa', unidadeId: 'beira-rio' },
]

export const produtos: Produto[] = [
  // Carnes (por peso) — custo por kg
  { id: 'picanha', nome: 'Picanha', categoria: 'carne', unidadeMedida: 'kg', custo: 74.9 },
  { id: 'alcatra', nome: 'Alcatra', categoria: 'carne', unidadeMedida: 'kg', custo: 42.5 },
  { id: 'fraldinha', nome: 'Fraldinha', categoria: 'carne', unidadeMedida: 'kg', custo: 39.9 },
  { id: 'costela', nome: 'Costela', categoria: 'carne', unidadeMedida: 'kg', custo: 26.9 },
  { id: 'maminha', nome: 'Maminha', categoria: 'carne', unidadeMedida: 'kg', custo: 41.9 },
  { id: 'linguica', nome: 'Linguiça', categoria: 'carne', unidadeMedida: 'kg', custo: 19.9 },
  { id: 'coracao', nome: 'Coração de frango', categoria: 'carne', unidadeMedida: 'kg', custo: 24.9 },
  { id: 'coxa', nome: 'Coxa de frango', categoria: 'carne', unidadeMedida: 'kg', custo: 12.9 },
  { id: 'cupim', nome: 'Cupim', categoria: 'carne', unidadeMedida: 'kg', custo: 36.9 },

  // Bebidas
  { id: 'coca-2l', nome: 'Coca-Cola 2L', categoria: 'bebida', unidadeMedida: 'un', codigoBarras: '7894900011517', custo: 8.4, precoVenda: 16 },
  { id: 'coca-lata', nome: 'Coca-Cola lata 350ml', categoria: 'bebida', unidadeMedida: 'un', codigoBarras: '7894900010015', custo: 3.1, precoVenda: 7 },
  { id: 'guarana-2l', nome: 'Guaraná Antarctica 2L', categoria: 'bebida', unidadeMedida: 'un', codigoBarras: '7891991010924', custo: 6.9, precoVenda: 14 },
  { id: 'heineken', nome: 'Heineken long neck', categoria: 'bebida', unidadeMedida: 'un', codigoBarras: '7896045504831', custo: 5.8, precoVenda: 13 },
  { id: 'brahma', nome: 'Brahma 600ml', categoria: 'bebida', unidadeMedida: 'un', codigoBarras: '7891149100101', custo: 6.2, precoVenda: 14 },
  { id: 'agua', nome: 'Água sem gás 500ml', categoria: 'bebida', unidadeMedida: 'un', codigoBarras: '7896065880011', custo: 1.3, precoVenda: 5 },
  { id: 'suco', nome: 'Suco natural 500ml', categoria: 'bebida', unidadeMedida: 'un', codigoBarras: '2000000000107', custo: 3.5, precoVenda: 11 },

  // Mercearia
  { id: 'arroz', nome: 'Arroz 5kg (fardo)', categoria: 'mercearia', unidadeMedida: 'un', codigoBarras: '7896006711152', custo: 27.9 },
  { id: 'feijao', nome: 'Feijão 1kg (fardo)', categoria: 'mercearia', unidadeMedida: 'un', codigoBarras: '7896006751004', custo: 8.9 },
  { id: 'macarrao', nome: 'Macarrão 500g', categoria: 'mercearia', unidadeMedida: 'un', codigoBarras: '7896022205017', custo: 4.6 },
  { id: 'farinha', nome: 'Farinha de trigo 1kg', categoria: 'mercearia', unidadeMedida: 'un', codigoBarras: '7896079900019', custo: 5.4 },
  { id: 'oleo', nome: 'Óleo de soja 900ml', categoria: 'mercearia', unidadeMedida: 'un', codigoBarras: '7891107101621', custo: 7.9 },
]

export const fornecedores: Fornecedor[] = [
  { id: 'forn-1', nome: 'Frigorífico Vale do Itajaí', cnpj: '12.345.678/0001-90' },
  { id: 'forn-2', nome: 'Distribuidora Litoral', cnpj: '23.456.789/0001-01' },
  { id: 'forn-3', nome: 'Bebidas SC', cnpj: '34.567.890/0001-12' },
]

export const cardapio: ItemCardapio[] = [
  { id: 'rod-adulto', nome: 'Rodízio adulto', categoria: 'rodizio', preco: 89.9 },
  { id: 'rod-crianca', nome: 'Rodízio criança (5 a 10 anos)', categoria: 'rodizio', preco: 44.9 },

  { id: 'beb-coca-lata', nome: 'Coca-Cola lata', categoria: 'bebidas', preco: 7, produtoId: 'coca-lata' },
  { id: 'beb-coca-2l', nome: 'Coca-Cola 2L', categoria: 'bebidas', preco: 16, produtoId: 'coca-2l' },
  { id: 'beb-guarana-2l', nome: 'Guaraná 2L', categoria: 'bebidas', preco: 14, produtoId: 'guarana-2l' },
  { id: 'beb-heineken', nome: 'Heineken long neck', categoria: 'bebidas', preco: 13, produtoId: 'heineken' },
  { id: 'beb-brahma', nome: 'Brahma 600ml', categoria: 'bebidas', preco: 14, produtoId: 'brahma' },
  { id: 'beb-agua', nome: 'Água sem gás', categoria: 'bebidas', preco: 5, produtoId: 'agua' },
  { id: 'beb-agua-gas', nome: 'Água com gás', categoria: 'bebidas', preco: 6 },
  { id: 'beb-suco', nome: 'Suco natural (laranja)', categoria: 'bebidas', preco: 11, produtoId: 'suco' },
  { id: 'beb-suco-abacaxi', nome: 'Suco natural (abacaxi c/ hortelã)', categoria: 'bebidas', preco: 12 },
  { id: 'beb-caipirinha', nome: 'Caipirinha de limão', categoria: 'bebidas', preco: 22 },

  { id: 'sob-pudim', nome: 'Pudim de leite', categoria: 'sobremesas', preco: 14 },
  { id: 'sob-petit', nome: 'Petit gâteau com sorvete', categoria: 'sobremesas', preco: 24 },
  { id: 'sob-abacaxi', nome: 'Abacaxi com canela', categoria: 'sobremesas', preco: 12 },
  { id: 'sob-mousse', nome: 'Mousse de maracujá', categoria: 'sobremesas', preco: 13 },

  { id: 'mar-p', nome: 'Marmita P', descricao: 'Arroz, feijão, 1 carne e salada · 500g', categoria: 'marmitas', preco: 18 },
  { id: 'mar-m', nome: 'Marmita M', descricao: 'Arroz, feijão, 2 carnes, salada e farofa · 750g', categoria: 'marmitas', preco: 23 },
  { id: 'mar-g', nome: 'Marmita G', descricao: 'Arroz, feijão, 2 carnes, massa, salada e farofa · 1kg', categoria: 'marmitas', preco: 28 },

  { id: 'exe-file', nome: 'Filé de frango à parmegiana', descricao: 'Com arroz, fritas e salada', categoria: 'executivos', preco: 36 },
  { id: 'exe-bife', nome: 'Bife acebolado', descricao: 'Alcatra, arroz, feijão, fritas e ovo', categoria: 'executivos', preco: 38 },
  { id: 'exe-tilapia', nome: 'Filé de tilápia grelhado', descricao: 'Com arroz, pirão e salada', categoria: 'executivos', preco: 42 },
  { id: 'exe-costela', nome: 'Costela no bafo', descricao: 'Com mandioca, arroz e vinagrete', categoria: 'executivos', preco: 44 },
]

// Bairros de Gaspar — taxas fictícias, fácil de editar.
export const bairros: Bairro[] = [
  { id: 'centro', unidadeId: 'beira-rio', nome: 'Centro', taxa: 5 },
  { id: 'sete-setembro', unidadeId: 'beira-rio', nome: 'Sete de Setembro', taxa: 6 },
  { id: 'coloninha', unidadeId: 'beira-rio', nome: 'Coloninha', taxa: 7 },
  { id: 'bela-vista', unidadeId: 'beira-rio', nome: 'Bela Vista', taxa: 8 },
  { id: 'margem-esquerda', unidadeId: 'beira-rio', nome: 'Margem Esquerda', taxa: 8 },
  { id: 'gasparinho', unidadeId: 'beira-rio', nome: 'Gasparinho', taxa: 10 },
  { id: 'poco-grande', unidadeId: 'beira-rio', nome: 'Poço Grande', taxa: 12 },
]

export const getUnidade = (id: string) => unidades.find((u) => u.id === id)!
export const getProduto = (id: string) => produtos.find((p) => p.id === id)!
export const getCardapio = (id: string) => cardapio.find((c) => c.id === id)!
export const getFuncionario = (id: string) => funcionarios.find((f) => f.id === id)
export const funcionariosDa = (unidadeId: string) => funcionarios.filter((f) => f.unidadeId === unidadeId)
