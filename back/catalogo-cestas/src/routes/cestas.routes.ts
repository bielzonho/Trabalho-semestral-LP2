import { Router, Request, Response } from "express";
import { supabase } from "../database";
import { Cesta, CestaItem } from "../types/cesta";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/roles.middleware";

const router = Router();

type CestaRow = {
  id: string | number;
  titulo: string;
  descricao: string | null;
  preco: number;
  total_itens?: number;
  quantidade_vendas?: number;
};

type CestaItemRow = {
  cesta_id: string | number;
  item_id: string | number;
};

function mapCestaItem(row: CestaItemRow): CestaItem {
  return {
    id: String(row.item_id),
    cestaId: String(row.cesta_id),
    produtoId: String(row.item_id),
    quantidade: 1,
    criadoEm: ""
  };
}

function mapCesta(row: CestaRow, itens: CestaItem[] = []): Cesta & {
  totalItens: number;
  quantidadeVendas: number;
} {
  const preco = Number(row.preco);

  return {
    id: String(row.id),
    nome: row.titulo,
    descricao: row.descricao || "",
    precoBase: preco,
    preco,
    ativa: true,
    criadoEm: "",
    itens,
    totalItens: Number(row.total_itens ?? itens.length),
    quantidadeVendas: Number(row.quantidade_vendas ?? 0)
  };
}

function handleSupabaseError(res: Response, error: { message: string }) {
  return res.status(500).json({
    mensagem: "Erro ao acessar o banco de dados.",
    detalhe: error.message
  });
}

async function carregarItensPorCesta(cestaIds: string[]) {
  if (cestaIds.length === 0) return new Map<string, CestaItem[]>();

  const { data, error } = await supabase
    .from("cesta_itens")
    .select("*")
    .in("cesta_id", cestaIds);

  if (error) throw error;

  return ((data || []) as CestaItemRow[]).reduce((acc, row) => {
    const item = mapCestaItem(row);
    const itens = acc.get(item.cestaId) || [];
    itens.push(item);
    acc.set(item.cestaId, itens);
    return acc;
  }, new Map<string, CestaItem[]>());
}

async function buscarCestaComItens(id: string) {
  const { data: cesta, error: cestaError } = await supabase
    .from("cestas")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (cestaError) throw cestaError;
  if (!cesta) return null;

  const { data: itens, error: itensError } = await supabase
    .from("cesta_itens")
    .select("*")
    .eq("cesta_id", id);

  if (itensError) throw itensError;

  return mapCesta(cesta as CestaRow, ((itens || []) as CestaItemRow[]).map(mapCestaItem));
}

async function atualizarTotalItens(cestaId: string) {
  const { count, error } = await supabase
    .from("cesta_itens")
    .select("*", { count: "exact", head: true })
    .eq("cesta_id", cestaId);

  if (error) throw error;

  const { error: updateError } = await supabase
    .from("cestas")
    .update({ total_itens: count || 0 })
    .eq("id", cestaId);

  if (updateError) throw updateError;
}

// GET /cestas — público
router.get("/", async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from("cestas")
    .select("*")
    .order("titulo", { ascending: true });

  if (error) return handleSupabaseError(res, error);

  try {
    const cestas = (data || []) as CestaRow[];
    const itensPorCesta = await carregarItensPorCesta(cestas.map((c) => String(c.id)));
    return res.status(200).json(
      cestas.map((cesta) => mapCesta(cesta, itensPorCesta.get(String(cesta.id)) || []))
    );
  } catch (err) {
    return handleSupabaseError(res, err as { message: string });
  }
});

// GET /cestas/ativas — público
router.get("/ativas", async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from("cestas")
    .select("*")
    .order("titulo", { ascending: true });

  if (error) return handleSupabaseError(res, error);

  try {
    const cestas = (data || []) as CestaRow[];
    const itensPorCesta = await carregarItensPorCesta(cestas.map((c) => String(c.id)));
    return res.status(200).json(
      cestas.map((cesta) => mapCesta(cesta, itensPorCesta.get(String(cesta.id)) || []))
    );
  } catch (err) {
    return handleSupabaseError(res, err as { message: string });
  }
});

// GET /cestas/:id — público
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const cesta = await buscarCestaComItens(String(req.params.id));
    if (!cesta) return res.status(404).json({ mensagem: "Cesta não encontrada." });
    return res.status(200).json(cesta);
  } catch (err) {
    return handleSupabaseError(res, err as { message: string });
  }
});

// POST /cestas — somente admin
router.post("/", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
  const { nome, descricao, precoBase, preco, itens } = req.body;
  const precoFinal = precoBase ?? preco;

  if (!nome || precoFinal === undefined) {
    return res.status(400).json({ mensagem: "Campos obrigatórios: nome, precoBase." });
  }

  const { data: cesta, error: cestaError } = await supabase
    .from("cestas")
    .insert({
      titulo: nome,
      descricao,
      preco: precoFinal,
      total_itens: itens?.length || 0
    })
    .select("*")
    .single();

  if (cestaError) return handleSupabaseError(res, cestaError);

  if (itens && itens.length > 0) {
    const itensPayload = itens.map((item: Omit<CestaItem, "id" | "cestaId" | "criadoEm">) => ({
      cesta_id: cesta.id,
      item_id: item.produtoId
    }));

    const { error: itensError } = await supabase.from("cesta_itens").insert(itensPayload);
    if (itensError) return handleSupabaseError(res, itensError);
  }

  try {
    const novaCesta = await buscarCestaComItens(String(cesta.id));
    return res.status(201).json(novaCesta);
  } catch (err) {
    return handleSupabaseError(res, err as { message: string });
  }
});

// PUT /cestas/:id — somente admin
router.put("/:id", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nome, descricao, precoBase, preco, itens } = req.body;
  const precoFinal = precoBase ?? preco;

  const payload = {
    ...(nome !== undefined && { titulo: nome }),
    ...(descricao !== undefined && { descricao }),
    ...(precoFinal !== undefined && { preco: precoFinal })
  };

  const { data: cesta, error: cestaError } = await supabase
    .from("cestas")
    .update(payload)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (cestaError) return handleSupabaseError(res, cestaError);
  if (!cesta) return res.status(404).json({ mensagem: "Cesta não encontrada." });

  if (itens && itens.length > 0) {
    const { error: deleteError } = await supabase.from("cesta_itens").delete().eq("cesta_id", id);
    if (deleteError) return handleSupabaseError(res, deleteError);

    const itensPayload = itens.map((item: Omit<CestaItem, "id" | "cestaId" | "criadoEm">) => ({
      cesta_id: id,
      item_id: item.produtoId
    }));

    const { error: insertError } = await supabase.from("cesta_itens").insert(itensPayload);
    if (insertError) return handleSupabaseError(res, insertError);

    await atualizarTotalItens(String(id));
  }

  try {
    const cestaAtualizada = await buscarCestaComItens(String(id));
    return res.status(200).json(cestaAtualizada);
  } catch (err) {
    return handleSupabaseError(res, err as { message: string });
  }
});

// POST /cestas/:id/itens — somente admin
router.post("/:id/itens", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { produtoId } = req.body;

  if (!produtoId) return res.status(400).json({ mensagem: "Campo obrigatório: produtoId." });

  const { error } = await supabase.from("cesta_itens").insert({
    cesta_id: id,
    item_id: produtoId
  });

  if (error) return handleSupabaseError(res, error);

  try {
    await atualizarTotalItens(String(id));
    const cestaAtualizada = await buscarCestaComItens(String(id));
    return res.status(201).json(cestaAtualizada);
  } catch (err) {
    return handleSupabaseError(res, err as { message: string });
  }
});

// DELETE /cestas/:id — somente admin
router.delete("/:id", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from("cestas")
    .delete()
    .eq("id", req.params.id)
    .select("id")
    .maybeSingle();

  if (error) return handleSupabaseError(res, error);
  if (!data) return res.status(404).json({ mensagem: "Cesta não encontrada." });

  return res.status(200).json({ mensagem: "Cesta removida com sucesso." });
});

// DELETE /cestas/:cestaId/itens/:itemId — somente admin
router.delete("/:cestaId/itens/:itemId", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
  const { cestaId, itemId } = req.params;

  const { data, error } = await supabase
    .from("cesta_itens")
    .delete()
    .eq("cesta_id", cestaId)
    .eq("item_id", itemId)
    .select("item_id")
    .maybeSingle();

  if (error) return handleSupabaseError(res, error);
  if (!data) return res.status(404).json({ mensagem: "Item não encontrado." });

  await atualizarTotalItens(String(cestaId));

  return res.status(200).json({ mensagem: "Item removido com sucesso." });
});

export default router;
