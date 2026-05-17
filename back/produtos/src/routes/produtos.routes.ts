import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { produtos } from "../data/produtos";
import { Produto } from "../types/produto";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  return res.status(200).json(produtos);
});

router.get("/ativos", (_req: Request, res: Response) => {
  const produtosAtivos = produtos.filter((p) => p.ativo);
  return res.status(200).json(produtosAtivos);
});

router.get("/:id", (req: Request, res: Response) => {
  const { id } = req.params;

  const produto = produtos.find((p) => p.id === id);

  if (!produto) {
    return res.status(404).json({ mensagem: "Produto não encontrado." });
  }

  return res.status(200).json(produto);
});

router.post("/", (req: Request, res: Response) => {
  const { nome, descricao, preco, ativo } = req.body;

  if (!nome || !descricao || preco === undefined || ativo === undefined) {
    return res.status(400).json({
      mensagem:
        "Campos obrigatórios: nome, descricao, preco, ativo."
    });
  }

  const novoProduto: Produto = {
    id: uuidv4(),
    nome,
    descricao,
    preco,
    ativo,
    criadoEm: new Date().toISOString()
  };

  produtos.push(novoProduto);

  return res.status(201).json(novoProduto);
});

router.put("/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const { nome, descricao, preco, ativo } = req.body;

  const index = produtos.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ mensagem: "Produto não encontrado." });
  }

  produtos[index] = {
    ...produtos[index],
    nome: nome ?? produtos[index].nome,
    descricao: descricao ?? produtos[index].descricao,
    preco: preco ?? produtos[index].preco,
    ativo: ativo ?? produtos[index].ativo
  };

  return res.status(200).json(produtos[index]);
});

router.delete("/:id", (req: Request, res: Response) => {
  const { id } = req.params;

  const index = produtos.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ mensagem: "Produto não encontrado." });
  }

  produtos.splice(index, 1);

  return res.status(200).json({ mensagem: "Produto removido com sucesso." });
});

export default router;
