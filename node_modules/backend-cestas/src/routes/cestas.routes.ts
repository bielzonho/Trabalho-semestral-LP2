import { Router, Request, Response } from "express";
import { supabase } from "../database";
import { Cesta, CestaItem } from "../types/cesta";

const router = Router();

type CestaRow = {
  id: string | number;
  nome: string;
  descricao: string;
  preco?: number;
  preco_base?: number;
  ativa: boolean;
  criado_em?: string;
  created_at?: string;
};

type CestaItemRow = {
  id: string | number;
  cesta_id: string | number;
  produto_id: string | number;
  quantidade: number;
  criado_em?: string;
  created_at?: string;
};

function mapCestaItem(row: CestaItemRow): CestaItem {
  return {
    id: String(row.id),
    cestaId: String(row.cesta_id),
    produtoId: String(row.produto_id),
    quantidade: Number(row.quantidade),
    criadoEm: row.criado_em || row.created_at || ""
  };
}

function mapCesta(row: CestaRow, itens: CestaItem[] = []): Cesta {
  const precoBase = Number(row.preco_base ?? row.preco ?? 0);

  return {
    id: String(row.id),
    nome: row.nome,
    descricao: row.descricao,
    precoBase,
    preco: precoBase,
    ativa: row.ativa,
    criadoEm: row.criado_em || row.created_at || "",
    itens
  } as Cesta & { preco: number };
}

function handleSupabaseError(res: Response, error: { message: string }) {
  return res.status(500).json({
    mensagem: "Erro ao acessar o banco de dados.",
    detalhe: error.message
  });
}

async function carregarItensPorCesta(cestaIds: string[]) {
  if (cestaIds.length === 0) {
    return new Map<string, CestaItem[]>();
  }

  const { data, error } = await supabase
    .from("cesta_itens")
    .select("*")
    .in("cesta_id", cestaIds);

  if (error) {
    throw error;
  }

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

  if (cestaError) {
    throw cestaError;
  }

  if (!cesta) {
    return null;
  }

  const { data: itens, error: itensError } = await supabase
    .from("cesta_itens")
    .select("*")
    .eq("cesta_id", id);

  if (itensError) {
    throw itensError;
  }

  return mapCesta(cesta, (itens || []).map(mapCestaItem));
}

router.get("/", async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from("cestas")
    .select("*")
    .order("nome", { ascending: true });

  if (error) {
    return handleSupabaseError(res, error);
  }

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

router.get("/ativas", async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from("cestas")
    .select("*")
    .eq("ativa", true)
    .order("nome", { ascending: true });

  if (error) {
    return handleSupabaseError(res, error);
  }

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

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const cesta = await buscarCestaComItens(String(req.params.id));

    if (!cesta) {
      return res.status(404).json({ mensagem: "Cesta não encontrada." });
    }

    return res.status(200).json(cesta);
  } catch (err) {
    return handleSupabaseError(res, err as { message: string });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const { nome, descricao, precoBase, ativa, itens } = req.body;

  if (!nome || !descricao || precoBase === undefined || ativa === undefined) {
    return res.status(400).json({
      mensagem: "Campos obrigatórios: nome, descricao, precoBase, ativa."
    });
  }

  const { data: cesta, error: cestaError } = await supabase
    .from("cestas")
    .insert({ nome, descricao, preco: precoBase, ativa })
    .select("*")
    .single();

  if (cestaError) {
    return handleSupabaseError(res, cestaError);
  }

  if (itens && itens.length > 0) {
    const itensPayload = itens.map((item: Omit<CestaItem, "id" | "cestaId" | "criadoEm">) => ({
      cesta_id: cesta.id,
      produto_id: item.produtoId,
      quantidade: item.quantidade
    }));

    const { error: itensError } = await supabase.from("cesta_itens").insert(itensPayload);

    if (itensError) {
      return handleSupabaseError(res, itensError);
    }
  }

  try {
    const novaCesta = await buscarCestaComItens(String(cesta.id));
    return res.status(201).json(novaCesta);
  } catch (err) {
    return handleSupabaseError(res, err as { message: string });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nome, descricao, precoBase, ativa, itens } = req.body;

  const payload = {
    ...(nome !== undefined && { nome }),
    ...(descricao !== undefined && { descricao }),
    ...(precoBase !== undefined && { preco: precoBase }),
    ...(ativa !== undefined && { ativa })
  };

  const { data: cesta, error: cestaError } = await supabase
    .from("cestas")
    .update(payload)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (cestaError) {
    return handleSupabaseError(res, cestaError);
  }

  if (!cesta) {
    return res.status(404).json({ mensagem: "Cesta não encontrada." });
  }

  if (itens && itens.length > 0) {
    const { error: deleteError } = await supabase.from("cesta_itens").delete().eq("cesta_id", id);

    if (deleteError) {
      return handleSupabaseError(res, deleteError);
    }

    const itensPayload = itens.map((item: Omit<CestaItem, "id" | "cestaId" | "criadoEm">) => ({
      cesta_id: id,
      produto_id: item.produtoId,
      quantidade: item.quantidade
    }));

    const { error: insertError } = await supabase.from("cesta_itens").insert(itensPayload);

    if (insertError) {
      return handleSupabaseError(res, insertError);
    }
  }

  try {
    const cestaAtualizada = await buscarCestaComItens(String(id));
    return res.status(200).json(cestaAtualizada);
  } catch (err) {
    return handleSupabaseError(res, err as { message: string });
  }
});

router.post("/:id/itens", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { produtoId, quantidade } = req.body;

  if (!produtoId || quantidade === undefined) {
    return res.status(400).json({
      mensagem: "Campos obrigatórios: produtoId, quantidade."
    });
  }

  const cesta = await buscarCestaComItens(String(id)).catch((err) => {
    handleSupabaseError(res, err as { message: string });
    return undefined;
  });

  if (cesta === undefined) {
    return;
  }

  if (!cesta) {
    return res.status(404).json({ mensagem: "Cesta não encontrada." });
  }

  const existente = cesta.itens?.find((i) => i.produtoId === String(produtoId));

  if (existente) {
    const { error } = await supabase
      .from("cesta_itens")
      .update({ quantidade: existente.quantidade + quantidade })
      .eq("id", existente.id);

    if (error) {
      return handleSupabaseError(res, error);
    }
  } else {
    const { error } = await supabase.from("cesta_itens").insert({
      cesta_id: id,
      produto_id: produtoId,
      quantidade
    });

    if (error) {
      return handleSupabaseError(res, error);
    }
  }

  try {
    const cestaAtualizada = await buscarCestaComItens(String(id));
    return res.status(201).json(cestaAtualizada);
  } catch (err) {
    return handleSupabaseError(res, err as { message: string });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  const { error: itensError } = await supabase.from("cesta_itens").delete().eq("cesta_id", id);

  if (itensError) {
    return handleSupabaseError(res, itensError);
  }

  const { data, error } = await supabase
    .from("cestas")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return handleSupabaseError(res, error);
  }

  if (!data) {
    return res.status(404).json({ mensagem: "Cesta não encontrada." });
  }

  return res.status(200).json({ mensagem: "Cesta removida com sucesso." });
});

router.delete("/:cestaId/itens/:itemId", async (req: Request, res: Response) => {
  const { cestaId, itemId } = req.params;

  const { data, error } = await supabase
    .from("cesta_itens")
    .delete()
    .eq("cesta_id", cestaId)
    .eq("id", itemId)
    .select("id")
    .maybeSingle();

  if (error) {
    return handleSupabaseError(res, error);
  }

  if (!data) {
    return res.status(404).json({ mensagem: "Item não encontrado." });
  }

  return res.status(200).json({ mensagem: "Item removido com sucesso." });
});

export default router;
