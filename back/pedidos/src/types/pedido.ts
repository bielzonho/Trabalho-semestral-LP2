export type StatusPedido =
  | "PENDENTE"
  | "CONFIRMADO"
  | "EM_PREPARACAO"
  | "SAIU_PARA_ENTREGA"
  | "ENTREGUE"
  | "CANCELADO";

export interface Pedido {
  id: string;
  clienteNome: string;
  clienteTelefone: string;
  enderecoEntrega: string;
  cestaId: string;
  quantidade: number;
  valorTotal: number;
  status: StatusPedido;
  dataPedido: string;
}