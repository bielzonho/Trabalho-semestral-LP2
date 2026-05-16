import { v4 as uuidv4 } from "uuid";
import { Produto } from "../types/produto";

export const produtos: Produto[] = [
  {
    id: uuidv4(),
    nome: "Café Premium",
    descricao: "Café especial importado de alta qualidade",
    preco: 25.90,
    ativo: true,
    criadoEm: new Date().toISOString()
  },
  {
    id: uuidv4(),
    nome: "Pão Francês",
    descricao: "Pão francês fresco do dia",
    preco: 0.50,
    ativo: true,
    criadoEm: new Date().toISOString()
  },
  {
    id: uuidv4(),
    nome: "Croissant",
    descricao: "Croissant amanteigado feito na hora",
    preco: 3.50,
    ativo: true,
    criadoEm: new Date().toISOString()
  },
  {
    id: uuidv4(),
    nome: "Leite Integral",
    descricao: "Leite integral fresco e pasteurizado",
    preco: 4.50,
    ativo: true,
    criadoEm: new Date().toISOString()
  },
  {
    id: uuidv4(),
    nome: "Queijo Meia Cura",
    descricao: "Queijo meia cura de excelente qualidade",
    preco: 15.90,
    ativo: true,
    criadoEm: new Date().toISOString()
  },
  {
    id: uuidv4(),
    nome: "Geleia de Morango",
    descricao: "Geleia artesanal de morango fresco",
    preco: 8.90,
    ativo: true,
    criadoEm: new Date().toISOString()
  },
  {
    id: uuidv4(),
    nome: "Suco Natural",
    descricao: "Suco natural de laranja espremida",
    preco: 6.50,
    ativo: true,
    criadoEm: new Date().toISOString()
  },
  {
    id: uuidv4(),
    nome: "Maçã",
    descricao: "Maçã vermelha selecionada",
    preco: 2.50,
    ativo: true,
    criadoEm: new Date().toISOString()
  }
];
