import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { cestas } from "../data/cestas";
import { Cesta } from "../types/cesta";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  return res.status(200).json(cestas);
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
  const { nome, descricao, preco, imagem, ativa, itens } = req.body;

  if (
    !nome ||
    !descricao ||
    preco === undefined ||
    !imagem ||
    ativa === undefined ||
    !itens
  ) {
    return res.status(400).json({
      mensagem: "Campos obrigatórios: nome, descricao, preco, imagem, ativa, itens."
    });
  }

  const novaCesta: Cesta = {
    id: uuidv4(),
    nome,
    descricao,
    preco,
    imagem,
    ativa,
    itens
  };

  cestas.push(novaCesta);

  return res.status(201).json(novaCesta);
});

router.put("/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const { nome, descricao, preco, imagem, ativa, itens } = req.body;

  const index = cestas.findIndex((c) => c.id === id);

  if (index === -1) {
    return res.status(404).json({ mensagem: "Cesta não encontrada." });
  }

  cestas[index] = {
    ...cestas[index],
    nome: nome ?? cestas[index].nome,
    descricao: descricao ?? cestas[index].descricao,
    preco: preco ?? cestas[index].preco,
    imagem: imagem ?? cestas[index].imagem,
    ativa: ativa ?? cestas[index].ativa,
    itens: itens ?? cestas[index].itens
  };

  return res.status(200).json(cestas[index]);
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

export default router;