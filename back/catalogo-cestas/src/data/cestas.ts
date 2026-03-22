import { v4 as uuidv4 } from "uuid";
import { Cesta } from "../types/cesta";

export const cestas: Cesta[] = [
  {
    id: uuidv4(),
    nome: "Cesta Clássica",
    descricao: "Cesta com café, leite, frutas, pão e bolo.",
    preco: 79.9,
    imagem: "https://images.unsplash.com/photo-1509440159596-0249088772ff",
    ativa: true,
    itens: [
      { nome: "Café", quantidade: 1 },
      { nome: "Leite", quantidade: 1 },
      { nome: "Pão francês", quantidade: 6 },
      { nome: "Maçã", quantidade: 2 },
      { nome: "Bolo caseiro", quantidade: 1 }
    ]
  },
  {
    id: uuidv4(),
    nome: "Cesta Premium",
    descricao: "Cesta especial com itens gourmet.",
    preco: 129.9,
    imagem: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085",
    ativa: true,
    itens: [
      { nome: "Café gourmet", quantidade: 1 },
      { nome: "Croissant", quantidade: 4 },
      { nome: "Suco natural", quantidade: 2 },
      { nome: "Queijo", quantidade: 1 },
      { nome: "Geleia artesanal", quantidade: 1 }
    ]
  }
];