import { Router, Request, Response } from "express";
import { supabase } from "../database";
import { Pedido, StatusPedido, PedidoItem } from "../types/pedido";

const router = Router();

type PedidoRow = {
  id: string | number;
  cesta_id: string | number | null;
  cliente_nome: string;
  status: StatusPedido;
  valor_total: number;
  observacoes?: string;
  criado_em?: string;
  created_at?: string;
};

type PedidoItemRow = {
  id: string | number;
  pedido_id: string | number;
  produto_id: string | number;
  quantidade: number;
  preco_unitario: number;
  criado_em?: string;
  created_at?: string;
};

const statusValidos: StatusPedido[] = [
  "pendente",
  "confirmado",
  "em_preparacao",
  "saiu_para_entrega",
  "entregue",
  "cancelado"
];

function mapPedidoItem(row: PedidoItemRow): PedidoItem {
  return {
    id: String(row.id),
    pedidoId: String(row.pedido_id),
    produtoId: String(row.produto_id),
    quantidade: Number(row.quantidade),
    precoUnitario: Number(row.preco_unitario),
    criadoEm: row.criado_em || row.created_at || ""
  };
}

function mapPedido(row: PedidoRow, itens: PedidoItem[] = []): Pedido {
  return {
    id: String(row.id),
    cestaId: row.cesta_id === null ? null : String(row.cesta_id),
    clienteNome: row.cliente_nome,
    status: row.status,
    valorTotal: Number(row.valor_total),
    observacoes: row.observacoes,
    criadoEm: row.criado_em || row.created_at || "",
    itens
  };
}

function handleSupabaseError(res: Response, error: { message: string }) {
  return res.status(500).json({
    mensagem: "Erro ao acessar o banco de dados.",
    detalhe: error.message
  });
}

async function carregarItensPorPedido(pedidoIds: string[]) {
  if (pedidoIds.length === 0) {
    return new Map<string, PedidoItem[]>();
  }

  const { data, error } = await supabase
    .from("pedido_itens")
    .select("*")
    .in("pedido_id", pedidoIds);

  if (error) {
    throw error;
  }

  return ((data || []) as PedidoItemRow[]).reduce((acc, row) => {
    const item = mapPedidoItem(row);
    const itens = acc.get(item.pedidoId) || [];
    itens.push(item);
    acc.set(item.pedidoId, itens);
    return acc;
  }, new Map<string, PedidoItem[]>());
}

async function buscarPedidoComItens(id: string) {
  const { data: pedido, error: pedidoError } = await supabase
    .from("pedidos")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (pedidoError) {
    throw pedidoError;
  }

  if (!pedido) {
    return null;
  }

  const { data: itens, error: itensError } = await supabase
    .from("pedido_itens")
    .select("*")
    .eq("pedido_id", id);

  if (itensError) {
    throw itensError;
  }

  return mapPedido(pedido, (itens || []).map(mapPedidoItem));
}

router.get("/", async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from("pedidos")
    .select("*")
    .order("criado_em", { ascending: false });

  if (error) {
    return handleSupabaseError(res, error);
  }

  try {
    const pedidos = (data || []) as PedidoRow[];
    const itensPorPedido = await carregarItensPorPedido(pedidos.map((p) => String(p.id)));
    return res.status(200).json(
      pedidos.map((pedido) => mapPedido(pedido, itensPorPedido.get(String(pedido.id)) || []))
    );
  } catch (err) {
    return handleSupabaseError(res, err as { message: string });
  }
});

router.get("/status/:status", async (req: Request, res: Response) => {
  const { status } = req.params as { status: StatusPedido };

  if (!statusValidos.includes(status)) {
    return res.status(400).json({
      mensagem: `Status inválido. Use: ${statusValidos.join(", ")}.`
    });
  }

  const { data, error } = await supabase
    .from("pedidos")
    .select("*")
    .eq("status", status)
    .order("criado_em", { ascending: false });

  if (error) {
    return handleSupabaseError(res, error);
  }

  try {
    const pedidos = (data || []) as PedidoRow[];
    const itensPorPedido = await carregarItensPorPedido(pedidos.map((p) => String(p.id)));
    return res.status(200).json(
      pedidos.map((pedido) => mapPedido(pedido, itensPorPedido.get(String(pedido.id)) || []))
    );
  } catch (err) {
    return handleSupabaseError(res, err as { message: string });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const pedido = await buscarPedidoComItens(String(req.params.id));

    if (!pedido) {
      return res.status(404).json({ mensagem: "Pedido não encontrado." });
    }

    return res.status(200).json(pedido);
  } catch (err) {
    return handleSupabaseError(res, err as { message: string });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const { clienteNome, cestaId, valorTotal, observacoes, itens } = req.body;

  if (!clienteNome || valorTotal === undefined) {
    return res.status(400).json({
      mensagem: "Campos obrigatórios: clienteNome, valorTotal."
    });
  }

  const { data: pedido, error: pedidoError } = await supabase
    .from("pedidos")
    .insert({
      cliente_nome: clienteNome,
      cesta_id: cestaId || null,
      valor_total: valorTotal,
      observacoes,
      status: "pendente"
    })
    .select("*")
    .single();

  if (pedidoError) {
    return handleSupabaseError(res, pedidoError);
  }

  if (itens && itens.length > 0) {
    const itensPayload = itens.map((item: Omit<PedidoItem, "id" | "pedidoId" | "criadoEm">) => ({
      pedido_id: pedido.id,
      produto_id: item.produtoId,
      quantidade: item.quantidade,
      preco_unitario: item.precoUnitario
    }));

    const { error: itensError } = await supabase.from("pedido_itens").insert(itensPayload);

    if (itensError) {
      return handleSupabaseError(res, itensError);
    }
  }

  try {
    const novoPedido = await buscarPedidoComItens(String(pedido.id));
    return res.status(201).json(novoPedido);
  } catch (err) {
    return handleSupabaseError(res, err as { message: string });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { clienteNome, cestaId, valorTotal, observacoes, itens } = req.body;

  const payload = {
    ...(clienteNome !== undefined && { cliente_nome: clienteNome }),
    ...(cestaId !== undefined && { cesta_id: cestaId }),
    ...(valorTotal !== undefined && { valor_total: valorTotal }),
    ...(observacoes !== undefined && { observacoes })
  };

  const { data: pedido, error: pedidoError } = await supabase
    .from("pedidos")
    .update(payload)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (pedidoError) {
    return handleSupabaseError(res, pedidoError);
  }

  if (!pedido) {
    return res.status(404).json({ mensagem: "Pedido não encontrado." });
  }

  if (itens && itens.length > 0) {
    const { error: deleteError } = await supabase.from("pedido_itens").delete().eq("pedido_id", id);

    if (deleteError) {
      return handleSupabaseError(res, deleteError);
    }

    const itensPayload = itens.map((item: Omit<PedidoItem, "id" | "pedidoId" | "criadoEm">) => ({
      pedido_id: id,
      produto_id: item.produtoId,
      quantidade: item.quantidade,
      preco_unitario: item.precoUnitario
    }));

    const { error: insertError } = await supabase.from("pedido_itens").insert(itensPayload);

    if (insertError) {
      return handleSupabaseError(res, insertError);
    }
  }

  try {
    const pedidoAtualizado = await buscarPedidoComItens(String(id));
    return res.status(200).json(pedidoAtualizado);
  } catch (err) {
    return handleSupabaseError(res, err as { message: string });
  }
});

router.patch("/:id/status", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body as { status: StatusPedido };

  if (!status || !statusValidos.includes(status)) {
    return res.status(400).json({
      mensagem: `Status inválido. Use: ${statusValidos.join(", ")}.`
    });
  }

  const { data, error } = await supabase
    .from("pedidos")
    .update({ status })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    return handleSupabaseError(res, error);
  }

  if (!data) {
    return res.status(404).json({ mensagem: "Pedido não encontrado." });
  }

  try {
    const pedido = await buscarPedidoComItens(String(id));
    return res.status(200).json(pedido);
  } catch (err) {
    return handleSupabaseError(res, err as { message: string });
  }
});

router.post("/:id/itens", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { produtoId, quantidade, precoUnitario } = req.body;

  if (!produtoId || quantidade === undefined || precoUnitario === undefined) {
    return res.status(400).json({
      mensagem: "Campos obrigatórios: produtoId, quantidade, precoUnitario."
    });
  }

  const pedido = await buscarPedidoComItens(String(id)).catch((err) => {
    handleSupabaseError(res, err as { message: string });
    return undefined;
  });

  if (pedido === undefined) {
    return;
  }

  if (!pedido) {
    return res.status(404).json({ mensagem: "Pedido não encontrado." });
  }

  const existente = pedido.itens?.find((i) => i.produtoId === String(produtoId));

  if (existente) {
    const { error } = await supabase
      .from("pedido_itens")
      .update({ quantidade: existente.quantidade + quantidade })
      .eq("id", existente.id);

    if (error) {
      return handleSupabaseError(res, error);
    }
  } else {
    const { error } = await supabase.from("pedido_itens").insert({
      pedido_id: id,
      produto_id: produtoId,
      quantidade,
      preco_unitario: precoUnitario
    });

    if (error) {
      return handleSupabaseError(res, error);
    }
  }

  const pedidoAtualizado = await buscarPedidoComItens(String(id));
  const valorTotal = (pedidoAtualizado?.itens || []).reduce(
    (total, item) => total + item.quantidade * item.precoUnitario,
    0
  );

  const { error: totalError } = await supabase
    .from("pedidos")
    .update({ valor_total: valorTotal })
    .eq("id", id);

  if (totalError) {
    return handleSupabaseError(res, totalError);
  }

  try {
    const pedidoComTotal = await buscarPedidoComItens(String(id));
    return res.status(201).json(pedidoComTotal);
  } catch (err) {
    return handleSupabaseError(res, err as { message: string });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  const { error: itensError } = await supabase.from("pedido_itens").delete().eq("pedido_id", id);

  if (itensError) {
    return handleSupabaseError(res, itensError);
  }

  const { data, error } = await supabase
    .from("pedidos")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return handleSupabaseError(res, error);
  }

  if (!data) {
    return res.status(404).json({ mensagem: "Pedido não encontrado." });
  }

  return res.status(200).json({ mensagem: "Pedido removido com sucesso." });
});

router.delete("/:pedidoId/itens/:itemId", async (req: Request, res: Response) => {
  const { pedidoId, itemId } = req.params;

  const { data, error } = await supabase
    .from("pedido_itens")
    .delete()
    .eq("pedido_id", pedidoId)
    .eq("id", itemId)
    .select("id")
    .maybeSingle();

  if (error) {
    return handleSupabaseError(res, error);
  }

  if (!data) {
    return res.status(404).json({ mensagem: "Item não encontrado." });
  }

  const pedidoAtualizado = await buscarPedidoComItens(String(pedidoId));
  const valorTotal = (pedidoAtualizado?.itens || []).reduce(
    (total, item) => total + item.quantidade * item.precoUnitario,
    0
  );

  const { error: totalError } = await supabase
    .from("pedidos")
    .update({ valor_total: valorTotal })
    .eq("id", pedidoId);

  if (totalError) {
    return handleSupabaseError(res, totalError);
  }

  return res.status(200).json({ mensagem: "Item removido com sucesso." });
});

export default router;
