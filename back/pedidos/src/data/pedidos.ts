import { v4 as uuidv4 } from "uuid";
import { Pedido, PedidoItem } from "../types/pedido";

export const pedidos: Pedido[] = [
  {
    id: uuidv4(),
    clienteNome: "André Silva",
    cestaId: "cesta-classica-001",
    status: "pendente",
    valorTotal: 79.9,
    observacoes: "Entregar no período da manhã",
    criadoEm: new Date().toISOString(),
    itens: [
      {
        id: uuidv4(),
        pedidoId: "pedido-1",
        produtoId: "produto-1",
        quantidade: 1,
        precoUnitario: 25.9,
        criadoEm: new Date().toISOString()
      },
      {
        id: uuidv4(),
        pedidoId: "pedido-1",
        produtoId: "produto-2",
        quantidade: 6,
        precoUnitario: 0.5,
        criadoEm: new Date().toISOString()
      },
      {
        id: uuidv4(),
        pedidoId: "pedido-1",
        produtoId: "produto-4",
        quantidade: 1,
        precoUnitario: 4.5,
        criadoEm: new Date().toISOString()
      },
      {
        id: uuidv4(),
        pedidoId: "pedido-1",
        produtoId: "produto-8",
        quantidade: 2,
        precoUnitario: 2.5,
        criadoEm: new Date().toISOString()
      }
    ]
  },
  {
    id: uuidv4(),
    clienteNome: "Mariana Santos",
    cestaId: "cesta-premium-002",
    status: "confirmado",
    valorTotal: 259.8,
    observacoes: "Cliente VIP - prioridade",
    criadoEm: new Date().toISOString(),
    itens: [
      {
        id: uuidv4(),
        pedidoId: "pedido-2",
        produtoId: "produto-1",
        quantidade: 2,
        precoUnitario: 25.9,
        criadoEm: new Date().toISOString()
      },
      {
        id: uuidv4(),
        pedidoId: "pedido-2",
        produtoId: "produto-3",
        quantidade: 8,
        precoUnitario: 3.5,
        criadoEm: new Date().toISOString()
      },
      {
        id: uuidv4(),
        pedidoId: "pedido-2",
        produtoId: "produto-7",
        quantidade: 4,
        precoUnitario: 6.5,
        criadoEm: new Date().toISOString()
      },
      {
        id: uuidv4(),
        pedidoId: "pedido-2",
        produtoId: "produto-5",
        quantidade: 2,
        precoUnitario: 15.9,
        criadoEm: new Date().toISOString()
      }
    ]
  }
];