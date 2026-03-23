import { v4 as uuidv4 } from "uuid";
import { Pedido } from "../types/pedido";

export const pedidos: Pedido[] = [
  {
    id: uuidv4(),
    clienteNome: "André",
    clienteTelefone: "11999999999",
    enderecoEntrega: "Rua das Flores, 123 - São Paulo",
    cestaId: "cesta-classica-001",
    quantidade: 1,
    valorTotal: 79.9,
    status: "PENDENTE",
    dataPedido: new Date().toISOString()
  },
  {
    id: uuidv4(),
    clienteNome: "Mariana",
    clienteTelefone: "11988888888",
    enderecoEntrega: "Av. Central, 456 - São Paulo",
    cestaId: "cesta-premium-002",
    quantidade: 2,
    valorTotal: 259.8,
    status: "CONFIRMADO",
    dataPedido: new Date().toISOString()
  }
];