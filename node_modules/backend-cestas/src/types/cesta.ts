export interface CestaItem {
  id: string;
  cestaId: string;
  produtoId: string;
  quantidade: number;
  criadoEm: string;
}

export interface Cesta {
  id: string;
  nome: string;
  descricao: string;
  precoBase: number;
  ativa: boolean;
  criadoEm: string;
  itens?: CestaItem[];
}