export type StatusPedido =
  | "pendente"
  | "confirmado"
  | "em_preparacao"
  | "saiu_para_entrega"
  | "entregue"
  | "cancelado";

export interface PedidoItem {
  id: string;
  pedidoId: string;
  produtoId: string;
  quantidade: number;
  precoUnitario: number;
  criadoEm: string;
}

export interface Pedido {
  id: string;
  cestaId: string | null;
  clienteNome: string;
  status: StatusPedido;
  valorTotal: number;
  observacoes?: string;
  criadoEm: string;
  itens?: PedidoItem[];
}