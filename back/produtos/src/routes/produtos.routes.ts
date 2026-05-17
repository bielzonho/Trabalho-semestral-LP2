import { Router, Request, Response } from "express";
import { supabase } from "../database";
import { Produto } from "../types/produto";

const router = Router();

type ProdutoRow = {
  id: string | number;
  nome: string;
  descricao: string;
  preco: number;
  ativo: boolean;
  criado_em?: string;
  created_at?: string;
};

function mapProduto(row: ProdutoRow): Produto {
  return {
    id: String(row.id),
    nome: row.nome,
    descricao: row.descricao,
    preco: Number(row.preco),
    ativo: row.ativo,
    criadoEm: row.criado_em || row.created_at || ""
  };
}

function handleSupabaseError(res: Response, error: { message: string }) {
  return res.status(500).json({
    mensagem: "Erro ao acessar o banco de dados.",
    detalhe: error.message
  });
}

router.get("/", async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .order("nome", { ascending: true });

  if (error) {
    return handleSupabaseError(res, error);
  }

  return res.status(200).json((data || []).map(mapProduto));
});

router.get("/ativos", async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .eq("ativo", true)
    .order("nome", { ascending: true });

  if (error) {
    return handleSupabaseError(res, error);
  }

  return res.status(200).json((data || []).map(mapProduto));
});

router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return handleSupabaseError(res, error);
  }

  if (!data) {
    return res.status(404).json({ mensagem: "Produto não encontrado." });
  }

  return res.status(200).json(mapProduto(data));
});

router.post("/", async (req: Request, res: Response) => {
  const { nome, descricao, preco, ativo } = req.body;

  if (!nome || !descricao || preco === undefined || ativo === undefined) {
    return res.status(400).json({
      mensagem: "Campos obrigatórios: nome, descricao, preco, ativo."
    });
  }

  const { data, error } = await supabase
    .from("produtos")
    .insert({ nome, descricao, preco, ativo })
    .select("*")
    .single();

  if (error) {
    return handleSupabaseError(res, error);
  }

  return res.status(201).json(mapProduto(data));
});

router.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nome, descricao, preco, ativo } = req.body;

  const payload = {
    ...(nome !== undefined && { nome }),
    ...(descricao !== undefined && { descricao }),
    ...(preco !== undefined && { preco }),
    ...(ativo !== undefined && { ativo })
  };

  const { data, error } = await supabase
    .from("produtos")
    .update(payload)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    return handleSupabaseError(res, error);
  }

  if (!data) {
    return res.status(404).json({ mensagem: "Produto não encontrado." });
  }

  return res.status(200).json(mapProduto(data));
});

router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("produtos")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return handleSupabaseError(res, error);
  }

  if (!data) {
    return res.status(404).json({ mensagem: "Produto não encontrado." });
  }

  return res.status(200).json({ mensagem: "Produto removido com sucesso." });
});

export default router;
