import { Router, Request, Response } from "express";
import { supabase } from "../database";
import { Produto } from "../types/produto";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/roles.middleware";

const router = Router();

type ItemRow = {
  id: string | number;
  titulo: string;
  descricao: string | null;
  preco: number;
  quantidade_estoque?: number;
  quantidade_vendas?: number;
};

function mapProduto(row: ItemRow): Produto & { quantidadeEstoque: number; quantidadeVendas: number } {
  const quantidadeEstoque = Number(row.quantidade_estoque ?? 0);

  return {
    id: String(row.id),
    nome: row.titulo,
    descricao: row.descricao || "",
    preco: Number(row.preco),
    ativo: quantidadeEstoque > 0,
    criadoEm: "",
    quantidadeEstoque,
    quantidadeVendas: Number(row.quantidade_vendas ?? 0)
  };
}

function handleSupabaseError(res: Response, error: { message: string }) {
  return res.status(500).json({
    mensagem: "Erro ao acessar o banco de dados.",
    detalhe: error.message
  });
}

// GET /produtos — público
router.get("/", async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from("itens")
    .select("*")
    .order("titulo", { ascending: true });

  if (error) return handleSupabaseError(res, error);

  return res.status(200).json(((data || []) as ItemRow[]).map(mapProduto));
});

// GET /produtos/ativos — público
router.get("/ativos", async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from("itens")
    .select("*")
    .gt("quantidade_estoque", 0)
    .order("titulo", { ascending: true });

  if (error) return handleSupabaseError(res, error);

  return res.status(200).json(((data || []) as ItemRow[]).map(mapProduto));
});

// GET /produtos/:id — público
router.get("/:id", async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from("itens")
    .select("*")
    .eq("id", req.params.id)
    .maybeSingle();

  if (error) return handleSupabaseError(res, error);

  if (!data) {
    return res.status(404).json({ mensagem: "Produto não encontrado." });
  }

  return res.status(200).json(mapProduto(data as ItemRow));
});

// POST /produtos — somente admin
router.post("/", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
  const { nome, descricao, preco, ativo, quantidadeEstoque } = req.body;

  if (!nome || preco === undefined) {
    return res.status(400).json({
      mensagem: "Campos obrigatórios: nome, preco."
    });
  }

  const estoque =
    quantidadeEstoque !== undefined ? quantidadeEstoque : ativo === false ? 0 : 1;

  const { data, error } = await supabase
    .from("itens")
    .insert({
      titulo: nome,
      descricao,
      preco,
      quantidade_estoque: estoque
    })
    .select("*")
    .single();

  if (error) return handleSupabaseError(res, error);

  return res.status(201).json(mapProduto(data as ItemRow));
});

// PUT /produtos/:id — somente admin
router.put("/:id", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
  const { nome, descricao, preco, ativo, quantidadeEstoque } = req.body;

  const payload = {
    ...(nome !== undefined && { titulo: nome }),
    ...(descricao !== undefined && { descricao }),
    ...(preco !== undefined && { preco }),
    ...(quantidadeEstoque !== undefined && { quantidade_estoque: quantidadeEstoque }),
    ...(ativo !== undefined && quantidadeEstoque === undefined && {
      quantidade_estoque: ativo ? 1 : 0
    })
  };

  const { data, error } = await supabase
    .from("itens")
    .update(payload)
    .eq("id", req.params.id)
    .select("*")
    .maybeSingle();

  if (error) return handleSupabaseError(res, error);

  if (!data) {
    return res.status(404).json({ mensagem: "Produto não encontrado." });
  }

  return res.status(200).json(mapProduto(data as ItemRow));
});

// DELETE /produtos/:id — somente admin
router.delete("/:id", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from("itens")
    .delete()
    .eq("id", req.params.id)
    .select("id")
    .maybeSingle();

  if (error) return handleSupabaseError(res, error);

  if (!data) {
    return res.status(404).json({ mensagem: "Produto não encontrado." });
  }

  return res.status(200).json({ mensagem: "Produto removido com sucesso." });
});

export default router;
