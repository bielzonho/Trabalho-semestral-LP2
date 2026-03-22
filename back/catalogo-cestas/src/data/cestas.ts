import { v4 as uuidv4 } from "uuid";
import { Cesta } from "../types/cesta";

export const cestas: Cesta[] = [
  {
    id: uuidv4(),
    nome: "Cesta Clássica",
    descricao: "Cesta tradicional ideal para um café da manhã completo e aconchegante. Inclui café, leite, pães frescos, bolo caseiro e frutas selecionadas.",
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
    descricao: "Cesta sofisticada com itens gourmet cuidadosamente selecionados. Contém café especial, pães artesanais, frios de qualidade, acompanhamentos refinados e produtos diferenciados, perfeita para ocasiões especiais ou para presentear com elegância.",
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