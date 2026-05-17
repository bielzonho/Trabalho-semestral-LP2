import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { cestas } from "../data/cestas";
import { Cesta, CestaItem } from "../types/cesta";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  return res.status(200).json(cestas);
});

router.get("/ativas", (_req: Request, res: Response) => {
  const cestasAtivas = cestas.filter((c) => c.ativa);
  return res.status(200).json(cestasAtivas);
});

router.get("/:id", (req: Request, res: Response) => {
  const { id } = req.params;

  const cesta = cestas.find((c) => c.id === id);

  if (!cesta) {
    return res.status(404).json({ mensagem: "Cesta não encontrada." });
  }

  return res.status(200).json(cesta);
});

router.post("/", (req: Request, res: Response) => {
  const { nome, descricao, precoBase, ativa, itens } = req.body;

  if (
    !nome ||
    !descricao ||
    precoBase === undefined ||
    ativa === undefined
  ) {
    return res.status(400).json({
      mensagem: "Campos obrigatórios: nome, descricao, precoBase, ativa."
    });
  }

  const cestaId = uuidv4();

  const novasCestaItens: CestaItem[] = itens
    ? itens.map((item: Omit<CestaItem, "id" | "cestaId" | "criadoEm">) => ({
        id: uuidv4(),
        cestaId,
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        criadoEm: new Date().toISOString()
      }))
    : [];

  const novaCesta: Cesta = {
    id: cestaId,
    nome,
    descricao,
    precoBase,
    ativa,
    criadoEm: new Date().toISOString(),
    itens: novasCestaItens
  };

  cestas.push(novaCesta);

  return res.status(201).json(novaCesta);
});

router.put("/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const { nome, descricao, precoBase, ativa, itens } = req.body;

  const index = cestas.findIndex((c) => c.id === id);

  if (index === -1) {
    return res.status(404).json({ mensagem: "Cesta não encontrada." });
  }

  const cestasAtualizada: Cesta = {
    ...cestas[index],
    nome: nome ?? cestas[index].nome,
    descricao: descricao ?? cestas[index].descricao,
    precoBase: precoBase ?? cestas[index].precoBase,
    ativa: ativa !== undefined ? ativa : cestas[index].ativa,
    itens:
      itens && itens.length > 0
        ? itens.map((item: Omit<CestaItem, "id" | "cestaId" | "criadoEm">) => ({
            id: uuidv4(),
            cestaId: id,
            produtoId: item.produtoId,
            quantidade: item.quantidade,
            criadoEm: new Date().toISOString()
          }))
        : cestas[index].itens
  };

  cestas[index] = cestasAtualizada;

  return res.status(200).json(cestas[index]);
});

router.post("/:id/itens", (req: Request, res: Response) => {
  const { id } = req.params;
  const { produtoId, quantidade } = req.body;

  const cesta = cestas.find((c) => c.id === id);

  if (!cesta) {
    return res.status(404).json({ mensagem: "Cesta não encontrada." });
  }

  if (!produtoId || quantidade === undefined) {
    return res.status(400).json({
      mensagem: "Campos obrigatórios: produtoId, quantidade."
    });
  }

  if (!cesta.itens) {
    cesta.itens = [];
  }

  const existente = cesta.itens.find((i) => i.produtoId === produtoId);

  if (existente) {
    existente.quantidade += quantidade;
  } else {
    cesta.itens.push({
      id: uuidv4(),
      cestaId: id,
      produtoId,
      quantidade,
      criadoEm: new Date().toISOString()
    });
  }

  return res.status(201).json(cesta);
});

router.delete("/:id", (req: Request, res: Response) => {
  const { id } = req.params;

  const index = cestas.findIndex((c) => c.id === id);

  if (index === -1) {
    return res.status(404).json({ mensagem: "Cesta não encontrada." });
  }

  cestas.splice(index, 1);

  return res.status(200).json({ mensagem: "Cesta removida com sucesso." });
});

router.delete("/:cestaId/itens/:itemId", (req: Request, res: Response) => {
  const { cestaId, itemId } = req.params;

  const cesta = cestas.find((c) => c.id === cestaId);

  if (!cesta || !cesta.itens) {
    return res.status(404).json({ mensagem: "Cesta não encontrada." });
  }

  const itemIndex = cesta.itens.findIndex((i) => i.id === itemId);

  if (itemIndex === -1) {
    return res.status(404).json({ mensagem: "Item não encontrado." });
  }

  cesta.itens.splice(itemIndex, 1);

  return res.status(200).json({ mensagem: "Item removido com sucesso." });
});

export default router;