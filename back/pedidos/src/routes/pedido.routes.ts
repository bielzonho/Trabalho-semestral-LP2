import { Router, Request, Response } from "express";
import { supabase } from "../database";
import { Pedido, PedidoItem, StatusPedido } from "../types/pedido";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/roles.middleware";

const router = Router();

type VendaCestaRow = {
  id: string | number;
  cesta_id: string | number;
  carrinho_id?: string | number | null;
  cliente_nome?: string | null;
  cliente_telefone?: string | null;
  endereco_entrega?: string | null;
  observacoes?: string | null;
  status?: StatusPedido | null;
  preco_pago: number;
  pago: boolean;
  data_venda?: string;
};

type CarrinhoRow = {
  id: string | number;
  cesta_id: string | number;
  criado_em?: string;
};

type CarrinhoItemRow = {
  id: string | number;
  carrinho_id: string | number;
  item_id: string | number;
  quantidade: number;
};

function mapStatus(pago: boolean): StatusPedido {
  return pago ? "confirmado" : "pendente";
}

function mapPedido(row: VendaCestaRow, itens: PedidoItem[] = []): Pedido & { pago: boolean } {
  const status = row.status || mapStatus(row.pago);
  const clienteNome = row.cliente_nome || "Cliente";
  const telefone = row.cliente_telefone || "";

  return {
    id: String(row.id),
    cestaId: String(row.cesta_id),
    clienteNome,
    clienteTelefone: telefone,
    telefone,
    enderecoEntrega: row.endereco_entrega || "",
    status,
    valorTotal: Number(row.preco_pago),
    observacoes: row.observacoes || (row.pago ? "Venda paga" : "Venda pendente"),
    criadoEm: row.data_venda || "",
    itens,
    pago: row.pago
  };
}

function mapCarrinhoItem(row: CarrinhoItemRow): PedidoItem {
  return {
    id: String(row.id),
    pedidoId: String(row.carrinho_id),
    produtoId: String(row.item_id),
    quantidade: Number(row.quantidade),
    precoUnitario: 0,
    criadoEm: ""
  };
}

function handleSupabaseError(res: Response, error: { message: string }) {
  return res.status(500).json({
    mensagem: "Erro ao acessar o banco de dados.",
    detalhe: error.message
  });
}

// Status que indicam que o pedido foi efetivado (só decrementa na primeira vez)
const STATUS_EFETIVADO: StatusPedido[] = ["confirmado", "entregue"];

function deveDecrementarEstoque(
  statusAnterior: StatusPedido | null | undefined,
  novoStatus: StatusPedido
): boolean {
  return (
    STATUS_EFETIVADO.includes(novoStatus) &&
    !STATUS_EFETIVADO.includes(statusAnterior as StatusPedido)
  );
}

async function decrementarEstoque(carrinhoId: string): Promise<void> {
  const { data: itensCarrinho } = await supabase
    .from("carrinho_itens_adicionais")
    .select("item_id, quantidade")
    .eq("carrinho_id", carrinhoId);

  if (!itensCarrinho || itensCarrinho.length === 0) return;

  for (const item of itensCarrinho as { item_id: string; quantidade: number }[]) {
    const { data: produto } = await supabase
      .from("itens")
      .select("quantidade_estoque")
      .eq("id", item.item_id)
      .single();

    if (!produto) continue;

    const estoqueAtual = Number(produto.quantidade_estoque) || 0;
    const novoEstoque  = Math.max(0, estoqueAtual - item.quantidade);

    await supabase
      .from("itens")
      .update({ quantidade_estoque: novoEstoque })
      .eq("id", item.item_id);
  }
}

async function buscarItensDoCarrinho(carrinhoId: string) {
  const { data, error } = await supabase
    .from("carrinho_itens_adicionais")
    .select("*")
    .eq("carrinho_id", carrinhoId);

  if (error) throw error;

  return ((data || []) as CarrinhoItemRow[]).map(mapCarrinhoItem);
}

async function buscarCarrinhoPorCesta(cestaId: string) {
  const { data, error } = await supabase
    .from("carrinhos")
    .select("*")
    .eq("cesta_id", cestaId)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as CarrinhoRow | null;
}

async function buscarPedido(id: string) {
  const { data, error } = await supabase
    .from("vendas_cestas")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const venda = data as VendaCestaRow;
  const carrinho = venda.carrinho_id
    ? ({ id: venda.carrinho_id, cesta_id: venda.cesta_id } as CarrinhoRow)
    : await buscarCarrinhoPorCesta(String(venda.cesta_id));
  const itens = carrinho ? await buscarItensDoCarrinho(String(carrinho.id)) : [];

  return mapPedido(venda, itens);
}

// GET /pedidos/meus — cliente autenticado vê só os próprios pedidos
router.get("/meus", requireAuth, async (req: Request, res: Response) => {
  const nomeCliente = req.usuario?.nome;

  if (!nomeCliente) {
    return res.status(401).json({ mensagem: "Usuário não identificado." });
  }

  const { data, error } = await supabase
    .from("vendas_cestas")
    .select("*")
    .ilike("cliente_nome", nomeCliente)
    .order("data_venda", { ascending: false });

  if (error) return handleSupabaseError(res, error);

  return res.status(200).json(
    ((data || []) as VendaCestaRow[]).map((row) => mapPedido(row))
  );
});

// GET /pedidos — somente admin
router.get("/", requireAuth, requireRole("admin"), async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from("vendas_cestas")
    .select("*")
    .order("data_venda", { ascending: false });

  if (error) return handleSupabaseError(res, error);

  return res.status(200).json(((data || []) as VendaCestaRow[]).map((row) => mapPedido(row)));
});

// GET /pedidos/status/:status — somente admin
router.get("/status/:status", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
  const status = req.params.status as StatusPedido;
  const pago = status === "confirmado" || status === "entregue";

  const { data, error } = await supabase
    .from("vendas_cestas")
    .select("*")
    .eq("pago", pago)
    .order("data_venda", { ascending: false });

  if (error) return handleSupabaseError(res, error);

  return res.status(200).json(((data || []) as VendaCestaRow[]).map((row) => mapPedido(row)));
});

// GET /pedidos/:id — somente admin
router.get("/:id", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const pedido = await buscarPedido(String(req.params.id));
    if (!pedido) return res.status(404).json({ mensagem: "Pedido não encontrado." });
    return res.status(200).json(pedido);
  } catch (err) {
    return handleSupabaseError(res, err as { message: string });
  }
});

// POST /pedidos — cliente ou admin
router.post("/", requireAuth, requireRole("cliente"), async (req: Request, res: Response) => {
  const {
    cestaId,
    valorTotal,
    itens,
    clienteNome,
    clienteTelefone,
    telefone,
    enderecoEntrega,
    observacoes,
    status
  } = req.body;

  if (!cestaId || valorTotal === undefined) {
    return res.status(400).json({
      mensagem: "Campos obrigatórios no novo modelo: cestaId, valorTotal."
    });
  }

  const { data: carrinho, error: carrinhoError } = await supabase
    .from("carrinhos")
    .insert({ cesta_id: cestaId })
    .select("*")
    .single();

  if (carrinhoError) return handleSupabaseError(res, carrinhoError);

  if (itens && itens.length > 0) {
    const itensPayload = itens.map((item: Omit<PedidoItem, "id" | "pedidoId" | "criadoEm">) => ({
      carrinho_id: carrinho.id,
      item_id: item.produtoId,
      quantidade: item.quantidade || 1
    }));

    const { error: itensError } = await supabase
      .from("carrinho_itens_adicionais")
      .insert(itensPayload);

    if (itensError) return handleSupabaseError(res, itensError);
  }

  const { data: venda, error: vendaError } = await supabase
    .from("vendas_cestas")
    .insert({
      cesta_id: cestaId,
      carrinho_id: carrinho.id,
      cliente_nome: clienteNome || req.usuario?.nome || "Cliente",
      cliente_telefone: clienteTelefone || telefone || null,
      endereco_entrega: enderecoEntrega || null,
      observacoes: observacoes || null,
      status: status || "pendente",
      preco_pago: valorTotal,
      pago: status === "confirmado" || status === "entregue"
    })
    .select("*")
    .single();

  if (vendaError) return handleSupabaseError(res, vendaError);

  const itensCarrinho = await buscarItensDoCarrinho(String(carrinho.id));

  // Decrementa estoque se pedido já foi criado como confirmado/entregue
  if (deveDecrementarEstoque(null, (status || "pendente") as StatusPedido)) {
    try {
      await decrementarEstoque(String(carrinho.id));
    } catch (err) {
      console.error("Aviso: erro ao decrementar estoque no POST:", err);
    }
  }

  return res.status(201).json(mapPedido(venda as VendaCestaRow, itensCarrinho));
});

// PUT /pedidos/:id — somente admin
router.put("/:id", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
  const {
    cestaId,
    valorTotal,
    status,
    clienteNome,
    clienteTelefone,
    telefone,
    enderecoEntrega,
    observacoes
  } = req.body;

  // Busca status atual antes de atualizar
  const { data: pedidoAtual } = await supabase
    .from("vendas_cestas")
    .select("status, carrinho_id")
    .eq("id", req.params.id)
    .maybeSingle();

  const payload = {
    ...(cestaId !== undefined && { cesta_id: cestaId }),
    ...(clienteNome !== undefined && { cliente_nome: clienteNome }),
    ...((clienteTelefone !== undefined || telefone !== undefined) && {
      cliente_telefone: clienteTelefone || telefone || null
    }),
    ...(enderecoEntrega !== undefined && { endereco_entrega: enderecoEntrega }),
    ...(observacoes !== undefined && { observacoes }),
    ...(valorTotal !== undefined && { preco_pago: valorTotal }),
    ...(status !== undefined && { status }),
    ...(status !== undefined && {
      pago: status === "confirmado" || status === "entregue"
    })
  };

  const { data, error } = await supabase
    .from("vendas_cestas")
    .update(payload)
    .eq("id", req.params.id)
    .select("*")
    .maybeSingle();

  if (error) return handleSupabaseError(res, error);
  if (!data) return res.status(404).json({ mensagem: "Pedido não encontrado." });

  // Decrementa estoque se o status foi alterado para confirmado/entregue pela primeira vez
  if (
    status !== undefined &&
    pedidoAtual &&
    pedidoAtual.carrinho_id &&
    deveDecrementarEstoque(pedidoAtual.status as StatusPedido, status as StatusPedido)
  ) {
    try {
      await decrementarEstoque(String(pedidoAtual.carrinho_id));
      console.log(`Estoque decrementado — pedido ${req.params.id} → ${status}`);
    } catch (err) {
      console.error("Aviso: erro ao decrementar estoque:", err);
    }
  }

  return res.status(200).json(mapPedido(data as VendaCestaRow));
});

// PATCH /pedidos/:id/status — somente admin
router.patch("/:id/status", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
  const { status } = req.body as { status: StatusPedido };
  const pago = status === "confirmado" || status === "entregue";

  // Busca status atual antes de atualizar para saber se deve decrementar
  const { data: pedidoAtual } = await supabase
    .from("vendas_cestas")
    .select("status, carrinho_id")
    .eq("id", req.params.id)
    .maybeSingle();

  const { data, error } = await supabase
    .from("vendas_cestas")
    .update({ status, pago })
    .eq("id", req.params.id)
    .select("*")
    .maybeSingle();

  if (error) return handleSupabaseError(res, error);
  if (!data) return res.status(404).json({ mensagem: "Pedido não encontrado." });

  // Decrementa estoque na primeira transição para confirmado/entregue
  if (
    pedidoAtual &&
    pedidoAtual.carrinho_id &&
    deveDecrementarEstoque(pedidoAtual.status as StatusPedido, status)
  ) {
    try {
      await decrementarEstoque(String(pedidoAtual.carrinho_id));
      console.log(`Estoque decrementado — pedido ${req.params.id} → ${status}`);
    } catch (err) {
      console.error("Aviso: erro ao decrementar estoque:", err);
      // Não bloqueia a resposta; o status já foi salvo
    }
  }

  return res.status(200).json(mapPedido(data as VendaCestaRow));
});

router.post("/:id/itens", (_req: Request, res: Response) => {
  return res.status(400).json({
    mensagem: "No novo modelo, itens adicionais pertencem ao carrinho criado junto com o pedido."
  });
});

// DELETE /pedidos/:id — somente admin
router.delete("/:id", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from("vendas_cestas")
    .delete()
    .eq("id", req.params.id)
    .select("id")
    .maybeSingle();

  if (error) return handleSupabaseError(res, error);
  if (!data) return res.status(404).json({ mensagem: "Pedido não encontrado." });

  return res.status(200).json({ mensagem: "Pedido removido com sucesso." });
});

router.delete("/:pedidoId/itens/:itemId", (_req: Request, res: Response) => {
  return res.status(400).json({
    mensagem: "No novo modelo, remova itens diretamente do carrinho correspondente."
  });
});

export default router;
