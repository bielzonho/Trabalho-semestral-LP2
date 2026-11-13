import axios from "axios";

const CESTAS_API = (process.env.CATALOGO_CESTAS_API_URL || "http://localhost:3010/cestas").replace(/\/+$/, "");
const PRODUTOS_API = (process.env.PRODUTOS_API_URL || "http://localhost:3012/produtos").replace(/\/+$/, "");
const TIMEOUT_MS = 5000;
const MAX_QUANTIDADE = 2147483647; // INTEGER do PostgreSQL
const MAX_TOTAL_CENTAVOS = 9999999999; // NUMERIC(10, 2) do banco

export class ErroNovoPedido extends Error {
  constructor(public readonly status: number, mensagem: string) {
    super(mensagem);
  }
}

type ItemNovoPedido = { produtoId: string; quantidade: number };

export type NovoPedido = {
  cestaId: string;
  quantidade: number;
  itens: ItemNovoPedido[];
  clienteNome?: string;
  clienteTelefone?: string;
  enderecoEntrega?: string;
  observacoes?: string;
};

function objeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function identificar(valor: unknown, campo: string): string {
  if (typeof valor === "number" && Number.isSafeInteger(valor) && valor > 0) {
    return String(valor);
  }
  if (typeof valor === "string") {
    const id = valor.trim();
    if (/^\d{1,19}$/.test(id) && BigInt(id) > 0n && BigInt(id) <= 9223372036854775807n) {
      return BigInt(id).toString();
    }
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return id.toLowerCase();
    }
  }
  throw new ErroNovoPedido(400, `${campo} deve ser um identificador válido.`);
}

function quantidadePositiva(valor: unknown, campo: string): number {
  if (typeof valor !== "number" || !Number.isSafeInteger(valor) || valor <= 0 || valor > MAX_QUANTIDADE) {
    throw new ErroNovoPedido(400, `${campo} deve ser um número inteiro positivo.`);
  }
  return valor;
}

function textoOpcional(valor: unknown, campo: string, limite: number): string | undefined {
  if (valor === undefined || valor === null) return undefined;
  if (typeof valor !== "string" || valor.trim().length > limite) {
    throw new ErroNovoPedido(400, `${campo} deve ser um texto com até ${limite} caracteres.`);
  }
  return valor.trim() || undefined;
}

// Só estes campos do cliente participam da criação. Preços, status e pago
// são definidos pelo servidor, inclusive quando vierem no JSON recebido.
export function validarNovoPedido(corpo: unknown): NovoPedido {
  if (!objeto(corpo)) throw new ErroNovoPedido(400, "O pedido deve ser um objeto JSON.");

  const cestaId = identificar(corpo.cestaId, "cestaId");
  const quantidade = quantidadePositiva(corpo.quantidade === undefined ? 1 : corpo.quantidade, "quantidade de cestas");
  const recebidos = corpo.itens === undefined ? [] : corpo.itens;
  if (!Array.isArray(recebidos) || recebidos.length > 100) {
    throw new ErroNovoPedido(400, "itens deve ser uma lista com até 100 itens adicionais.");
  }

  // Um produto pode aparecer mais de uma vez no React. Agregar evita
  // contornar a validação de saldo separando a quantidade entre linhas.
  const agrupados = new Map<string, number>();
  for (const item of recebidos) {
    if (!objeto(item)) throw new ErroNovoPedido(400, "Cada item adicional deve ser um objeto.");
    const produtoId = identificar(item.produtoId, "produtoId");
    const quantidadeItem = quantidadePositiva(item.quantidade, "quantidade do item");
    agrupados.set(produtoId, quantidadePositiva((agrupados.get(produtoId) || 0) + quantidadeItem, "quantidade total do produto"));
  }

  const clienteTelefone = textoOpcional(corpo.clienteTelefone, "clienteTelefone", 30)
    || textoOpcional(corpo.telefone, "telefone", 30);
  if (clienteTelefone && !/^\d+$/.test(clienteTelefone)) {
    throw new ErroNovoPedido(400, "O telefone deve conter somente dígitos.");
  }

  return {
    cestaId,
    quantidade,
    itens: Array.from(agrupados, ([produtoId, quantidade]) => ({ produtoId, quantidade })),
    clienteNome: textoOpcional(corpo.clienteNome, "clienteNome", 150),
    clienteTelefone,
    enderecoEntrega: textoOpcional(corpo.enderecoEntrega, "enderecoEntrega", 2000),
    observacoes: textoOpcional(corpo.observacoes, "observacoes", 2000)
  };
}

async function consultar(api: string, id: string, recurso: string): Promise<Record<string, unknown>> {
  try {
    const { data } = await axios.get(`${api}/${encodeURIComponent(id)}`, { timeout: TIMEOUT_MS });
    if (!objeto(data) || String(data.id).toLowerCase() !== id) {
      throw new ErroNovoPedido(502, `Resposta inválida do serviço de ${recurso}.`);
    }
    return data;
  } catch (err) {
    if (err instanceof ErroNovoPedido) throw err;
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      throw new ErroNovoPedido(404, `${recurso === "cestas" ? "Cesta não encontrada" : "Produto não encontrado"}: ${id}.`);
    }
    throw new ErroNovoPedido(503, `Não foi possível consultar o serviço de ${recurso}. Tente novamente.`);
  }
}

function precoEmCentavos(valor: unknown): number {
  // Catálogos retornam preços decimais; calcular em centavos evita erros
  // de ponto flutuante como 0,10 + 0,20 e rejeita preços inválidos na origem.
  if ((typeof valor !== "number" && typeof valor !== "string") || !/^\d+(\.\d{1,2})?$/.test(String(valor))) {
    throw new ErroNovoPedido(502, "O catálogo retornou um preço inválido.");
  }
  const [inteiros, decimais = ""] = String(valor).split(".");
  const centavos = Number(inteiros) * 100 + Number(decimais.padEnd(2, "0"));
  if (!Number.isSafeInteger(centavos) || centavos < 0 || centavos > MAX_TOTAL_CENTAVOS) {
    throw new ErroNovoPedido(502, "O catálogo retornou um preço inválido.");
  }
  return centavos;
}

export async function calcularTotalPedido(pedido: NovoPedido): Promise<number> {
  const [cesta, produtos] = await Promise.all([
    consultar(CESTAS_API, pedido.cestaId, "cestas"),
    Promise.all(pedido.itens.map((item) => consultar(PRODUTOS_API, item.produtoId, "produtos")))
  ]);

  if (cesta.ativa === false) throw new ErroNovoPedido(409, "A cesta selecionada está indisponível.");

  let total = precoEmCentavos(cesta.precoBase ?? cesta.preco) * pedido.quantidade;
  for (let i = 0; i < pedido.itens.length; i++) {
    const item = pedido.itens[i];
    const produto = produtos[i];
    const estoque = produto.quantidadeEstoque;
    if (typeof estoque !== "number" || !Number.isSafeInteger(estoque) || estoque < 0) {
      throw new ErroNovoPedido(502, "O catálogo retornou um estoque inválido.");
    }
    if (produto.ativo === false || estoque < item.quantidade) {
      throw new ErroNovoPedido(409, `Estoque insuficiente para o produto ${item.produtoId}.`);
    }
    total += precoEmCentavos(produto.preco) * item.quantidade;
  }
  if (!Number.isSafeInteger(total) || total > MAX_TOTAL_CENTAVOS) {
    throw new ErroNovoPedido(400, "O valor do pedido excede o limite permitido.");
  }
  return total / 100;
}
