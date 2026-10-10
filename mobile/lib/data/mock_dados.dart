import '../models/cesta.dart';
import '../models/produto.dart';

// Dados fictícios: esta entrega ainda não integra com o back end.
// Na integração, basta trocar estas listas por chamadas a :3010/cestas e :3012/produtos.

const cestasMock = <Cesta>[
  Cesta(
    id: '1',
    nome: 'Cesta Clássica',
    descricao: 'Cesta com itens básicos para um café da manhã completo.',
    preco: 75.0,
    totalItens: 5,
    imagem: 'assets/cesta.jpg',
  ),
  Cesta(
    id: '2',
    nome: 'Cesta Premium',
    descricao: 'Seleção especial com produtos artesanais e café gourmet.',
    preco: 129.9,
    totalItens: 8,
    imagem: 'assets/cesta_premium.jpg',
  ),
  Cesta(
    id: '3',
    nome: 'Cesta Romântica',
    descricao: 'Ideal para presentear: doces, frutas e espumante sem álcool.',
    preco: 98.5,
    totalItens: 6,
    imagem: 'assets/cesta.jpg',
  ),
];

const produtosMock = <Produto>[
  Produto(
    id: '1',
    nome: 'Café Premium',
    descricao: 'Café gourmet em grãos, torra média.',
    preco: 28.9,
    quantidadeEstoque: 20,
  ),
  Produto(
    id: '2',
    nome: 'Pão de Queijo',
    descricao: 'Pacote com 10 unidades, assado na hora.',
    preco: 14.5,
    quantidadeEstoque: 6,
  ),
  Produto(
    id: '3',
    nome: 'Croissant',
    descricao: 'Croissant amanteigado com leve toque doce.',
    preco: 7.9,
    quantidadeEstoque: 32,
  ),
  Produto(
    id: '4',
    nome: 'Geleia Artesanal',
    descricao: 'Geleia de frutas vermelhas, pote de 250g.',
    preco: 19.9,
    quantidadeEstoque: 0,
  ),
  Produto(
    id: '5',
    nome: 'Suco de Laranja',
    descricao: 'Suco natural integral, garrafa de 500ml.',
    preco: 11.0,
    quantidadeEstoque: 3,
  ),
  Produto(
    id: '6',
    nome: 'Bolo de Fubá',
    descricao: 'Bolo caseiro de fubá com erva-doce.',
    preco: 22.0,
    quantidadeEstoque: 12,
  ),
];
