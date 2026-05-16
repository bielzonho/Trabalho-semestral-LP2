import { v4 as uuidv4 } from "uuid";
import { Cesta, CestaItem } from "../types/cesta";

// IDs de exemplo para produtos (serão correlacionados com o microsserviço de produtos)
const produtoIds = {
  cafePremium: "produto-1",
  paofranc: "produto-2",
  croissant: "produto-3",
  leite: "produto-4",
  queijo: "produto-5",
  geleia: "produto-6",
  suco: "produto-7",
  maca: "produto-8"
};

export const cestas: Cesta[] = [
  {
    id: uuidv4(),
    nome: "Cesta Clássica",
    descricao:
      "Cesta tradicional ideal para um café da manhã completo e aconchegante. Inclui café, leite, pães frescos e frutas selecionadas.",
    precoBase: 79.9,
    ativa: true,
    criadoEm: new Date().toISOString(),
    itens: [
      {
        id: uuidv4(),
        cestaId: "cesta-1",
        produtoId: produtoIds.cafePremium,
        quantidade: 1,
        criadoEm: new Date().toISOString()
      },
      {
        id: uuidv4(),
        cestaId: "cesta-1",
        produtoId: produtoIds.leite,
        quantidade: 1,
        criadoEm: new Date().toISOString()
      },
      {
        id: uuidv4(),
        cestaId: "cesta-1",
        produtoId: produtoIds.paofranc,
        quantidade: 6,
        criadoEm: new Date().toISOString()
      },
      {
        id: uuidv4(),
        cestaId: "cesta-1",
        produtoId: produtoIds.maca,
        quantidade: 2,
        criadoEm: new Date().toISOString()
      }
    ]
  },
  {
    id: uuidv4(),
    nome: "Cesta Premium",
    descricao:
      "Cesta sofisticada com itens gourmet cuidadosamente selecionados. Contém café especial, pães artesanais, frios de qualidade, acompanhamentos refinados e produtos diferenciados, perfeita para ocasiões especiais.",
    precoBase: 129.9,
    ativa: true,
    criadoEm: new Date().toISOString(),
    itens: [
      {
        id: uuidv4(),
        cestaId: "cesta-2",
        produtoId: produtoIds.cafePremium,
        quantidade: 1,
        criadoEm: new Date().toISOString()
      },
      {
        id: uuidv4(),
        cestaId: "cesta-2",
        produtoId: produtoIds.croissant,
        quantidade: 4,
        criadoEm: new Date().toISOString()
      },
      {
        id: uuidv4(),
        cestaId: "cesta-2",
        produtoId: produtoIds.suco,
        quantidade: 2,
        criadoEm: new Date().toISOString()
      },
      {
        id: uuidv4(),
        cestaId: "cesta-2",
        produtoId: produtoIds.queijo,
        quantidade: 1,
        criadoEm: new Date().toISOString()
      },
      {
        id: uuidv4(),
        cestaId: "cesta-2",
        produtoId: produtoIds.geleia,
        quantidade: 1,
        criadoEm: new Date().toISOString()
      }
    ]
  }
];