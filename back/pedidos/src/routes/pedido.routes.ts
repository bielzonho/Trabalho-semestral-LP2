import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { pedidos } from "../data/pedidos";
import { Pedido, StatusPedido, PedidoItem } from "../types/pedido";

const router = Router();

const statusValidos: StatusPedido[] = [
  "pendente",
  "confirmado",
  "em_preparacao",
  "saiu_para_entrega",
  "entregue",
  "cancelado"
];

router.get("/", (_req: Request, res: Response) => {
  return res.status(200).json(pedidos);
});

router.get("/:id", (req: Request, res: Response) => {
  const { id } = req.params;

  const pedido = pedidos.find((p) => p.id === id);

  if (!pedido) {
    return res.status(404).json({ mensagem: "Pedido não encontrado." });
  }

  return res.status(200).json(pedido);
});

router.get("/status/:status", (req: Request, res: Response) => {
  const { status } = req.params as { status: StatusPedido };

  const pedidosPorStatus = pedidos.filter((p) => p.status === status);

  return res.status(200).json(pedidosPorStatus);
});

router.post("/", (req: Request, res: Response) => {
  const { clienteNome, cestaId, valorTotal, observacoes, itens } = req.body;

  if (!clienteNome || valorTotal === undefined) {
    return res.status(400).json({
      mensagem: "Campos obrigatórios: clienteNome, valorTotal."
    });
  }

  const pedidoId = uuidv4();

  const novosPedidoItens: PedidoItem[] = itens
    ? itens.map((item: Omit<PedidoItem, "id" | "pedidoId" | "criadoEm">) => ({
        id: uuidv4(),
        pedidoId,
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
        criadoEm: new Date().toISOString()
      }))
    : [];

  const novoPedido: Pedido = {
    id: pedidoId,
    clienteNome,
    cestaId: cestaId || null,
    valorTotal,
    observacoes,
    status: "pendente",
    criadoEm: new Date().toISOString(),
    itens: novosPedidoItens
  };

  pedidos.push(novoPedido);

  return res.status(201).json(novoPedido);
});

router.put("/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const { clienteNome, cestaId, valorTotal, observacoes, itens } = req.body;

  const index = pedidos.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ mensagem: "Pedido não encontrado." });
  }

  const pedidoAtualizado: Pedido = {
    ...pedidos[index],
    clienteNome: clienteNome ?? pedidos[index].clienteNome,
    cestaId: cestaId !== undefined ? cestaId : pedidos[index].cestaId,
    valorTotal: valorTotal ?? pedidos[index].valorTotal,
    observacoes: observacoes ?? pedidos[index].observacoes,
    itens:
      itens && itens.length > 0
        ? itens.map((item: Omit<PedidoItem, "id" | "pedidoId" | "criadoEm">) => ({
            id: uuidv4(),
            pedidoId: id,
            produtoId: item.produtoId,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
            criadoEm: new Date().toISOString()
          }))
        : pedidos[index].itens
  };

  pedidos[index] = pedidoAtualizado;

  return res.status(200).json(pedidos[index]);
});

router.patch("/:id/status", (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body as { status: StatusPedido };

  const pedido = pedidos.find((p) => p.id === id);

  if (!pedido) {
    return res.status(404).json({ mensagem: "Pedido não encontrado." });
  }

  if (!status || !statusValidos.includes(status)) {
    return res.status(400).json({
      mensagem: `Status inválido. Use: ${statusValidos.join(", ")}.`
    });
  }

  pedido.status = status;

  return res.status(200).json(pedido);
});

router.post("/:id/itens", (req: Request, res: Response) => {
  const { id } = req.params;
  const { produtoId, quantidade, precoUnitario } = req.body;

  const pedido = pedidos.find((p) => p.id === id);

  if (!pedido) {
    return res.status(404).json({ mensagem: "Pedido não encontrado." });
  }

  if (!produtoId || quantidade === undefined || precoUnitario === undefined) {
    return res.status(400).json({
      mensagem:
        "Campos obrigatórios: produtoId, quantidade, precoUnitario."
    });
  }

  if (!pedido.itens) {
    pedido.itens = [];
  }

  const existente = pedido.itens.find((i) => i.produtoId === produtoId);

  if (existente) {
    existente.quantidade += quantidade;
  } else {
    pedido.itens.push({
      id: uuidv4(),
      pedidoId: id,
      produtoId,
      quantidade,
      precoUnitario,
      criadoEm: new Date().toISOString()
    });
  }

  // Recalcular valor total
  pedido.valorTotal = pedido.itens.reduce(
    (total, item) => total + item.quantidade * item.precoUnitario,
    0
  );

  return res.status(201).json(pedido);
});

router.delete("/:id", (req: Request, res: Response) => {
  const { id } = req.params;

  const index = pedidos.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ mensagem: "Pedido não encontrado." });
  }

  pedidos.splice(index, 1);

  return res.status(200).json({ mensagem: "Pedido removido com sucesso." });
});

router.delete("/:pedidoId/itens/:itemId", (req: Request, res: Response) => {
  const { pedidoId, itemId } = req.params;

  const pedido = pedidos.find((p) => p.id === pedidoId);

  if (!pedido || !pedido.itens) {
    return res.status(404).json({ mensagem: "Pedido não encontrado." });
  }

  const itemIndex = pedido.itens.findIndex((i) => i.id === itemId);

  if (itemIndex === -1) {
    return res.status(404).json({ mensagem: "Item não encontrado." });
  }

  pedido.itens.splice(itemIndex, 1);

  // Recalcular valor total
  pedido.valorTotal = pedido.itens.reduce(
    (total, item) => total + item.quantidade * item.precoUnitario,
    0
  );

  return res.status(200).json({ mensagem: "Item removido com sucesso." });
});

export default router;