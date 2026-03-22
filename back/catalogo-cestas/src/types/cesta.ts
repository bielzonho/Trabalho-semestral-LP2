export interface ItemCesta {
  nome: string;
  quantidade: number;
}

export interface Cesta {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  imagem: string;
  ativa: boolean;
  itens: ItemCesta[];
}